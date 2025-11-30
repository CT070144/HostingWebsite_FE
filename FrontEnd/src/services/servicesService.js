import api from '../utils/api';

export const servicesService = {
  // Lấy danh sách dịch vụ
  getServices: async () => {
    return await api.get('/services');
  },

  // Lấy chi tiết dịch vụ
  getServiceById: async (id) => {
    return await api.get(`/services/${id}`);
  }
};

