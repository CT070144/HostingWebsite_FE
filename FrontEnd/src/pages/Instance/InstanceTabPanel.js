import React from 'react';
import './InstanceTabPanel.css';

const InstanceTabPanel = ({ activeTab, onTabChange, instance }) => {
      const tabs = [
            { id: 'summary', icon: 'fa-info-circle', label: 'Tổng quan' },
            { id: 'console', icon: 'fa-terminal', label: 'Console', requireRunning: true },
            { id: 'hardware', icon: 'fa-microchip', label: 'Phần cứng' },
      ];

      const isTabDisabled = (tab) => {
            if (!instance) return true;
            if (tab.requireRunning && instance.status !== 'RUNNING') {
                  return true;
            }
            return false;
      };

      return (
            <div className="instance-tab-panel">
                  <div className="tab-panel-header">
                        <h6 className="panel-title">Tùy chọn</h6>
                  </div>

                  <div className="tab-list">
                        {tabs.map((tab) => {
                              const disabled = isTabDisabled(tab);
                              return (
                                    <div
                                          key={tab.id}
                                          className={`tab-item ${activeTab === tab.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                          onClick={() => !disabled && onTabChange(tab.id)}
                                    >
                                          <i className={`fas ${tab.icon} tab-icon`}></i>
                                          <span className="tab-label">{tab.label}</span>
                                    </div>
                              );
                        })}
                  </div>
            </div>
      );
};

export default InstanceTabPanel;
