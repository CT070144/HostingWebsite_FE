import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Table, Form, InputGroup } from 'react-bootstrap';
import { Steps } from 'antd';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { instanceService } from '../../services/instanceService';
import PdfViewer from './PdfViewer';
import './OrderDetails.css';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0);

const getStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PAID' || s === 'SUCCESS') return { variant: 'success', label: s };
  if (s === 'PENDING') return { variant: 'warning', label: s };
  if (s === 'CANCELLED' || s === 'FAILED') return { variant: 'danger', label: s };
  return { variant: 'secondary', label: s || 'UNKNOWN' };
};

// Map order status to step index for Steps component
const getStatusStep = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'DELIVERED') return 3;
  if (s === 'CONFIRMED' || s === 'PROCESSING') return 2;
  if (s === 'PAID') return 1;
  if (s === 'PENDING') return 0;
  return 3;
};

const getCycleLabel = (cycle) => {
  if (cycle === null || cycle === undefined || cycle === '') {
    return '—';
  }
  const num = typeof cycle === 'string' ? parseInt(cycle) : cycle;
  if (isNaN(num)) return '—';
  if (num === 3) return '3 tháng';
  if (num === 6) return '6 tháng';
  if (num === 12) return '1 năm';
  return `${num} tháng`;
};

// Helper to transliterate Vietnamese to ASCII-safe
const transliterateVi = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

