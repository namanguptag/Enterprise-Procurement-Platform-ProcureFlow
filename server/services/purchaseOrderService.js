const db = require('../config/db');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class PurchaseOrderService {
  /**
   * Fetch a paginated, filtered list of purchase orders.
   */
  async getPurchaseOrders({ page = 1, limit = 10, status = '', vendorId = '' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    if (status) {
      queryConditions.push('po.status = ?');
      params.push(status);
    }

    if (vendorId) {
      queryConditions.push('po.vendor_id = ?');
      params.push(vendorId);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM PurchaseOrders po
      ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    const dataQuery = `
      SELECT po.id, po.purchase_request_id, po.vendor_id, v.name as vendor_name,
             po.creator_id, u.username as creator_name, po.po_number, po.status,
             po.total_amount, po.expected_delivery_date, po.actual_delivery_date, po.created_at
      FROM PurchaseOrders po
      JOIN Vendors v ON po.vendor_id = v.id
      JOIN Users u ON po.creator_id = u.id
      ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [orders] = await db.execute(dataQuery, params);

    return {
      orders,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }

  /**
   * Retrieve a single purchase order with its associated line items and metadata.
   */
  async getPurchaseOrderById(id) {
    const poQuery = `
      SELECT po.id, po.purchase_request_id, pr.title as purchase_request_title,
             po.vendor_id, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone,
             po.creator_id, u.username as creator_name, po.po_number, po.status,
             po.total_amount, po.expected_delivery_date, po.actual_delivery_date, po.created_at
      FROM PurchaseOrders po
      JOIN Vendors v ON po.vendor_id = v.id
      JOIN Users u ON po.creator_id = u.id
      LEFT JOIN PurchaseRequests pr ON po.purchase_request_id = pr.id
      WHERE po.id = ?
    `;
    const [poRows] = await db.execute(poQuery, [id]);
    if (poRows.length === 0) {
      throw new AppError('Purchase Order not found.', 404);
    }
    const order = poRows[0];

    const itemsQuery = `
      SELECT poi.id, poi.product_id, p.name as product_name, p.sku, poi.quantity, poi.unit_price,
             (poi.quantity * poi.unit_price) as total_item_price
      FROM PurchaseOrderItems poi
      JOIN Products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
    `;
    const [items] = await db.execute(itemsQuery, [id]);
    order.items = items;

    return order;
  }

  /**
   * Generate a new Purchase Order from an approved Purchase Request.
   * Atomic operation linking request items, computing totals, and logging transitions.
   */
  async createPurchaseOrder(data, creatorId) {
    const { purchase_request_id, vendor_id, expected_delivery_date } = data;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Verify Purchase Request exists, is approved, and does not already have a PO
      const [prRows] = await connection.execute(
        'SELECT status, total_estimated_cost FROM PurchaseRequests WHERE id = ?',
        [purchase_request_id]
      );
      if (prRows.length === 0) {
        throw new AppError('Purchase Request not found.', 404);
      }
      const pr = prRows[0];

      if (pr.status !== 'approved') {
        throw new AppError(`Cannot generate Purchase Order. The purchase request must be "approved" (current status is "${pr.status}").`, 400);
      }

      const [existingPo] = await connection.execute(
        'SELECT id FROM PurchaseOrders WHERE purchase_request_id = ?',
        [purchase_request_id]
      );
      if (existingPo.length > 0) {
        throw new AppError('A Purchase Order has already been generated for this purchase request.', 400);
      }

      // 2. Verify Vendor exists and is active
      const [vendorRows] = await connection.execute(
        'SELECT status FROM Vendors WHERE id = ?',
        [vendor_id]
      );
      if (vendorRows.length === 0) {
        throw new AppError('Selected vendor does not exist.', 400);
      }
      if (vendorRows[0].status !== 'active') {
        throw new AppError('Selected vendor is inactive.', 400);
      }

      // 3. Generate Sequential PO Number
      const [countRows] = await connection.execute('SELECT COUNT(*) as count FROM PurchaseOrders');
      const year = new Date().getFullYear();
      const nextSequence = countRows[0].count + 1;
      const poNumber = `PO-${year}-${String(nextSequence).padStart(4, '0')}`;

      // 4. Retrieve PR Items to copy into PO Items
      const [prItems] = await connection.execute(
        'SELECT product_id, quantity, estimated_unit_price FROM PurchaseRequestItems WHERE purchase_request_id = ?',
        [purchase_request_id]
      );

      if (prItems.length === 0) {
        throw new AppError('The associated purchase request contains no items.', 400);
      }

      // 5. Insert PO Header
      const poInsertQuery = `
        INSERT INTO PurchaseOrders (purchase_request_id, vendor_id, creator_id, po_number, status, total_amount, expected_delivery_date)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `;
      const [poResult] = await connection.execute(poInsertQuery, [
        purchase_request_id,
        vendor_id,
        creatorId,
        poNumber,
        pr.total_estimated_cost,
        expected_delivery_date || null
      ]);
      const poId = poResult.insertId;

      // 6. Copy items to PurchaseOrderItems
      const itemInsertQuery = `
        INSERT INTO PurchaseOrderItems (purchase_order_id, product_id, quantity, unit_price)
        VALUES (?, ?, ?, ?)
      `;
      for (const item of prItems) {
        await connection.execute(itemInsertQuery, [
          poId,
          item.product_id,
          item.quantity,
          item.estimated_unit_price
        ]);
      }

      await connection.commit();

      const newPo = await this.getPurchaseOrderById(poId);

      // Write administrative Audit Log
      await auditService.log(creatorId, 'PURCHASE_ORDER_GENERATED', 'Purchase Orders', null, { po_id: poId, po_number: poNumber });

      return newPo;

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Update the status of a Purchase Order.
   * If status transitions to 'delivered', automatically updates physical stock inventory.
   */
  async updatePOStatus(id, status, userId) {
    const allowedTransitions = ['approved', 'ordered', 'delivered', 'cancelled'];
    if (!allowedTransitions.includes(status)) {
      throw new AppError('Invalid status update. Choose approved, ordered, delivered, or cancelled.', 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch current PO details
      const [poRows] = await connection.execute(
        'SELECT status, po_number, purchase_request_id FROM PurchaseOrders WHERE id = ?',
        [id]
      );
      if (poRows.length === 0) {
        throw new AppError('Purchase Order not found.', 404);
      }
      const order = poRows[0];

      if (order.status === 'delivered') {
        throw new AppError('Cannot update status. This Purchase Order is already marked as "delivered".', 400);
      }
      if (order.status === 'cancelled') {
        throw new AppError('Cannot update status. This Purchase Order has been cancelled.', 400);
      }

      // 2. Handle 'delivered' logic: Receive stock into Inventory and Products tables
      let actualDeliveryDate = null;
      if (status === 'delivered') {
        actualDeliveryDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Retrieve PO items
        const [items] = await connection.execute(
          'SELECT product_id, quantity FROM PurchaseOrderItems WHERE purchase_order_id = ?',
          [id]
        );

        for (const item of items) {
          // Increment stock in Inventory table
          await connection.execute(
            'UPDATE Inventory SET current_stock = current_stock + ? WHERE product_id = ?',
            [item.quantity, item.product_id]
          );

          // Synchronize stock quantity in Products table
          await connection.execute(
            'UPDATE Products SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Log inbound inventory transaction
          await connection.execute(
            `INSERT INTO InventoryTransactions (product_id, user_id, transaction_type, quantity, reference_id, reference_type, notes)
             VALUES (?, ?, 'inbound', ?, ?, 'purchase_order', ?)`,
            [item.product_id, userId, item.quantity, id, `Delivered via PO: ${order.po_number}`]
          );
        }
      }

      // 3. Update PO Header
      const updateQuery = `
        UPDATE PurchaseOrders
        SET status = ?, actual_delivery_date = ?
        WHERE id = ?
      `;
      await connection.execute(updateQuery, [status, actualDeliveryDate, id]);

      // 4. Create Notification
      const message = `Purchase Order ${order.po_number} status updated to: ${status.toUpperCase()}.`;
      // Query creator ID
      const [creatorRow] = await connection.execute('SELECT creator_id FROM PurchaseOrders WHERE id = ?', [id]);
      if (creatorRow.length > 0) {
        await connection.execute(
          'INSERT INTO Notifications (user_id, message, is_read) VALUES (?, ?, 0)',
          [creatorRow[0].creator_id, message]
        );
      }

      await connection.commit();

      // Write administrative Audit Log
      await auditService.log(userId, 'PURCHASE_ORDER_STATUS_CHANGED', 'Purchase Orders',
        { po_id: id, status: order.status },
        { po_id: id, status, actual_delivery_date: actualDeliveryDate }
      );

      return {
        id,
        status,
        actualDeliveryDate
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PurchaseOrderService();
