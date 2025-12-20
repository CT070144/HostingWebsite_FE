import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useCart } from '../../contexts/CartContext';
import { useNotify } from '../../contexts/NotificationContext';
import './ConfigProduct.css';

const ConfigProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { notifySuccess, notifyError } = useNotify();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentCycle, setPaymentCycle] = useState(36); // 3 năm mặc định
  const [dedicatedIP, setDedicatedIP] = useState(false);
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState([]); // Available addons from API
  const [selectedAddons, setSelectedAddons] = useState({}); // { addon_id: { addon, quantity } }

  // Giá Dedicated IP
  const DEDICATED_IP_PRICE = 100000;

  // Fetch addons from API
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await addonService.getAddons();
        const addonsData = response.data?.addons || [];
        // Only show active addons
        setAddons(addonsData.filter(addon => addon.is_active));
      } catch (err) {
        console.error('Failed to fetch addons:', err);
        // Continue without addons if fetch fails
      }
    };

    fetchAddons();
  }, []);

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

  // Handle addon selection
  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const newSelected = { ...prev };
      if (newSelected[addon.addon_id]) {
        // Remove addon
        delete newSelected[addon.addon_id];
      } else {
        // Add addon with minimum quantity
        newSelected[addon.addon_id] = {
          addon: addon,
          quantity: addon.min_quantity || 1,
        };
      }
      return newSelected;
    });
  };

  // Handle addon quantity change
  const handleAddonQuantityChange = (addonId, newQuantity) => {
    const addon = selectedAddons[addonId]?.addon;
    if (!addon) return;

    let quantity = parseInt(newQuantity) || addon.min_quantity || 1;
    
    // Validate min/max quantity
    if (addon.min_quantity && quantity < addon.min_quantity) {
      quantity = addon.min_quantity;
    }
    if (addon.max_quantity && quantity > addon.max_quantity) {
      quantity = addon.max_quantity;
    }

    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        quantity: quantity,
      },
    }));
  };

  // Tính giá theo chu kỳ thanh toán
  const calculatePrice = (cycle) => {
    if (!product) return 0;
    
    const monthlyPrice = product.monthlyPrice || product.price_monthly || 0;
    const yearlyPrice = product.yearlyPrice || product.price_annually || 0;
    
    if (cycle === 12) {
      // 1 năm
      return monthlyPrice * 12;
    } else if (cycle === 24) {
      // 2 năm - giảm 10%
      return Math.round(monthlyPrice * 24 * 0.9);
    } else if (cycle === 36) {
      // 3 năm - sử dụng yearlyPrice (đã tính sẵn)
      return yearlyPrice;
    }
    return monthlyPrice * cycle;
  };

  // Tính giá theo tháng cho từng chu kỳ
  const getMonthlyPrice = (cycle) => {
    const totalPrice = calculatePrice(cycle);
    return Math.round(totalPrice / cycle);
  };

  // Tính tổng tiền
  const orderSummary = useMemo(() => {
    const baseProductPrice = calculatePrice(paymentCycle);
    const dedicatedIPPrice = dedicatedIP ? DEDICATED_IP_PRICE : 0;
    
    // Apply discount if available
    let discountPercent = 0;
    if (product?.discount?.code && discountCode === product.discount.code) {
      discountPercent = product.discount.discount_percent || 0;
    }
    
    const productPriceBeforeDiscount = (baseProductPrice + dedicatedIPPrice) * quantity;
    const discountAmount = (productPriceBeforeDiscount * discountPercent) / 100;
    const productPriceAfterDiscount = productPriceBeforeDiscount - discountAmount;
    
    const subtotal = productPriceAfterDiscount;
    const vat = Math.round(subtotal * 0.1);
    const setupFee = 0;
    const total = subtotal + vat + setupFee;

    return {
      productPrice: baseProductPrice,
      dedicatedIPPrice,
      quantity,
      discountPercent,
      discountAmount,
      subtotal,
      vat,
      setupFee,
      total
    };
  }, [paymentCycle, dedicatedIP, product, quantity, discountCode]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getCycleLabel = (cycle) => {
    if (cycle === 12) return '1 năm';
    if (cycle === 24) return '2 năm';
    if (cycle === 36) return '3 năm';
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
                      id="cycle-12"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">1 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(12))} VND/tháng</span>
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
                    <FormCheck
                      type="radio"
                      id="cycle-24"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">2 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(24))} VND/tháng</span>
                        </div>
                      }
                      checked={paymentCycle === 24}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(24);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                    <FormCheck
                      type="radio"
                      id="cycle-36"
                      name="paymentCycle"
                      label={
                        <div className="payment-cycle-item">
                          <span className="cycle-label">3 năm</span>
                          <span className="cycle-price">{formatPrice(getMonthlyPrice(36))} VND/tháng</span>
                        </div>
                      }
                      checked={paymentCycle === 36}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPaymentCycle(36);
                        }
                      }}
                      className="payment-cycle-radio"
                    />
                  </div>
                </Form>
              </Card.Body>
            </Card>

            

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card className="mb-4">
                <Card.Body>
                  <h3 className="mb-3">Add-ons (Tùy chọn bổ sung)</h3>
                  <div className="addons-list">
                    {addons.map((addon) => {
                      const isSelected = !!selectedAddons[addon.addon_id];
                      const selectedData = selectedAddons[addon.addon_id];
                      
                      return (
                        <div key={addon.addon_id} className="addon-item mb-3 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <FormCheck
                                type="checkbox"
                                id={`addon-${addon.addon_id}`}
                                label={
                                  <div>
                                    <strong>{addon.addon_name}</strong>
                                    <div className="text-muted small">
                                      {formatPrice(addon.price_per_unit)} VND/{addon.unit}
                                      {addon.min_quantity && addon.max_quantity && (
                                        <span> (Tối thiểu: {addon.min_quantity}, Tối đa: {addon.max_quantity})</span>
                                      )}
                                      {addon.min_quantity && !addon.max_quantity && (
                                        <span> (Tối thiểu: {addon.min_quantity})</span>
                                      )}
                                    </div>
                                  </div>
                                }
                                checked={isSelected}
                                onChange={() => handleAddonToggle(addon)}
                              />
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-2 ms-4">
                              <Row className="align-items-center">
                                <Col xs="auto">
                                  <Form.Label className="mb-0">Số lượng:</Form.Label>
                                </Col>
                                <Col xs="auto">
                                  <Form.Control
                                    type="number"
                                    min={addon.min_quantity || 1}
                                    max={addon.max_quantity || undefined}
                                    value={selectedData.quantity}
                                    onChange={(e) => handleAddonQuantityChange(addon.addon_id, e.target.value)}
                                    style={{ width: '100px' }}
                                  />
                                </Col>
                                <Col xs="auto">
                                  <span className="text-muted">{addon.unit}</span>
                                </Col>
                                <Col xs="auto">
                                  <span className="text-primary fw-bold">
                                    = {formatPrice((selectedData.quantity || 1) * addon.price_per_unit)} VND
                                  </span>
                                </Col>
                              </Row>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Thông tin cần bổ sung */}
            <Card className="mb-4">
              <Card.Body>
                <h3 className="mb-3">Thông tin cần bổ sung</h3>
                <p className="text-muted small mb-3">(required fields are marked with *)</p>
                <Form.Group className="mb-3">
                  <Form.Label>Notes (Ghi Chú)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú của bạn..."
                  />
                </Form.Group>
                <div className="alert alert-info">
                  <small>
                    Dịch vụ sẽ được kích hoạt tự động theo cấu hình bạn chọn. Nếu bạn có yêu cầu đặc biệt (hệ điều hành khác, Range IP...), vui lòng điền thông tin vào ô Notes (Ghi Chú) bên trên để được hỗ trợ cài đặt.
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Cột phải - Thông tin đơn hàng */}
          <Col lg={4}>
            <Card className="order-summary-card">
              <Card.Body>
                <h3 className="mb-4">Thông tin đơn hàng</h3>
                
                <div className="order-item mb-3">
                  <div className="order-item-name">Web Hosting - {product.name}</div>
                  <div className="order-item-price">{formatPrice(orderSummary.productPrice)} VND</div>
                </div>

                <div className="order-subtotal mb-3">
                  <div className="order-subtotal-label">Thành tiền</div>
                  <div className="order-subtotal-detail">
                    <div className="order-cycle-label">{getCycleLabel(paymentCycle)}</div>
                    <div className="order-cycle-price">{formatPrice(orderSummary.subtotal)} VND</div>
                  </div>
                </div>

                <div className="order-item mb-3">
                  <div className="order-item-name">VAT @ 10.00%</div>
                  <div className="order-item-price">{formatPrice(orderSummary.vat)} VND</div>
                </div>

                <div className="order-item mb-3">
                  <div className="order-item-name">Phí cài đặt</div>
                  <div className="order-item-price">{formatPrice(orderSummary.setupFee)} VND</div>
                </div>

                <hr className="my-4" />

                <div className="order-total">
                  <div className="order-total-label">Tổng Thành tiền</div>
                  <div className="order-total-price">{formatPrice(orderSummary.total)} VND</div>
                </div>

                {/* Quantity Input */}
              

                {/* Discount Code Input */}
                {product.discount && (
                  <div className="mb-3">
                    <Form.Label style={{color: 'white'}}>Mã giảm giá (nếu có)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      disabled={!!product.discount?.code} // Disable if product has discount
                      style={{color: 'black'}}
                    />
                    {product.discount.code && (
                      <Form.Text className="text-white">
                        Mã giảm giá hiện có: <strong>{product.discount.code}</strong> (-{product.discount.discount_percent}%)
                        {product.discount.code && (
                          <span className="ms-2">
                            <i className="fas fa-check-circle text-success"></i> Đã tự động áp dụng
                          </span>
                        )}
                      </Form.Text>
                    )}
                  </div>
                )}

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 mt-4 continue-button"
                  onClick={async () => {
                    try {
                      // Prepare addons_applied array from selectedAddons
                      const addonsApplied = Object.values(selectedAddons).map(selected => ({
                        addon_id: selected.addon.addon_id,
                        quantity: selected.quantity,
                      }));

                      // Add to cart using CartContext (now calls API)
                      const appliedDiscountCode = discountCode || (product.discount?.code || null);
                      await addToCart(product, {
                        paymentCycle,
                        discountCode: appliedDiscountCode,
                        notes,
                        quantity,
                        addonsApplied,
                      });
                      
                      notifySuccess(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
                      navigate('/cart');
                    } catch (error) {
                      console.error('Failed to add to cart:', error);
                      const errorMessage = error?.response?.data?.message || error?.message || 'Thêm sản phẩm vào giỏ hàng thất bại';
                      notifyError(errorMessage);
                    }
                  }}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Thêm vào giỏ hàng
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

