const db = require('../config/db');

class AnalyticsService {
  /**
   * Aggregate and fetch all metrics and charts data for the dashboard.
   */
  async getDashboardSummary() {
    // 1. Total Metrics
    const metricsQueries = {
      totalVendors: 'SELECT COUNT(*) as count FROM Vendors',
      activeVendors: "SELECT COUNT(*) as count FROM Vendors WHERE status = 'active'",
      totalProducts: 'SELECT COUNT(*) as count FROM Products',
      inventoryValue: 'SELECT SUM(i.current_stock * p.price) as count FROM Inventory i JOIN Products p ON i.product_id = p.id',
      pendingRequests: "SELECT COUNT(*) as count FROM PurchaseRequests WHERE status = 'pending'",
      pendingOrders: "SELECT COUNT(*) as count FROM PurchaseOrders WHERE status = 'pending'",
      lowStockAlerts: 'SELECT COUNT(*) as count FROM Inventory i JOIN Products p ON i.product_id = p.id WHERE i.current_stock <= p.reorder_level'
    };

    const metrics = {};
    for (const [key, sql] of Object.entries(metricsQueries)) {
      const [rows] = await db.execute(sql);
      metrics[key] = parseFloat(rows[0].count || 0);
    }

    // 2. Monthly Procurement Spend (delivered POs, last 6 months)
    const monthlySpendQuery = `
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             SUM(total_amount) as amount
      FROM PurchaseOrders
      WHERE status = 'delivered'
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `;
    const [monthlySpend] = await db.execute(monthlySpendQuery);

    // 3. Top Purchased Products (by quantity delivered)
    const topProductsQuery = `
      SELECT p.name, p.sku, SUM(poi.quantity) as quantity, SUM(poi.quantity * poi.unit_price) as spend
      FROM PurchaseOrderItems poi
      JOIN Products p ON poi.product_id = p.id
      JOIN PurchaseOrders po ON poi.purchase_order_id = po.id
      WHERE po.status = 'delivered'
      GROUP BY p.id, p.name, p.sku
      ORDER BY quantity DESC
      LIMIT 5
    `;
    const [topProducts] = await db.execute(topProductsQuery);

    // 4. Vendor Performance Metrics
    const vendorPerformanceQuery = `
      SELECT v.name as vendor_name, v.company, v.rating,
             COUNT(po.id) as orders_completed,
             IFNULL(SUM(po.total_amount), 0) as total_order_value
      FROM Vendors v
      LEFT JOIN PurchaseOrders po ON v.id = po.vendor_id AND po.status = 'delivered'
      GROUP BY v.id, v.name, v.company, v.rating
      ORDER BY v.rating DESC, orders_completed DESC
      LIMIT 5
    `;
    const [vendorPerformance] = await db.execute(vendorPerformanceQuery);

    // 5. Recent System Activities (from AuditLogs)
    const recentActivitiesQuery = `
      SELECT al.id, COALESCE(u.username, 'System') as username, al.action, al.module, al.timestamp
      FROM AuditLogs al
      LEFT JOIN Users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 8
    `;
    const [recentActivities] = await db.execute(recentActivitiesQuery);

    // 6. Warehouse Stock Value by Category
    const categoryStockQuery = `
      SELECT c.name as category_name, IFNULL(SUM(i.current_stock * p.price), 0) as stock_value
      FROM Categories c
      LEFT JOIN Products p ON p.category_id = c.id
      LEFT JOIN Inventory i ON i.product_id = p.id
      GROUP BY c.id, c.name
      ORDER BY stock_value DESC
    `;
    const [categoryStock] = await db.execute(categoryStockQuery);

    // 7. Purchase Order Status Split
    const poStatusSplitQuery = `
      SELECT status, COUNT(*) as count
      FROM PurchaseOrders
      GROUP BY status
    `;
    const [poStatusSplit] = await db.execute(poStatusSplitQuery);

    return {
      metrics,
      monthlySpend,
      topProducts,
      vendorPerformance,
      recentActivities,
      categoryStock,
      poStatusSplit
    };
  }
}

module.exports = new AnalyticsService();
