import React, { useMemo, useState } from 'react';
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
  Alert,
  Modal,
  Nav,
  Tab
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
  const { cartItems, loading: cartLoading, removeFromCart, clearCart, fetchCart } = useCart();
  const [accountType, setAccountType] = useState('new'); // 'existing' or 'new'
  const [customerType, setCustomerType] = useState('individual'); // 'individual' or 'organization'
  const [language, setLanguage] = useState('vi');
  const [paymentMethod, setPaymentMethod] = useState('payos');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedCartItemMap, setSelectedCartItemMap] = useState({}); // { [cartItemId]: true/false }
  const [showMissingInfoAlert, setShowMissingInfoAlert] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

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

  // Sync selection with cart items (default: selected)
  React.useEffect(() => {
    setSelectedCartItemMap((prev) => {
      const next = {};
      (cartItems || []).forEach((item) => {
        const id = item?.cartItemId || item?.id;
        if (!id) return;
        next[id] = prev[id] ?? true;
      });
      return next;
    });
  }, [cartItems]);

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
    const numCycle = typeof cycle === 'string' ? parseInt(cycle) : cycle;
    if (numCycle === 3) return '3 tháng';
    if (numCycle === 6) return '6 tháng';
    if (numCycle === 12) return '1 năm';
    return `${numCycle} tháng`;
  };

  const getCyclePeriod = (cycle) => {
    if (cycle === 3) return 'mo';
    if (cycle === 6) return 'mo';
    if (cycle === 12) return 'yr';
    return 'mo';
  };

  const selectedItems = useMemo(() => {
    const items = cartItems || [];
    return items.filter((item) => {
      const id = item?.cartItemId || item?.id;
      return !!id && !!selectedCartItemMap[id];
    });
  }, [cartItems, selectedCartItemMap]);

  const selectedCartItemIds = useMemo(() => {
    return selectedItems
      .map((item) => item?.cartItemId || item?.id)
      .filter(Boolean);
  }, [selectedItems]);

  const selectedTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const v = item?.totalPrice ?? item?.total ?? 0;
      return sum + (typeof v === 'number' ? v : Number(v) || 0);
    }, 0);
  }, [selectedItems]);

  const missingPaymentInfoFields = useMemo(() => {
    const missing = [];
    const fullName = (formData.fullName || '').trim();
    const email = (formData.email || '').trim();
    const phone = (formData.phone || '').trim();
    const idCard = (formData.idCard || '').trim();
    const street = (formData.street || '').trim();
    const country = (formData.country || '').trim();
    const province = (formData.province || '').trim();
    const ward = (formData.ward || '').trim();

    if (!fullName) missing.push('Họ tên');
    if (!email || !email.includes('@')) missing.push('Email');
    if (!phone) missing.push('Số điện thoại');
    if (!idCard) missing.push('Số CCCD/Passport');
    if (!street) missing.push('Tên đường/Địa chỉ');
    if (!country) missing.push('Quốc gia');
    if (!province) missing.push('Tỉnh/Thành phố');
    if (!ward) missing.push('Phường/Xã');

    return missing;
  }, [formData]);

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      setSelectedCartItemMap((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
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

  const handlePayment = async () => {
    if (!agreedToTerms) {
      setShowPolicyModal(true);
      notifyWarning('Vui lòng đọc và đồng ý với Điều khoản dịch vụ và Chính sách bảo vệ dữ liệu cá nhân');
      return;
    }

    if (cartItems.length === 0) {
      notifyWarning('Giỏ hàng của bạn đang trống');
      return;
    }

    if (selectedCartItemIds.length === 0) {
      notifyWarning('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng');
      return;
    }

    if (accountType === 'existing' && loadingProfile) {
      notifyWarning('Đang tải thông tin tài khoản, vui lòng thử lại sau');
      return;
    }

    if (missingPaymentInfoFields.length > 0) {
      setShowMissingInfoAlert(true);
      notifyWarning('Vui lòng nhập đầy đủ thông tin thanh toán');
      return;
    }

    try {
      // Prepare checkout data
      const checkoutData = {
        cart_item_ids: selectedCartItemIds,
        payment_method: paymentMethod,
        notes: formData.notes || '',
      };
      const res = await cartService.checkout(checkoutData);
      const order = res.data;
      notifySuccess('Tạo đơn hàng thành công!');

      // Refresh cart (avoid clearing items user didn't select)
      await fetchCart();

      if (order?.order_id) {
        navigate(`/order/${order.order_id}`, { state: { order } });
      } else {
        navigate('/dashboard');
      }
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
                          <th style={{ width: '48px' }}>
                            <FormCheck
                              type="checkbox"
                              aria-label="Chọn tất cả"
                              checked={
                                cartItems.length > 0 &&
                                cartItems.every((it) => {
                                  const id = it?.cartItemId || it?.id;
                                  return id ? !!selectedCartItemMap[id] : false;
                                })
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedCartItemMap((prev) => {
                                  const next = { ...prev };
                                  (cartItems || []).forEach((it) => {
                                    const id = it?.cartItemId || it?.id;
                                    if (!id) return;
                                    next[id] = checked;
                                  });
                                  return next;
                                });
                              }}
                            />
                          </th>
                          <th>Sản phẩm</th>
                          <th>Giá/Chu kỳ</th>
                          <th>Số lượng</th>
                          <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <FormCheck
                                type="checkbox"
                                aria-label="Chọn sản phẩm"
                                checked={!!selectedCartItemMap[item.cartItemId || item.id]}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const id = item.cartItemId || item.id;
                                  if (!id) return;
                                  setSelectedCartItemMap((prev) => ({
                                    ...prev,
                                    [id]: checked,
                                  }));
                                }}
                              />
                            </td>
                            <td>
                              <div>
                                <strong>{item.productName || item.product?.name || 'Sản phẩm'}</strong>
                                <div className="small">
                                  Chu kỳ: {getCycleLabel(item.paymentCycle || item.billingCycle)}

                                  {/* Display config */}
                                  {item.config && (
                                    <div className="mt-2">
                                      <div className="fw-bold">Cấu hình:</div>
                                      <div className="text-muted">
                                        CPU: {item.config.cpu} cores | RAM: {item.config.ram} GB | Disk: {item.config.disk} GB
                                      </div>
                                      <div className="text-muted">
                                        Bandwidth: {item.config.bandwidth} GB | IP: {item.config.ip}
                                        {item.config.control_panel && <span className="ms-2 badge bg-primary">Control Panel</span>}
                                      </div>
                                      {item.config.os_template_id && (
                                        <div className="text-muted">
                                          OS: {item.config.os_template_id}
                                        </div>
                                      )}
                                    </div>
                                  )}

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
                                onClick={() => navigate(`/config-product/${item.productId}?cartItemId=${item.cartItemId || item.id}`)}
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
                      <Button variant="primary" onClick={handleContinueShopping}>
                        Tiếp tục mua hàng
                      </Button>

                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Phần Khuyến mại */}


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
                      id="payos"
                      name="paymentMethod"
                      label="Pay OS"
                      checked={paymentMethod === 'payos'}
                      onChange={() => setPaymentMethod('payos')}
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

                {selectedItems.length === 0 ? (
                  <Alert variant="warning" className="mb-3">
                    Tích chọn sản phẩm muốn đặt hàng.
                  </Alert>
                ) : (
                  <div className="mb-3">
                    {selectedItems.map((item) => {
                      const name = item.productName || item.product?.name || 'Sản phẩm';
                      const cycle = item.paymentCycle || item.billingCycle;
                      const total = item.totalPrice ?? item.total ?? 0;
                      const id = item.cartItemId || item.id;
                      return (
                        <div key={id} className="order-item mb-2">
                          <div className="order-item-name">
                            {name}
                            <div className="small text-muted">Chu kỳ: {getCycleLabel(cycle)}</div>
                          </div>
                          <div className="order-item-price">{formatPrice(total)} VND</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <hr className="my-4" />

                <div className="order-total">
                  <div className="order-total-label">Tổng thanh toán</div>
                  <div className="order-total-price">{formatPrice(selectedTotal)} VND</div>
                </div>

                {showMissingInfoAlert && missingPaymentInfoFields.length > 0 && (
                  <Alert variant="warning" className="mt-3 mb-0">
                    <div className="fw-bold mb-2">Thiếu thông tin người dùng</div>
                    <div className="small mb-3">
                      Vui lòng cập nhật: {missingPaymentInfoFields.join(', ')}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/profile')}
                    >
                      Cập nhật thông tin
                    </Button>
                  </Alert>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 mt-4 payment-button"
                  onClick={handlePayment}
                >
                  <i className="fas fa-arrow-right me-2"></i>
                  Đặt hàng
                </Button>

                <FormCheck
                  type="checkbox"
                  id="agree-terms"
                  label={
                    <span>
                      Tôi đã đọc và đồng ý với{' '}
                      <Button
                        variant="link"
                        className="p-0 text-decoration-underline"
                        onClick={() => setShowPolicyModal(true)}
                        style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                      >
                        Điều khoản dịch vụ
                      </Button>
                      {' '}và{' '}
                      <Button
                        variant="link"
                        className="p-0 text-decoration-underline"
                        onClick={() => setShowPolicyModal(true)}
                        style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                      >
                        Chính sách bảo vệ dữ liệu cá nhân
                      </Button>
                    </span>
                  }
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-3 terms-checkbox"
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Policy Modal */}
      <Modal
        show={showPolicyModal}
        onHide={() => setShowPolicyModal(false)}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Điều khoản dịch vụ & Chính sách bảo vệ dữ liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tab.Container defaultActiveKey="terms">
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="terms">Điều khoản dịch vụ</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="privacy">Chính sách bảo vệ dữ liệu</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="terms">
                <div className="policy-content">
                  <h4 className="mb-3">Điều khoản dịch vụ</h4>

                  <h5>1. Chấp nhận điều khoản</h5>
                  <p>
                    Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này.
                    Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng dịch vụ.
                  </p>

                  <h5>2. Mô tả dịch vụ</h5>
                  <p>
                    Chúng tôi cung cấp các dịch vụ hosting, VPS, và các dịch vụ công nghệ thông tin liên quan.
                    Dịch vụ được cung cấp "nguyên trạng" và có thể thay đổi mà không cần thông báo trước.
                  </p>

                  <h5>3. Đăng ký tài khoản</h5>
                  <p>
                    Để sử dụng dịch vụ, bạn phải đăng ký tài khoản và cung cấp thông tin chính xác, đầy đủ.
                    Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của bạn.
                  </p>

                  <h5>4. Thanh toán và hoàn tiền</h5>
                  <p>
                    Tất cả các khoản thanh toán phải được thực hiện đúng hạn. Chúng tôi có quyền tạm ngừng hoặc chấm dứt dịch vụ
                    nếu thanh toán bị trễ. Chính sách hoàn tiền được áp dụng theo từng gói dịch vụ cụ thể.
                  </p>

                  <h5>5. Sử dụng dịch vụ</h5>
                  <p>
                    Bạn cam kết sử dụng dịch vụ một cách hợp pháp và không vi phạm quyền của bên thứ ba.
                    Bạn không được sử dụng dịch vụ cho các mục đích bất hợp pháp, gây hại, hoặc vi phạm pháp luật.
                  </p>

                  <h5>6. Bảo mật</h5>
                  <p>
                    Chúng tôi cam kết bảo vệ thông tin của bạn nhưng không thể đảm bảo an ninh tuyệt đối.
                    Bạn chịu trách nhiệm bảo vệ thông tin đăng nhập và dữ liệu của mình.
                  </p>

                  <h5>7. Chấm dứt dịch vụ</h5>
                  <p>
                    Chúng tôi có quyền chấm dứt hoặc tạm ngừng dịch vụ của bạn nếu vi phạm các điều khoản này
                    hoặc vì lý do bảo mật, kỹ thuật.
                  </p>

                  <h5>8. Thay đổi điều khoản</h5>
                  <p>
                    Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào.
                    Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được coi là bạn đã chấp nhận các điều khoản mới.
                  </p>

                  <h5>9. Giới hạn trách nhiệm</h5>
                  <p>
                    Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên nào
                    phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
                  </p>

                  <h5>10. Liên hệ</h5>
                  <p>
                    Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
                  </p>
                </div>
              </Tab.Pane>

              <Tab.Pane eventKey="privacy">
                <div className="policy-content">
                  <h4 className="mb-3">Chính sách bảo vệ dữ liệu cá nhân</h4>

                  <h5>1. Thu thập thông tin</h5>
                  <p>
                    Chúng tôi thu thập thông tin cá nhân của bạn khi bạn đăng ký, sử dụng dịch vụ, hoặc liên hệ với chúng tôi.
                    Thông tin thu thập bao gồm: họ tên, email, số điện thoại, địa chỉ, số CCCD/Passport, và thông tin thanh toán.
                  </p>

                  <h5>2. Mục đích sử dụng</h5>
                  <p>
                    Chúng tôi sử dụng thông tin của bạn để:
                  </p>
                  <ul>
                    <li>Cung cấp và quản lý dịch vụ</li>
                    <li>Xử lý thanh toán và giao dịch</li>
                    <li>Gửi thông báo về dịch vụ và cập nhật</li>
                    <li>Cải thiện chất lượng dịch vụ</li>
                    <li>Tuân thủ các yêu cầu pháp lý</li>
                  </ul>

                  <h5>3. Bảo vệ thông tin</h5>
                  <p>
                    Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin cá nhân của bạn
                    khỏi truy cập trái phép, mất mát, hoặc phá hủy. Tuy nhiên, không có phương thức truyền tải qua Internet
                    nào là an toàn 100%.
                  </p>

                  <h5>4. Chia sẻ thông tin</h5>
                  <p>
                    Chúng tôi không bán, cho thuê, hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba, trừ các trường hợp:
                  </p>
                  <ul>
                    <li>Với sự đồng ý của bạn</li>
                    <li>Để cung cấp dịch vụ (nhà cung cấp thanh toán, hosting, etc.)</li>
                    <li>Khi được yêu cầu bởi pháp luật</li>
                    <li>Để bảo vệ quyền và an toàn của chúng tôi và người dùng khác</li>
                  </ul>

                  <h5>5. Cookie và công nghệ theo dõi</h5>
                  <p>
                    Chúng tôi sử dụng cookie và công nghệ tương tự để cải thiện trải nghiệm người dùng,
                    phân tích lưu lượng truy cập, và cá nhân hóa nội dung. Bạn có thể quản lý cookie thông qua cài đặt trình duyệt.
                  </p>

                  <h5>6. Quyền của người dùng</h5>
                  <p>
                    Bạn có quyền:
                  </p>
                  <ul>
                    <li>Truy cập và xem thông tin cá nhân của mình</li>
                    <li>Yêu cầu chỉnh sửa hoặc cập nhật thông tin</li>
                    <li>Yêu cầu xóa thông tin cá nhân</li>
                    <li>Phản đối việc xử lý thông tin cá nhân</li>
                    <li>Rút lại sự đồng ý bất cứ lúc nào</li>
                  </ul>

                  <h5>7. Lưu trữ dữ liệu</h5>
                  <p>
                    Chúng tôi lưu trữ thông tin cá nhân của bạn trong thời gian cần thiết để cung cấp dịch vụ
                    và tuân thủ các nghĩa vụ pháp lý. Sau khi chấm dứt dịch vụ, chúng tôi sẽ xóa hoặc ẩn danh hóa dữ liệu
                    theo quy định pháp luật.
                  </p>

                  <h5>8. Bảo mật thanh toán</h5>
                  <p>
                    Tất cả các giao dịch thanh toán được xử lý thông qua các nhà cung cấp thanh toán được mã hóa.
                    Chúng tôi không lưu trữ thông tin thẻ tín dụng hoặc chi tiết thanh toán đầy đủ trên hệ thống của mình.
                  </p>

                  <h5>9. Thay đổi chính sách</h5>
                  <p>
                    Chúng tôi có thể cập nhật chính sách này theo thời gian. Chúng tôi sẽ thông báo cho bạn về
                    bất kỳ thay đổi quan trọng nào thông qua email hoặc thông báo trên website.
                  </p>

                  <h5>10. Liên hệ</h5>
                  <p>
                    Nếu bạn có câu hỏi hoặc yêu cầu về chính sách bảo vệ dữ liệu, vui lòng liên hệ với chúng tôi:
                  </p>
                  <ul>
                    <li>Email: support@ttcs-hosting.com</li>
                    <li>Hotline: 1900-xxxx</li>
                    <li>Địa chỉ: [Địa chỉ công ty]</li>
                  </ul>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setAgreedToTerms(true);
              setShowPolicyModal(false);
            }}
          >
            Tôi đồng ý
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cart;

