import React from 'react';
import { Container } from 'react-bootstrap';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-4">Về chúng tôi</h1>
          <p className="lead">
            TTCS Hosting - Đối tác tin cậy cho dịch vụ hosting của bạn
          </p>
        </div>
        
        <div className="row mt-5">
          <div className="col-md-6 mb-4">
            <h3>Sứ mệnh</h3>
            <p>
              Chúng tôi cam kết cung cấp dịch vụ hosting chất lượng cao, 
              đáng tin cậy với giá cả hợp lý. Mục tiêu của chúng tôi là 
              giúp khách hàng xây dựng và phát triển website thành công.
            </p>
          </div>
          <div className="col-md-6 mb-4">
            <h3>Tầm nhìn</h3>
            <p>
              Trở thành nhà cung cấp dịch vụ hosting hàng đầu tại Việt Nam, 
              được khách hàng tin tưởng và lựa chọn cho các dự án website 
              của họ.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default About;

