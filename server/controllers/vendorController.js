const vendorService = require('../services/vendorService');

class VendorController {
  /**
   * GET /api/vendors
   */
  async getVendors(req, res, next) {
    try {
      const { page, limit, search, status, sortBy, sortOrder } = req.query;
      const result = await vendorService.getVendors({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
        status,
        sortBy,
        sortOrder
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
   * GET /api/vendors/:id
   */
  async getVendorById(req, res, next) {
    try {
      const vendor = await vendorService.getVendorById(req.params.id);
      return res.status(200).json({
        success: true,
        data: { vendor }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/vendors
   */
  async createVendor(req, res, next) {
    try {
      const newVendor = await vendorService.createVendor(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Vendor created successfully.',
        data: { vendor: newVendor }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/vendors/:id
   */
  async updateVendor(req, res, next) {
    try {
      const updatedVendor = await vendorService.updateVendor(req.params.id, req.body, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Vendor updated successfully.',
        data: { vendor: updatedVendor }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/vendors/:id
   */
  async deleteVendor(req, res, next) {
    try {
      await vendorService.deleteVendor(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Vendor deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VendorController();
