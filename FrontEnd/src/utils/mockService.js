import { MOCK_DELAY } from './constants';

// Import mock data
import authMockData from '../mockData/auth.json';
import servicesMockData from '../mockData/services.json';
import pricingMockData from '../mockData/pricing.json';
import dashboardMockData from '../mockData/dashboard.json';
import contactMockData from '../mockData/contact.json';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service
export const mockService = {
  // Auth endpoints
  async postAuthLogin(...args) {
    await delay(MOCK_DELAY);
    const [email, password] = args;
    
    const user = authMockData.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Email hoặc mật khẩu không đúng'
          }
        }
      };
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = authMockData.tokens[email] || `mock_token_${user.id}_${Date.now()}`;

    return {
      data: {
        token,
        user: userWithoutPassword
      }
    };
  },

  async postAuthRegister(...args) {
    await delay(MOCK_DELAY);
    const userData = args[0] || args[2]; // Can be first or third arg

    // Check if email already exists
    const existingUser = authMockData.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw {
        response: {
          status: 400,
          data: {
            message: 'Email đã được sử dụng'
          }
        }
      };
    }

    // Create new user
    const newUser = {
      id: authMockData.users.length + 1,
      ...userData,
      createdAt: new Date().toISOString(),
      role: 'user'
    };

    const { password, ...userWithoutPassword } = newUser;
    const token = `mock_token_${newUser.id}_${Date.now()}`;

    return {
      data: {
        token,
        user: userWithoutPassword
      }
    };
  },

  async getAuthMe() {
    await delay(MOCK_DELAY);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      };
    }

    // Find user by token
    const email = Object.keys(authMockData.tokens).find(
      email => authMockData.tokens[email] === token
    );

    if (!email) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Invalid token'
          }
        }
      };
    }

    const user = authMockData.users.find(u => u.email === email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword
    };
  },

  async postAuthForgotPassword(email) {
    await delay(MOCK_DELAY);

    const user = authMockData.users.find(u => u.email === email);
    if (!user) {
      throw {
        response: {
          status: 404,
          data: {
            message: 'Email không tồn tại trong hệ thống'
          }
        }
      };
    }

    return {
      data: {
        message: 'Email khôi phục mật khẩu đã được gửi'
      }
    };
  },

  async postAuthLogout() {
    await delay(MOCK_DELAY);
    return {
      data: {
        message: 'Đăng xuất thành công'
      }
    };
  },

  // Services endpoints
  async getServices() {
    await delay(MOCK_DELAY);
    return {
      data: servicesMockData.services
    };
  },

  // Pricing endpoints
  async getPricing() {
    await delay(MOCK_DELAY);
    return {
      data: pricingMockData.plans
    };
  },

  // Dashboard endpoints
  async getDashboard() {
    await delay(MOCK_DELAY);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      };
    }

    return {
      data: dashboardMockData
    };
  },

  // Contact endpoints
  async postContact(...args) {
    await delay(MOCK_DELAY);
    const formData = args[0] || args[2]; // Can be first or third arg
    
    // In real app, this would save to backend
    // For mock, we just return success
    return {
      data: contactMockData.response
    };
  }
};

// Helper function to match URL pattern
export const matchMockEndpoint = (method, url) => {
  const endpoints = {
    'POST:/auth/login': mockService.postAuthLogin,
    'POST:/auth/register': mockService.postAuthRegister,
    'GET:/auth/me': mockService.getAuthMe,
    'POST:/auth/forgot-password': mockService.postAuthForgotPassword,
    'POST:/auth/logout': mockService.postAuthLogout,
    'GET:/services': mockService.getServices,
    'GET:/pricing': mockService.getPricing,
    'GET:/dashboard': mockService.getDashboard,
    'POST:/contact': mockService.postContact
  };

  // Remove base URL and query params
  let cleanUrl = url;
  if (url.includes('/api')) {
    cleanUrl = url.split('/api')[1];
  } else if (url.startsWith('http')) {
    // Full URL, extract path
    try {
      const urlObj = new URL(url);
      cleanUrl = urlObj.pathname;
    } catch (e) {
      cleanUrl = url;
    }
  }
  cleanUrl = cleanUrl.split('?')[0];
  const key = `${method}:${cleanUrl}`;
  
  return endpoints[key] || null;
};

