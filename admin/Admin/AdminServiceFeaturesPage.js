import React, { useState, useEffect } from 'react';
import { serviceFeaturesService } from '../../../services/serviceFeaturesService';
import './AdminServiceFeaturesPage.css';
import { useNotify } from '../../../contexts/NotificationContext';

const baseUrl = 'http://localhost:8084';

const AdminServiceFeaturesPage = () => {
  const { notifyError, notifyWarning, notifySuccess } = useNotify();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [viewingFeature, setViewingFeature] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    image_type: 'URL',
    align: 'left',
    stats: []
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputType, setImageInputType] = useState('url');
  const [imageFile, setImageFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const res = await serviceFeaturesService.list();
      const featuresData = res.data.map(feature => ({
        ...feature,
        image: feature.image 
          ? (feature.image_type === 'url' || feature.image_type === 'URL' 
            ? feature.image 
            : `${baseUrl}${feature.image}`)
          : ''
      }));
      setFeatures(featuresData);
    } catch (err) {
      console.error('Failed to fetch service features:', err);
      notifyError('Không tải được danh sách dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    
    if (name === 'image' && imageInputType === 'url') {
      setImagePreview(value);
      updates.image_type = 'URL';
    }
    
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyWarning('Dung lượng ảnh tối đa 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
          image_type: 'FILE',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        notifyWarning('Dung lượng ảnh tối đa 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
          image_type: 'FILE',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStat = () => {
    setFormData((prev) => ({
      ...prev,
      stats: [...prev.stats, { value: '', label: '' }]
    }));
  };

  const handleRemoveStat = (index) => {
    setFormData((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const handleStatChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      notifyWarning('Vui lòng nhập đầy đủ tiêu đề và mô tả');
      return;
    }

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('image_type', formData.image_type || 'URL');
    fd.append('align', formData.align);
    
    // Gửi stats dạng JSON string
    const statsData = formData.stats.filter(s => s.value && s.label);
    if (statsData.length > 0) {
      fd.append('stats', JSON.stringify(statsData));
    }

    if (formData.image_type === 'FILE') {
      // Khi tạo mới, bắt buộc phải có file
      // Khi update, chỉ gửi file nếu có file mới
      if (!imageFile && !editingFeature) {
        notifyWarning('Vui lòng tải lên ảnh khi chọn loại FILE');
        return;
      }
      if (imageFile) {
        fd.append('image', imageFile);
      }
    } else {
      fd.append('image_url', formData.image);
    }

    try {
      if (editingFeature) {
        await serviceFeaturesService.update(editingFeature.id, fd);
      } else {
        await serviceFeaturesService.create(fd);
      }
      await fetchFeatures();
      handleCloseModal();
      notifySuccess(editingFeature ? 'Cập nhật dịch vụ thành công' : 'Thêm dịch vụ thành công');
    } catch (err) {
      console.error('Save feature failed', err);
      notifyError(editingFeature ? 'Cập nhật dịch vụ thất bại' : 'Thêm dịch vụ thất bại');
    }
  };

  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setFormData({
      title: feature.title || '',
      description: feature.description || '',
      image: feature.image || '',
      image_type: feature.image_type || 'URL',
      align: feature.align || 'left',
      stats: feature.stats || []
    });
    setImagePreview(feature.image || '');
    setImageInputType((feature.image_type || 'URL').toLowerCase() === 'file' ? 'upload' : 'url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      try {
        await serviceFeaturesService.remove(id);
        await fetchFeatures();
        notifySuccess('Đã xóa dịch vụ');
      } catch (err) {
        console.error('Delete feature failed', err);
        notifyError('Xóa dịch vụ thất bại. Vui lòng thử lại.');
      }
    }
  };

  const handleView = (feature) => {
    setViewingFeature(feature);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFeature(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      image_type: 'URL',
      align: 'left',
      stats: []
    });
    setImagePreview('');
    setImageInputType('url');
    setImageFile(null);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      image_type: 'URL',
      align: 'left',
      stats: []
    });
    setImagePreview('');
    setImageInputType('url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="service-features-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý Dịch vụ</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Thêm dịch vụ mới
        </button>
      </div>

      <div className="features-table-container">
        <table className="features-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tiêu đề</th>
              <th>Mô tả</th>
              <th>Căn chỉnh</th>
              <th>Số liệu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : features.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Chưa có dịch vụ nào. Hãy thêm dịch vụ mới!
                </td>
              </tr>
            ) : (
              features.map((feature) => (
                <tr key={feature.id}>
                  <td className="id-cell">{feature.id}</td>
                  <td>
                    <div className="feature-thumbnail">
                      <img src={feature.image} alt={feature.title} />
                    </div>
                  </td>
                  <td className="title-cell">{feature.title}</td>
                  <td className="description-cell">{feature.description}</td>
                  <td>
                    <span className={`badge badge-${feature.align}`}>
                      {feature.align === 'left' ? 'Trái' : 'Phải'}
                    </span>
                  </td>
                  <td>
                    {feature.stats && feature.stats.length > 0 ? (
                      <span className="badge badge-info">{feature.stats.length} số liệu</span>
                    ) : (
                      <span className="text-muted">Không có</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(feature)}
                        title="Xem chi tiết"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(feature)}
                        title="Sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(feature.id)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay-admin" onClick={handleCloseModal}>
          <div className="modal-content feature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFeature ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="feature-form">
              <div className="form-row">
                {/* Left Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Hình ảnh *</label>
                    <div className="image-upload-tabs">
                      <button
                        type="button"
                        className={`tab-button ${imageInputType === 'url' ? 'active' : ''}`}
                        onClick={() => {
                          setImageInputType('url');
                          setFormData((prev) => ({ ...prev, image_type: 'URL' }));
                          setImageFile(null);
                        }}
                      >
                        Từ URL
                      </button>
                      <button
                        type="button"
                        className={`tab-button ${imageInputType === 'upload' ? 'active' : ''}`}
                        onClick={() => {
                          setImageInputType('upload');
                          setFormData((prev) => ({ ...prev, image_type: 'FILE' }));
                        }}
                      >
                        Tải lên
                      </button>
                    </div>

                    {imageInputType === 'url' ? (
                      <div className="form-group">
                        <input
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          placeholder="Nhập URL hình ảnh"
                          className="form-input"
                          required
                        />
                        <div className="form-hint">
                          <i className="fas fa-info-circle"></i>
                          Nhập URL hình ảnh từ internet
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="image-upload-input"
                        />
                        <label htmlFor="image-upload" className="image-upload-label">
                          {imagePreview ? (
                            <div className="image-preview-container">
                              <img src={imagePreview} alt="Preview" className="image-preview" />
                              <button
                                type="button"
                                className="remove-image-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setImagePreview('');
                                  setFormData((prev) => ({ ...prev, image: '' }));
                                  setImageFile(null);
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <>
                              <i className="fas fa-cloud-upload-alt"></i>
                              <p>Kéo thả ảnh vào đây</p>
                              <p className="upload-hint">hoặc</p>
                              <span className="upload-link">Tải ảnh lên từ thiết bị</span>
                              <p className="upload-note">(Dung lượng ảnh tối đa 5MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {imagePreview && (
                      <div className="image-preview-wrapper">
                        <img src={imagePreview} alt="Preview" className="form-image-preview" />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Căn chỉnh</label>
                    <select
                      name="align"
                      value={formData.align}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="left">Trái</option>
                      <option value="right">Phải</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Loại ảnh (tự động)</label>
                    <div className="image-type-display">
                      <span className={`badge badge-${formData.image_type === 'FILE' ? 'info' : 'left'}`}>
                        {formData.image_type || 'URL'}
                      </span>
                      <span className="form-hint">
                        <i className="fas fa-info-circle"></i>
                        Tự động cập nhật khi chọn URL hoặc tải file
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề dịch vụ"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Nhập mô tả dịch vụ"
                      className="form-textarea"
                      rows="5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Số liệu (Statistics)
                      <button
                        type="button"
                        className="btn-add-stat"
                        onClick={handleAddStat}
                      >
                        <i className="fas fa-plus"></i> Thêm số liệu
                      </button>
                    </label>
                    {formData.stats.map((stat, index) => (
                      <div key={index} className="stat-item">
                        <input
                          type="text"
                          placeholder="Giá trị (vd: 99.9%)"
                          value={stat.value}
                          onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                          className="form-input stat-input"
                        />
                        <input
                          type="text"
                          placeholder="Nhãn (vd: Uptime)"
                          value={stat.label}
                          onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                          className="form-input stat-input"
                        />
                        <button
                          type="button"
                          className="btn-remove-stat"
                          onClick={() => handleRemoveStat(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFeature ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingFeature && (
        <div className="modal-overlay-admin" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết Dịch vụ</h2>
              <button className="modal-close" onClick={() => setIsViewModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="view-content">
              <div className="view-image">
                <img src={viewingFeature.image} alt={viewingFeature.title} />
              </div>
              <div className="view-details">
                <div className="view-item">
                  <label>ID:</label>
                  <span>{viewingFeature.id}</span>
                </div>
                <div className="view-item">
                  <label>Tiêu đề:</label>
                  <span>{viewingFeature.title}</span>
                </div>
                <div className="view-item">
                  <label>Mô tả:</label>
                  <p>{viewingFeature.description}</p>
                </div>
                <div className="view-item">
                  <label>Loại ảnh:</label>
                  <span>{viewingFeature.image_type || 'URL'}</span>
                </div>
                <div className="view-item">
                  <label>Căn chỉnh:</label>
                  <span className={`badge badge-${viewingFeature.align}`}>
                    {viewingFeature.align === 'left' ? 'Trái' : 'Phải'}
                  </span>
                </div>
                {viewingFeature.stats && viewingFeature.stats.length > 0 && (
                  <div className="view-item">
                    <label>Số liệu:</label>
                    <div className="stats-list">
                      {viewingFeature.stats.map((stat, index) => (
                        <div key={index} className="stat-badge">
                          <strong>{stat.value}</strong> - {stat.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Đóng
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(viewingFeature);
                }}
              >
                Sửa dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceFeaturesPage;

