import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CartItem, Coupon } from '@/types/cart';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import CosmicButton from '@/components/ui/cosmic-button';

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
  const { toast } = useToast();
  
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
        });
      } else {
        toast({
          title: 'Invalid coupon',
          description: 'The coupon code you entered is invalid or has expired.',
          variant: 'destructive',
        });
      }
    } catch (error) {
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
    <Card className="cosmic-glass-card">
      <CardHeader>
        <CardTitle className="cosmic-gradient-text">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
          
          {appliedCoupon && appliedCoupon.isValid && (
            <div className="flex justify-between text-sm font-medium text-green-600">
              <span className="flex items-center">
                Discount
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 ml-2 text-xs"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </Button>
              </span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-medium text-lg">
          <span>Total</span>
          <span className="cosmic-gradient-text font-bold">{formatCurrency(total)}</span>
        </div>
        
        {onApplyCoupon && (
          <div className="pt-4">
            <p className="text-sm mb-2">Have a coupon?</p>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="cosmic-glass-field"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim() || isApplying}
                className="shrink-0 cosmic-hover-glow"
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <CosmicButton
          onClick={onCheckout}
          className="w-full"
          disabled={items.length === 0}
          variant="cosmic"
        >
          Proceed to Checkout
        </CosmicButton>
      </CardFooter>
    </Card>
  );
};

export default CartSummary;