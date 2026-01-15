import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { instanceService } from '../../services/instanceService';
import { useNotify } from '../../contexts/NotificationContext';
import './InstanceHardware.css';

const InstanceHardware = ({ instance }) => {
      const notify = useNotify();
      const [hardwareData, setHardwareData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
            if (instance?.instance_id) {
                  fetchHardwareData();
            }
      }, [instance?.instance_id]);

      const fetchHardwareData = async () => {
            try {
                  setLoading(true);
                  setError(null);
                  const response = await instanceService.getHardware(instance.instance_id);
                  setHardwareData(response.data);
            } catch (err) {
                  console.error('Failed to fetch hardware data:', err);
                  setError('Không thể tải thông tin phần cứng');
                  notify.notifyError('Không thể tải thông tin phần cứng');
            } finally {
                  setLoading(false);
            }
      };

      if (loading) {
            return (
                  <div className="instance-hardware">
                        <div className="hardware-header">
                              <h5 className="mb-0">
                                    <i className="fas fa-microchip me-2"></i>
                                    Cấu hình phần cứng
                              </h5>
                        </div>
                        <div className="text-center py-5">
                              <Spinner animation="border" variant="primary" />
                              <p className="text-muted mt-3">Đang tải thông tin phần cứng...</p>
                        </div>
                  </div>
            );
      }

      if (error || !hardwareData) {
            return (
                  <div className="instance-hardware">
                        <div className="hardware-header">
                              <h5 className="mb-0">
                                    <i className="fas fa-microchip me-2"></i>
                                    Cấu hình phần cứng
                              </h5>
                        </div>
                        <div className="p-4">
                              <Alert variant="danger">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    {error || 'Không tìm thấy thông tin phần cứng'}
                              </Alert>
                        </div>
                  </div>
            );
      }

      const specs = hardwareData.product?.specs || {};
      const os = hardwareData.os || {};

      return (
            <div className="instance-hardware">
                  <div className="hardware-header">
                        <h5 className="mb-0">
                              <i className="fas fa-microchip me-2"></i>
                              Cấu hình phần cứng
                        </h5>
                  </div>

                  <Row className="g-3 p-3">
                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-microchip me-2"></i>
                                          Bộ xử lý (CPU)
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Số nhân CPU:</span>
                                                <span className="hw-value">{specs.cpu_cores || 'N/A'}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-memory me-2"></i>
                                          Bộ nhớ (RAM)
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Dung lượng RAM:</span>
                                                <span className="hw-value">{specs.ram_gb ? `${specs.ram_gb} GB` : 'N/A'}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-hdd me-2"></i>
                                          Ổ cứng
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Dung lượng ổ cứng:</span>
                                                <span className="hw-value">{specs.disk_gb ? `${specs.disk_gb} GB` : 'N/A'}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Loại ổ cứng:</span>
                                                <span className="hw-value">{specs.storage_type || 'N/A'}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-server me-2"></i>
                                          Hệ điều hành
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Tên:</span>
                                                <span className="hw-value">{os.display_name || os.name || 'N/A'}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Họ OS:</span>
                                                <span className="hw-value">{os.os_family || 'N/A'}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Phiên bản:</span>
                                                <span className="hw-value">{os.version || 'N/A'}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-box me-2"></i>
                                          Sản phẩm
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Tên sản phẩm:</span>
                                                <span className="hw-value">{hardwareData.product?.name || 'N/A'}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Loại dịch vụ:</span>
                                                <span className="hw-value">{hardwareData.product?.service_type || 'N/A'}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>
                  </Row>
            </div>
      );
};

export default InstanceHardware;
