import React, { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import './InstanceSidebar.css';

const InstanceSidebar = ({ instances, selectedInstance, onSelectInstance, loading }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [expandedNodes, setExpandedNodes] = useState(new Set(['datacenter']));

      console.log('🔍 InstanceSidebar - instances:', instances);
      console.log('🔍 InstanceSidebar - loading:', loading);

      // Group instances by node
      const groupedInstances = instances.reduce((acc, instance) => {
            const node = instance.node_name || 'unknown';
            if (!acc[node]) {
                  acc[node] = [];
            }
            acc[node].push(instance);
            return acc;
      }, {});

      console.log('🔍 InstanceSidebar - groupedInstances:', groupedInstances);

      const toggleNode = (nodeId) => {
            const newExpanded = new Set(expandedNodes);
            if (newExpanded.has(nodeId)) {
                  newExpanded.delete(nodeId);
            } else {
                  newExpanded.add(nodeId);
            }
            setExpandedNodes(newExpanded);
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

      const filteredInstances = (nodeInstances) => {
            if (!searchTerm) return nodeInstances;
            return nodeInstances.filter(instance =>
                  instance.instance_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  instance.external_vm_id?.toString().includes(searchTerm)
            );
      };

      return (
            <div className="instance-sidebar">
                  <div className="sidebar-header">
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
                                    {/* Datacenter Root */}
                                    <div className="tree-node root">
                                          <div
                                                className="tree-node-content"
                                                onClick={() => toggleNode('datacenter')}
                                          >
                                                <i className={`fas fa-chevron-${expandedNodes.has('datacenter') ? 'down' : 'right'} me-2`}></i>
                                                <i className="fas fa-database me-2"></i>
                                                <span>Datacenter</span>
                                          </div>

                                          {expandedNodes.has('datacenter') && (
                                                <div className="tree-children">
                                                      {Object.entries(groupedInstances).map(([nodeName, nodeInstances]) => (
                                                            <div key={nodeName} className="tree-node node-level">
                                                                  <div
                                                                        className="tree-node-content"
                                                                        onClick={() => toggleNode(nodeName)}
                                                                  >
                                                                        <i className={`fas fa-chevron-${expandedNodes.has(nodeName) ? 'down' : 'right'} me-2`}></i>
                                                                        <i className="fas fa-hdd me-2"></i>
                                                                        <span>{nodeName}</span>
                                                                        <span className="node-count">({nodeInstances.length})</span>
                                                                  </div>

                                                                  {expandedNodes.has(nodeName) && (
                                                                        <div className="tree-children">
                                                                              {filteredInstances(nodeInstances).map((instance) => (
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
                                                                              ))}
                                                                        </div>
                                                                  )}
                                                            </div>
                                                      ))}
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
