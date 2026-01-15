import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import pricingMockData from '../../mockData/pricing.json';
import hostingMockData from '../../mockData/hosting.json';
import { productService } from '../../services/productService';
import './Pricing.css';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    // Load pricing plans
    setLoading(false);
    setPlans(pricingMockData.plans);
    setError(null);
    
    // Fetch products from API for comparison table
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await productService.listPublic();
        
        // Handle response format: { products: [...] } or direct array
        let productsData = [];
        if (res.data?.products && Array.isArray(res.data.products)) {
          productsData = res.data.products;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (Array.isArray(res.data?.data)) {
          productsData = res.data.data;
        }
        
        // Normalize products data to new API format
        const normalizedProducts = productsData.map((p) => ({
          id: p.id,
          name: p.name || '',
          service_type: p.service_type || '',
          monthlyPrice: p.monthlyPrice ?? p.price_monthly ?? 0,
          yearlyPrice: p.yearlyPrice ?? p.price_annually ?? 0,
          hot: p.hot ?? p.is_hot ?? false,
          is_active: p.is_active ?? true,
          discount: p.discount || null,
          spec: p.spec || null,
          // Map spec.attributes to features for backward compatibility
          features: p.spec?.attributes && typeof p.spec.attributes === 'object' ? p.spec.attributes : (p.features && typeof p.features === 'object' ? p.features : {}),
        }));
        
        setProducts(normalizedProducts);
      } catch (err) {
        console.error('Failed to fetch products from API:', err);
        // Fallback to mock data on error
        setProducts(hostingMockData.products || []);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="pricing-page">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-4">Bảng giá</h1>
          <p className="lead">
            Chọn gói hosting phù hợp với nhu cầu của bạn
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Row className="justify-content-center">
            {plans.map((plan) => (
              <Col md={4} key={plan.id} className="mb-4">
                <Card className={`pricing-card h-100 ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && (
                    <div className="popular-badge">Phổ biến</div>
                  )}
                  <Card.Body className="text-center d-flex flex-column justify-content-between p-4">
                   <div className="pricing-card-content">
                   <Card.Title className="h3 mb-3">{plan.name}</Card.Title>
                    <div className="price mb-3">
                      <span className="currency">đ</span>
                      <span className="amount">{formatPrice(plan.price)}</span>
                      <span className="period">/{plan.period}</span>
                    </div>
                  <ListGroup variant="flush" className="mb-4">
                    {plan.features.map((feature, idx) => (
                      <ListGroup.Item key={idx}>
                        <i className="fas fa-check text-success me-2"></i>
                        {feature}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                   </div>
                  <Button 
                    as={Link} 
                    to="/contact" 
                    variant={plan.popular ? 'primary' : 'outline-primary'}
                    size="lg"
                    className="w-100"
                  >
                    Đăng ký ngay
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        )}

        {/* Comparison Table Section */}
        <section className="hosting-comparison-section py-5">
          <Container>
            <h2 className="section-title text-center mb-5">
              SO SÁNH CÁC GÓI WEB HOSTING GIÁ RẺ TẠI TTCS HOSTING
            </h2>
            {loadingProducts ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-5">
                <p>Không có sản phẩm nào để so sánh.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="comparison-table">
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#e3f2fd', minWidth: '200px' }}>Gói Dịch Vụ</th>
                      {products.map((product) => (
                        <th key={product.id} className={product.hot ? 'hot-column' : ''} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <div>
                            <strong>{product.name}</strong>
                            {product.hot && <Badge bg="danger" className="ms-2">HOT</Badge>}
                          </div>
                          {product.discount && product.discount.code && (
                            <div className="mt-2">
                              <Badge bg="success" className="small">
                                Mã: {product.discount.code} (-{product.discount.discount_percent}%)
                              </Badge>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Giá */}
                    <tr>
                      <td style={{ backgroundColor: '#f5f5f5' }}><strong>Giá</strong></td>
                      {products.map((product) => (
                        <td key={product.id} style={{ textAlign: 'center' }}>
                          <div>
                            <strong className="text-primary">{formatPrice(product.monthlyPrice)}</strong> vnđ/tháng
                          </div>
                          {product.yearlyPrice > 0 && (
                            <div className="text-muted small mt-1">
                              {formatPrice(product.yearlyPrice)} vnđ/năm
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Loại dịch vụ */}
                    <tr>
                      <td style={{ backgroundColor: '#f5f5f5' }}><strong>Loại dịch vụ</strong></td>
                      {products.map((product) => (
                        <td key={product.id} style={{ textAlign: 'center' }}>
                          {product.service_type || '-'}
                        </td>
                      ))}
                    </tr>

                    {/* Tên gói */}
                    {products.some(p => p.spec?.spec_name) && (
                      <tr>
                        <td style={{ backgroundColor: '#f5f5f5' }}><strong>Tên gói</strong></td>
                        {products.map((product) => (
                          <td key={product.id} style={{ textAlign: 'center' }}>
                            {product.spec?.spec_name || '-'}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Vị trí */}
                    {products.some(p => p.spec?.location) && (
                      <tr>
                        <td style={{ backgroundColor: '#f5f5f5' }}><strong>Vị trí</strong></td>
                        {products.map((product) => (
                          <td key={product.id} style={{ textAlign: 'center' }}>
                            {product.spec?.location || '-'}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Attributes động */}
                    {(() => {
                      const allAttributeKeys = new Set();
                      products.forEach(product => {
                        if (product.spec?.attributes && typeof product.spec.attributes === 'object') {
                          Object.keys(product.spec.attributes).forEach(key => allAttributeKeys.add(key));
                        }
                        if (product.features && typeof product.features === 'object') {
                          Object.keys(product.features).forEach(key => allAttributeKeys.add(key));
                        }
                      });

                      // Map keys to their normalized label names (for grouping)
                      const keyToLabelMap = {
                        'CPU Cores': 'CPU Cores',
                        cpuCores: 'CPU Cores',
                        cpu: 'CPU Cores',
                        'RAM': 'RAM',
                        'RAM ': 'RAM',
                        ramGB: 'RAM',
                        ram: 'RAM',
                        storageGB: 'Storage',
                        diskSpaceGB: 'Storage',
                        ssd: 'Storage',
                        bandwidthTB: 'Băng thông',
                        bandwidth: 'Băng thông',
                        'Storagepooltype': 'Loại ổ cứng',
                        'StoragePoolType': 'Loại ổ cứng',
                        storagePoolType: 'Loại ổ cứng',
                        storagepooltype: 'Loại ổ cứng',
                        addonDomains: 'Addon Domains',
                        controlPanel: 'Control Panel',
                        databaseLimit: 'Database Limit',
                        websites: 'Website',
                        emails: 'Tài Khoản Emails',
                        ssl: 'SSL, Backup',
                        themesPlugins: 'Themes & Plugins',
                        resourceIdentifier: 'Resource Identifier',
                        unitOfMeasure: 'Đơn vị đo',
                        unitPrice: 'Giá đơn vị',
                      };

                      // Format attribute label (fallback for keys not in map)
                      const formatAttributeLabel = (key) => {
                        const normalizedLabel = keyToLabelMap[key];
                        if (normalizedLabel) return normalizedLabel;
                        
                        // For keys not in map, format properly without splitting single letters
                        // Convert camelCase to Title Case, but keep acronyms together
                        const formatted = key
                          .replace(/([A-Z])/g, ' $1') // Add space before uppercase
                          .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                          .trim();
                        
                        // Don't split if it results in single letters separated
                        return key;
                      };

                      // Get normalized label for a key
                      const getNormalizedLabel = (key) => {
                        return keyToLabelMap[key] || formatAttributeLabel(key);
                      };

                      // Group keys by their normalized label
                      const labelGroups = {};
                      allAttributeKeys.forEach(key => {
                        const label = getNormalizedLabel(key);
                        if (!labelGroups[label]) {
                          labelGroups[label] = [];
                        }
                        // Avoid duplicate keys in the same group
                        if (!labelGroups[label].includes(key)) {
                          labelGroups[label].push(key);
                        }
                      });

                      // Format attribute value based on key
                      const formatAttributeValue = (keys, product) => {
                        // Try each key in the group to find a value
                        let value = null;
                        let usedKey = null;
                        
                        for (const key of keys) {
                          const val = product.spec?.attributes?.[key] ?? product.features?.[key];
                          if (val !== null && val !== undefined && val !== '') {
                            value = val;
                            usedKey = key;
                            break;
                          }
                        }
                        
                        if (value === null || value === undefined || value === '') return '-';
                        
                        // Format based on the key that was used
                        if (usedKey === 'ramGB' || usedKey === 'storageGB' || usedKey === 'diskSpaceGB' || usedKey === 'ssd') {
                          return `${value} GB`;
                        }
                        if (usedKey === 'bandwidthTB' || usedKey === 'bandwidth') {
                          // Check if already has unit
                          const str = String(value);
                          if (str.includes('TB') || str.includes('GB') || str.includes('MySQL')) {
                            return str;
                          }
                          return `${value} TB`;
                        }
                        if (usedKey === 'cpuCores') {
                          return `${value} cores`;
                        }
                        if (usedKey === 'cpu' || usedKey === 'CPU Cores') {
                          // If value is a number, add "cores"
                          if (typeof value === 'number' || !isNaN(Number(value))) {
                            return `${value} cores`;
                          }
                          return String(value);
                        }
                        if (usedKey === 'ramGB' || usedKey === 'ram' || usedKey === 'RAM' || usedKey === 'RAM ') {
                          // If value is a number, add "GB"
                          if (typeof value === 'number' || !isNaN(Number(value))) {
                            return `${value} GB`;
                          }
                          return String(value);
                        }
                        if (usedKey === 'unitPrice') {
                          return formatPrice(value);
                        }
                        
                        return String(value);
                      };

                      // Convert grouped labels to array and sort
                      const sortedLabels = Object.keys(labelGroups).sort();

                      return sortedLabels.map(label => {
                        const keys = labelGroups[label];
                        return (
                          <tr key={label}>
                            <td style={{ backgroundColor: '#f5f5f5' }}>
                              <strong>{label}</strong>
                            </td>
                            {products.map((product) => {
                              const value = formatAttributeValue(keys, product);
                              return (
                                <td key={product.id} style={{ textAlign: 'center' }}>
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      });
                    })()}

                    {/* Nút Đặt hàng */}
                    <tr>
                      <td style={{ backgroundColor: '#f5f5f5', border: 'none' }}></td>
                      {products.map((product) => (
                        <td key={product.id} style={{ textAlign: 'center', padding: '20px', border: 'none' }}>
                          <Button
                            as={Link}
                            to={`/config-product/${product.id}`}
                            variant="primary"
                            className="btn-primary-custom"
                            style={{ width: '100%', maxWidth: '200px' }}
                          >
                            ĐẶT HÀNG
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}
          </Container>
        </section>
      </Container>
    </div>
  );
};

export default Pricing;

