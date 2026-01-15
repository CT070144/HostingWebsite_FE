import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Accordion,
  Badge,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import hostingMockData from '../../mockData/hosting.json';
import { hostingBannerService } from '../../services/bannerService';
import { productService } from '../../services/productService';
import { baseUrl } from '../../utils/api';
import './Hosting.css';
import hostingImage from '../../assets/hosting.png';
import { useLocation } from 'react-router-dom';

const Hosting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [banner, setBanner] = useState(null);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const productsSectionRef = useRef(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoadingBanner(true);
        const res = await hostingBannerService.list();
        const bannersData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        if (bannersData.length > 0) {
          // Sort by created_at (newest first) or by id (largest first) to get the newest banner
          const sortedBanners = [...bannersData].sort((a, b) => {
            // If created_at exists, sort by it (newest first)
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at);
            }
            // Otherwise sort by id (assuming larger id = newer)
            const aId = typeof a.id === 'string' ? parseInt(a.id) || 0 : a.id || 0;
            const bId = typeof b.id === 'string' ? parseInt(b.id) || 0 : b.id || 0;
            return bId - aId;
          });
          
          // Get the newest banner (first in sorted array)
          const newestBanner = sortedBanners[0];
          
          setBanner({
            ...newestBanner,
            image: newestBanner.image 
              ? (newestBanner.image_type === 'URL' || newestBanner.image_type === 'url'
                ? newestBanner.image 
                : `${baseUrl}${newestBanner.image}`)
              : hostingImage,
            features: Array.isArray(newestBanner.features) ? newestBanner.features : [],
            promotions: Array.isArray(newestBanner.promotions) ? newestBanner.promotions : [],
            priceUnit: newestBanner.price_unit || newestBanner.priceUnit,
          });
        } else {
          // No banners from API, fallback to mock data
          setBanner({
            ...hostingMockData.banner,
            image: hostingImage,
          });
        }
      } catch (err) {
        console.error('Failed to fetch hosting banner:', err);
        // Fallback to mock data on error
        setBanner({
          ...hostingMockData.banner,
          image: hostingImage,
        });
      } finally {
        setLoadingBanner(false);
      }
    };
    
    fetchBanner();
    
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await productService.listPublic(); // Get all products
        
        // Handle response format: { products: [...] } or direct array
        let productsData = [];
        if (res.data?.products && Array.isArray(res.data.products)) {
          productsData = res.data.products;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (Array.isArray(res.data?.data)) {
          productsData = res.data.data;
        }
        
        // Normalize products data according to new API format
        const normalizedProducts = productsData.map((p) => ({
          id: p.id,
          name: p.name || '',
          service_type: p.service_type || '',
          monthlyPrice: p.monthlyPrice ?? p.price_monthly ?? 0,
          yearlyPrice: p.yearlyPrice ?? p.price_annually ?? 0,
          hot: p.hot ?? p.is_hot ?? false,
          is_active: p.is_active ?? true,
          discount: p.discount || null, // discount is now an object, not array
          spec: p.spec || null, // spec object with attributes
          // Map spec.attributes to features for backward compatibility
          features: p.spec?.attributes && typeof p.spec.attributes === 'object' ? p.spec.attributes : {},
        }));
        
        setProducts(normalizedProducts);
      } catch (err) {
        console.error('Failed to fetch products from API:', err);
        // Fallback to mock data on error
        setProducts(hostingMockData.products || []);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Scroll to products section if hash is #products
  useEffect(() => {
    if (location.hash === '#products' && productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const handleOrder = (productId) => {
    // Navigate to config product page with productId
    navigate(`/config-product/${productId}`);
  };

  // Use banner from API or fallback to mock
  const displayBanner = banner || {
    ...hostingMockData.banner,
    image: hostingImage,
  };

  return (
    <div className="hosting-page">
      {/* Banner Section */}
      <section className="hosting-banner-section">
        <Container>
          <Row>
            <Col lg={7}>
              {loadingBanner ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="banner-content">
                  {displayBanner.title && (
                    <h1 className="banner-title">{displayBanner.title}</h1>
                  )}
                  {displayBanner.subtitle && (
                    <h2 className="banner-subtitle">{displayBanner.subtitle}</h2>
                  )}
                  {displayBanner.description && (
                    <p className="banner-description">{displayBanner.description}</p>
                  )}
                  
                  {displayBanner.features && displayBanner.features.length > 0 && (
                    <div className="banner-features">
                      {displayBanner.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <i className="fas fa-check text-success me-2"></i>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(displayBanner.price || displayBanner.priceUnit) && (
                    <div className="banner-price">
                      {displayBanner.price && (
                        <>
                          <span className="price-label">CHỈ TỪ</span>
                          <span className="price-value">{displayBanner.price}</span>
                        </>
                      )}
                      {displayBanner.priceUnit && (
                        <span className="price-unit">{displayBanner.priceUnit}</span>
                      )}
                    </div>
                  )}

                  {displayBanner.promotions && displayBanner.promotions.length > 0 && (
                    <div className="banner-promotions">
                      {displayBanner.promotions.map((promo, index) => (
                        <p key={index} className="promo-text">{promo}</p>
                      ))}
                    </div>
                  )}

                  <div className="banner-buttons">
                    <Button as={Link} to="/pricing" variant="primary" size="lg" className="btn-primary-custom me-3">
                      XEM BẢNG GIÁ
                    </Button>
                    <Button as={Link} to="/contact" variant="warning" size="lg">
                      LIÊN HỆ TƯ VẤN NGAY
                    </Button>
                  </div>
                </div>
              )}
            </Col>
            <Col lg={5}>
              <div className="banner-image">
                <img className="img-fluid" src={displayBanner.image || hostingImage} alt="Hosting" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Products Section */}
      <section
        className="hosting-products-section py-5"
        id="hosting-products-section"
        ref={productsSectionRef}
      >
        <Container>
          <div className="text-center mb-5">
            <h2 className="section-title">BẢNG GIÁ THUÊ HOSTING GIÁ RẺ</h2>
          </div>
          {loadingProducts ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <p>Không có sản phẩm nào.</p>
            </div>
          ) : (
            <Row className="g-4">
            {products.map((product) => (
              <Col xs={12} sm={6} lg={4} xl={3} key={product.id}>
                <Card className={`product-card h-100 ${product.hot ? 'hot-product' : ''}`}>
                  {product.hot && (
                    <div className="hot-badge">HOT</div>
                  )}
                  <Card.Body className="d-flex flex-column p-4">
                    <Card.Title className="text-center mb-3">
                      <h4 className="product-name" style={{ fontSize: '1.4rem' }}>{product.name}</h4>
                    </Card.Title>
                    <div className="product-price text-center mb-3">
                      <div className="monthly-price">
                        <span className="price-value">{formatPrice(product.monthlyPrice)}</span>
                        <span className="price-unit">vnđ/tháng</span>
                      </div>
                      <div className="yearly-price">
                        <small>36 tháng = {formatPrice(product.yearlyPrice)}</small>
                      </div>
                    </div>

                    <div className="discount-codes mb-3">
                      {product.discount && product.discount.code && (
                        <div className="discount-code">
                          <small>
                            Nhập Mã <strong>{product.discount.code}</strong>
                            {product.discount.discount_percent && (
                              <span className="ms-1">-{product.discount.discount_percent}%</span>
                            )}
                            {product.discount.description && (
                              <span className="ms-1">({product.discount.description})</span>
                            )}
                            {product.discount.max_cycle && (
                              <span className="ms-1">- Tối đa {product.discount.max_cycle} tháng</span>
                            )}
                          </small>
                        </div>
                      )}
                    </div>

                    <ListGroup variant="flush" className="product-features mb-auto">
                      {/* Display features from spec.attributes dynamically */}
                      {product.spec?.attributes && typeof product.spec.attributes === 'object' && Object.keys(product.spec.attributes).length > 0 ? (
                        Object.entries(product.spec.attributes).map(([key, value]) => {
                          // Format key labels
                          const formatLabel = (k) => {
                            const labelMap = {
                              cpuCores: 'CPU Cores',
                              ramGB: 'RAM',
                              storageGB: 'Storage',
                              bandwidthTB: 'Băng thông',
                              storagePoolType: 'Loại ổ cứng',
                              addonDomains: 'Addon Domains',
                              controlPanel: 'Control Panel',
                              databaseLimit: 'Database Limit',
                              diskSpaceGB: 'Disk Space',
                              websites: 'Website',
                              emails: 'Tài Khoản Emails',
                              ssl: 'SSL, Backup',
                              themesPlugins: 'Themes & Plugins',
                            };
                            return labelMap[k] || k;
                          };
                          
                          return value !== null && value !== undefined && value !== '' ? (
                            <ListGroupItem key={key}>
                              <i className="fas fa-check text-success me-2"></i>
                              {formatLabel(key)}: <strong>{value}</strong>
                              {product.hot && key === 'storageGB' && <i className="fas fa-fire text-danger ms-2"></i>}
                            </ListGroupItem>
                          ) : null;
                        })
                      ) : (
                        // Fallback to old features format for backward compatibility
                        <>
                          {product.features.ssd && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              SSD: <strong>{product.features.ssd}</strong>
                              {product.hot && <i className="fas fa-fire text-danger ms-2"></i>}
                            </ListGroupItem>
                          )}
                          {product.features.ram && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              RAM: <strong>{product.features.ram}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.cpu && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              CPU: <strong>{product.features.cpu}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.websites !== undefined && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              Website: <strong>{product.features.websites}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.emails !== undefined && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              Tài Khoản Emails: <strong>{product.features.emails}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.bandwidth && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              Băng thông, MySQL: <strong>{product.features.bandwidth}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.ssl && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              SSL, Backup, Chuyển dữ liệu: <strong>{product.features.ssl}</strong>
                            </ListGroupItem>
                          )}
                          {product.features.themesPlugins && (
                            <ListGroupItem>
                              <i className="fas fa-check text-success me-2"></i>
                              Kho Themes & Plugins mới nhất: <strong>{product.features.themesPlugins}</strong>
                            </ListGroupItem>
                          )}
                        </>
                      )}
                    </ListGroup>

                    <div className="product-actions mt-auto pt-3">
                      <Button 
                        variant="primary" 
                        className="btn-primary-custom w-100 mb-2"
                        onClick={() => handleOrder(product.id)}
                      >
                        ĐẶT HÀNG
                      </Button>
                      <Button variant="outline-secondary" size="sm" className="w-100">
                        Xem thêm <i className="fas fa-chevron-down ms-1"></i>
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          )}
        </Container>
      </section>

      {/* Notes Section */}
      <section className="hosting-notes-section py-4">
        <Container>
          <h3 className="notes-title mb-3">GHI CHÚ</h3>
          <ul className="notes-list">
            {hostingMockData.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Upgrade Options Section */}
      <section className="hosting-upgrade-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">
            TUỲ CHỌN NÂNG CẤP GÓI HOSTING GIÁ RẺ
          </h2>
          <Row>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h4 className="mb-0">DỊCH VỤ BỔ SUNG</h4>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Điều kiện áp dụng</th>
                        <th>Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostingMockData.upgradeOptions.additionalServices.map((service) => (
                        <tr key={service.id}>
                          <td><strong>{service.service}</strong></td>
                          <td>{service.condition}</td>
                          <td>{service.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h4 className="mb-0">GIỚI HẠN KHÁC ÁP DỤNG CHUNG CHO CÁC GÓI DỊCH VỤ</h4>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Giới hạn</th>
                        <th>Đơn vị</th>
                        <th>Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hostingMockData.upgradeOptions.commonLimits.map((limit) => (
                        <tr key={limit.id}>
                          <td><strong>{limit.limit}</strong></td>
                          <td>{limit.unit}</td>
                          <td>{limit.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Voucher Section */}
      <section className="hosting-voucher-section py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={3} className="text-center mb-4 mb-md-0">
              <div className="voucher-icon">
                <i className="fas fa-gift fa-5x"></i>
              </div>
            </Col>
            <Col md={9}>
              <h2 className="voucher-title">{hostingMockData.voucher.title}</h2>
              <p className="voucher-description">{hostingMockData.voucher.description}</p>
              <div className="voucher-items">
                {hostingMockData.voucher.items.map((item, index) => (
                  <Badge key={index} bg="light" text="dark" className="me-2 mb-2">
                    {item}
                  </Badge>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Comparison Table Section */}
      <section className="hosting-comparison-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">
            {hostingMockData.comparisonTable.title}
          </h2>
          {products.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Chưa có sản phẩm để so sánh</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover className="comparison-table">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: '#e3f2fd', minWidth: '200px' }}>Gói Dịch Vụ</th>
                    {products.map((product) => (
                      <th key={product.id} className={product.hot ? 'hot-column' : ''} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div>
                          <strong>{product.name}</strong>
                          {product.hot && <Badge bg="danger" className="ms-2">HOT</Badge>}
                        </div>
                        {product.discount && product.discount.code && (
                          <div className="mt-2">
                            <Badge bg="success" className="small">
                              Mã: {product.discount.code} (-{product.discount.discount_percent}%)
                            </Badge>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price Row */}
                  <tr>
                    <td style={{ backgroundColor: '#f5f5f5' }}><strong>Giá</strong></td>
                    {products.map((product) => (
                      <td key={product.id} style={{ textAlign: 'center' }}>
                        <div>
                          <strong className="text-primary">{formatPrice(product.monthlyPrice)}</strong> vnđ/tháng
                        </div>
                        {product.yearlyPrice > 0 && (
                          <div className="text-muted small mt-1">
                            {formatPrice(product.yearlyPrice)} vnđ/năm
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Service Type Row */}
                  <tr>
                    <td style={{ backgroundColor: '#f5f5f5' }}><strong>Loại dịch vụ</strong></td>
                    {products.map((product) => (
                      <td key={product.id} style={{ textAlign: 'center' }}>
                        {product.service_type || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Spec Name Row */}
                  {products.some(p => p.spec?.spec_name) && (
                    <tr>
                      <td style={{ backgroundColor: '#f5f5f5' }}><strong>Tên gói</strong></td>
                      {products.map((product) => (
                        <td key={product.id} style={{ textAlign: 'center' }}>
                          {product.spec?.spec_name || '-'}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Location Row */}
                  {products.some(p => p.spec?.location) && (
                    <tr>
                      <td style={{ backgroundColor: '#f5f5f5' }}><strong>Vị trí</strong></td>
                      {products.map((product) => (
                        <td key={product.id} style={{ textAlign: 'center' }}>
                          {product.spec?.location || '-'}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Dynamic Attributes Rows */}
                  {(() => {
                    // Collect all unique attribute keys from all products
                    const allAttributeKeys = new Set();
                    products.forEach(product => {
                      if (product.spec?.attributes && typeof product.spec.attributes === 'object') {
                        Object.keys(product.spec.attributes).forEach(key => {
                          allAttributeKeys.add(key);
                        });
                      }
                      // Also check old features format for backward compatibility
                      if (product.features && typeof product.features === 'object') {
                        Object.keys(product.features).forEach(key => {
                          allAttributeKeys.add(key);
                        });
                      }
                    });

                    // Map keys to their normalized label names (for grouping)
                    const keyToLabelMap = {
                      'CPU Cores': 'CPU Cores',
                      cpu: 'CPU Cores',
                      'RAM': 'RAM',
                      'RAM ': 'RAM',
                      storageGB: 'Storage',
                      diskSpaceGB: 'Storage',
                      ssd: 'Storage',
                      bandwidthTB: 'Băng thông',
                      bandwidth: 'Băng thông',
                      'Storagepooltype': 'Loại ổ cứng',
                      'StoragePoolType': 'Loại ổ cứng',
                      addonDomains: 'Addon Domains',
                      controlPanel: 'Control Panel',
                      databaseLimit: 'Database Limit',
                      websites: 'Website',
                      emails: 'Tài Khoản Emails',
                      ssl: 'SSL, Backup',
                      themesPlugins: 'Themes & Plugins',
                      resourceIdentifier: 'Resource Identifier',
                      unitOfMeasure: 'Đơn vị đo',
                      unitPrice: 'Giá đơn vị',
                    };

                    // Format attribute label (fallback for keys not in map)
                    const formatAttributeLabel = (key) => {
                      const normalizedLabel = keyToLabelMap[key];
                      if (normalizedLabel) return normalizedLabel;
                      
                      // For keys not in map, format properly without splitting single letters
                      // Convert camelCase to Title Case, but keep acronyms together
                      const formatted = key
                        .replace(/([A-Z])/g, ' $1') // Add space before uppercase
                        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                        .trim();
                      
                      // Don't split if it results in single letters separated
                      return key;
                    };

                    // Get normalized label for a key
                    const getNormalizedLabel = (key) => {
                      return keyToLabelMap[key] || formatAttributeLabel(key);
                    };

                    // Group keys by their normalized label
                    const labelGroups = {};
                    allAttributeKeys.forEach(key => {
                      const label = getNormalizedLabel(key);
                      if (!labelGroups[label]) {
                        labelGroups[label] = [];
                      }
                      labelGroups[label].push(key);
                    });

                    // Format attribute value based on key
                    const formatAttributeValue = (keys, product) => {
                      // Try each key in the group to find a value
                      let value = null;
                      let usedKey = null;
                      
                      for (const key of keys) {
                        const val = product.spec?.attributes?.[key] ?? product.features?.[key];
                        if (val !== null && val !== undefined && val !== '') {
                          value = val;
                          usedKey = key;
                          break;
                        }
                      }
                      
                      if (value === null || value === undefined || value === '') return '-';
                      
                      // Format based on the key that was used
                      if (usedKey === 'ramGB' || usedKey === 'storageGB' || usedKey === 'diskSpaceGB' || usedKey === 'ssd') {
                        return `${value} GB`;
                      }
                      if (usedKey === 'bandwidthTB' || usedKey === 'bandwidth') {
                        // Check if already has unit
                        const str = String(value);
                        if (str.includes('TB') || str.includes('GB') || str.includes('MySQL')) {
                          return str;
                        }
                        return `${value} TB`;
                      }
                      if (usedKey === 'cpuCores') {
                        return `${value} cores`;
                      }
                      if (usedKey === 'cpu') {
                        // If value is a number, add "cores"
                        if (typeof value === 'number' || !isNaN(Number(value))) {
                          return `${value} cores`;
                        }
                        return String(value);
                      }
                      if (usedKey === 'ramGB' || usedKey === 'ram') {
                        // If value is a number, add "GB"
                        if (typeof value === 'number' || !isNaN(Number(value))) {
                          return `${value} GB`;
                        }
                        return String(value);
                      }
                      if (usedKey === 'unitPrice') {
                        return formatPrice(value);
                      }
                      
                      return String(value);
                    };

                    // Convert grouped labels to array and sort
                    const sortedLabels = Object.keys(labelGroups).sort();

                    return sortedLabels.map(label => {
                      const keys = labelGroups[label];
                      return (
                        <tr key={label}>
                          <td style={{ backgroundColor: '#f5f5f5' }}>
                            <strong>{label}</strong>
                          </td>
                          {products.map((product) => {
                            const value = formatAttributeValue(keys, product);
                            return (
                              <td key={product.id} style={{ textAlign: 'center' }}>
                                {value}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}

                  {/* Order Button Row */}
                  <tr>
                    <td style={{ backgroundColor: '#f5f5f5', border: 'none' }}></td>
                    {products.map((product) => (
                      <td key={product.id} style={{ textAlign: 'center', padding: '20px', border: 'none' }}>
                        <Button
                          variant="primary"
                          className="btn-primary-custom"
                          onClick={() => handleOrder(product.id)}
                          style={{ width: '100%', maxWidth: '200px' }}
                        >
                          ĐẶT HÀNG
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Container>
      </section>

      {/* Hosting Lines Comparison Section */}
      <section className="hosting-lines-comparison-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">
            {hostingMockData.hostingLinesComparison.title}
          </h2>
          <div className="table-responsive">
            <Table striped bordered hover className="comparison-table">
              <thead>
                <tr>
                  <th>Gói Dịch Vụ</th>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <th key={line.id}>{line.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Mục đích sử dụng</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.purpose}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Ổ cứng</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.hardDrive}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Backup tự động</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.backup}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Hosting chống DDoS</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.antiDDoS}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Công nghệ VSecure</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.vSecure}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>CPU</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.cpu}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>DISK I/O</strong></td>
                  {hostingMockData.hostingLinesComparison.lines.map((line) => (
                    <td key={line.id}>{line.diskIO}</td>
                  ))}
                </tr>
              </tbody>
            </Table>
          </div>
        </Container>
      </section>

      {/* Outstanding Features Section */}
      <section className="hosting-features-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">
            TÍNH NĂNG NỔI BẬT CỦA HOSTING GIÁ RẺ
          </h2>
          <Row>
            {hostingMockData.outstandingFeatures.map((feature) => (
              <Col md={6} lg={4} key={feature.id} className="mb-4">
                <Card className="feature-card h-100">
                  <Card.Body className="text-center p-4">
                    <div className="feature-icon mb-3">
                      <i className={`${feature.icon} fa-3x`}></i>
                    </div>
                    <Card.Title className="h5 mb-3">{feature.title}</Card.Title>
                    <Card.Text>{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="hosting-faq-section py-5">
        <Container>
          <Row>
            <Col lg={8}>
              <div className="text-center mb-4">
                <Badge bg="warning" className="mb-2">FAQ</Badge>
                <h2 className="section-title">Câu hỏi thường gặp về hosting giá rẻ</h2>
              </div>
              <Accordion defaultActiveKey="0" className="faq-accordion">
                {hostingMockData.faqs.map((faq, index) => (
                  <Accordion.Item eventKey={index.toString()} key={faq.id}>
                    <Accordion.Header>{faq.question}</Accordion.Header>
                    <Accordion.Body>{faq.answer}</Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
              <div className="text-center mt-4">
                <Button variant="outline-primary" className="btn-primary-custom">
                  Xem thêm FAQs <i className="fas fa-chevron-down ms-2"></i>
                </Button>
              </div>
            </Col>
            <Col lg={4}>
              <Card className="faq-contact-card">
                <Card.Body className="text-center p-5">
                  <div className="faq-illustration mb-4">
                    <i className="fas fa-question-circle fa-5x"></i>
                  </div>
                  <h3 className="mb-3">Bạn có câu hỏi khác?</h3>
                  <p className="mb-4">
                    Liên hệ TTCS Hosting ngay để được hỗ trợ miễn phí nhé!
                  </p>
                  <Button 
                    as={Link} 
                    to="/contact" 
                    variant="primary"
                    size="lg"
                    className="btn-primary-custom w-100"
                  >
                    Liên hệ ngay
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Hosting;

