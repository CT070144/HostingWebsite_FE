import React, { useState, useEffect } from 'react';
import './AdminHostingBannerPage.css';
import { hostingBannerService } from '../../../services/bannerService';
import { baseUrl } from '../../../utils/api';
import { useNotify } from '../../../contexts/NotificationContext';

const AdminHostingBannerPage = () => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    image_type: 'URL',
    price: '',
    price_unit: '',
    features: [''],
    promotions: [''],
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await hostingBannerService.list();
      const bannersData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const normalizedBanners = bannersData.map(banner => ({
        ...banner,
        id: banner.id,
        image: banner.image 
          ? (banner.image_type === 'URL' || banner.image_type === 'url'
            ? banner.image 
            : `${baseUrl}${banner.image}`)
          : '',
        features: Array.isArray(banner.features) ? banner.features : [],
        promotions: Array.isArray(banner.promotions) ? banner.promotions : [],
      }));
      setBanners(normalizedBanners);
    } catch (err) {
      console.error('Failed to fetch hosting banners:', err);
      notifyError('Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      image_type: 'URL',
      price: '',
      price_unit: '',
      features: [''],
      promotions: [''],
    });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image_url: banner.image_type === 'URL' || banner.image_type === 'url' ? (banner.image || '') : '',
      image_type: banner.image_type || 'URL',
      price: banner.price || '',
      price_unit: banner.price_unit || banner.priceUnit || '',
      features: banner.features && banner.features.length > 0 ? banner.features : [''],
      promotions: banner.promotions && banner.promotions.length > 0 ? banner.promotions : [''],
    });
    setImageFile(null);
    setImagePreview(banner.image || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    
    try {
      await hostingBannerService.remove(id);
      notifySuccess('Đã xóa banner thành công');
      fetchBanners();
    } catch (err) {
      console.error('Delete banner failed:', err);
      notifyError(err?.response?.data?.message || 'Xóa banner thất bại');
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (name === 'image_url' && formData.image_type === 'URL') {
      setImagePreview(value);
    }
  };

  const handleImageTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      image_type: type,
      image_url: type === 'FILE' ? '' : prev.image_url,
    }));
    if (type === 'FILE') {
      setImagePreview('');
    } else {
      setImagePreview(formData.image_url);
    }
    setImageFile(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyWarning('Kích thước file không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
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
    
    if (formData.image_type !== 'FILE') {
      notifyWarning('Vui lòng chọn "FILE" cho loại hình ảnh');
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        notifyWarning('Kích thước file không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      notifyWarning('Vui lòng chọn file hình ảnh hợp lệ');
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleRemoveFeature = (index) => {
    if (formData.features.length === 1) {
      notifyWarning('Phải có ít nhất 1 tính năng');
      return;
    }
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const handlePromotionChange = (index, value) => {
    const newPromotions = [...formData.promotions];
    newPromotions[index] = value;
    setFormData(prev => ({
      ...prev,
      promotions: newPromotions,
    }));
  };

  const handleAddPromotion = () => {
    setFormData(prev => ({
      ...prev,
      promotions: [...prev.promotions, ''],
    }));
  };

  const handleRemovePromotion = (index) => {
    if (formData.promotions.length === 1) {
      notifyWarning('Phải có ít nhất 1 khuyến mãi');
      return;
    }
    const newPromotions = formData.promotions.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      promotions: newPromotions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      notifyWarning('Vui lòng nhập tiêu đề');
      return;
    }

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('subtitle', formData.subtitle || '');
      submitFormData.append('description', formData.description || '');
      submitFormData.append('image_type', formData.image_type || 'URL');
      submitFormData.append('price', formData.price || '');
      submitFormData.append('price_unit', formData.price_unit || '');
      
      // Append features as JSON array string
      const cleanFeatures = formData.features.filter(f => f && f.trim() !== '');
      submitFormData.append('features', JSON.stringify(cleanFeatures));
      
      // Append promotions as JSON array string
      const cleanPromotions = formData.promotions.filter(p => p && p.trim() !== '');
      submitFormData.append('promotions', JSON.stringify(cleanPromotions));

      if (formData.image_type === 'URL') {
        submitFormData.append('image_url', formData.image_url || '');
      } else if (imageFile) {
        submitFormData.append('image', imageFile);
      }

      if (editingBanner) {
        await hostingBannerService.update(editingBanner.id, submitFormData);
        notifySuccess('Đã cập nhật banner thành công');
      } else {
        await hostingBannerService.create(submitFormData);
        notifySuccess('Đã tạo banner mới thành công');
      }
      
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Submit banner failed:', err);
      notifyError(err?.response?.data?.message || 'Lưu banner thất bại');
    }
  };

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1 className="page-title">Quản lý Banner Trang Hosting</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <i className="fas fa-plus"></i> Tạo banner mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Đang tải danh sách banner...</p>
        </div>
      ) : (
        <div className="hosting-banners-list">
          {banners.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-image fa-3x mb-3"></i>
              <p>Chưa có banner nào. Nhấn "Tạo banner mới" để bắt đầu.</p>
            </div>
          ) : (
            <div className="banners-grid">
              {banners.map((banner) => (
                <div key={banner.id} className="banner-card">
                  <div className="banner-card-image">
                    {banner.image ? (
                      <img src={banner.image} alt={banner.title} />
                    ) : (
                      <div className="no-image">
                        <i className="fas fa-image"></i>
                      </div>
                    )}
                  </div>
                  <div className="banner-card-content">
                    <h3 className="banner-card-title">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="banner-card-subtitle">{banner.subtitle}</p>
                    )}
                    <div className="banner-card-price">
                      {banner.price && (
                        <span className="price-value">{banner.price}</span>
                      )}
                      {banner.price_unit && (
                        <span className="price-unit"> {banner.price_unit}</span>
                      )}
                    </div>
                    <div className="banner-card-meta">
                      <span className="meta-item">
                        <i className="fas fa-list"></i> {banner.features?.length || 0} tính năng
                      </span>
                      <span className="meta-item">
                        <i className="fas fa-tag"></i> {banner.promotions?.length || 0} khuyến mãi
                      </span>
                    </div>
                    <div className="banner-card-actions">
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => handleEdit(banner)}
                        title="Sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => handleDelete(banner.id)}
                        title="Xóa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content hosting-banner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Sửa banner' : 'Tạo banner mới'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="hosting-banner-form">
              <div className="form-section">
                <h3 className="form-section-title">Thông tin cơ bản</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      placeholder="VD: HOSTING GIÁ RẺ"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phụ đề</label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="VD: TIẾT KIỆM CHI PHÍ CHO WEBSITE"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Mô tả chi tiết về banner..."
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Hình ảnh</h3>
                <div className="form-group">
                  <label className="form-label">Loại hình ảnh</label>
                  <select
                    name="image_type"
                    value={formData.image_type}
                    onChange={handleImageTypeChange}
                    className="form-input"
                  >
                    <option value="URL">URL</option>
                    <option value="FILE">File upload</option>
                  </select>
                </div>
                {formData.image_type === 'URL' ? (
                  <div className="form-group">
                    <label className="form-label">URL hình ảnh</label>
                    <input
                      type="text"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="https://example.com/image.jpg"
                    />
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Upload hình ảnh</label>
                    <div
                      className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="file-upload-label">
                        {imagePreview ? (
                          <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                          </div>
                        ) : (
                          <div className="file-upload-placeholder">
                            <i className="fas fa-cloud-upload-alt fa-3x"></i>
                            <p>Kéo thả hình ảnh vào đây hoặc nhấn để chọn</p>
                            <small>PNG, JPG, GIF tối đa 5MB</small>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Giá</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Giá</label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="VD: 12,750"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đơn vị giá</label>
                    <input
                      type="text"
                      name="price_unit"
                      value={formData.price_unit}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="VD: VNĐ/THÁNG"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <h3 className="form-section-title">Tính năng (Features)</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddFeature}
                  >
                    <i className="fas fa-plus"></i> Thêm
                  </button>
                </div>
                {formData.features.map((feature, index) => (
                  <div key={index} className="dynamic-input-row">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="form-input"
                      placeholder={`Tính năng ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={formData.features.length === 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-section">
                <div className="form-section-header">
                  <h3 className="form-section-title">Khuyến mãi (Promotions)</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddPromotion}
                  >
                    <i className="fas fa-plus"></i> Thêm
                  </button>
                </div>
                {formData.promotions.map((promotion, index) => (
                  <div key={index} className="dynamic-input-row">
                    <input
                      type="text"
                      value={promotion}
                      onChange={(e) => handlePromotionChange(index, e.target.value)}
                      className="form-input"
                      placeholder={`Khuyến mãi ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemovePromotion(index)}
                      disabled={formData.promotions.length === 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBanner ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHostingBannerPage;

