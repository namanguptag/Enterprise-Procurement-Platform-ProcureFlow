import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Settings, RefreshCw, AlertTriangle, ArrowRight, Clipboard, X } from 'lucide-react';

const Inventory = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('list'); // list | history
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Datasets
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({});
  const [histPagination, setHistPagination] = useState({});
  const [page, setPage] = useState(1);
  const [histPage, setHistPage] = useState(1);

  // Manual Adjustment Modal Form state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory', { params: { page, search, limit: 10 } });
      setInventory(res.data.data.inventory);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load inventory balances.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/history', { params: { page: histPage, limit: 15 } });
      setHistory(res.data.data.transactions);
      setHistPagination(res.data.data.pagination);
    } catch (err) {
      showToast('Failed to load transaction logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [histPage, showToast]);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchInventory();
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchInventory, fetchHistory]);

  const openAdjustModal = (item) => {
    setSelectedProduct(item);
    setAdjustQty('');
    setAdjustNotes('');
    setShowModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || parseInt(adjustQty, 10) === 0) {
      showToast('Adjustment quantity must be a non-zero integer value.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/inventory/adjust', {
        product_id: selectedProduct.product_id,
        quantity: parseInt(adjustQty, 10),
        notes: adjustNotes
      });
      showToast('Stock levels manually adjusted successfully.', 'success');
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjust stock.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Inventory Control</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monitor warehouse balances, reorder indicators, and movements</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px', gap: '20px' }}>
        <button
          onClick={() => { setActiveTab('list'); setPage(1); }}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'list' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Warehouse Stock Ledger
        </button>
        <button
          onClick={() => { setActiveTab('history'); setHistPage(1); }}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'history' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Transaction Audit Trail
        </button>
      </div>

      {/* TABS BODY */}
      {activeTab === 'list' ? (
        <>
          {/* List Search filter */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--surface)',
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px'
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Filter list by product name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading warehouse ledger...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No inventory mappings match search terms.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="ent-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Physical Balance</th>
                      <th style={{ textAlign: 'right' }}>Incoming (On PO)</th>
                      <th>Threshold warning</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLowStock = parseInt(item.current_stock, 10) <= parseInt(item.reorder_level, 10);
                      return (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{item.sku}</td>
                          <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                          <td>{item.category_name}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isLowStock ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {item.current_stock}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.incoming_stock}</td>
                          <td>
                            {isLowStock ? (
                              <span className="badge badge-warning" style={{ gap: '4px' }}>
                                <AlertTriangle size={10} />
                                <span>Low stock (Min: {item.reorder_level})</span>
                              </span>
                            ) : (
                              <span className="badge badge-success">Sufficient</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {['Admin', 'Procurement Officer'].includes(user?.role) && (
                              <button
                                onClick={() => openAdjustModal(item)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                <Settings size={10} />
                                <span>Adjust Stock</span>
                              </button>
                            )}
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
        </>
      ) : (
        <>
          {/* History tab */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading transaction history logs...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No logged inventory transactions exist.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="ent-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>SKU Code</th>
                      <th>Product Name</th>
                      <th>User</th>
                      <th>Transaction</th>
                      <th style={{ textAlign: 'right' }}>Quantity shift</th>
                      <th>Reference origin</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((log) => {
                      const isAddition = log.transaction_type === 'inbound' || (log.transaction_type === 'adjustment' && log.quantity > 0);
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{log.sku}</td>
                          <td style={{ fontWeight: 500 }}>{log.product_name}</td>
                          <td>{log.username}</td>
                          <td>
                            <span className={`badge badge-${log.transaction_type === 'inbound' ? 'success' : log.transaction_type === 'outbound' ? 'danger' : 'info'}`}>
                              {log.transaction_type}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isAddition ? 'var(--success)' : 'var(--danger)' }}>
                            {isAddition ? `+${log.quantity}` : log.quantity}
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                              {log.reference_type?.replace('_', ' ')} (ID: {log.reference_id || 'N/A'})
                            </span>
                          </td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.notes}
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
                  Showing Page {histPagination.page} of {histPagination.totalPages || 1}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button disabled={histPage <= 1} onClick={() => setHistPage(p => p - 1)} className="btn btn-secondary">
                    Previous
                  </button>
                  <button disabled={histPage >= histPagination.totalPages} onClick={() => setHistPage(p => p + 1)} className="btn btn-secondary">
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ADJUSTMENT MODAL DIALOG */}
      {showModal && selectedProduct && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Manual Adjustment: {selectedProduct.product_name}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'var(--background)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}
              >
                <RefreshCw size={16} color="var(--primary)" />
                <div>
                  Current Balance: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedProduct.current_stock} units</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Quantity (Use negative for subtraction) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="E.g. 15 or -10"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="E.g. Discovered damaged boxes in warehouse, or manual cycle count variance adjustments"
                  style={{ fontFamily: 'var(--font-sans)', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Applying Adjustment...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
