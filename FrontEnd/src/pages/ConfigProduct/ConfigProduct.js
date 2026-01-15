import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  FormCheck,
  Spinner,
  Alert
} from 'react-bootstrap';
import hostingMockData from '../../mockData/hosting.json';
import { productService } from '../../services/productService';
import { addonService } from '../../services/addonService';
import { cartService } from '../../services/cartService';
import { osTemplateService } from '../../services/osTemplateService';
import { useCart } from '../../contexts/CartContext';
import { useNotify } from '../../contexts/NotificationContext';
import './ConfigProduct.css';

const ConfigProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchCart } = useCart();
  const { notifySuccess, notifyError } = useNotify();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCartItemId, setEditingCartItemId] = useState(null);

  const [paymentCycle, setPaymentCycle] = useState(12); // 1 năm mặc định
  const [discountCode, setDiscountCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState([]); // Addon catalog from API (/public/addons)
  const [osTemplates, setOsTemplates] = useState([]);
  const [enableExtraConfig, setEnableExtraConfig] = useState(false);
  const [extraConfigInputs, setExtraConfigInputs] = useState({
    cpu: '',
    ram: '',
    disk: '',
    ip: '',
  });
  const [extraConfigErrors, setExtraConfigErrors] = useState({
    cpu: '',
    ram: '',
    disk: '',
    ip: '',
  });
  const extraConfigCardRef = useRef(null);
  const [config, setConfig] = useState({
    cpu: 0,
    ram: 0,
    disk: 0,
    bandwidth: 0,
    ip: 0,
    control_panel: false,
    os_template_id: ''
  });

  const validateNumericText = (raw, max) => {
    if (raw === '') return ''; // allow empty while typing
    if (!/^\d+$/.test(raw)) return 'Chỉ được nhập số';
    const n = parseInt(raw, 10);
    if (typeof max === 'number' && n > max) return `Tối đa ${max}`;
    return '';
  };

  const setNumericFieldFromText = (field, raw, max) => {
    const err = validateNumericText(raw, max);
    setExtraConfigInputs(prev => ({ ...prev, [field]: raw }));
    setExtraConfigErrors(prev => ({ ...prev, [field]: err }));

    if (!err) {
      const n = raw === '' ? 0 : parseInt(raw, 10);
      setConfig(prev => ({ ...prev, [field]: n }));
    }
  };

  const normalizeNumericText = (field, max) => {
    const raw = extraConfigInputs[field];
    const err = validateNumericText(raw, max);
    if (!err) {
      const n = parseInt(raw, 10);
      // keep empty as empty; otherwise normalize leading zeros
      if (raw !== '') setExtraConfigInputs(prev => ({ ...prev, [field]: String(n) }));
    }
  };

  const clampNumber = (value, min, max, fallback) => {
    let v = parseInt(value);
    if (Number.isNaN(v)) v = fallback;
    if (typeof min === 'number') v = Math.max(min, v);
    if (typeof max === 'number') v = Math.min(max, v);
    return v;
  };

  const addonByType = useMemo(() => {
    const map = {};
    (addons || []).forEach(a => {
      if (a?.addon_type) map[a.addon_type] = a;
    });
    return map;
  }, [addons]);

  // Fetch OS templates from API
  useEffect(() => {
    const fetchOsTemplates = async () => {
      try {
        const response = await osTemplateService.listAdmin();
        const data = response.data;
        const templates = Array.isArray(data)
          ? data
          : Array.isArray(data?.templates)
            ? data.templates
            : Array.isArray(data?.data)
              ? data.data
              : [];

        // Show both active + inactive; inactive will be disabled in the select
        setOsTemplates(templates);

        // Set default OS template if available
        const firstActive = templates.find(t => t?.is_active) || templates[0];
        if (firstActive && !config.os_template_id) {
          setConfig(prev => ({
            ...prev,
            os_template_id: firstActive.template_id
          }));
        }
      } catch (err) {
        console.error('Failed to fetch OS templates:', err);
        // Continue without OS templates if fetch fails
      }
    };

    fetchOsTemplates();
  }, []);

  // Fetch addons from API
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await addonService.getPublicAddons();
        const addonsData = response.data?.addons || [];
        // Only show active addons
        setAddons(addonsData.filter(addon => addon.is_active && addon.addon_type !== 'BANDWIDTH'));
      } catch (err) {
        console.error('Failed to fetch addons:', err);
        // Continue without addons if fetch fails
      }
    };

    fetchAddons();
  }, []);

  // Clamp config values based on addon MAX when addon catalog is loaded/updated (ignore MIN)
  useEffect(() => {
    const cpuMax = addonByType?.CPU?.max_quantity;
    const ramMax = addonByType?.RAM?.max_quantity;
    const diskMax = addonByType?.DISK?.max_quantity;
    const ipMax = addonByType?.IP?.max_quantity;

    setConfig(prev => ({
      ...prev,
      cpu: clampNumber(prev.cpu, 0, cpuMax, 0),
      ram: clampNumber(prev.ram, 0, ramMax, 0),
      disk: clampNumber(prev.disk, 0, diskMax, 0),
      ip: clampNumber(prev.ip, 0, ipMax, 0),
    }));
  }, [addonByType]);

  // Check if editing cart item from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cartItemId = searchParams.get('cartItemId');
    if (cartItemId) {
      setEditingCartItemId(cartItemId);
    }
  }, [location.search]);

  // Fetch cart item details if editing
  useEffect(() => {
    const fetchCartItem = async () => {
      if (!editingCartItemId) return;

      try {
        const response = await cartService.getCartItemById(editingCartItemId);
        const cartItem = response.data;

        // Pre-fill form with cart item data
        if (cartItem.billing_cycle) setPaymentCycle(parseInt(cartItem.billing_cycle));
        if (cartItem.quantity) setQuantity(cartItem.quantity);
        if (cartItem.discountCode) setDiscountCode(cartItem.discountCode);

        // Pre-fill config
        if (cartItem.config) {
          const nextConfig = {
            cpu: cartItem.config.cpu ?? 0,
            ram: cartItem.config.ram ?? 0,
            disk: cartItem.config.disk ?? 0,
            bandwidth: cartItem.config.bandwidth ?? 0,
            ip: cartItem.config.ip ?? 0,
            control_panel: cartItem.config.control_panel || false,
            os_template_id: cartItem.config.os_template_id || ''
          };
          setConfig(nextConfig);
          setExtraConfigInputs({
            cpu: (nextConfig.cpu ?? 0) > 0 ? String(nextConfig.cpu) : '',
            ram: (nextConfig.ram ?? 0) > 0 ? String(nextConfig.ram) : '',
            disk: (nextConfig.disk ?? 0) > 0 ? String(nextConfig.disk) : '',
            ip: (nextConfig.ip ?? 0) > 0 ? String(nextConfig.ip) : '',
          });
          setExtraConfigErrors({
            cpu: '',
            ram: '',
            disk: '',
            ip: '',
          });

          // Auto-enable extra config section if cart item already has extra config
          const hasExtra =
            (nextConfig.cpu || 0) > 0 ||
            (nextConfig.ram || 0) > 0 ||
            (nextConfig.disk || 0) > 0 ||
            (nextConfig.ip || 0) > 0 ||
            !!nextConfig.control_panel;
          if (hasExtra) setEnableExtraConfig(true);
        }
      } catch (err) {
        console.error('Failed to fetch cart item:', err);
        notifyError('Không tải được thông tin sản phẩm trong giỏ hàng');
      }
    };

    if (editingCartItemId) {
      fetchCartItem();
    }
  }, [editingCartItemId, notifyError]);

  // Fetch product from API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Try public endpoint first (for users)
        const response = await productService.getByIdPublic(productId);
        const productData = response.data?.product || response.data;
        setProduct(productData);

        // Auto-apply discount code if product has discount
        if (productData?.discount?.code) {
          setDiscountCode(productData.discount.code);
        }
      } catch (err) {
        console.error('Failed to fetch product from public endpoint:', err);
        // Fallback to mock data
        const mockProduct = hostingMockData.products.find(p => p.id === parseInt(productId));
        if (mockProduct) {
          setProduct(mockProduct);
          // Auto-apply discount code if product has discount
          if (mockProduct?.discount?.code) {
            setDiscountCode(mockProduct.discount.code);
          }
        } else {
          setError('Không tìm thấy sản phẩm');
        }
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Tính giá theo chu kỳ thanh toán
  const calculatePrice = (cycle) => {
    if (!product) return 0;

    const monthlyPrice = product.monthlyPrice || product.price_monthly || 0;
    const yearlyPrice = product.yearlyPrice || product.price_annually || 0;

    if (cycle === 12) {
      // 1 năm - sử dụng yearlyPrice (đã tính sẵn)
      return yearlyPrice;
    } else if (cycle === 1 || cycle === 3 || cycle === 6) {
      // 1/3/6 tháng - tính theo monthlyPrice
      return monthlyPrice * cycle;
    }
    return 0;
  };

  // Tính giá theo tháng cho từng chu kỳ
  const getMonthlyPrice = (cycle) => {
    const totalPrice = calculatePrice(cycle);
    return Math.round(totalPrice / cycle);
  };

  // Tính tổng tiền
  const orderSummary = useMemo(() => {
    const baseProductPrice = calculatePrice(paymentCycle);

    const getAddonUnitPrice = (type, fallback) => {
      const addon = addonByType?.[type];
      return typeof addon?.price_per_unit === 'number' ? addon.price_per_unit : fallback;
    };

    // Addons are treated as price per unit per month -> multiply by paymentCycle
    const configBreakdown = [
      {
        key: 'cpu',
        label: addonByType?.CPU?.addon_name || 'Additional CPU Core',
        unit: addonByType?.CPU?.unit || 'Core',
        quantity: config.cpu,
        unitPrice: getAddonUnitPrice('CPU', 50000),
      },
      {
        key: 'ram',
        label: addonByType?.RAM?.addon_name || 'Additional RAM',
        unit: addonByType?.RAM?.unit || 'GB',
        quantity: config.ram,
        unitPrice: getAddonUnitPrice('RAM', 28000),
      },
      {
        key: 'disk',
        label: addonByType?.DISK?.addon_name || 'Additional SSD Storage',
        unit: addonByType?.DISK?.unit || 'GB',
        quantity: config.disk,
        unitPrice: getAddonUnitPrice('DISK', 18000),
      },
      {
        key: 'ip',
        label: addonByType?.IP?.addon_name || 'Additional IP Address',
        unit: addonByType?.IP?.unit || 'IP',
        quantity: config.ip,
        unitPrice: getAddonUnitPrice('IP', 35000),
      },
      ...(config.control_panel
        ? [
          {
            key: 'control_panel',
            label: addonByType?.CONTROL_PANEL?.addon_name || 'Control Panel',
            unit: addonByType?.CONTROL_PANEL?.unit || 'Panel',
            quantity: 1,
            unitPrice: getAddonUnitPrice('CONTROL_PANEL', 95000),
          },
        ]
        : []),
    ].map(line => ({
      ...line,
      total: (line.quantity || 0) * (line.unitPrice || 0) * paymentCycle,
    })).filter(line => (line.quantity || 0) > 0 && (line.total || 0) > 0);

    const configCost = configBreakdown.reduce((sum, line) => sum + (line.total || 0), 0);

    // Apply discount if available
    let discountPercent = 0;
    if (product?.discount?.code && discountCode === product.discount.code) {
      discountPercent = product.discount.discount_percent || 0;
    }

    // Discount only applies to base product price (not extra config)
    const productTotal = baseProductPrice * quantity;
    const configTotal = configCost * quantity;
    const discountAmount = (productTotal * discountPercent) / 100;
    const productTotalAfterDiscount = productTotal - discountAmount;

    const subtotal = productTotalAfterDiscount + configTotal;
    const total = subtotal;

    return {
      productPrice: baseProductPrice,
      configCost,
      configBreakdown,
      quantity,
      discountPercent,
      discountAmount,
      subtotal,
      total
    };
  }, [paymentCycle, config, product, quantity, discountCode, addonByType]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getCycleLabel = (cycle) => {
    if (cycle === 1) return '1 tháng';
    if (cycle === 3) return '3 tháng';
    if (cycle === 6) return '6 tháng';
    if (cycle === 12) return '1 năm';
    return `${cycle} tháng`;
  };

  // Get product features from spec.attributes or features
  const getProductFeatures = () => {
    if (!product) return {};
    if (product.spec?.attributes) {
      return product.spec.attributes;
    }
    return product.features || {};
  };

  const features = getProductFeatures();

  const cpuMax = addonByType?.CPU?.max_quantity;
  const ramMax = addonByType?.RAM?.max_quantity;
  const diskMax = addonByType?.DISK?.max_quantity;
  const ipMax = addonByType?.IP?.max_quantity;

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Đang tải thông tin sản phẩm...</p>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Sản phẩm không tồn tại</h4>
          <p>Vui lòng quay lại trang hosting để chọn sản phẩm.</p>
          <Button variant="primary" onClick={() => navigate('/hosting')}>
            Quay lại trang Hosting
          </Button>
        </Alert>
      </Container>
    );
  }

  // Lấy thông tin backup từ hostingLinesComparison
  const hostingLine = hostingMockData.hostingLinesComparison.lines[0]; // HOSTING GIÁ RẺ

  return (
    <div className="config-product-page">
      <Container className="py-5">
        {editingCartItemId && (
          <Alert variant="info" className="mb-4">
            <i className="fas fa-edit me-2"></i>
            Bạn đang chỉnh sửa sản phẩm trong giỏ hàng. Thay đổi của bạn sẽ được cập nhật.
          </Alert>
        )}
        <Row>
          {/* Cột trái - Cấu hình */}
          <Col lg={8}>
            {/* Phần Cấu hình */}
            <Card className="mb-4">
              <Card.Body>
                <h2 className="mb-3">Cấu hình</h2>
                <h4 className="text-muted mb-4">Web Hosting - {product.name}</h4>

                <Row className="g-3">
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Disk Space/Storage</div>
                      <div className="config-value">{features.storageGB || features.diskSpaceGB || features.ssd || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Domains</div>
                      <div className="config-value">{features.websites || features.addonDomains || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Subdomain</div>
                      <div className="config-value">Unlimited</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Email Accounts</div>
                      <div className="config-value">{features.emails || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">CPU</div>
                      <div className="config-value">{features.cpuCores ? `${features.cpuCores} cores` : features.cpu || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">RAM</div>
                      <div className="config-value">{features.ramGB ? `${features.ramGB} GB` : features.ram || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">I/O</div>
                      <div className="config-value">50 Mbps</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">MySQL CPU</div>
                      <div className="config-value">1.2 cores</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Inode</div>
                      <div className="config-value">Unlimited</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Data Transfer</div>
                      <div className="config-value">{features.dataTransfer || '-'}</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Minimum payments</div>
                      <div className="config-value">12 month(s)</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4}>
                    <div className="config-item">
                      <div className="config-label">Backup</div>
                      <div className="config-value">{hostingLine.backup}</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Chọn chu kỳ thanh toán */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-4">Chọn chu kỳ thanh toán</h3>
                <Form>
                  <div className="payment-cycle-options">
                    <FormCheck
                      type="radio"
                      id="cycle-1"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">1 tháng</span>
                          <span className="cycle-price">{formatPrice(calculatePrice(1))} VND</span>
                        </div>
                      }
                      checked={paymentCycle === 1}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(1);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-3"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">3 tháng</span>
                          <span className="cycle-price">{formatPrice(calculatePrice(3))} VND</span>
                        </div>
                      }
                      checked={paymentCycle === 3}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(3);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-6"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">6 tháng</span>
                          <span className="cycle-price">{formatPrice(calculatePrice(6))} VND</span>
                        </div>
                      }
                      checked={paymentCycle === 6}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(6);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-12"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">1 năm</span>
                          <span className="cycle-price">{formatPrice(calculatePrice(12))} VND</span>
                        </div>
                      }
                      checked={paymentCycle === 12}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(12);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Configuration Options */}
            <div ref={extraConfigCardRef}>
              <Card className="mb-4">
                <Card.Body>
                  <h3 className="mb-4">Tùy chọn cấu hình</h3>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Hệ điều hành *</Form.Label>
                        <Form.Select
                          value={config.os_template_id}
                          onChange={(e) => setConfig(prev => ({ ...prev, os_template_id: e.target.value }))}
                        >
                          <option value="">-- Chọn hệ điều hành --</option>
                          {osTemplates.map(template => (
                            <option
                              key={template.template_id}
                              value={template.template_id}
                              disabled={!template.is_active}
                            >
                              {(template.display_name || template.name) +
                                (template.is_active ? '' : ' (Không khả dụng)')}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <FormCheck
                        type="switch"
                        id="enable-extra-config"
                        label="Bổ sung cấu hình (CPU/RAM/Disk/IP/Control Panel)"
                        checked={enableExtraConfig}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEnableExtraConfig(checked);
                          if (!checked) {
                            setConfig(prev => ({
                              ...prev,
                              cpu: 0,
                              ram: 0,
                              disk: 0,
                              bandwidth: 0,
                              ip: 0,
                              control_panel: false,
                            }));
                            setExtraConfigInputs({
                              cpu: '',
                              ram: '',
                              disk: '',
                              ip: '',
                            });
                            setExtraConfigErrors({
                              cpu: '',
                              ram: '',
                              disk: '',
                              ip: '',
                            });
                            setTimeout(() => {
                              extraConfigCardRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }, 0);
                          }
                        }}
                      />
                    </Col>
                  </Row>

                  {enableExtraConfig && (
                    <Row className="g-3 mt-2">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>CPU (cores)</Form.Label>
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={extraConfigInputs.cpu}
                            isInvalid={!!extraConfigErrors.cpu}
                            onChange={(e) => setNumericFieldFromText('cpu', e.target.value, cpuMax)}
                            onBlur={() => normalizeNumericText('cpu', cpuMax)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {extraConfigErrors.cpu}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>RAM (GB)</Form.Label>
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={extraConfigInputs.ram}
                            isInvalid={!!extraConfigErrors.ram}
                            onChange={(e) => setNumericFieldFromText('ram', e.target.value, ramMax)}
                            onBlur={() => normalizeNumericText('ram', ramMax)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {extraConfigErrors.ram}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Disk (GB)</Form.Label>
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={extraConfigInputs.disk}
                            isInvalid={!!extraConfigErrors.disk}
                            onChange={(e) => setNumericFieldFromText('disk', e.target.value, diskMax)}
                            onBlur={() => normalizeNumericText('disk', diskMax)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {extraConfigErrors.disk}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>IP Address</Form.Label>
                          <Form.Control
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={extraConfigInputs.ip}
                            isInvalid={!!extraConfigErrors.ip}
                            onChange={(e) => setNumericFieldFromText('ip', e.target.value, ipMax)}
                            onBlur={() => normalizeNumericText('ip', ipMax)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {extraConfigErrors.ip}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </div>




          </Col>

          {/* Cột phải - Thông tin đơn hàng */}
          <Col lg={4}>
            <Card className="order-summary-card">
              <Card.Body>
                <h3 className="mb-4">Thông tin đơn hàng</h3>

                <div className="order-item mb-3">
                  <div className="order-item-name" style={{ fontWeight: '600' }}>Web Hosting - {product.name}</div>
                  <div className="order-item-price" style={{ fontWeight: '600' }}>{formatPrice(orderSummary.productPrice)} VND</div>
                </div>

                {orderSummary.configBreakdown?.length > 0 && (
                  <div className="order-item mb-3">
                    <div className="order-item-name" style={{ fontWeight: '600' }}>Cấu hình bổ sung</div>
                    <div className="mt-2 order-item-price" style={{ width: '100%' }}>
                      {orderSummary.configBreakdown.map(line => (
                        <div
                          key={line.key}
                          className="d-flex justify-content-between"
                          style={{ fontSize: '0.85rem', opacity: 0.95, width: '100%', gap: '12px' }}
                        >
                          <div style={{ flex: 1 }}>
                            <span>{line.label}</span>
                            <span className="ms-2">x{line.quantity}</span>
                            <span className="ms-1">{line.unit}</span>
                          </div>
                          <div style={{ fontWeight: '600', textAlign: 'right', minWidth: '140px' }}>
                            {formatPrice(line.total)} VND
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="order-item-name" style={{ fontWeight: '600' }}>Tổng</div>
                    <div className="order-item-price" style={{ fontWeight: '600' }}>{formatPrice(orderSummary.configCost)} VND</div>

                  </div>
                )}

                {orderSummary.discountPercent > 0 && (
                  <div className="order-item mb-3">
                    <div className="order-item-name" style={{ fontWeight: '600' }}>
                      Giảm giá ({orderSummary.discountPercent}%){' '}
                      {product?.discount?.code ? `- ${product.discount.code}` : ''}
                    </div>
                    <div className="order-item-price">- {formatPrice(orderSummary.discountAmount)} VND</div>
                  </div>
                )}

                {orderSummary.quantity > 1 && (
                  <div className="order-item mb-3">
                    <div className="order-item-name">Số lượng: x{orderSummary.quantity}</div>
                    <div className="order-item-price"></div>
                  </div>
                )}

                <div className="order-subtotal mb-3">
                  <div className="order-subtotal-label">Thành tiền</div>
                  <div className="order-subtotal-detail">
                    <div className="order-cycle-label">{getCycleLabel(paymentCycle)}</div>
                    <div className="order-cycle-price">{formatPrice(orderSummary.subtotal)} VND</div>
                  </div>
                </div>



                <div className="order-total">
                  <div className="order-total-label">Tổng </div>
                  <div className="order-total-price">{formatPrice(orderSummary.total)} VND</div>
                </div>



                <Button
                  variant="primary"
                  size="lg"
                  className="w-100 mt-4 continue-button"
                  onClick={async () => {
                    try {
                      // Validate config
                      if (!config.os_template_id) {
                        notifyError('Vui lòng chọn hệ điều hành');
                        return;
                      }

                      if (enableExtraConfig) {
                        const errors = {
                          cpu: validateNumericText(extraConfigInputs.cpu, cpuMax),
                          ram: validateNumericText(extraConfigInputs.ram, ramMax),
                          disk: validateNumericText(extraConfigInputs.disk, diskMax),
                          ip: validateNumericText(extraConfigInputs.ip, ipMax),
                        };
                        setExtraConfigErrors(prev => ({ ...prev, ...errors }));

                        const hasError = Object.values(errors).some(Boolean);
                        if (hasError) {
                          notifyError('Vui lòng nhập đúng kiểu số và không vượt quá giới hạn tối đa');
                          extraConfigCardRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                          return;
                        }
                      }

                      // Prepare cart item payload
                      const cartData = {
                        product_id: product.product_id || productId,
                        billing_cycle: paymentCycle.toString(),
                        quantity: quantity,
                        config: {
                          cpu: config.cpu,
                          ram: config.ram,
                          disk: config.disk,
                          bandwidth: config.bandwidth,
                          ip: config.ip,
                          control_panel: config.control_panel,
                          os_template_id: config.os_template_id
                        }
                      };

                      if (editingCartItemId) {
                        // Update existing cart item
                        console.log(cartData);
                        await cartService.updateItem(editingCartItemId, cartData);
                        notifySuccess('Đã cập nhật sản phẩm trong giỏ hàng!');
                      } else {
                        // Add new item to cart
                        await cartService.addItem(cartData);
                        notifySuccess(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
                      }

                      // Refresh cart context
                      await fetchCart();

                      navigate('/cart');
                    } catch (error) {
                      console.error('Failed to add/update cart:', error);
                      const errorMessage = error?.response?.data?.message || error?.message ||
                        (editingCartItemId ? 'Cập nhật sản phẩm thất bại' : 'Thêm sản phẩm vào giỏ hàng thất bại');
                      notifyError(errorMessage);
                    }
                  }}
                >
                  <i className={`fas fa-${editingCartItemId ? 'check' : 'shopping-cart'} me-2`}></i>
                  {editingCartItemId ? 'Cập nhật giỏ hàng' : 'Thêm vào giỏ hàng'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ConfigProduct;

