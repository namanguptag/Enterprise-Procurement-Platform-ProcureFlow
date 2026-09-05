const productService = require('../services/productService');

class ProductController {
  /**
   * GET /api/products
   */
  async getProducts(req, res, next) {
    try {
      const { page, limit, search, categoryId, vendorId, sortBy, sortOrder } = req.query;
      const result = await productService.getProducts({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
        categoryId,
        vendorId,
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
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return res.status(200).json({
        success: true,
        data: { product }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/products
   */
  async createProduct(req, res, next) {
    try {
      const newProduct = await productService.createProduct(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Product created successfully and inventory initialized.',
        data: { product: newProduct }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const updatedProduct = await productService.updateProduct(req.params.id, req.body, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: { product: updatedProduct }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return res.status(200).json({
        success: true,
        data: { categories }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/categories
   */
  async createCategory(req, res, next) {
    try {
      const newCategory = await productService.createCategory(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: { category: newCategory }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
