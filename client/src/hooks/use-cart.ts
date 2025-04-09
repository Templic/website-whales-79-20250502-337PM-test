// Simple mock implementation of a cart hook without React context
// In a real application, this would use React context to share cart state

import { useState, useEffect } from 'react';
import { Product } from '@/pages/shop/ShopPage';

// Cart item interface
export interface CartItem {
  product: Product;
  quantity: number;
}

// Create a local cart instance 
const mockCart: CartItem[] = [];
let mockCartTotal = 0;
let mockCartItemCount = 0;

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(mockCart);
  
  // Add item to cart
  const addToCart = (product: Product, quantity = 1) => {
    const existingItemIndex = mockCart.findIndex(item => item.product.id === product.id);
    
    if (existingItemIndex >= 0) {
      mockCart[existingItemIndex].quantity += quantity;
    } else {
      mockCart.push({ product, quantity });
    }
    
    // Update cart totals
    mockCartTotal = mockCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    mockCartItemCount = mockCart.reduce((count, item) => count + item.quantity, 0);
    
    // Update state
    setCart([...mockCart]);
    
    // In a real implementation, we would save to localStorage here
    // localStorage.setItem('cosmic-cart', JSON.stringify(mockCart));
  };
  
  // Remove item from cart
  const removeFromCart = (productId: string) => {
    const itemIndex = mockCart.findIndex(item => item.product.id === productId);
    
    if (itemIndex >= 0) {
      mockCart.splice(itemIndex, 1);
      
      // Update cart totals
      mockCartTotal = mockCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
      mockCartItemCount = mockCart.reduce((count, item) => count + item.quantity, 0);
      
      // Update state
      setCart([...mockCart]);
      
      // In a real implementation, we would save to localStorage here
      // localStorage.setItem('cosmic-cart', JSON.stringify(mockCart));
    }
  };
  
  // Update cart item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const itemIndex = mockCart.findIndex(item => item.product.id === productId);
    
    if (itemIndex >= 0) {
      mockCart[itemIndex].quantity = quantity;
      
      // Update cart totals
      mockCartTotal = mockCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
      mockCartItemCount = mockCart.reduce((count, item) => count + item.quantity, 0);
      
      // Update state
      setCart([...mockCart]);
      
      // In a real implementation, we would save to localStorage here
      // localStorage.setItem('cosmic-cart', JSON.stringify(mockCart));
    }
  };
  
  // Clear the entire cart
  const clearCart = () => {
    mockCart.length = 0;
    mockCartTotal = 0;
    mockCartItemCount = 0;
    
    // Update state
    setCart([]);
    
    // In a real implementation, we would clear localStorage here
    // localStorage.removeItem('cosmic-cart');
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal: mockCartTotal,
    cartItemCount: mockCartItemCount
  };
}