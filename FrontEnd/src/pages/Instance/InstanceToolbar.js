import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonGroup } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import './InstanceToolbar.css';

const InstanceToolbar = ({ instance, onAction, loading }) => {
      const navigate = useNavigate();
      if (!instance) {
            return (
                  <div className="instance-toolbar">
                        <div className="toolbar-left">
                              <span className="toolbar-title">No VM Selected</span>
                        </div>
                  </div>
            );
      }

      const isRunning = instance.status === 'RUNNING';
      const isStopped = instance.status === 'STOPPED';
      const isProcessing = ['PROVISIONING', 'CONFIGURING', 'STARTING', 'STOPPING'].includes(instance.status);

      return (
            <div className="instance-toolbar">
                  <div className="toolbar-left">
                        <span className="toolbar-title">
                              <i className="fas fa-server me-2"></i>
                              VM-{instance.external_vm_id} ({instance.instance_id})
                        </span>
                        <StatusBadge status={instance.status} />
                        <Button
                              variant="outline-light"
                              size="sm"
                              className="ms-3"
                              onClick={() => navigate(`/instances/${instance.instance_id}/renew`)}
                              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                        >
                              <i className="fas fa-sync-alt me-1"></i>
                              Gia hạn
                        </Button>
                  </div>

                  <div className="toolbar-right">
                        <ButtonGroup size="sm">
                              <Button
                                    variant="success"
                                    onClick={() => onAction('start')}
                                    disabled={isRunning || isProcessing || loading}
                                    title="Start VM"
                              >
                                    <i className="fas fa-play me-1"></i>
                                    Start
                              </Button>
                              <Button
                                    variant="warning"
                                    onClick={() => onAction('suspend')}
                                    disabled={!isRunning || isProcessing || loading}
                                    title="Suspend VM"
                              >
                                    <i className="fas fa-pause me-1"></i>
                                    Suspend
                              </Button>
                              <Button
                                    variant="info"
                                    onClick={() => onAction('restart')}
                                    disabled={!isRunning || isProcessing || loading}
                                    title="Restart VM"
                              >
                                    <i className="fas fa-redo me-1"></i>
                                    Restart
                              </Button>
                              <Button
                                    variant="danger"
                                    onClick={() => onAction('stop')}
                                    disabled={isStopped || isProcessing || loading}
                                    title="Stop VM"
                              >
                                    <i className="fas fa-stop me-1"></i>
                                    Stop
                              </Button>
                        </ButtonGroup>
                  </div>
            </div>
      );
};

export default InstanceToolbar;
