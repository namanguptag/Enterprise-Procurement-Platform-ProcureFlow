import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ClipboardList,
  FileSpreadsheet,
  LogOut,
  Bell,
  User,
  ChevronRight,
  Menu,
  X,
  BarChart2
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch alerts & notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Query low stock alerts as system warnings
        const res = await api.get('/inventory/alerts');
        const alerts = res.data?.data?.alerts || [];
        const mappedAlerts = alerts.slice(0, 5).map(a => ({
          id: `alert-${a.product_id}`,
          message: `Stock Alert: "${a.product_name}" is below reorder level. Current: ${a.current_stock}.`
        }));
        setUnreadNotifications(mappedAlerts);
      } catch (err) {
        console.warn('Could not load warnings:', err.message);
      }
    };

    if (user && ['Admin', 'Procurement Officer', 'Manager'].includes(user.role)) {
      fetchNotifications();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  // Build navigation items based on User Role RBAC
  const navItems = [];

  if (['Admin', 'Procurement Officer', 'Manager'].includes(user?.role)) {
    navItems.push({ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  if (['Admin', 'Procurement Officer'].includes(user?.role)) {
    navItems.push({ path: '/vendors', label: 'Vendors', icon: Users });
    navItems.push({ path: '/products', label: 'Products Catalog', icon: Package });
  }

  if (['Admin', 'Procurement Officer', 'Manager'].includes(user?.role)) {
    navItems.push({ path: '/inventory', label: 'Inventory Control', icon: Boxes });
  }

  if (['Admin', 'Employee', 'Manager'].includes(user?.role)) {
    navItems.push({ path: '/purchase-requests', label: 'Purchase Requests', icon: ClipboardList });
  }

  if (['Admin', 'Procurement Officer', 'Manager'].includes(user?.role)) {
    navItems.push({ path: '/purchase-orders', label: 'Purchase Orders', icon: FileSpreadsheet });
    navItems.push({ path: '/analytics', label: 'Analytics', icon: BarChart2 });
  }

  // Helper to generate breadcrumbs from path
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <div className="app-container">
      {/* Sidebar - Permanent on desktop, Toggleable drawer on mobile */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--secondary)',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)',
          borderRight: '1px solid #334155'
        }}
        className="sidebar-layout"
      >
        {/* Sidebar Header */}
        <div
          style={{
            height: 'var(--navbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={20} color="#2563EB" />
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em' }}>PROCURERFLOW</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'none' // Controlled by CSS responsive queries in production
            }}
            className="mobile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flexGrow: 1, padding: '16px 8px', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: isActive ? '#fff' : '#94A3B8',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer (Active User Panel) */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #334155',
            backgroundColor: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || '').toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '2px' }}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '6px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-sm)',
              color: '#94A3B8',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#475569'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#334155'; }}
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop sidebar lock styling override for layouts */}
      <style>{`
        @media (min-width: 769px) {
          .sidebar-layout {
            transform: translateX(0) !important;
          }
        }
        @media (max-width: 768px) {
          .sidebar-layout {
            box-shadow: 4px 0 10px rgba(0, 0, 0, 0.2);
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>

      {/* App Main Shell */}
      <div className="app-right-pane">
        {/* Top Navigation Bar */}
        <header
          style={{
            height: 'var(--navbar-height)',
            backgroundColor: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 90
          }}
          className="top-navbar"
        >
          {/* Breadcrumbs & Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'none' // Handled by responsive rules
              }}
              className="mobile-toggle-btn"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500 }}>PF</span>
              {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                return (
                  <React.Fragment key={name}>
                    <ChevronRight size={12} color="var(--text-muted)" />
                    <Link
                      to={routeTo}
                      style={{
                        textDecoration: 'none',
                        color: isLast ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: isLast ? 600 : 400,
                        textTransform: 'capitalize'
                      }}
                    >
                      {name.replace('-', ' ')}
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            {/* System Notifications Bell */}
            {['Admin', 'Procurement Officer', 'Manager'].includes(user?.role) && (
              <>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '4px'
                  }}
                >
                  <Bell size={18} />
                  {unreadNotifications.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger)'
                      }}
                    />
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotifications && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '32px',
                      right: 0,
                      width: '280px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '8px 0',
                      zIndex: 110
                    }}
                  >
                    <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase' }}>
                      System Warnings
                    </div>
                    {unreadNotifications.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        All systems operational.
                      </div>
                    ) : (
                      unreadNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4
                          }}
                        >
                          {notif.message}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
