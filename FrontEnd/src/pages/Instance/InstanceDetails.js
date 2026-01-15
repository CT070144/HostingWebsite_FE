import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Card, Breadcrumb, Nav, Spinner, Alert, ButtonGroup, Button } from 'react-bootstrap';
import { useNotify } from '../../contexts/NotificationContext';
import { instanceService } from '../../services/instanceService';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import VMActionButton from '../../components/VMActionButton/VMActionButton';
import InstanceConfig from './InstanceConfig';
import InstanceConsole from './InstanceConsole';
import './InstanceDetails.css';

const InstanceDetails = () => {
      const { instanceId } = useParams();
      const navigate = useNavigate();
      const notify = useNotify();
      const [instance, setInstance] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
            fetchInstanceDetails();
      }, [instanceId]);

      const fetchInstanceDetails = async () => {
            try {
                  setLoading(true);
                  const response = await instanceService.getAllInstances();
                  const foundInstance = response.data.instances.find(i => i.instance_id === instanceId);

                  if (!foundInstance) {
                        setError('Instance không tồn tại');
                        return;
                  }

                  setInstance(foundInstance);
                  setError(null);
            } catch (err) {
                  setError('Không thể tải thông tin instance');
                  console.error('Failed to fetch instance details:', err);
            } finally {
                  setLoading(false);
            }
      };

      const handleVMAction = async (action, actionName) => {
            try {
                  await action(instanceId);
                  notify.notifySuccess(`${actionName} thành công`);
                  setTimeout(fetchInstanceDetails, 1000);
            } catch (error) {
                  notify.notifyError(`${actionName} thất bại: ${error.response?.data?.error || error.message}`);
                  throw error;
            }
      };

      if (loading) {
            return (
                  <div className="instance-details-page">
                        <Container className="py-5">
                              <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3 text-muted">Đang tải thông tin instance...</p>
                              </div>
                        </Container>
                  </div>
            );
      }

      if (error || !instance) {
            return (
                  <div className="instance-details-page">
                        <Container className="py-5">
                              <Alert variant="danger">
                                    {error || 'Instance không tồn tại'}
                              </Alert>
                        </Container>
                  </div>
            );
      }

      const canStart = instance.status === 'STOPPED' || instance.status === 'SUSPENDED';
      const canStop = instance.status === 'RUNNING';
      const canRestart = instance.status === 'RUNNING';
      const canSuspend = instance.status === 'RUNNING';

      return (
            <div className="instance-details-page">
                  <Container className="py-4">
                        <Breadcrumb className="mb-3">
                              <Breadcrumb.Item onClick={() => navigate('/dashboard')}>Bảng điều khiển</Breadcrumb.Item>
                              <Breadcrumb.Item onClick={() => navigate('/instances')}>Máy ảo</Breadcrumb.Item>
                              <Breadcrumb.Item active>VM-{instance.external_vm_id}</Breadcrumb.Item>
                        </Breadcrumb>

                        <Card className="instance-header-card mb-4">
                              <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                          <div>
                                                <h3 className="mb-2">
                                                      <i className="fas fa-server me-2 text-primary"></i>
                                                      VM-{instance.external_vm_id}
                                                </h3>
                                                <div className="instance-meta">
                                                      <span className="me-3">
                                                            <i className="fas fa-fingerprint me-1"></i>
                                                            <code>{instance.instance_id?.substring(0, 16)}...</code>
                                                      </span>
                                                      <span className="me-3">
                                                            <i className="fas fa-hdd me-1"></i>
                                                            {instance.node_name}
                                                      </span>
                                                      <StatusBadge status={instance.status} />
                                                      <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="ms-3"
                                                            onClick={() => navigate(`/instances/${instanceId}/renew`)}
                                                      >
                                                            <i className="fas fa-sync-alt me-1"></i>
                                                            Gia hạn
                                                      </Button>
                                                </div>
                                          </div>
                                          <ButtonGroup className="vm-controls">
                                                {canStart && (
                                                      <VMActionButton
                                                            action="start"
                                                            icon="fa-play"
                                                            label="Khởi động"
                                                            variant="success"
                                                            onAction={() => handleVMAction(instanceService.startVM, 'Khởi động VM')}
                                                      />
                                                )}
                                                {canStop && (
                                                      <VMActionButton
                                                            action="stop"
                                                            icon="fa-stop"
                                                            label="Dừng"
                                                            variant="warning"
                                                            onAction={() => handleVMAction(instanceService.stopVM, 'Dừng VM')}
                                                            confirmMessage="Bạn có chắc muốn dừng VM này?"
                                                      />
                                                )}
                                                {canRestart && (
                                                      <VMActionButton
                                                            action="restart"
                                                            icon="fa-redo"
                                                            label="Khởi động lại"
                                                            variant="info"
                                                            onAction={() => handleVMAction(instanceService.restartVM, 'Khởi động lại VM')}
                                                            confirmMessage="Bạn có chắc muốn khởi động lại VM này?"
                                                      />
                                                )}
                                                {canSuspend && (
                                                      <VMActionButton
                                                            action="suspend"
                                                            icon="fa-pause"
                                                            label="Tạm dừng"
                                                            variant="secondary"
                                                            onAction={() => handleVMAction(instanceService.suspendVM, 'Tạm dừng VM')}
                                                            confirmMessage="Bạn có chắc muốn tạm dừng VM này?"
                                                      />
                                                )}
                                          </ButtonGroup>
                                    </div>
                              </Card.Body>
                        </Card>

                        <Card className="instance-tabs-card">
                              <Card.Header className="p-0">
                                    <Nav variant="tabs" className="instance-nav-tabs">
                                          <Nav.Item>
                                                <Nav.Link as={NavLink} to={`/instances/${instanceId}/config`}>
                                                      <i className="fas fa-cog me-2"></i>
                                                      Cấu hình
                                                </Nav.Link>
                                          </Nav.Item>
                                          <Nav.Item>
                                                <Nav.Link as={NavLink} to={`/instances/${instanceId}/console`}>
                                                      <i className="fas fa-terminal me-2"></i>
                                                      Console
                                                </Nav.Link>
                                          </Nav.Item>
                                    </Nav>
                              </Card.Header>
                              <Card.Body className="tab-content-body">
                                    <Routes>
                                          <Route path="/" element={<Navigate to="config" replace />} />
                                          <Route path="config" element={<InstanceConfig instance={instance} />} />
                                          <Route path="console" element={<InstanceConsole instance={instance} />} />
                                    </Routes>
                              </Card.Body>
                        </Card>
                  </Container>
            </div >
      );
};

export default InstanceDetails;
