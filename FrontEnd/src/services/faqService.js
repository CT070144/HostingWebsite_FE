import api from '../utils/api';

// Quản lý FAQs cho API thật
export const faqService = {
  // Public list (không cần token)
  list: () => api.get('/public/homepage/faqs'),

  // CRUD cho admin (cần token)
  create: (payload) => api.post('/admin/homepage/faqs', payload),
  update: (id, payload) => api.put(`/admin/homepage/faqs/${id}`, payload),
  remove: (id) => api.delete(`/admin/homepage/faqs/${id}`),
};


