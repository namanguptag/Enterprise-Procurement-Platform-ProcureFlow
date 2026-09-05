import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Check, X, Search, FileText, ChevronRight } from 'lucide-react';

const PurchaseRequests = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Active View Details Drawer state
  const [activeRequest, setActiveRequest] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // New Request Form Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestJustification, setNewRequestJustification] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [{ product_id, quantity, name, price }]
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch requests list
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-requests', { params: { status, page, limit: 10 } });
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load purchase requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [status, page, showToast]);

  // Fetch product choices for creation
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products', { params: { limit: 100 } });
      setProducts(res.data.data.products);
    } catch (err) {
      console.warn('Could not populate product choices:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (['Employee', 'Admin'].includes(user?.role)) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  // Open single request drawer details
  const viewRequestDetails = async (id) => {
    try {
      const res = await api.get(`/purchase-requests/${id}`);
      setActiveRequest(res.data.data.request);
      setReviewComments('');
    } catch (err) {
      showToast('Failed to load request specifications.', 'error');
    }
  };

  // Submit Manager review response
  const handleReviewSubmit = async (approvalStatus) => {
    setReviewing(true);
    try {
      await api.post(`/purchase-requests/${activeRequest.id}/review`, {
        status: approvalStatus,
        comments: reviewComments
      });
      showToast(`Purchase Request successfully ${approvalStatus}.`, 'success');
      setActiveRequest(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review request.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  // Form handling: add line item
  const addLineItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setSelectedItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct.id,
        quantity: 1,
        name: defaultProduct.name,
        price: parseFloat(defaultProduct.price)
      }
    ]);
  };

  // Form handling: remove line item
  const removeLineItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === parseInt(productId, 10));
    if (!prod) return;

    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        product_id: prod.id,
        quantity: copy[index].quantity,
        name: prod.name,
        price: parseFloat(prod.price)
      };
      return copy;
    });
  };

  const handleItemQtyChange = (index, qty) => {
    const cleanQty = Math.max(1, parseInt(qty, 10) || 1);
    setSelectedItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = cleanQty;
      return copy;
    });
  };

  // Calculate estimated total on the fly
  const calculateFormTotal = () => {
    return selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  };

  // Submit request form
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newRequestTitle.trim() || selectedItems.length === 0) {
      showToast('Request title and at least one item are required.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/purchase-requests', {
        title: newRequestTitle,
        justification: newRequestJustification,
        items: selectedItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      });
      showToast('Purchase request submitted successfully.', 'success');
      setShowCreateModal(false);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit request.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setNewRequestTitle('');
    setNewRequestJustification('');
    setSelectedItems([]);
    setShowCreateModal(true);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
      {/* LEFT SIDE: List panel */}
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Purchase Requests</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Draft, view, and authorize purchase request forms</p>
          </div>
          {['Employee', 'Admin'].includes(user?.role) && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={14} />
              <span>Create Request</span>
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
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No purchase requests found.</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Request Title</th>
                    <th>Requester</th>
                    <th style={{ textAlign: 'right' }}>Est. Total Cost</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => viewRequestDetails(req.id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: activeRequest?.id === req.id ? 'var(--primary-light)' : 'inherit'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)' }}>PR-{String(req.id).padStart(4, '0')}</td>
                      <td style={{ fontWeight: 500 }}>{req.title}</td>
                      <td>{req.requester_name}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        ₹{parseFloat(req.total_estimated_cost).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {req.status}
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

      {/* RIGHT SIDE DETAILS DRAWER */}
      {activeRequest && (
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                PR-{String(activeRequest.id).padStart(4, '0')}
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeRequest.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveRequest(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Details list */}
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Requester: </span>
              <strong>{activeRequest.requester_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Total Estimate: </span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{parseFloat(activeRequest.total_estimated_cost).toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Submitted: </span>
              <span>{new Date(activeRequest.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Status: </span>
              <span className={`badge badge-${activeRequest.status === 'approved' ? 'success' : activeRequest.status === 'rejected' ? 'danger' : 'warning'}`}>
                {activeRequest.status}
              </span>
            </div>
            {activeRequest.justification && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Justification:</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{activeRequest.justification}</div>
              </div>
            )}
          </div>

          {/* Line items in PR */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Requested Items</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {activeRequest.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>SKU: {item.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{item.quantity} units</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>₹{parseFloat(item.estimated_unit_price).toFixed(2)} ea</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review history */}
          {activeRequest.approvals?.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Approval Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {activeRequest.approvals.map((ap) => (
                  <div key={ap.id} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>Reviewed by: {ap.approver_name}</span>
                      <span style={{ color: ap.status === 'approved' ? 'var(--success)' : 'var(--danger)' }}>
                        {ap.status.toUpperCase()}
                      </span>
                    </div>
                    {ap.comments && <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{ap.comments}"</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MANAGER ACTION BAR */}
          {activeRequest.status === 'pending' && ['Manager', 'Admin'].includes(user?.role) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Review Comments / Reason</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Provide comments regarding approval or rejection..."
                  style={{ fontFamily: 'var(--font-sans)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleReviewSubmit('rejected')}
                  className="btn btn-danger"
                  style={{ flexGrow: 1 }}
                  disabled={reviewing}
                >
                  <X size={14} />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleReviewSubmit('approved')}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                  disabled={reviewing}
                >
                  <Check size={14} />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE PR MODAL */}
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
              maxWidth: '650px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Draft Purchase Request</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
              <div className="form-group">
                <label className="form-label">Purchase Request Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRequestTitle}
                  onChange={(e) => setNewRequestTitle(e.target.value)}
                  placeholder="E.g. Developer Laptops Upgrade - Q3 Batch"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Justification / Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={newRequestJustification}
                  onChange={(e) => setNewRequestJustification(e.target.value)}
                  placeholder="Provide context on why these items are required..."
                  style={{ fontFamily: 'var(--font-sans)', resize: 'none' }}
                />
              </div>

              {/* Items Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Required Line Items *</label>
                  <button type="button" onClick={addLineItem} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                    <Plus size={10} />
                    <span>Add Item</span>
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Add at least one product SKU to submit request.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 100px 40px', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="form-control"
                          value={item.product_id}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                               {p.name} (₹{parseFloat(p.price).toFixed(2)})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="form-control"
                          value={item.quantity}
                          onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                          placeholder="Qty"
                        />
                        <div style={{ fontSize: '12px', textAlign: 'right', fontFamily: 'var(--font-mono)', paddingRight: '4px' }}>
                           ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginTop: '12px'
                }}
              >
                <span>Estimated Grand Total:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                  ₹{calculateFormTotal().toFixed(2)}
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Submitting Form...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
