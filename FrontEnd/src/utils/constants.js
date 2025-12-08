// Application constants
// Default points to local backend; override via REACT_APP_API_BASE_URL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8084';

// Mock data configuration
// Chỉ bật mock khi REACT_APP_USE_MOCK_DATA === 'true'
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Mock data delay simulation (ms)
export const MOCK_DELAY = parseInt(process.env.REACT_APP_MOCK_DELAY || '500', 10);

export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  PRICING: '/pricing',
  HOSTING: '/hosting',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  FORGOT_PASSWORD: '/forgot-password',
  CONFIG_PRODUCT: '/config-product',
  CART: '/cart'
};
