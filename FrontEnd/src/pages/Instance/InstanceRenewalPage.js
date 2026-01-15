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
                        notify.notifySuccess('Thanh toan thanh cong! Instance da duoc gia han.');
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
                        throw new Error('Khong tim thay item trong gio hang');
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
            if (!window.confirm('Ban co chac muon huy thanh toan?')) {
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
                  notify.notifySuccess('Da huy thanh toan');
            } catch (err) {
                  console.error('Failed to cancel payment:', err);
                  notify.notifyError('Khong the huy thanh toan');
            }
      };

      const cycles = [
            { value: '1', label: '1 Thang', multiplier: 1 },
            { value: '3', label: '3 Thang', multiplier: 3 },
            { value: '6', label: '6 Thang', multiplier: 6 },
            { value: '12', label: '1 Nam (12 Thang)', multiplier: 12 },
      ];

      if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
      if (error && !instance) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

      // Success state
      if (paymentSuccess) {
            return (
                  <Container className="py-5 instance-renewal-page">
                        <Card className="shadow-sm">
                              <Card.Body className="text-center py-5">
                                    <div className="mb-4">
                                          <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                    </div>
                                    <h3 className="text-success mb-3">Gia han thanh cong!</h3>
                                    <p className="text-muted mb-4">
                                          Instance cua ban da duoc gia han them {billingCycle} thang.
                                          <br />
                                          Ngay het han moi se duoc cap nhat trong vai giay.
                                    </p>
                                    <Button variant="primary" onClick={() => navigate(`/instances/${instanceId}/summary`)}>
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
                        <Card className="shadow-sm">
                              <Card.Header className="bg-primary text-white">
                                    <h4 className="mb-0"><i className="fas fa-qrcode me-2"></i>Thanh toan gia han</h4>
                              </Card.Header>
                              <Card.Body>
                                    {paymentLoading ? (
                                          <div className="text-center py-4">
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Dang tao ma thanh toan...
                                          </div>
                                    ) : (
                                          <Row>
                                                <Col md={7}>
                                                      <div className="text-center">
                                                            <h5>Quet ma QR de thanh toan</h5>
                                                            {payment.qr_content ? (
                                                                  <div className="my-3">
                                                                        <div className="border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                                                                              <iframe
                                                                                    src={payment.qr_content}
                                                                                    style={{
                                                                                          width: '100%',
                                                                                          height: '500px',
                                                                                          border: 'none',
                                                                                          borderRadius: '8px'
                                                                                    }}
                                                                                    title="PayOS Payment"
                                                                              />
                                                                        </div>
                                                                        <p className="text-muted small mt-2">
                                                                              <i className="fas fa-info-circle me-1"></i>
                                                                              Quet ma QR ben tren de thanh toan
                                                                        </p>
                                                                  </div>
                                                            ) : (
                                                                  <p className="text-muted">Dang tai trang thanh toan...</p>
                                                            )}
                                                            <div className="mt-3">
                                                                  <p><strong>So tien:</strong> {formatPrice(payment.amount)} VND</p>
                                                            </div>
                                                      </div>
                                                </Col>
                                                <Col md={5}>
                                                      <Alert variant="info">
                                                            <h6>Thong tin gia han:</h6>
                                                            <p className="mb-1"><strong>Instance:</strong> VM-{instance.external_vm_id}</p>
                                                            <p className="mb-1"><strong>Chu ky:</strong> {cycles.find(c => c.value === billingCycle)?.label}</p>
                                                            <p className="mb-0"><strong>So tien:</strong> {formatPrice(payment.amount)} VND</p>
                                                      </Alert>

                                                      <Alert variant="light" className="mt-3">
                                                            <h6>Huong dan:</h6>
                                                            <ol className="mb-0 ps-3">
                                                                  <li>Mo ung dung ngan hang</li>
                                                                  <li>Quet ma QR ben trai</li>
                                                                  <li>Xac nhan thanh toan</li>
                                                                  <li>Cho he thong xac nhan (tu dong)</li>
                                                            </ol>
                                                      </Alert>

                                                      {pollingPayment && (
                                                            <div className="text-center mt-3">
                                                                  <Spinner animation="border" size="sm" className="me-2" />
                                                                  <span className="text-muted">Dang cho thanh toan...</span>
                                                            </div>
                                                      )}

                                                      <div className="d-grid gap-2 mt-3">
                                                            <Button
                                                                  variant="outline-danger"
                                                                  onClick={handleCancelPayment}
                                                            >
                                                                  <i className="fas fa-times me-2"></i>
                                                                  Huy thanh toan
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
                  <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white">
                              <h4 className="mb-0"><i className="fas fa-sync-alt me-2"></i>Gia han Instance</h4>
                        </Card.Header>
                        <Card.Body>
                              <Row className="mb-4">
                                    <Col md={12}>
                                          <h5>Thong tin Instance</h5>
                                          <div className="p-3 bg-light rounded">
                                                <p className="mb-1"><strong>ID:</strong> {instance.instance_id}</p>
                                                <p className="mb-1"><strong>VM:</strong> {instance.node_name} (VM-{instance.external_vm_id})</p>
                                                <p className="mb-1"><strong>Trang thai:</strong> {instance.status}</p>
                                                <p className="mb-0"><strong>Het han:</strong> {instance.next_due_date ? new Date(instance.next_due_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                          </div>
                                    </Col>
                              </Row>

                              <h5 className="mb-3">Chon chu ky gia han</h5>
                              <Row className="g-3">
                                    {cycles.map((cycle) => (
                                          <Col md={3} sm={6} key={cycle.value}>
                                                <div
                                                      className={`cycle-option p-3 border rounded text-center ${billingCycle === cycle.value ? 'border-primary bg-primary-light' : ''}`}
                                                      onClick={() => setBillingCycle(cycle.value)}
                                                      style={{ cursor: 'pointer', transition: 'all 0.2s', backgroundColor: billingCycle === cycle.value ? '#e7f1ff' : 'transparent' }}
                                                >
                                                      <Form.Check
                                                            type="radio"
                                                            name="billingCycle"
                                                            id={`cycle-${cycle.value}`}
                                                            checked={billingCycle === cycle.value}
                                                            onChange={() => setBillingCycle(cycle.value)}
                                                            className="d-none"
                                                      />
                                                      <strong className="d-block fs-5">{cycle.label}</strong>
                                                </div>
                                          </Col>
                                    ))}
                              </Row>

                              <div className="mt-4 text-end">
                                    <Button variant="secondary" className="me-2" onClick={() => navigate('/instances')}>
                                          Huy bo
                                    </Button>
                                    <Button
                                          variant="primary"
                                          size="lg"
                                          onClick={handleRenew}
                                          disabled={processing}
                                    >
                                          {processing ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="fas fa-credit-card me-2"></i>}
                                          Thanh toan ngay
                                    </Button>
                              </div>
                        </Card.Body>
                  </Card>
            </Container>
      );
};

export default InstanceRenewalPage;
