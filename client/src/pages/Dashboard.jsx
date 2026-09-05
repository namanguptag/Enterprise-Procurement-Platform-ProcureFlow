import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Users,
  Package,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data.data);
      } catch (err) {
        showToast('Failed to load dashboard analytics data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [showToast]);

  const handleExportInventory = () => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:5000/api/reports/excel/inventory?token=${token}`;
    showToast('Exporting Inventory Excel Report...', 'info');
  };

  const handleExportVendors = () => {
    const token = localStorage.getItem('token');
    window.location.href = `http://localhost:5000/api/reports/excel/vendors?token=${token}`;
    showToast('Exporting Vendors Excel Directory...', 'info');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading analytics dashboard data...</p>
      </div>
    );
  }

  const {
    metrics = {},
    monthlySpend = [],
    topProducts = [],
    vendorPerformance = [],
    recentActivities = []
  } = data || {};

  return (
    <div>
      {/* Page Title & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>ProcureFlow Overview</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live enterprise metrics and operational cost intelligence</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportInventory} className="btn btn-secondary">
            <FileText size={14} />
            <span>Export Inventory Report</span>
          </button>
          <button onClick={handleExportVendors} className="btn btn-secondary">
            <FileText size={14} />
            <span>Export Vendors Directory</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid-metrics">
        <div className="card-metric">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="card-metric-title">Active Partners</span>
            <Users size={16} color="var(--text-secondary)" />
          </div>
          <span className="card-metric-value">{metrics?.activeVendors} / {metrics?.totalVendors}</span>
          <span className="card-metric-desc">Registered Vendors</span>
        </div>

        <div className="card-metric">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="card-metric-title">Inventory Capital</span>
            <DollarSign size={16} color="var(--success)" />
          </div>
          <span className="card-metric-value" style={{ color: 'var(--success)' }}>
            ₹{metrics?.inventoryValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="card-metric-desc">Valuation across {metrics?.totalProducts} SKUs</span>
        </div>

        <div className="card-metric">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="card-metric-title">Pending Orders</span>
            <ClipboardCheck size={16} color="var(--warning)" />
          </div>
          <span className="card-metric-value">{metrics?.pendingOrders}</span>
          <span className="card-metric-desc">POs requiring processing</span>
        </div>

        <div className="card-metric" style={{ borderLeft: metrics?.lowStockAlerts > 0 ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="card-metric-title">Low Stock SKUs</span>
            <AlertTriangle size={16} color={metrics?.lowStockAlerts > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
          </div>
          <span className="card-metric-value" style={{ color: metrics?.lowStockAlerts > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {metrics?.lowStockAlerts}
          </span>
          <span className="card-metric-desc">Below critical reorder level</span>
        </div>
      </div>

      {/* Chart Layout Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Spend Area Chart */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--primary)" />
            <span>Monthly Spend (Delivered Goods Value)</span>
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <AreaChart data={monthlySpend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                <Tooltip formatter={(value) => [`₹${parseFloat(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Spend']} />
                <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} color="var(--primary)" />
            <span>Top 5 Purchased Products (Quantity)</span>
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="sku" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: 'var(--text-muted)' }} />
                <Tooltip formatter={(value, name) => [value, name === 'quantity' ? 'Units' : name]} />
                <Bar dataKey="quantity" fill="#1E293B" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Vendor Performance & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Vendor Performance list */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Vendor Quality Directory</h3>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none', margin: 0 }}>
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Partner Name</th>
                  <th style={{ textAlign: 'right' }}>Completed POs</th>
                  <th style={{ textAlign: 'right' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {vendorPerformance?.map((vendor, idx) => (
                  <tr key={idx}>
                    <td style={{ paddingLeft: 0, fontWeight: 500 }}>
                      <div>{vendor.vendor_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vendor.company}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{vendor.orders_completed} POs</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>
                        ★ {parseFloat(vendor.rating).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities list */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Recent System Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            {recentActivities?.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  fontSize: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.username}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> performed </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--primary)' }}>{act.action}</span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Module: {act.module}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
