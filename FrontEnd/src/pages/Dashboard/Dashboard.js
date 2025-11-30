import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import { dashboardService } from '../../services/dashboardService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
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

    fetchDashboard();
  }, []);

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="dashboard-page">
        <Container className="py-5">
          <div className="mb-4">
            <h1 className="display-5 mb-2">Dashboard</h1>
            <p className="text-muted">
              Chào mừng, <strong>{user?.name || user?.email}</strong>!
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
              <Row>
                <Col md={4} className="mb-4">
                  <Card className="dashboard-card">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="dashboard-icon bg-primary text-white rounded-circle p-3 me-3">
                          <i className="fas fa-server fa-2x"></i>
                        </div>
                        <div>
                          <h3 className="mb-0">{dashboardData?.stats?.hostingCount || 0}</h3>
                          <p className="text-muted mb-0">Hosting đang sử dụng</p>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4} className="mb-4">
                  <Card className="dashboard-card">
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

                <Col md={4} className="mb-4">
                  <Card className="dashboard-card">
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
              </Row>
            </>
          )}

          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Thông tin tài khoản</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Họ và tên:</strong> {user?.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
                      <p><strong>Số điện thoại:</strong> {user?.phone || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Ngày đăng ký:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                      <p><strong>Trạng thái:</strong> 
                        <span className="badge bg-success ms-2">Hoạt động</span>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;

