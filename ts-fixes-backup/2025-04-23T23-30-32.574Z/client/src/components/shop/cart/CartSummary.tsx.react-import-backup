import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Gift, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';

// Define types for the component
interface ProductOption {
  name: string;
  value: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: ProductOption[];
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isValid: boolean;
}

// Format currency utility function
const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface CartSummaryProps {
  items: CartItem[];
  onApplyCoupon?: (code: string) => Promise<Coupon | null>;
  onCheckout: () => void;
}

export const CartSummary = ({ 
  items, 
  onApplyCoupon, 
  onCheckout 
}: CartSummaryProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const { toast } = useToast();

  // Add animation effect after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const tax = subtotal * 0.07; // 7% tax

  // Apply coupon discount if present
  let discountAmount = 0;
  if (appliedCoupon && appliedCoupon.isValid) {
    discountAmount = appliedCoupon.type === 'percentage' 
      ? subtotal * (appliedCoupon.discount / 100)
      : appliedCoupon.discount;
  }

  const total = subtotal + shipping + tax - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;

    setIsApplying(true);

    try {
      const coupon = await onApplyCoupon(couponCode);

      if (coupon && coupon.isValid) {
        setAppliedCoupon(coupon);
        toast({
          title: 'Coupon applied',
          description: `${coupon.type === 'percentage' ? `${coupon.discount}% discount` : `${formatCurrency(coupon.discount)} discount`} has been applied to your order.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Invalid coupon',
          description: 'The coupon code you entered is invalid or has expired.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Error applying coupon',
        description: 'There was an error applying your coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: 'Coupon removed',
      description: 'The coupon has been removed from your order.',
    });
  };

  return (
    <div className={`cosmic-slide-in ${isAnimated ? 'in' : ''}`}>
      <Card className="cosmic-glass-card cosmic-box-shadow">
        <CardHeader className="space-y-1">
          <div className="h-1.5 w-full bg-gradient-to-r from-cosmic-primary/20 via-cosmic-primary to-cosmic-primary/20 rounded-full mb-2 animate-pulse-slow" />
          <CardTitle className="cosmic-gradient-text flex items-center">
            <Sparkles className="w-5 h-5 mr-2 opacity-80" />
            Order Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3 p-3 rounded-lg bg-background/60 backdrop-blur-sm shadow-inner">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? (
                  <span className="text-green-500 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Free
                  </span>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (7%)</span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>

            {appliedCoupon && appliedCoupon.isValid && (
              <div className="flex justify-between text-sm font-medium text-green-500">
                <span className="flex items-center">
                  <Gift className="h-3 w-3 mr-1" />
                  Discount
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-2 ml-2 text-xs hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveCoupon}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>

          <Separator className="cosmic-divider" />

          <div className="flex justify-between font-medium text-lg p-2 rounded-lg bg-background/60">
            <span>Total</span>
            <span className="cosmic-gradient-text font-bold animate-pulse-gentle">{formatCurrency(total)}</span>
          </div>

          {onApplyCoupon && (
            <div className="pt-3">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="h-4 w-4 text-cosmic-primary" />
                <p className="text-sm">Have a coupon?</p>
              </div>
              <div className="cosmic-glass-panel p-2 rounded-lg">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="cosmic-glass-field border-cosmic-primary/30 focus-visible:ring-cosmic-primary/50"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplying}
                    className="shrink-0 cosmic-hover-glow bg-cosmic-primary hover:bg-cosmic-primary/80"
                  >
                    {isApplying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 px-2 text-xs text-muted-foreground mt-2">
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>Free Returns</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>Encrypted Data</span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={onCheckout}
            className="w-full bg-cosmic-primary hover:bg-cosmic-primary/90 text-white font-medium cosmic-hover-glow"
            disabled={items.length === 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CartSummary;