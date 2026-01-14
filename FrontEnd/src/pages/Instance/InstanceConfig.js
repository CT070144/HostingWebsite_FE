import React from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import './InstanceConfig.css';

const InstanceConfig = ({ instance }) => {
      const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
            });
      };

      const configSections = [
            {
                  title: 'Thông tin cơ bản',
                  icon: 'fa-info-circle',

                  items: [
                        { label: 'Instance ID', value: instance.instance_id, code: true },
                        { label: 'VM ID', value: `VM-${instance.external_vm_id}` },
                        { label: 'Product ID', value: instance.product_id, code: true },
                        { label: 'Order ID', value: instance.order_id || 'N/A', code: !!instance.order_id },
                  ]
            },
            {
                  title: 'Trạng thái & Thời gian',
                  icon: 'fa-clock',

                  items: [
                        { label: 'Trạng thái', value: instance.status, badge: true },
                        { label: 'Ngày tạo', value: formatDate(instance.created_at) },
                        { label: 'Cập nhật lần cuối', value: formatDate(instance.updated_at) },
                  ]
            },
            {
                  title: 'Kết nối',
                  icon: 'fa-network-wired',

                  items: [
                        { label: 'VNC Port', value: instance.vnc_port || 'N/A' },
                        { label: 'User ID', value: instance.user_id, code: true },
                  ]
            }
      ];

      return (
            <div className="instance-config">
                  <Row>
                        {configSections.map((section, idx) => (
                              <Col lg={6} className="mb-4" key={idx}>
                                    <Card className="config-card h-100">
                                          <Card.Header className={`bg-${section.color} text-white`}>
                                                <h5 className="mb-0">
                                                      <i className={`fas ${section.icon} me-2`}></i>
                                                      {section.title}
                                                </h5>
                                          </Card.Header>
                                          <Card.Body>
                                                <Table borderless className="config-table mb-0">
                                                      <tbody>
                                                            {section.items.map((item, itemIdx) => (
                                                                  <tr key={itemIdx}>
                                                                        <td className="config-label">{item.label}</td>
                                                                        <td className="config-value">
                                                                              {item.code ? (
                                                                                    <code className="config-code">{item.value}</code>
                                                                              ) : item.badge ? (
                                                                                    <span className={`badge bg-${instance.status === 'RUNNING' ? 'success' :
                                                                                                instance.status === 'STOPPED' ? 'secondary' :
                                                                                                      instance.status === 'ERROR' ? 'danger' : 'info'
                                                                                          }`}>
                                                                                          {item.value}
                                                                                    </span>
                                                                              ) : (
                                                                                    <span>{item.value}</span>
                                                                              )}
                                                                        </td>
                                                                  </tr>
                                                            ))}
                                                      </tbody>
                                                </Table>
                                          </Card.Body>
                                    </Card>
                              </Col>
                        ))}
                  </Row>


            </div>
      );
};

export default InstanceConfig;
