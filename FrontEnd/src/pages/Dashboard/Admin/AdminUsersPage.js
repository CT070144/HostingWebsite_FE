import React, { useState, useEffect } from 'react';
import './Admin.css';
import authData from '../../../mockData/auth.json';
import { useNotify } from '../../../contexts/NotificationContext';

const AdminUsersPage = () => {
  const { notifyWarning, notifyError, notifySuccess } = useNotify();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load users from mock data
    const loadedUsers = authData.users || [];
    setUsers(loadedUsers);
    setFilteredUsers(loadedUsers);
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, users]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedUsers((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) return;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedUsers.length} tài khoản đã chọn?`
      )
    ) {
      setUsers((prev) => prev.filter((u) => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Don't show password
      role: user.role || 'user',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notifyWarning('Email không hợp lệ!');
      return;
    }

    // Validate phone (Vietnamese phone format)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      notifyWarning('Số điện thoại không hợp lệ!');
      return;
    }

    if (editingUser) {
      // Update existing user
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...formData,
                id: editingUser.id,
                createdAt: editingUser.createdAt,
                password: formData.password || editingUser.password,
              }
            : u
        )
      );
    } else {
      // Add new user
      const newUser = {
        ...formData,
        id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
        createdAt: new Date().toISOString(),
        password: formData.password || '',
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setIsModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.json';
    link.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedData = JSON.parse(event.target.result);
            if (importedData.users && Array.isArray(importedData.users)) {
              setUsers(importedData.users);
              setFilteredUsers(importedData.users);
              notifySuccess('Nhập file thành công!');
            } else if (Array.isArray(importedData)) {
              setUsers(importedData);
              setFilteredUsers(importedData);
              notifySuccess('Nhập file thành công!');
            } else {
              notifyError('File không đúng định dạng!');
            }
          } catch (error) {
            notifyError('Lỗi khi đọc file!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="dashboard-overview">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quản lý Tài khoản</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <i className="fas fa-arrow-up"></i> Xuất file
          </button>
          <button className="btn btn-secondary" onClick={handleImport}>
            <i className="fas fa-arrow-down"></i> Nhập file
          </button>
          {selectedUsers.length > 0 && (
            <button className="btn btn-danger" onClick={handleDeleteSelected}>
              <i className="fas fa-trash"></i> Xóa đã chọn ({selectedUsers.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={handleAddNew}>
            <i className="fas fa-plus"></i> Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="products-filter-bar">
        <div className="filter-tabs">
          <button className="filter-tab active">Tất cả</button>
          <button
            className="filter-tab"
            onClick={() => setSearchTerm('admin')}
          >
            Admin
          </button>
          <button
            className="filter-tab"
            onClick={() => setSearchTerm('user')}
          >
            Người dùng
          </button>
        </div>
        <div className="filter-controls">
          <div className="search-box-filter">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại, vai trò"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-select">
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    selectedUsers.length === filteredUsers.length &&
                    filteredUsers.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  Không tìm thấy tài khoản nào.
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar-small">
                        <i className="fas fa-user"></i>
                      </div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <span
                      className={`role-badge ${
                        user.role === 'admin' ? 'role-admin' : 'role-user'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(user)}
                        title="Sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(user.id)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="products-pagination">
        <div className="pagination-info">
          Từ {startIndex + 1} đến {Math.min(endIndex, filteredUsers.length)} trên
          tổng {filteredUsers.length}
        </div>
        <div className="pagination-controls">
          <div className="items-per-page">
            <span>Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Kết quả</span>
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${
                  currentPage === page ? 'active' : ''
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay-admin"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-content product-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editingUser ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Họ và tên *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="form-input"
                      placeholder="0123456789"
                    />
                  </div>
                </div>
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">
                      {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="form-input"
                        required={!editingUser}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i
                          className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vai trò *</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="form-input"
                      required
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {editingUser && (
                    <div className="form-group">
                      <label className="form-label">Ngày tạo</label>
                      <input
                        type="text"
                        value={formatDate(editingUser.createdAt)}
                        className="form-input"
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
