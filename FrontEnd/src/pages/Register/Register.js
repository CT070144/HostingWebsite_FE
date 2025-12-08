import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    identity_number: '',
    address: '',
    ward: '',
    city: '',
    country: 'Vietnam',
    account_type: 'PERSONAL'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidated(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="register-page">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={7}>
              <Card className="register-card shadow">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <i className="fas fa-user-plus fa-3x text-primary mb-3"></i>
                    <h2 className="mb-2">Đăng ký tài khoản</h2>
                    <p className="text-muted">Tạo tài khoản mới để bắt đầu</p>
                  </div>

                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}

                  <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <h5 className="mb-3">Thông tin cá nhân</h5>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Họ <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Nhập họ"
                            required
                            autoFocus
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập họ
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Tên <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Nhập tên"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập tên
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Nhập email"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập email hợp lệ
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập số điện thoại
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>CMND/CCCD <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="identity_number"
                            value={formData.identity_number}
                            onChange={handleChange}
                            placeholder="Nhập số CMND/CCCD"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập số CMND/CCCD
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Loại tài khoản</Form.Label>
                          <Form.Select
                            name="account_type"
                            value={formData.account_type}
                            onChange={handleChange}
                          >
                            <option value="PERSONAL">Cá nhân</option>
                            <option value="BUSINESS">Doanh nghiệp</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h5 className="mb-3 mt-4">Địa chỉ</h5>
                    <Form.Group className="mb-3">
                      <Form.Label>Địa chỉ <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Số nhà, tên đường"
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        Vui lòng nhập địa chỉ
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>Phường/Xã <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="ward"
                            value={formData.ward}
                            onChange={handleChange}
                            placeholder="Nhập phường/xã"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập phường/xã
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>Thành phố <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Nhập thành phố"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập thành phố
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Group>
                          <Form.Label>Quốc gia <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Nhập quốc gia"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng nhập quốc gia
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <h5 className="mb-3 mt-4">Bảo mật</h5>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                            required
                            minLength={6}
                          />
                          <Form.Control.Feedback type="invalid">
                            Mật khẩu phải có ít nhất 6 ký tự
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Xác nhận mật khẩu <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Nhập lại mật khẩu"
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            Vui lòng xác nhận mật khẩu
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label={<span>Tôi đồng ý với các điều khoản và chính sách <span className="text-danger">*</span></span>}
                        required
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang đăng ký...
                        </>
                      ) : (
                        'Đăng ký'
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="mb-0">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary text-decoration-none fw-bold">
                          Đăng nhập ngay
                        </Link>
                      </p>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ProtectedRoute>
  );
};

export default Register;

