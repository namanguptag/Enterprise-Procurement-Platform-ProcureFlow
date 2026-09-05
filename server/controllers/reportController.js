const db = require('../config/db');
const purchaseOrderService = require('../services/purchaseOrderService');
const pdfGenerator = require('../utils/pdfGenerator');
const excelGenerator = require('../utils/excelGenerator');
const AppError = require('../utils/appError');

class ReportController {
  /**
   * GET /api/reports/pdf/purchase-order/:id
   */
  async exportPurchaseOrderPdf(req, res, next) {
    try {
      const orderId = req.params.id;
      const order = await purchaseOrderService.getPurchaseOrderById(orderId);

      // Set PDF header metadata
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=ProcureFlow_PO_${order.po_number}.pdf`);

      pdfGenerator.generatePurchaseOrderPdf(res, order);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/excel/inventory
   */
  async exportInventoryExcel(req, res, next) {
    try {
      const query = `
        SELECT i.product_id, p.name as product_name, p.sku, c.name as category_name,
               i.current_stock, i.incoming_stock, i.outgoing_stock
        FROM Inventory i
        JOIN Products p ON i.product_id = p.id
        LEFT JOIN Categories c ON p.category_id = c.id
        ORDER BY p.name ASC
      `;
      const [rows] = await db.execute(query);

      await excelGenerator.generateInventoryExcel(res, rows);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/excel/vendors
   */
  async exportVendorExcel(req, res, next) {
    try {
      const query = `
        SELECT id, name, company, gst_number, email, phone, status
        FROM Vendors
        ORDER BY name ASC
      `;
      const [rows] = await db.execute(query);

      await excelGenerator.generateVendorExcel(res, rows);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
