import api from '../utils/api';

// Quản lý đơn hàng cho API thật
export const orderService = {
  // Admin endpoints
  list: (params = {}) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  
  // User endpoints
  getUserOrders: (params = {}) => api.get('/order', { params }),
  getUserOrderById: (id) => api.get(`/user/order/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
};


