import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus, Loader2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Define types for the component
interface ProductOption {
  name: string;
  value: string;
}

interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: ProductOption[];
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
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

export const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: CartItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [isAnimated, setIsAnimated] = useState(false);
  
  // Add animation after component mounts for entrance effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate item total
  const itemTotal = item.price * item.quantity;
  
  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    setQuantity(newQuantity);
  };
  
  // Handle quantity update
  const handleUpdateQuantity = async () => {
    if (quantity === item.quantity) return;
    setIsUpdating(true);
    await onUpdateQuantity(item.id, quantity);
    setIsUpdating(false);
  };
  
  // Handle increment/decrement
  const incrementQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };
  
  const decrementQuantity = () => {
    if (quantity <= 1) return;
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };
  
  // Handle remove
  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(item.id);
    setIsRemoving(false);
  };
  
  return (
    <div className={`cosmic-slide-up ${isAnimated ? 'in' : ''}`}>
      <Card className="overflow-hidden cosmic-glass-card cosmic-hover-glow">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Product Image */}
            <div className="w-full sm:w-32 md:w-40 h-32 sm:h-auto bg-muted/30 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="text-muted-foreground">No Image</div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 p-4">
              <div className="flex flex-col md:flex-row md:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold cosmic-gradient-text">{item.name}</h3>
                  
                  {/* Product Options */}
                  {item.options && item.options.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {item.options.map((option: { name: string; value: string }, idx: number) => (
                        <p key={idx} className="cosmic-text muted">
                          {option.name}: {option.value}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Price */}
                  <div>
                    <span className="text-sm font-medium">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="px-0 h-8 text-muted-foreground hover:text-destructive cosmic-hover-glow"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-sm">Remove</span>
                  </Button>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end space-y-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 border border-cosmic-primary/30 rounded-full p-1 bg-background/60 backdrop-blur-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full cosmic-active-scale"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1 || isUpdating}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={handleUpdateQuantity}
                      className="h-7 w-12 text-center cosmic-glass-field border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={isUpdating}
                    />
                    
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 rounded-full cosmic-active-scale"
                      onClick={incrementQuantity}
                      disabled={isUpdating}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Item Total */}
                  <div className="font-medium cosmic-gradient-text animate-pulse-gentle">
                    {formatCurrency(itemTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator className="my-4 cosmic-divider" />
    </div>
  );
};

export default CartItem;