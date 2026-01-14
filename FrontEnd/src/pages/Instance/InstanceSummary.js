import React from 'react';
import { Row, Col, Card, Button, ButtonGroup } from 'react-bootstrap';
import { instanceService } from '../../services/instanceService';
import { useNotify } from '../../contexts/NotificationContext';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import VMActionButton from '../../components/VMActionButton/VMActionButton';
import MonitoringCharts from './MonitoringCharts';
import './InstanceSummary.css';

const InstanceSummary = ({ instance, onRefresh }) => {
      const notify = useNotify();

      const handleVMAction = async (action, actionName) => {
            try {
                  await action(instance.instance_id);
                  notify.notifySuccess(`${actionName} thành công`);
                  setTimeout(onRefresh, 1000);
            } catch (error) {
                  notify.notifyError(`${actionName} thất bại: ${error.response?.data?.error || error.message}`);
                  throw error;
            }
      };

      const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString('vi-VN');
      };

      const normalizeStatus = (s) => (s || '').toUpperCase();
      const status = normalizeStatus(instance.status);

      const canStart = status === 'STOPPED' || status === 'SUSPENDED';
      const canStop = status === 'RUNNING';
      const canRestart = status === 'RUNNING';

      return (
            <div className="instance-summary">
                  {/* Header with Actions */}
                  <div className="summary-header">
                        <div className="header-info">
                              <h4 className="instance-name">
                                    <i className="fas fa-server me-2"></i>
                                    VM-{instance.external_vm_id}
                              </h4>
                              <StatusBadge status={instance.status} />
                        </div>

                        <ButtonGroup className="action-buttons">
                              {canStart && (
                                    <VMActionButton
                                          icon="fa-play"
                                          label="Start"
                                          variant="success"
                                          size="sm"
                                          onAction={() => handleVMAction(instanceService.startVM, 'Khởi động VM')}
                                    />
                              )}
                              {canStop && (
                                    <VMActionButton
                                          icon="fa-stop"
                                          label="Stop"
                                          variant="warning"
                                          size="sm"
                                          onAction={() => handleVMAction(instanceService.stopVM, 'Dừng VM')}
                                          confirmMessage="Bạn có chắc muốn dừng VM này?"
                                    />
                              )}
                              {canRestart && (
                                    <VMActionButton
                                          icon="fa-redo"
                                          label="Restart"
                                          variant="info"
                                          size="sm"
                                          onAction={() => handleVMAction(instanceService.restartVM, 'Khởi động lại VM')}
                                          confirmMessage="Bạn có chắc muốn khởi động lại VM này?"
                                    />
                              )}
                        </ButtonGroup>
                  </div>

                  {/* Info Grid */}
                  <Row className="g-3 p-3">
                        <Col md={6}>
                              <Card className="info-card">
                                    <Card.Header className="info-card-header">
                                          <i className="fas fa-info-circle me-2"></i>
                                          Thông tin cơ bản
                                    </Card.Header>
                                    <Card.Body className="info-card-body">
                                          <div className="info-row">
                                                <span className="info-label">Instance ID:</span>
                                                <code className="info-value">{instance.instance_id}</code>
                                          </div>
                                          <div className="info-row">
                                                <span className="info-label">VM ID:</span>
                                                <span className="info-value">VM-{instance.external_vm_id}</span>
                                          </div>
                                         
                                          <div className="info-row">
                                                <span className="info-label">Status:</span>
                                                <span className="info-value">{instance.status}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="info-card">
                                    <Card.Header className="info-card-header">
                                          <i className="fas fa-clock me-2"></i>
                                          Thời gian
                                    </Card.Header>
                                    <Card.Body className="info-card-body">
                                          <div className="info-row">
                                                <span className="info-label">Ngày tạo:</span>
                                                <span className="info-value">{formatDate(instance.created_at)}</span>
                                          </div>
                                          <div className="info-row">
                                                <span className="info-label">Cập nhật:</span>
                                                <span className="info-value">{formatDate(instance.updated_at)}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={12}>
                              <Card className="info-card">
                                    <Card.Header className="info-card-header">
                                          <i className="fas fa-network-wired me-2"></i>
                                          Kết nối
                                    </Card.Header>
                                    <Card.Body className="info-card-body">
                                          <div className="info-row">
                                                <span className="info-label">VNC Port:</span>
                                                <span className="info-value">{instance.vnc_port || 'N/A'}</span>
                                          </div>
                                          <div className="info-row">
                                                <span className="info-label">Product ID:</span>
                                                <code className="info-value">{instance.product_id}</code>
                                          </div>
                                          <div className="info-row">
                                                <span className="info-label">User ID:</span>
                                                <code className="info-value">{instance.user_id}</code>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>
                  </Row>

                  {/* Monitoring Section */}
                  <div className="p-3">
                        <MonitoringCharts instanceId={instance.instance_id} />
                  </div>
            </div>
      );
};

export default InstanceSummary;