async function buildInvoicePdf(order) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595.28, 841.89]);

  const margin = 48;
  let y = 800;
  const pageWidth = 595.28;
  const contentWidth = pageWidth - (margin * 2);

  const truncateText = (text, maxWidth, fontSize = 10) => {
    const str = String(text ?? '');
    if (!str) return '';
    const charWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / charWidth);
    if (str.length <= maxChars) return str;
    return str.substring(0, maxChars - 3) + '...';
  };

  const drawText = (text, opts = {}) => {
    const textToDraw = opts.maxWidth
      ? truncateText(text, opts.maxWidth, opts.size ?? 11)
      : String(text ?? '');
    page.drawText(textToDraw, {
      x: opts.x ?? margin,
      y: opts.y ?? y,
      size: opts.size ?? 11,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? rgb(0.1, 0.1, 0.1),
    });
  };

  const drawLine = (x1, y1, x2, y2, thickness = 1, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color,
    });
  };

  drawText('HOA DON / INVOICE', { bold: true, size: 18, y });
  y -= 28;
  drawText(`Order ID: ${order?.order_id || ''}`, { y, bold: true });
  y -= 18;
  drawText(`Status: ${order?.status || ''}`, { y });
  y -= 18;
  drawText(`Currency: ${order?.currency || 'VND'}`, { y });
  y -= 30;

  const tableTop = y;
  const rowHeight = 20;
  const headerHeight = 25;
  const colWidths = {
    stt: 35,
    name: 180,
    cycle: 70,
    quantity: 50,
    unitPrice: 90,
    total: 90,
  };
  const colX = {
    stt: margin,
    name: margin + colWidths.stt,
    cycle: margin + colWidths.stt + colWidths.name,
    quantity: margin + colWidths.stt + colWidths.name + colWidths.cycle,
    unitPrice: margin + colWidths.stt + colWidths.name + colWidths.cycle + colWidths.quantity,
    total: margin + colWidths.stt + colWidths.name + colWidths.cycle + colWidths.quantity + colWidths.unitPrice,
  };

  y = tableTop;
  const headerY = y;
  page.drawRectangle({
    x: margin,
    y: y - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: rgb(0.9, 0.9, 0.9),
  });

  drawText('STT', { x: colX.stt + 5, y: y - 15, bold: true, size: 10 });
  drawText('Ten san pham', { x: colX.name + 5, y: y - 15, bold: true, size: 10 });
  drawText('Chu ky', { x: colX.cycle + 5, y: y - 15, bold: true, size: 10 });
  drawText('SL', { x: colX.quantity + 5, y: y - 15, bold: true, size: 10 });
  drawText('Don gia', { x: colX.unitPrice + 5, y: y - 15, bold: true, size: 10 });
  drawText('Thanh tien', { x: colX.total + 5, y: y - 15, bold: true, size: 10 });

  drawLine(margin, y - headerHeight, pageWidth - margin, y - headerHeight, 1, rgb(0, 0, 0));
  drawLine(margin, y, pageWidth - margin, y, 1, rgb(0, 0, 0));
  y -= headerHeight;

  const items = Array.isArray(order?.items) ? order.items : [];
  items.forEach((it, idx) => {
    if (y < 150) return;

    const rowY = y;
    const cycleLabel = transliterateVi(getCycleLabel(it.billing_cycle));

    drawLine(margin, rowY, pageWidth - margin, rowY, 0.5, rgb(0.7, 0.7, 0.7));

    drawLine(colX.name, rowY, colX.name, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.cycle, rowY, colX.cycle, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.quantity, rowY, colX.quantity, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.unitPrice, rowY, colX.unitPrice, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.total, rowY, colX.total, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));

    drawText(String(idx + 1), { x: colX.stt + 3, y: rowY - 15, size: 10, maxWidth: colWidths.stt - 6 });
    const productName = transliterateVi(it.product_name || it.product_id || 'San pham');
    drawText(productName, {
      x: colX.name + 3,
      y: rowY - 15,
      size: 10,
      maxWidth: colWidths.name - 6
    });
    drawText(cycleLabel, { x: colX.cycle + 3, y: rowY - 15, size: 10, maxWidth: colWidths.cycle - 6 });
    drawText(String(it.quantity || 1), { x: colX.quantity + 3, y: rowY - 15, size: 10, maxWidth: colWidths.quantity - 6 });
    drawText(formatPrice(it.unit_price), { x: colX.unitPrice + 3, y: rowY - 15, size: 10, maxWidth: colWidths.unitPrice - 6 });
    drawText(formatPrice(it.total_price), { x: colX.total + 3, y: rowY - 15, size: 10, bold: true, maxWidth: colWidths.total - 6 });

    y -= rowHeight;

    const addons = it?.config?.addons_applied;
    if (Array.isArray(addons) && addons.length > 0) {
      if (y < 150) return;

      const addonMaxWidth = (colX.cycle + colWidths.cycle + colWidths.quantity + colWidths.unitPrice + colWidths.total) - colX.name - 6;
      let addonY = y;
      let addonText = 'Addons: ';

      addons.forEach((a, aIdx) => {
        const addonItem = `${a.addon_type}: x${a.quantity} ${a.unit} = ${formatPrice(a.total_price)}`;
        const testText = addonText + (aIdx > 0 ? ', ' : '') + addonItem;

        if (testText.length * 4.5 > addonMaxWidth && aIdx > 0) {
          drawText(addonText.trim(), {
            x: colX.name + 3,
            y: addonY - 15,
            size: 9,
            color: rgb(0.5, 0.5, 0.5),
            maxWidth: addonMaxWidth
          });
          addonY -= rowHeight;
          addonText = addonItem;
        } else {
          addonText += (aIdx > 0 ? ', ' : '') + addonItem;
        }
      });

      if (addonText.trim()) {
        drawLine(margin, addonY, pageWidth - margin, addonY, 0.5, rgb(0.7, 0.7, 0.7));
        drawText(addonText.trim(), {
          x: colX.name + 3,
          y: addonY - 15,
          size: 9,
          color: rgb(0.5, 0.5, 0.5),
          maxWidth: addonMaxWidth
        });
        y = addonY - rowHeight;
      } else {
        y -= rowHeight;
      }
    }
  });

  y = Math.max(y, 100);
  drawLine(margin, y, pageWidth - margin, y, 2, rgb(0, 0, 0));
  y -= 25;

  drawText(transliterateVi('Tong thanh toan'), {
    x: colX.unitPrice + 5,
    y: y,
    bold: true,
    size: 12
  });
  drawText(formatPrice(order?.total_amount) + ' ' + (order?.currency || 'VND'), {
    x: colX.total + 5,
    y: y,
    bold: true,
    size: 12
  });

  return await pdfDoc.save();
}

