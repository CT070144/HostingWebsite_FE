import api from '../utils/api';

export const dashboardService = {
  // Lấy thông tin dashboard
  getDashboard: async () => {
    return await api.get('/dashboard');
  },

  // Lấy danh sách hosting
  getHostings: async () => {
    return await api.get('/dashboard/hostings');
  },

  // Lấy danh sách domains
  getDomains: async () => {
    return await api.get('/dashboard/domains');
  },

  // Lấy danh sách invoices
  getInvoices: async () => {
    return await api.get('/dashboard/invoices');
  }
};

