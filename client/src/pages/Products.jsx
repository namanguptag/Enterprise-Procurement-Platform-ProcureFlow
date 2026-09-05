import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Plus, Edit2, Search, ArrowUpDown, X } from 'lucide-react';

const Products = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modal Dialog Form state
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    vendor_id: '',
    price: 0.00,
    reorder_level: 10,
    quantity: 0 // Used only on Create mode to initialize stock
  });

  const [saving, setSaving] = useState(false);

  const fetchDropdowns = useCallback(async () => {
    try {
      const catRes = await api.get('/products/categories/all');
      setCategories(catRes.data.data.categories);

      const vendRes = await api.get('/vendors', { params: { limit: 100 } });
      setVendors(vendRes.data.data.vendors);
    } catch (err) {
      console.warn('Could not populate dropdown choices:', err.message);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { search, categoryId, vendorId, sortBy, sortOrder, page, limit: 10 }
      });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load products list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, vendorId, sortBy, sortOrder, page, showToast]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const openCreateModal = () => {
    setFormMode('create');
    setFormData({
      name: '',
      sku: '',
      category_id: categories[0]?.id || '',
      vendor_id: vendors[0]?.id || '',
      price: 0.00,
      reorder_level: 10,
      quantity: 0
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setFormMode('edit');
    setCurrentId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      vendor_id: product.vendor_id || '',
      price: parseFloat(product.price),
      reorder_level: parseInt(product.reorder_level, 10),
      quantity: product.quantity
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.category_id || formData.price < 0) {
      showToast('Please complete all mandatory fields with valid values.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        await api.post('/products', formData);
        showToast('Product added and inventory record initialized.', 'success');
      } else {
        await api.put(`/products/${currentId}`, formData);
        showToast('Product specifications updated successfully.', 'success');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Products Catalog</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Master records for procurement inventory components</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={14} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter panel */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          backgroundColor: 'var(--surface)',
          padding: '12px 16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by product name or SKU code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Category:</span>
          <select
            className="form-control"
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            style={{ width: '150px', padding: '6px 12px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Vendor:</span>
          <select
            className="form-control"
            value={vendorId}
            onChange={(e) => { setVendorId(e.target.value); setPage(1); }}
            style={{ width: '150px', padding: '6px 12px' }}
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading catalog data...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No products in catalog matching conditions.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('sku')}>
                    SKU Code <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Product Name <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category_name')}>
                    Category <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('vendor_name')}>
                    Primary Vendor <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                    Unit Price <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                    Current Stock <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('reorder_level')}>
                    Reorder Level <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock = parseInt(product.quantity, 10) <= parseInt(product.reorder_level, 10);
                  return (
                    <tr key={product.id} style={{ backgroundColor: isLowStock ? 'rgba(254, 243, 199, 0.2)' : 'inherit' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{product.sku}</td>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td>{product.category_name}</td>
                      <td>{product.vendor_name || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(product.price).toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <span style={{ fontWeight: 600, color: isLowStock ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {product.quantity}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{product.reorder_level}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(product)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Edit2 size={10} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total catalog items)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px' }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              width: '100%',
              maxWidth: '500px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formMode === 'create' ? 'Catalog New Product SKU' : 'Edit Product Specifications'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="E.g. HP EliteBook Laptop"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code (Alphanumeric) *</label>
                  <input
                    type="text"
                    name="sku"
                    className="form-control"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="E.g. HW-LEN-T14"
                    disabled={formMode === 'edit'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Product Category *</label>
                  <select
                    name="category_id"
                    className="form-control"
                    value={formData.category_id}
                    onChange={handleInputChange}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Supplier</label>
                  <select
                    name="vendor_id"
                    className="form-control"
                    value={formData.vendor_id}
                    onChange={handleInputChange}
                  >
                    <option value="">No Vendor Linked</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    className="form-control"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Warning Threshold</label>
                  <input
                    type="number"
                    name="reorder_level"
                    className="form-control"
                    value={formData.reorder_level}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {formMode === 'create' && (
                <div className="form-group">
                  <label className="form-label">Initial Stock Opening Balance</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
