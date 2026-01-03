import React from 'react';
import { Badge } from 'react-bootstrap';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
      const statusMap = {
            RUNNING: { variant: 'success', text: 'Đang chạy', icon: 'fa-circle' },
            STOPPED: { variant: 'secondary', text: 'Đã dừng', icon: 'fa-stop-circle' },
            ERROR: { variant: 'danger', text: 'Lỗi', icon: 'fa-exclamation-circle' },
            PROVISIONING: { variant: 'info', text: 'Đang tạo', icon: 'fa-spinner fa-spin' },
            CONFIGURING: { variant: 'info', text: 'Đang cấu hình', icon: 'fa-cog fa-spin' },
            SUSPENDED: { variant: 'warning', text: 'Tạm dừng', icon: 'fa-pause-circle' },
            WAIT_FOR_USER_UPDATE_SSH_KEY: { variant: 'warning', text: 'Chờ cấu hình SSH', icon: 'fa-key' },
            STARTING: { variant: 'info', text: 'Đang khởi động', icon: 'fa-spinner fa-spin' },
            STOPPING: { variant: 'secondary', text: 'Đang dừng', icon: 'fa-spinner fa-spin' },
            RESTARTING: { variant: 'info', text: 'Đang khởi động lại', icon: 'fa-redo fa-spin' },
            SUSPENDING: { variant: 'warning', text: 'Đang tạm dừng', icon: 'fa-spinner fa-spin' },
      };

      const statusInfo = statusMap[status] || {
            variant: 'secondary',
            text: status || 'Không xác định',
            icon: 'fa-question-circle'
      };

      return (
            <Badge bg={statusInfo.variant} className="status-badge">
                  <i className={`fas ${statusInfo.icon} me-1`}></i>
                  {statusInfo.text}
            </Badge>
      );
};

export default StatusBadge;
