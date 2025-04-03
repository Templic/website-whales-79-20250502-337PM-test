import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { CartItem, Coupon } from '@/types/cart';
import CartItemComponent from '@/components/shop/cart/CartItem';
import CartSummary from '@/components/shop/cart/CartSummary';
import { ShoppingCart, Loader2, RefreshCw, ShoppingBag, Package, ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CosmicButton from '@/components/ui/cosmic-button';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for animations and data loading
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  
  useEffect(() => {
    setIsClientLoaded(true);
    document.title = 'Shopping Cart - Dale Loves Whales';
    
    // Add delay for entrance animation
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
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
        <div className="cosmic-glass-panel p-8 rounded-lg flex flex-col items-center animate-pulse-gentle">
          <div className="relative">
            <div className="absolute inset-0 bg-cosmic-primary rounded-full opacity-10 animate-ping"></div>
            <div className="absolute inset-4 bg-cosmic-primary rounded-full opacity-20"></div>
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-cosmic-primary relative z-10" />
          </div>
          <p className="text-lg mt-4 cosmic-text">Loading your cosmic cart...</p>
        </div>
      </div>
    );
  }
  
  // If error loading cart
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="cosmic-glass-panel p-8 rounded-lg text-center">
          <p className="text-destructive mb-4">There was a problem connecting to the cosmic database</p>
          <Button 
            onClick={() => refetch()} 
            className="cosmic-hover-glow bg-cosmic-primary hover:bg-cosmic-primary/90 text-white"
          >
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
        <div className={`cosmic-glass-panel p-8 rounded-lg text-center max-w-md cosmic-slide-up ${isAnimated ? 'in' : ''}`}>
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-cosmic-primary/20 rounded-full animate-pulse-slow"></div>
            <ShoppingCart className="h-16 w-16 absolute inset-0 m-auto text-cosmic-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2 cosmic-gradient-text animate-pulse-gentle">Your Cosmic Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Your journey through our cosmic collection has just begun. Add items to create your unique constellation.
          </p>
          <Button
            onClick={handleContinueShopping}
            className="bg-cosmic-primary hover:bg-cosmic-primary/90 text-white cosmic-hover-glow"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Explore Our Collection
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`container mx-auto px-4 py-8 cosmic-fade-in ${isAnimated ? 'in' : ''}`}>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleContinueShopping}
          className="mb-4 text-cosmic-primary hover:text-cosmic-primary/80 hover:bg-cosmic-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold cosmic-gradient-text flex items-center">
            <Sparkles className="h-6 w-6 mr-2 opacity-80" />
            Your Cosmic Cart
            <span className="ml-3 text-sm bg-cosmic-primary/10 text-cosmic-primary px-2 py-1 rounded-full">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </h1>
          
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              disabled={clearCartMutation.isPending}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {clearCartMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                'Clear Cart'
              )}
            </Button>
          )}
        </div>
        
        <Separator className="mt-4 cosmic-divider" />
      </div>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 cosmic-stagger-children in">
          <div className="space-y-4">
            {cartItems.map((item: CartItem, index) => (
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
          
          <div className="mt-6 p-4 cosmic-glass-panel rounded-lg">
            <div className="flex items-center text-sm text-cosmic-primary mb-2">
              <Package className="h-4 w-4 mr-2" />
              <span className="font-medium">Shipping Information</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All orders are processed within 24 hours. Cosmic deliveries typically arrive within 3-5 business days. Tracking information will be provided via email once your order ships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}