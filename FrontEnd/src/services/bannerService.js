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

// Quản lý banner cho trang Hosting
export const hostingBannerService = {
  // Public list - GET /public/homepage/banners
  list: () => api.get('/public/homepage/banners'),

  // Admin CRUD (multipart/form-data)
  create: (formData) => api.post('/admin/homepage/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/admin/homepage/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => api.delete(`/admin/homepage/banners/${id}`),
  // Set active banner (only one can be active)
  setActive: (id) => api.put(`/admin/homepage/banners/${id}/set-active`),
};


