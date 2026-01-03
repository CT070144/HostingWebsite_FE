import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import './InstanceHardware.css';

const InstanceHardware = ({ instance }) => {
      // Mock hardware data - would come from API in real scenario
      const hardwareData = {
            cpu: {
                  sockets: 1,
                  cores: 2,
                  type: 'host',
                  units: 1024
            },
            memory: {
                  size: '2048 MiB',
                  ballooning: 'Yes'
            },
            disk: {
                  size: '20 GiB',
                  interface: 'virtio',
                  cache: 'none'
            },
            network: {
                  model: 'virtio',
                  bridge: 'vmbr0',
                  firewall: 'Yes'
            }
      };

      return (
            <div className="instance-hardware">
                  <div className="hardware-header">
                        <h5 className="mb-0">
                              <i className="fas fa-microchip me-2"></i>
                              Hardware Configuration
                        </h5>
                  </div>

                  <Row className="g-3 p-3">
                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-microchip me-2"></i>
                                          Processor (CPU)
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Sockets:</span>
                                                <span className="hw-value">{hardwareData.cpu.sockets}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Cores:</span>
                                                <span className="hw-value">{hardwareData.cpu.cores}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Type:</span>
                                                <span className="hw-value">{hardwareData.cpu.type}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">CPU Units:</span>
                                                <span className="hw-value">{hardwareData.cpu.units}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-memory me-2"></i>
                                          Memory (RAM)
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Size:</span>
                                                <span className="hw-value">{hardwareData.memory.size}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Ballooning:</span>
                                                <span className="hw-value">{hardwareData.memory.ballooning}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-hdd me-2"></i>
                                          Hard Disk
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Size:</span>
                                                <span className="hw-value">{hardwareData.disk.size}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Bus/Device:</span>
                                                <span className="hw-value">{hardwareData.disk.interface}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Cache:</span>
                                                <span className="hw-value">{hardwareData.disk.cache}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>

                        <Col md={6}>
                              <Card className="hw-card">
                                    <Card.Header className="hw-card-header">
                                          <i className="fas fa-network-wired me-2"></i>
                                          Network Device
                                    </Card.Header>
                                    <Card.Body className="hw-card-body">
                                          <div className="hw-row">
                                                <span className="hw-label">Model:</span>
                                                <span className="hw-value">{hardwareData.network.model}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Bridge:</span>
                                                <span className="hw-value">{hardwareData.network.bridge}</span>
                                          </div>
                                          <div className="hw-row">
                                                <span className="hw-label">Firewall:</span>
                                                <span className="hw-value">{hardwareData.network.firewall}</span>
                                          </div>
                                    </Card.Body>
                              </Card>
                        </Col>
                  </Row>
            </div>
      );
};

export default InstanceHardware;
