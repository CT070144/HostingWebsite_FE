import api from '../utils/api';

export const contactService = {
  // Gửi form liên hệ
  // POST /public/contact
  // Body: { name, email, phone, message }
  submitContact: async (formData) => {
    const payload = {
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      message: formData.message || '',
    };
    return await api.post('/public/contact', payload);
  }
};

