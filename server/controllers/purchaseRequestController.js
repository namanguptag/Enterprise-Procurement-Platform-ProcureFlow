const purchaseRequestService = require('../services/purchaseRequestService');

class PurchaseRequestController {
  /**
   * GET /api/purchase-requests
   */
  async getPurchaseRequests(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await purchaseRequestService.getPurchaseRequests({
        userId: req.user.id,
        role: req.user.role,
        status,
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
   * GET /api/purchase-requests/:id
   */
  async getPurchaseRequestById(req, res, next) {
    try {
      const request = await purchaseRequestService.getPurchaseRequestById(req.params.id);

      // Security check: Employee can only view their own requests
      if (req.user.role === 'Employee' && request.requester_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this purchase request.'
        });
      }

      return res.status(200).json({
        success: true,
        data: { request }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/purchase-requests
   */
  async createPurchaseRequest(req, res, next) {
    try {
      const newRequest = await purchaseRequestService.createPurchaseRequest(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Purchase request submitted successfully.',
        data: { request: newRequest }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/purchase-requests/:id/review
   */
  async reviewPurchaseRequest(req, res, next) {
    try {
      const result = await purchaseRequestService.reviewPurchaseRequest(
        req.params.id,
        req.body,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: `Purchase request has been successfully ${result.status}.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PurchaseRequestController();
