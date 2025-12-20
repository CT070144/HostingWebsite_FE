import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const authContext = useAuth();
  const isAuthenticated = authContext?.isAuthenticated || false;
  const [cartItems, setCartItems] = useState([]);
  const [cart, setCart] = useState(null); // Store cart info (cart_id, user_id, etc.)
  const [loading, setLoading] = useState(false);

  // Fetch cart from API when user is authenticated
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // If not authenticated, use localStorage as fallback
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
        } catch (error) {
          console.error('Error parsing cart data:', error);
          localStorage.removeItem('cart');
        }
      }
      return;
    }

    try {
      setLoading(true);
      const response = await cartService.getCart();
      const cartData = response.data?.cart || response.data;
      const items = response.data?.items || [];
      
      // Store cart summary info if available
      if (response.data?.total_amount !== undefined) {
        setCart({
          ...cartData,
          totalAmount: response.data.total_amount,
          currency: response.data.currency || 'VND',
        });
      } else {
        setCart(cartData);
      }
      
      // Normalize items to match local format
      const normalizedItems = items.map((item) => {
        const config = item.config || {};
        const addonsApplied = config.addons_applied || [];
        const discountApplied = config.discount_applied || {};
        
        // Convert billing_cycle string to number
        const billingCycle = typeof item.billing_cycle === 'string' 
          ? parseInt(item.billing_cycle) 
          : (item.billing_cycle || 1);
        
        // Use total_price from API (includes addons, discount, VAT)
        // Calculate VAT from total_price (if VAT is 10% and included in total_price)
        // VAT = total_price * 10 / 110
        const totalPrice = item.total_price || 0;
        const vat = Math.round(totalPrice * 10 / 110); // 10% VAT (assuming VAT is included in total_price)
        const subtotalBeforeVAT = totalPrice - vat;
        const discountAmount = discountApplied.discount_amount || 0;
        
        return {
          id: item.cart_item_id,
          cartItemId: item.cart_item_id,
          cartId: item.cart_id,
          productId: item.product_id,
          productName: item.product_name || 'Sản phẩm',
          quantity: item.quantity || 1,
          billingCycle: billingCycle,
          paymentCycle: billingCycle, // Keep for backward compatibility
          unitPrice: item.unit_price || 0,
          totalPrice: item.total_price || 0,
          addonsApplied: addonsApplied,
          discountApplied: discountApplied,
          discountCode: discountApplied.code || null,
          discountPercent: discountApplied.discount_percent || 0,
          discountAmount: discountAmount,
          subtotal: subtotalBeforeVAT, // Subtotal before VAT
          vat: vat,
          total: totalPrice, // Total including VAT
          product: item.product || null,
        };
      });
      
      setCartItems(normalizedItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Fallback to localStorage if API fails
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
        } catch (err) {
          console.error('Error parsing cart data:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load cart on mount and when auth status changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = async (product, options = {}) => {
    const {
      paymentCycle = 1, // months
      discountCode = null,
      notes = '',
      quantity = 1,
      addonsApplied = [], // Array of addon objects: { addon_id, quantity }
    } = options;

    // Convert paymentCycle to billing_cycle string format
    const billingCycle = String(paymentCycle);

    // Prepare API payload according to new format
    const payload = {
      product_id: product.id,
      quantity: quantity,
      billing_cycle: billingCycle,
      config: {
        addons_applied: addonsApplied.map(addon => ({
          addon_id: addon.addon_id,
          quantity: addon.quantity || addon.min_quantity || 1,
        })),
      },
    };

    // Add discount code if provided (will be handled by backend)
    if (discountCode) {
      payload.config.discount_code = discountCode;
    }

    // Add notes if provided
    if (notes) {
      payload.config.notes = notes;
    }

    if (isAuthenticated) {
      try {
        setLoading(true);
        const response = await cartService.addItem(payload);
        // Refresh cart after adding
        await fetchCart();
        return response.data;
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage if not authenticated
      const monthlyPrice = product.monthlyPrice || product.price_monthly || 0;
      const yearlyPrice = product.yearlyPrice || product.price_annually || 0;
      
      let basePrice = monthlyPrice;
      if (paymentCycle === 12 || paymentCycle === 24 || paymentCycle === 36) {
        basePrice = yearlyPrice / 12;
      }

      let discountPercent = 0;
      if (discountCode && product.discount) {
        if (product.discount.code === discountCode) {
          discountPercent = product.discount.discount_percent || 0;
        }
      }

      const subtotal = basePrice * paymentCycle;
      const discountAmount = (subtotal * discountPercent) / 100;
      const afterDiscount = subtotal - discountAmount;
      const vat = Math.round(afterDiscount * 0.1);
      const total = afterDiscount + vat;

      const cartItem = {
        id: `${product.id}-${paymentCycle}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productPrice: basePrice,
        paymentCycle,
        billingCycle: paymentCycle,
        discountCode,
        discountPercent,
        discountAmount,
        addonsApplied,
        subtotal: afterDiscount,
        vat,
        total,
        notes,
        quantity,
        product: product,
        addedAt: new Date().toISOString(),
      };

      const updatedItems = [...cartItems, cartItem];
      setCartItems(updatedItems);
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      return cartItem;
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        // itemId could be cart_item_id from API or local id
        const cartItem = cartItems.find(item => item.id === itemId || item.cartItemId === itemId);
        if (cartItem?.cartItemId) {
          await cartService.removeItem(cartItem.cartItemId);
        } else {
          // If no cartItemId, try using itemId directly
          await cartService.removeItem(itemId);
        }
        // Refresh cart after removing
        await fetchCart();
      } catch (error) {
        console.error('Failed to remove item from cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(updatedItems);
      if (updatedItems.length > 0) {
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      } else {
        localStorage.removeItem('cart');
      }
    }
  };

  // Update cart item
  const updateCartItem = async (itemId, updates) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const cartItem = cartItems.find(item => item.id === itemId || item.cartItemId === itemId);
        if (cartItem?.cartItemId) {
          // If updating quantity, use updateQuantity API
          if (updates.quantity !== undefined) {
            await cartService.updateQuantity(cartItem.cartItemId, updates.quantity);
          } else {
            // Otherwise, update item with new config
            const payload = {};
            
            // Update billing_cycle if provided
            if (updates.billingCycle !== undefined || updates.paymentCycle !== undefined) {
              payload.billing_cycle = String(updates.billingCycle || updates.paymentCycle);
            }
            
            // Update config if provided
            if (updates.addonsApplied || updates.discountCode || updates.notes) {
              payload.config = {};
              if (updates.addonsApplied) {
                payload.config.addons_applied = updates.addonsApplied.map(addon => ({
                  addon_id: addon.addon_id,
                  quantity: addon.quantity || 1,
                }));
              }
              if (updates.discountCode !== undefined) {
                payload.config.discount_code = updates.discountCode;
              }
              if (updates.notes !== undefined) {
                payload.config.notes = updates.notes;
              }
            }
            
            if (Object.keys(payload).length > 0) {
              await cartService.updateItem(cartItem.cartItemId, payload);
            }
          }
          // Refresh cart after updating
          await fetchCart();
        }
      } catch (error) {
        console.error('Failed to update cart item:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage - recalculate prices if quantity changed
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const updatedItem = { ...item, ...updates };
            // Recalculate prices if quantity changed
            if (updates.quantity !== undefined && updatedItem.quantity > 0) {
              const baseSubtotal = updatedItem.subtotal || 0;
              const baseVat = updatedItem.vat || 0;
              const baseTotal = updatedItem.total || 0;
              
              // Calculate per-unit prices
              const oldQuantity = item.quantity || 1;
              const perUnitSubtotal = baseSubtotal / oldQuantity;
              const perUnitVat = baseVat / oldQuantity;
              const perUnitTotal = baseTotal / oldQuantity;
              
              // Apply new quantity
              updatedItem.subtotal = perUnitSubtotal * updatedItem.quantity;
              updatedItem.vat = perUnitVat * updatedItem.quantity;
              updatedItem.total = perUnitTotal * updatedItem.quantity;
            }
            return updatedItem;
          }
          return item;
        })
      );
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        await cartService.clearCart();
        setCartItems([]);
        setCart(null);
      } catch (error) {
        console.error('Failed to clear cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to localStorage
      setCartItems([]);
      localStorage.removeItem('cart');
    }
  };

  // Get cart total (item.total already includes quantity from normalization)
  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  // Get cart subtotal (item.subtotal already includes quantity from normalization)
  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  // Get cart VAT (item.vat already includes quantity from normalization)
  const getCartVAT = () => {
    return cartItems.reduce((sum, item) => sum + (item.vat || 0), 0);
  };

  // Get cart item count
  const getCartItemCount = () => {
    return cartItems.length;
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return cartItems.some((item) => item.productId === productId);
  };

  const value = {
    cartItems,
    cart, // Cart info (cart_id, user_id, status, etc.)
    loading,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    fetchCart, // Expose fetchCart for manual refresh
    getCartTotal,
    getCartSubtotal,
    getCartVAT,
    getCartItemCount,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

