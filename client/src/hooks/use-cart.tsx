/**
 * Custom hook for cart management
 * Provides functions for adding, removing, and updating cart items
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@/pages/shop/ShopPage';
import { useToast } from '@/hooks/use-toast';

// Cart item interface
export interface CartItem {
  product: Product;
  quantity: number;
}

// Cart context interface
interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
  total: number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isLoading: false,
  total: 0,
});

// Provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  
  // Initialize on client-side
  useEffect(() => {
    setIsClientLoaded(true);
  }, []);
  
  // Fetch cart data
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => apiRequest('GET', '/api/cart'),
    enabled: isClientLoaded,
  });
  
  // Update local state when cart data changes
  useEffect(() => {
    if (cartData?.items) {
      setItems(cartData.items);
    }
  }, [cartData]);
  
  // Calculate total
  const total = items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ product, quantity = 1 }: { product: Product, quantity: number }) => {
      return await apiRequest('POST', '/api/cart/items', {
        productId: product.id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to add item to cart: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest('DELETE', `/api/cart/items/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to remove item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string, quantity: number }) => {
      return await apiRequest('PATCH', `/api/cart/items/${productId}`, {
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update quantity: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to clear cart: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Handler functions
  const addToCart = (product: Product, quantity = 1) => {
    addToCartMutation.mutate({ product, quantity });
  };
  
  const removeFromCart = (productId: string) => {
    removeFromCartMutation.mutate(productId);
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    updateQuantityMutation.mutate({ productId, quantity });
  };
  
  const clearCart = () => {
    clearCartMutation.mutate();
  };
  
  // Provide the context
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook for using the cart context
export const useCart = () => useContext(CartContext);

export default useCart;