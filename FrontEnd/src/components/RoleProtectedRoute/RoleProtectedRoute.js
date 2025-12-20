import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

/**
 * RoleProtectedRoute - Protects routes based on user role
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 * @param {string|string[]} allowedRoles - Role(s) allowed to access (e.g., 'admin', 'user', or ['admin', 'user'])
 * @param {string} redirectTo - Path to redirect if unauthorized (default: '/login' for unauthenticated, '/' for wrong role)
 */
const RoleProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = null,
  redirectTo = null 
}) => {
  const { isAuthenticated, loading, user, isAdmin, isUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  // Check role if specified
  if (allowedRoles && isAuthenticated) {
    const userRole = user?.role;
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasAccess = rolesArray.includes(userRole);

    if (!hasAccess) {
      // Redirect based on user role
      if (isAdmin()) {
        return <Navigate to={redirectTo || '/admin/dashboard'} replace />;
      } else if (isUser()) {
        return <Navigate to={redirectTo || '/dashboard'} replace />;
      } else {
        return <Navigate to={redirectTo || '/'} replace />;
      }
    }
  }

  // If not requiring auth and user is authenticated, redirect away (for login/register pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect admin to admin dashboard, user to client dashboard
    if (isAdmin()) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;

