const purchaseOrderService = require('../services/purchaseOrderService');

class PurchaseOrderController {
  /**
   * GET /api/purchase-orders
   */
  async getPurchaseOrders(req, res, next) {
    try {
      const { status, vendorId, page, limit } = req.query;
      const result = await purchaseOrderService.getPurchaseOrders({
        status,
        vendorId,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/purchase-orders/:id
   */
  async getPurchaseOrderById(req, res, next) {
    try {
      const order = await purchaseOrderService.getPurchaseOrderById(req.params.id);
      return res.status(200).json({
        success: true,
        data: { order }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/purchase-orders
   */
  async createPurchaseOrder(req, res, next) {
    try {
      const newPo = await purchaseOrderService.createPurchaseOrder(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Purchase order generated successfully.',
        data: { order: newPo }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/purchase-orders/:id/status
   */
  async updatePOStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await purchaseOrderService.updatePOStatus(
        req.params.id,
        status,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: `Purchase Order status updated to "${status}".`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PurchaseOrderController();
