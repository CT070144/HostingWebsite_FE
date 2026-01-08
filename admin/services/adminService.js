import api from '../utils/api';

export const adminService = {
  // Lấy thông tin admin dashboard
  getAdminDashboard: async () => {
    return await api.get('/admin/dashboard');
  },

  // Lấy danh sách đơn hàng
  getOrders: async (params = {}) => {
    return await api.get('/admin/orders', { params });
  },

  // Lấy danh sách người dùng
  getUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  // Lấy danh sách sản phẩm
  getProducts: async (params = {}) => {
    return await api.get('/admin/products', { params });
  },

  // Lấy thông tin thống kê
  getStats: async () => {
    return await api.get('/admin/stats');
  },

  // Lấy thông báo
  getNotifications: async () => {
    return await api.get('/admin/notifications');
  }
};

