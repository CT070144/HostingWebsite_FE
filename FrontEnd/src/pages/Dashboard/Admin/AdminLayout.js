import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './Admin.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'dashboard', label: 'Tổng quan', icon: 'fas fa-tachometer-alt', path: '/admin/dashboard', subMenu: null },
    { key: 'orders', label: 'Đơn hàng', icon: 'fas fa-shopping-cart', path: '/admin/orders', subMenu: null },
    { key: 'products', label: 'Dịch vụ', icon: 'fas fa-box', path: '/admin/products', subMenu: null },
  ];

  const configurationMenu = {
    key: 'configuration',
    label: 'Cấu hình',
    icon: 'fas fa-cog',
    path: '/admin/configuration/users',
    subMenu: [
      { key: 'users', label: 'Người dùng', path: '/admin/configuration/users' },
      { key: 'banner', label: 'Banner', path: '/admin/configuration/banner' },
      { key: 'hosting-banner', label: 'Banner Hosting', path: '/admin/configuration/hosting-banner' },
      { key: 'faqs', label: 'FAQs', path: '/admin/configuration/faqs' },
      { key: 'service-features', label: 'Dịch vụ', path: '/admin/configuration/service-features' },
    ],
  };

  // Auto-expand submenu if current path matches any submenu item
  React.useEffect(() => {
    if (configurationMenu.subMenu && configurationMenu.subMenu.some((subItem) => location.pathname === subItem.path)) {
      setExpandedMenus((prev) => ({
        ...prev,
        [configurationMenu.key]: true,
      }));
    }
  }, [location.pathname]);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!sidebarOpen && hoveredMenu) {
        const footerConfigMenu = document.querySelector('.footer-config-menu');
        if (footerConfigMenu && !footerConfigMenu.contains(event.target)) {
          setHoveredMenu(null);
        }
      }
    };

    if (!sidebarOpen && hoveredMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen, hoveredMenu]);

  const toggleSubMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const isActive = (item) => {
    if (item.subMenu) {
      return item.subMenu.some((subItem) => location.pathname === subItem.path);
    }
    return location.pathname === item.path;
  };

  const isSubMenuActive = (subItem) => {
    return location.pathname === subItem.path;
  };

  const toggleSidebar = () => {
    console.log('toggleSidebar');
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
        <div  className="admin-logo">
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
            <i onClick={toggleSidebar} style={{ cursor: 'pointer',padding: '10px' }} className={`fas fa-${sidebarOpen ? 'chevron-left' : 'chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.key} className="nav-item-wrapper">
              <div
                className={`nav-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => {
                  if (item.subMenu) {
                    toggleSubMenu(item.key);
                  } else {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <NavLink
                  to={item.path}
                  end={false}
                  className={({ isActive: navIsActive }) =>
                    `nav-link-content ${navIsActive ? 'active' : ''}`
                  }
                  onClick={(e) => {
                    if (item.subMenu) {
                      e.preventDefault();
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <i className={item.icon}></i>
                  <span className={sidebarOpen ? '' : 'hidden'}>{item.label}</span>
                </NavLink>
                {item.subMenu && sidebarOpen && (
                  <i className={`fas fa-chevron-${expandedMenus[item.key] ? 'up' : 'down'} submenu-icon`}></i>
                )}
              </div>
              {item.subMenu && sidebarOpen && (
                <ul 
                  className="submenu"
                  style={{ maxHeight: expandedMenus[item.key] ? '500px' : '0' }}
                >
                  {item.subMenu.map((subItem) => (
                    <li key={subItem.key} className="submenu-item-wrapper">
                      <NavLink
                        to={subItem.path}
                        className={`submenu-item ${isSubMenuActive(subItem) ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Configuration Menu */}
          <div className="footer-config-menu">
            <div className="nav-item-wrapper">
              <div
                className={`nav-item ${isActive(configurationMenu) ? 'active' : ''}`}
                onClick={() => {
                  if (sidebarOpen) {
                    if (configurationMenu.subMenu) {
                      toggleSubMenu(configurationMenu.key);
                    } else {
                      navigate(configurationMenu.path);
                      setMobileMenuOpen(false);
                    }
                  } else {
                    // When sidebar is closed, clicking toggles submenu popover
                    if (configurationMenu.subMenu) {
                      setHoveredMenu(hoveredMenu === configurationMenu.key ? null : configurationMenu.key);
                    } else {
                      navigate(configurationMenu.path);
                      setMobileMenuOpen(false);
                    }
                  }
                }}
              >
                <NavLink
                  to={configurationMenu.path}
                  end={false}
                  className={({ isActive: navIsActive }) =>
                    `nav-link-content ${navIsActive ? 'active' : ''}`
                  }
                  onClick={(e) => {
                    if (configurationMenu.subMenu && sidebarOpen) {
                      e.preventDefault();
                    } else if (!sidebarOpen && configurationMenu.subMenu) {
                      e.preventDefault();
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <i className={configurationMenu.icon + ' ' + (sidebarOpen ? '' : 'config-icon-hidden')}></i>
                  <span className={sidebarOpen ? '' : 'hidden'}>{configurationMenu.label}</span>
                </NavLink>
                {configurationMenu.subMenu && sidebarOpen && (
                  <i className={`fas fa-chevron-${expandedMenus[configurationMenu.key] ? 'up' : 'down'} submenu-icon`}></i>
                )}
              </div>
              {/* Submenu when sidebar is open */}
              {configurationMenu.subMenu && sidebarOpen && (
                <ul 
                  className="submenu"
                  style={{ maxHeight: expandedMenus[configurationMenu.key] ? '500px' : '0' }}
                >
                  {configurationMenu.subMenu.map((subItem) => (
                    <li key={subItem.key} className="submenu-item-wrapper">
                      <NavLink
                        to={subItem.path}
                        className={`submenu-item ${isSubMenuActive(subItem) ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
              {/* Submenu popover when sidebar is closed */}
              {configurationMenu.subMenu && !sidebarOpen && hoveredMenu === configurationMenu.key && (
                <ul className="submenu-popover">
                  {configurationMenu.subMenu.map((subItem) => (
                    <li key={subItem.key} className="submenu-item-wrapper">
                      <NavLink
                        to={subItem.path}
                        className={`submenu-item ${isSubMenuActive(subItem) ? 'active' : ''}`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setHoveredMenu(null);
                        }}
                      >
                        {subItem.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className={`user-info ${sidebarOpen ? '' : 'user-info-hidden'}`}>
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
          
          {/* Logout Button */}
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


