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
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ConfigProduct from './pages/ConfigProduct/ConfigProduct';
import Cart from './pages/Cart/Cart';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminLayout from './pages/Dashboard/Admin/AdminLayout';
import AdminDashboardPage from './pages/Dashboard/Admin/AdminDashboardPage';
import AdminOrdersPage from './pages/Dashboard/Admin/AdminOrdersPage';
import AdminProductsPage from './pages/Dashboard/Admin/AdminProductsPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAuth={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
      </Route>
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/hosting" element={<Hosting />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/config-product/:productId" element={<ConfigProduct />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

export default App;

