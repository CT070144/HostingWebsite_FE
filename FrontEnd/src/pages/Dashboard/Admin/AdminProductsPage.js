import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './AdminProductsPage.css';

import hostingData from '../../../mockData/hosting.json';
import homeMockData from '../../../mockData/home.json';
import { featuredProductService } from '../../../services/featuredProductService';
import { discountService } from '../../../services/discountService';
import { productService } from '../../../services/productService';
import { useNotify } from '../../../contexts/NotificationContext';

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError, notifyWarning } = useNotify();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [loadingProducts, setLoadingProducts] = useState(true);
  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sort: '',
    type: '',
    min_price: '',
    max_price: '',
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [allDiscountCodes, setAllDiscountCodes] = useState([]);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [discountSearchTerm, setDiscountSearchTerm] = useState('');
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    discount_percent: '',
    max_cycle: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    monthlyPrice: '',
    yearlyPrice: '',
    hot: false,
    discountCodes: [],
    features: [], // Array of { key: '', value: '' }
  });
  // Featured products (Home page)
  const [featuredProducts, setFeaturedProducts] = useState(homeMockData.featuredProducts || []);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [isFeaturedPreviewOpen, setIsFeaturedPreviewOpen] = useState(false);
  const [featuredForm, setFeaturedForm] = useState({
    id: null,
    type: 'hosting',
    title: '',
    icon: 'fas fa-server',
    description: '',
    price: '',
    priceUnit: 'vnđ/tháng',
    link: '/pricing',
    features: [],
  });
  const FEATURED_ICONS = [
    'fas fa-server',
    'fas fa-cloud',
    'fas fa-rocket',
    'fas fa-shield-alt',
    'fas fa-database',
    'fas fa-bolt',
    'fas fa-cubes',
  ];

  const normalizeFeatured = (raw) =>
    (raw || []).map((item) => ({
      ...item,
      priceUnit: item.priceUnit || item.price_unit || 'vnđ/tháng',
      features: Array.isArray(item.features) ? item.features : [],
    }));

  // Fetch discount codes function - moved outside useEffect so it can be called elsewhere
  const fetchDiscountCodes = async () => {
    try {
      setLoadingDiscountCodes(true);
      const res = await discountService.list();
      const codes = res.data || [];
      setAllDiscountCodes(codes);
    } catch (err) {
      console.error('Fetch discount codes failed, fallback to mock', err);
      // Fallback: collect unique from mock products
      const mockProducts = hostingData.products || [];
      const allCodes = [];
      const codeMap = new Map();
      mockProducts.forEach(product => {
        if (product.discountCodes && Array.isArray(product.discountCodes)) {
          product.discountCodes.forEach(code => {
            if (!codeMap.has(code.code)) {
              codeMap.set(code.code, code);
              allCodes.push(code);
            }
          });
        }
      });
      console.log(allCodes);
      setAllDiscountCodes(allCodes);
    } finally {
      setLoadingDiscountCodes(false);
    }
  };

  // Fetch products function - moved outside useEffect so it can be called elsewhere
  const fetchProducts = async (filterParams = null) => {
    try {
      setLoadingProducts(true);
      
      // Build query parameters
      const params = filterParams || filters;
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
      };
      
      // Add optional filters
      if (params.sort) queryParams.sort = params.sort;
      if (params.type) queryParams.type = params.type;
      if (params.min_price) queryParams.min_price = Number(params.min_price);
      if (params.max_price) queryParams.max_price = Number(params.max_price);
      
      // Add search term if exists (client-side search for now, or can be moved to API if supported)
      
      const res = await productService.listPublic(queryParams);
      
      // Handle different response formats
      let productsData = [];
      let total = 0;
      let pages = 1;
      
      if (Array.isArray(res.data)) {
        productsData = res.data;
        total = res.data.length;
      } else if (res.data?.products && Array.isArray(res.data.products)) {
        productsData = res.data.products;
        total = res.data.total || res.data.products.length;
        pages = res.data.totalPages || Math.ceil(total / queryParams.limit);
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        productsData = res.data.data;
        total = res.data.total || res.data.data.length;
        pages = res.data.totalPages || Math.ceil(total / queryParams.limit);
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        productsData = res.data.content;
        total = res.data.totalElements || res.data.content.length;
        pages = res.data.totalPages || Math.ceil(total / queryParams.limit);
      }
      
      // Normalize products data to match API format
      const normalizedProducts = productsData.map((p) => ({
        id: p.id,
        name: p.name || '',
        monthlyPrice: p.monthlyPrice || 0,
        yearlyPrice: p.yearlyPrice || 0,
        hot: p.hot || false,
        discountCodes: Array.isArray(p.discountCodes) ? p.discountCodes : [],
        features: p.features && typeof p.features === 'object' ? p.features : {},
      }));
      
      setProducts(normalizedProducts);
      setFilteredProducts(normalizedProducts);
      setTotalProducts(total);
      setTotalPages(pages);
      
      // Update current page if using API pagination
      if (filterParams) {
        setCurrentPage(params.page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch products from API:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách sản phẩm';
      notifyError(errorMessage);
      
      // Set empty state on error
      setProducts([]);
      setFilteredProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {

    const fetchFeatured = async () => {
      try {
        const res = await featuredProductService.list();
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.content)
          ? res.data.content
          : [];
        setFeaturedProducts(normalizeFeatured(data));
      } catch (err) {
        console.error('Fetch featured products failed, fallback to mock', err);
        setFeaturedProducts(normalizeFeatured(homeMockData.featuredProducts || []));
      }
    };

    fetchProducts();
    fetchDiscountCodes();
    fetchFeatured();
  }, []);

  // Handle filter changes - fetch products with new filters
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to page 1 when filter changes
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  // Handle search - can be client-side or trigger API call
  useEffect(() => {
    // Client-side search for now
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

  // Handle pagination changes
  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  const handleItemsPerPageChange = (newLimit) => {
    const newFilters = { ...filters, limit: Number(newLimit), page: 1 };
    setFilters(newFilters);
    setItemsPerPage(Number(newLimit));
    fetchProducts(newFilters);
  };

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

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      await productService.remove(id);
      setSelectedProducts((prev) => prev.filter((selectedId) => selectedId !== id));
      // Refresh products list with current filters
      await fetchProducts(filters);
      notifySuccess('Đã xóa sản phẩm thành công');
    } catch (err) {
      console.error('Delete product failed:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Xóa sản phẩm thất bại';
      notifyError(errorMessage);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) return;
    
    try {
      // Delete all selected products
      const deletePromises = selectedProducts.map(id => productService.remove(id));
      await Promise.all(deletePromises);
      
      setSelectedProducts([]);
      // Refresh products list with current filters
      await fetchProducts(filters);
      notifySuccess(`Đã xóa ${selectedProducts.length} sản phẩm thành công`);
    } catch (err) {
      console.error('Delete products failed:', err);
      notifyError('Xóa sản phẩm thất bại');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Convert features object to array of key-value pairs
    const featuresArray = product.features && typeof product.features === 'object' && !Array.isArray(product.features)
      ? Object.entries(product.features).map(([key, value]) => ({ key, value: value || '' }))
      : Array.isArray(product.features) ? product.features : [];
    
    setFormData({
      name: product.name || '',
      monthlyPrice: product.monthlyPrice || '',
      yearlyPrice: product.yearlyPrice || '',
      hot: product.hot || false,
      discountCodes: product.discountCodes || [],
      features: featuresArray,
    });
    setIsModalOpen(true);
  };

  // Format feature label: uppercase acronyms, capitalize first letter for others
  const formatFeatureLabel = (key) => {
    if (!key) return '';
    const acronyms = ['SSD', 'RAM', 'CPU', 'GB', 'MB', 'TB', 'IO', 'DDoS', 'SSL', 'MySQL', 'FTP', 'PHP', 'API', 'HTTP', 'HTTPS', 'DNS', 'CDN', 'VPS', 'IP'];
    const words = key.split(/\s+/);
    return words.map(word => {
      const upperWord = word.toUpperCase();
      if (acronyms.includes(upperWord)) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  // Template features for new products
  const getDefaultFeatures = () => [
    { key: 'SSD', value: '' },
    { key: 'RAM', value: '' },
    { key: 'CPU', value: '' },
  ];

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      monthlyPrice: '',
      yearlyPrice: '',
      hot: false,
      discountCodes: [],
      features: getDefaultFeatures(),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert features array to object
    const featuresObject = formData.features.reduce((acc, item) => {
      if (item.key && item.key.trim()) {
        acc[item.key] = item.value || '';
      }
      return acc;
    }, {});
    
    // Prepare product data according to API format
    const productData = {
      name: formData.name.trim(),
      monthlyPrice: Number(formData.monthlyPrice) || 0,
      yearlyPrice: Number(formData.yearlyPrice) || 0,
      hot: formData.hot || false,
      discountCodes: formData.discountCodes || [],
      features: featuresObject,
    };
    
    try {
      if (editingProduct) {
        // Update existing product
        await productService.update(editingProduct.id, productData);
        
        // Refresh products list with current filters
        await fetchProducts(filters);
        notifySuccess('Đã cập nhật sản phẩm thành công');
      } else {
        // Create new product
        const res = await productService.create(productData);
        const newProduct = res.data || productData;
        
        // Refresh products list with current filters
        await fetchProducts(filters);
        notifySuccess('Đã tạo sản phẩm mới thành công');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Submit product failed:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Lưu sản phẩm thất bại';
      notifyError(errorMessage);
    }
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

  // Discount Code Management
  const handleOpenDiscountModal = () => {
    setIsDiscountModalOpen(true);
  };

  const handleCloseDiscountModal = () => {
    setIsDiscountModalOpen(false);
    setDiscountSearchTerm('');
    setNewDiscountCode({ code: '', discount: '', maxCycle: '', description: '' });
  };

  const handleAddExistingDiscount = (discount) => {
    // Check if code already exists in current product
    const exists = formData.discountCodes.some(d => d.code === discount.code);
    if (exists) {
      notifyWarning('Mã giảm giá này đã tồn tại trong sản phẩm!');
      return;
    }
    setFormData(prev => ({
      ...prev,
      discountCodes: [...prev.discountCodes, discount]
    }));
    notifySuccess('Đã thêm mã giảm giá!');
  };

  const handleCreateNewDiscount = () => {
    if (!newDiscountCode.code || !newDiscountCode.discount_percent) {
      notifyWarning('Vui lòng nhập mã code và % giảm giá!');
      return;
    }
    
    const discountValue = Number(newDiscountCode.discount_percent);
    if (discountValue <= 0 || discountValue > 100) {
      notifyWarning('% giảm giá phải từ 1 đến 100!');
      return;
    }

    // Check if code already exists
    const exists = formData.discountCodes.some(d => d.code === newDiscountCode.code);
    if (exists) {
      notifyWarning('Mã giảm giá này đã tồn tại trong sản phẩm!');
      return;
    }

    const payload = {
      code: newDiscountCode.code.toUpperCase(),
      description: newDiscountCode.description || `Giảm ${discountValue}%`,
      discount_percent: discountValue,
      is_active: true, // mặc định true
      max_cycle: newDiscountCode.max_cycle ? Number(newDiscountCode.max_cycle) : undefined,
    };
    // Remove undefined fields
    if (!payload.max_cycle) delete payload.max_cycle;

    discountService.create(payload)
      .then((res) => {
        // Handle different response formats
        let created = payload;
        if (res.data) {
          created = res.data.data || res.data || payload;
        }
        
        // Normalize the created discount code to ensure all required fields
        const normalizedDiscount = {
          discount_code_id: created.discount_code_id || created.id,
          code: created.code || payload.code,
          discount_percent: created.discount_percent ?? created.discount_percent ?? payload.discount_percent,
          max_cycle: created.max_cycle ?? payload.max_cycle,
          description: created.description || payload.description || '',
          is_active: created.is_active ?? true,
        };
        
        // Update form data with new discount code
        setFormData(prev => ({
          ...prev,
          discountCodes: [...prev.discountCodes, normalizedDiscount]
        }));

        // Refresh the discount codes list from API
        fetchDiscountCodes().then(() => {
          setNewDiscountCode({ code: '', discount_percent: '', max_cycle: '', description: '' });
          notifySuccess('Đã tạo mã giảm giá mới và thêm vào sản phẩm!');
        }).catch(() => {
          // If refresh fails, still update local state
          const existsInAll = allDiscountCodes.some(d => d.code === normalizedDiscount.code);
          if (!existsInAll) {
            setAllDiscountCodes(prev => [...prev, normalizedDiscount]);
          }
          setNewDiscountCode({ code: '', discount_percent: '', max_cycle: '', description: '' });
          notifySuccess('Đã tạo mã giảm giá mới và thêm vào sản phẩm!');
        });
      })
      .catch((err) => {
        console.error('Create discount failed', err);
        const errorMessage = err?.response?.data?.message || err?.message || 'Tạo mã giảm giá thất bại';
        notifyError(errorMessage);
      });
  };

  const handleRemoveDiscount = (codeToRemove) => {
    setFormData(prev => ({
      ...prev,
      discountCodes: prev.discountCodes.filter(d => d.code !== codeToRemove)
    }));
  };

  // Featured products handlers
  const handleOpenFeaturedModal = () => {
    setIsFeaturedModalOpen(true);
  };

  const handleCloseFeaturedModal = () => {
    setIsFeaturedModalOpen(false);
    setIsFeaturedPreviewOpen(false);
    setFeaturedForm({
      id: null,
      type: 'hosting',
      title: '',
      icon: 'fas fa-server',
      description: '',
      price: '',
      priceUnit: 'vnđ/tháng',
      link: '/pricing',
      features: [],
    });
  };

  const handleEditFeatured = (item) => {
    setFeaturedForm({
      ...item,
      features: item.features && Array.isArray(item.features) ? item.features : [],
    });
    setIsFeaturedModalOpen(true);
  };

  const handleDeleteFeatured = (id) => {
    setFeaturedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmitFeatured = (e) => {
    e.preventDefault();
    if (!featuredForm.title || !featuredForm.price) {
      notifyWarning('Vui lòng nhập tiêu đề và giá');
      return;
    }
    if (!featuredForm.priceUnit) {
      notifyWarning('Vui lòng nhập đơn vị giá');
      return;
    }
    if (!featuredForm.link) {
      notifyWarning('Vui lòng nhập liên kết');
      return;
    }
    if (!featuredForm.features || featuredForm.features.length === 0) {
      notifyWarning('Vui lòng thêm ít nhất 1 tính năng');
      return;
    }
    const priceString = featuredForm.price.toString();
    if (editingProduct) {
      // no-op
    }
    const cleanFeatures = (featuredForm.features || []).filter((f) => f && f.trim() !== '');
    const payload = {
      title: featuredForm.title,
      description: featuredForm.description,
      icon: featuredForm.icon,
      price: priceString,
      price_unit: featuredForm.priceUnit,
      link: featuredForm.link,
      type: featuredForm.type || 'hosting',
      features: cleanFeatures,
    };

    // Nếu chưa có id => tạo mới qua API, nếu có id giữ behavior local update (chưa có API update)
    if (!featuredForm.id) {
      featuredProductService.create(payload)
        .then((res) => {
          const created = res.data || { ...payload };
          setFeaturedProducts((prev) => [...prev, created]);
          notifySuccess('Đã thêm sản phẩm nổi bật');
          handleCloseFeaturedModal();
        })
        .catch((err) => {
          console.error('Create featured product failed', err);
          notifyError(err?.response?.data?.message || 'Thêm sản phẩm nổi bật thất bại');
        });
    } else {
      const updated = {
        ...featuredForm,
        price: priceString,
        features: cleanFeatures,
      };
      setFeaturedProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      notifySuccess('Đã cập nhật sản phẩm nổi bật (local)');
      handleCloseFeaturedModal();
    }
  };

  const handleOpenFeaturedPreview = () => {
    const requiredMissing = [];
    if (!featuredForm.title) requiredMissing.push('Tiêu đề');
    if (!featuredForm.price) requiredMissing.push('Giá');
    if (!featuredForm.priceUnit) requiredMissing.push('Đơn vị giá');
    if (!featuredForm.link) requiredMissing.push('Liên kết');
    if (!featuredForm.features || featuredForm.features.length === 0) requiredMissing.push('Tính năng');
    if (requiredMissing.length > 0) {
      notifyWarning(`Vui lòng nhập: ${requiredMissing.join(', ')}`);
      return;
    }
    setIsFeaturedPreviewOpen(true);
  };

  // Filter discount codes based on search
  const filteredDiscountCodes = allDiscountCodes.filter(discount => 
    (discount.code || '').toLowerCase().includes(discountSearchTerm.toLowerCase()) ||
    (discount.description || '').toLowerCase().includes(discountSearchTerm.toLowerCase())
  );

  // Use products directly from API (already paginated), apply client-side search filter if needed
  const currentProducts = searchTerm.trim() 
    ? filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm)
      )
    : filteredProducts;

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
          <button className="btn btn-secondary" onClick={handleOpenFeaturedModal}>
            <i className="fas fa-star"></i> Sản phẩm nổi bật
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/configuration/hosting-banner')}>
            <i className="fas fa-image"></i> Banner Hosting
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
          <select 
            className="filter-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Tất cả loại</option>
            <option value="VPS">VPS</option>
            <option value="Hosting">Hosting</option>
            <option value="Cloud_Compute">Cloud Compute</option>
          </select>
          <select 
            className="filter-select"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="">Sắp xếp</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
          <input
            type="number"
            className="filter-select"
            placeholder="Giá tối thiểu"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            style={{ width: '150px', padding: '8px' }}
          />
          <input
            type="number"
            className="filter-select"
            placeholder="Giá tối đa"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            style={{ width: '150px', padding: '8px' }}
          />
          <button 
            className="btn btn-secondary"
            onClick={() => {
              const resetFilters = {
                page: 1,
                limit: 20,
                sort: '',
                type: '',
                min_price: '',
                max_price: '',
              };
              setFilters(resetFilters);
              fetchProducts(resetFilters);
            }}
          >
            <i className="fas fa-redo"></i> Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        {loadingProducts ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Đang tải sản phẩm...</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Pagination */}
      <div className="products-pagination">
        <div className="pagination-info">
          {loadingProducts 
            ? 'Đang tải...'
            : `Từ ${(currentPage - 1) * itemsPerPage + 1} đến ${Math.min(currentPage * itemsPerPage, totalProducts)} trên tổng ${totalProducts}`
          }
        </div>
        <div className="pagination-controls">
          <div className="items-per-page">
            <span>Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
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
              disabled={currentPage === 1 || loadingProducts}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
                disabled={loadingProducts}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages || loadingProducts}
              onClick={() => handlePageChange(currentPage + 1)}
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
                </div>
                <div className="form-column">
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
                      Nổi bật
                    </label>
                  </div>
                </div>
              </div>

              {/* Features Section - Dynamic Key-Value Pairs */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '16px', fontWeight: 600 }}>
                    Tính năng (Features)
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        features: [...formData.features, { key: '', value: '' }],
                      });
                    }}
                    style={{ padding: '6px 15px', fontSize: '14px' }}
                  >
                    <i className="fas fa-plus"></i> Thêm tính năng
                  </button>
                </div>
                
                {formData.features.length === 0 ? (
                  <p style={{ color: '#999', fontStyle: 'italic', padding: '15px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    Chưa có tính năng nào. Nhấn nút "Thêm tính năng" để thêm.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                        }}
                      >
                        <input
                          type="text"
                          value={feature.key || ''}
                          onChange={(e) => {
                            const updatedFeatures = [...formData.features];
                            updatedFeatures[index] = { ...updatedFeatures[index], key: e.target.value };
                            setFormData({ ...formData, features: updatedFeatures });
                          }}
                          className="form-input"
                          placeholder="VD: SSD, RAM, CPU..."
                          style={{ flex: 1 }}
                          onBlur={(e) => {
                            // Format label on blur
                            const formattedKey = formatFeatureLabel(e.target.value);
                            if (formattedKey !== e.target.value) {
                              const updatedFeatures = [...formData.features];
                              updatedFeatures[index] = { ...updatedFeatures[index], key: formattedKey };
                              setFormData({ ...formData, features: updatedFeatures });
                            }
                          }}
                        />
                        <input
                          type="text"
                          value={feature.value || ''}
                          onChange={(e) => {
                            const updatedFeatures = [...formData.features];
                            updatedFeatures[index] = { ...updatedFeatures[index], value: e.target.value };
                            setFormData({ ...formData, features: updatedFeatures });
                          }}
                          className="form-input"
                          placeholder="VD: 50 GB, 4.0 GB..."
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFeatures = formData.features.filter((_, i) => i !== index);
                            setFormData({ ...formData, features: updatedFeatures });
                          }}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#dc3545',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee';
                            e.currentTarget.style.borderColor = '#dc3545';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }}
                          title="Xóa"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Codes Section */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">
                  Mã giảm giá
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenDiscountModal}
                    style={{ marginLeft: '10px', padding: '5px 15px', fontSize: '14px' }}
                  >
                    <i className="fas fa-plus"></i> Thêm mã giảm giá
                  </button>
                </label>
                {formData.discountCodes.length === 0 ? (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>
                    Chưa có mã giảm giá nào. Nhấn nút "Thêm mã giảm giá" để thêm.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {formData.discountCodes.map((discount, index) => {
                      // Use a unique key - prefer discount_code_id or id, fallback to code + index
                      const uniqueKey = discount.discount_code_id || discount.id || `${discount.code}-${index}`;
                      const discountPercent = discount.discount_percent ?? discount.discount ?? 0;
                      const code = discount.code || '';
                      const description = discount.description || '';
                      const maxCycle = discount.max_cycle;
                      const isActive = discount.is_active !== undefined ? discount.is_active : true;
                      
                      return (
                        <div
                          key={uniqueKey}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            {code && (
                              <strong style={{ color: '#1976d2' }}>{code}</strong>
                            )}
                            <span style={{ marginLeft: code ? '10px' : '0', color: '#4caf50' }}>
                              -{discountPercent}%
                            </span>
                            {maxCycle && (
                              <span style={{ marginLeft: '10px', color: '#ff9800', fontSize: '12px' }}>
                                (Tối đa {maxCycle} tháng)
                              </span>
                            )}
                            {!isActive && (
                              <span style={{ marginLeft: '10px', color: '#f44336', fontSize: '12px' }}>
                                (Ngừng kích hoạt)
                              </span>
                            )}
                            {description && (
                              <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                                {description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            onClick={() => handleRemoveDiscount(code)}
                            title="Xóa"
                            style={{ marginLeft: '10px' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Discount Code Modal */}
      {isDiscountModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDiscountModal}>
          <div 
            className="modal-content product-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px' }}
          >
            <div className="modal-header">
              <h2>Danh mục Mã giảm giá</h2>
              <button className="modal-close" onClick={handleCloseDiscountModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Create New Discount Code */}
              <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
                  <i className="fas fa-plus-circle"></i> Tạo mã giảm giá mới
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Mã code *</label>
                    <input
                      type="text"
                      value={newDiscountCode.code}
                      onChange={(e) => setNewDiscountCode({
                        ...newDiscountCode,
                        code: e.target.value.toUpperCase()
                      })}
                      placeholder="VD: SUMMER2024"
                      className="form-input"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">% Giảm giá *</label>
                    <input
                      type="number"
                      value={newDiscountCode.discount_percent}
                      onChange={(e) => setNewDiscountCode({
                        ...newDiscountCode,
                        discount_percent: e.target.value
                      })}
                      placeholder="VD: 50"
                      className="form-input"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chu kỳ tối đa (tháng)</label>
                    <input
                      type="number"
                      value={newDiscountCode.max_cycle}
                      onChange={(e) => setNewDiscountCode({
                        ...newDiscountCode,
                        max_cycle: e.target.value
                      })}
                      placeholder="VD: 24 (tùy chọn)"
                      className="form-input"
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <input
                      type="text"
                      value={newDiscountCode.description}
                      onChange={(e) => setNewDiscountCode({
                        ...newDiscountCode,
                        description: e.target.value
                      })}
                      placeholder="VD: Giảm giá mùa hè"
                      className="form-input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateNewDiscount}
                  style={{ marginTop: '10px' }}
                >
                  <i className="fas fa-check"></i> Tạo và thêm vào sản phẩm
                </button>
              </div>

              {/* Lookup Existing Discount Codes */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
                  <i className="fas fa-search"></i> Chọn từ mã giảm giá có sẵn
                </h3>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    value={discountSearchTerm}
                    onChange={(e) => setDiscountSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm mã giảm giá..."
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: '#fff'
                }}>
                  {loadingDiscountCodes ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#1976d2' }}>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p style={{ marginTop: '10px' }}>Đang tải mã giảm giá...</p>
                    </div>
                  ) : filteredDiscountCodes.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '10px' }}></i>
                      <p>Không tìm thấy mã giảm giá nào</p>
                    </div>
                  ) : (
                    filteredDiscountCodes.map((discount, index) => (
                      <div
                        key={discount.discount_code_id || index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '15px',
                          borderBottom: index < filteredDiscountCodes.length - 1 ? '1px solid #e0e0e0' : 'none',
                          transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <div style={{ flex: 1 }}>
                          <div>
                            <strong style={{ color: '#1976d2', fontSize: '16px' }}>
                              {discount.code}
                            </strong>
                            <span style={{ 
                              marginLeft: '10px', 
                              color: '#4caf50',
                              fontWeight: 'bold',
                              fontSize: '15px'
                            }}>
                              -{discount.discount_percent ?? discount.discount ?? 0}%
                            </span>
                            {discount.max_cycle && (
                              <span style={{ 
                                marginLeft: '10px', 
                                color: '#ff9800',
                                fontSize: '13px',
                                backgroundColor: '#fff3e0',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                Tối đa {discount.max_cycle} tháng
                              </span>
                            )}
                            {discount.product_id && (
                              <span style={{ marginLeft: '10px', color: '#607d8b', fontSize: '12px' }}>
                                PID: {discount.product_id}
                              </span>
                            )}
                            {!discount.is_active && (
                              <span style={{ marginLeft: '10px', color: '#f44336', fontSize: '12px' }}>
                                (Ngừng kích hoạt)
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                            {discount.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleAddExistingDiscount(discount)}
                          style={{ padding: '8px 15px', fontSize: '14px' }}
                        >
                          <i className="fas fa-plus"></i> Thêm
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #e0e0e0' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCloseDiscountModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Products Modal */}
      {isFeaturedModalOpen && (
        <div className="modal-overlay" onClick={handleCloseFeaturedModal}>
          <div
            className="modal-content product-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '820px' }}
          >
            <div className="modal-header">
              <h2>Danh mục Sản phẩm nổi bật</h2>
              <button className="modal-close" onClick={handleCloseFeaturedModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6b7280' }}>
                Dữ liệu đang dùng mock từ <code>home.json</code> (featuredProducts). Thao tác này chỉ thay đổi tạm thời trên UI.
              </div>

              {/* Current list */}
              <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {featuredProducts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '40px' }}></i>
                    <div>Chưa có sản phẩm nổi bật</div>
                  </div>
                ) : (
                  featuredProducts.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={item.icon} style={{ color: '#2563eb' }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.description}</div>
                          <div style={{ fontSize: '12px', color: '#2563eb', marginTop: 4 }}>
                            {item.price}{item.priceUnit ? ` / ${item.priceUnit}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => handleEditFeatured(item)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteFeatured(item.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitFeatured}>
                <div className="form-row">
                  <div className="form-column">
                    <div className="form-group">
                      <label className="form-label">Tiêu đề *</label>
                      <input
                        type="text"
                        value={featuredForm.title}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, title: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mô tả</label>
                      <input
                        type="text"
                        value={featuredForm.description}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, description: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Icon</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {FEATURED_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFeaturedForm({ ...featuredForm, icon })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: featuredForm.icon === icon ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            background: featuredForm.icon === icon ? '#eff6ff' : '#fff',
                            cursor: 'pointer',
                            minWidth: 120
                          }}
                        >
                          <i className={icon} style={{ color: '#2563eb' }}></i>
                          <span style={{ fontSize: 12 }}>{icon.replace('fas ', '').replace('fa-', '')}</span>
                        </button>
                      ))}
                    </div>
                
                    </div>
                  </div>

                  <div className="form-column">
                    <div className="form-group">
                      <label className="form-label">Giá *</label>
                      <input
                        type="text"
                        value={featuredForm.price}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, price: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Đơn vị giá</label>
                      <input
                        type="text"
                        value={featuredForm.priceUnit}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, priceUnit: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Liên kết</label>
                      <input
                        type="text"
                        value={featuredForm.link}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, link: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Tính năng nổi bật
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => setFeaturedForm((prev) => ({ ...prev, features: [...(prev.features || []), ''] }))}
                          style={{ marginLeft: 10, padding: '4px 10px', fontSize: 13 }}
                        >
                          <i className="fas fa-plus"></i> Thêm
                        </button>
                      </label>
                      {(featuredForm.features || []).length === 0 ? (
                        <p style={{ color: '#9ca3af', fontStyle: 'italic', marginBottom: 0 }}>Chưa có tính năng nào.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(featuredForm.features || []).map((feat, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="text"
                                value={feat}
                                onChange={(e) => {
                                  const next = [...(featuredForm.features || [])];
                                  next[idx] = e.target.value;
                                  setFeaturedForm({ ...featuredForm, features: next });
                                }}
                                className="form-input"
                                placeholder="Nhập nội dung tính năng"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                  const next = [...(featuredForm.features || [])];
                                  next.splice(idx, 1);
                                  setFeaturedForm({ ...featuredForm, features: next });
                                }}
                                title="Xóa"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseFeaturedModal}>
                    Hủy
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleOpenFeaturedPreview}>
                    Xem trước
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {featuredForm.id ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Featured Preview Modal */}
      {isFeaturedPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsFeaturedPreviewOpen(false)}>
          <div
            className="modal-content product-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: 0,paddingBottom:'10px' }}
          >
            <div className="modal-header">
              <h2>Preview</h2>
              <button className="modal-close" onClick={() => setIsFeaturedPreviewOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ padding: '16px 16px 20px 16px', background: '#f8fafc' }}>
              <div
                style={{
                  maxWidth: 270,
                  border: '1px solid rgb(0, 40, 119)',
                  borderRadius: 16,
                  padding: '18px 16px',
                  boxShadow: '10px 18px rgba(1, 28, 72, 0.83)',
                  paddingBottom:'10px',
                  background: '#fff',
                  margin: '0 auto'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <i className={featuredForm.icon || 'fas fa-cloud'} style={{ color: '#1d4ed8', fontSize: 22 }}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  {featuredForm.title}
                </div>
                <div style={{ color: '#4b5563', marginBottom: 12, minHeight: 40 }}>
                  {featuredForm.description}
                </div>
                <div
                  style={{
                    background: '#f1f5f9',
                    borderRadius: 12,
                    padding: '12px',
                    textAlign: 'center',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>GIÁ CHỈ TỪ:</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', lineHeight: 1.2 }}>
                    {featuredForm.price}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {featuredForm.priceUnit}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {(featuredForm.features || []).map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065f46', fontSize: 13 }}>
                      <i className="fas fa-check" style={{ color: '#16a34a' }}></i>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'not-allowed',
                  }}
                  disabled
                >
                  Chi tiết bảng giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
