import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../../services/adminService';
import './Admin.css';

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

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAdminDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  const formatNumber = (num) => new Intl.NumberFormat('vi-VN').format(num);

  const revenueChartConfig = useMemo(() => {
    if (!dashboardData) return null;

    return {
      data: {
        labels: dashboardData.revenueData.map((item) => item.date),
        datasets: [
          {
            label: '6 ngày qua',
            data: dashboardData.revenueData.map((item) => item.last6Days),
            backgroundColor: 'rgba(59, 130, 246, 0.9)',
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: 'Tuần trước',
            data: dashboardData.revenueData.map((item) => item.lastWeek),
            backgroundColor: 'rgba(229, 231, 235, 1)',
            borderColor: 'rgba(209, 213, 219, 1)',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(context.parsed.y),
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            grid: {
              color: 'rgba(226, 232, 240, 0.8)',
            },
            ticks: {
              callback: (value) => formatNumber(value),
            },
          },
        },
      },
    };
  }, [dashboardData]);

  const orderTimeChartConfig = useMemo(() => {
    if (!dashboardData) return null;

    const colors = ['#60a5fa', '#3b82f6', '#93c5fd'];

    return {
      data: {
        labels: dashboardData.orderTimeData.map(
          (item) => `${item.label} (${item.percentage}%)`
        ),
        datasets: [
          {
            data: dashboardData.orderTimeData.map((item) => item.orders),
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                return `${label}: ${formatNumber(value)} đơn`;
              },
            },
          },
        },
      },
    };
  }, [dashboardData]);

  const orderStatusChartConfig = useMemo(() => {
    const mockStatusData = [
      { label: 'Hoàn thành', value: 125 },
      { label: 'Chờ xử lý', value: 45 },
      { label: 'Đang xử lý', value: 32 },
      { label: 'Đã hủy', value: 12 },
    ];

    const labels = mockStatusData.map((item) => item.label);
    const data = mockStatusData.map((item) => item.value);

    return {
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: ['#22c55e', '#facc15', '#3b82f6', '#ef4444'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                return `${label}: ${formatNumber(value)} đơn`;
              },
            },
          },
        },
      },
    };
  }, []);

  const ordersLineChartConfig = useMemo(() => {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const mockOrders = [120, 180, 140, 220, 260, 190, 130];

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Đơn hàng theo ngày',
            data: mockOrders,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.16)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#60a5fa',
            borderWidth: 2,
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
              label: (context) => `${formatNumber(context.parsed.y)} đơn`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280' },
          },
          y: {
            grid: { color: 'rgba(209, 213, 219, 0.6)' },
            ticks: {
              color: '#6b7280',
              callback: (value) => formatNumber(value),
            },
          },
        },
      },
    };
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="admin-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <h1 className="page-title">Dashboard</h1>

      {/* Stats + Order Status Row */}
      <div className="stats-status-row">
        {/* Stats Cards 2x2 bên trái */}
        <div className="stats-grid">
          <div className="stat-card revenue">
            <div className="stat-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Doanh thu</div>
              <div className="stat-value">
                {formatCurrency(dashboardData.stats.totalRevenue)}
              </div>
              <div
                className={`stat-change ${
                  dashboardData.stats.revenueChange > 0 ? 'positive' : 'negative'
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    dashboardData.stats.revenueChange > 0 ? 'up' : 'down'
                  }`}
                ></i>
                {Math.abs(dashboardData.stats.revenueChange)}% so với tuần trước
              </div>
              <div className="stat-period">
                Doanh thu từ 1-12 Tháng 12, 2024
              </div>
            </div>
            <button className="view-report-btn">Xem báo cáo</button>
          </div>

          <div className="stat-card orders">
            <div className="stat-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Đơn hàng</div>
              <div className="stat-value">
                {formatNumber(dashboardData.stats.totalOrders)}
              </div>
              <div
                className={`stat-change ${
                  dashboardData.stats.ordersChange > 0 ? 'positive' : 'negative'
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    dashboardData.stats.ordersChange > 0 ? 'up' : 'down'
                  }`}
                ></i>
                {Math.abs(dashboardData.stats.ordersChange)}% so với tuần trước
              </div>
              <div className="stat-period">
                Đơn hàng từ 1-6 Tháng 12, 2024
              </div>
            </div>
            <button className="view-report-btn">Xem báo cáo</button>
          </div>

          <div className="stat-card users">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Người dùng</div>
              <div className="stat-value">
                {formatNumber(dashboardData.stats.totalUsers)}
              </div>
              <div
                className={`stat-change ${
                  dashboardData.stats.usersChange > 0 ? 'positive' : 'negative'
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    dashboardData.stats.usersChange > 0 ? 'up' : 'down'
                  }`}
                ></i>
                {Math.abs(dashboardData.stats.usersChange)}% so với tuần trước
              </div>
            </div>
          </div>

          <div className="stat-card products">
            <div className="stat-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="stat-content">
              <div className="stat-label">Sản phẩm</div>
              <div className="stat-value">
                {formatNumber(dashboardData.stats.totalProducts)}
              </div>
              <div
                className={`stat-change ${
                  dashboardData.stats.productsChange > 0 ? 'positive' : 'negative'
                }`}
              >
                <i
                  className={`fas fa-arrow-${
                    dashboardData.stats.productsChange > 0 ? 'up' : 'down'
                  }`}
                ></i>
                {Math.abs(dashboardData.stats.productsChange)}% so với tuần trước
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Chart bên phải */}
        <div className="dashboard-card order-status-chart">
          <div className="card-header">
            <h3>Trạng thái đơn hàng</h3>
            <span className="card-period">Thống kê trạng thái (mock data)</span>
          </div>
          <div className="card-content">
            <div className="donut-chart-container">
              <div className="donut-chart-wrapper">
                <Doughnut
                  data={orderStatusChartConfig.data}
                  options={orderStatusChartConfig.options}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="dashboard-grid">
        <div className="dashboard-card revenue-chart">
          <div className="card-header">
            <h3>Doanh thu</h3>
            <button className="view-report-btn">Xem báo cáo</button>
          </div>
          <div className="card-content">
            <div className="chart-container chart-container-bar">
              {revenueChartConfig && (
                <Bar
                  data={revenueChartConfig.data}
                  options={revenueChartConfig.options}
                />
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card order-time-chart">
          <div className="card-header">
            <h3>Thời gian đặt hàng</h3>
            <span className="card-period">Từ 1-6 Tháng 12, 2024</span>
            <button className="view-report-btn">Xem báo cáo</button>
          </div>
          <div className="card-content">
            <div className="donut-chart-container">
              <div className="donut-chart-wrapper">
                {orderTimeChartConfig && (
                  <Doughnut
                    data={orderTimeChartConfig.data}
                    options={orderTimeChartConfig.options}
                  />
                )}
                <div className="donut-center">
                  <div className="donut-center-label">Đơn hàng</div>
                  <div className="donut-center-value">
                    {dashboardData.orderTimeData.reduce(
                      (sum, item) => sum + item.orders,
                      0
                    )}
                  </div>
                </div>
              </div>
              <div className="donut-legend">
                {dashboardData.orderTimeData.map((item, index) => (
                  <div key={item.time} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{
                        backgroundColor:
                          index === 0 ? '#60a5fa' : index === 1 ? '#3b82f6' : '#93c5fd',
                      }}
                    ></span>
                    <span>
                      {item.label} {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card orders-line-chart">
          <div className="card-header">
            <h3>Đơn hàng theo ngày</h3>
            <span className="card-period">Mock data tuần này</span>
          </div>
          <div className="card-content">
            <div className="chart-container orders-line-chart-inner">
              <Line
                data={ordersLineChartConfig.data}
                options={ordersLineChartConfig.options}
              />
            </div>
          </div>
        </div>

        <div className="dashboard-card top-products">
          <div className="card-header">
            <h3>Sản phẩm bán chạy</h3>
          </div>
          <div className="card-content">
            <div className="products-list">
              {dashboardData.topProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-icon">
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-meta">
                      {formatNumber(product.orders)} đơn hàng
                    </div>
                  </div>
                  <div className="product-revenue">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card recent-orders">
          <div className="card-header">
            <h3>Đơn hàng gần đây</h3>
          </div>
          <div className="card-content">
            <div className="orders-list">
              {dashboardData.recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className="order-number">{order.orderNumber}</div>
                    <div className="order-customer">{order.customerName}</div>
                    <div className="order-product">{order.product}</div>
                  </div>
                  <div className="order-amount">
                    {formatCurrency(order.amount)}
                  </div>
                  <div className={`order-status ${order.status}`}>
                    {order.status === 'completed'
                      ? 'Hoàn thành'
                      : order.status === 'pending'
                      ? 'Chờ xử lý'
                      : order.status === 'processing'
                      ? 'Đang xử lý'
                      : 'Đã hủy'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


