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
// import { useCart } from "@/hooks/use-cart";

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
  onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
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

  // In a real app, we would use useCart here
  // const { addToCart } = useCart();


  return (
    <Card className="overflow-hidden cosmic-glass-card cosmic-scale in">
      <div className="relative">
        <Link href={`/shop/product/${id}`}>
          <div className="overflow-hidden aspect-square relative group cursor-pointer">
            <img
              src={image || getProductPlaceholderImage(name, description, categories)}
              alt={name}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loops
                target.src = getProductPlaceholderImage(name, description, categories);
              }}
            />
            {(featured || isNew || discountPercent) && (
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {featured && (
                  <Badge variant="default" className="cosmic-badge">
                    Featured
                  </Badge>
                )}
                {isNew && (
                  <Badge variant="outline" className="bg-primary/20 cosmic-badge">
                    New
                  </Badge>
                )}
                {discountPercent && (
                  <Badge variant="destructive" className="cosmic-badge-highlight">
                    -{discountPercent}%
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Link>

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 left-2 h-8 w-8 rounded-full opacity-70 hover:opacity-100 cosmic-btn-icon"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between mb-2">
          <div className="space-y-1">
            <Link href={`/shop/product/${id}`}>
              <h3 className="font-medium cosmic-hover-text cursor-pointer">{name}</h3>
            </Link>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {categories.slice(0, 1).map((category) => (
                <Link key={category} href={`/shop/${category.toLowerCase()}`}>
                  <span className="cosmic-hover-text cursor-pointer">{category}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="truncate text-sm text-muted-foreground mb-4">
          {description}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          {discountedPrice ? (
            <>
              <span className="text-muted-foreground line-through text-sm">
                {formattedPrice}
              </span>
              <span className="font-semibold text-primary">{discountedPrice}</span>
            </>
          ) : (
            <span className="font-semibold cosmic-price">{formattedPrice}</span>
          )}
        </div>
        <Button
          size="sm"
          className={cn(
            "cosmic-btn w-full sm:w-auto",
            !inStock && "opacity-50 cursor-not-allowed"
          )}
          disabled={!inStock}
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export { ProductCard };