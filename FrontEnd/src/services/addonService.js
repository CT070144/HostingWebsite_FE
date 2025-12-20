import api from '../utils/api';

// Addon service for fetching addons
export const addonService = {
  // Get all addons (public/admin endpoint)
  getAddons: () => api.get('/admin/addons'),
  // Create new addon
  create: (payload) => api.post('/admin/addons', payload),
  // Update addon
  update: (id, payload) => api.put(`/admin/addons/${id}`, payload),
  // Delete addon
  remove: (id) => api.delete(`/admin/addons/${id}`),
};

