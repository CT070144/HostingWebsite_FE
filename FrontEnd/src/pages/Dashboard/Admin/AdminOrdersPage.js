import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Form, Pagination, Alert, Modal } from 'react-bootstrap';
import { orderService } from '../../../services/orderService';
import { useNotify } from '../../../contexts/NotificationContext';
import './Admin.css';
import './AdminOrdersPage.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') {
    return { variant: 'success', label: s };
  }
  if (s === 'PENDING') {
    return { variant: 'warning', label: s };
  }
  if (s === 'CANCELLED' || s === 'FAILED') {
    return { variant: 'danger', label: s };
  }
  return { variant: 'secondary', label: s || 'UNKNOWN' };
};

const AdminOrdersPage = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // All orders for statistics
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  
  // Modal state for order details
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Fetch ALL orders for statistics (fetch all pages)
  useEffect(() => {
    const fetchAllOrdersForStats = async () => {
      try {
        setLoadingStats(true);
        let allOrdersData = [];
        let currentPage = 1;
        let hasMore = true;
        const fetchLimit = 100; // Fetch 100 per page
        
        // Fetch all pages until no more data
        while (hasMore) {
          const response = await orderService.list({ 
            page: currentPage, 
            limit: fetchLimit 
          });
          const data = response.data;
          const orders = Array.isArray(data.orders) ? data.orders : [];
          
          if (orders.length > 0) {
            allOrdersData = [...allOrdersData, ...orders];
            currentPage++;
            
            // Check if there are more pages
            const total = data.total || 0;
            hasMore = allOrdersData.length < total;
          } else {
            hasMore = false;
          }
        }
        
        setAllOrders(allOrdersData);
      } catch (err) {
        console.error('Failed to fetch all orders for stats:', err);
        setAllOrders([]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAllOrdersForStats();
  }, [dateFilter]); // Refresh stats when date filter changes

  // Fetch orders for table (with pagination)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page,
          limit,
        };
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await orderService.list(params);
        const data = response.data;
        
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(err?.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, limit, statusFilter]);

  // Calculate statistics from ALL orders (not just current page)
  const stats = useMemo(() => {
    // Use allOrders for statistics, not just current page orders
    const ordersForStats = allOrders;
    
    // Filter by date if needed
    let filteredOrders = ordersForStats;
    if (dateFilter !== 'all') {
      const now = new Date();
      filteredOrders = ordersForStats.filter((order) => {
        const orderDate = new Date(order.created_at);
        if (dateFilter === 'today') {
          return orderDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        }
        if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, order) => {
      return sum + (order.total_amount || 0);
    }, 0);

    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = (order.status || 'UNKNOWN').toUpperCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const revenueByStatus = filteredOrders.reduce((acc, order) => {
      const status = (order.status || 'UNKNOWN').toUpperCase();
      acc[status] = (acc[status] || 0) + (order.total_amount || 0);
      return acc;
    }, {});

    // Group by date for chart
    const revenueByDate = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('vi-VN');
      acc[date] = (acc[date] || 0) + (order.total_amount || 0);
      return acc;
    }, {});

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      statusCounts,
      revenueByStatus,
      revenueByDate,
    };
  }, [orders, dateFilter]);

  // Chart configurations
  const statusChartConfig = useMemo(() => {
    const labels = Object.keys(stats.statusCounts);
    const data = Object.values(stats.statusCounts);
    const colors = {
      PENDING: 'rgba(255, 193, 7, 0.8)',
      PAID: 'rgba(40, 167, 69, 0.8)',
      SUCCESS: 'rgba(40, 167, 69, 0.8)',
      COMPLETED: 'rgba(40, 167, 69, 0.8)',
      CANCELLED: 'rgba(220, 53, 69, 0.8)',
      FAILED: 'rgba(220, 53, 69, 0.8)',
    };

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Số đơn hàng',
            data: data,
            backgroundColor: labels.map((label) => colors[label] || 'rgba(108, 117, 125, 0.8)'),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed} đơn`,
            },
          },
        },
      },
    };
  }, [stats.statusCounts]);

  const revenueChartConfig = useMemo(() => {
    const dateLabels = Object.keys(stats.revenueByDate).sort();
    const revenueData = dateLabels.map((date) => stats.revenueByDate[date]);

    return {
      data: {
        labels: dateLabels,
        datasets: [
          {
            label: 'Doanh thu (VND)',
            data: revenueData,
            backgroundColor: 'rgba(29, 78, 216, 0.8)',
            borderColor: 'rgba(29, 78, 216, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Doanh thu: ${formatPrice(context.parsed.y)} VND`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatPrice(value),
            },
          },
        },
      },
    };
  }, [stats.revenueByDate]);

  const revenueByStatusChartConfig = useMemo(() => {
    const labels = Object.keys(stats.revenueByStatus);
    const data = Object.values(stats.revenueByStatus);
    const colors = {
      PENDING: 'rgba(255, 193, 7, 0.8)',
      PAID: 'rgba(40, 167, 69, 0.8)',
      SUCCESS: 'rgba(40, 167, 69, 0.8)',
      COMPLETED: 'rgba(40, 167, 69, 0.8)',
      CANCELLED: 'rgba(220, 53, 69, 0.8)',
      FAILED: 'rgba(220, 53, 69, 0.8)',
    };

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu (VND)',
            data: data,
            backgroundColor: labels.map((label) => colors[label] || 'rgba(108, 117, 125, 0.8)'),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${formatPrice(context.parsed.y)} VND`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatPrice(value),
            },
          },
        },
      },
    };
  }, [stats.revenueByStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      notifySuccess('Cập nhật trạng thái đơn hàng thành công');
      
      // Refresh orders for table
      const response = await orderService.list({ page, limit, status: statusFilter !== 'all' ? statusFilter : undefined });
      const data = response.data;
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      
      // Refresh all orders for statistics (fetch all pages)
      try {
        let allOrdersData = [];
        let currentPage = 1;
        let hasMore = true;
        const fetchLimit = 100;
        
        while (hasMore) {
          const statsResponse = await orderService.list({ 
            page: currentPage, 
            limit: fetchLimit 
          });
          const statsData = statsResponse.data;
          const orders = Array.isArray(statsData.orders) ? statsData.orders : [];
          
          if (orders.length > 0) {
            allOrdersData = [...allOrdersData, ...orders];
            currentPage++;
            
            const total = statsData.total || 0;
            hasMore = allOrdersData.length < total;
          } else {
            hasMore = false;
          }
        }
        
        setAllOrders(allOrdersData);
      } catch (statsErr) {
        console.error('Failed to refresh stats:', statsErr);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      notifyError(err?.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      setLoadingOrderDetail(true);
      setShowOrderModal(true);
      setSelectedOrder(null);
      
      const response = await orderService.getById(orderId);
      const order = response.data?.order || response.data;
      setSelectedOrder(order);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      notifyError(err?.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
      setShowOrderModal(false);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const getCycleLabel = (cycle) => {
    const num = typeof cycle === 'string' ? parseInt(cycle) : cycle;
    if (isNaN(num) || num === 0) return '—';
    if (num === 3) return '3 tháng';
    if (num === 6) return '6 tháng';
    if (num === 12) return '1 năm';
    return `${num} tháng`;
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && orders.length === 0) {
    return (
      <div className="dashboard-overview">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Quản lý đơn hàng</h1>
        <div className="d-flex gap-2">
          <Form.Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
          </Form.Select>
          <Form.Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
          </Form.Select>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-label">Tổng đơn hàng</div>
              {loadingStats ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <div className="stat-value">{stats.totalOrders}</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-label">Tổng doanh thu</div>
              {loadingStats ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <div className="stat-value">{formatPrice(stats.totalRevenue)} VND</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-label">Đơn hàng đang chờ xử lý</div>
              {loadingStats ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <div className="stat-value">{stats.statusCounts.PENDING || 0}</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-label">Đơn hàng thành công</div>
              {loadingStats ? (
                <Spinner animation="border" size="sm" />
              ) : (   
                <div className="stat-value">
                  {(stats.statusCounts.PAID || 0) + (stats.statusCounts.SUCCESS || 0) + (stats.statusCounts.COMPLETED || 0)}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Phân bổ đơn hàng theo trạng thái</h5>
              {statusChartConfig && (
                <div style={{ height: '300px' }}>
                  <Doughnut data={statusChartConfig.data} options={statusChartConfig.options} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Doanh thu theo trạng thái</h5>
              {revenueByStatusChartConfig && (
                <div style={{ height: '300px' }}>
                  <Bar data={revenueByStatusChartConfig.data} options={revenueByStatusChartConfig.options} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Doanh thu theo ngày</h5>
              {revenueChartConfig && Object.keys(stats.revenueByDate).length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Line data={revenueChartConfig.data} options={revenueChartConfig.options} />
                </div>
              ) : (
                <div className="text-center text-muted py-5">Không có dữ liệu</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Danh sách đơn hàng</h5>
            <div className="text-muted">
              Tổng: {total} đơn hàng
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Không có đơn hàng nào
            </div>
          ) : (
            <>
              <Table responsive hover className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User ID</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                    <th>Số sản phẩm</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const badge = getStatusBadge(order.status);
                    const itemCount = Array.isArray(order.items) ? order.items.length : 0;
                    
                    return (
                      <tr key={order.order_id}>
                        <td>
                          <code className="text-primary">{order.order_id.substring(0, 8)}...</code>
                        </td>
                        <td>
                          <code>{order.user_id?.substring(0, 8)}...</code>
                        </td>
                        <td>
                          <Badge bg={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td>
                          <strong>{formatPrice(order.total_amount)} {order.currency || 'VND'}</strong>
                        </td>
                        <td>{itemCount}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Form.Select
                              size="sm"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                              style={{ width: 'auto', minWidth: '120px' }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PAID">PAID</option>
                              <option value="SUCCESS">SUCCESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                              <option value="FAILED">FAILED</option>
                            </Form.Select>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewOrder(order.order_id)}
                              title="Xem chi tiết đơn hàng"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    />
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 2 && pageNum <= page + 2)
                      ) {
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === page}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      }
                      if (pageNum === page - 3 || pageNum === page + 3) {
                        return <Pagination.Ellipsis key={pageNum} />;
                      }
                      return null;
                    })}
                    <Pagination.Next
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        size="lg"
        centered
        scrollable
        className="modal-content-order"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-shopping-cart me-2"></i>
            Chi tiết đơn hàng
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingOrderDetail ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" />
              <p className="mt-3">Đang tải chi tiết đơn hàng...</p>
            </div>
          ) : selectedOrder ? (
            <>
              {/* Order Info */}
              <div className="mb-4">
                <h5 className="mb-3">Thông tin đơn hàng</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Order ID:</span>
                      <code className="text-primary">{selectedOrder.order_id}</code>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">User ID:</span>
                      <code>{selectedOrder.user_id}</code>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Trạng thái:</span>
                      <Badge bg={getStatusBadge(selectedOrder.status).variant}>
                        {getStatusBadge(selectedOrder.status).label}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tổng tiền:</span>
                      <strong className="text-primary">
                        {formatPrice(selectedOrder.total_amount)} {selectedOrder.currency || 'VND'}
                      </strong>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Ngày tạo:</span>
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Ngày cập nhật:</span>
                      <span>{formatDate(selectedOrder.updated_at)}</span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h5 className="mb-3">Sản phẩm trong đơn hàng</h5>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
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
                        {selectedOrder.items.map((item, idx) => (
                          <React.Fragment key={item.order_item_id || idx}>
                            <tr>
                              <td>{idx + 1}</td>
                              <td>
                                <strong>{item.product_name || item.product_id || 'Sản phẩm'}</strong>
                              </td>
                              <td>{getCycleLabel(item.billing_cycle)}</td>
                              <td className="text-end">{item.quantity || 1}</td>
                              <td className="text-end">
                                {formatPrice(item.unit_price)} {selectedOrder.currency || 'VND'}
                              </td>
                              <td className="text-end">
                                <strong>{formatPrice(item.total_price)} {selectedOrder.currency || 'VND'}</strong>
                              </td>
                            </tr>
                            {/* Config Info */}
                            {item.config && (
                              <tr className="bg-light">
                                <td colSpan="6" className="p-3">
                                  <div className="small">
                                    <div className="mb-2">
                                      <strong>Cấu hình:</strong>
                                    </div>
                                    <Row className="g-2">
                                      {item.config.os_template_id && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">OS:</span>{' '}
                                          <code>{item.config.os_template_id}</code>
                                        </Col>
                                      )}
                                      {item.config.cpu > 0 && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">CPU:</span> {item.config.cpu} cores
                                        </Col>
                                      )}
                                      {item.config.ram > 0 && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">RAM:</span> {item.config.ram} GB
                                        </Col>
                                      )}
                                      {item.config.disk > 0 && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">Disk:</span> {item.config.disk} GB
                                        </Col>
                                      )}
                                      {item.config.ip > 0 && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">IP:</span> {item.config.ip}
                                        </Col>
                                      )}
                                      {item.config.control_panel && (
                                        <Col xs={6} md={4}>
                                          <span className="text-muted">Control Panel:</span> Có
                                        </Col>
                                      )}
                                    </Row>
                                    {/* Addons */}
                                    {Array.isArray(item.config.addons_applied) && item.config.addons_applied.length > 0 && (
                                      <div className="mt-2">
                                        <strong>Addons:</strong>
                                        <ul className="mb-0 mt-1">
                                          {item.config.addons_applied.map((addon, aidx) => (
                                            <li key={aidx}>
                                              {addon.addon_type}: x{addon.quantity} {addon.unit} ={' '}
                                              {formatPrice(addon.total_price)} {selectedOrder.currency || 'VND'}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {/* Discount */}
                                    {item.config.discount_applied && (
                                      <div className="mt-2">
                                        <strong>Giảm giá:</strong> {item.config.discount_applied.code} (
                                        {item.config.discount_applied.discount_percent}%) -{' '}
                                        {formatPrice(item.config.discount_applied.discount_amount)}{' '}
                                        {selectedOrder.currency || 'VND'}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-primary">
                          <td colSpan="5" className="text-end">
                            <strong>Tổng thanh toán:</strong>
                          </td>
                          <td className="text-end">
                            <strong className="fs-5">
                              {formatPrice(selectedOrder.total_amount)} {selectedOrder.currency || 'VND'}
                            </strong>
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-0">
                    Không có sản phẩm nào trong đơn hàng này.
                  </Alert>
                )}
              </div>

              {/* Message if exists */}
              {selectedOrder.message && (
                <div className="mb-3">
                  <h6>Ghi chú:</h6>
                  <p className="text-muted mb-0">{selectedOrder.message}</p>
                </div>
              )}
            </>
          ) : (
            <Alert variant="warning" className="mb-0">
              Không thể tải chi tiết đơn hàng.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-order">
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
