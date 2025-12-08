import api from '../utils/api';

// Quản lý đơn hàng cho API thật
export const orderService = {
  list: (params = {}) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
};


