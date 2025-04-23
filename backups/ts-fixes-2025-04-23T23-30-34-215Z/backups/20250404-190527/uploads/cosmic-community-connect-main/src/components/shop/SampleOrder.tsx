
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Order, ShippingAddress } from "../shop/collaborative/types";
import { CartItem } from "@/pages/Shop";
import { formatPrice } from "@/lib/utils";

interface SampleOrderProps {
  cartItems: CartItem[];
  clearCart: () => void;
  paymentType: string;
}

const SampleOrder = ({ cartItems, clearCart, paymentType }: SampleOrderProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Sample user data - in a real app this would come from auth context
  const sampleUser = {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com"
  };

  // Sample shipping address
  const shippingAddress: ShippingAddress = {
    fullName: "John Doe",
    street: "123 Cosmic Lane",
    city: "Starville",
    state: "Universe",
    zipCode: "12345",
    country: "Earth"
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate an API call to create an order
    setTimeout(() => {
      // Create sample order
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        userId: sampleUser.id,
        items: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image
        })),
        total: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        status: 'completed',
        shippingAddress,
        paymentMethod: paymentType,
        createdAt: new Date()
      };

      console.log("Order created:", newOrder);
      
      setIsProcessing(false);
      setOrderComplete(true);
      
      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${newOrder.id} has been created.`,
      });
      
      // Clear the cart after successful order
      clearCart();
    }, 2000);
  };

  if (orderComplete) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-cosmic-primary/20 rounded-full flex items-center justify-center mx-auto">
          <div className="w-12 h-12 bg-cosmic-primary rounded-full flex items-center justify-center text-white">
            ✓
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Thank You for Your Order!</h2>
        <p className="text-muted-foreground">Your order has been successfully placed.</p>
        <div className="mt-6">
          <Button onClick={() => setOrderComplete(false)} variant="outline">
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background/80 backdrop-blur-sm rounded-lg border border-cosmic-primary/20">
      <h2 className="text-xl font-semibold text-cosmic-primary">Order Summary</h2>
      
      {cartItems.length === 0 ? (
        <p className="text-muted-foreground">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPrice(item.product.price)}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          
          <div className="border-t border-cosmic-primary/10 pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {formatPrice(
                  cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-semibold mt-4">
              <span>Total</span>
              <span>
                {formatPrice(
                  cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
                )}
              </span>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{shippingAddress.fullName}</p>
              <p>{shippingAddress.street}</p>
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Payment Method</h3>
            <p className="text-xs text-muted-foreground capitalize">{paymentType}</p>
          </div>
          
          <Button 
            className="w-full bg-cosmic-primary hover:bg-cosmic-vivid"
            disabled={isProcessing}
            onClick={handlePlaceOrder}
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </Button>
        </>
      )}
    </div>
  );
};

export default SampleOrder;
