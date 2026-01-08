import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Admin.css';
import './AdminHostingBannerPage.css';
import { bannerService, hostingBannerService } from '../../../services/bannerService';
import { baseUrl } from '../../../utils/api';
import { useNotify } from '../../../contexts/NotificationContext';

const AdminBannersPage = () => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();
  const location = useLocation();
  
  // Auto-select tab based on URL
  const initialTab = location.pathname.includes('hosting-banner') ? 'hosting' : 'slides';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="dashboard-overview">
      {/* Tab Navigation */}
      <div className="page-header">
        <h1 className="page-title">Quản lý Banner</h1>
      </div>

      {/* Tab Buttons */}
      <div className="config-tabs" style={{ marginBottom: '2rem' }}>
        <button
          className={`config-tab ${activeTab === 'slides' ? 'active' : ''}`}
          onClick={() => setActiveTab('slides')}
        >
          <i className="fas fa-images"></i> Banner Slides
        </button>
        <button
          className={`config-tab ${activeTab === 'hosting' ? 'active' : ''}`}
          onClick={() => setActiveTab('hosting')}
        >
          <i className="fas fa-server"></i> Banner Hosting
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'slides' ? (
        <SlidesTab notifySuccess={notifySuccess} notifyError={notifyError} notifyWarning={notifyWarning} />
      ) : (
        <HostingTab notifySuccess={notifySuccess} notifyError={notifyError} notifyWarning={notifyWarning} />
      )}
    </div>
  );
};

