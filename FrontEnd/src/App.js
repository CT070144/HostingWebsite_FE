import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';

import Services from './pages/Services/Services';
import Pricing from './pages/Pricing/Pricing';
import Contact from './pages/Contact/Contact';
import Hosting from './pages/Hosting/Hosting';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import ClientDashboard from './pages/Dashboard/Client/ClientDashboard';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ConfigProduct from './pages/ConfigProduct/ConfigProduct';
import Cart from './pages/Cart/Cart';
import Profile from './pages/Profile/Profile';
import OrderDetails from './pages/Order/OrderDetails';
import PrintInvoice from './pages/Order/PrintInvoice';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute/RoleProtectedRoute';
import AdminLayout from './pages/Dashboard/Admin/AdminLayout';
import AdminDashboardPage from './pages/Dashboard/Admin/AdminDashboardPage';
import AdminOrdersPage from './pages/Dashboard/Admin/AdminOrdersPage';
import AdminProductsPage from './pages/Dashboard/Admin/AdminProductsPage';
import AdminUsersPage from './pages/Dashboard/Admin/AdminUsersPage';
import AdminBannersPage from './pages/Dashboard/Admin/AdminBannersPage';
import AdminFaqsPage from './pages/Dashboard/Admin/AdminFaqsPage';
import AdminServiceFeaturesPage from './pages/Dashboard/Admin/AdminServiceFeaturesPage';
import ProxmoxLayout from './pages/Instance/ProxmoxLayout';
import InstanceRenewalPage from './pages/Instance/InstanceRenewalPage';
import TestAPI from './test api/TestAPI';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Print Invoice Route - No Layout (no header/footer) */}
      <Route
        path="/order/:orderId/print"
        element={
          <ProtectedRoute requireAuth={true}>
            <PrintInvoice />
          </ProtectedRoute>
        }
      />

      {/* Instance Routes - Full screen without Layout */}
      <Route
        path="/instances/:instanceId/renew"
        element={
          <ProtectedRoute requireAuth={true}>
            <Layout>
              <InstanceRenewalPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instances"
        element={
          <ProtectedRoute requireAuth={true}>
            <ProxmoxLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instances/:instanceId"
        element={
          <ProtectedRoute requireAuth={true}>
            <ProxmoxLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instances/:instanceId/:tab"
        element={
          <ProtectedRoute requireAuth={true}>
            <ProxmoxLayout />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Only accessible by admin role */}
      <Route
        path="/admin/*"
        element={
          <RoleProtectedRoute requireAuth={true} allowedRoles="admin">
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="configuration/users" element={<AdminUsersPage />} />
        <Route path="configuration/banner" element={<AdminBannersPage />} />
        <Route path="configuration/hosting-banner" element={<AdminBannersPage />} />
        <Route path="configuration/faqs" element={<AdminFaqsPage />} />
        <Route path="configuration/service-features" element={<AdminServiceFeaturesPage />} />
        <Route path="configuration" element={<AdminUsersPage />} />
      </Route>

      {/* Regular Routes with Layout (header/footer) */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/hosting" element={<Hosting />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={
                <RoleProtectedRoute requireAuth={false}>
                  <Login />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <RoleProtectedRoute requireAuth={false}>
                  <Register />
                </RoleProtectedRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Client Dashboard - Only accessible by user role */}
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute requireAuth={true} allowedRoles={['user', 'customer']}>
                  <ClientDashboard />
                </RoleProtectedRoute>
              }
            />
            {/* Legacy dashboard route - redirects based on role */}
            <Route
              path="/dashboard-legacy"
              element={
                <ProtectedRoute requireAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/config-product/:productId" element={<ConfigProduct />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute requireAuth={true}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requireAuth={true}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:orderId"
              element={
                <ProtectedRoute requireAuth={true}>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/test-api" element={<TestAPI />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

export default App;
