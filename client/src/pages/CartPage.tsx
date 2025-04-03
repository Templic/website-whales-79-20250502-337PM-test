import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { CartItem, Coupon } from '@/types/cart';
import CartItemComponent from '@/components/shop/cart/CartItem';
import CartSummary from '@/components/shop/cart/CartSummary';
import { ShoppingCart, Loader2, RefreshCw, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CosmicButton from '@/components/ui/cosmic-button';

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for server data loading
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  
  useEffect(() => {
    setIsClientLoaded(true);
    document.title = 'Shopping Cart - Dale Loves Whales';
  }, []);
  
  // Fetch cart items
  const { 
    data: cartItems = [] as CartItem[], 
    isLoading, 
    isError,
    refetch
  } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
    enabled: isClientLoaded,
  });
  
  // Update item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
      return await apiRequest(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        data: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Item removed',
        description: 'The item has been removed from your cart.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('/api/cart/coupon', {
        method: 'POST',
        data: { code }
      });
      return response as Coupon;
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to apply coupon. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  });
  
  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/cart', {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to clear cart. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handlers
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity });
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };
  
  const handleApplyCoupon = async (code: string) => {
    const result = await applyCouponMutation.mutateAsync(code);
    return result;
  };
  
  const handleClearCart = () => {
    clearCartMutation.mutate();
  };
  
  const handleCheckout = () => {
    setLocation('/shop/checkout');
  };
  
  const handleContinueShopping = () => {
    setLocation('/shop');
  };
  
  // If still loading
  if (!isClientLoaded || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading your cart...</p>
      </div>
    );
  }
  
  // If error loading cart
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load cart data</p>
          <Button onClick={() => refetch()} className="cosmic-hover-glow">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2 cosmic-gradient-text">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <CosmicButton onClick={handleContinueShopping} variant="cosmic">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </CosmicButton>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold cosmic-gradient-text">Shopping Cart</h1>
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="cosmic-hover-glow"
          >
            Continue Shopping
          </Button>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              disabled={clearCartMutation.isPending}
              className="text-muted-foreground hover:text-destructive"
            >
              {clearCartMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                'Clear Cart'
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item: CartItem) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-8 lg:mt-0">
          <CartSummary
            items={cartItems}
            onApplyCoupon={handleApplyCoupon}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}