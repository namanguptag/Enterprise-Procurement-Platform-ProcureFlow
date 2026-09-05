const db = require('../config/db');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class VendorService {
  /**
   * Fetch a paginated, filtered, and sorted list of vendors.
   */
  async getVendors({ page = 1, limit = 10, search = '', status = '', sortBy = 'name', sortOrder = 'ASC' }) {
    const offset = (page - 1) * limit;
    const params = [];
    let queryConditions = [];

    // Search filter across name, company, gst, and email
    if (search) {
      queryConditions.push('(name LIKE ? OR company LIKE ? OR gst_number LIKE ? OR email LIKE ?)');
      const wildCardSearch = `%${search}%`;
      params.push(wildCardSearch, wildCardSearch, wildCardSearch, wildCardSearch);
    }

    // Status filter
    if (status) {
      queryConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Sanitize sort columns to avoid SQL Injection
    const allowedSortCols = ['id', 'name', 'company', 'gst_number', 'email', 'rating', 'status', 'created_at'];
    if (!allowedSortCols.includes(sortBy)) {
      sortBy = 'name';
    }
    const cleanSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Count query for pagination meta
    const countQuery = `SELECT COUNT(*) as total FROM Vendors ${whereClause}`;
    const [countRows] = await db.execute(countQuery, params);
    const totalRecords = countRows[0].total;

    // Data query
    const dataQuery = `
      SELECT id, name, company, gst_number, email, phone, address, rating, status, created_at, updated_at
      FROM Vendors
      ${whereClause}
      ORDER BY ${sortBy} ${cleanSortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [vendors] = await db.execute(dataQuery, params);

    return {
      vendors,
      pagination: {
        total: totalRecords,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(totalRecords / limit)
      }
    };
  }

  /**
   * Retrieve a single vendor by ID.
   */
  async getVendorById(id) {
    const [rows] = await db.execute('SELECT * FROM Vendors WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new AppError('Vendor not found.', 404);
    }
    return rows[0];
  }

  /**
   * Create a new vendor record.
   */
  async createVendor(vendorData, userId) {
    const { name, company, gst_number, email, phone, address, rating = 5.00, status = 'active' } = vendorData;

    const query = `
      INSERT INTO Vendors (name, company, gst_number, email, phone, address, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [name, company, gst_number, email, phone || null, address || null, rating, status]);
    const vendorId = result.insertId;

    const newVendor = await this.getVendorById(vendorId);

    // Write audit log
    await auditService.log(userId, 'VENDOR_CREATED', 'Vendors', null, newVendor);

    return newVendor;
  }

  /**
   * Update an existing vendor.
   */
  async updateVendor(id, vendorData, userId) {
    const oldVendor = await this.getVendorById(id);

    const { name, company, gst_number, email, phone, address, rating, status } = vendorData;

    const query = `
      UPDATE Vendors
      SET name = ?, company = ?, gst_number = ?, email = ?, phone = ?, address = ?, rating = ?, status = ?
      WHERE id = ?
    `;
    await db.execute(query, [
      name || oldVendor.name,
      company || oldVendor.company,
      gst_number || oldVendor.gst_number,
      email || oldVendor.email,
      phone !== undefined ? phone : oldVendor.phone,
      address !== undefined ? address : oldVendor.address,
      rating !== undefined ? rating : oldVendor.rating,
      status || oldVendor.status,
      id
    ]);

    const updatedVendor = await this.getVendorById(id);

    // Write audit log
    await auditService.log(userId, 'VENDOR_UPDATED', 'Vendors', oldVendor, updatedVendor);

    return updatedVendor;
  }

  /**
   * Delete a vendor.
   */
  async deleteVendor(id, userId) {
    const vendor = await this.getVendorById(id);

    // Execute delete
    await db.execute('DELETE FROM Vendors WHERE id = ?', [id]);

    // Write audit log
    await auditService.log(userId, 'VENDOR_DELETED', 'Vendors', vendor, null);

    return { id };
  }
}

module.exports = new VendorService();
