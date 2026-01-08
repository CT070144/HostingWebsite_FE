import api from '../utils/api';

// OS Template service
export const osTemplateService = {
  // Get all OS templates (public endpoint)
  list: () => api.get('/public/os-templates'),

  // Get all OS templates (admin endpoint)
  listAdmin: () => api.get('/public/os-templates'),
  
  // Get OS template by ID
  getById: (templateId) => api.get(`/public/os-templates/${templateId}`),
};

