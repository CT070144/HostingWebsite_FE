import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button,
  FormCheck,
  Table,
  InputGroup,
  Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import hostingMockData from '../../mockData/hosting.json';
import './Cart.css';
import { useNotify } from '../../contexts/NotificationContext';

const Cart = () => {
  const navigate = useNavigate();
  const { notifyWarning } = useNotify();
  const [cartItems, setCartItems] = useState([]);
  const [accountType, setAccountType] = useState('new'); // 'existing' or 'new'
  const [customerType, setCustomerType] = useState('individual'); // 'individual' or 'organization'
  const [language, setLanguage] = useState('vi');
  const [paymentMethod, setPaymentMethod] = useState('vietcombank');
  const [promoCode, setPromoCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    idCard: '',
    fullName: '',
    email: '',
    phone: '',
    street: '',
    country: 'Viet Nam',
    province: 'TP HCM',
    ward: 'Phường An Hội Tây',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Load cart items from localStorage
    const savedItem = localStorage.getItem('cartItem');
    if (savedItem) {
      const item = JSON.parse(savedItem);
      const product = hostingMockData.products.find(p => p.id === item.productId);
      if (product) {
        setCartItems([{
          ...item,
          product: product
        }]);
      }
    }
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getCycleLabel = (cycle) => {
    if (cycle === 12) return '1 năm';
    if (cycle === 24) return '2 năm';
    if (cycle === 36) return '3 năm 1 lần';
    return `${cycle} tháng`;
  };

  const getCyclePeriod = (cycle) => {
    if (cycle === 12) return 'yr';
    if (cycle === 24) return 'yr';
    if (cycle === 36) return 'tri';
    return 'mo';
  };

  // Calculate order summary
  const orderSummary = cartItems.reduce((acc, item) => {
    acc.subtotal += item.subtotal || 0;
    acc.vat += item.vat || 0;
    acc.total += item.total || 0;
    return acc;
  }, { subtotal: 0, vat: 0, total: 0 });

  // Promotional codes from hosting.json
  const promotionalCodes = [
    { code: 'OFF25', discount: 25, description: 'Giảm 25% Microsoft 365 Business Standard' },
    { code: 'OFF5', discount: 5, description: 'Giảm 5% Microsoft 365 Business Premium' },
    { code: 'SERVER10X10', discount: 10, description: 'Giảm 10% Xeon 10-12 Core Series' },
    { code: '90T11', discount: 90, description: 'Giảm 90% VPS & Hosting Việt Nam' },
    { code: '30T11', discount: 30, description: 'Giảm 30% VPS & Hosting Việt Nam' }
  ];

  const handleRemoveItem = (index) => {
    const newItems = cartItems.filter((_, i) => i !== index);
    setCartItems(newItems);
    if (newItems.length === 0) {
      localStorage.removeItem('cartItem');
    }
  };

  const handleContinueShopping = () => {
    navigate('/hosting');
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItem');
  };

  const handleVerifyPromoCode = () => {
    // Logic to verify promo code
    console.log('Verifying promo code:', promoCode);
  };

  const handlePayment = () => {
    if (!agreedToTerms) {
      notifyWarning('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân');
      return;
    }
    // Handle payment logic
    console.log('Processing payment...');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({
      ...formData,
      password,
      confirmPassword: password
    });
  };

  return (
    <div className="cart-page">
      <Container className="py-4">
        <Row>
          {/* Cột trái - Thông tin đơn hàng và thanh toán */}
          <Col lg={8}>
            {/* Phần Sản phẩm/Tùy chọn */}
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0">Sản phẩm/Tùy chọn</h3>
                  <span className="text-muted">Giá/Chu kỳ</span>
                </div>
                
                {cartItems.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">Giỏ hàng của bạn đang trống</p>
                    <Button variant="primary" onClick={handleContinueShopping}>
                      Tiếp tục mua hàng
                    </Button>
                  </div>
                ) : (
                  <>
                    <Table responsive className="cart-table">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Giá/Chu kỳ</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div>
                                <strong>Web Hosting - {item.productName}</strong>
                                <div className="text-muted small">
                                  Chu kỳ: {getCycleLabel(item.paymentCycle)}
                                  {item.dedicatedIP && <div>+ Dedicated IP</div>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div>{formatPrice(item.productPrice)} VND/{getCyclePeriod(item.paymentCycle)}</div>
                              </div>
                            </td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-primary me-2"
                                onClick={() => navigate(`/config-product/${item.productId}`)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    <div className="d-flex gap-2 mt-3">
                      <Button variant="outline-primary" onClick={handleContinueShopping}>
                        Tiếp tục mua hàng
                      </Button>
                      <Button variant="outline-secondary" onClick={() => {}}>
                        Ước tính thuế
                      </Button>
                      <Button variant="outline-danger" onClick={handleClearCart}>
                        Xóa giỏ hàng
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Phần Khuyến mại */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-3">Khuyến mại</h3>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Nhập mã khuyến mại nếu có"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleVerifyPromoCode}>
                    Xác thực mã
                  </Button>
                </InputGroup>
                
                <div className="promo-list">
                  {promotionalCodes.map((promo, index) => (
                    <div key={index} className="promo-item">
                      <div className="promo-info">
                        <strong>{promo.code}</strong> - {promo.description}
                      </div>
                      <i className="fas fa-info-circle text-primary"></i>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Phần Thông tin thanh toán */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-4">Thông tin thanh toán</h3>
                
                {/* Tùy chọn tài khoản */}
                <div className="mb-4">
                  <FormCheck
                    type="radio"
                    id="existing-customer"
                    name="accountType"
                    label="Đăng nhập khách hàng hiện tại"
                    checked={accountType === 'existing'}
                    onChange={() => setAccountType('existing')}
                  />
                  <FormCheck
                    type="radio"
                    id="new-customer"
                    name="accountType"
                    label="Tạo tài khoản mới"
                    checked={accountType === 'new'}
                    onChange={() => setAccountType('new')}
                    className="mt-2"
                  />
                </div>

                {accountType === 'new' && (
                  <>
                    {/* Loại khách hàng */}
                    <div className="customer-type-buttons mb-4">
                      <Button
                        variant={customerType === 'individual' ? 'success' : 'outline-success'}
                        onClick={() => setCustomerType('individual')}
                        className="me-2"
                      >
                        CÁ NHÂN
                      </Button>
                      <Button
                        variant={customerType === 'organization' ? 'success' : 'outline-success'}
                        onClick={() => setCustomerType('organization')}
                      >
                        TỔ CHỨC
                      </Button>
                    </div>

                    {/* Thông tin cá nhân */}
                    <h4 className="mb-3">Thông tin cá nhân</h4>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số CCCD/Passport*</Form.Label>
                          <Form.Control
                            type="text"
                            name="idCard"
                            value={formData.idCard}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Họ tên*</Form.Label>
                          <Form.Control
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Địa chỉ Email*</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Số điện thoại*</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <span className="flag-icon">🇻🇳</span> +84
                            </InputGroup.Text>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="91 234 56 78"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="mb-3">
                      <Form.Label>Chọn ngôn ngữ:</Form.Label>
                      <div className="language-selector">
                        <Button
                          variant={language === 'vi' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => setLanguage('vi')}
                          className="me-2"
                        >
                          🇻🇳 Tiếng Việt
                        </Button>
                        <Button
                          variant={language === 'en' ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={() => setLanguage('en')}
                        >
                          🇬🇧 English
                        </Button>
                      </div>
                    </div>

                    {/* Địa chỉ thanh toán */}
                    <h4 className="mb-3 mt-4">Địa chỉ thanh toán</h4>
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Tên đường*</Form.Label>
                          <Form.Control
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Quốc gia*</Form.Label>
                          <Form.Select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                          >
                            <option>Viet Nam</option>
                            <option>United States</option>
                            <option>Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Tỉnh/Thành phố*</Form.Label>
                          <Form.Select
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                          >
                            <option>TP HCM</option>
                            <option>Hà Nội</option>
                            <option>Đà Nẵng</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Phường/Xã*</Form.Label>
                          <Form.Select
                            name="ward"
                            value={formData.ward}
                            onChange={handleInputChange}
                          >
                            <option>Phường An Hội Tây</option>
                            <option>Phường khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Bảo mật tài khoản */}
                    <h4 className="mb-3 mt-4">Bảo mật tài khoản</h4>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            Mật khẩu*
                            <i className="fas fa-info-circle ms-2 text-muted" title="tối thiểu 5 ký tự"></i>
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            minLength={5}
                          />
                          <Form.Text className="text-muted">tối thiểu 5 ký tự</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Xác nhận mật khẩu*</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button variant="primary" onClick={generatePassword} className="mb-3">
                      <i className="fas fa-sync-alt me-2"></i>
                      Tạo mật khẩu
                    </Button>
                  </>
                )}

                {/* Phương thức thanh toán */}
                <h4 className="mb-3 mt-4">Phương thức thanh toán</h4>
                <Row>
                  <Col md={6}>
                    <FormCheck
                      type="radio"
                      id="vietcombank"
                      name="paymentMethod"
                      label="Vietcombank (VCB)"
                      checked={paymentMethod === 'vietcombank'}
                      onChange={() => setPaymentMethod('vietcombank')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="paypal"
                      name="paymentMethod"
                      label="PayPal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="credit-card-usd"
                      name="paymentMethod"
                      label="Credit Card USD (Visa, Master)"
                      checked={paymentMethod === 'credit-card-usd'}
                      onChange={() => setPaymentMethod('credit-card-usd')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="credit-card-vnd"
                      name="paymentMethod"
                      label="Credit Card VND (Visa, Master, American, JCB)"
                      checked={paymentMethod === 'credit-card-vnd'}
                      onChange={() => setPaymentMethod('credit-card-vnd')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="online-banking"
                      name="paymentMethod"
                      label="Online Banking (ATM, Bank)"
                      checked={paymentMethod === 'online-banking'}
                      onChange={() => setPaymentMethod('online-banking')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      label="Tiền mặt (Cash)"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="payment-method-option"
                    />
                  </Col>
                  <Col md={6}>
                    <FormCheck
                      type="radio"
                      id="payoneer"
                      name="paymentMethod"
                      label="Payoneer"
                      checked={paymentMethod === 'payoneer'}
                      onChange={() => setPaymentMethod('payoneer')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="qr-payment"
                      name="paymentMethod"
                      label="QR Payment (ZaloPay, VNPay, mPay, QR Bank...)"
                      checked={paymentMethod === 'qr-payment'}
                      onChange={() => setPaymentMethod('qr-payment')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="momo"
                      name="paymentMethod"
                      label="MoMo"
                      checked={paymentMethod === 'momo'}
                      onChange={() => setPaymentMethod('momo')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="shopeepay"
                      name="paymentMethod"
                      label="ShopeePay"
                      checked={paymentMethod === 'shopeepay'}
                      onChange={() => setPaymentMethod('shopeepay')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="usdt"
                      name="paymentMethod"
                      label="USDT"
                      checked={paymentMethod === 'usdt'}
                      onChange={() => setPaymentMethod('usdt')}
                      className="payment-method-option"
                    />
                    <FormCheck
                      type="radio"
                      id="usdc"
                      name="paymentMethod"
                      label="USDC"
                      checked={paymentMethod === 'usdc'}
                      onChange={() => setPaymentMethod('usdc')}
                      className="payment-method-option"
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Cột phải - Thông tin đơn hàng */}
          <Col lg={4}>
            <Card className="order-summary-card">
              <Card.Body>
                <h3 className="mb-4">Thông tin đơn hàng</h3>
                
                <div className="order-item mb-3">
                  <div className="order-item-name">Tạm tính</div>
                  <div className="order-item-price">{formatPrice(orderSummary.subtotal)} VND</div>
                </div>

                <div className="order-item mb-3">
                  <div className="order-item-name">VAT @ 10.00%</div>
                  <div className="order-item-price">{formatPrice(orderSummary.vat)} VND</div>
                </div>

                {cartItems.length > 0 && (
                  <div className="order-renewal mb-3">
                    <div className="order-renewal-label">Gia hạn</div>
                    {cartItems.map((item, index) => (
                      <div key={index} className="order-renewal-item">
                        <div className="order-renewal-cycle">{getCycleLabel(item.paymentCycle)}</div>
                        <div className="order-renewal-price">{formatPrice(item.subtotal)} VND</div>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="my-4" />

                <div className="order-total">
                  <div className="order-total-label">Tổng Thành tiền</div>
                  <div className="order-total-price">{formatPrice(orderSummary.total)} VND</div>
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mt-4 payment-button"
                  onClick={handlePayment}
                >
                  <i className="fas fa-arrow-right me-2"></i>
                  Thanh toán
                </Button>

                <FormCheck
                  type="checkbox"
                  id="agree-terms"
                  label="Tôi đã đọc và đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-3 terms-checkbox"
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;

