import api from '../utils/api';

export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },

  // Đăng ký
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Đổi mật khẩu
  changePassword: async (oldPassword, newPassword) => {
    return await api.put('/auth/change-password', {
      oldPassword,
      newPassword
    });
  },

  // Quên mật khẩu
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset mật khẩu
  resetPassword: async (token, newPassword) => {
    return await api.post('/auth/reset-password', { token, newPassword });
  },

  // Refresh token
  refreshToken: async () => {
    return await api.post('/auth/refresh-token');
  },

  // Đăng xuất
  logout: async () => {
    return await api.post('/auth/logout');
  }
};

