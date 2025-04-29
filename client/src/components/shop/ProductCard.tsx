/**
 * ProductCard Component
 * Individual product display card with image, details, and actions
 * Links to individual product pages and handles cart interactions
 */

import React from "react";
import { Link } from "wouter";
import { Product } from "@/pages/shop/ShopPage";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

/**
 * Returns a relevant product image URL based on product details
 */
const getProductPlaceholderImage = (name: string, description: string, categories: string[]): string => {
  const combinedText = `${name} ${description} ${categories.join(' ')}`.toLowerCase();

  // Map for category-specific images
  const categoryPlaceholders: Record<string, string> = {
    'healing tools': '/images/products/samples/crystal-bowl.jpg',
    'sound therapy': '/images/products/samples/tibetan-bowl.jpg',
    'jewelry': '/images/products/samples/crystal-pendant.jpg',
    'energy tools': '/images/products/samples/clear-quartz.jpg',
    'digital': '/images/products/samples/album-cover.jpg',
    'music': '/images/products/samples/album-cover.jpg',
    'meditation': '/images/products/samples/meditation-cushion.jpg',
    'home': '/images/products/samples/crystal-bowl.jpg',
    'art': '/images/products/samples/sacred-geometry.jpg',
    'books': '/images/products/samples/spiritual-journal.jpg',
    'self-development': '/images/products/samples/spiritual-journal.jpg'
  };

  // Check if product content matches any specific categories
  for (const [category, imagePath] of Object.entries(categoryPlaceholders)) {
    if (combinedText.includes(category.toLowerCase())) {
      return imagePath;
    }
  }

  // Common product types to check for with specific descriptions
  const productTypes = [
    { keywords: ['crystal', 'bowl', 'singing'], image: '/images/products/samples/crystal-bowl.jpg' },
    { keywords: ['clear quartz', 'point', 'amplification'], image: '/images/products/samples/clear-quartz.jpg' },
    { keywords: ['pendant', 'necklace', 'jewelry', 'cosmic frequencies'], image: '/images/products/samples/cosmic-pendant.jpg' },
    { keywords: ['album', 'frequency', 'music', 'sound', 'tracks'], image: '/images/products/samples/album-cover.jpg' },
    { keywords: ['cushion', 'meditation', 'cork', 'organic cotton'], image: '/images/products/samples/organic-meditation-cushion.jpg' },
    { keywords: ['cushion', 'meditation', 'sitting', 'cosmic pattern'], image: '/images/products/samples/meditation-cushion.jpg' },
    { keywords: ['sacred geometry', 'geometry', 'art', 'wall', 'hand-painted'], image: '/images/products/samples/sacred-geometry.jpg' },
    { keywords: ['t-shirt', 'sacred geometry', 'cotton'], image: '/images/products/samples/sacred-geometry-tshirt.jpg' },
    { keywords: ['journal', 'diary', 'write', 'book', 'spiritual'], image: '/images/products/samples/spiritual-journal.jpg' },
    { keywords: ['amethyst', 'cluster'], image: '/images/products/samples/amethyst-cluster.jpg' },
    { keywords: ['labradorite', 'palm stone'], image: '/images/products/samples/labradorite.jpg' },
    { keywords: ['tibetan', 'metal', 'singing bowl'], image: '/images/products/samples/tibetan-bowl.jpg' },
    { keywords: ['koshi', 'chimes'], image: '/images/products/samples/koshi-chimes.jpg' },
  ];

  // Check for matches in product types
  for (const type of productTypes) {
    if (type.keywords.some(keyword => combinedText.includes(keyword))) {
      return type.image;
    }
  }

  // Default image if no specific match
  return '/images/products/samples/cosmic-pendant.jpg';
};

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    id,
    name,
    description,
    price,
    image,
    rating,
    categories,
    inStock,
    featured,
    new: isNew,
    discountPercent
  } = product;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);

  const discountedPrice = discountPercent
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price * (1 - discountPercent / 100))
    : null;

  const { addToCart, isItemInCart } = useCart(); // Accessing cart functions
  const isProductInCart = isItemInCart(id);
  
  // Handle add to cart with optional notification
  const handleAddToCart = () => {
    if (inStock) {
      addToCart(product, 1);
    }
  }


  return (
    <Card className="overflow-hidden cosmic-glass-card cosmic-scale in relative h-full flex flex-col shadow-xl shadow-indigo-900/30">
      <div className="relative">
        <Link href={`/shop/product/${id}`}>
          <div className="overflow-hidden aspect-square relative group cursor-pointer clip-path-octagon border-2 border-indigo-600/30">
            {/* Glowing backdrop for product image */}
            <div className="absolute inset-0 bg-gradient-radial from-indigo-600/20 via-purple-600/10 to-transparent z-0"></div>
            
            <img
              src={image || getProductPlaceholderImage(name, description, categories)}
              alt={name}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 relative z-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loops
                target.src = getProductPlaceholderImage(name, description, categories);
                console.log("Image error for product:", name, "Using fallback:", target.src);
              }}
            />
            
            {/* Enhanced lighting and contrast gradient for better visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 z-10"></div>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-all duration-300 z-20"></div>
          </div>
        </Link>

        {/* Redesigned badges with improved visibility */}
        {(featured || isNew || discountPercent) && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {featured && (
              <Badge variant="default" className="cosmic-badge cosmic-hover-glow px-3 py-1.5 text-xs font-semibold shadow-lg bg-amber-600 text-white border border-amber-400/30">
                Bestseller
              </Badge>
            )}
            {isNew && (
              <Badge variant="outline" className="bg-indigo-600/40 border-indigo-400/50 cosmic-badge cosmic-hover-glow px-3 py-1.5 text-xs font-semibold shadow-lg text-white">
                ZODIAC
              </Badge>
            )}
            {discountPercent && (
              <Badge variant="destructive" className="cosmic-badge-highlight cosmic-hover-glow px-3 py-1.5 text-xs font-semibold shadow-lg bg-emerald-600 text-white border border-emerald-400/30">
                {discountPercent}% Off
              </Badge>
            )}
          </div>
        )}

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 left-3 h-8 w-8 rounded-full opacity-80 hover:opacity-100 cosmic-btn-icon cosmic-hover-glow shadow-md z-10"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4 flex-grow">
        <div className="flex flex-col sm:flex-row justify-between mb-2">
          <div className="space-y-1 flex-grow">
            <Link href={`/shop/product/${id}`}>
              <h3 className="font-medium cosmic-hover-text cursor-pointer text-lg truncate max-w-full" title={name}>{name}</h3>
            </Link>
            <div className="flex items-center gap-1 text-sm text-white/80">
              {categories.slice(0, 1).map((category) => (
                <Link key={category} href={`/shop/${category.toLowerCase()}`}>
                  <span className="cosmic-hover-text cursor-pointer">{category}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1 sm:mt-0 ml-0 sm:ml-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="line-clamp-3 text-sm text-white/80 mb-4 min-h-[60px] max-h-[60px] overflow-hidden" title={description}>
          {description}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col justify-between items-center gap-3 mt-auto">
        {/* Price and Rating section combined - makes better use of space */}
        <div className="w-full flex items-center justify-between bg-indigo-950/60 backdrop-blur-sm py-2 px-4 rounded-lg border border-purple-500/20 shadow-inner">
          <div className="flex-shrink-0">
            {discountedPrice ? (
              <div className="flex flex-col items-start">
                <span className="text-white/60 line-through text-xs">
                  {formattedPrice}
                </span>
                <span className="font-bold text-purple-300 text-lg cosmic-text-glow">{discountedPrice}</span>
              </div>
            ) : (
              <span className="font-bold text-purple-300 text-lg cosmic-text-glow">{formattedPrice}</span>
            )}
          </div>
          
          {/* Star rating positioned next to price */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating.toFixed(1)}</span>
            <span className="text-xs text-white/70 ml-1">
              ({typeof product.reviews === 'number' ? product.reviews : '144'} reviews)
            </span>
          </div>
        </div>
        
        {/* Product action buttons - stacked vertically to avoid clipping */}
        <div className="flex flex-col w-full gap-2">
          {/* Explore Button */}
          <Button
            size="sm"
            variant="outline"
            className="w-full bg-indigo-800/70 border-indigo-400/50 text-white hover:bg-indigo-700/90 
                      shadow-md shadow-indigo-500/20 cosmic-hover-glow py-2 font-semibold"
            onClick={() => window.location.href = `/shop/product/${id}`}
          >
            Explore
          </Button>
          
          {/* Buy Now / Add to Cart Button */}
          <Button
            size="sm"
            className={cn(
              "w-full bg-violet-700 hover:bg-violet-600 text-white cosmic-hover-glow shadow-md shadow-violet-500/30 py-2 font-semibold",
              !inStock && "opacity-70 cursor-not-allowed",
              isProductInCart && "bg-green-700 hover:bg-green-600"
            )}
            disabled={!inStock || isProductInCart}
            onClick={isProductInCart ? undefined : handleAddToCart}
          >
            {isProductInCart ? (
              <Link href="/cart" className="w-full flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">View in Cart</span>
              </Link>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{inStock ? "Buy Now" : "Out of Stock"}</span>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;