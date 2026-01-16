import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { instanceService } from '../../services/instanceService';
import { cartService } from '../../services/cartService';
import { paymentService } from '../../services/paymentService';
import { useNotify } from '../../contexts/NotificationContext';
import './InstanceRenewalPage.css';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0);

const InstanceRenewalPage = () => {
      const { instanceId } = useParams();
      const navigate = useNavigate();
      const notify = useNotify();

      const [instance, setInstance] = useState(null);
      const [loading, setLoading] = useState(true);
      const [processing, setProcessing] = useState(false);
      const [billingCycle, setBillingCycle] = useState('1');
      const [error, setError] = useState(null);

      // Payment states
      const [orderData, setOrderData] = useState(null);
      const [payment, setPayment] = useState(null);
      const [paymentLoading, setPaymentLoading] = useState(false);
      const [pollingPayment, setPollingPayment] = useState(false);
      const [paymentSuccess, setPaymentSuccess] = useState(false);

      const paymentPollingIntervalRef = useRef(null);

      useEffect(() => {
            fetchInstanceDetails();
            // Cleanup on unmount
            return () => {
                  if (paymentPollingIntervalRef.current) {
                        clearInterval(paymentPollingIntervalRef.current);
                  }
            };
      }, [instanceId]);

      const fetchInstanceDetails = async () => {
            try {
                  setLoading(true);
                  const response = await instanceService.getAllInstances();
                  const foundInstance = response.data.instances.find(i => i.instance_id === instanceId);
                  if (!foundInstance) {
                        setError('Không tìm thấy instance');
                  } else {
                        setInstance(foundInstance);
                  }
            } catch (err) {
                  setError('Không thể tải thông tin instance');
            } finally {
                  setLoading(false);
            }
      };

      // Poll payment status
      const pollPaymentStatus = useCallback(async () => {
            if (!payment?.payment_id) return;

            try {
                  const res = await paymentService.checkPaymentStatus(payment.payment_id);
                  const statusUpdate = res.data;

                  setPayment(prev => ({
                        ...prev,
                        status: statusUpdate.status,
                        paid_at: statusUpdate.paid_at
                  }));

                  // If payment is now PAID, stop polling and show success
                  if (statusUpdate.status === 'PAID') {
                        setPollingPayment(false);
                        if (paymentPollingIntervalRef.current) {
                              clearInterval(paymentPollingIntervalRef.current);
                              paymentPollingIntervalRef.current = null;
                        }
                        setPaymentSuccess(true);
                        notify.notifySuccess('Thanh toán thành công! Instance đã được gia hạn.');
                  }
            } catch (err) {
                  console.error('Failed to poll payment status:', err);
            }
      }, [payment?.payment_id, notify]);

      // Start polling when payment is created
      useEffect(() => {
            if (!payment || payment.status !== 'PENDING') {
                  if (paymentPollingIntervalRef.current) {
                        clearInterval(paymentPollingIntervalRef.current);
                        paymentPollingIntervalRef.current = null;
                  }
                  setPollingPayment(false);
                  return;
            }

            if (!pollingPayment) {
                  setPollingPayment(true);
            }

            // Poll immediately, then every 5 seconds
            pollPaymentStatus();
            paymentPollingIntervalRef.current = setInterval(pollPaymentStatus, 5000);

            return () => {
                  if (paymentPollingIntervalRef.current) {
                        clearInterval(paymentPollingIntervalRef.current);
                        paymentPollingIntervalRef.current = null;
                  }
            };
      }, [payment?.status, pollingPayment, pollPaymentStatus]);

      const handleRenew = async () => {
            try {
                  setProcessing(true);
                  setError(null);

                  // 1. Check if item already exists in cart to prevent quantity accumulation
                  const existingCartRes = await cartService.getCart();
                  const existingItems = existingCartRes.data.items || [];

                  const existingItem = existingItems.find(item =>
                        item.product_id === instance.product_id &&
                        item.config?.renewal_instance_id === instance.instance_id
                  );

                  // If exists, remove it first
                  if (existingItem) {
                        try {
                              await cartService.removeItem(existingItem.cart_item_id);
                        } catch (ignore) { }
                  }

                  // 2. Add to Cart (Renew)
                  await instanceService.renewInstance(instanceId, billingCycle);

                  // 3. Fetch cart again to find our new item
                  const cartRes = await cartService.getCart();
                  const cartItems = cartRes.data.items || [];

                  const addedItem = cartItems.find(item =>
                        item.product_id === instance.product_id &&
                        item.billing_cycle === billingCycle &&
                        item.config?.renewal_instance_id === instance.instance_id
                  );

                  if (!addedItem) {
                        throw new Error('Không tìm thấy item trong giỏ hàng');
                  }

                  // 4. Checkout specific item
                  const checkoutRes = await cartService.checkout({ cart_item_ids: [addedItem.cart_item_id] });
                  const orderId = checkoutRes.data.order_id;
                  setOrderData(checkoutRes.data);

                  // 5. Create payment for the order
                  setPaymentLoading(true);
                  const paymentRes = await paymentService.createPayment(orderId);
                  setPayment(paymentRes.data);
                  setPaymentLoading(false);

                  setProcessing(false);

            } catch (err) {
                  console.error(err);
                  const errorMsg = err.response?.data?.error || err.message || 'Không thể xử lý gia hạn';
                  notify.notifyError(`Lỗi: ${errorMsg}`);
                  setProcessing(false);
                  setPaymentLoading(false);
            }
      };

      const handleCancelPayment = async () => {
            if (!window.confirm('Bạn có chắc muốn hủy thanh toán?')) {
                  return;
            }

            try {
                  // Stop polling
                  if (paymentPollingIntervalRef.current) {
                        clearInterval(paymentPollingIntervalRef.current);
                        paymentPollingIntervalRef.current = null;
                  }
                  setPollingPayment(false);

                  // Cancel payment
                  if (payment?.payment_id) {
                        await paymentService.cancelPayment(payment.payment_id);
                  }

                  // Reset states
                  setPayment(null);
                  setOrderData(null);
                  notify.notifySuccess('Đã hủy thanh toán');
            } catch (err) {
                  console.error('Failed to cancel payment:', err);
                  notify.notifyError('Không thể hủy thanh toán');
            }
      };

      const cycles = [
            { value: '1', label: '1 Tháng', multiplier: 1 },
            { value: '3', label: '3 Tháng', multiplier: 3 },
            { value: '6', label: '6 Tháng', multiplier: 6 },
            { value: '12', label: '1 Năm (12 Tháng)', multiplier: 12 },
      ];

      if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
      if (error && !instance) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

      // Success state
      if (paymentSuccess) {
            return (
                  <Container className="py-5 instance-renewal-page">
                        <Card className="shadow-lg border-0 renewal-success-card">
                              <Card.Body className="text-center py-5 px-4">
                                    <div className="mb-4">
                                          <div className="success-icon-wrapper">
                                                <i className="fas fa-check-circle text-success"></i>
                                          </div>
                                    </div>
                                    <h3 className="text-success mb-3 fw-bold">Gia hạn thành công!</h3>
                                    <p className="text-muted mb-4 fs-5">
                                          Instance của bạn đã được gia hạn thêm {cycles.find(c => c.value === billingCycle)?.label.toLowerCase()}.
                                          <br />
                                          <span className="text-secondary">Ngày hết hạn mới sẽ được cập nhật trong vài giây.</span>
                                    </p>
                                    <Button 
                                          variant="primary" 
                                          size="lg"
                                          className="btn-primary-custom px-4"
                                          onClick={() => navigate(`/instances/${instanceId}/summary`)}
                                    >
                                          <i className="fas fa-server me-2"></i>
                                          Xem Instance
                                    </Button>
                              </Card.Body>
                        </Card>
                  </Container>
            );
      }

      // Payment QR state
      if (payment && !paymentSuccess) {
            return (
                  <Container className="py-5 instance-renewal-page">
                        <Card className="shadow-lg border-0 renewal-payment-card">
                              <Card.Header className="renewal-header">
                                    <h4 className="mb-0 text-white fw-bold">
                                          <i className="fas fa-qrcode me-2"></i>
                                          Thanh toán gia hạn
                                    </h4>
                              </Card.Header>
                              <Card.Body className="p-4">
                                    {paymentLoading ? (
                                          <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" size="lg" className="me-2" />
                                                <p className="mt-3 text-muted">Đang tạo mã thanh toán...</p>
                                          </div>
                                    ) : (
                                          <Row>
                                                <Col md={7}>
                                                      <div className="text-center">
                                                            <h5 className="mb-4 fw-bold text-dark">
                                                                  <i className="fas fa-mobile-alt me-2 text-primary"></i>
                                                                  Quét mã QR để thanh toán
                                                            </h5>
                                                            {payment.qr_content ? (
                                                                  <div className="my-3">
                                                                        <div className="qr-container">
                                                                              <iframe
                                                                                    src={payment.qr_content}
                                                                                    className="qr-iframe"
                                                                                    title="PayOS Payment"
                                                                              />
                                                                        </div>
                                                                        <p className="text-muted small mt-3">
                                                                              <i className="fas fa-info-circle me-1 text-primary"></i>
                                                                              Quét mã QR bên trên để thanh toán
                                                                        </p>
                                                                  </div>
                                                            ) : (
                                                                  <p className="text-muted">
                                                                        <Spinner animation="border" size="sm" className="me-2" />
                                                                        Đang tải trang thanh toán...
                                                                  </p>
                                                            )}
                                                            <div className="mt-4 payment-amount-box">
                                                                  <p className="mb-0">
                                                                        <span className="text-muted">Số tiền: </span>
                                                                        <strong className="text-primary fs-4">{formatPrice(payment.amount)} VND</strong>
                                                                  </p>
                                                            </div>
                                                      </div>
                                                </Col>
                                                <Col md={5}>
                                                      <Alert variant="info" className="renewal-info-alert" style={{ backgroundColor: 'var(--primary-color-dark)' }}>
                                                            <h6 className="mb-3 fw-bold">
                                                                  <i className="fas fa-info-circle me-2"></i>
                                                                  Thông tin gia hạn
                                                            </h6>
                                                            <div className="info-item">
                                                                  <span className="info-label">Instance:</span>
                                                                  <span className="info-value">VM-{instance.external_vm_id}</span>
                                                            </div>
                                                            <div className="info-item">
                                                                  <span className="info-label">Chu kỳ:</span>
                                                                  <span className="info-value">{cycles.find(c => c.value === billingCycle)?.label}</span>
                                                            </div>
                                                            {(() => {
                                                                  // Tính tiền hàng và tiền thuế từ tổng số tiền (giả định tổng đã bao gồm thuế)
                                                                  const totalAmount = payment.amount || 0;
                                                                  const subtotal = Math.round(totalAmount / 1.08);
                                                                  const tax = totalAmount - subtotal; // Đảm bảo tổng chính xác
                                                                  return (
                                                                        <>
                                                                              <div className="info-item">
                                                                                    <span className="info-label">Phí gia hạn:</span>
                                                                                    <span className="info-value">{formatPrice(subtotal)} VND</span>
                                                                              </div>
                                                                              <div className="info-item">
                                                                                    <span className="info-label">Thuế (8%):</span>
                                                                                    <span className="info-value">{formatPrice(tax)} VND</span>
                                                                              </div>
                                                                        </>
                                                                  );
                                                            })()}
                                                            <div className="info-item mb-0">
                                                                  <span className="info-label">Số tiền:</span>
                                                                  <span className="info-value text-primary fw-bold">{formatPrice(payment.amount)} VND</span>
                                                            </div>
                                                      </Alert>

                                                      <Alert variant="light" className="mt-3 renewal-guide-alert">
                                                            <h6 className="mb-3 fw-bold">
                                                                  <i className="fas fa-lightbulb me-2 text-warning"></i>
                                                                  Hướng dẫn
                                                            </h6>
                                                            <ol className="mb-0 ps-3 renewal-guide-list">
                                                                  <li>Mở ứng dụng ngân hàng</li>
                                                                  <li>Quét mã QR bên trái</li>
                                                                  <li>Xác nhận thanh toán</li>
                                                                  <li>Chờ hệ thống xác nhận (tự động)</li>
                                                            </ol>
                                                      </Alert>

                                                      {pollingPayment && (
                                                            <div className="text-center mt-3">
                                                                  <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                                                                  <span className="text-muted">Đang chờ thanh toán...</span>
                                                            </div>
                                                      )}

                                                      <div className="d-grid gap-2 mt-3">
                                                            <Button
                                                                  variant="danger"
                                                                  size="lg"
                                                                  onClick={handleCancelPayment}
                                                            >
                                                                  <i className="fas fa-times me-2"></i>
                                                                  Hủy thanh toán
                                                            </Button>
                                                      </div>
                                                </Col>
                                          </Row>
                                    )}
                              </Card.Body>
                        </Card>
                  </Container>
            );
      }

      // Default: Billing cycle selection
      return (
            <Container className="py-5 instance-renewal-page">
                  <Card className="shadow-lg border-0 renewal-main-card">
                        <Card.Header className="renewal-header">
                              <h4 className="mb-0 text-white fw-bold">
                                    <i className="fas fa-sync-alt me-2"></i>
                                    Gia hạn VPS
                              </h4>
                        </Card.Header>
                        <Card.Body className="p-4">
                              <Row className="mb-4">
                                    <Col md={12}>
                                          <h5 className="mb-3 fw-bold text-dark">
                                                <i className="fas fa-info-circle me-2 text-primary"></i>
                                                Thông tin VPS
                                          </h5>
                                          <div className="instance-info-box p-4">
                                                <div className="info-row mb-2">
                                                      <span className="info-label">
                                                            <i className="fas fa-check-circle me-2 text-primary"></i>
                                                            ID:
                                                      </span>
                                                      <code className="info-value">{instance.instance_id}</code>
                                                </div>
                                                <div className="info-row mb-2">
                                                      <span className="info-label">
                                                            <i className="fas fa-server me-2 text-primary"></i>
                                                            VM:
                                                      </span>
                                                      <span className="info-value">{instance.node_name} (VM-{instance.external_vm_id})</span>
                                                </div>
                                                <div className="info-row mb-2">
                                                      <span className="info-label">
                                                            <i className="fas fa-circle me-2 text-primary"></i>
                                                            Trạng thái:
                                                      </span>
                                                      <span className="info-value">{instance.status}</span>
                                                </div>
                                                <div className="info-row mb-0">
                                                      <span className="info-label">
                                                            <i className="fas fa-calendar-times me-2 text-primary"></i>
                                                            Hết hạn:
                                                      </span>
                                                      <span className="info-value">{instance.next_due_date ? new Date(instance.next_due_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                                </div>
                                          </div>
                                    </Col>
                              </Row>

                              <h5 className="mb-4 fw-bold text-dark">
                                    <i className="fas fa-calendar-alt me-2 text-primary"></i>
                                    Chọn chu kỳ gia hạn
                              </h5>
                              <Row className="g-3 mb-4">
                                    {cycles.map((cycle) => (
                                          <Col md={3} sm={6} key={cycle.value}>
                                                <div
                                                      className={`cycle-option ${billingCycle === cycle.value ? 'cycle-option-selected' : ''}`}
                                                      onClick={() => setBillingCycle(cycle.value)}
                                                >
                                                      <Form.Check
                                                            type="radio"
                                                            name="billingCycle"
                                                            id={`cycle-${cycle.value}`}
                                                            checked={billingCycle === cycle.value}
                                                            onChange={() => setBillingCycle(cycle.value)}
                                                            className="d-none"
                                                      />
                                                      {billingCycle === cycle.value && (
                                                            <div className="selected-badge">
                                                                  <i className="fas fa-check-circle"></i>
                                                            </div>
                                                      )}
                                                      <strong className="d-block cycle-label">{cycle.label}</strong>
                                                </div>
                                          </Col>
                                    ))}
                              </Row>

                              <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <Button 
                                          variant="outline-secondary" 
                                          size="lg"
                                          onClick={() => navigate('/instances')}
                                    >
                                          <i className="fas fa-arrow-left me-2"></i>
                                          Hủy bỏ
                                    </Button>
                                    <Button
                                          variant="primary"
                                          size="lg"
                                          className="btn-primary-custom px-5"
                                          onClick={handleRenew}
                                          disabled={processing}
                                    >
                                          {processing ? (
                                                <>
                                                      <Spinner animation="border" size="sm" className="me-2" />
                                                      Đang xử lý...
                                                </>
                                          ) : (
                                                <>
                                                      <i className="fas fa-credit-card me-2"></i>
                                                      Thanh toán ngay
                                                </>
                                          )}
                                    </Button>
                              </div>
                        </Card.Body>
                  </Card>
            </Container>
      );
};

export default InstanceRenewalPage;