const downloadInvoicePdf = async (order) => {
  try {
    const bytes = await buildInvoicePdf(order);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hoa-don-${order?.order_id || 'invoice'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Không thể tải xuống hóa đơn PDF. Vui lòng thử lại.');
  }
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(location.state?.order || null);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Payment states
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [pollingPayment, setPollingPayment] = useState(false);

  // VM polling states
  const [instances, setInstances] = useState([]);
  const [pollingForVM, setPollingForVM] = useState(false);
  const [vmReady, setVmReady] = useState(false);

  // SSH configuration states
  const [sshConfig, setSshConfig] = useState({
    ciuser: 'ubuntu',
    cipassword: '',
    nameserver: '8.8.8.8',
    sshkeys: ''
  });
  const [generatedKeys, setGeneratedKeys] = useState(null);
  const [sshSubmitting, setSshSubmitting] = useState(false);
  const [sshError, setSshError] = useState(null);

  const paymentPollingIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Load order and PDF
  useEffect(() => {
    let disposed = false;
    let currentPdfUrl = null;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        let nextOrder = location.state?.order || null;
        if (!nextOrder && orderId) {
          const res = await orderService.getUserOrderById(orderId);
          nextOrder = res.data?.order || res.data;
        }
        if (!nextOrder) throw new Error('Không tìm thấy đơn hàng');

        if (disposed) return;
        setOrder(nextOrder);

        const bytes = await buildInvoicePdf(nextOrder);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentPdfUrl = url;
        if (!disposed) {
          setPdfUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error('Failed to load order:', e);
        if (!disposed) setError(e?.message || 'Không thể tải đơn hàng');
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    init();
    return () => {
      disposed = true;
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
    };
  }, [orderId, location.state?.order]);

  // Cleanup pdfUrl
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Create payment when order is PENDING or PAID (to get existing payment)
  useEffect(() => {
    if (!order || (order.status !== 'PENDING' && order.status !== 'PAID')) return;

    const createPayment = async () => {
      try {
        setPaymentLoading(true);
        setPaymentError(null);
        const res = await paymentService.createPayment(order.order_id);
        setPayment(res.data);

        // If payment is already PAID, trigger VM polling immediately
        if (res.data.status === 'PAID') {
          setPollingForVM(true);
        }
      } catch (err) {
        console.error('Failed to create payment:', err);

      } finally {
        setPaymentLoading(false);
      }
    };

    createPayment();
  }, [order]);

  // Poll payment status when payment is PENDING (for local development without webhook)
  const pollPaymentStatus = useCallback(async () => {
    if (!payment?.payment_id) return;

    try {
      const res = await paymentService.checkPaymentStatus(payment.payment_id);
      const statusUpdate = res.data;

      // Only update status and paid_at, preserve QR code and other data from initial payment creation
      setPayment(prev => ({
        ...prev,
        status: statusUpdate.status,
        paid_at: statusUpdate.paid_at
      }));

      // If payment is now PAID, stop polling and trigger VM polling
      if (statusUpdate.status === 'PAID') {
        setPollingPayment(false);
        if (paymentPollingIntervalRef.current) {
          clearInterval(paymentPollingIntervalRef.current);
          paymentPollingIntervalRef.current = null;
        }
        setPollingForVM(true);
      }
    } catch (err) {
      console.error('Failed to poll payment status:', err);
    }
  }, [payment?.payment_id]);

  // Start payment polling when payment is created and PENDING
  useEffect(() => {
    const shouldPollPayment = payment?.status === 'PENDING';

    if (!shouldPollPayment) {
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

  // Poll for VM creation after payment is PAID
  const pollForVMStatus = useCallback(async () => {
    try {
      const res = await instanceService.getAllInstances();
      const allInstances = res.data?.instances || [];
      setInstances(allInstances);

      const waitingInstances = allInstances.filter(
        inst => inst.status === 'WAIT_FOR_USER_UPDATE_SSH_KEY'
      );

      if (waitingInstances.length > 0) {
        setVmReady(true);
        setPollingForVM(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to poll instances:', err);
    }
  }, []);

  useEffect(() => {
    // Start polling when payment is PAID (either from order status or payment status)
    const shouldPoll = (order?.status === 'PAID') || (payment?.status === 'PAID');

    if (!shouldPoll || vmReady) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    if (!pollingForVM) {
      setPollingForVM(true);
    }

    pollForVMStatus();
    pollingIntervalRef.current = setInterval(pollForVMStatus, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [order, payment, vmReady, pollingForVM, pollForVMStatus]);

  // Generate SSH keys
  const handleGenerateSSHKey = async () => {
    try {
      const res = await instanceService.generateSSHKey();
      setGeneratedKeys(res.data);
      setSshConfig(prev => ({ ...prev, sshkeys: res.data.public_key }));
    } catch (err) {
      console.error('Failed to generate SSH key:', err);
      alert('Không thể tạo SSH key. Vui lòng thử lại.');
    }
  };

  // Submit SSH configuration
  const handleSubmitSSH = async () => {
    const waitingInstances = instances.filter(
      inst => inst.status === 'WAIT_FOR_USER_UPDATE_SSH_KEY'
    );

    if (waitingInstances.length === 0) {
      alert('Không tìm thấy máy ảo cần cấu hình');
      return;
    }

    if (!sshConfig.sshkeys.trim()) {
      alert('Vui lòng nhập hoặc tạo SSH key');
      return;
    }

    if (!sshConfig.cipassword.trim()) {
      alert('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setSshSubmitting(true);
      setSshError(null);

      const instance = waitingInstances[0];
      await instanceService.configureSSH(instance.instance_id, {
        ciuser: sshConfig.ciuser,
        cipassword: sshConfig.cipassword,
        nameserver: sshConfig.nameserver,
        sshkeys: sshConfig.sshkeys
      });

      alert('Cấu hình SSH thành công! Máy ảo đang khởi động...');
      navigate('/dashboard/instances');
    } catch (err) {
      console.error('Failed to configure SSH:', err);
      setSshError(err?.response?.data?.error || err?.message || 'Không thể cấu hình SSH');
    } finally {
      setSshSubmitting(false);
    }
  };

  const badge = getStatusBadge(order?.status);
  const currentStep = useMemo(() => {
    if (vmReady) return 2;
    if (pollingForVM) return 1;
    return getStatusStep(order?.status);
  }, [order?.status, pollingForVM, vmReady]);

  const steps = [
    {
      title: 'Đặt hàng',
      description: 'Đơn hàng đã được đặt',
    },
    {
      title: 'Thanh toán',
      description: 'Đang chờ thanh toán',
    },
    {
      title: 'Chờ xác nhận',
      description: 'Cấu hình máy ảo',
    },
    {
      title: 'Thành công',
      description: 'Đơn hàng đã hoàn thành',
    },
  ];

  if (loading) {
    return (
      <div className="order-details-page">
        <Container className="py-5">
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3" />
            <div>Đang tải đơn hàng...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Không thể tải đơn hàng</Alert.Heading>
            <div className="mb-3">{error || 'Không tìm thấy đơn hàng'}</div>
            <Button variant="primary" onClick={() => navigate('/cart')}>
              Quay lại giỏ hàng
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <Container className="py-4 container">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 className="mb-1">Đơn hàng</h2>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg={badge.variant} className="px-3 py-2">
              {badge.label}
            </Badge>
            <Button variant="primary" onClick={() => downloadInvoicePdf(order)}>
              <i className="fa-solid fa-download me-2"></i>
              Tải hóa đơn PDF
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/cart')}>
              Về giỏ hàng
            </Button>
          </div>
        </div>

        {/* Order Status Steps */}
        <Card className="mb-4">
          <Card.Body>
            <Steps current={currentStep} items={steps} />
          </Card.Body>
        </Card>

        {/* Step 2: Payment QR Code */}
        {order.status === 'PENDING' && payment?.status !== 'PAID' && (
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Thanh toán</h4>
              {paymentLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang tạo mã thanh toán...
                </div>
              ) : paymentError ? (
                <Alert variant="danger">{paymentError}</Alert>
              ) : payment ? (
                <Row>
                  <Col md={6}>
                    <div className="text-center">
                      <h5>Quét mã QR để thanh toán</h5>

                      {payment.qr_content ? (
                        <div className="my-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payment.qr_content)}`}
                            alt="QR Code thanh toán"
                            style={{ maxWidth: '300px', width: '100%', border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}
                            onError={(e) => {
                              // Fallback to link button if QR fails
                              e.target.style.display = 'none';
                              const fallback = document.getElementById('qr-fallback-link');
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                          <div id="qr-fallback-link" style={{ display: 'none' }} className="my-3">
                            <p className="text-muted">Không thể tải QR code</p>
                            <a
                              href={payment.qr_content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                            >
                              <i className="fa-solid fa-external-link me-2"></i>
                              Mở trang thanh toán PayOS
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted">Đang tải QR code...</p>
                      )}

                      {/* Fallback button is less necessary now, but you can keep it if payment.qr_content implies a URL */}

                      <div className="mt-3">
                        <p><strong>Số tiền:</strong> {formatPrice(payment.amount)} {payment.currency}</p>
                        <p><strong>Ngân hàng:</strong> {payment.bank_name}</p>
                        <p><strong>Số tài khoản:</strong> {payment.bank_account}</p>
                        <p className="text-muted small">
                          Nội dung: {payment.qr_content || order.order_id}
                        </p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <Alert variant="info">
                      <h6>Hướng dẫn thanh toán:</h6>
                      <ol className="mb-0">
                        <li>Mở ứng dụng ngân hàng của bạn</li>
                        <li>Quét mã QR bên trái</li>
                        <li>Xác nhận thanh toán</li>
                        <li>Chờ hệ thống xác nhận (tự động)</li>
                      </ol>
                    </Alert>
                  </Col>
                </Row>
              ) : null}
            </Card.Body>
          </Card>
        )}

        {/* Step 2.5: Waiting for VM Creation */}
        {pollingForVM && !vmReady && (
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center py-4">
                <Spinner animation="border" className="mb-3" />
                <h5>Đang tạo máy ảo...</h5>
                <p className="text-muted">Vui lòng chờ trong giây lát. Quá trình này có thể mất 1-2 phút.</p>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Step 3: SSH Configuration */}
        {vmReady && (
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Cấu hình SSH Key</h4>
              <Alert variant="success">
                <i className="fa-solid fa-check-circle me-2"></i>
                Máy ảo đã được tạo thành công! Vui lòng cấu hình SSH key để truy cập.
              </Alert>

              {sshError && <Alert variant="danger">{sshError}</Alert>}

              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={sshConfig.ciuser}
                        onChange={(e) => setSshConfig(prev => ({ ...prev, ciuser: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Password *</Form.Label>
                      <Form.Control
                        type="password"
                        value={sshConfig.cipassword}
                        onChange={(e) => setSshConfig(prev => ({ ...prev, cipassword: e.target.value }))}
                        placeholder="Nhập mật khẩu"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Nameserver</Form.Label>
                  <Form.Control
                    type="text"
                    value={sshConfig.nameserver}
                    onChange={(e) => setSshConfig(prev => ({ ...prev, nameserver: e.target.value }))}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>SSH Public Key *</Form.Label>
                  <div className="mb-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleGenerateSSHKey}
                    >
                      <i className="fa-solid fa-key me-2"></i>
                      Tạo SSH Key mới
                    </Button>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={sshConfig.sshkeys}
                    onChange={(e) => setSshConfig(prev => ({ ...prev, sshkeys: e.target.value }))}
                    placeholder="Dán SSH public key của bạn hoặc nhấn nút 'Tạo SSH Key mới'"
                  />
                  <Form.Text className="text-muted">
                    SSH key phải bắt đầu với ssh-rsa, ssh-ed25519, hoặc ecdsa-sha2-*
                  </Form.Text>
                </Form.Group>

                {generatedKeys && (
                  <Alert variant="warning">
                    <h6>Private Key (Lưu lại ngay!):</h6>
                    <pre className="mb-0" style={{ fontSize: '0.85em', maxHeight: '200px', overflow: 'auto' }}>
                      {generatedKeys.private_key}
                    </pre>
                    <small className="text-danger d-block mt-2">
                      ⚠️ Đây là lần duy nhất bạn có thể xem private key. Vui lòng lưu lại ngay!
                    </small>
                  </Alert>
                )}

                <div className="d-flex gap-2">
                  <Button
                    variant="success"
                    onClick={handleSubmitSSH}
                    disabled={sshSubmitting}
                  >
                    {sshSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang cấu hình...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check me-2"></i>
                        Hoàn tất cấu hình
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        <Row className="g-3">
          <Col lg={5}>
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <div className="text-muted">Tổng tiền</div>
                  <div className="fw-bold">
                    {formatPrice(order.total_amount)} {order.currency || 'VND'}
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h5 className="mb-3">Sản phẩm</h5>
                <Table responsive size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th className="text-center" width="100px">Chu kỳ</th>
                      <th className="text-end">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((it) => (
                      <tr key={it.product_id}>
                        <td>{it.product_name || it.product_id}</td>
                        <td>{getCycleLabel(it.billing_cycle)}</td>
                        <td className="text-end">{formatPrice(it.total_price)} {order.currency || 'VND'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={7}>
            <Card className="invoice-preview-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Hóa đơn</h5>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadInvoicePdf(order)}
                  >
                    <i className="fa-solid fa-download me-2"></i>
                    In hóa đơn PDF
                  </Button>
                </div>
                {!pdfUrl ? (
                  <Alert variant="warning" className="mb-0">Không thể tạo hóa đơn PDF để preview.</Alert>
                ) : (
                  <div className="invoice-viewer">
                    <PdfViewer fileUrl={pdfUrl} />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OrderDetails;
