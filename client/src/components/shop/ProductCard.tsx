import React from 'react';
import { Link } from 'wouter';
import { Eye, ShoppingCart, Heart, Star } from 'lucide-react';
import CosmicCard from '../ui/cosmic-card';
import CosmicButton from '../ui/cosmic-button';
import CosmicBadge from '../ui/cosmic-badge';
import { Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
  onQuickView?: () => void;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  onQuickView,
  onAddToCart,
  onAddToWishlist,
  className = '',
}) => {
  const hasDiscount = product.salePrice !== null && parseFloat(product.salePrice as string) < parseFloat(product.price as string);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.price as string) - parseFloat(product.salePrice as string)) / parseFloat(product.price as string)) * 100) 
    : 0;
  
  const isOutOfStock = product.inventory <= 0;
  const isFeatured = product.featured === true;

  // Format the image URL - if it's an array, take the first image
  const productImage = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : '/placeholder-product.jpg';

  if (variant === 'list') {
    return (
      <CosmicCard
        variant="interactive"
        className="flex flex-col md:flex-row gap-4 overflow-hidden transition-all duration-300"
      >
        <div className="relative h-[200px] md:w-[200px] flex-shrink-0">
          <Link href={`/shop/product/${product.slug}`}>
            <img 
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </Link>
          
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10">
              <CosmicBadge variant="destructive">
                {discountPercentage}% OFF
              </CosmicBadge>
            </div>
          )}
          
          {isOutOfStock && (
            <div className="absolute top-2 right-2 z-10">
              <CosmicBadge variant="outline">Out of Stock</CosmicBadge>
            </div>
          )}
          
          {isFeatured && !hasDiscount && !isOutOfStock && (
            <div className="absolute top-2 left-2 z-10">
              <CosmicBadge variant="cosmic">Featured</CosmicBadge>
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-grow p-4">
          <div className="flex items-center mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3 h-3 text-yellow-400"
                  fill="currentColor"
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-2">(12 reviews)</span>
          </div>
          
          <Link href={`/shop/product/${product.slug}`}>
            <h3 className="text-lg font-medium hover:text-cosmic-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <p className="text-gray-400 text-sm line-clamp-2 my-2">
            {product.shortDescription || product.description}
          </p>
          
          <div className="flex items-baseline mt-auto">
            {hasDiscount ? (
              <>
                <span className="text-red-400 font-bold text-lg">
                  {formatCurrency(parseFloat(product.salePrice as string))}
                </span>
                <span className="text-gray-400 line-through text-sm ml-2">
                  {formatCurrency(parseFloat(product.price as string))}
                </span>
              </>
            ) : (
              <span className="text-white font-bold text-lg">
                {formatCurrency(parseFloat(product.price as string))}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap mt-4 gap-2">
            {!isOutOfStock && onAddToCart && (
              <CosmicButton
                variant="cosmic"
                size="sm"
                onClick={onAddToCart}
                className="flex-grow"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </CosmicButton>
            )}
            
            {onQuickView && (
              <CosmicButton
                variant="outline"
                size="sm"
                onClick={onQuickView}
              >
                <Eye className="w-4 h-4 mr-2" />
                Quick View
              </CosmicButton>
            )}
            
            {onAddToWishlist && (
              <CosmicButton
                variant="outline"
                size="sm"
                onClick={onAddToWishlist}
              >
                <Heart className="w-4 h-4" />
              </CosmicButton>
            )}
          </div>
        </div>
      </CosmicCard>
    );
  }

  // Grid variant (default)
  return (
    <CosmicCard
      variant="glow"
      glowColor="rgba(var(--cosmic-primary-rgb), 0.15)"
      className="overflow-hidden transition-all duration-300 group h-full flex flex-col"
    >
      <div className="relative h-[260px] overflow-hidden">
        <Link href={`/shop/product/${product.slug}`}>
          <img 
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>
        
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <CosmicBadge variant="destructive">
              {discountPercentage}% OFF
            </CosmicBadge>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="absolute top-2 right-2 z-10">
            <CosmicBadge variant="outline">Out of Stock</CosmicBadge>
          </div>
        )}
        
        {isFeatured && !hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <CosmicBadge variant="cosmic">Featured</CosmicBadge>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          {!isOutOfStock && onAddToCart && (
            <CosmicButton
              variant="cosmic"
              size="sm"
              onClick={onAddToCart}
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <ShoppingCart className="w-4 h-4" />
            </CosmicButton>
          )}
          
          {onQuickView && (
            <CosmicButton
              variant="outline"
              size="sm"
              onClick={onQuickView}
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
            >
              <Eye className="w-4 h-4" />
            </CosmicButton>
          )}
          
          {onAddToWishlist && (
            <CosmicButton
              variant="outline"
              size="sm"
              onClick={onAddToWishlist}
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150"
            >
              <Heart className="w-4 h-4" />
            </CosmicButton>
          )}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center mb-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-3 h-3 text-yellow-400"
                fill="currentColor"
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-2">(12 reviews)</span>
        </div>
        
        <Link href={`/shop/product/${product.slug}`}>
          <h3 className="text-md font-medium hover:text-cosmic-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-2">
          {hasDiscount ? (
            <div className="flex items-center">
              <span className="text-red-400 font-bold">
                {formatCurrency(parseFloat(product.salePrice as string))}
              </span>
              <span className="text-gray-400 line-through text-sm ml-2">
                {formatCurrency(parseFloat(product.price as string))}
              </span>
            </div>
          ) : (
            <span className="text-white font-bold">
              {formatCurrency(parseFloat(product.price as string))}
            </span>
          )}
        </div>
      </div>
    </CosmicCard>
  );
};

export default ProductCard;