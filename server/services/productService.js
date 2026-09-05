const db = require('../config/db');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class ProductService {
  /**
   * Fetch a list of products with search, pagination, sorting, and filters (category, vendor).
   */
  async getProducts({ page = 1, limit = 10, search = '', categoryId = '', vendorId = '', sortBy = 'name', sortOrder = 'ASC' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    // Search filter: matches name or sku
    if (search) {
      queryConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      const wildCardSearch = `%${search}%`;
      params.push(wildCardSearch, wildCardSearch);
    }

    // Category filter
    if (categoryId) {
      queryConditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    // Vendor filter
    if (vendorId) {
      queryConditions.push('p.vendor_id = ?');
      params.push(vendorId);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Sanitize sort columns
    const allowedSortCols = ['id', 'name', 'sku', 'price', 'quantity', 'reorder_level', 'category_name', 'vendor_name', 'created_at'];
    if (!allowedSortCols.includes(sortBy)) {
      sortBy = 'name';
    }
    const cleanSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Map sorted column names to match alias / qualified names
    let sortedCol = `p.${sortBy}`;
    if (sortBy === 'category_name') sortedCol = 'c.name';
    if (sortBy === 'vendor_name') sortedCol = 'v.name';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      LEFT JOIN Vendors v ON p.vendor_id = v.id
      ${whereClause}
    `;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    // Data query joining Category and Vendor
    const dataQuery = `
      SELECT p.id, p.name, p.sku, p.category_id, p.vendor_id, p.price, p.quantity, p.reorder_level, p.created_at,
             c.name as category_name, v.name as vendor_name
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      LEFT JOIN Vendors v ON p.vendor_id = v.id
      ${whereClause}
      ORDER BY ${sortedCol} ${cleanSortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [products] = await db.execute(dataQuery, params);

    return {
      products,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }

  /**
   * Retrieve a product by ID.
   */
  async getProductById(id) {
    const query = `
      SELECT p.id, p.name, p.sku, p.category_id, p.vendor_id, p.price, p.quantity, p.reorder_level, p.created_at,
             c.name as category_name, v.name as vendor_name
      FROM Products p
      LEFT JOIN Categories c ON p.category_id = c.id
      LEFT JOIN Vendors v ON p.vendor_id = v.id
      WHERE p.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (rows.length === 0) {
      throw new AppError('Product not found.', 404);
    }
    return rows[0];
  }

  /**
   * Create a new product.
   * Runs in a transaction to automatically register a 1-to-1 matching Inventory record.
   */
  async createProduct(productData, userId) {
    const { name, sku, category_id, vendor_id, price, quantity = 0, reorder_level = 10 } = productData;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert product
      const productQuery = `
        INSERT INTO Products (name, sku, category_id, vendor_id, price, quantity, reorder_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const [productResult] = await connection.execute(productQuery, [
        name,
        sku.toUpperCase(),
        category_id,
        vendor_id || null,
        price,
        quantity,
        reorder_level
      ]);
      const productId = productResult.insertId;

      // 2. Provision inventory record automatically
      const inventoryQuery = `
        INSERT INTO Inventory (product_id, current_stock, incoming_stock, outgoing_stock)
        VALUES (?, ?, 0, 0)
      `;
      await connection.execute(inventoryQuery, [productId, quantity]);

      await connection.commit();

      const newProduct = await this.getProductById(productId);

      // Audit Log entry
      await auditService.log(userId, 'PRODUCT_CREATED', 'Products', null, newProduct);

      return newProduct;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Update a product catalog entry.
   */
  async updateProduct(id, productData, userId) {
    const oldProduct = await this.getProductById(id);

    const { name, sku, category_id, vendor_id, price, quantity, reorder_level } = productData;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const updateQuery = `
        UPDATE Products
        SET name = ?, sku = ?, category_id = ?, vendor_id = ?, price = ?, quantity = ?, reorder_level = ?
        WHERE id = ?
      `;
      await connection.execute(updateQuery, [
        name || oldProduct.name,
        sku ? sku.toUpperCase() : oldProduct.sku,
        category_id || oldProduct.category_id,
        vendor_id !== undefined ? vendor_id : oldProduct.vendor_id,
        price !== undefined ? price : oldProduct.price,
        quantity !== undefined ? quantity : oldProduct.quantity,
        reorder_level !== undefined ? reorder_level : oldProduct.reorder_level,
        id
      ]);

      // If quantity is updated, synchronize the Inventory table current_stock value too
      if (quantity !== undefined && quantity !== oldProduct.quantity) {
        const updateInvQuery = `UPDATE Inventory SET current_stock = ? WHERE product_id = ?`;
        await connection.execute(updateInvQuery, [quantity, id]);
      }

      await connection.commit();

      const updatedProduct = await this.getProductById(id);

      // Audit log entry
      await auditService.log(userId, 'PRODUCT_UPDATED', 'Products', oldProduct, updatedProduct);

      return updatedProduct;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete a product.
   */
  async deleteProduct(id, userId) {
    const product = await this.getProductById(id);

    // Delete triggers CASCADE delete on Inventory, but lets check referencing PR items or PO items in database
    await db.execute('DELETE FROM Products WHERE id = ?', [id]);

    // Audit log entry
    await auditService.log(userId, 'PRODUCT_DELETED', 'Products', product, null);

    return { id };
  }

  /**
   * Fetch all product categories.
   */
  async getCategories() {
    const [rows] = await db.execute('SELECT * FROM Categories ORDER BY name ASC');
    return rows;
  }

  /**
   * Create a new category.
   */
  async createCategory(categoryData, userId) {
    const { name, description } = categoryData;
    const [result] = await db.execute(
      'INSERT INTO Categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    const [rows] = await db.execute('SELECT * FROM Categories WHERE id = ?', [result.insertId]);
    
    // Audit Log entry
    await auditService.log(userId, 'CATEGORY_CREATED', 'Products', null, rows[0]);

    return rows[0];
  }
}

module.exports = new ProductService();
