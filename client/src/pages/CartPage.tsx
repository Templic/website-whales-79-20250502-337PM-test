import { useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import CosmicHeading from '@/components/ui/cosmic-heading';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CosmicCard from '@/components/ui/cosmic-card';
import ProductGrid from '@/components/shop/ProductGrid';

interface CartWithItems {
  id: number;
  userId: number | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: (CartItem & { product: Product })[];
}

export default function CartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Your Cart - Dale Loves Whales Shop";
  }, []);

  // Fetch cart and items
  const { 
    data: cart, 
    isLoading: cartLoading, 
    isError: cartError,
    refetch: refetchCart
  } = useQuery({
    queryKey: ['/api/shop/cart'],
    queryFn: async () => {
      const response = await apiRequest<CartWithItems>('/api/shop/cart');
      return response;
    },
  });

  // Fetch featured products for empty cart suggestion
  const { 
    data: featuredProducts, 
    isLoading: featuredLoading 
  } = useQuery({
    queryKey: ['/api/shop/products', { featured: true }],
    queryFn: async () => {
      const response = await apiRequest<Product[]>('/api/shop/products?featured=true&limit=4');
      return response;
    },
    enabled: !cart?.items?.length,
  });

  // Update item quantity
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number, quantity: number }) => {
      return apiRequest(`/api/shop/cart/items/${itemId}`, {
        method: 'PATCH',
        data: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      });
    }
  });

  // Remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/shop/cart/items/${itemId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Item removed",
        description: "Item successfully removed from your cart",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  });

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/shop/cart', {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/cart'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  });

  // Calculate cart totals
  const calculateSubtotal = () => {
    if (!cart?.items || cart.items.length === 0) return 0;
    
    return cart.items.reduce((sum, item) => {
      const price = item.product.salePrice 
        ? parseFloat(item.product.salePrice as string) 
        : parseFloat(item.product.price as string);
      return sum + (price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = 5.99; // Fixed shipping for now
  const tax = subtotal * 0.07; // 7% tax rate
  const total = subtotal + shipping + tax;

  // Handle quantity change
  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItemMutation.mutate({ itemId, quantity: newQuantity });
  };

  // Loading state
  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Empty cart
  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CosmicHeading as="h1" size="2xl" weight="bold" className="mb-8 text-center">
          Your Cart
        </CosmicHeading>
        
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ShoppingCart className="h-20 w-20 text-muted-foreground" />
          </div>
          <CosmicHeading as="h2" size="xl" weight="medium" className="mb-4">
            Your cart is empty
          </CosmicHeading>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Looks like you haven't added any products to your cart yet. 
            Explore our shop to find something you'll love!
          </p>
          <Link href="/shop">
            <CosmicButton variant="cosmic" size="lg">
              Continue Shopping
            </CosmicButton>
          </Link>
        </div>
        
        {featuredProducts && featuredProducts.length > 0 && (
          <div className="mt-16">
            <CosmicHeading as="h3" size="xl" weight="medium" className="mb-6 text-center">
              You might like
            </CosmicHeading>
            
            {featuredLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ProductGrid 
                products={featuredProducts} 
                onQuickView={(product) => {
                  window.location.href = `/shop/product/${product.slug}`;
                }}
                onAddToCart={async (productId) => {
                  try {
                    await apiRequest('/api/shop/cart/items', {
                      method: 'POST',
                      data: { productId, quantity: 1 }
                    });
                    refetchCart();
                    toast({
                      title: "Added to cart",
                      description: "Item successfully added to your cart",
                      variant: "success",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to add item to cart",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (cartError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CosmicHeading as="h1" size="2xl" weight="bold" className="mb-4">
          Something went wrong
        </CosmicHeading>
        <p className="mb-8 text-muted-foreground">
          We couldn't load your cart. Please try again.
        </p>
        <CosmicButton 
          variant="cosmic"
          onClick={() => refetchCart()}
        >
          Try Again
        </CosmicButton>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CosmicHeading as="h1" size="2xl" weight="bold" className="mb-8">
        Your Cart
      </CosmicHeading>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <CosmicCard variant="glow" className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => {
                  const product = item.product;
                  const price = product.salePrice 
                    ? parseFloat(product.salePrice as string) 
                    : parseFloat(product.price as string);
                  const itemTotal = price * item.quantity;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link href={`/shop/product/${product.slug}`}>
                          <div className="h-16 w-16 overflow-hidden rounded border border-gray-700">
                            <img 
                              src={Array.isArray(product.images) && product.images.length > 0
                                ? product.images[0]
                                : '/placeholder-product.jpg'
                              }
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/shop/product/${product.slug}`}>
                          <span className="font-medium hover:text-cosmic-primary transition-colors">
                            {product.name}
                          </span>
                        </Link>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.salePrice ? (
                          <div>
                            <span className="text-red-400 font-medium">
                              {formatCurrency(parseFloat(product.salePrice as string))}
                            </span>
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              {formatCurrency(parseFloat(product.price as string))}
                            </span>
                          </div>
                        ) : (
                          <span>{formatCurrency(parseFloat(product.price as string))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CosmicButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                            className="h-8 w-8 p-0 rounded-r-none"
                          >
                            -
                          </CosmicButton>
                          <div className="h-8 w-10 flex items-center justify-center border-y border-gray-700">
                            {item.quantity}
                          </div>
                          <CosmicButton 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (product.inventory || 10) || updateItemMutation.isPending}
                            className="h-8 w-8 p-0 rounded-l-none"
                          >
                            +
                          </CosmicButton>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(itemTotal)}
                      </TableCell>
                      <TableCell>
                        <CosmicButton
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </CosmicButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
              <div className="flex space-x-4">
                <Link href="/shop">
                  <CosmicButton variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </CosmicButton>
                </Link>
                
                <CosmicButton 
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your cart?')) {
                      clearCartMutation.mutate();
                    }
                  }}
                  disabled={clearCartMutation.isPending}
                >
                  Clear Cart
                </CosmicButton>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">
                  {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
                </p>
              </div>
            </div>
          </CosmicCard>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <CosmicCard variant="glow" className="p-6">
            <CosmicHeading as="h2" size="lg" weight="bold" className="mb-4">
              Order Summary
            </CosmicHeading>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (7%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-cosmic-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Link href="/shop/checkout">
                <CosmicButton variant="cosmic" className="w-full">
                  Proceed to Checkout
                </CosmicButton>
              </Link>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, PayPal, and cryptocurrency
              </p>
            </div>
          </CosmicCard>
        </div>
      </div>
    </div>
  );
}