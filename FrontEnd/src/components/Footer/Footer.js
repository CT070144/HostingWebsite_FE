import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer custom-footer mt-5">
      <Container>
        <Row className="py-4">
          <Col md={4} className="mb-3">
            <h5>
              <i className="fas fa-server me-2"></i>
              TTCS Hosting
            </h5>
            <p>
              Dịch vụ hosting chuyên nghiệp, uy tín và chất lượng cao.
              Cam kết mang đến trải nghiệm tốt nhất cho khách hàng.
            </p>
          </Col>
          <Col md={4} className="mb-3">
            <h5>Liên kết nhanh</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-light text-decoration-none">Trang chủ</Link></li>
              <li><Link to="/about" className="text-light text-decoration-none">Giới thiệu</Link></li>
              <li><Link to="/services" className="text-light text-decoration-none">Dịch vụ</Link></li>
              <li><Link to="/pricing" className="text-light text-decoration-none">Bảng giá</Link></li>
              <li><Link to="/contact" className="text-light text-decoration-none">Liên hệ</Link></li>
            </ul>
          </Col>
          <Col md={4} className="mb-3">
            <h5>Liên hệ</h5>
            <ul className="list-unstyled">
              <li><i className="fas fa-envelope me-2"></i> info@ttcshosting.com</li>
              <li><i className="fas fa-phone me-2"></i> 0123 456 789</li>
              <li><i className="fas fa-map-marker-alt me-2"></i> Việt Nam</li>
            </ul>
            <div className="social-links mt-3">
              <a href="#" className="text-light me-3"><i className="fab fa-facebook fa-lg"></i></a>
              <a href="#" className="text-light me-3"><i className="fab fa-twitter fa-lg"></i></a>
              <a href="#" className="text-light me-3"><i className="fab fa-linkedin fa-lg"></i></a>
              <a href="#" className="text-light"><i className="fab fa-github fa-lg"></i></a>
            </div>
          </Col>
        </Row>
        <Row>
          <Col className="text-center py-3 border-top">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} TTCS Hosting. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

