import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';

const PaymentSuccess = () => {
      const navigate = useNavigate();
      const [searchParams] = useSearchParams();

      useEffect(() => {
            const orderId = searchParams.get('order_id');
            const status = searchParams.get('status');
            const code = searchParams.get('code');

            // If we have order_id, redirect to order details
            if (orderId) {
                  // Wait a moment to show success message
                  setTimeout(() => {
                        navigate(`/order/${orderId}`);
                  }, 1500);
            } else {
                  // No order_id, redirect to orders list
                  setTimeout(() => {
                        navigate('/orders');
                  }, 2000);
            }
      }, [navigate, searchParams]);

      return (
            <Container className="text-center mt-5">
                  <div className="py-5">
                        <div className="mb-4">
                              <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '80px' }}></i>
                        </div>
                        <h2 className="text-success mb-3">Thanh toán thành công!</h2>
                        <p className="text-muted">Đang chuyển hướng đến trang cấu hình...</p>
                        <Spinner animation="border" variant="primary" className="mt-3" />
                  </div>
            </Container>
      );
};

export default PaymentSuccess;
