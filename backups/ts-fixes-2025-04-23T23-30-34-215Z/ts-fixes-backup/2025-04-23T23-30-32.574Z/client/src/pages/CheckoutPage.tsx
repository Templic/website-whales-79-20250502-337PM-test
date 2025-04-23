import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CreditCard, ShoppingCart, Lock, AlertCircle } from "lucide-react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import StripeProvider from "@/components/shop/payment/StripeProvider";
import StripeElements from "@/components/shop/payment/StripeElements";
import { Product } from "./ShopPage";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
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
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'confirmation'>('cart');
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [countries, setCountries] = useState(['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan']);
  const [clientSecret, setClientSecret] = useState<string | undefined>();
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Shipping info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    // Payment info
    cardName: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
  });

  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cosmic-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cosmic-cart');
    }
  }, [cart]);

  // Handle empty cart
  useEffect(() => {
    if (cart.length === 0 && !orderCompleted) {
      toast({
        title: "Your cart is empty",
        description: "Add some products to your cart before checking out.",
      });
      setLocation('/shop');
    }
  }, [cart, setLocation, toast, orderCompleted]);

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
  const total = subtotal + tax + shipping;

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
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user edits field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle dropdown change
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user edits field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate shipping form
  const validateShippingForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.zipCode.trim()) errors.zipCode = "Zip code is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate payment form
  const validatePaymentForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.cardName.trim()) errors.cardName = "Name on card is required";
    if (!formData.cardNumber.trim()) errors.cardNumber = "Card number is required";
    else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = "Please enter a valid 16-digit card number";
    }
    if (!formData.expMonth.trim()) errors.expMonth = "Expiration month is required";
    if (!formData.expYear.trim()) errors.expYear = "Expiration year is required";
    if (!formData.cvv.trim()) errors.cvv = "CVV is required";
    else if (!/^\d{3,4}$/.test(formData.cvv)) errors.cvv = "CVV must be 3 or 4 digits";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Proceed to next step
  const proceedToShipping = () => {
    setStep('shipping');
    window.scrollTo(0, 0);
  };

  const proceedToPayment = () => {
    if (validateShippingForm()) {
      setStep('payment');
      window.scrollTo(0, 0);
      
      // Create a payment intent to get client secret
      // In a real implementation, this would make an API call to your server
      // which would create a PaymentIntent with Stripe and return the client secret
      setTimeout(() => {
        // Simulate API response with a client secret
        setClientSecret('mock_client_secret_' + Date.now().toString());
      }, 500);
    }
  };

  // Handle payment complete from Stripe Elements
  const handlePaymentComplete = async (paymentMethodId: string) => {
    setPaymentMethodId(paymentMethodId);
    setPaymentProcessing(true);
    
    try {
      // In a real implementation, this would make an API call to your server
      // to process the payment with the paymentMethodId
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock order ID
      const orderId = `ORD${Math.floor(100000 + Math.random() * 900000)}`;
      
      setOrderCompleted(true);
      setStep('confirmation');
      
      // Clear cart
      setCart([]);
      window.scrollTo(0, 0);
      
      // After a brief delay to show confirmation page, redirect to order details
      setTimeout(() => {
        setLocation(`/shop/order/${orderId}`);
      }, 3000);
    } catch (error: unknown) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "There was a problem processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  // Legacy payment processing (for backwards compatibility)
  const placeOrder = () => {
    // This function is kept for backwards compatibility
    // It should not be used in production as it directly handles card data
    toast({
      title: "PCI DSS Compliance Warning",
      description: "Direct handling of card data is not allowed. Use the secure payment form instead.",
      variant: "destructive",
    });
  };

  const backToCart = () => {
    setStep('cart');
    window.scrollTo(0, 0);
  };

  const backToShipping = () => {
    setStep('shipping');
    window.scrollTo(0, 0);
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
          
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">
            {step === 'cart' && 'Your Cart'}
            {step === 'shipping' && 'Shipping Information'}
            {step === 'payment' && 'Payment Details'}
            {step === 'confirmation' && 'Order Confirmed'}
          </h1>
          
          {/* Checkout Progress */}
          {!orderCompleted && (
            <div className="mt-6 mb-8">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'cart' ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1">Cart</span>
                </div>
                
                <div className={`h-1 flex-1 mx-2 ${step === 'cart' ? 'bg-muted' : 'bg-primary'}`}></div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' || step === 'payment' || step === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                  <span className="text-xs mt-1">Shipping</span>
                </div>
                
                <div className={`h-1 flex-1 mx-2 ${step === 'cart' || step === 'shipping' ? 'bg-muted' : 'bg-primary'}`}></div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' || step === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1">Payment</span>
                </div>
                
                <div className={`h-1 flex-1 mx-2 ${step === 'confirmation' ? 'bg-primary' : 'bg-muted'}`}></div>
                
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirmation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    ✓
                  </div>
                  <span className="text-xs mt-1">Confirmation</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Cart */}
          {step === 'cart' && (
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
                        <div className="space-y-4">
                          {cart.map((item) => (
                            <div key={item.product.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                              <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                <img 
                                  src={getProductImage(item.product)} 
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-medium line-clamp-1">{item.product.name}</h4>
                                
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.product.categories.slice(0, 2).map(category => (
                                    <span key={category} className="text-xs text-muted-foreground">{category}</span>
                                  ))}
                                </div>
                                
                                <div className="flex justify-between items-end mt-2">
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      className="text-sm w-6 h-6 rounded border flex items-center justify-center"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    >-</button>
                                    <span className="text-sm w-8 text-center">{item.quantity}</span>
                                    <button 
                                      className="text-sm w-6 h-6 rounded border flex items-center justify-center"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    >+</button>
                                  </div>
                                  
                                  <button 
                                    className="text-sm text-muted-foreground hover:text-destructive"
                                    onClick={() => removeFromCart(item.product.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <span className="font-medium">
                                  ${(item.product.price * item.quantity).toFixed(2)}
                                </span>
                                {item.quantity > 1 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ${item.product.price.toFixed(2)} each
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
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
                    
                    {subtotal > 0 && (
                      <>
                        {shipping === 0 && (
                          <div className="bg-teal-500/10 border border-teal-500/30 rounded-md p-3 text-sm text-teal-700 dark:text-teal-300 mb-4">
                            You've qualified for free shipping!
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={proceedToShipping}
                        >
                          Proceed to Checkout
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Shipping Information */}
          {step === 'shipping' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={formErrors.firstName ? 'border-destructive' : ''}
                        />
                        {formErrors.firstName && (
                          <p className="text-destructive text-xs mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={formErrors.lastName ? 'border-destructive' : ''}
                        />
                        {formErrors.lastName && (
                          <p className="text-destructive text-xs mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={formErrors.email ? 'border-destructive' : ''}
                        />
                        {formErrors.email && (
                          <p className="text-destructive text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input 
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input 
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={formErrors.address ? 'border-destructive' : ''}
                        />
                        {formErrors.address && (
                          <p className="text-destructive text-xs mt-1">{formErrors.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={formErrors.city ? 'border-destructive' : ''}
                        />
                        {formErrors.city && (
                          <p className="text-destructive text-xs mt-1">{formErrors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input 
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={formErrors.state ? 'border-destructive' : ''}
                        />
                        {formErrors.state && (
                          <p className="text-destructive text-xs mt-1">{formErrors.state}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="zipCode">Zip/Postal Code</Label>
                        <Input 
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className={formErrors.zipCode ? 'border-destructive' : ''}
                        />
                        {formErrors.zipCode && (
                          <p className="text-destructive text-xs mt-1">{formErrors.zipCode}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => handleSelectChange('country', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={backToCart}
                      >
                        Back to Cart
                      </Button>
                      
                      <Button onClick={proceedToPayment}>
                        Continue to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                    
                    <div className="space-y-4 mb-4">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={getProductImage(item.product)} 
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          
                          <div className="text-sm font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax (7%)</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Payment Details */}
          {step === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <Lock className="h-4 w-4 mr-2 text-emerald-500" />
                      <span className="text-sm text-muted-foreground">Secure payment processing</span>
                    </div>
                    
                    {clientSecret ? (
                      <StripeProvider clientSecret={clientSecret}>
                        <StripeElements onSubmit={handlePaymentComplete} />
                      </StripeProvider>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin mr-2 h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Initializing payment form...</span>
                      </div>
                    )}
                    
                    <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-4 text-sm">
                      <div className="flex items-start">
                        <Lock className="h-5 w-5 text-emerald-500 mr-3 mt-0.5" />
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-300">PCI DSS Compliant</p>
                          <p className="text-emerald-700 dark:text-emerald-400 mt-1">
                            Your card information is securely processed by Stripe and never touches our servers.
                            We adhere to the highest security standards to protect your data.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={backToShipping}
                      >
                        Back to Shipping
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Summary */}
              <div>
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Order Summary</h3>
                    
                    <div className="space-y-4 mb-4">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={getProductImage(item.product)} 
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          
                          <div className="text-sm font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax (7%)</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium mb-1">Shipping to:</h4>
                      <p>{formData.firstName} {formData.lastName}</p>
                      <p>{formData.address}</p>
                      <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                      <p>{formData.country}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Order Confirmation */}
          {step === 'confirmation' && (
            <div className="max-w-3xl mx-auto">
              <Card className="bg-muted/20 backdrop-blur-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mx-auto mb-4">
                      <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Thank you for your order. We've received your purchase request and will process it shortly.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Order Details</h3>
                      <span className="text-sm text-muted-foreground">
                        Order #{Math.floor(100000 + Math.random() * 900000)}
                      </span>
                    </div>
                    
                    <div className="space-y-4 mt-4">
                      <div className="text-sm">
                        <p className="mb-1"><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                        <p className="mb-1"><span className="font-medium">Email:</span> {formData.email}</p>
                        <p className="mb-1">
                          <span className="font-medium">Shipping Address:</span> {formData.address}, {formData.city}, {formData.state} {formData.zipCode}, {formData.country}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-6">
                      You will receive an email confirmation shortly at {formData.email}
                    </p>
                    
                    <Button onClick={() => setLocation('/shop')}>
                      Continue Shopping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}