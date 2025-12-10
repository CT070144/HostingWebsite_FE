import React, { useState, useEffect } from 'react';
import './Admin.css';
import { bannerService } from '../../../services/bannerService';
import { baseUrl } from '../../../utils/api';
import { useNotify } from '../../../contexts/NotificationContext';
const TableRow = ({ banner, onView, onEdit, onDelete }) => {
  const id = banner.slide_id || banner.id;
  const btnText = banner.buttonText || banner.button_text;
  const baseUrl = "http://localhost:8084";
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
          <button
            className="btn-icon btn-view"
            onClick={() => onView?.(banner)}
            title="Xem chi tiết"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button
            className="btn-icon btn-edit"
            onClick={() => onEdit?.(banner)}
            title="Sửa"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => onDelete?.(id)}
            title="Xóa"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminBannerPage = () => {
  const { notifyError, notifyWarning } = useNotify();
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
    image_type: 'URL', // URL or FILE
  });
  const [imagePreview, setImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'upload'
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
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
        notifyError('Không tải được danh sách slide. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

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
      if (file.size > 2 * 1024 * 1024) {
        notifyWarning('Dung lượng ảnh tối đa 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        setFormData((prev) => ({
          ...prev,
          image: imageUrl,
          image_type: 'FILE',
        }));
        setImagePreview(imageUrl);
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
        const imageUrl = reader.result;
        setFormData((prev) => ({
          ...prev,
          image: imageUrl,
          image_type: 'FILE',
        }));
        setImagePreview(imageUrl);
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
    fd.append('title', formData.title);
    fd.append('subtitle', formData.subtitle);
    fd.append('description', formData.description);
    fd.append('image_type', formData.image_type || 'URL');
    fd.append('button_text', formData.buttonText);
    fd.append('button_link', formData.buttonLink);
    fd.append('display_order', Number(formData.display_order) || 0);

    if (formData.image_type === 'FILE') {
      // Khi tạo mới, bắt buộc phải có file
      // Khi update, chỉ gửi file nếu có file mới
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
        await bannerService.update(editingBanner.slide_id, fd);
      } else {
        await bannerService.create(fd);
      }
      const res = await bannerService.list();
      setBanners(res.data.map(banner => ({
        ...banner,
        image: banner.image 
          ? (banner.image_type === 'url' || banner.image_type === 'URL' 
            ? banner.image 
            : `${baseUrl}${banner.image}`)
          : ''
      })) || []);
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
    });
    setImagePreview(banner.image || '');
    setImageInputType((banner.image_type || 'URL').toLowerCase() === 'file' ? 'upload' : 'url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      bannerService
        .remove(id)
        .then(async () => {
          const res = await bannerService.list();
          setBanners(res.data.map(banner => ({
            ...banner,
            image: banner.image 
              ? (banner.image_type === 'url' || banner.image_type === 'URL' 
                ? banner.image 
                : `${baseUrl}${banner.image}`)
              : ''
          })) || []);
        })
        .catch((err) => {
          console.error('Delete slide failed', err);
          notifyError('Xóa slide thất bại. Vui lòng thử lại.');
        });
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
    });
    setImagePreview('');
    setImageInputType('url');
    setImageFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-overview">
      <div className="page-header">
        <h1 className="page-title">Banner</h1>
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
                <TableRow
                  key={banner.slide_id || banner.id}
                  banner={banner}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
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
                  {/* Image Upload Section */}
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
                    <div className="form-hint">
                      <i className="fas fa-info-circle"></i>
                      Đường dẫn tương đối hoặc tuyệt đối
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Tiêu đề chính *
                      <i className="fas fa-info-circle info-icon"></i>
                    </label>
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
                    <label className="form-label">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      name="display_order"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, display_order: e.target.value }))
                      }
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
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
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
    </div>
  );
};


export default AdminBannerPage;
