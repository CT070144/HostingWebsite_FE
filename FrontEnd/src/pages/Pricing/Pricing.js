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
        
        // Normalize products data
        const normalizedProducts = productsData.map((p) => ({
          id: p.id,
          name: p.name || '',
          monthlyPrice: p.monthlyPrice || 0,
          yearlyPrice: p.yearlyPrice || 0,
          hot: p.hot || false,
          discountCodes: Array.isArray(p.discountCodes) ? p.discountCodes : [],
          features: p.features && typeof p.features === 'object' ? p.features : {},
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
                      <th>Gói Dịch Vụ</th>
                      {products.map((product) => (
                        <th key={product.id} className={product.hot ? 'hot-column' : ''}>
                          {product.name}
                          {product.hot && <Badge bg="danger" className="ms-2">HOT</Badge>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Giá</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>
                          {formatPrice(product.monthlyPrice)} vnđ/tháng
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>SSD</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.ssd || '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>RAM</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.ram || '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>CPU</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.cpu || '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Website</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.websites !== undefined ? product.features.websites : '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Tài Khoản Emails</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.emails !== undefined ? product.features.emails : '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Băng thông, MySQL</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.bandwidth || '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>SSL, Backup, Chuyển dữ liệu</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.ssl || '-'}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><strong>Kho Themes & Plugins mới nhất</strong></td>
                      {products.map((product) => (
                        <td key={product.id}>{product.features.themesPlugins || '-'}</td>
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

