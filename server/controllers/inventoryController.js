const inventoryService = require('../services/inventoryService');

class InventoryController {
  /**
   * GET /api/inventory
   */
  async getInventory(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await inventoryService.getInventory({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search
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
   * PUT /api/inventory/adjust
   */
  async adjustStock(req, res, next) {
    try {
      const { product_id, quantity, notes } = req.body;
      const result = await inventoryService.adjustStock(
        parseInt(product_id, 10),
        parseInt(quantity, 10),
        notes,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/inventory/alerts
   */
  async getLowStockAlerts(req, res, next) {
    try {
      const alerts = await inventoryService.getLowStockAlerts();
      return res.status(200).json({
        success: true,
        data: { alerts }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/inventory/history
   * GET /api/inventory/history/:productId
   */
  async getInventoryHistory(req, res, next) {
    try {
      const productId = req.params.productId ? parseInt(req.params.productId, 10) : null;
      const { page, limit } = req.query;

      const result = await inventoryService.getInventoryHistory(productId, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
