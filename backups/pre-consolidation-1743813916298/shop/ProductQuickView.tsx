import React, { useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Heart, X, Star } from 'lucide-react';
import CosmicModal from '../ui/cosmic-modal';
import CosmicButton from '../ui/cosmic-button';
import CosmicHeading from '../ui/cosmic-heading';
import { Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddToWishlist?: (product: Product) => void;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - Number(product.salePrice)) / product.price) * 100) 
    : 0;
  
  const isOutOfStock = product.inventory <= 0;

  // Format the image URL - if it's an array, take the first image
  const productImage = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : '/placeholder-product.jpg';

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  return (
    <CosmicModal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      size="lg"
      variant="cosmic"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <img
            src={productImage}
            alt={product.name}
            className="w-full object-cover rounded-md h-[300px] md:h-full"
          />
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <CosmicHeading as="h3" size="xl" className="mb-1">{product.name}</CosmicHeading>
            <div className="flex items-center mb-2">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">(12 reviews)</span>
            </div>
            <div className="flex items-center mb-4">
              {hasDiscount ? (
                <>
                  <span className="text-red-400 font-bold text-2xl">{formatCurrency(Number(product.salePrice))}</span>
                  <span className="text-gray-400 line-through text-lg ml-2">{formatCurrency(Number(product.price))}</span>
                </>
              ) : (
                <span className="text-white font-bold text-2xl">{formatCurrency(Number(product.price))}</span>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-gray-300 mb-4">{product.shortDescription || product.description}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-gray-400 w-20">SKU:</span>
              <span className="text-gray-300">{product.sku}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 w-20">Category:</span>
              <span className="text-cosmic-primary">
                <Link href={`/shop/category/${product.categoryId}`}>
                  View Category
                </Link>
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 w-20">Status:</span>
              <span className={isOutOfStock ? "text-red-400" : "text-green-400"}>
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-800 space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center space-x-4">
                <label htmlFor="quantity" className="text-gray-400">Quantity:</label>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-l-md hover:bg-gray-700 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-14 h-8 text-center bg-gray-800 text-white border-0"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-r-md hover:bg-gray-700 transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <CosmicButton
                variant="cosmic"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-grow"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </CosmicButton>
              
              {onAddToWishlist && (
                <CosmicButton
                  variant="outline"
                  size="lg"
                  onClick={() => onAddToWishlist(product)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </CosmicButton>
              )}
            </div>
            
            <div>
              <Link href={`/shop/product/${product.slug}`}>
                <CosmicButton variant="ghost" className="w-full">
                  View Full Details
                </CosmicButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </CosmicModal>
  );
};

export default ProductQuickView;