const db = require('../config/db');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class InventoryService {
  /**
   * Get current inventory status (joining Products, Categories, and Inventory tables).
   */
  async getInventory({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    if (search) {
      queryConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const wildCard = `%${search}%`;
      params.push(wildCard, wildCard);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM Inventory i
      JOIN Products p ON i.product_id = p.id
      ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    const dataQuery = `
      SELECT i.id, i.product_id, p.name as product_name, p.sku, p.reorder_level,
             c.name as category_name, i.current_stock, i.incoming_stock, i.outgoing_stock, i.last_updated
      FROM Inventory i
      JOIN Products p ON i.product_id = p.id
      LEFT JOIN Categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [inventory] = await db.execute(dataQuery, params);

    return {
      inventory,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }

  /**
   * Perform manual inventory adjustments (addition, subtraction, audit corrections).
   * Executes inside a database transaction to keep Products and Inventory tables synchronized.
   */
  async adjustStock(productId, adjustmentQty, notes, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch current status
      const [prodRows] = await connection.execute(
        'SELECT price, reorder_level, name FROM Products WHERE id = ?',
        [productId]
      );
      if (prodRows.length === 0) {
        throw new AppError('Product not found.', 404);
      }
      const product = prodRows[0];

      const [invRows] = await connection.execute(
        'SELECT current_stock, incoming_stock, outgoing_stock FROM Inventory WHERE product_id = ?',
        [productId]
      );
      if (invRows.length === 0) {
        throw new AppError('Inventory record not found for this product.', 404);
      }
      const inventory = invRows[0];

      const newStock = inventory.current_stock + adjustmentQty;
      if (newStock < 0) {
        throw new AppError(`Insufficient stock. Cannot adjust by ${adjustmentQty} as current stock is ${inventory.current_stock}.`, 400);
      }

      // 2. Update Inventory Table
      await connection.execute(
        'UPDATE Inventory SET current_stock = ? WHERE product_id = ?',
        [newStock, productId]
      );

      // 3. Sync Products Table
      await connection.execute(
        'UPDATE Products SET quantity = ? WHERE id = ?',
        [newStock, productId]
      );

      // 4. Log Inventory Transaction
      await connection.execute(
        `INSERT INTO InventoryTransactions (product_id, user_id, transaction_type, quantity, reference_id, reference_type, notes)
         VALUES (?, ?, 'adjustment', ?, NULL, 'manual_adjustment', ?)`,
        [productId, userId, adjustmentQty, notes || 'Manual stock adjustment']
      );

      // 5. Trigger Low Stock Notification if necessary
      if (newStock <= product.reorder_level) {
        const message = `Inventory Alert: "${product.name}" stock is at ${newStock}, which is at or below the reorder level of ${product.reorder_level}.`;
        
        // Check if there is already an unread identical notification to avoid duplicates
        const [notifCheck] = await connection.execute(
          'SELECT id FROM Notifications WHERE user_id = ? AND message = ? AND is_read = 0',
          [userId, message]
        );
        if (notifCheck.length === 0) {
          await connection.execute(
            'INSERT INTO Notifications (user_id, message, is_read) VALUES (?, ?, 0)',
            [userId, message]
          );
        }
      }

      await connection.commit();

      // Write administrative Audit Log
      await auditService.log(userId, 'INVENTORY_ADJUSTED', 'Inventory', 
        { product_id: productId, stock: inventory.current_stock },
        { product_id: productId, stock: newStock, change: adjustmentQty }
      );

      return {
        productId,
        productName: product.name,
        previousStock: inventory.current_stock,
        currentStock: newStock,
        adjustment: adjustmentQty
      };

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Retrieve low stock alerts (current_stock <= reorder_level).
   */
  async getLowStockAlerts() {
    const query = `
      SELECT p.id as product_id, p.name as product_name, p.sku, p.reorder_level, i.current_stock
      FROM Products p
      JOIN Inventory i ON p.id = i.product_id
      WHERE i.current_stock <= p.reorder_level
      ORDER BY i.current_stock ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  /**
   * Retrieve historical inventory transaction logs.
   */
  async getInventoryHistory(productId = null, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    if (productId) {
      queryConditions.push('it.product_id = ?');
      params.push(productId);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM InventoryTransactions it
      ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    const dataQuery = `
      SELECT it.id, it.product_id, p.name as product_name, p.sku,
             u.username, it.transaction_type, it.quantity, it.reference_id, it.reference_type, it.notes, it.created_at
      FROM InventoryTransactions it
      JOIN Products p ON it.product_id = p.id
      JOIN Users u ON it.user_id = u.id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [transactions] = await db.execute(dataQuery, params);

    return {
      transactions,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }
}

module.exports = new InventoryService();
