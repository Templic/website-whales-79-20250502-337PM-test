import { Fragment, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/pages/Shop";
import { Minus, Plus, ShoppingCart as CartIcon, X, CreditCard, Bitcoin, Gift, Info, Clock } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";

interface ShoppingCartProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cartItems: CartItem[];
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartTotal: number;
  paymentType?: string;
  onCheckout?: () => void;
  applyCoupon?: (code: string) => void;
  clearCart?: () => void;
}

const ShoppingCart = ({
  isOpen,
  setIsOpen,
  cartItems,
  removeFromCart,
  updateQuantity,
  cartTotal,
  paymentType = "stripe",
  onCheckout,
  applyCoupon,
  clearCart
}: ShoppingCartProps) => {
  
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const getPaymentIcon = () => {
    switch(paymentType) {
      case "paypal":
        return <CreditCard className="h-4 w-4 mr-2" />; 
      case "bitpay":
      case "opennode":
      case "coinbase":
        return <Bitcoin className="h-4 w-4 mr-2" />;
      case "stripe":
      default:
        return <CreditCard className="h-4 w-4 mr-2" />;
    }
  };

  const getPaymentLabel = () => {
    switch(paymentType) {
      case "paypal":
        return "Pay with PayPal";
      case "bitpay":
        return "Pay with BitPay";
      case "opennode":
        return "Pay with OpenNode";
      case "coinbase":
        return "Pay with Coinbase";
      case "stripe":
      default:
        return "Pay with Stripe";
    }
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
  };
  
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setIsApplyingCoupon(true);
    
    // Simulate API call
    setTimeout(() => {
      if (applyCoupon) {
        applyCoupon(couponCode);
        toast.success("Coupon applied successfully!");
      }
      setCouponCode("");
      setIsApplyingCoupon(false);
    }, 1000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <SheetContent className="w-full sm:max-w-md border-cosmic-primary/20 bg-background/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <CartIcon className="mr-2 h-5 w-5 text-cosmic-primary" />
            <span>Your Cosmic Cart</span>
          </SheetTitle>
        </SheetHeader>
        
        {/* Cart Content */}
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <SacredGeometry 
              variant="flower-of-life" 
              className="w-20 h-20 mb-4 flex items-center justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-cosmic-primary rounded-full opacity-10 animate-ping"></div>
                <div className="absolute inset-4 bg-cosmic-primary rounded-full opacity-20"></div>
                <CartIcon className="relative z-10 h-10 w-10 text-cosmic-primary" />
              </div>
            </SacredGeometry>
            <p className="text-muted-foreground text-center mb-6">Your cosmic cart is empty</p>
            <Button 
              variant="outline" 
              className="border-cosmic-primary/30"
              onClick={() => setIsOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {/* Cart Items */}
            <div className="space-y-4 max-h-[50vh] overflow-auto pr-2">
              {cartItems.map((item) => (
                <Fragment key={item.product.id}>
                  <SacredGeometry 
                    variant="dodecahedron" 
                    intensity="subtle" 
                    className="p-0 overflow-visible"
                  >
                    <div className="flex items-start p-3">
                      <div className="h-16 w-16 rounded-md overflow-hidden mr-4 flex-shrink-0 bg-muted">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatPrice(item.product.price)}</p>
                        <div className="flex items-center mt-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-2 text-xs w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-sm font-medium mt-auto">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </SacredGeometry>
                  <Separator />
                </Fragment>
              ))}
            </div>
            
            {/* Coupon Code */}
            <div className="pt-4">
              <SacredGeometry variant="vesica-piscis" intensity="subtle" className="p-2">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                  >
                    Apply
                  </Button>
                </div>
              </SacredGeometry>
            </div>
            
            {/* Cart Summary & Checkout */}
            <div className="pt-4 space-y-4">
              <SacredGeometry variant="sri-yantra" intensity="medium" animate>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shipping</span>
                    <span className="text-sm font-medium">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
              </SacredGeometry>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  className="w-full bg-cosmic-primary hover:bg-cosmic-vivid flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                >
                  {getPaymentIcon()}
                  <span>{getPaymentLabel()}</span>
                </Button>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant="link" 
                    className="text-xs px-0"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                  
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Gift className="h-3 w-3 mr-1" />
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>30-day returns</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCart;
