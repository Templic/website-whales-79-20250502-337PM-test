import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, CreditCard, Loader2, LockIcon, Package, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CartItem, Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import CosmicHeading from '@/components/ui/cosmic-heading';
import { CosmicButton } from '@/components/ui/cosmic-button';
import CosmicCard from '@/components/ui/cosmic-card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface CartWithItems {
  id: number;
  userId: number | null;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: (CartItem & { product: Product })[];
}

// Form schemas
const shippingFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Please enter a valid address" }),
  city: z.string().min(2, { message: "Please enter a valid city" }),
  state: z.string().min(2, { message: "Please enter a valid state" }),
  zipCode: z.string().min(5, { message: "Please enter a valid zip code" }),
  country: z.string().min(2, { message: "Please enter a valid country" }),
  saveAddress: z.boolean().optional(),
});

const paymentFormSchema = z.object({
  cardholderName: z.string().min(3, { message: "Cardholder name must be at least 3 characters" }),
  cardNumber: z.string().refine(
    (val) => /^\d{16}$/.test(val.replace(/\s/g, '')), 
    { message: "Please enter a valid 16-digit card number" }
  ),
  expiryDate: z.string().refine(
    (val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), 
    { message: "Please enter a valid expiry date (MM/YY)" }
  ),
  cvc: z.string().refine(
    (val) => /^\d{3,4}$/.test(val), 
    { message: "Please enter a valid CVC code (3-4 digits)" }
  ),
  saveCard: z.boolean().optional(),
});

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("shipping");
  const [orderComplete, setOrderComplete] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form setup
  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      saveAddress: false,
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
      saveCard: false,
    },
  });

  // Update shipping form when user data loads
  useEffect(() => {
    if (user) {
      shippingForm.setValue('firstName', user.firstName || "");
      shippingForm.setValue('lastName', user.lastName || "");
      shippingForm.setValue('email', user.email || "");
    }
  }, [user, shippingForm]);

  useEffect(() => {
    document.title = "Checkout - Dale Loves Whales Shop";
  }, []);

  // Fetch cart and items
  const { 
    data: cart, 
    isLoading: cartLoading, 
    isError: cartError 
  } = useQuery({
    queryKey: ['/api/shop/cart'],
    queryFn: async () => {
      const response = await apiRequest<CartWithItems>('/api/shop/cart');
      return response;
    },
    enabled: !orderComplete,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: {
      shippingDetails: z.infer<typeof shippingFormSchema>;
      paymentMethod: string;
      paymentDetails: Record<string, any>;
    }) => {
      return apiRequest('/api/shop/orders', {
        method: 'POST',
        data
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed",
        description: "Your order has been successfully placed",
        variant: "success",
      });
      setOrderId(data.orderId);
      setOrderComplete(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place your order. Please try again",
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

  // Form submission handlers
  const onShippingSubmit = (data: z.infer<typeof shippingFormSchema>) => {
    // Save shipping information and move to payment tab
    setActiveTab("payment");
  };

  const onPaymentSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    // Create order with shipping and payment details
    createOrderMutation.mutate({
      shippingDetails: shippingForm.getValues(),
      paymentMethod: "credit_card",
      paymentDetails: {
        ...data,
        // Don't send full card number to backend in a real implementation
        // This would be handled by a payment processor like Stripe
        cardNumber: data.cardNumber.replace(/\d(?=\d{4})/g, "*"), 
      }
    });
  };

  // Loading state
  if (cartLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Empty cart redirect
  if ((!cart?.items || cart.items.length === 0) && !orderComplete) {
    useEffect(() => {
      navigate('/shop/cart');
    }, []);
    
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Order Complete View
  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CosmicCard variant="glow" className="max-w-3xl mx-auto p-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-900 bg-opacity-20 mb-6">
              <Package className="h-10 w-10 text-green-500" />
            </div>
            
            <CosmicHeading as="h1" size="2xl" weight="bold" className="mb-2">
              Order Confirmed
            </CosmicHeading>
            
            <p className="text-lg mb-2">
              Thank you for your purchase!
            </p>
            
            <p className="text-muted-foreground mb-8">
              Your order #{orderId} has been placed and is being processed.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Link href="/shop">
                <CosmicButton variant="outline">
                  Continue Shopping
                </CosmicButton>
              </Link>
              
              <Link href={`/shop/orders/${orderId}`}>
                <CosmicButton variant="cosmic">
                  View Order Details
                </CosmicButton>
              </Link>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address. 
              If you have any questions, please contact our customer support team.
            </p>
          </div>
        </CosmicCard>
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
          We couldn't load your cart information. Please try again.
        </p>
        <Link href="/shop/cart">
          <CosmicButton variant="cosmic">
            Return to Cart
          </CosmicButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CosmicHeading as="h1" size="2xl" weight="bold" className="mb-8">
        Checkout
      </CosmicHeading>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Form */}
        <div className="lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="shipping" className="data-[state=active]:bg-cosmic-primary">
                <Truck className="mr-2 h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="data-[state=active]:bg-cosmic-primary"
                disabled={!shippingForm.formState.isValid || activeTab !== "payment"}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Payment
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shipping">
              <CosmicCard variant="glow" className="p-6">
                <CosmicHeading as="h2" size="lg" weight="medium" className="mb-6">
                  Shipping Information
                </CosmicHeading>
                
                <Form {...shippingForm}>
                  <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={shippingForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={shippingForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={shippingForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={shippingForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={shippingForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={shippingForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={shippingForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={shippingForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP / Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={shippingForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {user && (
                      <FormField
                        control={shippingForm.control}
                        name="saveAddress"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Save this address for future orders</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="flex justify-between pt-4">
                      <Link href="/shop/cart">
                        <CosmicButton variant="outline" type="button">
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back to Cart
                        </CosmicButton>
                      </Link>
                      
                      <CosmicButton 
                        variant="cosmic" 
                        type="submit"
                      >
                        Continue to Payment
                      </CosmicButton>
                    </div>
                  </form>
                </Form>
              </CosmicCard>
            </TabsContent>
            
            <TabsContent value="payment">
              <CosmicCard variant="glow" className="p-6">
                <CosmicHeading as="h2" size="lg" weight="medium" className="mb-6">
                  Payment Method
                </CosmicHeading>
                
                <div className="flex items-center mb-6">
                  <LockIcon className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Your payment information is secured with SSL encryption
                  </span>
                </div>
                
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                    <FormField
                      control={paymentForm.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="1234 5678 9012 3456"
                              onChange={(e) => {
                                // Format card number with spaces
                                const value = e.target.value.replace(/\s/g, '');
                                const formattedValue = value
                                  .replace(/\D/g, '')
                                  .replace(/(\d{4})(?=\d)/g, '$1 ');
                                field.onChange(formattedValue);
                              }}
                              maxLength={19} // 16 digits + 3 spaces
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (MM/YY)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="MM/YY"
                                onChange={(e) => {
                                  // Format expiry date
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 2) {
                                    field.onChange(value);
                                  } else {
                                    field.onChange(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                                  }
                                }}
                                maxLength={5} // MM/YY
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={paymentForm.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="text"
                                inputMode="numeric"
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                                maxLength={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {user && (
                      <FormField
                        control={paymentForm.control}
                        name="saveCard"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Save this card for future payments</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="flex justify-between pt-4">
                      <CosmicButton 
                        variant="outline" 
                        type="button"
                        onClick={() => setActiveTab("shipping")}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Shipping
                      </CosmicButton>
                      
                      <CosmicButton 
                        variant="cosmic" 
                        type="submit"
                        disabled={createOrderMutation.isPending}
                      >
                        {createOrderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Order
                          </>
                        )}
                      </CosmicButton>
                    </div>
                  </form>
                </Form>
              </CosmicCard>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <CosmicCard variant="glow" className="p-6 sticky top-24">
            <CosmicHeading as="h2" size="lg" weight="bold" className="mb-4">
              Order Summary
            </CosmicHeading>
            
            <div className="space-y-4 mb-6">
              {cart?.items.map((item) => {
                const price = item.product.salePrice 
                  ? parseFloat(item.product.salePrice as string) 
                  : parseFloat(item.product.price as string);
                
                return (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="h-12 w-12 overflow-hidden rounded border border-gray-700 mr-3">
                        <img 
                          src={Array.isArray(item.product.images) && item.product.images.length > 0
                            ? item.product.images[0]
                            : '/placeholder-product.jpg'
                          }
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[150px]">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <Separator className="my-4" />
            
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
          </CosmicCard>
        </div>
      </div>
    </div>
  );
}