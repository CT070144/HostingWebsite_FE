import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { contactService } from '../../services/contactService';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await contactService.submitContact(formData);
      setSuccess('Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', newsletterEmail);
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 3000);
  };

  return (
    <div className="contact-page">
      {/* Contact Form Section */}
      <section className="contact-form-section">
        <Container>
          <div className="contact-form-header">
            <div className="header-content">
              <h1 className="contact-main-heading">
                Liên hệ với chúng tôi. Chúng tôi luôn sẵn sàng hỗ trợ bạn.
              </h1>
            </div>
            <div className="social-icons">
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')} className="mt-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mt-3">
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="contact-form">
            <Row className="form-row">
              <Col md={4} className="form-col">
                <Form.Group className="form-group-custom">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input-custom"
                    placeholder="Nhập họ và tên của bạn"
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="form-col">
                <Form.Group className="form-group-custom">
                  <Form.Label>Địa chỉ email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input-custom"
                    placeholder="Nhập địa chỉ email"
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="form-col">
                <Form.Group className="form-group-custom">
                  <Form.Label>Số điện thoại (tùy chọn)</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input-custom"
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="form-group-custom">
              <Form.Label>Tin nhắn</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="form-input-custom"
                placeholder="Nhập tin nhắn của bạn"
              />
            </Form.Group>
            <Button 
              type="submit" 
              className="btn-submit-custom"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  Gửi tin nhắn cho chúng tôi
                  <i className="fas fa-arrow-right ms-2"></i>
                </>
              )}
            </Button>
          </Form>
        </Container>
      </section>

      {/* Contact Info Section */}
      <section className="contact-info-section">
        <Container>
          <Row>
            <Col md={4}>
              <div className="contact-info-content">
                <h3 className="contact-info-subtitle">Thông tin liên hệ</h3>
                <h2 className="contact-info-title">
                  Chúng tôi luôn sẵn sàng hỗ trợ bạn
                </h2>
              </div>
            </Col>
            <Col md={4}>
              <div className="contact-detail">
                <h4 className="detail-label">Địa chỉ email</h4>
                <p className="detail-value">info@ttcshosting.com</p>
                <p className="detail-hours">
                  Thời gian hỗ trợ: Thứ 2 - Thứ 6, 8:00 - 20:00
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="contact-detail">
                <h4 className="detail-label">Số điện thoại</h4>
                <p className="detail-value">0123 456 789</p>
                <p className="detail-hours">
                  Thời gian hỗ trợ: Thứ 2 - Thứ 6, 8:00 - 20:00
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h2 className="newsletter-heading">Đăng ký nhận bản tin</h2>
              <p className="newsletter-description">
                Đăng ký để cập nhật: Nhận thông tin về các cập nhật mới nhất, 
                thông báo và khuyến mãi đặc biệt bằng cách đăng ký nhận bản tin của chúng tôi.
              </p>
            </Col>
            <Col md={6}>
              <Form onSubmit={handleNewsletterSubmit} className="newsletter-form">
                <div className="newsletter-input-wrapper">
                  <Form.Control
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="newsletter-input"
                  />
                  <Button 
                    type="submit" 
                    className="newsletter-btn"
                  >
                    Đăng ký
                  </Button>
                </div>
                {newsletterSuccess && (
                  <Alert variant="success" className="mt-3 mb-0">
                    Đăng ký thành công! Cảm ơn bạn đã quan tâm.
                  </Alert>
                )}
              </Form>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Contact;
