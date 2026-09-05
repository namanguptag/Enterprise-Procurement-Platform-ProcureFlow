const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  /**
   * GET /api/analytics
   */
  async getDashboardSummary(req, res, next) {
    try {
      const summary = await analyticsService.getDashboardSummary();
      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
