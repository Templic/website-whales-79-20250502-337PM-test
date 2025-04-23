import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Trash2, ShoppingCart } from "lucide-react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { Product } from "../ShopPage";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cosmic-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cosmic-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cosmic-cart');
    }
  }, [cart]);

  const getProductImage = (product: Product): string => {
    // Force using the fallback system for demonstration
    const { name, description, categories = [] } = product;
    const combinedText = `${name} ${description} ${categories.join(' ')}`.toLowerCase();
    
    // Map for category-specific images
    const categoryPlaceholders: Record<string, string> = {
      'healing tools': '/images/products/samples/crystal-bowl.jpg',
      'sound therapy': '/images/products/samples/tibetan-bowl.jpg',
      'jewelry': '/images/products/samples/cosmic-pendant.jpg',
      'energy tools': '/images/products/samples/clear-quartz.jpg',
      'digital': '/images/products/samples/album-cover.jpg',
      'music': '/images/products/samples/album-cover.jpg',
      'meditation': '/images/products/samples/meditation-cushion.jpg',
      'home': '/images/products/samples/crystal-bowl.jpg',
      'art': '/images/products/samples/sacred-geometry.jpg',
      'books': '/images/products/samples/spiritual-journal.jpg',
      'self-development': '/images/products/samples/spiritual-journal.jpg'
    };
    
    // Check if product content matches any specific categories
    if (categories && categories.length > 0) {
      for (const productCategory of categories) {
        const lowerCategory = productCategory.toLowerCase();
        for (const [category, imagePath] of Object.entries(categoryPlaceholders)) {
          if (lowerCategory.includes(category.toLowerCase())) {
            return imagePath;
          }
        }
      }
    }
    
    // Common product types to check for with specific descriptions
    const productTypes = [
      { keywords: ['crystal', 'bowl', 'singing'], image: '/images/products/samples/crystal-bowl.jpg' },
      { keywords: ['clear quartz', 'point', 'amplification'], image: '/images/products/samples/clear-quartz.jpg' },
      { keywords: ['pendant', 'necklace', 'jewelry', 'cosmic'], image: '/images/products/samples/cosmic-pendant.jpg' },
      { keywords: ['album', 'frequency', 'music', 'sound', 'tracks'], image: '/images/products/samples/album-cover.jpg' },
      { keywords: ['cushion', 'meditation', 'cork', 'organic'], image: '/images/products/samples/meditation-cushion.jpg' },
      { keywords: ['geometry', 'art', 'wall', 'hand-painted'], image: '/images/products/samples/sacred-geometry.jpg' },
      { keywords: ['t-shirt', 'cotton'], image: '/images/products/samples/sacred-geometry-tshirt.jpg' },
      { keywords: ['journal', 'diary', 'write', 'book'], image: '/images/products/samples/spiritual-journal.jpg' },
      { keywords: ['amethyst', 'cluster'], image: '/images/products/samples/amethyst-cluster.jpg' },
      { keywords: ['labradorite', 'palm stone'], image: '/images/products/samples/labradorite.jpg' },
      { keywords: ['tibetan', 'metal', 'singing bowl'], image: '/images/products/samples/tibetan-bowl.jpg' },
      { keywords: ['koshi', 'chimes'], image: '/images/products/samples/koshi-chimes.jpg' },
    ];
    
    // Check for keyword matches in name or description
    for (const type of productTypes) {
      if (type.keywords.some(keyword => combinedText.includes(keyword))) {
        return type.image;
      }
    }
    
    // Default to different images based on product ID to ensure unique visuals
    const defaultImages = [
      '/images/products/samples/cosmic-pendant.jpg',
      '/images/products/samples/crystal-bowl.jpg',
      '/images/products/samples/sacred-geometry.jpg',
      '/images/products/samples/meditation-cushion.jpg',
      '/images/products/samples/album-cover.jpg',
    ];
    
    // Use product ID to deterministically select an image
    const idNumber = parseInt(product.id.replace(/\D/g, '')) || 0;
    const defaultImage = defaultImages[idNumber % defaultImages.length];
    return defaultImage;
  };

  // Calculate cart totals
  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.07; // 7% tax
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping - discountAmount;

  // Update quantity
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item => 
        item.product.id === id 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
    }
  };

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.product.id !== id));
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart."
    });
  };

  // Clear cart
  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart."
      });
    }
  };

  // Apply promo code
  const applyPromoCode = () => {
    // Demo promo codes
    const promoCodes = {
      'COSMIC20': 0.2, // 20% off
      'WELCOME10': 0.1, // 10% off
      'SHIPFREE': 0 // just for demonstration
    };

    if (!promoCode.trim()) {
      toast({
        title: "Enter a promo code",
        description: "Please enter a promo code to apply.",
        variant: "destructive"
      });
      return;
    }

    const normalizedCode = promoCode.trim().toUpperCase();
    const discount = promoCodes[normalizedCode as keyof typeof promoCodes];

    if (discount !== undefined) {
      if (normalizedCode === 'SHIPFREE') {
        // Special handling for shipping promo
        toast({
          title: "Free shipping applied!",
          description: "Your order now qualifies for free shipping."
        });
      } else {
        // Apply percentage discount
        const discountValue = subtotal * discount;
        setDiscountAmount(discountValue);
        toast({
          title: "Promo code applied!",
          description: `You saved $${discountValue.toFixed(2)} with this promo code.`
        });
      }
      setPromoApplied(true);
    } else {
      toast({
        title: "Invalid promo code",
        description: "The promo code you entered is invalid or has expired.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.2} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center text-sm mb-4">
            <Button 
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 hover:bg-transparent p-0 h-auto text-muted-foreground"
              onClick={() => setLocation('/shop')}
            >
              <ChevronLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-between items-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">
              Your Cosmic Cart
            </h1>
            
            {cart.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                      <p className="text-muted-foreground mb-6">Looks like you haven't added any items to your cart yet.</p>
                      <Button onClick={() => setLocation('/shop')}>Browse Products</Button>
                    </div>
                  ) : (
                    <div>
                      {/* Cart Header (only visible on larger screens) */}
                      <div className="hidden md:grid md:grid-cols-[1fr,auto,auto] gap-4 mb-4 text-sm text-muted-foreground">
                        <div>Product</div>
                        <div className="text-center w-24">Quantity</div>
                        <div className="text-right w-24">Total</div>
                      </div>
                      
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.product.id} className="grid md:grid-cols-[1fr,auto,auto] gap-4 py-4 border-b last:border-0 items-center">
                            {/* Product Info */}
                            <div className="flex items-start gap-4">
                              <div 
                                className="h-24 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                                onClick={() => setLocation(`/shop/product/${item.product.id}`)}
                              >
                                <img 
                                  src={getProductImage(item.product)} 
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="text-base font-medium line-clamp-1 hover:text-primary cursor-pointer"
                                  onClick={() => setLocation(`/shop/product/${item.product.id}`)}
                                >
                                  {item.product.name}
                                </h4>
                                
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.product.categories.slice(0, 2).map(category => (
                                    <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
                                  ))}
                                </div>
                                
                                <div className="text-sm mt-2">
                                  <span className="text-muted-foreground">Price: </span>
                                  <span className="font-medium">
                                    ${item.product.price.toFixed(2)}
                                  </span>
                                  {item.product.discountPercent && (
                                    <span className="ml-2 text-xs line-through text-muted-foreground">
                                      ${(item.product.price / (1 - item.product.discountPercent / 100)).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                
                                <button 
                                  className="text-sm text-muted-foreground hover:text-destructive mt-2 md:hidden"
                                  onClick={() => removeFromCart(item.product.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex justify-center">
                              <div className="flex items-center space-x-2 border rounded-md overflow-hidden">
                                <button 
                                  className="w-8 h-8 flex items-center justify-center border-r hover:bg-muted"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >-</button>
                                <span className="w-10 text-center">{item.quantity}</span>
                                <button 
                                  className="w-8 h-8 flex items-center justify-center border-l hover:bg-muted"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >+</button>
                              </div>
                            </div>
                            
                            {/* Price & Remove */}
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </span>
                              <button 
                                className="text-sm text-muted-foreground hover:text-destructive mt-1 hidden md:inline"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recently Viewed / Recommended Products */}
              {cart.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">You might also like</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Sample recommended products - in a real app, these would be dynamically generated */}
                    {Array.from({ length: 4 }).map((_, i) => {
                      // Get a product not in cart
                      const availableProductIndex = i % cart.length;
                      const relatedProduct = cart[availableProductIndex]?.product;
                      
                      if (!relatedProduct) return null;
                      
                      return (
                        <Card 
                          key={i}
                          className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                          onClick={() => setLocation(`/shop/product/${relatedProduct.id}`)}
                        >
                          <div className="aspect-square overflow-hidden bg-muted">
                            <img 
                              src={getProductImage(relatedProduct)}
                              alt={relatedProduct.name}
                              className="object-cover w-full h-full transition-transform hover:scale-105"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm line-clamp-1">{relatedProduct.name}</h4>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-sm">${relatedProduct.price.toFixed(2)}</span>
                              <Badge variant="outline" className="text-xs">View</Badge>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div>
              <Card className="bg-muted/20 backdrop-blur-sm sticky top-4">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {promoApplied && discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (7%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Already ordered? Track your order */}
                  <div className="mb-4 text-center">
                    <Button 
                      variant="link" 
                      className="text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setLocation('/shop/track-order')}
                    >
                      Already ordered? Track your order
                    </Button>
                  </div>
                  
                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={promoApplied}
                      />
                      <Button 
                        variant="outline" 
                        onClick={applyPromoCode}
                        disabled={promoApplied}
                      >
                        Apply
                      </Button>
                    </div>
                    
                    {promoApplied && (
                      <div className="text-xs text-emerald-500 flex justify-between">
                        <span>Promo code applied!</span>
                        <button 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setPromoApplied(false);
                            setDiscountAmount(0);
                            setPromoCode('');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      Try demo codes: COSMIC20, WELCOME10, SHIPFREE
                    </div>
                  </div>
                  
                  {subtotal > 0 && (
                    <>
                      {shipping === 0 && (
                        <div className="bg-teal-500/10 border border-teal-500/30 rounded-md p-3 text-sm text-teal-700 dark:text-teal-300 mb-4">
                          You've qualified for free shipping!
                        </div>
                      )}
                      
                      <Button 
                        className="w-full"
                        onClick={() => setLocation('/checkout')}
                      >
                        Proceed to Checkout
                      </Button>
                      
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block w-6 h-6">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width={20} height={16} x="2" y="4" rx="2" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </span>
                        <span>Secure payment processing</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}