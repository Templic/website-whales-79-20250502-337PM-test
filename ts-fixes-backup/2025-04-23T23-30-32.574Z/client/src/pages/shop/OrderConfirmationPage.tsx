import React from "react";
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Download, Calendar, Clock, MapPin, CreditCard, CircleCheck, Mail } from "lucide-react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { Product } from "../ShopPage";

interface OrderDetails {
  orderId: string;
  orderDate: string;
  orderTime: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  items: {
    product: Product;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  estimatedDelivery: string;
  trackingNumber?: string;
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/shop/order/:orderId');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading order details
    setLoading(true);
    
    // In a real app, we would fetch order details from the API
    // For now, we'll use mock data
    setTimeout(() => {
      if (params?.orderId) {
        // Generate a mock order
        const mockOrder: OrderDetails = {
          orderId: params.orderId,
          orderDate: new Date().toLocaleDateString(),
          orderTime: new Date().toLocaleTimeString(),
          customerName: "Jane Smith",
          customerEmail: "jane.smith@example.com",
          shippingAddress: {
            address: "123 Cosmic Way",
            city: "Stardust City",
            state: "CA",
            zipCode: "90210",
            country: "United States"
          },
          paymentMethod: "Credit Card (●●●● ●●●● ●●●● 4242)",
          items: [
            {
              product: {
                id: "prod-1",
                name: "Celestial Crystal Sound Bowl",
                description: "Hand-crafted crystal bowl tuned to 432Hz frequency for deep healing vibrations.",
                price: 129.99,
                image: "/images/products/samples/crystal-bowl.jpg",
                rating: 4.8,
                inStock: true,
                categories: ["Healing Tools", "Sound Therapy"]
              },
              quantity: 1,
              price: 129.99
            },
            {
              product: {
                id: "prod-3",
                name: "Cosmic Frequency Digital Album",
                description: "A collection of 12 tracks specifically designed to activate different energy centers.",
                price: 18.99,
                image: "/images/products/samples/album-cover.jpg",
                rating: 4.9,
                inStock: true,
                categories: ["Digital", "Music"]
              },
              quantity: 1,
              price: 18.99
            }
          ],
          subtotal: 148.98,
          tax: 10.43,
          shipping: 0,
          discount: 14.90,
          total: 144.51,
          estimatedDelivery: "April 15-18, 2025",
          trackingNumber: "TRK" + Math.floor(1000000 + Math.random() * 9000000),
          orderStatus: "processing"
        };
        
        setOrder(mockOrder);
      }
      setLoading(false);
    }, 1000);
  }, [params?.orderId]);

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
    ];
    
    // Check for keyword matches in name or description
    for (const type of productTypes) {
      if (type.keywords.some(keyword => combinedText.includes(keyword))) {
        return type.image;
      }
    }
    
    return '/images/products/samples/crystal-bowl.jpg';
  };

  const getOrderStatusStyles = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'shipped':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  const printOrder = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CosmicBackground opacity={0.2} />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <CosmicBackground opacity={0.2} />
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the order you're looking for.</p>
        <Button 
          variant="default" 
          onClick={() => setLocation('/shop')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.2} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
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
              Order Confirmation
            </h1>
            
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={printOrder}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => window.location.href = `mailto:support@example.com?subject=Question about order ${order.orderId}`}
              >
                <Mail className="h-4 w-4" />
                Email Receipt
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="bg-muted/20 backdrop-blur-sm overflow-hidden mb-8">
            <div className="h-2 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                  <div className="flex items-center mb-1">
                    <CircleCheck className="h-5 w-5 text-emerald-500 mr-2" />
                    <h2 className="text-lg font-medium">Thank you for your order!</h2>
                  </div>
                  <p className="text-muted-foreground">
                    Your order has been confirmed and will be processed soon.
                  </p>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm border ${getOrderStatusStyles(order.orderStatus)}`}>
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Order Date</span>
                  </div>
                  <p>{order.orderDate}</p>
                  <p className="text-sm text-muted-foreground">{order.orderTime}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Expected Delivery</span>
                  </div>
                  <p>{order.estimatedDelivery}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Shipping To</span>
                  </div>
                  <p className="truncate">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground truncate">{order.shippingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Method</span>
                  </div>
                  <p>{order.paymentMethod}</p>
                  {order.trackingNumber && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">Tracking Number</div>
                      <p className="text-sm font-mono">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden mb-6">
                <div className="grid grid-cols-[1fr,auto] sm:grid-cols-[2fr,1fr,1fr,1fr] gap-4 p-4 bg-muted/30 text-sm">
                  <div>Item</div>
                  <div className="hidden sm:block text-right">Price</div>
                  <div className="hidden sm:block text-right">Quantity</div>
                  <div className="text-right">Total</div>
                </div>
                
                {order.items.map((item, index) => (
                  <div 
                    key={index}
                    className="grid grid-cols-[1fr,auto] sm:grid-cols-[2fr,1fr,1fr,1fr] gap-4 p-4 border-t items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={getProductImage(item.product)} 
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div>
                        <p className="font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 sm:hidden">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block text-right">
                      ${item.price.toFixed(2)}
                    </div>
                    
                    <div className="hidden sm:block text-right">
                      {item.quantity}
                    </div>
                    
                    <div className="text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="sm:flex justify-between items-start">
                <div className="mb-6 sm:mb-0 max-w-xs">
                  <h3 className="font-medium mb-2">Order Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Thank you for shopping with us! If you have any questions about your order, please contact our customer service team.
                  </p>
                </div>
                
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* What happens next */}
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">What happens next?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 mt-2">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Order Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    You will receive an email confirmation shortly at {order.customerEmail}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 mt-2">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Order Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    We're preparing your items for shipping. You'll receive a notification when your order is shipped.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 mt-2">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">Order Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: {order.estimatedDelivery}. Track your order with the tracking number provided.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-4">
              Questions about your order? <a href="#" className="text-primary hover:underline">Contact our support team</a>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => setLocation('/shop')}>Continue Shopping</Button>
              <Button variant="outline" onClick={() => setLocation('/shop/track-order')}>
                Track Your Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional icons for the order confirmation page
function Package(props$2 {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function Truck(props$2 {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65A2 2 0 0 0 21.71 12l-2.5-4.17A2 2 0 0 0 17.5 7H14" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )
}