// ============================================
// TAB 1: BANNER SLIDES
// ============================================
const SlidesTab = ({ notifySuccess, notifyError, notifyWarning }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    buttonText: '',
    buttonLink: '',
    display_order: 0,
    image_type: 'URL',
    is_active: true,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageInputType, setImageInputType] = useState('url');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await bannerService.list();
      setBanners(res.data.map(banner => ({
        ...banner,
        image: banner.image 
          ? (banner.image_type === 'url' || banner.image_type === 'URL' 
            ? banner.image 
            : `${baseUrl}${banner.image}`)
          : ''
      })) || []);
    } catch (err) {
      console.error('Load slides failed', err);
      notifyError('Không tải được danh sách slide.');
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
    
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notifyWarning('Dung lượng ảnh tối đa 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
          image_type: 'FILE',
        }));
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 2 * 1024 * 1024) {
        notifyWarning('Dung lượng ảnh tối đa 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
          image_type: 'FILE',
        }));
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      notifyWarning('Vui lòng nhập tiêu đề');
      return;
    }

    const fd = new FormData();
    fd.append('title', formData.title || '');
    fd.append('subtitle', formData.subtitle || '');
    fd.append('description', formData.description || '');
    fd.append('image_type', formData.image_type || 'URL');
    fd.append('button_text', formData.buttonText || '');
    fd.append('button_link', formData.buttonLink || '');
    fd.append('is_active', String(formData.is_active !== false));
    fd.append('display_order', Number(formData.display_order) || 0);

    if (formData.image_type === 'FILE') {
      if (!imageFile && !editingBanner) {
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
      if (editingBanner) {
        await bannerService.update(editingBanner.slide_id || editingBanner.id, fd);
        notifySuccess('Đã cập nhật banner thành công');
      } else {
        await bannerService.create(fd);
        notifySuccess('Đã tạo banner mới thành công');
      }
      await fetchSlides();
      handleCloseModal();
    } catch (err) {
      console.error('Save slide failed', err);
      notifyError(editingBanner ? 'Cập nhật slide thất bại' : 'Thêm slide thất bại');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    const btnText = banner.buttonText || banner.button_text || '';
    const btnLink = banner.buttonLink || banner.button_link || '';
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image: banner.image || '',
      image_type: banner.image_type || 'URL',
      buttonText: btnText,
      buttonLink: btnLink,
      display_order: banner.display_order ?? 0,
      is_active: banner.is_active !== undefined ? banner.is_active : true,
    });
    setImagePreview(banner.image || '');
    setImageInputType((banner.image_type || 'URL').toLowerCase() === 'file' ? 'upload' : 'url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    
    try {
      await bannerService.remove(id);
      notifySuccess('Đã xóa banner thành công');
      await fetchSlides();
    } catch (err) {
      console.error('Delete slide failed', err);
      notifyError('Xóa slide thất bại.');
    }
  };

  const handleView = (banner) => {
    setEditingBanner(banner);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      buttonText: '',
      buttonLink: '',
      display_order: 0,
      image_type: 'URL',
      is_active: true,
    });
    setImagePreview('');
    setImageInputType('url');
    setImageFile(null);
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      buttonText: '',
      buttonLink: '',
      display_order: 0,
      image_type: 'URL',
      is_active: true,
    });
    setImagePreview('');
    setImageInputType('url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const TableRow = ({ banner }) => {
    const id = banner.slide_id || banner.id;
    const btnText = banner.buttonText || banner.button_text;
    return (
      <tr key={id}>
        <td>{id}</td>
        <td>
          <div className="banner-thumbnail">
            <img src={banner.image} alt={banner.title} />
          </div>
        </td>
        <td>{banner.title}</td>
        <td>{banner.subtitle}</td>
        <td>{banner.image_type || 'URL'}</td>
        <td>{banner.display_order ?? 0}</td>
        <td>{btnText && <span className="button-badge">{btnText}</span>}</td>
        <td>
          <div className="action-buttons">
            <button className="btn-icon btn-view" onClick={() => handleView(banner)} title="Xem chi tiết">
              <i className="fas fa-eye"></i>
            </button>
            <button className="btn-icon btn-edit" onClick={() => handleEdit(banner)} title="Sửa">
              <i className="fas fa-edit"></i>
            </button>
            <button className="btn-icon btn-delete" onClick={() => handleDelete(id)} title="Xóa">
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      {/* Header with Add button */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ fontSize: '1.5rem', margin: 0 }}>Banner Slides</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Thêm banner mới
        </button>
      </div>

      {/* Banner List Table */}
      <div className="banner-table-container">
        <table className="banner-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tiêu đề</th>
              <th>Phụ đề</th>
              <th>Loại ảnh</th>
              <th>Thứ tự</th>
              <th>Nút bấm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  {loading ? 'Đang tải...' : 'Chưa có banner nào. Hãy thêm banner mới!'}
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.slide_id || banner.id} banner={banner} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay-admin" onClick={handleCloseModal}>
          <div className="modal-content banner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Sửa banner' : 'Thêm banner mới'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="banner-form">
              <div className="form-row">
                {/* Left Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Hình ảnh banner *</label>
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
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <>
                              <i className="fas fa-cloud-upload-alt"></i>
                              <p>Kéo thả hoặc thêm ảnh từ URL</p>
                              <p className="upload-hint">hoặc</p>
                              <span className="upload-link">Tải ảnh lên từ thiết bị</span>
                              <p className="upload-note">(Dung lượng ảnh tối đa 2MB)</p>
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
                    <label className="form-label">Phụ đề</label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      placeholder="Nhập phụ đề"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề chính *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Nhập tiêu đề banner"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Nhập mô tả banner"
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Văn bản nút bấm</label>
                    <input
                      type="text"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Xem thêm, Liên hệ ngay"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Liên kết nút bấm</label>
                    <input
                      type="text"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: /pricing, /contact"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      name="display_order"
                      value={formData.display_order}
                      onChange={(e) => setFormData((prev) => ({ ...prev, display_order: e.target.value }))}
                      placeholder="0"
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBanner ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && editingBanner && (
        <div className="modal-overlay-admin" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết Banner</h2>
              <button className="modal-close" onClick={() => setIsViewModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="view-content">
              <div className="view-image">
                <img src={editingBanner.image} alt={editingBanner.title} />
              </div>
              <div className="view-details">
                <div className="view-item">
                  <label>ID:</label>
                  <span>{editingBanner.slide_id || editingBanner.id}</span>
                </div>
                <div className="view-item">
                  <label>Loại ảnh:</label>
                  <span>{editingBanner.image_type || 'URL'}</span>
                </div>
                <div className="view-item">
                  <label>Tiêu đề:</label>
                  <span>{editingBanner.title}</span>
                </div>
                <div className="view-item">
                  <label>Phụ đề:</label>
                  <span>{editingBanner.subtitle || 'N/A'}</span>
                </div>
                <div className="view-item">
                  <label>Mô tả:</label>
                  <span>{editingBanner.description || 'N/A'}</span>
                </div>
                <div className="view-item">
                  <label>Văn bản nút:</label>
                  <span>{editingBanner.buttonText || editingBanner.button_text || 'N/A'}</span>
                </div>
                <div className="view-item">
                  <label>Liên kết:</label>
                  <span>{editingBanner.buttonLink || editingBanner.button_link || 'N/A'}</span>
                </div>
                <div className="view-item">
                  <label>Thứ tự:</label>
                  <span>{editingBanner.display_order ?? 0}</span>
                </div>
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
                  handleEdit(editingBanner);
                }}
              >
                Sửa banner
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// TAB 2: HOSTING BANNERS
// ============================================
const HostingTab = ({ notifySuccess, notifyError, notifyWarning }) => {
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
      
      const cleanFeatures = formData.features.filter(f => f && f.trim() !== '');
      submitFormData.append('features', JSON.stringify(cleanFeatures));
      
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
    <>
      {/* Header with Add button */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ fontSize: '1.5rem', margin: 0 }}>Banner Hosting</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Tạo banner mới
        </button>
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
        <div className="modal-overlay-admin" onClick={() => setIsModalOpen(false)}>
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
    </>
  );
};

export default AdminBannersPage;

