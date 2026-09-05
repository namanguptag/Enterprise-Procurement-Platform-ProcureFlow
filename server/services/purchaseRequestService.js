const db = require('../config/db');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class PurchaseRequestService {
  /**
   * Fetch paginated list of purchase requests, scoped by role and user context.
   */
  async getPurchaseRequests({ userId, role, status = '', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    // Scoping request list: Employees can only view their own requests
    if (role === 'Employee') {
      queryConditions.push('pr.requester_id = ?');
      params.push(userId);
    }

    // Status filter
    if (status) {
      queryConditions.push('pr.status = ?');
      params.push(status);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM PurchaseRequests pr
      ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    const dataQuery = `
      SELECT pr.id, pr.requester_id, u.username as requester_name, pr.title, pr.justification,
             pr.status, pr.total_estimated_cost, pr.created_at, pr.updated_at
      FROM PurchaseRequests pr
      JOIN Users u ON pr.requester_id = u.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [requests] = await db.execute(dataQuery, params);

    return {
      requests,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }

  /**
   * Retrieve details of a single purchase request, including its list items and review history.
   */
  async getPurchaseRequestById(id) {
    // 1. Fetch header
    const prQuery = `
      SELECT pr.id, pr.requester_id, u.username as requester_name, pr.title, pr.justification,
             pr.status, pr.total_estimated_cost, pr.created_at, pr.updated_at
      FROM PurchaseRequests pr
      JOIN Users u ON pr.requester_id = u.id
      WHERE pr.id = ?
    `;
    const [prRows] = await db.execute(prQuery, [id]);
    if (prRows.length === 0) {
      throw new AppError('Purchase Request not found.', 404);
    }
    const request = prRows[0];

    // 2. Fetch items
    const itemsQuery = `
      SELECT pri.id, pri.product_id, p.name as product_name, p.sku, pri.quantity, pri.estimated_unit_price,
             (pri.quantity * pri.estimated_unit_price) as total_item_price
      FROM PurchaseRequestItems pri
      JOIN Products p ON pri.product_id = p.id
      WHERE pri.purchase_request_id = ?
    `;
    const [items] = await db.execute(itemsQuery, [id]);
    request.items = items;

    // 3. Fetch approval review notes
    const approvalsQuery = `
      SELECT a.id, a.approver_id, u.username as approver_name, a.status, a.comments, a.created_at
      FROM Approvals a
      JOIN Users u ON a.approver_id = u.id
      WHERE a.purchase_request_id = ?
      ORDER BY a.created_at DESC
    `;
    const [approvals] = await db.execute(approvalsQuery, [id]);
    request.approvals = approvals;

    return request;
  }

  /**
   * Submit a new purchase request with items.
   * Runs in a transaction to guarantee atomic header and item creation.
   */
  async createPurchaseRequest(requestData, requesterId) {
    const { title, justification, items } = requestData;

    if (!items || items.length === 0) {
      throw new AppError('A purchase request must contain at least one item.', 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Double check products exist and compute actual estimate price sum
      let calculatedTotal = 0;
      const checkedItems = [];

      for (const item of items) {
        const [prodRows] = await connection.execute(
          'SELECT price FROM Products WHERE id = ?',
          [item.product_id]
        );
        if (prodRows.length === 0) {
          throw new AppError(`Product with ID ${item.product_id} does not exist.`, 400);
        }
        const unitPrice = parseFloat(prodRows[0].price);
        const itemQty = parseInt(item.quantity, 10);
        calculatedTotal += unitPrice * itemQty;
        checkedItems.push({
          productId: item.product_id,
          quantity: itemQty,
          unitPrice
        });
      }

      // 2. Insert Header
      const headerQuery = `
        INSERT INTO PurchaseRequests (requester_id, title, justification, status, total_estimated_cost)
        VALUES (?, ?, ?, 'pending', ?)
      `;
      const [headerResult] = await connection.execute(headerQuery, [
        requesterId,
        title,
        justification || null,
        calculatedTotal
      ]);
      const prId = headerResult.insertId;

      // 3. Insert Items
      const itemInsertQuery = `
        INSERT INTO PurchaseRequestItems (purchase_request_id, product_id, quantity, estimated_unit_price)
        VALUES (?, ?, ?, ?)
      `;
      for (const item of checkedItems) {
        await connection.execute(itemInsertQuery, [prId, item.productId, item.quantity, item.unitPrice]);
      }

      await connection.commit();

      const newRequest = await this.getPurchaseRequestById(prId);

      // Audit Log
      await auditService.log(requesterId, 'PURCHASE_REQUEST_CREATED', 'Purchase Requests', null, { pr_id: prId, total: calculatedTotal });

      return newRequest;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Review (Approve or Reject) a pending purchase request.
   * Runs in a transaction to update status, register approvals, and generate notification logs.
   */
  async reviewPurchaseRequest(id, reviewData, approverId) {
    const { status, comments } = reviewData;

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid approval status. Must be approved or rejected.', 400);
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch request details and check status
      const [prRows] = await connection.execute(
        'SELECT status, title, requester_id, total_estimated_cost FROM PurchaseRequests WHERE id = ?',
        [id]
      );
      if (prRows.length === 0) {
        throw new AppError('Purchase Request not found.', 404);
      }
      const request = prRows[0];

      if (request.status !== 'pending') {
        throw new AppError(`Cannot review this request. It is already in "${request.status}" status.`, 400);
      }

      // 2. Update Request Status
      await connection.execute(
        'UPDATE PurchaseRequests SET status = ? WHERE id = ?',
        [status, id]
      );

      // 3. Insert Approval Record
      const approvalQuery = `
        INSERT INTO Approvals (purchase_request_id, purchase_order_id, approver_id, status, comments)
        VALUES (?, NULL, ?, ?, ?)
      `;
      await connection.execute(approvalQuery, [id, approverId, status, comments || null]);

      // 4. Create Notification for Requester
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      const notificationMsg = `Your Purchase Request "${request.title}" was ${statusLabel} by the manager.`;
      await connection.execute(
        'INSERT INTO Notifications (user_id, message, is_read) VALUES (?, ?, 0)',
        [request.requester_id, notificationMsg]
      );

      await connection.commit();

      // Write administrative Audit Log
      await auditService.log(approverId, `PURCHASE_REQUEST_${status.toUpperCase()}`, 'Purchase Requests',
        { pr_id: id, status: 'pending' },
        { pr_id: id, status, comments }
      );

      return {
        id,
        status,
        comments
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PurchaseRequestService();
