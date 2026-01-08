import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import './InstanceSidebar.css';

const InstanceSidebar = ({ instances, selectedInstance, onSelectInstance, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vpsExpanded, setVpsExpanded] = useState(true);

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

  const filteredInstances = instances.filter(instance =>
    !searchTerm || 
    instance.instance_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.external_vm_id?.toString().includes(searchTerm)
  );

  return (
    <div className="instance-sidebar">
      <div className="sidebar-header-client">
        <h6 className="sidebar-title">
          <i className="fas fa-server me-2"></i>
          Server View
        </h6>
      </div>

      <div className="sidebar-search">
        <InputGroup size="sm">
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </InputGroup>
      </div>

      <div className="sidebar-tree">
        {loading ? (
          <div className="tree-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading...
          </div>
        ) : (
          <>
            {/* VPS Root - Always show */}
            <div className="tree-node root">
              <div
                className="tree-node-content"
                onClick={() => setVpsExpanded(!vpsExpanded)}
              >
                <i className={`fas fa-chevron-${vpsExpanded ? 'down' : 'right'} me-2`}></i>
                <i className="fas fa-database me-2"></i>
                <span>VPS</span>
                <span className="node-count">({filteredInstances.length})</span>
              </div>

              {/* VM instances directly under VPS */}
              {vpsExpanded && (
                <div className="tree-children">
                  {filteredInstances.length === 0 ? (
                    <div className="tree-empty">
                      <i className="fas fa-inbox"></i> Không có máy ảo
                    </div>
                  ) : (
                    filteredInstances.map((instance) => (
                      <div
                        key={instance.instance_id}
                        className={`tree-node vm-level ${selectedInstance?.instance_id === instance.instance_id ? 'active' : ''}`}
                        onClick={() => onSelectInstance(instance)}
                      >
                        <div className="tree-node-content">
                          {getStatusIcon(instance.status)}
                          <span className="vm-id">VM-{instance.external_vm_id}</span>
                        </div>
                      </div>
                    ))
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
