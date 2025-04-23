import React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Package, Truck, Home, Search, CircleCheck, CircleDashed, HelpCircle } from "lucide-react";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";

interface TrackingStep {
  id: number;
  date: string;
  time: string;
  status: string;
  location: string;
  completed: boolean;
  current?: boolean;
}

interface OrderSummary {
  orderId: string;
  trackingNumber: string;
  orderDate: string;
  estimatedDelivery: string;
  status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  statusText: string;
  lastUpdate: string;
  steps: TrackingStep[];
  senderName: string;
  recipientName: string;
  shippingAddress: string;
}

export default function OrderTrackingPage() {
  const [, setLocation] = useLocation();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingSubmitted, setTrackingSubmitted] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Sample tracking numbers for demo
  const sampleTrackingNumbers = ['TRK1234567', 'TRK7654321', 'TRK2468135'];

  const trackOrder = () => {
    if (!trackingNumber.trim()) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setTrackingSubmitted(true);
      
      // Demo tracking data - in a real app, this would come from the API
      const isValidTracking = sampleTrackingNumbers.includes(trackingNumber) || 
                             trackingNumber.startsWith('TRK');
      
      if (isValidTracking) {
        // Generate a mock order with tracking steps
        const currentDate = new Date();
        
        // Randomize the order status based on the tracking number
        const statusOptions = ['processing', 'shipped', 'out_for_delivery', 'delivered'] as const;
        const randomStatus = trackingNumber === 'TRK1234567' 
          ? 'delivered' 
          : trackingNumber === 'TRK7654321'
            ? 'out_for_delivery'
            : statusOptions[Math.floor(Math.random() * (statusOptions.length - 1))];
        
        // Set up tracking steps based on the status
        const allSteps: TrackingStep[] = [
          {
            id: 1,
            date: formatDate(subtractDays(currentDate, 3)),
            time: '10:30 AM',
            status: 'Order Placed',
            location: 'Online',
            completed: true
          },
          {
            id: 2,
            date: formatDate(subtractDays(currentDate, 2)),
            time: '2:15 PM',
            status: 'Order Processed',
            location: 'Cosmic Warehouse, CA',
            completed: randomStatus !== 'processing'
          },
          {
            id: 3,
            date: formatDate(subtractDays(currentDate, 1)),
            time: '9:45 AM',
            status: 'Shipped',
            location: 'Cosmic Warehouse, CA',
            completed: ['shipped', 'out_for_delivery', 'delivered'].includes(randomStatus)
          },
          {
            id: 4,
            date: formatDate(currentDate),
            time: '8:20 AM',
            status: 'Out for Delivery',
            location: 'Local Distribution Center',
            completed: ['out_for_delivery', 'delivered'].includes(randomStatus)
          },
          {
            id: 5,
            date: formatDate(currentDate),
            time: '3:30 PM',
            status: 'Delivered',
            location: 'Recipient Address',
            completed: randomStatus === 'delivered'
          }
        ];
        
        // Mark the current step
        const currentStepIndex = allSteps.findIndex(step => !step.completed);
        if (currentStepIndex >= 0) {
          allSteps[currentStepIndex].current = true;
        } else if (randomStatus === 'delivered') {
          // If all steps are completed, mark the last one as current
          allSteps[allSteps.length - 1].current = true;
        }
        
        setOrderSummary({
          orderId: `ORD${Math.floor(100000 + Math.random() * 900000)}`,
          trackingNumber,
          orderDate: formatDate(subtractDays(currentDate, 3)),
          estimatedDelivery: formatDate(addDays(currentDate, randomStatus === 'delivered' ? 0 : 2)),
          status: randomStatus,
          statusText: getStatusText(randomStatus),
          lastUpdate: `${formatDate(currentDate)} at ${formatTime(currentDate)}`,
          steps: allSteps,
          senderName: 'Cosmic Store',
          recipientName: 'Jane Smith',
          shippingAddress: '123 Cosmic Way, Stardust City, CA 90210, United States'
        });
      } else {
        setOrderSummary(null);
      }
      
      setLoading(false);
    }, 1200);
  };

  const resetTracking = () => {
    setTrackingNumber('');
    setTrackingSubmitted(false);
    setOrderSummary(null);
  };

  // Helper functions for dates
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function subtractDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - days);
    return newDate;
  }

  function addDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'shipped': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'out_for_delivery': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
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
              Back to Shop
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500 mb-2">
            Track Your Order
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Enter your tracking number to get real-time updates on your shipment status.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="bg-muted/20 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter your tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <HelpCircle className="h-3 w-3 mr-1 cursor-pointer" onClick={() => setShowHelp(true)} />
                    <span>Try sample tracking numbers: TRK1234567, TRK7654321</span>
                  </div>
                </div>
                <Button
                  className="shrink-0"
                  onClick={trackOrder}
                  disabled={!trackingNumber.trim() || loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {trackingSubmitted && (
            <>
              {orderSummary ? (
                <div className="space-y-8">
                  {/* Order Summary */}
                  <Card className="bg-muted/20 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                          <h2 className="text-lg font-medium mb-1">Shipment Status</h2>
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-sm border inline-flex items-center gap-1.5 ${getStatusColor(orderSummary.status)}`}>
                              {orderSummary.status === 'delivered' && <CircleCheck className="h-3.5 w-3.5" />}
                              {orderSummary.statusText}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">Tracking Number</div>
                          <div className="font-medium">{orderSummary.trackingNumber}</div>
                          <div className="text-xs text-muted-foreground mt-1">Order #{orderSummary.orderId}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Order Date</div>
                          <div>{orderSummary.orderDate}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Estimated Delivery</div>
                          <div>{orderSummary.estimatedDelivery}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
                          <div>{orderSummary.lastUpdate}</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">From</div>
                            <div className="font-medium">{orderSummary.senderName}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">To</div>
                            <div className="font-medium">{orderSummary.recipientName}</div>
                            <div className="text-sm mt-1">{orderSummary.shippingAddress}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-4">Tracking History</h3>
                        <div className="relative">
                          {/* Vertical line connecting tracking steps */}
                          <div className="absolute left-6 top-8 h-[calc(100%-4rem)] w-px bg-border"></div>
                          
                          {/* Tracking steps */}
                          <div className="space-y-8">
                            {orderSummary.steps.map((step) => (
                              <div key={step.id} className="flex gap-4">
                                <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                                  <div className={`absolute inset-0 rounded-full ${step.completed ? (step.current ? 'bg-primary/10' : 'bg-muted') : 'bg-muted'}`}></div>
                                  {step.id === 1 && (
                                    <Package className={`h-5 w-5 relative z-10 ${step.completed ? (step.current ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground/50'}`} />
                                  )}
                                  {step.id === 2 && (
                                    <Package className={`h-5 w-5 relative z-10 ${step.completed ? (step.current ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground/50'}`} />
                                  )}
                                  {step.id === 3 && (
                                    <Truck className={`h-5 w-5 relative z-10 ${step.completed ? (step.current ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground/50'}`} />
                                  )}
                                  {step.id === 4 && (
                                    <Truck className={`h-5 w-5 relative z-10 ${step.completed ? (step.current ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground/50'}`} />
                                  )}
                                  {step.id === 5 && (
                                    <Home className={`h-5 w-5 relative z-10 ${step.completed ? (step.current ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground/50'}`} />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex flex-wrap justify-between mb-1">
                                    <h4 className={`font-medium ${step.current ? 'text-primary' : ''}`}>{step.status}</h4>
                                    <div className="text-sm text-muted-foreground">{step.date}, {step.time}</div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{step.location}</p>
                                  
                                  {step.current && (
                                    <div className="mt-2 text-sm">
                                      {step.status === 'Order Placed' && (
                                        <p className="text-muted-foreground">Your order has been received and is being prepared for processing.</p>
                                      )}
                                      {step.status === 'Order Processed' && (
                                        <p className="text-muted-foreground">Your order has been processed and is being prepared for shipping.</p>
                                      )}
                                      {step.status === 'Shipped' && (
                                        <p className="text-muted-foreground">Your order has been shipped and is on its way to you.</p>
                                      )}
                                      {step.status === 'Out for Delivery' && (
                                        <p className="text-muted-foreground">Your order is out for delivery and will arrive soon.</p>
                                      )}
                                      {step.status === 'Delivered' && (
                                        <p className="text-emerald-500">Your order has been delivered. Thank you for shopping with us!</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={resetTracking}
                    >
                      Track Another Order
                    </Button>
                    
                    <Button
                      onClick={() => setLocation(`/shop/order/${orderSummary.orderId}`)}
                    >
                      View Order Details
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="bg-muted/20 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
                      <CircleDashed className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-medium mb-2">Tracking Information Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                      We couldn't find any information for tracking number: <span className="font-medium">{trackingNumber}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Please check if the tracking number is correct and try again, or contact our customer support for assistance.
                    </p>
                    <Button
                      onClick={resetTracking}
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Track Your Order</DialogTitle>
            <DialogDescription>
              Here's how to find and use your tracking number:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Where to find your tracking number</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>In your order confirmation email</li>
                <li>In your account order history</li>
                <li>In your shipping confirmation email</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Tracking number format</h3>
              <p className="text-sm text-muted-foreground">
                Our tracking numbers typically start with "TRK" followed by 7 digits (e.g., TRK1234567).
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Sample tracking numbers</h3>
              <p className="text-sm text-muted-foreground">
                For this demo, you can try these tracking numbers:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li><code>TRK1234567</code> - Delivered order</li>
                <li><code>TRK7654321</code> - Order out for delivery</li>
                <li><code>TRK2468135</code> - Order in transit</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Need help?</h3>
              <p className="text-sm text-muted-foreground">
                If you're having trouble with tracking your order, please contact our customer support
                at support@example.com or call us at (555) 123-4567.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}