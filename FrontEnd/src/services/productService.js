import api from '../utils/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// CRUD sản phẩm cho API thật
export const productService = {
  // Public endpoints (no auth required)
  listPublic: (params = {}) => api.get('/public/products', { params }),
  getByIdPublic: (id) => api.get(`/public/products/${id}`),
  
  // Admin endpoints (require auth)
  list: (params = {}) => {
    const headers = getAuthHeaders();
    return api.get('/admin/products', { params, headers });
  },
  getById: (id) => {
    const headers = getAuthHeaders();
    return api.get(`/admin/products/${id}`, { headers });
  },
  create: (payload) => {
    const headers = getAuthHeaders();
    return api.post('/admin/products', payload, { headers });
  },
  update: (id, payload) => {
    const headers = getAuthHeaders();
    return api.put(`/admin/products/${id}`, payload, { headers });
  },
  remove: (id) => {
    const headers = getAuthHeaders();
    return api.delete(`/admin/products/${id}`, { headers });
  },
};


