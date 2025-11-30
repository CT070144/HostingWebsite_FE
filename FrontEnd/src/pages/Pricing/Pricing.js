import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { pricingService } from '../../services/pricingService';
import './Pricing.css';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        const response = await pricingService.getPricingPlans();
        setPlans(response.data);
        setError(null);
      } catch (err) {
        setError('Không thể tải bảng giá');
        console.error('Pricing error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
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
                  <Card.Body className="text-center p-4">
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
      </Container>
    </div>
  );
};

export default Pricing;

