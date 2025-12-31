import api from '../utils/api';

// Cart service for user cart management
export const cartService = {
  // Get user's cart
  getCart: () => api.get('/user/cart'),
  
  // Get cart item by ID
  getCartItemById: (cartItemId) => api.get(`/user/cart/items/${cartItemId}`),
  
  // Add item to cart
  addItem: (itemData) => api.post('/user/cart/items', itemData),
  
  // Update cart item
  updateItem: (cartItemId, itemData) => api.put(`/user/cart/items/${cartItemId}`, itemData),
  
  // Remove item from cart
  removeItem: (cartItemId) => api.delete(`/user/cart/items/${cartItemId}`),
  
  // Clear cart (delete all items)
  clearCart: () => api.delete('/user/cart/items'),
  
  // Update cart item quantity
  updateQuantity: (cartItemId, quantity) => api.patch(`/user/cart/items/${cartItemId}/quantity`, { quantity }),
  
  // Checkout cart
  checkout: (checkoutData) => api.post('/user/cart/checkout', checkoutData),
};

