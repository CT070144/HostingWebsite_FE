import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instanceService } from '../../services/instanceService';
import { useNotify } from '../../contexts/NotificationContext';
import InstanceToolbar from './InstanceToolbar';
import InstanceSidebar from './InstanceSidebar';
import InstanceTabPanel from './InstanceTabPanel';
import InstanceSummary from './InstanceSummary';
import InstanceConsole from './InstanceConsole';
import InstanceConfig from './InstanceConfig';
import InstanceHardware from './InstanceHardware';
import './ProxmoxLayout.css';

const ProxmoxLayout = () => {
      const { instanceId, tab } = useParams();
      const navigate = useNavigate();
      const notify = useNotify();

      const [instances, setInstances] = useState([]);
      const [selectedInstance, setSelectedInstance] = useState(null);
      const [activeTab, setActiveTab] = useState(tab || 'summary');
      const [loading, setLoading] = useState(true);
      const [actionLoading, setActionLoading] = useState(false);

      useEffect(() => {
            fetchInstances();
      }, []);

      useEffect(() => {
            if (instanceId && instances.length > 0) {
                  const instance = instances.find(i => i.instance_id === instanceId);
                  setSelectedInstance(instance);
            } else if (instances.length > 0 && !instanceId) {
                  // Auto-select first instance
                  setSelectedInstance(instances[0]);
                  navigate(`/instances/${instances[0].instance_id}/summary`, { replace: true });
            }
      }, [instanceId, instances, navigate]);

      useEffect(() => {
            if (tab) {
                  setActiveTab(tab);
            }
      }, [tab]);

      const fetchInstances = async () => {
            try {
                  setLoading(true);
                  const response = await instanceService.getAllInstances();
                  console.log('📊 INSTANCES RESPONSE:', response);
                  console.log('📊 INSTANCES DATA:', response.data);
                  console.log('📊 INSTANCES ARRAY:', response.data.instances);
                  console.log('📊 INSTANCES TYPE:', typeof response.data.instances, Array.isArray(response.data.instances));

                  // Handle both possible response structures
                  let instancesData = [];
                  if (response.data.instances) {
                        instancesData = response.data.instances;
                  } else if (Array.isArray(response.data)) {
                        instancesData = response.data;
                  } else if (response.data.data) {
                        instancesData = response.data.data;
                  }

                  console.log('📊 FINAL INSTANCES:', instancesData);
                  setInstances(instancesData || []);
            } catch (err) {
                  notify.notifyError('Không thể tải danh sách instance');
                  console.error('❌ Failed to fetch instances:', err);
                  console.error('❌ Error response:', err.response);
            } finally {
                  setLoading(false);
            }
      };

      const handleVMAction = async (action) => {
            if (!selectedInstance) return;

            const actionMap = {
                  start: { fn: instanceService.startVM, successMsg: 'VM đã được khởi động', confirmMsg: 'Bạn có chắc muốn khởi động VM này?' },
                  stop: { fn: instanceService.stopVM, successMsg: 'VM đã được dừng', confirmMsg: 'Bạn có chắc muốn dừng VM này?' },
                  restart: { fn: instanceService.restartVM, successMsg: 'VM đang khởi động lại', confirmMsg: 'Bạn có chắc muốn khởi động lại VM này?' },
                  suspend: { fn: instanceService.suspendVM, successMsg: 'VM đã được tạm dừng', confirmMsg: 'Bạn có chắc muốn tạm dừng VM này?' }
            };

            const actionConfig = actionMap[action];
            if (!actionConfig) return;

            if (!window.confirm(actionConfig.confirmMsg)) return;

            try {
                  setActionLoading(true);
                  await actionConfig.fn(selectedInstance.instance_id);
                  notify.notifySuccess(actionConfig.successMsg);

                  // Refresh instances after action
                  setTimeout(() => {
                        fetchInstances();
                  }, 1000);
            } catch (err) {
                  notify.notifyError(`Lỗi khi ${action} VM: ` + (err.response?.data?.error || err.message));
            } finally {
                  setActionLoading(false);
            }
      };

      const handleSelectInstance = (instance) => {
            setSelectedInstance(instance);
            navigate(`/instances/${instance.instance_id}/${activeTab}`);
      };

      const handleTabChange = (tab) => {
            setActiveTab(tab);
            if (selectedInstance) {
                  navigate(`/instances/${selectedInstance.instance_id}/${tab}`);
            }
      };

      const renderContent = () => {
            if (!selectedInstance) {
                  return (
                        <div className="no-selection">
                              <i className="fas fa-server fa-3x text-muted mb-3"></i>
                              <p className="text-muted">Chọn một instance để xem thông tin</p>
                        </div>
                  );
            }

            switch (activeTab) {
                  case 'summary':
                        return <InstanceSummary instance={selectedInstance} onRefresh={fetchInstances} />;
                  case 'console':
                        return <InstanceConsole instance={selectedInstance} />;
                  case 'config':
                        return <InstanceConfig instance={selectedInstance} />;
                  case 'hardware':
                        return <InstanceHardware instance={selectedInstance} />;
                  default:
                        return <InstanceSummary instance={selectedInstance} onRefresh={fetchInstances} />;
            }
      };

      return (
            <div className="proxmox-container">
                  <InstanceToolbar
                        instance={selectedInstance}
                        onAction={handleVMAction}
                        loading={actionLoading}
                  />

                  <div className="proxmox-layout">
                        <InstanceSidebar
                              instances={instances}
                              selectedInstance={selectedInstance}
                              onSelectInstance={handleSelectInstance}
                              loading={loading}
                        />

                        <InstanceTabPanel
                              activeTab={activeTab}
                              onTabChange={handleTabChange}
                              instance={selectedInstance}
                        />

                        <div className="content-area">
                              {renderContent()}
                        </div>
                  </div>
            </div>
      );
};

export default ProxmoxLayout;
