import React, { useState } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';
import logo from '../../assets/logo-hvktmm.png';
const Header = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  return (
    <Navbar 
      expand="lg" 
      fixed="top"
      expanded={expanded}
      onToggle={setExpanded}
      className="custom-navbar"
    >
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img className="logo-img" src={logo} alt="TTCS Hosting" />
          TTCS Hosting
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={isActive('/')}
              onClick={() => setExpanded(false)}
            >
              Trang chủ
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/about" 
              className={isActive('/about')}
              onClick={() => setExpanded(false)}
            >
              Giới thiệu
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/services" 
              className={isActive('/services')}
              onClick={() => setExpanded(false)}
            >
              Dịch vụ
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/pricing" 
              className={isActive('/pricing')}
              onClick={() => setExpanded(false)}
            >
              Bảng giá
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/contact" 
              className={isActive('/contact')}
              onClick={() => setExpanded(false)}
            >
              Liên hệ
            </Nav.Link>
            
            {isAuthenticated ? (
              <NavDropdown 
                title={
                  <span>
                    <i className="fas fa-user-circle me-2"></i>
                    {user?.name || user?.email || 'Tài khoản'}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item as={Link} to="/dashboard" onClick={() => setExpanded(false)}>
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className={isActive('/login')}
                  onClick={() => setExpanded(false)}
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Đăng nhập
                </Nav.Link>
           
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;

