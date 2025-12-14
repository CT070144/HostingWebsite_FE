import React, { useState } from 'react';
import './TestAPI.css';
import { productService } from '../services/productService';
import { discountService } from '../services/discountService';
import { bannerService, hostingBannerService } from '../services/bannerService';
import { authService } from '../services/authService';
import { featuredProductService } from '../services/featuredProductService';
import { faqService } from '../services/faqService';
import { serviceFeaturesService } from '../services/serviceFeaturesService';
import { orderService } from '../services/orderService';
import { userService } from '../services/userService';
import { contactService } from '../services/contactService';

const TestAPI = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestParams, setRequestParams] = useState({});

  const apiServices = {
    'Product Service': {
      'GET /public/products': {
        method: () => productService.listPublic({ page: 1, limit: 10 }),
        params: ['page', 'limit', 'sort', 'type', 'min_price', 'max_price'],
      },
      'GET /admin/products': {
        method: () => productService.list({ page: 1, limit: 10 }),
        params: ['page', 'limit'],
      },
      'GET /admin/products/:id': {
        method: () => productService.getById(requestParams.id || ''),
        params: ['id'],
      },
      'POST /admin/products': {
        method: () => productService.create({
          name: requestParams.name || 'Test Product',
          monthlyPrice: Number(requestParams.monthlyPrice) || 100000,
          yearlyPrice: Number(requestParams.yearlyPrice) || 1000000,
          hot: requestParams.hot === 'true',
          discountCodes: [],
          features: {},
        }),
        params: ['name', 'monthlyPrice', 'yearlyPrice', 'hot'],
      },
      'PUT /admin/products/:id': {
        method: () => productService.update(requestParams.id || '', {
          name: requestParams.name || 'Updated Product',
          monthlyPrice: Number(requestParams.monthlyPrice) || 100000,
          yearlyPrice: Number(requestParams.yearlyPrice) || 1000000,
          hot: requestParams.hot === 'true',
          discountCodes: [],
          features: {},
        }),
        params: ['id', 'name', 'monthlyPrice', 'yearlyPrice', 'hot'],
      },
      'DELETE /admin/products/:id': {
        method: () => productService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Discount Service': {
      'GET /admin/discounts': {
        method: () => discountService.list(),
        params: [],
      },
      'POST /admin/discounts': {
        method: () => discountService.create({
          code: requestParams.code || 'TEST2024',
          discount_percent: Number(requestParams.discount_percent) || 10,
          max_cycle: requestParams.max_cycle ? Number(requestParams.max_cycle) : undefined,
          description: requestParams.description || 'Test discount',
        }),
        params: ['code', 'discount_percent', 'max_cycle', 'description'],
      },
      'PUT /admin/discounts/:id': {
        method: () => discountService.update(requestParams.id || '', {
          code: requestParams.code || 'TEST2024',
          discount_percent: Number(requestParams.discount_percent) || 10,
          max_cycle: requestParams.max_cycle ? Number(requestParams.max_cycle) : undefined,
          description: requestParams.description || 'Updated discount',
        }),
        params: ['id', 'code', 'discount_percent', 'max_cycle', 'description'],
      },
      'DELETE /admin/discounts/:id': {
        method: () => discountService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Banner Service': {
      'GET /public/homepage/slides': {
        method: () => bannerService.list(),
        params: [],
      },
      'POST /admin/homepage/slides': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Test Banner');
          formData.append('subtitle', requestParams.subtitle || 'Test Subtitle');
          formData.append('description', requestParams.description || 'Test Description');
          formData.append('image_type', requestParams.image_type || 'URL');
          formData.append('image_url', requestParams.image_url || 'https://via.placeholder.com/800x400');
          return bannerService.create(formData);
        },
        params: ['title', 'subtitle', 'description', 'image_type', 'image_url'],
      },
      'PUT /admin/homepage/slides/:id': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Updated Banner');
          formData.append('subtitle', requestParams.subtitle || 'Updated Subtitle');
          return bannerService.update(requestParams.id || '', formData);
        },
        params: ['id', 'title', 'subtitle', 'description'],
      },
      'DELETE /admin/homepage/slides/:id': {
        method: () => bannerService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Hosting Banner Service': {
      'GET /public/homepage/banners': {
        method: () => hostingBannerService.list(),
        params: [],
      },
      'POST /admin/homepage/banners': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Test Hosting Banner');
          formData.append('subtitle', requestParams.subtitle || 'Test Subtitle');
          formData.append('description', requestParams.description || 'Test Description');
          formData.append('image_type', requestParams.image_type || 'URL');
          formData.append('image_url', requestParams.image_url || 'https://via.placeholder.com/800x400');
          formData.append('price', requestParams.price || '12,750');
          formData.append('price_unit', requestParams.price_unit || 'VNĐ/THÁNG');
          formData.append('features', JSON.stringify(['Feature 1', 'Feature 2']));
          formData.append('promotions', JSON.stringify(['Promo 1', 'Promo 2']));
          return hostingBannerService.create(formData);
        },
        params: ['title', 'subtitle', 'description', 'image_type', 'image_url', 'price', 'price_unit'],
      },
      'PUT /admin/homepage/banners/:id': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Updated Hosting Banner');
          return hostingBannerService.update(requestParams.id || '', formData);
        },
        params: ['id', 'title', 'subtitle'],
      },
      'DELETE /admin/homepage/banners/:id': {
        method: () => hostingBannerService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Auth Service': {
      'POST /login': {
        method: () => authService.login(
          requestParams.email || 'test@example.com',
          requestParams.password || 'password123'
        ),
        params: ['email', 'password'],
      },
      'POST /register': {
        method: () => authService.register({
          name: requestParams.name || 'Test User',
          email: requestParams.email || 'test@example.com',
          password: requestParams.password || 'password123',
        }),
        params: ['name', 'email', 'password'],
      },
      'GET /auth/me': {
        method: () => authService.getCurrentUser(),
        params: [],
      },
    },
    'Featured Product Service': {
      'GET /public/homepage/featured-products': {
        method: () => featuredProductService.list(),
        params: [],
      },
      'POST /admin/homepage/featured-products': {
        method: () => featuredProductService.create({
          title: requestParams.title || 'Test Featured',
          description: requestParams.description || 'Test Description',
          icon: requestParams.icon || 'fas fa-server',
          price: requestParams.price || '100000',
          price_unit: requestParams.price_unit || 'vnđ/tháng',
          link: requestParams.link || '/pricing',
          features: ['Feature 1', 'Feature 2'],
        }),
        params: ['title', 'description', 'icon', 'price', 'price_unit', 'link'],
      },
    },
    'FAQ Service': {
      'GET /public/homepage/faqs': {
        method: () => faqService.list(),
        params: [],
      },
      'POST /admin/homepage/faqs': {
        method: () => faqService.create({
          question: requestParams.question || 'Test Question?',
          answer: requestParams.answer || 'Test Answer',
        }),
        params: ['question', 'answer'],
      },
      'PUT /admin/homepage/faqs/:id': {
        method: () => faqService.update(requestParams.id || '', {
          question: requestParams.question || 'Updated Question?',
          answer: requestParams.answer || 'Updated Answer',
        }),
        params: ['id', 'question', 'answer'],
      },
      'DELETE /admin/homepage/faqs/:id': {
        method: () => faqService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Service Features Service': {
      'GET /public/homepage/service-features': {
        method: () => serviceFeaturesService.list(),
        params: [],
      },
      'POST /admin/homepage/service-features': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Test Feature');
          formData.append('description', requestParams.description || 'Test Description');
          formData.append('icon', requestParams.icon || 'fas fa-server');
          return serviceFeaturesService.create(formData);
        },
        params: ['title', 'description', 'icon'],
      },
      'PUT /admin/homepage/service-features/:id': {
        method: () => {
          const formData = new FormData();
          formData.append('title', requestParams.title || 'Updated Feature');
          return serviceFeaturesService.update(requestParams.id || '', formData);
        },
        params: ['id', 'title', 'description'],
      },
      'DELETE /admin/homepage/service-features/:id': {
        method: () => serviceFeaturesService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Order Service': {
      'GET /admin/orders': {
        method: () => orderService.list({ page: 1, limit: 10 }),
        params: ['page', 'limit'],
      },
      'GET /admin/orders/:id': {
        method: () => orderService.getById(requestParams.id || ''),
        params: ['id'],
      },
      'PATCH /admin/orders/:id/status': {
        method: () => orderService.updateStatus(requestParams.id || '', requestParams.status || 'pending'),
        params: ['id', 'status'],
      },
    },
    'User Service': {
      'GET /admin/users': {
        method: () => userService.list({ page: 1, limit: 10 }),
        params: ['page', 'limit'],
      },
      'GET /admin/users/:id': {
        method: () => userService.getById(requestParams.id || ''),
        params: ['id'],
      },
      'POST /admin/users': {
        method: () => userService.create({
          name: requestParams.name || 'Test User',
          email: requestParams.email || 'test@example.com',
          password: requestParams.password || 'password123',
        }),
        params: ['name', 'email', 'password'],
      },
      'PUT /admin/users/:id': {
        method: () => userService.update(requestParams.id || '', {
          name: requestParams.name || 'Updated User',
          email: requestParams.email || 'updated@example.com',
        }),
        params: ['id', 'name', 'email'],
      },
      'DELETE /admin/users/:id': {
        method: () => userService.remove(requestParams.id || ''),
        params: ['id'],
      },
    },
    'Contact Service': {
      'POST /contact': {
        method: () => contactService.submitContact({
          name: requestParams.name || 'Test User',
          email: requestParams.email || 'test@example.com',
          phone: requestParams.phone || '0123456789',
          message: requestParams.message || 'Test message',
        }),
        params: ['name', 'email', 'phone', 'message'],
      },
    },
  };

  const handleServiceChange = (service) => {
    setSelectedService(service);
    setSelectedMethod('');
    setResponse(null);
    setError(null);
    setRequestParams({});
  };

  const handleMethodChange = (method) => {
    setSelectedMethod(method);
    setResponse(null);
    setError(null);
    // Reset params when method changes
    const params = apiServices[selectedService]?.[method]?.params || [];
    const newParams = {};
    params.forEach(param => {
      newParams[param] = '';
    });
    setRequestParams(newParams);
  };

  const handleParamChange = (key, value) => {
    setRequestParams(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestAPI = async () => {
    if (!selectedService || !selectedMethod) {
      setError({
        message: 'Vui lòng chọn service và method',
        type: 'validation',
      });
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const apiConfig = apiServices[selectedService][selectedMethod];
      const result = await apiConfig.method();
      setResponse({
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: result.headers,
      });
    } catch (err) {
      // Check for CORS error
      const isCorsError = err.message?.includes('CORS') || 
                         err.message?.includes('Network Error') ||
                         err.code === 'ERR_NETWORK' ||
                         (!err.response && err.request);

      if (isCorsError) {
        setError({
          message: 'CORS Error: Không thể kết nối đến API',
          type: 'cors',
          details: 'Backend chưa cho phép CORS từ origin này. Vui lòng cấu hình CORS trên backend để cho phép origin: ' + window.location.origin,
          originalError: err.message,
        });
      } else {
        setError({
          message: err.message,
          type: 'api',
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
          } : null,
          originalError: err.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentParams = selectedService && selectedMethod 
    ? apiServices[selectedService]?.[selectedMethod]?.params || []
    : [];

  return (
    <div className="test-api-container">
      <div className="test-api-header">
        <h1>API Testing Tool</h1>
        <p>Test và xem response của tất cả các API</p>
      </div>

      <div className="test-api-content">
        <div className="test-api-sidebar">
          <h2>Services</h2>
          <div className="service-list">
            {Object.keys(apiServices).map((service) => (
              <div key={service} className="service-item">
                <button
                  className={`service-button ${selectedService === service ? 'active' : ''}`}
                  onClick={() => handleServiceChange(service)}
                >
                  {service}
                </button>
                {selectedService === service && (
                  <div className="method-list">
                    {Object.keys(apiServices[service]).map((method) => (
                      <button
                        key={method}
                        className={`method-button ${selectedMethod === method ? 'active' : ''}`}
                        onClick={() => handleMethodChange(method)}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="test-api-main">
          {selectedService && selectedMethod ? (
            <>
              <div className="api-info">
                <h2>{selectedMethod}</h2>
                <p className="api-description">
                  Service: <strong>{selectedService}</strong>
                </p>
              </div>

              {currentParams.length > 0 && (
                <div className="params-section">
                  <h3>Request Parameters</h3>
                  <div className="params-grid">
                    {currentParams.map((param) => (
                      <div key={param} className="param-item">
                        <label>{param}</label>
                        <input
                          type="text"
                          value={requestParams[param] || ''}
                          onChange={(e) => handleParamChange(param, e.target.value)}
                          placeholder={`Enter ${param}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-section">
                <button
                  className="test-button"
                  onClick={handleTestAPI}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Đang test...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play"></i> Test API
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="response-section error">
                  <h3>
                    {error.type === 'cors' ? (
                      <>
                        <i className="fas fa-exclamation-triangle"></i> CORS Error
                      </>
                    ) : (
                      'Error Response'
                    )}
                  </h3>
                  <div className="response-info">
                    <p><strong>Message:</strong> {error.message}</p>
                    {error.details && (
                      <div className="error-details">
                        <p><strong>Chi tiết:</strong></p>
                        <p>{error.details}</p>
                      </div>
                    )}
                    {error.response && (
                      <>
                        <p><strong>Status:</strong> {error.response.status} {error.response.statusText}</p>
                        <pre>{JSON.stringify(error.response.data, null, 2)}</pre>
                      </>
                    )}
                    {error.type === 'cors' && (
                      <div className="cors-help">
                        <p><strong>Giải pháp:</strong></p>
                        <ul>
                          <li>Kiểm tra backend có chạy đúng không</li>
                          <li>Cấu hình CORS trên backend để cho phép origin: <code>{window.location.origin}</code></li>
                          <li>Đảm bảo API endpoint đúng: <code>http://localhost:8084</code></li>
                        </ul>
                        {error.originalError && (
                          <details style={{ marginTop: '12px' }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Chi tiết lỗi gốc</summary>
                            <pre style={{ marginTop: '8px', fontSize: '12px', background: '#fff', padding: '8px', borderRadius: '4px' }}>
                              {error.originalError}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {response && (
                <div className="response-section success">
                  <h3>Response</h3>
                  <div className="response-info">
                    <p><strong>Status:</strong> {response.status} {response.statusText}</p>
                    <div className="response-tabs">
                      <button className="tab-button active">Data</button>
                    </div>
                    <pre className="response-data">{JSON.stringify(response.data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <i className="fas fa-code fa-3x"></i>
              <p>Chọn một service và method để bắt đầu test API</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestAPI;

