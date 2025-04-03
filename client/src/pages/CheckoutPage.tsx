import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { CartItem, ShippingInfo } from '@/types/cart';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { createPaymentIntent, processOrder } from '@/lib/paymentService';
import StripeProvider from '@/components/shop/payment/StripeProvider';

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShoppingCart, CreditCard, ArrowLeft } from 'lucide-react';
import CosmicButton from '@/components/ui/cosmic-button';

import StripeElements from '@/components/shop/payment/StripeElements';

const shippingFormSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required'),
  useShippingForBilling: z.boolean().default(true),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('shipping');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | undefined>();
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  
  // Create form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
      email: '',
      useShippingForBilling: true,
    },
  });
  
  useEffect(() => {
    setIsClientLoaded(true);
    document.title = 'Checkout - Dale Loves Whales';
  }, []);
  
  // Fetch cart items
  const { 
    data: cartData, 
    isLoading: isCartLoading, 
    isError: isCartError,
  } = useQuery<{ cart: any; items: CartItem[] }>({
    queryKey: ['/api/cart'],
    enabled: isClientLoaded,
  });
  
  // Get cart items and calculate totals
  const cartItems = cartData?.items || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + shipping + tax;
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/orders', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (data) => {
      setOrderPlaced(true);
      setOrderId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Order Placed',
        description: `Your order #${data.orderNumber} has been placed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle shipping form submission
  const onShippingSubmit = async (data: ShippingFormValues) => {
    // Create a payment intent when moving to payment
    try {
      setIsCreatingPaymentIntent(true);
      
      // Create payment intent
      const paymentIntentResponse = await createPaymentIntent({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          customer_email: data.email,
          customer_name: `${data.firstName} ${data.lastName}`
        }
      });
      
      setClientSecret(paymentIntentResponse.clientSecret);
      // Move to payment tab if shipping form is valid
      setActiveTab('payment');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment system',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };
  
  // Handle payment submission
  const onPaymentSubmit = async (paymentMethodId: string): Promise<void> => {
    const shippingData = form.getValues();
    
    const orderData = {
      billingAddress: shippingData.useShippingForBilling
        ? {
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            address1: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.postalCode,
            country: shippingData.country,
            email: shippingData.email,
            phone: shippingData.phone,
          }
        : {
            // If different billing address is used, you would have another form for this
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            address1: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.postalCode,
            country: shippingData.country,
            email: shippingData.email,
            phone: shippingData.phone,
          },
      shippingAddress: {
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        address1: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        postalCode: shippingData.postalCode,
        country: shippingData.country,
        email: shippingData.email,
        phone: shippingData.phone,
      },
      paymentMethod: 'credit_card',
      paymentMethodId: paymentMethodId,
      amount: total,
      items: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    try {
      const result = await processOrder(orderData, paymentMethodId);
      
      if (result.success) {
        setOrderId(result.orderId);
        setOrderPlaced(true);
        queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        toast({
          title: 'Order Placed',
          description: `Your order has been placed successfully.`,
        });
      } else {
        throw new Error('Failed to process order');
      }
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
      throw error; // Re-throw to let Stripe Elements handle the error UI
    }
  };
  
  // Navigate to cart
  const handleBackToCart = () => {
    setLocation('/shop/cart');
  };
  
  // Navigate to shop
  const handleContinueShopping = () => {
    setLocation('/shop');
  };
  
  // Navigate to order details
  const handleViewOrder = () => {
    if (orderId) {
      setLocation(`/shop/orders/${orderId}`);
    }
  };
  
  // If still loading
  if (!isClientLoaded || isCartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
        <p className="text-lg">Loading checkout...</p>
      </div>
    );
  }
  
  // If error loading cart
  if (isCartError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load cart data</p>
          <Button onClick={handleBackToCart} className="cosmic-hover-glow">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </div>
      </div>
    );
  }
  
  // If cart is empty
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2 cosmic-gradient-text">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            You need to add items to your cart before checkout.
          </p>
          <Button 
            onClick={handleContinueShopping}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 cosmic-hover-glow"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }
  
  // If order has been placed successfully
  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 cosmic-gradient-text">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been placed successfully.
            {orderId && <span> Order ID: {orderId}</span>}
          </p>
          <div className="space-y-4">
            {orderId && (
              <Button onClick={handleViewOrder} className="w-full cosmic-hover-glow">
                View Order Details
              </Button>
            )}
            <Button onClick={handleContinueShopping} variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold cosmic-gradient-text">Checkout</h1>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="payment" disabled={!form.formState.isValid}>
                Payment
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shipping">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} className="cosmic-glass-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} className="cosmic-glass-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your.email@example.com" 
                                {...field}
                                className="cosmic-glass-field"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123 Main St" 
                                {...field}
                                className="cosmic-glass-field"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} className="cosmic-glass-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State / Province</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} className="cosmic-glass-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} className="cosmic-glass-field" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="cosmic-glass-field">
                                    <SelectValue placeholder="Select a country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="US">United States</SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                  <SelectItem value="GB">United Kingdom</SelectItem>
                                  <SelectItem value="AU">Australia</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="(123) 456-7890" 
                                {...field}
                                className="cosmic-glass-field"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="useShippingForBilling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Use shipping address for billing</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleBackToCart}
                          className="cosmic-hover-glow"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Cart
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 cosmic-hover-glow"
                        >
                          Continue to Payment
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit or Debit Card</span>
                  </div>
                  
                  {isCreatingPaymentIntent ? (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span>Preparing payment form...</span>
                    </div>
                  ) : (
                    <StripeProvider clientSecret={clientSecret}>
                      <StripeElements onSubmit={onPaymentSubmit} />
                    </StripeProvider>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Your payment information is secure and encrypted.</p>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab('shipping')}
                      className="cosmic-hover-glow"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Shipping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-8 lg:mt-0">
          <Card className="cosmic-glass-card">
            <CardHeader>
              <CardTitle className="cosmic-gradient-text">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-2">
                    <div className="flex-1">
                      <p>{item.name} <span className="text-muted-foreground">× {item.quantity}</span></p>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Tax (7%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span className="cosmic-gradient-text font-bold">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}