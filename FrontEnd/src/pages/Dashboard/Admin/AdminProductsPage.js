import React, { useState, useEffect } from 'react';
import './Admin.css';
import hostingData from '../../../mockData/hosting.json';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthlyPrice: '',
    yearlyPrice: '',
    hot: false,
    discountCodes: [],
    features: {
      ssd: '',
      ram: '',
      cpu: '',
      websites: '',
      emails: '',
      bandwidth: '',
      mysql: '',
      ssl: '',
      backup: '',
      dataTransfer: '',
      themesPlugins: '',
    },
  });

  useEffect(() => {
    // Load products from mock data
    const loadedProducts = hostingData.products || [];
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, products]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedProducts((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
      setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      monthlyPrice: product.monthlyPrice || '',
      yearlyPrice: product.yearlyPrice || '',
      hot: product.hot || false,
      discountCodes: product.discountCodes || [],
      features: product.features || {
        ssd: '',
        ram: '',
        cpu: '',
        websites: '',
        emails: '',
        bandwidth: '',
        mysql: '',
        ssl: '',
        backup: '',
        dataTransfer: '',
        themesPlugins: '',
      },
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      monthlyPrice: '',
      yearlyPrice: '',
      hot: false,
      discountCodes: [],
      features: {
        ssd: '',
        ram: '',
        cpu: '',
        websites: '',
        emails: '',
        bandwidth: '',
        mysql: '',
        ssl: '',
        backup: '',
        dataTransfer: '',
        themesPlugins: '',
      },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingProduct) {
      // Update existing product
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...formData, id: editingProduct.id }
            : p
        )
      );
    } else {
      // Add new product
      const newProduct = {
        ...formData,
        id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      };
      setProducts((prev) => [...prev, newProduct]);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.json';
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
            if (Array.isArray(importedData)) {
              setProducts(importedData);
              setFilteredProducts(importedData);
              alert('Nhập file thành công!');
            } else {
              alert('File không đúng định dạng!');
            }
          } catch (error) {
            alert('Lỗi khi đọc file!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="dashboard-overview">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Danh sách sản phẩm</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <i className="fas fa-arrow-up"></i> Xuất file
          </button>
          <button className="btn btn-secondary" onClick={handleImport}>
            <i className="fas fa-arrow-down"></i> Nhập file
          </button>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={handleAddNew}>
              <i className="fas fa-plus"></i> Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="products-filter-bar">
        <div className="filter-tabs">
          <button className="filter-tab active">Tất cả</button>
        </div>
        <div className="filter-controls">
          <div className="search-box-filter">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã sản phẩm, tên sản phẩm, barcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-select">
            <option>Kênh bán hàng</option>
          </select>
          <select className="filter-select">
            <option>Loại sản phẩm</option>
          </select>
          <select className="filter-select">
            <option>Tag</option>
          </select>
          <button className="btn btn-secondary">
            <i className="fas fa-filter"></i> Bộ lọc khác
          </button>
          <button className="btn btn-secondary">
            Lưu bộ lọc
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Sản phẩm</th>
              <th>Có thể bán</th>
              <th>Loại</th>
              <th>Nhãn hiệu</th>
              <th>Ngày khởi tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            ) : (
              currentProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td>
                    <div className="product-info">
                      <div className="product-image-placeholder">
                        <i className="fas fa-box"></i>
                      </div>
                      <div className="product-details">
                        <a href="#" className="product-name">{product.name}</a>
                        <div className="product-price">
                          {formatPrice(product.monthlyPrice)} VNĐ/tháng
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="sellable-badge">
                      {formatPrice(product.monthlyPrice * 100)}
                    </span>
                  </td>
                  <td>Hosting</td>
                  <td>TTCS</td>
                  <td>{formatDate(new Date())}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEdit(product)}
                        title="Sửa"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(product.id)}
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
          Từ {startIndex + 1} đến {Math.min(endIndex, filteredProducts.length)} trên tổng {filteredProducts.length}
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
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
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

      {/* Footer Link */}
      <div className="products-footer-link">
        <a href="#">Tìm hiểu thêm về sản phẩm</a>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giá tháng (VNĐ) *</label>
                    <input
                      type="number"
                      value={formData.monthlyPrice}
                      onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giá năm (VNĐ) *</label>
                    <input
                      type="number"
                      value={formData.yearlyPrice}
                      onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.hot}
                        onChange={(e) => setFormData({ ...formData, hot: e.target.checked })}
                      />
                      Sản phẩm nổi bật
                    </label>
                  </div>
                </div>
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">SSD</label>
                    <input
                      type="text"
                      value={formData.features.ssd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, ssd: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RAM</label>
                    <input
                      type="text"
                      value={formData.features.ram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, ram: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPU</label>
                    <input
                      type="text"
                      value={formData.features.cpu}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, cpu: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số website</label>
                    <input
                      type="number"
                      value={formData.features.websites}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features, websites: e.target.value },
                        })
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
