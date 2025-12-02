import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './Admin.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', path: '/admin' },
    { key: 'orders', label: 'Đơn hàng', icon: 'fas fa-shopping-cart', path: '/admin/orders' },
    { key: 'products', label: 'Sản phẩm', icon: 'fas fa-box', path: '/admin/products' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="admin-container">
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="admin-logo">
          <i className="fas fa-server"></i>
          {!sidebarOpen && <span>TTCS Admin</span>}
        </div>
        <div className="mobile-user-info">
          <i className="fas fa-bell"></i>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${
          mobileMenuOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="sidebar-header" onClick={toggleSidebar}>
          <div className="admin-logo">
            <i className="fas fa-server"></i>
            <span className={sidebarOpen ? '' : 'hidden'}>TTCS Admin</span>
          </div>
          <button
            className="sidebar-toggle desktop-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className={`fas fa-${sidebarOpen ? 'chevron-left' : 'chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.key} className="nav-item-wrapper">
              <NavLink
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className={item.icon}></i>
                <span className={sidebarOpen ? '' : 'hidden'}>{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'Admin'}</div>
                <div className="user-email">{user?.email || 'admin@ttcs.vn'}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <div className="header-left">
            <button
              className="sidebar-toggle mobile-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Tìm kiếm..." />
            </div>
          </div>
          <div className="header-right">
            <div className="notifications">
              <i className="fas fa-bell"></i>
            </div>
            <div className="user-profile">
              <div className="profile-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name || 'Admin'}</div>
                <div className="profile-role">Quản trị viên</div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;


