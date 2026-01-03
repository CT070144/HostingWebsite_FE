import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../contexts/NotificationContext';
import { instanceService } from '../../services/instanceService';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import VMActionButton from '../../components/VMActionButton/VMActionButton';
import './InstanceDashboard.css';

const InstanceDashboard = () => {
      const navigate = useNavigate();
      const notify = useNotify();
      const [instances, setInstances] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('ALL');

      useEffect(() => {
            fetchInstances();
      }, []);

      const fetchInstances = async () => {
            try {
                  setLoading(true);
                  const response = await instanceService.getAllInstances();
                  setInstances(response.data.instances || []);
                  setError(null);
            } catch (err) {
                  setError('Không thể tải danh sách instance');
                  console.error('Failed to fetch instances:', err);
                  notify.notifyError('Không thể tải danh sách instance');
            } finally {
                  setLoading(false);
            }
      };

      const handleVMAction = async (instanceId, action, actionName) => {
            try {
                  await action(instanceId);
                  notify.notifySuccess(`${actionName} thành công`);
                  fetchInstances();
            } catch (error) {
                  notify.notifyError(`${actionName} thất bại: ${error.response?.data?.error || error.message}`);
                  throw error;
            }
      };

      const filteredInstances = instances.filter(instance => {
            const matchesSearch = instance.instance_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  instance.external_vm_id?.toString().includes(searchTerm);
            const matchesFilter = filterStatus === 'ALL' || instance.status === filterStatus;
            return matchesSearch && matchesFilter;
      });

      const getStatusCount = (status) => {
            if (status === 'ALL') return instances.length;
            return instances.filter(i => i.status === status).length;
      };

      if (loading) {
            return (
                  <div className="instance-dashboard-page">
                        <Container className="py-5">
                              <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3 text-muted">Đang tải danh sách instance...</p>
                              </div>
                        </Container>
                  </div>
            );
      }

      return (
            <div className="instance-dashboard-page">
                  <Container className="py-4">
                        <div className="dashboard-header mb-4">
                              <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                          <h2 className="mb-2">
                                                <i className="fas fa-server me-2 text-primary"></i>
                                                Quản lý Instance
                                          </h2>
                                          <p className="text-muted mb-0">Quản lý các máy ảo của bạn</p>
                                    </div>
                                    <Button variant="primary" onClick={() => navigate('/hosting')}>
                                          <i className="fas fa-plus me-2"></i>
                                          Mua Instance mới
                                    </Button>
                              </div>
                        </div>

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Row className="mb-4">
                              <Col md={3} sm={6} className="mb-3">
                                    <Card className={`stats-card ${filterStatus === 'ALL' ? 'active' : ''}`}
                                          onClick={() => setFilterStatus('ALL')}>
                                          <Card.Body>
                                                <div className="stats-icon bg-primary">
                                                      <i className="fas fa-server"></i>
                                                </div>
                                                <div className="stats-info">
                                                      <h3>{getStatusCount('ALL')}</h3>
                                                      <p>Tổng Instance</p>
                                                </div>
                                          </Card.Body>
                                    </Card>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                    <Card className={`stats-card ${filterStatus === 'RUNNING' ? 'active' : ''}`}
                                          onClick={() => setFilterStatus('RUNNING')}>
                                          <Card.Body>
                                                <div className="stats-icon bg-success">
                                                      <i className="fas fa-play-circle"></i>
                                                </div>
                                                <div className="stats-info">
                                                      <h3>{getStatusCount('RUNNING')}</h3>
                                                      <p>Đang chạy</p>
                                                </div>
                                          </Card.Body>
                                    </Card>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                    <Card className={`stats-card ${filterStatus === 'STOPPED' ? 'active' : ''}`}
                                          onClick={() => setFilterStatus('STOPPED')}>
                                          <Card.Body>
                                                <div className="stats-icon bg-secondary">
                                                      <i className="fas fa-stop-circle"></i>
                                                </div>
                                                <div className="stats-info">
                                                      <h3>{getStatusCount('STOPPED')}</h3>
                                                      <p>Đã dừng</p>
                                                </div>
                                          </Card.Body>
                                    </Card>
                              </Col>
                              <Col md={3} sm={6} className="mb-3">
                                    <Card className={`stats-card ${filterStatus === 'ERROR' ? 'active' : ''}`}
                                          onClick={() => setFilterStatus('ERROR')}>
                                          <Card.Body>
                                                <div className="stats-icon bg-danger">
                                                      <i className="fas fa-exclamation-circle"></i>
                                                </div>
                                                <div className="stats-info">
                                                      <h3>{getStatusCount('ERROR')}</h3>
                                                      <p>Lỗi</p>
                                                </div>
                                          </Card.Body>
                                    </Card>
                              </Col>
                        </Row>

                        <Card className="instances-card">
                              <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                          <i className="fas fa-list me-2"></i>
                                          Danh sách Instance
                                    </h5>
                                    <InputGroup className="search-box">
                                          <InputGroup.Text>
                                                <i className="fas fa-search"></i>
                                          </InputGroup.Text>
                                          <Form.Control
                                                placeholder="Tìm kiếm Instance..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                          />
                                    </InputGroup>
                              </Card.Header>
                              <Card.Body className="p-0">
                                    {filteredInstances.length === 0 ? (
                                          <div className="text-center py-5">
                                                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                <p className="text-muted">
                                                      {searchTerm || filterStatus !== 'ALL'
                                                            ? 'Không tìm thấy instance phù hợp'
                                                            : 'Bạn chưa có instance nào'}
                                                </p>
                                                {!searchTerm && filterStatus === 'ALL' && (
                                                      <Button variant="primary" onClick={() => navigate('/hosting')}>
                                                            Mua Instance ngay
                                                      </Button>
                                                )}
                                          </div>
                                    ) : (
                                          <div className="table-responsive">
                                                <Table hover className="instances-table mb-0">
                                                      <thead>
                                                            <tr>
                                                                  <th>Instance ID</th>
                                                                  <th>VM ID</th>
                                                                  <th>Node</th>
                                                                  <th>Trạng thái</th>
                                                                  <th>Ngày tạo</th>
                                                                  <th className="text-end">Thao tác</th>
                                                            </tr>
                                                      </thead>
                                                      <tbody>
                                                            {filteredInstances.map((instance) => (
                                                                  <tr key={instance.instance_id} className="instance-row">
                                                                        <td>
                                                                              <strong className="text-primary">
                                                                                    {instance.instance_id?.substring(0, 8)}...
                                                                              </strong>
                                                                        </td>
                                                                        <td>
                                                                              <code>VM-{instance.external_vm_id}</code>
                                                                        </td>
                                                                        <td>
                                                                              <i className="fas fa-server me-1"></i>
                                                                              {instance.node_name}
                                                                        </td>
                                                                        <td>
                                                                              <StatusBadge status={instance.status} />
                                                                        </td>
                                                                        <td>
                                                                              {new Date(instance.created_at).toLocaleDateString('vi-VN')}
                                                                        </td>
                                                                        <td>
                                                                              <div className="action-buttons">
                                                                                    <Button
                                                                                          variant="outline-primary"
                                                                                          size="sm"
                                                                                          onClick={() => navigate(`/instances/${instance.instance_id}`)}
                                                                                    >
                                                                                          <i className="fas fa-eye me-1"></i>
                                                                                          Chi tiết
                                                                                    </Button>

                                                                                    {instance.status === 'RUNNING' && (
                                                                                          <>
                                                                                                <VMActionButton
                                                                                                      action="stop"
                                                                                                      icon="fa-stop"
                                                                                                      label="Dừng"
                                                                                                      variant="outline-warning"
                                                                                                      onAction={() => handleVMAction(instance.instance_id, instanceService.stopVM, 'Dừng VM')}
                                                                                                      confirmMessage="Bạn có chắc muốn dừng VM này?"
                                                                                                />
                                                                                                <VMActionButton
                                                                                                      action="restart"
                                                                                                      icon="fa-redo"
                                                                                                      label="Khởi động lại"
                                                                                                      variant="outline-info"
                                                                                                      onAction={() => handleVMAction(instance.instance_id, instanceService.restartVM, 'Khởi động lại VM')}
                                                                                                      confirmMessage="Bạn có chắc muốn khởi động lại VM này?"
                                                                                                />
                                                                                          </>
                                                                                    )}

                                                                                    {(instance.status === 'STOPPED' || instance.status === 'SUSPENDED') && (
                                                                                          <VMActionButton
                                                                                                action="start"
                                                                                                icon="fa-play"
                                                                                                label="Khởi động"
                                                                                                variant="outline-success"
                                                                                                onAction={() => handleVMAction(instance.instance_id, instanceService.startVM, 'Khởi động VM')}
                                                                                          />
                                                                                    )}
                                                                              </div>
                                                                        </td>
                                                                  </tr>
                                                            ))}
                                                      </tbody>
                                                </Table>
                                          </div>
                                    )}
                              </Card.Body>
                        </Card>
                  </Container>
            </div>
      );
};

export default InstanceDashboard;
