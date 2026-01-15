import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import './InstanceSidebar.css';

const InstanceSidebar = ({ instances, selectedInstance, onSelectInstance, loading }) => {
      const [searchTerm, setSearchTerm] = useState('');
      // Chỉ cần giữ trạng thái mở rộng cho root (VPS)
      const [isRootExpanded, setIsRootExpanded] = useState(true);

      const toggleRoot = () => {
            setIsRootExpanded(!isRootExpanded);
      };

      const getStatusIcon = (status) => {
            switch (status) {
                  case 'RUNNING':
                        return <i className="fas fa-circle status-icon running"></i>;
                  case 'STOPPED':
                        return <i className="fas fa-circle status-icon stopped"></i>;
                  case 'ERROR':
                        return <i className="fas fa-circle status-icon error"></i>;
                  case 'PROVISIONING':
                  case 'CONFIGURING':
                        return <i className="fas fa-circle status-icon provisioning"></i>;
                  default:
                        return <i className="fas fa-circle status-icon unknown"></i>;
            }
      };

      // Lọc trực tiếp trên danh sách instances phẳng
      const filteredList = instances.filter(instance => {
            if (!searchTerm) return true;
            return (
                  instance.instance_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  instance.external_vm_id?.toString().includes(searchTerm)
            );
      });

      return (
            <div className="instance-sidebar">
                  <div className="sidebar-header-client">
                        <h6 className="sidebar-title">
                              <i className="fas fa-server me-2"></i>
                              Xem Server
                        </h6>
                  </div>

                  <div className="sidebar-search">
                        <InputGroup size="sm">
                              <InputGroup.Text>
                                    <i className="fas fa-search"></i>
                              </InputGroup.Text>
                              <Form.Control
                                    placeholder="Tìm kiếm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                              />
                        </InputGroup>
                  </div>

                  <div className="sidebar-tree">
                        {loading ? (
                              <div className="tree-loading">
                                    <i className="fas fa-spinner fa-spin"></i> Đang tải...
                              </div>
                        ) : (
                              <>
                                    {/* Datacenter Root */}
                                    <div className="tree-node root">
                                          <div
                                                className="tree-node-content"
                                                onClick={toggleRoot}
                                          >
                                                <i className={`fas fa-chevron-${isRootExpanded ? 'down' : 'right'} me-2`}></i>
                                                <i className="fas fa-database me-2"></i>
                                                <span>Danh sách VPS</span>
                                                <span className="node-count ms-2">({filteredList.length})</span>
                                          </div>

                                          {isRootExpanded && (
                                                <div className="tree-children">
                                                      {filteredList.length > 0 ? (
                                                            filteredList.map((instance) => (
                                                                  <div
                                                                        key={instance.instance_id}
                                                                        className={`tree-node vm-level ${selectedInstance?.instance_id === instance.instance_id ? 'active' : ''}`}
                                                                        onClick={() => onSelectInstance(instance)}
                                                                        style={{ paddingLeft: '20px' }}
                                                                  >
                                                                        <div className="tree-node-content">
                                                                              {getStatusIcon(instance.status)}
                                                                              <span className="vm-id">VM-{instance.external_vm_id}</span>
                                                                        </div>
                                                                  </div>
                                                            ))
                                                      ) : (
                                                            <div className="text-muted small p-2 ms-4">
                                                                  Không tìm thấy instance
                                                            </div>
                                                      )}
                                                </div>
                                          )}
                                    </div>
                              </>
                        )}
                  </div>
            </div>
      );
};

export default InstanceSidebar;