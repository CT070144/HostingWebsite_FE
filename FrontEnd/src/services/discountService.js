import api from '../utils/api';

// CRUD cho mã giảm giá
export const discountService = {
  list: () => api.get('/admin/discounts'),
  create: (payload) => api.post('/admin/discounts', payload),
  update: (id, payload) => api.put(`/admin/discounts/${id}`, payload),
  remove: (id) => api.delete(`/admin/discounts/${id}`),
};


