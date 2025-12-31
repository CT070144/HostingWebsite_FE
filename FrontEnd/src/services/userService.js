import api from '../utils/api';

// CRUD người dùng cho API thật
export const userService = {
  list: (params = {}) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (payload) => api.post('/admin/users', payload),
  update: (id, payload) => api.put(`/admin/users/${id}`, payload),
  remove: (id) => api.delete(`/admin/users/${id}`),
  
  // Get user profile (for authenticated user)
  getProfile: () => api.get('/user/profile'),

  // Update user profile (for authenticated user)
  updateProfile: (payload) => api.put('/user/profile', payload),
};


