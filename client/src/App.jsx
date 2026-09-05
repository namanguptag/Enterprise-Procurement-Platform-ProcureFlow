import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import Analytics from './pages/Analytics';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Validating session context...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If not authorized, bounce back to safe home based on role
    return <Navigate to={user?.role === 'Employee' ? '/purchase-requests' : '/dashboard'} replace />;
  }

  return children;
};

// Route Redirect Helper (handles default root / route mapping)
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'Employee') {
    return <Navigate to="/purchase-requests" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes (under DashboardLayout shell) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Root redirect */}
              <Route index element={<RootRedirect />} />

              {/* Dashboard: Admin, Officer, Manager */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer', 'Manager']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Vendors: Admin, Officer */}
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />

              {/* Products: Admin, Officer */}
              <Route
                path="products"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer']}>
                    <Products />
                  </ProtectedRoute>
                }
              />

              {/* Inventory: Admin, Officer, Manager */}
              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer', 'Manager']}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />

              {/* Purchase Requests: Admin, Employee, Manager */}
              <Route
                path="purchase-requests"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Employee', 'Manager']}>
                    <PurchaseRequests />
                  </ProtectedRoute>
                }
              />

              {/* Purchase Orders: Admin, Officer, Manager */}
              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer', 'Manager']}>
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />

              {/* Analytics: Admin, Officer, Manager */}
              <Route
                path="analytics"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Procurement Officer', 'Manager']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
