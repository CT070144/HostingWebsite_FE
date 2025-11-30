// Application constants
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// Mock data configuration
// In production, default to false. In development, default to true
export const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true' || 
  (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_USE_MOCK_DATA !== 'false');

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
  FORGOT_PASSWORD: '/forgot-password'
};
