import api from '../utils/api';

// Quan ly don hang cho API that
export const orderService = {
  // Admin endpoints
  list: (params = {}) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  getStatistics: (dateFilter = 'all') => api.get('/admin/orders/statistics', { params: { date_filter: dateFilter } }),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),

  // User endpoints
  getUserOrders: (params = {}) => api.get('/order', { params }),
  getUserOrderById: (id) => api.get(`/user/order/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),

  // Delete pending order\n  deleteOrder: (id) => api.delete(`/order/${id}`),
};
