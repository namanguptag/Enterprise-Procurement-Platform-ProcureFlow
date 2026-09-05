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
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { RefreshCw, FileText, TrendingUp, Users, Package, PieChart as PieIcon } from 'lucide-react';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics');
      setData(res.data.data);
    } catch (err) {
      showToast('Failed to load analytics dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading analytics reporting metrics...</p>
      </div>
    );
  }

  const {
    monthlySpend = [],
    vendorPerformance = [],
    categoryStock = [],
    poStatusSplit = []
  } = data || {};

  // Status-based colors for PO doughnut split
  const STATUS_COLORS = {
    delivered: '#16A34A',  // Success green
    ordered: '#2563EB',    // Primary blue
    pending: '#F59E0B',    // Warning amber
    cancelled: '#DC2626',  // Danger red
    draft: '#64748B'       // Slate gray
  };

  return (
    <div className="analytics-report-view">
      {/* Print Specific Stylings */}
      <style>{`
        @media print {
          body {
            background-color: #fff;
            color: #000;
          }
          .sidebar-layout, .top-navbar, .btn, .mobile-toggle-btn {
            display: none !important;
          }
          .app-right-pane {
            padding-left: 0 !important;
          }
          .main-content {
            padding: 0 !important;
          }
          .analytics-charts-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .analytics-card {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics & Requisitions Reporting</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Key Performance Indicators (KPIs), vendor delivery assessments, and budget spend trends.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchAnalyticsData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button onClick={handlePrintReport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} />
            <span>Download PDF Summary Report</span>
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        
        {/* Spend Line Chart */}
        <div className="analytics-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={15} color="var(--primary)" />
            <span>Monthly Procurement Spend Trend (INR)</span>
          </h3>
          <div style={{ height: '300px' }}>
            {monthlySpend.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '12px' }}>No delivered spend records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpend} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Spend Amount']} />
                  <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#spendColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Vendors Bar Chart */}
        <div className="analytics-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={15} color="var(--primary)" />
            <span>Top 5 Vendors by Spend & Rating</span>
          </h3>
          <div style={{ height: '300px' }}>
            {vendorPerformance.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '12px' }}>No vendor transactions recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorPerformance} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="vendor_name" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)' }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Total Spend Amount']} />
                  <Legend />
                  <Bar name="Total Spend Amount" dataKey="total_order_value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Stock Horizontal Bar Chart */}
        <div className="analytics-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={15} color="var(--primary)" />
            <span>Warehouse Stock Value by Category (INR)</span>
          </h3>
          <div style={{ height: '300px' }}>
            {categoryStock.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '12px' }}>No stock information available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={categoryStock} margin={{ left: 20, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)' }} tickFormatter={(val) => `₹${val}`} />
                  <YAxis type="category" dataKey="category_name" width={110} tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: 'var(--text-secondary)', fontWeight: 500 }} />
                  <Tooltip formatter={(value) => [`₹${parseFloat(value).toLocaleString()}`, 'Stock Valuation']} />
                  <Bar name="Stock Valuation" dataKey="stock_value" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PO Doughnut split */}
        <div className="analytics-card" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={15} color="var(--primary)" />
            <span>Purchase Order Status Split</span>
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {poStatusSplit.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No purchase orders to split.</div>
            ) : (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={poStatusSplit}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {poStatusSplit.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.status] || '#64748B'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, `${name.toUpperCase()} POs`]} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ textTransform: 'capitalize', fontSize: '11px', color: 'var(--text-secondary)' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
