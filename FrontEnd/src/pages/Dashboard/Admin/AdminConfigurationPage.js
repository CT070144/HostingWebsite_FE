import React, { useState } from 'react';
import './Admin.css';

const AdminConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="dashboard-overview">
      <h1 className="page-title">Cấu hình hệ thống</h1>

      <div className="config-tabs">
        <button
          className={`config-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Người sử dụng
        </button>
        <button
          className={`config-tab ${activeTab === 'banner' ? 'active' : ''}`}
          onClick={() => setActiveTab('banner')}
        >
          Banner
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="config-section">
          <h2 className="config-section-title">Cấu hình người sử dụng</h2>
          <div className="section-placeholder">
            Khu vực quản lý quyền, vai trò và cấu hình người dùng sẽ được bổ sung tại đây.
          </div>
        </div>
      )}

      {activeTab === 'banner' && (
        <div className="config-section">
          <h2 className="config-section-title">Cấu hình banner</h2>
          <div className="section-placeholder">
            Khu vực thiết lập banner, slide, hình ảnh quảng cáo trang chủ sẽ được bổ sung tại đây.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfigurationPage;


