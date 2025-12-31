import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { orderService } from '../../services/orderService';
import './PrintInvoice.css';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0);

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

const PrintInvoice = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(location.state?.order || null);
  const [currentOrderId, setCurrentOrderId] = useState(orderId || location.state?.order?.order_id || null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        let nextOrder = location.state?.order || null;
        let finalOrderId = orderId || nextOrder?.order_id;
        
        if (!nextOrder && finalOrderId) {
          const res = await orderService.getUserOrderById(finalOrderId);
          nextOrder = res.data?.order || res.data;
          finalOrderId = nextOrder?.order_id || finalOrderId;
        }
        if (!nextOrder) throw new Error('Không tìm thấy đơn hàng');

        setOrder(nextOrder);
        if (nextOrder?.order_id) {
          setCurrentOrderId(nextOrder.order_id);
        }
      } catch (e) {
        console.error('Failed to load order:', e);
        setError(e?.message || 'Không thể tải đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, location.state]);

  useEffect(() => {
    // Auto print when component loads and order is ready
    if (!loading && order && !error) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Note: Browser headers/footers can only be disabled in print dialog settings
        // This will open print dialog - user needs to uncheck "Headers and footers" option
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, order, error]);

  const handlePrint = () => {
    // Open print dialog
    window.print();
  };

  if (loading) {
    return (
      <div className="print-invoice-page">
        <Container className="py-5">
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-3" />
            <div>Đang tải hóa đơn...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="print-invoice-page">
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Không thể tải hóa đơn</Alert.Heading>
            <div className="mb-3">{error || 'Không tìm thấy đơn hàng'}</div>
            <Button variant="primary" onClick={() => {
              if (currentOrderId) {
                navigate(`/order/${currentOrderId}`);
              } else {
                navigate('/cart');
              }
            }}>
              Quay lại
            </Button>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="print-invoice-page">
      {/* Print controls - hidden when printing */}
      <div className="no-print print-controls">
        <Container className="py-3">
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-secondary" onClick={() => {
              if (currentOrderId) {
                navigate(`/order/${currentOrderId}`);
              } else {
                navigate('/cart');
              }
            }}>
              ← Quay lại
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i>
              In hóa đơn
            </Button>
          </div>
        </Container>
      </div>

      {/* Invoice content */}
      <Container className="invoice-container">
        <div className="invoice-header">
          <h1 className="invoice-title">HÓA ĐƠN / INVOICE</h1>
          <div className="invoice-meta">
            <div><strong>Order ID:</strong> {order.order_id}</div>
            <div><strong>Status:</strong> {order.status}</div>
            <div><strong>Currency:</strong> {order.currency || 'VND'}</div>
          </div>
        </div>

        <div className="invoice-section">
          <h2 className="section-title">Danh sách sản phẩm</h2>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sản phẩm</th>
                <th>Chu kỳ</th>
                <th className="text-end">Số lượng</th>
                <th className="text-end">Đơn giá</th>
                <th className="text-end">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, idx) => (
                <React.Fragment key={it.product_id || idx}>
                  <tr>
                    <td>{idx + 1}</td>
                    <td><strong>{it.product_name || it.product_id || 'Sản phẩm'}</strong></td>
                    <td>{getCycleLabel(it.billing_cycle)}</td>
                    <td className="text-end">{it.quantity || 1}</td>
                    <td className="text-end">{formatPrice(it.unit_price)} {order.currency || 'VND'}</td>
                    <td className="text-end"><strong>{formatPrice(it.total_price)} {order.currency || 'VND'}</strong></td>
                  </tr>
                  {Array.isArray(it?.config?.addons_applied) && it.config.addons_applied.length > 0 && (
                    <tr className="addon-row">
                      <td colSpan="6">
                        <div className="addons-list">
                          <strong>Addons:</strong>
                          {it.config.addons_applied.map((a, aidx) => (
                            <span key={aidx} className="addon-item">
                              {a.addon_type}: x{a.quantity} {a.unit} = {formatPrice(a.total_price)} {order.currency || 'VND'}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="5" className="text-end"><strong>Tổng thanh toán:</strong></td>
                <td className="text-end"><strong className="total-amount">
                  {formatPrice(order.total_amount)} {order.currency || 'VND'}
                </strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.message && (
          <div className="invoice-footer">
            <div className="invoice-message">
              <strong>Thông điệp:</strong> {order.message}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default PrintInvoice;

