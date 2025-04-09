import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Clock, Gift } from 'lucide-react';
import { CosmicIcon } from '@/components/cosmic/ui/cosmic-icons';

interface ProductFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  limited?: boolean;
}

interface EnhancedShoppingExperienceProps {
  onProductView?: (productId: string) => void;
  products?: any[]; // Accept products from parent component
}

const shoppingFeatures: ProductFeature[] = [
  {
    id: "feature-1",
    title: "Cosmic Quality Guarantee",
    description: "Every item is infused with cosmic energy and meets our strict quality standards.",
    icon: <CosmicIcon name="star" size={24} className="text-amber-400" />
  },
  {
    id: "feature-2",
    title: "Ethically Sourced Materials",
    description: "We ensure all our products are responsibly and sustainably sourced.",
    icon: <CosmicIcon name="moon" size={24} className="text-emerald-400" />
  },
  {
    id: "feature-3",
    title: "Energy Infused Products",
    description: "Each item has been cleansed and energy-infused before shipping.",
    icon: <CosmicIcon name="sparkles" size={24} className="text-purple-400" />
  },
  {
    id: "feature-4",
    title: "Free Shipping over $75",
    description: "Enjoy free shipping on all domestic orders over $75.",
    icon: <Gift size={24} className="text-blue-400" />
  }
];

const featuredProducts: FeaturedProduct[] = [
  {
    id: "product-1",
    name: "Cosmic Frequency Crystal Pendant",
    description: "Handcrafted pendant that resonates with cosmic frequencies to harmonize your energy field.",
    price: 49.99,
    image: "/images/products/samples/cosmic-pendant.jpg",
    rating: 4.9,
    reviewCount: 127,
    tags: ["Crystal", "Energy", "Handcrafted"],
    limited: true
  },
  {
    id: "product-2",
    name: "Galactic Sound Journey Tee",
    description: "Organic cotton t-shirt with sacred geometry design that represents cosmic soundwaves.",
    price: 34.99,
    image: "/images/products/samples/sacred-geometry-tshirt.jpg",
    rating: 4.7,
    reviewCount: 89,
    tags: ["Apparel", "Organic", "Sacred Geometry"]
  },
  {
    id: "product-3",
    name: "Starlight Meditation Cushion",
    description: "Sustainable cork and organic cotton meditation cushion for your cosmic journeys within.",
    price: 59.99,
    image: "/images/products/samples/meditation-cushion.jpg",
    rating: 4.8,
    reviewCount: 103,
    tags: ["Meditation", "Sustainable", "Home"]
  }
];

const EnhancedShoppingExperience: React.FC<EnhancedShoppingExperienceProps> = ({ onProductView, products }) => {
  return (
    <div className="space-y-12">
      {/* Feature cards (Quality Guarantee section) - Moved to top as requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-6">
        {shoppingFeatures.map((feature) => (
          <Card key={feature.id} className="p-4 md:p-6 cosmic-glass-card" 
            style={{
              clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
              backgroundColor: "rgba(155, 135, 245, 0.05)"
            }}>
            <div className="flex flex-col items-center text-center mt-6">
              <div className="mb-4 bg-primary/10 p-3 rounded-full">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Hero section - Cosmic Shop */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          Cosmic Shop
        </h1>
        <p className="text-lg max-w-3xl mx-auto text-muted-foreground">
          Discover hand-selected products that enhance your cosmic journey, from energy-infused crystals to sustainable apparel and home goods that raise your vibration.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Button size="lg" className="group bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-600/30 transition-all duration-300 border-0 cosmic-hover-glow">
            <ShoppingCart className="mr-2 h-5 w-5 group-hover:animate-bounce" />
            Browse All Products
          </Button>
          <Button size="lg" variant="outline" className="border-purple-400/30 hover:border-purple-400/60 text-purple-300 hover:text-purple-100 shadow-md shadow-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cosmic-hover-glow">
            New Arrivals
          </Button>
        </div>
      </div>

      {/* Featured products */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 cosmic-text-glow">Featured Products</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="border border-purple-500/20 shadow-sm shadow-purple-500/10 hover:shadow-md hover:shadow-purple-500/20 bg-black/10 backdrop-blur-sm text-purple-300 hover:text-purple-100 transition-all duration-300 cosmic-hover-glow"
          >
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-0">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden cosmic-glass-card p-4 h-full flex flex-col"
              style={{
                clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
                backgroundColor: "rgba(155, 135, 245, 0.05)"
              }}>
              <div className="relative mb-4 mt-6 px-4">
                <div className="relative overflow-hidden" style={{
                  clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
                }}>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loops
                      
                      // Use tag-specific fallback
                      const fallbacks: Record<string, string> = {
                        'Crystal': '/images/products/samples/cosmic-pendant.jpg',
                        'Energy': '/images/products/samples/clear-quartz.jpg',
                        'Apparel': '/images/products/samples/sacred-geometry-tshirt.jpg',
                        'Meditation': '/images/products/samples/meditation-cushion.jpg',
                        'Sustainable': '/images/products/samples/meditation-cushion.jpg',
                        'Sacred Geometry': '/images/products/samples/sacred-geometry.jpg'
                      };
                      
                      // Find a matching tag
                      let fallbackImg = '/images/products/samples/cosmic-pendant.jpg';
                      for (const tag of product.tags) {
                        if (fallbacks[tag]) {
                          fallbackImg = fallbacks[tag];
                          break;
                        }
                      }
                      
                      target.src = fallbackImg;
                    }}
                  />
                </div>
                
                {product.limited && (
                  <div className="absolute top-2 right-8">
                    <Badge className="bg-amber-500 text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Limited Edition
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col px-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="text-xl font-semibold mb-2 line-clamp-1 overflow-ellipsis">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-3 min-h-[4.5rem] overflow-hidden">{product.description}</p>
                
                <div className="flex items-center mb-4">
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-gray-300"} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                  <Button 
                    size="sm"
                    onClick={() => onProductView && onProductView(product.id)}
                    className="bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 cosmic-hover-glow"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Product
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedShoppingExperience;