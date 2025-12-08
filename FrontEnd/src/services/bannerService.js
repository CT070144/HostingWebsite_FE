import api from '../utils/api';

// Quản lý slide/banner cho API thật
export const bannerService = {
  // Public list
  list: () => api.get('/public/homepage/slides'),

  // Admin CRUD (multipart/form-data)
  create: (formData) => api.post('/admin/homepage/slides', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/admin/homepage/slides/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/admin/homepage/slides/${id}`),
};


