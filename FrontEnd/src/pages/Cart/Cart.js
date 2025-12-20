import React, { useState } from 'react';
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
import './Cart.css';
import { useNotify } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { cartService } from '../../services/cartService';
import { userService } from '../../services/userService';

const Cart = () => {
  const navigate = useNavigate();
  const { notifyWarning, notifySuccess, notifyError } = useNotify();
  const { user } = useAuth();
  const { cartItems, cart, loading: cartLoading, removeFromCart, clearCart, fetchCart, updateCartItem, getCartSubtotal, getCartVAT, getCartTotal } = useCart();
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
    confirmPassword: '',
    notes: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile from API
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setLoadingProfile(true);
          const response = await userService.getProfile();
          const profileData = response.data?.user || response.data;
          setUserProfile(profileData);
          
          // Pre-fill form with profile data
          if (profileData) {
            setFormData(prev => ({
              ...prev,
              email: profileData.Email || prev.email,
              fullName: `${profileData.FirstName || ''} ${profileData.LastName || ''}`.trim() || prev.fullName,
              phone: profileData.PhoneNumber || prev.phone,
              street: profileData.Address || prev.street,
              country: profileData.Country || prev.country || 'Viet Nam',
              province: profileData.City || prev.province || 'TP HCM',
              ward: profileData.Ward || prev.ward || 'Phường An Hội Tây',
              idCard: profileData.IdentityNumber || prev.idCard,
            }));
            
            // Set customer type based on AccountType
            if (profileData.AccountType) {
              if (profileData.AccountType === 'PERSONAL') {
                setCustomerType('individual');
              } else if (profileData.AccountType === 'ORGANIZATION') {
                setCustomerType('organization');
              }
            }
            
            // Set account type to existing if user has profile
            setAccountType('existing');
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // If profile fetch fails, still allow form to be filled manually
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Pre-fill form with user data if logged in (fallback)
  React.useEffect(() => {
    if (user && accountType === 'existing' && !userProfile) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.fullName,
      }));
    }
  }, [user, accountType, userProfile]);

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

  // Calculate order summary using cart context
  const orderSummary = {
    subtotal: getCartSubtotal(),
    vat: getCartVAT(),
    total: getCartTotal(),
  };

  // Promotional codes from hosting.json
  const promotionalCodes = [
    { code: 'OFF25', discount: 25, description: 'Giảm 25% Microsoft 365 Business Standard' },
    { code: 'OFF5', discount: 5, description: 'Giảm 5% Microsoft 365 Business Premium' },
    { code: 'SERVER10X10', discount: 10, description: 'Giảm 10% Xeon 10-12 Core Series' },
    { code: '90T11', discount: 90, description: 'Giảm 90% VPS & Hosting Việt Nam' },
    { code: '30T11', discount: 30, description: 'Giảm 30% VPS & Hosting Việt Nam' }
  ];

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      notifySuccess('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      console.error('Failed to remove item:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Xóa sản phẩm khỏi giỏ hàng thất bại';
      notifyError(errorMessage);
    }
  };

  const handleContinueShopping = () => {
    navigate('/hosting');
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      try {
        await clearCart();
        notifySuccess('Đã xóa tất cả sản phẩm khỏi giỏ hàng');
      } catch (error) {
        console.error('Failed to clear cart:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Xóa giỏ hàng thất bại';
        notifyError(errorMessage);
      }
    }
  };

  const handleVerifyPromoCode = () => {
    // Logic to verify promo code
    console.log('Verifying promo code:', promoCode);
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      notifyWarning('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân');
      return;
    }
    
    if (cartItems.length === 0) {
      notifyWarning('Giỏ hàng của bạn đang trống');
      return;
    }

    try {
      // Prepare checkout data
      const cartItemIds = cartItems
        .filter(item => item.cartItemId)
        .map(item => item.cartItemId);
      
      if (cartItemIds.length === 0) {
        notifyError('Không có sản phẩm hợp lệ để thanh toán');
        return;
      }

      const checkoutData = {
        cart_item_ids: cartItemIds,
        payment_method: paymentMethod,
        notes: formData.notes || '',
      };

      await cartService.checkout(checkoutData);
      notifySuccess('Thanh toán thành công!');
      
      // Clear cart and redirect
      await clearCart();
      navigate('/dashboard');
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Thanh toán thất bại';
      notifyError(errorMessage);
    }
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
                
                {cartLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Đang tải giỏ hàng...</p>
                  </div>
                ) : cartItems.length === 0 ? (
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
                          <th>Số lượng</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div>
                                <strong>{item.productName || item.product?.name || 'Sản phẩm'}</strong>
                                <div className="small">
                                  Chu kỳ: {getCycleLabel(item.paymentCycle || item.billingCycle)}
                                  
                                  {/* Display addons */}
                                  {item.addonsApplied && item.addonsApplied.length > 0 && (
                                    <div className="mt-2">
                                      <div className="fw-bold">Add-ons:</div>
                                      {item.addonsApplied.map((addon, idx) => (
                                        <div key={idx} className="text-muted">
                                          + {addon.addon_type}: {addon.quantity} {addon.unit}
                                          {addon.total_price && (
                                            <span className="ms-2">({formatPrice(addon.total_price)} VND)</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Display discount */}
                                  {item.discountCode && (
                                    <div className="text-success mt-1">
                                      <i className="fas fa-tag me-1"></i>
                                      Mã giảm giá: {item.discountCode} 
                                      {item.discountPercent > 0 && (
                                        <span> (-{item.discountPercent}%)</span>
                                      )}
                                      {item.discountAmount > 0 && (
                                        <span className="ms-2">-{formatPrice(item.discountAmount)} VND</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div>{formatPrice(item.unitPrice || item.productPrice || 0)} VND/{getCyclePeriod(item.paymentCycle || item.billingCycle)}</div>
                                
                                {/* Show unit price breakdown */}
                                {item.quantity > 1 && (
                                  <div className="text-muted small">
                                    x{item.quantity} = {formatPrice((item.unitPrice || item.productPrice || 0) * item.quantity)} VND
                                  </div>
                                )}
                                
                                {/* Show discount if exists */}
                                {item.discountAmount > 0 && (
                                  <div className="text-success small">
                                    Giảm: -{formatPrice(item.discountAmount)} VND
                                  </div>
                                )}
                                
                                <div className="text-muted small mt-1">
                                  Tổng: {formatPrice(item.totalPrice || item.total || 0)} VND
                                </div>
                              </div>
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                value={
                                 'x' + (item.quantity || 1)}
                                readOnly
                                style={{ width: '70px', textAlign: 'center', backgroundColor: '#f8f9fa' }}
                              />
                            </td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-primary me-2"
                                onClick={() => navigate(`/config-product/${item.productId}`)}
                                title="Chỉnh sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="text-danger"
                                onClick={() => handleRemoveItem(item.id)}
                                title="Xóa"
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
                
              

                {accountType === 'existing' && user && (
                  <>
                 

                    {/* Hiển thị form thông tin đã điền sẵn từ profile */}
                    {userProfile && !loadingProfile && (
                      <>
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
                      </>
                    )}
                  </>
                )}

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

