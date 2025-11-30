import api from '../utils/api';

export const contactService = {
  // Gửi form liên hệ
  submitContact: async (formData) => {
    return await api.post('/contact', formData);
  }
};

