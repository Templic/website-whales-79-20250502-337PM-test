import React from "react";
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User,
  CreditCard,
  Share2,
} from 'lucide-react';
import { SharedCart, SharedCartItem } from './types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SharedCartProps {
  roomId: string;
  sharedCart: SharedCartItem[];
  products: {
    [productId: string]: {
      id: string;
      name: string;
      price: number;
      image?: string;
    };
  };
  participants: {
    [userId: string]: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
  currentUserId: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function SharedCartComponent({
  roomId,
  sharedCart,
  products,
  participants,
  currentUserId,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: SharedCartProps) {
  const [totalPrice, setTotalPrice] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Calculate total price whenever the cart changes
    const newTotal = sharedCart.reduce((total, item) => {
      const product = products[item.productId];
      return total + (product?.price || 0) * item.quantity;
    }, 0);
    
    setTotalPrice(newTotal);
  }, [sharedCart, products]);

  const handleShareCart = () => {
    // Generate a shareable cart link
    const cartLink = `${window.location.origin}/shop/shared-cart/${roomId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(cartLink).then(
      () => {
        toast({
          title: 'Cart Link Copied!',
          description: 'Share this link with friends to view this cart.',
        });
      },
      (err) => {
        console.error('Could not copy cart link:', err);
        toast({
          title: 'Failed to Copy Link',
          description: 'Please try again or manually share the URL.',
          variant: 'destructive',
        });
      }
    );
  };

  // Group items by who added them
  const itemsByUser: Record<string, SharedCartItem[]> = {};
  sharedCart.forEach(item => {
    if (!itemsByUser[item.addedBy]) {
      itemsByUser[item.addedBy] = [];
    }
    itemsByUser[item.addedBy].push(item);
  });
  
  // Calculate subtotals by user
  const subtotalByUser: Record<string, number> = {};
  Object.entries(itemsByUser).forEach(([userId, items]) => {
    subtotalByUser[userId] = items.reduce((total, item) => {
      const product = products[item.productId];
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Shared Shopping Cart
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleShareCart}>
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Cart</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      
      <CardContent>
        {sharedCart.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Your shared cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add items to your cart to shop with friends!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            {Object.entries(itemsByUser).map(([userId, items]) => (
              <div key={userId} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {userId === currentUserId 
                      ? 'Your Items' 
                      : `${participants[userId]?.username || 'Unknown'}'s Items`}
                  </span>
                  <Badge variant="outline">
                    ${subtotalByUser[userId].toFixed(2)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {items.map((item) => {
                    const product = products[item.productId];
                    
                    if (!product) return null;
                    
                    return (
                      <div key={item.productId} className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-secondary/20 flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ShoppingCart className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium line-clamp-1">{product.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            ${product.price.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {userId === currentUserId && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="w-6 text-center">{item.quantity}</span>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onRemoveItem(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {userId !== currentUserId && (
                            <div className="text-right">
                              <div>Qty: {item.quantity}</div>
                              <div className="text-sm text-muted-foreground">
                                ${(product.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <Separator className="my-4" />
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <div className="w-full flex justify-between items-center py-2">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">${totalPrice.toFixed(2)}</span>
        </div>
        
        <Button 
          className="w-full mt-2" 
          disabled={sharedCart.length === 0}
          onClick={onCheckout}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  );
}