import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import CosmicModal from '../ui/cosmic-modal';
import CosmicButton from '../ui/cosmic-button';
import CosmicHeading from '../ui/cosmic-heading';
import { CartItem, Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface ShoppingCartProps {
  cartItems: (CartItem & { product: Product })[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (itemId: number) => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onCheckout: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({
  cartItems,
  isOpen,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
}) => {
  const isEmpty = cartItems.length === 0;
  
  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product.salePrice || item.product.price;
    return total + (Number(price) * item.quantity);
  }, 0);
  
  const tax = subtotal * 0.08; // 8% tax for demo
  const shipping = subtotal > 0 ? 10 : 0; // $10 shipping if cart not empty
  const total = subtotal + tax + shipping;

  return (
    <CosmicModal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Shopping Cart"
      size="md"
      variant="cosmic"
    >
      <div className="flex flex-col h-full">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gray-800 p-4 rounded-full mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <CosmicHeading as="h3" size="lg" className="mb-2">Your cart is empty</CosmicHeading>
            <p className="text-gray-400 mb-6">Looks like you haven't added any products to your cart yet.</p>
            <CosmicButton variant="cosmic" onClick={onClose}>
              Continue Shopping
            </CosmicButton>
          </div>
        ) : (
          <>
            <div className="flex-grow overflow-y-auto max-h-[60vh] space-y-4 pr-2">
              {cartItems.map((item) => {
                const { product } = item;
                const price = product.salePrice || product.price;
                const totalPrice = Number(price) * item.quantity;
                
                return (
                  <div key={item.id} className="flex border-b border-gray-800 pb-4">
                    <div className="w-20 h-20 flex-shrink-0">
                      {Array.isArray(product.images) && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 rounded-md flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{product.name}</h4>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-400 mb-2">
                        {formatCurrency(Number(price))} each
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center border border-gray-700 rounded-md">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-l-md transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-r-md transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="font-medium">
                          {formatCurrency(totalPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax (8%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping</span>
                    <span>{formatCurrency(shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-800 font-medium text-base">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CosmicButton
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Continue Shopping
                </CosmicButton>
                
                <CosmicButton
                  variant="cosmic"
                  onClick={onCheckout}
                  className="flex-1"
                >
                  Checkout
                </CosmicButton>
              </div>
              
              <button
                onClick={() => cartItems.forEach(item => onRemoveItem(item.id))}
                className="flex items-center justify-center w-full text-gray-400 hover:text-red-400 transition-colors text-sm py-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </CosmicModal>
  );
};

export default ShoppingCart;