import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, ChevronRight, Check, X, Calendar } from 'lucide-react';

const PurchaseOrders = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Active View details drawer state
  const [activeOrder, setActiveOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Generate PO Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders', { params: { status, page, limit: 10 } });
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load purchase orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, page, showToast]);

  const fetchapprovedPRsAndVendors = useCallback(async () => {
    try {
      // Fetch approved purchase requests
      const prRes = await api.get('/purchase-requests', { params: { status: 'approved', limit: 100 } });
      setApprovedRequests(prRes.data.data.requests);

      // Fetch active vendors
      const vendRes = await api.get('/vendors', { params: { status: 'active', limit: 100 } });
      setVendors(vendRes.data.data.vendors);
    } catch (err) {
      console.warn('Could not populate modal choices:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (['Procurement Officer', 'Admin'].includes(user?.role)) {
      fetchapprovedPRsAndVendors();
    }
  }, [user, fetchapprovedPRsAndVendors]);

  // Open details drawer
  const viewOrderDetails = async (id) => {
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setActiveOrder(res.data.data.order);
    } catch (err) {
      showToast('Failed to load purchase order details.', 'error');
    }
  };

  // Status transitions: Ordered, Delivered, Cancelled
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/purchase-orders/${activeOrder.id}/status`, { status: newStatus });
      showToast(`Purchase Order status updated to ${newStatus.toUpperCase()}.`, 'success');
      setActiveOrder(null);
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit Generation form
  const handleGeneratePO = async (e) => {
    e.preventDefault();
    if (!selectedPRId || !selectedVendorId || !expectedDate) {
      showToast('Please specify the Request form, Vendor link, and expected delivery date.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      await api.post('/purchase-orders', {
        purchase_request_id: parseInt(selectedPRId, 10),
        vendor_id: parseInt(selectedVendorId, 10),
        expected_delivery_date: expectedDate
      });
      showToast('Purchase Order generated and logged successfully.', 'success');
      setShowCreateModal(false);
      fetchOrders();
      // Reload approved requests (since one has been consumed)
      fetchapprovedPRsAndVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate purchase order.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPRId(approvedRequests[0]?.id || '');
    setSelectedVendorId(vendors[0]?.id || '');
    setExpectedDate('');
    setShowCreateModal(true);
  };

  const handleDownloadPDF = (id) => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:5000/api/reports/pdf/purchase-order/${id}?token=${token}`;
    showToast('Downloading purchase order PDF...', 'info');
  };

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* LEFT PANEL: Table view */}
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Purchase Orders</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Track outbound requests, deliveries, and procurement invoices</p>
          </div>
          {['Procurement Officer', 'Admin'].includes(user?.role) && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={14} />
              <span>Generate PO</span>
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface)',
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter by Status:</span>
          <select
            className="form-control"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{ width: '150px', padding: '6px 12px' }}
          >
            <option value="">All POs</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading purchase orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No purchase orders match query.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Linked Vendor</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Expected Date</th>
                    <th>Actual Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => viewOrderDetails(po.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: activeOrder?.id === po.id ? 'var(--primary-light)' : 'inherit'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{po.po_number}</td>
                      <td>{po.vendor_name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        ₹{parseFloat(po.total_amount).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {po.actual_delivery_date ? new Date(po.actual_delivery_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${po.status === 'delivered' ? 'success' : po.status === 'cancelled' ? 'danger' : po.status === 'ordered' ? 'info' : 'warning'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">
                  Previous
                </button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE DETAILS PANEL */}
      {activeOrder && (
        <div
          style={{
            width: '360px',
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            padding: '24px',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: 'calc(100vh - 120px)',
            position: 'sticky',
            top: '80px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                {activeOrder.po_number}
              </span>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                Vendor Invoice Breakdown
              </h3>
            </div>
            <button
              onClick={() => setActiveOrder(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Details list */}
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Vendor: </span>
              <strong>{activeOrder.vendor_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Grand Total: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(activeOrder.total_amount).toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Status: </span>
              <span className={`badge badge-${activeOrder.status === 'delivered' ? 'success' : activeOrder.status === 'cancelled' ? 'danger' : activeOrder.status === 'ordered' ? 'info' : 'warning'}`}>
                {activeOrder.status}
              </span>
            </div>
            {activeOrder.expected_delivery_date && (
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Expected Delivery: </span>
                <span>{new Date(activeOrder.expected_delivery_date).toLocaleDateString()}</span>
              </div>
            )}
            {activeOrder.actual_delivery_date && (
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Actual Delivery: </span>
                <span>{new Date(activeOrder.actual_delivery_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Table Items */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Line Items</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {activeOrder.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>SKU: {item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{item.quantity} units</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(item.unit_price).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons (Print) */}
          <button
            onClick={() => handleDownloadPDF(activeOrder.id)}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            <FileText size={14} />
            <span>Download Invoice PDF</span>
          </button>

          {/* PROCUREMENT OFFICER STATUS CONTROLS */}
          {['pending', 'approved', 'ordered'].includes(activeOrder.status) && ['Procurement Officer', 'Admin'].includes(user?.role) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Update Order State</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="btn btn-danger"
                  style={{ flexGrow: 1, padding: '6px' }}
                  disabled={updatingStatus}
                >
                  <X size={12} />
                  <span>Cancel PO</span>
                </button>

                {activeOrder.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange('approved')}
                    className="btn btn-primary"
                    style={{ flexGrow: 1, padding: '6px' }}
                    disabled={updatingStatus}
                  >
                    <Check size={12} />
                    <span>Approve PO</span>
                  </button>
                )}

                {activeOrder.status === 'approved' && (
                  <button
                    onClick={() => handleStatusChange('ordered')}
                    className="btn btn-primary"
                    style={{ flexGrow: 1, padding: '6px' }}
                    disabled={updatingStatus}
                  >
                    <Calendar size={12} />
                    <span>Mark Ordered</span>
                  </button>
                )}

                {activeOrder.status === 'ordered' && (
                  <button
                    onClick={() => handleStatusChange('delivered')}
                    className="btn btn-primary"
                    style={{ flexGrow: 1, padding: '6px' }}
                    disabled={updatingStatus}
                  >
                    <Check size={12} />
                    <span>Receive Goods</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GENERATE PO MODAL */}
      {showCreateModal && (
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
              maxWidth: '450px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Generate Purchase Order</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {approvedRequests.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No approved purchase requests require order generation at this time.
              </div>
            ) : (
              <form onSubmit={handleGeneratePO}>
                <div className="form-group">
                  <label className="form-label">Approved Purchase Request *</label>
                  <select
                    className="form-control"
                    value={selectedPRId}
                    onChange={(e) => setSelectedPRId(e.target.value)}
                  >
                    {approvedRequests.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        PR-{String(pr.id).padStart(4, '0')}: {pr.title} (₹{parseFloat(pr.total_estimated_cost).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Vendor Supplier *</label>
                  <select
                    className="form-control"
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (GST: {v.gst_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Delivery Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary"
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={generating}>
                    {generating ? 'Generating Order...' : 'Generate Purchase Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
