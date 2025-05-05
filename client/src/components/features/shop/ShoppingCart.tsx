/**
 * ShoppingCart.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
import React, { useState } from 'react';
import { Product } from '@/pages/shop/ShopPage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import CosmicButton from '@/components/features/cosmic/cosmic-button';
import { useLocation } from 'wouter'; // Using wouter instead of react-router-dom

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShoppingCartProps {
  cartItems?: CartItem[];
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemoveItem?: (productId: string) => void;
  onCheckout?: () => void;
  total?: number;
}

// Export a simple ShoppingCart icon component for use in headers
export function ShoppingCart() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-white/80 hover:text-white hover:bg-white/10"
      onClick={() => setIsOpen(!isOpen)}
    >
      <ShoppingCartIcon className="h-5 w-5" />
    </Button>
  );
}

// Export the full ShoppingCart component
export const FullShoppingCart: React.FC<ShoppingCartProps> = ({
  cartItems = [],
  onUpdateQuantity = () => {},
  onRemoveItem = () => {},
  onCheckout = () => {},
  total = 0
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle quantity change
  const handleQuantityChange = (productId: string, delta: number, currentQuantity: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    onUpdateQuantity(productId, newQuantity);
  };

  const [, setLocation] = useLocation(); // Added useLocation hook

  const handleCheckout = () => {
    setLocation('/shop/checkout');
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto cosmic-cart"> {/* Applied the provided change here */}
      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <ShoppingBag className="h-16 w-16 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add some products to your cart and they will appear here.
          </p>
          <Button variant="outline" asChild className="cosmic-btn-outline">
            <a href="/shop">Continue Shopping</a>
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pt-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 py-2 cosmic-hover-glow p-2 rounded-md">
                  <div className="h-16 w-16 rounded overflow-hidden shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveItem(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <span className="text-sm text-muted-foreground mb-2 cosmic-price">
                      {formatCurrency(product.price)}
                    </span>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleQuantityChange(product.id, -1, quantity)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() => handleQuantityChange(product.id, 1, quantity)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="font-medium cosmic-price">
                        {formatCurrency(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 space-y-4">
            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span className="cosmic-gradient-text">{formatCurrency(total)}</span>
              </div>
            </div>

            <CosmicButton 
              className="w-full" 
              size="lg" 
              onClick={() => setLocation('/checkout')}
              variant="cosmic"
            >
              Checkout
            </CosmicButton>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;