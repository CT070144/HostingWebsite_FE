import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { Steps } from 'antd';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { orderService } from '../../services/orderService';
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
  if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'DELIVERED') return 3; // Thành công
  if (s === 'CONFIRMED' || s === 'PROCESSING') return 2; // Chờ xác nhận
  if (s === 'PAID') return 1; // Thanh toán
  if (s === 'PENDING') return 0; // Đặt hàng
  return 0; // Default to first step
};

const getCycleLabel = (cycle) => {
  if (cycle === null || cycle === undefined || cycle === '') {
    return '—'; // Return dash if cycle is not available
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
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  const margin = 48;
  let y = 800;
  const pageWidth = 595.28;
  const contentWidth = pageWidth - (margin * 2);

  // Helper to truncate text to fit within maxWidth
  const truncateText = (text, maxWidth, fontSize = 10) => {
    const str = String(text ?? '');
    if (!str) return '';
    // Approximate character width (Helvetica at size 10 is ~6px per char)
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

  // Header
  drawText('HOA DON / INVOICE', { bold: true, size: 18, y });
  y -= 28;
  drawText(`Order ID: ${order?.order_id || ''}`, { y, bold: true });
  y -= 18;
  drawText(`Status: ${order?.status || ''}`, { y });
  y -= 18;
  drawText(`Currency: ${order?.currency || 'VND'}`, { y });
  y -= 30;

  // Table setup
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

  // Table header
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

  // Table rows
  const items = Array.isArray(order?.items) ? order.items : [];
  items.forEach((it, idx) => {
    if (y < 150) return; // Prevent overflow
    
    const rowY = y;
    const cycleLabel = transliterateVi(getCycleLabel(it.billing_cycle));
    
    // Draw row border
    drawLine(margin, rowY, pageWidth - margin, rowY, 0.5, rgb(0.7, 0.7, 0.7));
    
    // Draw column borders
    drawLine(colX.name, rowY, colX.name, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.cycle, rowY, colX.cycle, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.quantity, rowY, colX.quantity, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.unitPrice, rowY, colX.unitPrice, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    drawLine(colX.total, rowY, colX.total, rowY - rowHeight, 0.5, rgb(0.7, 0.7, 0.7));
    
    // Draw cell content with maxWidth to prevent overflow
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

    // Addons row (if any)
    const addons = it?.config?.addons_applied;
    if (Array.isArray(addons) && addons.length > 0) {
      if (y < 150) return;
      
      // Draw addons in multiple lines if needed
      const addonMaxWidth = (colX.cycle + colWidths.cycle + colWidths.quantity + colWidths.unitPrice + colWidths.total) - colX.name - 6;
      let addonY = y;
      let addonText = 'Addons: ';
      
      addons.forEach((a, aIdx) => {
        const addonItem = `${a.addon_type}: x${a.quantity} ${a.unit} = ${formatPrice(a.total_price)}`;
        const testText = addonText + (aIdx > 0 ? ', ' : '') + addonItem;
        
        // Check if text fits, if not start new line
        if (testText.length * 4.5 > addonMaxWidth && aIdx > 0) {
          // Draw current line and start new
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
      
      // Draw remaining addon text
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

  // Table footer
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

// Function to download PDF invoice
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
        console.log(nextOrder);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Separate effect to cleanup pdfUrl when component unmounts or pdfUrl changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const badge = getStatusBadge(order?.status);
  const currentStep = useMemo(() => getStatusStep(order?.status), [order?.status]);

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
      description: 'Đang chờ xác nhận',
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
      <Container className="py-4  container">
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


