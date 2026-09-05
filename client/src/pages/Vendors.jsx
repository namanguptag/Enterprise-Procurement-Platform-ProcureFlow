import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Plus, Edit2, Search, ArrowUpDown, X } from 'lucide-react';

const Vendors = () => {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter/Pagination/Sorting states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Modal Dialog Form state
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create | edit
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    gst_number: '',
    email: '',
    phone: '',
    address: '',
    rating: 5.00,
    status: 'active'
  });

  const [saving, setSaving] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors', {
        params: { search, status, sortBy, sortOrder, page, limit: 10 }
      });
      setVendors(res.data.data.vendors);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load vendors catalog data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, sortOrder, page, showToast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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
      company: '',
      gst_number: '',
      email: '',
      phone: '',
      address: '',
      rating: 5.00,
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setFormMode('edit');
    setCurrentId(vendor.id);
    setFormData({
      name: vendor.name,
      company: vendor.company,
      gst_number: vendor.gst_number,
      email: vendor.email,
      phone: vendor.phone || '',
      address: vendor.address || '',
      rating: parseFloat(vendor.rating),
      status: vendor.status
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.gst_number || !formData.email) {
      showToast('Name, Company, GSTIN, and Email are mandatory fields.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        await api.post('/vendors', formData);
        showToast('Vendor profile added successfully.', 'success');
      } else {
        await api.put(`/vendors/${currentId}`, formData);
        showToast('Vendor profile updated successfully.', 'success');
      }
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save vendor details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Vendor Directory</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage supplier profiles, compliance, and ratings</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={14} />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Filter / Search panel */}
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
            placeholder="Search by vendor name, company, or GSTIN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
          <select
            className="form-control"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{ width: '130px', padding: '6px 12px' }}
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading vendor list...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No vendors found matching criteria.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Vendor Name <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('company')}>
                    Company <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('gst_number')}>
                    GSTIN <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rating')}>
                    Rating <ArrowUpDown size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{vendor.name}</td>
                    <td>{vendor.company}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{vendor.gst_number}</td>
                    <td>{vendor.email}</td>
                    <td>{vendor.phone || '—'}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>
                        ★ {parseFloat(vendor.rating).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${vendor.status === 'active' ? 'success' : 'danger'}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(vendor)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        <Edit2 size={10} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total vendors)
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

      {/* CREATE & EDIT FORM DIALOG MODAL */}
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
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formMode === 'create' ? 'Add New Vendor' : 'Edit Vendor Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Vendor Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="E.g. John Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="company"
                    className="form-control"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="E.g. TechLink Ltd"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">GSTIN (15 characters) *</label>
                  <input
                    type="text"
                    name="gst_number"
                    className="form-control"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    placeholder="E.g. 27AAAAA1111A1Z1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E.g. info@tech.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="E.g. +15550199"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Compliance Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active Partner</option>
                    <option value="inactive">Inactive Partner</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street Address, City, ZIP, Country"
                  style={{ fontFamily: 'var(--font-sans)', resize: 'none' }}
                />
              </div>

              {/* Action Buttons */}
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
                  {saving ? 'Saving Changes...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;
