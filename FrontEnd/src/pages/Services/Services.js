import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import './Services.css';
import servicesMockData from '../../mockData/services.json';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setServices(servicesMockData.services);
    setLoading(false);
  }, []);

  return (
    <div className="services-page">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 section-title mb-4">Dịch vụ của chúng tôi</h1>
          <p className="lead">
            Cung cấp đầy đủ các giải pháp hosting cho mọi nhu cầu
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
          <Row>
            {services.map((service) => (
              <Col md={4} key={service.id} className="mb-4">
                <Card className="service-card h-100">
                  <Card.Body className="text-center p-4">
                    <i className={`${service.icon} fa-3x text-primary mb-3`}></i>
                    <Card.Title>{service.title}</Card.Title>
                    <Card.Text>{service.description}</Card.Text>
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

export default Services;

