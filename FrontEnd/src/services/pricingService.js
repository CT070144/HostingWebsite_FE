import api from '../utils/api';

export const pricingService = {
  // Lấy danh sách gói pricing
  getPricingPlans: async () => {
    return await api.get('/pricing');
  },

  // Lấy chi tiết gói
  getPlanById: async (id) => {
    return await api.get(`/pricing/${id}`);
  }
};

