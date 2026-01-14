import api from '../utils/api';

export const paymentService = {
      // Create payment for an order
      createPayment: (orderID) => api.post('/user/payment/create', { order_id: orderID }),

      // Get payment status
      getPaymentStatus: (paymentID) => api.get(`/user/payment/status/${paymentID}`),

      // Check and sync payment status with PayOS (for polling)
      checkPaymentStatus: (paymentID) => api.post(`/user/payment/check/${paymentID}`),

      // Cancel/delete pending payment
      cancelPayment: (paymentID) => api.delete(`/user/payment/${paymentID}`),
};
