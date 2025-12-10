import api from '../utils/api';

// Featured products (homepage)
export const featuredProductService = {
  list: () => api.get('/public/homepage/featured-products'),
  create: (payload) => api.post('/admin/homepage/featured-products', payload),
};


