import api from '../utils/api';

// Quản lý service features cho API thật
export const serviceFeaturesService = {
  // Public list (không cần token)
  list: () => api.get('/public/homepage/service-features'),

  // Admin CRUD (cần token, multipart/form-data)
  create: (formData) => api.post('/admin/homepage/service-features', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/admin/homepage/service-features/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/admin/homepage/service-features/${id}`),
};

