import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Button, 
  Row, 
  Col, 
  Card, 
  Carousel,
  Form,
  Accordion
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import homeMockData from '../../mockData/home.json';
import { bannerService } from '../../services/bannerService';
import { faqService } from '../../services/faqService';
import { serviceFeaturesService } from '../../services/serviceFeaturesService';
import { featuredProductService } from '../../services/featuredProductService';
import './Home.css';
import Services from '../Services/Services.js';

const baseUrl = 'http://localhost:8084';

const Home = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [slides, setSlides] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [serviceFeatures, setServiceFeatures] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingServiceFeatures, setLoadingServiceFeatures] = useState(true);
  const [loadingFeaturedProducts, setLoadingFeaturedProducts] = useState(true);

  useEffect(() => {
    // Fetch slides
    const fetchSlides = async () => {
      try {
        setLoadingSlides(true);
        const res = await bannerService.list();
        const slidesData = res.data.map(slide => ({
          ...slide,
          id: slide.slide_id,
          image: slide.image 
            ? (slide.image_type === 'url' || slide.image_type === 'URL' 
              ? slide.image 
              : `${baseUrl}${slide.image}`)
            : '',
          buttonText: slide.buttonText || slide.button_text || 'Xem thêm',
          buttonLink: slide.buttonLink || slide.button_link || '/pricing',
        }));
        setSlides(slidesData);
      } catch (err) {
        console.error('Failed to fetch slides:', err);
        // Fallback to mock data on error
        setSlides(homeMockData.slides);
      } finally {
        setLoadingSlides(false);
      }
    };

    // Fetch FAQs
    const fetchFaqs = async () => {
      try {
        setLoadingFaqs(true);
        const res = await faqService.list();
        setFaqs(res.data || []);
      } catch (err) {
        console.error('Failed to fetch FAQs:', err);
        // Fallback to mock data on error
        setFaqs(homeMockData.faqs);
      } finally {
        setLoadingFaqs(false);
      }
    };

    // Fetch Service Features
    const fetchServiceFeatures = async () => {
      try {
        setLoadingServiceFeatures(true);
        const res = await serviceFeaturesService.list();
        
        // Handle different response formats
        let features = [];
        if (Array.isArray(res.data)) {
          features = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          features = res.data.data;
        } else if (res.data?.content && Array.isArray(res.data.content)) {
          features = res.data.content;
        }
        
        // Take only first 3 features and normalize image URLs
        const featuresData = features.slice(0, 3).map(feature => ({
          ...feature,
          image: feature.image 
            ? (feature.image_type === 'url' || feature.image_type === 'URL' 
              ? feature.image 
              : `${baseUrl}${feature.image}`)
            : ''
        }));
        
        setServiceFeatures(featuresData);
      } catch (err) {
        console.error('Failed to fetch service features:', err);
        // Fallback to mock data on error (only first 3)
        const mockFeatures = (homeMockData.serviceFeatures || []).slice(0, 3);
        setServiceFeatures(mockFeatures);
      } finally {
        setLoadingServiceFeatures(false);
      }
    };

    // Fetch Featured Products
    const fetchFeaturedProducts = async () => {
      try {
        setLoadingFeaturedProducts(true);
        const res = await featuredProductService.list();
        // Handle different response formats
        let products = [];
        if (Array.isArray(res.data)) {
          products = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          products = res.data.data;
        } else if (res.data?.content && Array.isArray(res.data.content)) {
          products = res.data.content;
        }
        
        // Normalize and take only first 4 products
        const normalizedProducts = products.slice(0, 4).map(item => ({
          id: item.id,
          type: item.type || 'hosting',
          title: item.title || '',
          icon: item.icon || 'fas fa-server',
          description: item.description || '',
          price: item.price || '',
          priceUnit: item.priceUnit || item.price_unit || 'vnđ/tháng',
          features: Array.isArray(item.features) ? item.features : [],
          link: item.link || '/pricing'
        }));
        
        setFeaturedProducts(normalizedProducts);
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
        // Fallback to mock data on error (only first 4)
        const mockProducts = (homeMockData.featuredProducts || []).slice(0, 4);
        setFeaturedProducts(mockProducts);
      } finally {
        setLoadingFeaturedProducts(false);
      }
    };

    fetchSlides();
    fetchFaqs();
    fetchServiceFeatures();
    fetchFeaturedProducts();
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="home-page">
      {/* Hero Carousel Section */}
      <section className="hero-carousel-section">
        {loadingSlides ? (
          <div className="carousel-loading text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Carousel fade interval={5000} className="hero-carousel">
            {slides.map((slide) => (
              <Carousel.Item key={slide.id}>
                <div 
                  className="carousel-slide"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  <div className="carousel-overlay"></div>
                  <Container fluid className="h-100">
                    <div className="carousel-content-wrapper h-100">
                      <div className="carousel-content text-white">
                        <h1 className="display-3 fw-bold mb-4">{slide.title}</h1>
                        <h2 className="h3 mb-3">{slide.subtitle}</h2>
                        <p className="lead mb-4">{slide.description}</p>
                        <Button 
                          as={Link} 
                          to={slide.buttonLink} 
                          variant="primary" 
                          size="lg"
                          className="btn-primary-custom"
                        >
                          {slide.buttonText}
                        </Button>
                      </div>
                    </div>
                  </Container>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </section>
      <Services />
      {/* Featured Products Section */}
      <section className="featured-products-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">Sản Phẩm Nổi Bật</h2>
          {loadingFeaturedProducts ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Chưa có sản phẩm nổi bật</p>
            </div>
          ) : (
            <Row>
              {featuredProducts.map((product) => (
                <Col md={6} lg={3} key={product.id} className="mb-4">
                  <Card className="featured-product-card h-100">
                    <Card.Body className="text-center d-flex flex-column justify-content-between p-4">
                      <div className="product-content">
                        <div className="product-icon mb-3">
                          <i className={`${product.icon} fa-3x`}></i>
                        </div>
                        <Card.Title className="h5 mb-3">{product.title}</Card.Title>
                        <Card.Text className="text-muted mb-3">
                          {product.description}
                        </Card.Text>
                        <div className="product-price mb-3">
                          <span className="price-label">Giá chỉ từ:</span>
                          <span className="price-value">{product.price}</span>
                          <span className="price-unit">/{product.priceUnit}</span>
                        </div>
                        <ul className="product-features list-unstyled mb-3">
                          {product.features && product.features.length > 0 ? (
                            product.features.slice(0, 2).map((feature, idx) => (
                              <li key={idx}>
                                <i className="fas fa-check text-success me-2"></i>
                                {feature}
                              </li>
                            ))
                          ) : null}
                        </ul>
                      </div>
                      <Button 
                        as={Link} 
                        to={product.link || '/pricing'} 
                        variant="primary"
                        className="btn-primary-custom w-100"
                      >
                        Chi tiết bảng giá
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Service Features Section */}
      <section className="service-features-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">
            Điều gì làm nên khác biệt của TTCS Hosting
          </h2>
          {loadingServiceFeatures ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            serviceFeatures.map((feature, index) => (
              <Row key={feature.id} className={`mb-5 ${feature.align === 'right' ? 'flex-row-reverse' : ''}`}>
                <Col md={6} className="mb-4 mb-md-0">
                  <div className="feature-image-wrapper">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="feature-image"
                    />
                    {feature.stats && feature.stats.length > 0 && (
                      <div className="feature-stats">
                        {feature.stats.map((stat, idx) => (
                          <div key={idx} className="stat-box">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
                <Col md={6} className="d-flex align-items-center">
                  <div>
                    <h3 className="h2 mb-4">{feature.title}</h3>
                    <p className="lead">{feature.description}</p>
                  </div>
                </Col>
              </Row>
            ))
          )}
        </Container>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <div className="newsletter-card text-center">
                <div className="newsletter-icon mb-3">
                  <i className="fas fa-paper-plane fa-3x"></i>
                </div>
                <h3 className="h2 mb-3">
                  Đăng ký nhận tin tức và chương trình khuyến mãi
                </h3>
                <p className="mb-4">mới nhất tại TTCS Hosting</p>
                <Form onSubmit={handleNewsletterSubmit}>
                  <Row className="g-2">
                    <Col xs={12} sm={8}>
                      <Form.Control
                        type="email"
                        placeholder="Nhập email đăng ký"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="lg"
                      />
                    </Col>
                    <Col xs={12} sm={4}>
                      <Button 
                        type="submit" 
                        variant="primary"
                        size="lg"
                        className="btn-primary-custom w-100"
                      >
                        Đăng ký
                      </Button>
                    </Col>
                  </Row>
                  {submitted && (
                    <div className="alert alert-success mt-3 mb-0">
                      Đăng ký thành công! Cảm ơn bạn đã quan tâm.
                    </div>
                  )}
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <Container>
          <h2 className="section-title text-center mb-5">Câu Hỏi Thường Gặp</h2>
          <Row>
            <Col md={10} className="mx-auto">
              {loadingFaqs ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Accordion defaultActiveKey="0" className="faq-accordion">
                  {faqs.map((faq, index) => (
                    <Accordion.Item eventKey={index.toString()} key={faq.id}>
                      <Accordion.Header>
                        {faq.question}
                      </Accordion.Header>
                      <Accordion.Body>
                        {faq.answer}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
