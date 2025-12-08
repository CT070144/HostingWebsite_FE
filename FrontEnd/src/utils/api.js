import axios from 'axios';
import { API_BASE_URL, USE_MOCK_DATA } from './constants';
import { matchMockEndpoint } from './mockService';

export const baseUrl = "http://localhost:8084";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Custom adapter for mock requests
if (USE_MOCK_DATA) {
  const defaultAdapter = axios.defaults.adapter || axios.getAdapter(['xhr', 'http']);
  
  api.defaults.adapter = async (config) => {
    const mockHandler = matchMockEndpoint(config.method.toUpperCase(), config.url);
    
    if (mockHandler) {
      try {
        // Extract data from config
        const requestData = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
        
        // Call mock handler with appropriate arguments
        let mockResponse;
        const method = config.method.toUpperCase();
        const url = config.url;
        
        if (method === 'POST' && url.includes('/auth/login')) {
          mockResponse = await mockHandler(requestData.email, requestData.password);
        } else if (method === 'POST' && url.includes('/auth/register')) {
          mockResponse = await mockHandler(requestData);
        } else if (method === 'POST' && url.includes('/contact')) {
          mockResponse = await mockHandler(requestData);
        } else {
          mockResponse = await mockHandler();
        }
        
        // Return successful mock response
        return Promise.resolve({
          data: mockResponse.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      } catch (mockError) {
        // Return mock error
        return Promise.reject(mockError);
      }
    }
    
    // If no mock handler, use default axios adapter
    return defaultAdapter(config);
  };
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors (both mock and real)
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

