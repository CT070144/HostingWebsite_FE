import api from '../utils/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// CRUD cho mã giảm giá
export const discountService = {
  list: () => {
    const headers = getAuthHeaders();
    return api.get('/admin/discounts', { headers });
  },
  create: (payload) => {
    const headers = getAuthHeaders();
    return api.post('/admin/discounts', payload, { headers });
  },
  update: (id, payload) => {
    const headers = getAuthHeaders();
    return api.put(`/admin/discounts/${id}`, payload, { headers });
  },
  remove: (id) => {
    const headers = getAuthHeaders();
    return api.delete(`/admin/discounts/${id}`, { headers });
  },
};


