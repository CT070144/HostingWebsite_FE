import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge, Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../../services/dashboardService';
import { orderService } from '../../../services/orderService';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { cartItems, getCartItemCount } = useCart();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getDashboard();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await orderService.getUserOrders();
        setOrders(response.data?.orders || response.data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    fetchDashboard();
    fetchOrders();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', text: 'Chờ xử lý' },
      processing: { variant: 'info', text: 'Đang xử lý' },
      completed: { variant: 'success', text: 'Hoàn thành' },
      cancelled: { variant: 'danger', text: 'Đã hủy' },
      paid: { variant: 'success', text: 'Đã thanh toán' },
      unpaid: { variant: 'warning', text: 'Chưa thanh toán' },
    };
    const statusInfo = statusMap[status?.toLowerCase()] || { variant: 'secondary', text: status || 'N/A' };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  return (
    <div className="client-dashboard-page">
      <Container className="py-5">
        <div className="mb-4">
          <h1 className="display-5 mb-2">Dashboard Khách hàng</h1>
          <p className="text-muted">
            Chào mừng, <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})!
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Row className="mb-4">
              <Col md={3} className="mb-3">
                <Card className="dashboard-card h-100" style={{ cursor: 'pointer' }} onClick={() => navigate('/instances')}>
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="dashboard-icon bg-primary text-white rounded-circle p-3 me-3">
                        <i className="fas fa-server fa-2x"></i>
                      </div>
                      <div>
                        <h3 className="mb-0">{dashboardData?.stats?.hostingCount || 0}</h3>
                        <p className="text-muted mb-0">Instance đang sử dụng</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-3">
                <Card className="dashboard-card h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="dashboard-icon bg-success text-white rounded-circle p-3 me-3">
                        <i className="fas fa-globe fa-2x"></i>
                      </div>
                      <div>
                        <h3 className="mb-0">{dashboardData?.stats?.domainCount || 0}</h3>
                        <p className="text-muted mb-0">Domain đã đăng ký</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-3">
                <Card className="dashboard-card h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="dashboard-icon bg-info text-white rounded-circle p-3 me-3">
                        <i className="fas fa-file-invoice fa-2x"></i>
                      </div>
                      <div>
                        <h3 className="mb-0">{dashboardData?.stats?.unpaidInvoices || 0}</h3>
                        <p className="text-muted mb-0">Hóa đơn chưa thanh toán</p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-3">
                <Card className="dashboard-card h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="dashboard-icon bg-warning text-white rounded-circle p-3 me-3">
                        <i className="fas fa-shopping-cart fa-2x"></i>
                      </div>
                      <div>
                        <h3 className="mb-0">{getCartItemCount()}</h3>
                        <p className="text-muted mb-0">Sản phẩm trong giỏ</p>
                        {getCartItemCount() > 0 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 mt-1"
                            onClick={() => navigate('/cart')}
                          >
                            Xem giỏ hàng
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Orders */}
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Đơn hàng gần đây</h5>
                    <Button variant="outline-primary" size="sm" onClick={() => navigate('/orders')}>
                      Xem tất cả
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {orders.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted">Bạn chưa có đơn hàng nào</p>
                        <Button variant="primary" onClick={() => navigate('/hosting')}>
                          Mua sản phẩm ngay
                        </Button>
                      </div>
                    ) : (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Mã đơn hàng</th>
                            <th>Sản phẩm</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id}>
                              <td>#{order.orderNumber || order.id?.slice(0, 8)}</td>
                              <td>
                                {order.items?.map((item, idx) => (
                                  <div key={idx}>
                                    {item.productName || item.name} ({item.quantity || 1}x)
                                  </div>
                                )) || order.productName || 'N/A'}
                              </td>
                              <td>{formatDate(order.created_at || order.createdAt)}</td>
                              <td>{formatPrice(order.total || order.totalAmount || 0)} VNĐ</td>
                              <td>{getStatusBadge(order.status)}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  Chi tiết
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Account Information */}
            <Row>
              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Thông tin tài khoản</h5>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Họ và tên:</strong> {user?.firstName} {user?.lastName}</p>
                    <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                    <p><strong>Vai trò:</strong>
                      <Badge bg="info" className="ms-2">
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                      </Badge>
                    </p>
                    <p><strong>Ngày đăng ký:</strong> {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                    <Button variant="outline-primary" size="sm" className="mt-2">
                      Cập nhật thông tin
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Hành động nhanh</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-2">
                      <Button variant="primary" onClick={() => navigate('/hosting')}>
                        <i className="fas fa-server me-2"></i>
                        Mua Hosting
                      </Button>
                      <Button variant="outline-primary" onClick={() => navigate('/cart')}>
                        <i className="fas fa-shopping-cart me-2"></i>
                        Xem giỏ hàng ({getCartItemCount()})
                      </Button>
                      <Button variant="outline-secondary" onClick={() => navigate('/pricing')}>
                        <i className="fas fa-tags me-2"></i>
                        Xem bảng giá
                      </Button>
                      <Button variant="outline-info" onClick={() => navigate('/contact')}>
                        <i className="fas fa-headset me-2"></i>
                        Liên hệ hỗ trợ
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default ClientDashboard;

