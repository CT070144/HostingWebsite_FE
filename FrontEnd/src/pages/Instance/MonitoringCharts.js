import React, { useEffect, useState, useRef } from 'react';
import {
      Chart as ChartJS,
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { instanceService } from '../../services/instanceService';
import './MonitoringCharts.css';

ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      Filler
);

const MonitoringCharts = ({ instanceId }) => {
      const [metrics, setMetrics] = useState([]);
      const [timeframe, setTimeframe] = useState('live');
      const [loading, setLoading] = useState(false);
      const [isLive, setIsLive] = useState(false);

      // State for Chart Scaling
      const [totalMemory, setTotalMemory] = useState(0);
      const [totalCPU, setTotalCPU] = useState(0); // If needed

      // Refs for tracking live stats state without re-renders
      const lastLiveFetchRef = useRef(null);
      const liveMetricsRef = useRef([]);

      // Initial Fetch for Config (Total RAM/CPU)
      useEffect(() => {
            const fetchConfig = async () => {
                  try {
                        // Fetch live stats once to get static config like MaxMem
                        const response = await instanceService.getLiveStats(instanceId);
                        if (response.data && response.data.maxmem) {
                              setTotalMemory(response.data.maxmem);
                        }
                        if (response.data && response.data.cpus) {
                              setTotalCPU(response.data.cpus);
                        }
                  } catch (error) {
                        console.error("Failed to fetch initial config", error);
                  }
            };
            fetchConfig();
      }, [instanceId]);

      useEffect(() => {
            // Reset state when timeframe changes
            if (timeframe === 'live') {
                  setIsLive(true);
                  setMetrics([]);
                  lastLiveFetchRef.current = null;
                  liveMetricsRef.current = [];
            } else {
                  setIsLive(false);
                  fetchMetrics();
            }
      }, [instanceId, timeframe]);

      useEffect(() => {
            let interval;
            if (isLive) {
                  fetchLiveStats(); // Initial fetch
                  interval = setInterval(fetchLiveStats, 2000); // Poll every 2s
            } else {
                  // RRD Polling (30s)
                  interval = setInterval(fetchMetrics, 30000);
            }
            return () => clearInterval(interval);
      }, [isLive, instanceId]);

      const fetchMetrics = async () => {
            if (isLive) return;
            try {
                  setLoading(true);
                  const response = await instanceService.getMetrics(instanceId, timeframe);
                  setMetrics(response.data || []);
            } catch (error) {
                  console.error("Failed to fetch metrics", error);
            } finally {
                  setLoading(false);
            }
      };

      const fetchLiveStats = async () => {
            try {
                  const response = await instanceService.getLiveStats(instanceId);
                  const data = response.data;
                  const now = Date.now() / 1000;

                  // Update totals if not set (redundant check but safe)
                  if (data.maxmem > 0 && totalMemory === 0) setTotalMemory(data.maxmem);

                  const newPoint = {
                        time: now,
                        cpu: data.cpu,
                        memused: data.mem,
                        netin: 0,
                        netout: 0
                  };

                  // Calculate Rates
                  if (lastLiveFetchRef.current) {
                        const dt = now - lastLiveFetchRef.current.time;
                        if (dt > 0) {
                              newPoint.netin = (data.netin - lastLiveFetchRef.current.netin_raw) / dt;
                              newPoint.netout = (data.netout - lastLiveFetchRef.current.netout_raw) / dt;
                        }
                        if (newPoint.netin < 0) newPoint.netin = 0;
                        if (newPoint.netout < 0) newPoint.netout = 0;
                  }

                  lastLiveFetchRef.current = {
                        time: now,
                        netin_raw: data.netin,
                        netout_raw: data.netout
                  };

                  liveMetricsRef.current.push(newPoint);

                  if (liveMetricsRef.current.length > 61) { // slight buffer
                        liveMetricsRef.current.shift();
                  }

                  setMetrics([...liveMetricsRef.current]);

            } catch (error) {
                  console.error("Failed to fetch live stats", error);
            }
      };

      const createGradient = (colorStart, colorEnd) => {
            return (context) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                  gradient.addColorStop(0, colorStart);
                  gradient.addColorStop(1, colorEnd);
                  return gradient;
            };
      };

      const formatBytes = (bytes, decimals = 2) => {
            if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
            if (bytes === 0) return '0 B';
            if (bytes < 1) return bytes.toFixed(decimals) + ' B';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'B'}`;
      };

      const formatTime = (timestamp) => {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: isLive ? '2-digit' : undefined });
      };

      const commonOptions = (unitFormatter, yMax = undefined) => ({
            animation: isLive ? { duration: 0 } : { duration: 750 },
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                  mode: 'index',
                  intersect: false,
            },
            plugins: {
                  legend: { display: false },
                  tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#1f2937',
                        bodyColor: '#4b5563',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                              label: (context) => {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) {
                                          label += unitFormatter ? unitFormatter(context.parsed.y) : context.parsed.y;
                                    }
                                    return label;
                              }
                        }
                  }
            },
            scales: {
                  x: {
                        grid: { display: false },
                        ticks: {
                              maxTicksLimit: 8,
                              color: '#9ca3af',
                              font: { size: 11 }
                        }
                  },
                  y: {
                        beginAtZero: true,
                        max: yMax,
                        grid: {
                              color: 'rgba(0,0,0,0.03)',
                              borderDash: [5, 5]
                        },
                        ticks: {
                              color: '#9ca3af',
                              font: { size: 11 },
                              callback: (value) => unitFormatter ? unitFormatter(value) : value
                        }
                  }
            },
            elements: {
                  line: { tension: 0.4 },
                  point: { radius: isLive ? 0 : 0, hitRadius: 20, hoverRadius: 6, hoverBorderWidth: 3 }
            }
      });

      return (
            <div className="mt-4 monitoring-section">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                              <i className="fas fa-chart-area me-2 text-primary"></i>
                             
                              {isLive ? (
                                    <span className="live-badge ms-3">TRỰC TIẾP</span>
                              ) : (
                                    loading && <Spinner animation="border" size="sm" className="ms-2 text-muted" />
                              )}
                        </h5>
                        
                  </div>

                  <Row className="g-4">
                        {/* CPU Chart */}
                        <Col lg={4} md={12}>
                              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                                    <Card.Body>
                                          <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-primary-subtle text-primary me-3 p-2 rounded-circle" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                                                      <i className="fas fa-microchip"></i>
                                                </div>
                                                <div>
                                                      <h6 className="text-secondary mb-0 text-uppercase small fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Sử dụng CPU</h6>
                                                      <h4 className="fw-bold mb-0 text-dark">
                                                            {metrics.length > 0 ? (metrics[metrics.length - 1].cpu * 100).toFixed(1) : 0}%
                                                      </h4>
                                                </div>
                                          </div>
                                          <div style={{ height: '200px' }}>
                                                <Line
                                                      options={commonOptions((val) => `${val.toFixed(1)}%`, 100)}
                                                      data={{
                                                            labels: metrics.map(m => formatTime(m.time)),
                                                            datasets: [{
                                                                  label: 'CPU',
                                                                  data: metrics.map(m => m.cpu * 100),
                                                                  borderColor: '#3b82f6',
                                                                  backgroundColor: createGradient('rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.0)'),
                                                                  fill: true,
                                                                  borderWidth: 2,
                                                            }]
                                                      }}
                                                />
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        {/* RAM Chart */}
                        <Col lg={4} md={12}>
                              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                                    <Card.Body>
                                          <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-success-subtle text-success me-3 p-2 rounded-circle" style={{ background: '#dcfce7', color: '#22c55e' }}>
                                                      <i className="fas fa-memory"></i>
                                                </div>
                                                <div>
                                                      <h6 className="text-secondary mb-0 text-uppercase small fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Sử dụng RAM</h6>
                                                      <h4 className="fw-bold mb-0 text-dark">
                                                            {metrics.length > 0 ? formatBytes(metrics[metrics.length - 1].memused) : '0 B'}
                                                            {totalMemory > 0 && <span className="text-secondary ms-1 fs-6 fw-normal">/ {formatBytes(totalMemory)}</span>}
                                                      </h4>
                                                </div>
                                          </div>
                                          <div style={{ height: '200px' }}>
                                                <Line
                                                      options={commonOptions((val) => formatBytes(val), totalMemory > 0 ? totalMemory : undefined)} // Scale to Total Memory
                                                      data={{
                                                            labels: metrics.map(m => formatTime(m.time)),
                                                            datasets: [{
                                                                  label: 'RAM',
                                                                  data: metrics.map(m => m.memused),
                                                                  borderColor: '#10b981',
                                                                  backgroundColor: createGradient('rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.0)'),
                                                                  fill: true,
                                                                  borderWidth: 2,
                                                            }]
                                                      }}
                                                />
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        {/* Network Chart */}
                        <Col lg={4} md={12}>
                              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
                                    <Card.Body>
                                          <div className="d-flex align-items-center mb-3">
                                                <div className="icon-circle bg-warning-subtle text-warning me-3 p-2 rounded-circle" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                                                      <i className="fas fa-network-wired"></i>
                                                </div>
                                                <div>
                                                      <h6 className="text-secondary mb-0 text-uppercase small fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>I/O Mạng</h6>
                                                      <h4 className="fw-bold mb-0 text-dark">
                                                            {metrics.length > 0 ? formatBytes(metrics[metrics.length - 1].netin) + '/s' : '0 B/s'}
                                                      </h4>
                                                </div>
                                          </div>
                                          <div style={{ height: '200px' }}>
                                                <Line
                                                      options={commonOptions((val) => formatBytes(val) + '/s')}
                                                      data={{
                                                            labels: metrics.map(m => formatTime(m.time)),
                                                            datasets: [
                                                                  {
                                                                        label: 'In',
                                                                        data: metrics.map(m => m.netin),
                                                                        borderColor: '#f59e0b',
                                                                        backgroundColor: createGradient('rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.0)'),
                                                                        fill: true,
                                                                        borderWidth: 2,
                                                                  },
                                                                  {
                                                                        label: 'Out',
                                                                        data: metrics.map(m => m.netout),
                                                                        borderColor: '#8b5cf6',
                                                                        backgroundColor: 'transparent',
                                                                        borderDash: [5, 5],
                                                                        borderWidth: 2,
                                                                  }
                                                            ]
                                                      }}
                                                />
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>
                  </Row>
            </div>
      );
};

export default MonitoringCharts;
