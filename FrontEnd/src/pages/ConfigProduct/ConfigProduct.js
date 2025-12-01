import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button,
  FormCheck
} from 'react-bootstrap';
import hostingMockData from '../../mockData/hosting.json';
import './ConfigProduct.css';

const ConfigProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = hostingMockData.products.find(p => p.id === parseInt(productId));

  const [paymentCycle, setPaymentCycle] = useState(36); // 3 năm mặc định
  const [dedicatedIP, setDedicatedIP] = useState(false);
  const [notes, setNotes] = useState('');

  // Giá Dedicated IP
  const DEDICATED_IP_PRICE = 100000;

  // Tính giá theo chu kỳ thanh toán
  const calculatePrice = (cycle) => {
    if (cycle === 12) {
      // 1 năm
      return product.monthlyPrice * 12;
    } else if (cycle === 24) {
      // 2 năm - giảm 10%
      return Math.round(product.monthlyPrice * 24 * 0.9);
    } else if (cycle === 36) {
      // 3 năm - sử dụng yearlyPrice (đã tính sẵn)
      return product.yearlyPrice;
    }
    return product.monthlyPrice * cycle;
  };

  // Tính giá theo tháng cho từng chu kỳ
  const getMonthlyPrice = (cycle) => {
    const totalPrice = calculatePrice(cycle);
    return Math.round(totalPrice / cycle);
  };

  // Tính tổng tiền
  const orderSummary = useMemo(() => {
    const productPrice = calculatePrice(paymentCycle);
    const dedicatedIPPrice = dedicatedIP ? DEDICATED_IP_PRICE : 0;
    const subtotal = productPrice + dedicatedIPPrice;
    const vat = Math.round(subtotal * 0.1);
    const setupFee = 0;
    const total = subtotal + vat + setupFee;

    return {
      productPrice,
      dedicatedIPPrice,
      subtotal,
      vat,
      setupFee,
      total
    };
  }, [paymentCycle, dedicatedIP, product]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getCycleLabel = (cycle) => {
    if (cycle === 12) return '1 năm';
    if (cycle === 24) return '2 năm';
    if (cycle === 36) return '3 năm';
    return `${cycle} tháng`;
  };

  if (!product) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Sản phẩm không tồn tại</h2>
          <p>Vui lòng quay lại trang hosting để chọn sản phẩm.</p>
        </div>
      </Container>
    );
  }

  // Lấy thông tin backup từ hostingLinesComparison
  const hostingLine = hostingMockData.hostingLinesComparison.lines[0]; // HOSTING GIÁ RẺ

  return (
    <div className="config-product-page">
      <Container className="py-5">
        <Row>
          {/* Cột trái - Cấu hình */}
          <Col lg={8}>
            {/* Phần Cấu hình */}
            <Card className="mb-4">
              <Card.Body>
                <h2 className="mb-3">Cấu hình</h2>
                <h4 className="text-muted mb-4">Web Hosting - {product.name}</h4>
                
                <Row className="g-3">
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Disk Space</div>
                      <div className="config-value">{product.features.ssd}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Domains</div>
                      <div className="config-value">{product.features.websites}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Subdomain</div>
                      <div className="config-value">Unlimited</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Email Accounts</div>
                      <div className="config-value">{product.features.emails}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">CPU</div>
                      <div className="config-value">{product.features.cpu}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">RAM</div>
                      <div className="config-value">{product.features.ram}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">I/O</div>
                      <div className="config-value">50 Mbps</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">MySQL CPU</div>
                      <div className="config-value">1.2 cores</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Inode</div>
                      <div className="config-value">Unlimited</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Data Transfer</div>
                      <div className="config-value">{product.features.dataTransfer}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Minimum payments</div>
                      <div className="config-value">12 month(s)</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Backup</div>
                      <div className="config-value">{hostingLine.backup}</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Chọn chu kỳ thanh toán */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-4">Chọn chu kỳ thanh toán</h3>
                <Form>
                  <div className="payment-cycle-options">
                    <FormCheck
                      type="radio"
                      id="cycle-12"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">1 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(12))} VND/tháng</span>
                        </div>
                      }
                      checked={paymentCycle === 12}
                      onChange={() => setPaymentCycle(12)}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-24"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">2 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(24))} VND/tháng</span>
                        </div>
                      }
                      checked={paymentCycle === 24}
                      onChange={() => setPaymentCycle(24)}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-36"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">3 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(36))} VND/tháng</span>
                        </div>
                      }
                      checked={paymentCycle === 36}
                      onChange={() => setPaymentCycle(36)}
                      className="payment-cycle-radio"
                    />
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Dedicated IP */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-3">Dedicated IP</h3>
                <FormCheck
                  type="checkbox"
                  id="dedicated-ip"
                  label={
                    <div className="d-flex justify-content-between align-items-center w-100">
                      <span>Kích hoạt</span>
                      <span className="dedicated-ip-price">{formatPrice(DEDICATED_IP_PRICE)} VND</span>
                    </div>
                  }
                  checked={dedicatedIP}
                  onChange={(e) => setDedicatedIP(e.target.checked)}
                />
              </Card.Body>
            </Card>

            {/* Thông tin cần bổ sung */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-3">Thông tin cần bổ sung</h3>
                <p className="text-muted small mb-3">(required fields are marked with *)</p>
                <Form.Group className="mb-3">
                  <Form.Label>Notes (Ghi Chú)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú của bạn..."
                  />
                </Form.Group>
                <div className="alert alert-info">
                  <small>
                    Dịch vụ sẽ được kích hoạt tự động theo cấu hình bạn chọn. Nếu bạn có yêu cầu đặc biệt (hệ điều hành khác, Range IP...), vui lòng điền thông tin vào ô Notes (Ghi Chú) bên trên để được hỗ trợ cài đặt.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Cột phải - Thông tin đơn hàng */}
          <Col lg={4}>
            <Card className="order-summary-card">
              <Card.Body>
                <h3 className="mb-4">Thông tin đơn hàng</h3>
                
                <div className="order-item mb-3">
                  <div className="order-item-name">Web Hosting - {product.name}</div>
                  <div className="order-item-price">{formatPrice(orderSummary.productPrice)} VND</div>
                </div>

                <div className="order-subtotal mb-3">
                  <div className="order-subtotal-label">Thành tiền</div>
                  <div className="order-subtotal-detail">
                    <div className="order-cycle-label">{getCycleLabel(paymentCycle)}</div>
                    <div className="order-cycle-price">{formatPrice(orderSummary.subtotal)} VND</div>
                  </div>
                </div>

                <div className="order-item mb-3">
                  <div className="order-item-name">VAT @ 10.00%</div>
                  <div className="order-item-price">{formatPrice(orderSummary.vat)} VND</div>
                </div>

                <div className="order-item mb-3">
                  <div className="order-item-name">Phí cài đặt</div>
                  <div className="order-item-price">{formatPrice(orderSummary.setupFee)} VND</div>
                </div>

                <hr className="my-4" />

                <div className="order-total">
                  <div className="order-total-label">Tổng Thành tiền</div>
                  <div className="order-total-price">{formatPrice(orderSummary.total)} VND</div>
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mt-4 continue-button"
                  onClick={() => {
                    // Lưu thông tin đơn hàng vào localStorage hoặc state management
                    const orderData = {
                      productId: product.id,
                      productName: product.name,
                      paymentCycle,
                      dedicatedIP,
                      notes,
                      ...orderSummary
                    };
                    localStorage.setItem('cartItem', JSON.stringify(orderData));
                    navigate('/cart');
                  }}
                >
                  <i className="fas fa-arrow-right me-2"></i>
                  Tiếp tục
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ConfigProduct;

