import api from '../utils/api';

// CRUD sản phẩm cho API thật
export const productService = {
  list: (params = {}) => api.get('/admin/products', { params }),
  getById: (id) => api.get(`/admin/products/${id}`),
  create: (payload) => api.post('/admin/products', payload),
  update: (id, payload) => api.put(`/admin/products/${id}`, payload),
  remove: (id) => api.delete(`/admin/products/${id}`),
};


