import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  DollarSign, 
  Award 
} from 'lucide-react';
import { CosmicIcon } from '@/components/cosmic/ui/cosmic-icons';

// Collection item interface
interface CollectionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured?: boolean;
  isExclusive?: boolean;
  isBestseller?: boolean;
  rating: number;
  reviews: number;
  discount?: number;
}

// Props interface
interface CosmicCollectiblesProps {
  onAddToCart?: (product$2 => void;
  userPoints?: number;
}

// Sample collection items data - these are exclusive to the Cosmic Collectibles section
const collectionItems: CollectionItem[] = [
  {
    id: "cosmic-reward-1",
    name: "Koshi Chimes - Earth Element",
    description: "Unique handcrafted chimes tuned to Earth's resonant frequency, creating harmonious tones that ground your energy.",
    price: 77.77,
    image: "/images/products/koshi-chimes-earth.svg",
    category: "spiritual",
    isFeatured: true,
    isExclusive: true,
    rating: 4.9,
    reviews: 77
  },
  {
    id: "cosmic-reward-2",
    name: "Zodiac Crystal Collection",
    description: "A set of 12 crystals aligned with each zodiac sign, enhancing your connection to cosmic energies.",
    price: 111.11,
    image: "/images/products/zodiac-crystal-collection.svg",
    category: "spiritual",
    isBestseller: true,
    rating: 4.8,
    reviews: 93,
    discount: 7
  },
  {
    id: "cosmic-reward-3",
    name: "Starseed Oracle Deck",
    description: "Limited edition oracle deck featuring cosmic artwork that helps reveal your spiritual path and cosmic origins.",
    price: 44.44,
    image: "/images/products/starseed-oracle.svg",
    category: "spiritual",
    isFeatured: true,
    rating: 5.0,
    reviews: 144
  },
  {
    id: "cosmic-reward-4",
    name: "Nebula Meditation Cushion",
    description: "Ergonomic meditation cushion with cosmic nebula design, filled with organic buckwheat hulls for ultimate comfort.",
    price: 55.55,
    image: "/images/products/nebula-cushion.svg",
    category: "home",
    rating: 4.7,
    reviews: 89
  },
  {
    id: "cosmic-reward-5",
    name: "Celestial Harmonic Pendant",
    description: "Sterling silver pendant embedded with a crystal that vibrates at the frequency of cosmic harmony.",
    price: 88.88,
    image: "/images/products/harmonic-pendant.svg",
    category: "jewelry",
    isBestseller: true,
    rating: 4.9,
    reviews: 121,
    discount: 11
  },
  {
    id: "cosmic-reward-6",
    name: "Sacred Geometry Wall Tapestry",
    description: "Handwoven tapestry featuring interconnected sacred geometry patterns that enhance the energy of any space.",
    price: 66.66,
    image: "/images/products/sacred-geometry-tapestry.svg",
    category: "home",
    rating: 4.8,
    reviews: 67
  }
];

const CosmicCollectibles: React.FC<CosmicCollectiblesProps> = ({ onAddToCart, userPoints }) => {
  return (
    <div className="space-y-8">
      {/* Pentagon background for Cosmic Collectibles & Rewards */}
      <div className="relative mb-8">
        <div 
          className="absolute inset-0 -z-10 bg-indigo-950/20 backdrop-blur-sm border border-purple-500/20 overflow-hidden"
          style={{
            clipPath: "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
            backgroundColor: "rgba(155, 135, 245, 0.05)"
          }}
        />
        <div className="relative z-10 flex items-center gap-3 px-6 py-6">
          <CosmicIcon name="star" size={24} className="text-purple-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 cosmic-text-glow">
            Cosmic Collectibles & Rewards
          </h2>
          <div className="ml-auto bg-indigo-900/80 px-6 py-2 rounded-md flex items-center">
            <span className="mr-2 text-sm text-purple-200">777 Points</span>
            <Button 
              variant="link" 
              className="text-purple-300 hover:text-purple-100 p-0 h-auto text-sm cosmic-hover-glow"
            >
              View Collectibles
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap mb-4 sm:mb-8 gap-1 justify-center">
          <TabsTrigger value="all" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">All Items</TabsTrigger>
          <TabsTrigger value="jewelry" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">Jewelry</TabsTrigger>
          <TabsTrigger value="spiritual" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">Spiritual</TabsTrigger>
          <TabsTrigger value="clothing" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">Clothing</TabsTrigger>
          <TabsTrigger value="accessories" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">Access.</TabsTrigger>
          <TabsTrigger value="home" className="clip-path-octagon p-2 sm:p-3 text-xs sm:text-sm flex-1 max-w-24 sm:max-w-32 text-center cosmic-hover-glow">Home</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectionItems.map((item) => (
              <CollectibleCard key={item.id} item={item} onAddToCart={onAddToCart} />
            ))}
          </div>
        </TabsContent>

        {["jewelry", "spiritual", "clothing", "accessories", "home"].map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collectionItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <CollectibleCard key={item.id} item={item} onAddToCart={onAddToCart} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-center mt-12">
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-600/30 transition-all duration-300 border-0 cosmic-hover-glow"
        >
          View All Collectibles
        </Button>
      </div>
    </div>
  );
};

// Card component for collection items with modified octagon shape to prevent overflow
const CollectibleCard: React.FC<{ item: CollectionItem, onAddToCart?: (product$2 => void }> = ({ item, onAddToCart }) => {
  const handleViewProduct = () => {
    console.log(`Viewing product details for ${item.name}`);
    // In a real app, this would navigate to product detail page
  };

  return (
    <Card className="cosmic-glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 shop-item"
      style={{
        clipPath: "polygon(28% 0%, 72% 0%, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0% 72%, 0% 28%)", // Wider octagon shape for better content fit
        backgroundColor: "rgba(155, 135, 245, 0.05)"
      }}>
      <div className="p-4 sm:p-6 pt-6 sm:pt-8 pb-8 sm:pb-10 flex flex-col items-center"> {/* Responsive padding */}
        {/* Octagon image container */}
        <div className="relative w-full aspect-[5/4] mb-3 overflow-hidden">
          <div 
            className="absolute inset-0 border border-purple-500/20 overflow-hidden flex items-center justify-center"
            style={{
              clipPath: "polygon(28% 0%, 72% 0%, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0% 72%, 0% 28%)", // Matching octagon shape
              background: "linear-gradient(to bottom, rgba(75, 0, 130, 0.1), rgba(20, 20, 60, 0.2))"
            }}
          >
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loops
                
                // Use category-specific fallback
                const fallbacks: Record<string, string> = {
                  'jewelry': '/images/products/samples/cosmic-pendant.jpg',
                  'spiritual': '/images/products/samples/sacred-geometry.jpg',
                  'clothing': '/images/products/samples/sacred-geometry-tshirt.jpg',
                  'accessories': '/images/products/samples/spiritual-journal.jpg',
                  'home': '/images/products/samples/meditation-cushion.jpg'
                };
                
                target.src = fallbacks[item.category] || '/images/products/samples/cosmic-pendant.jpg';
              }}
            />
          </div>

          {/* Purple border overlay */}
          <div 
            className="absolute inset-0 border border-purple-500/30 pointer-events-none"
            style={{
              clipPath: "polygon(28% 0%, 72% 0%, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0% 72%, 0% 28%)", // Matching octagon shape
            }}
          ></div>

          {/* Heart button */}
          <div className="absolute top-2 right-4 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 hover:text-white cosmic-hover-glow"
            >
              <Heart className="h-3 w-3" />
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute left-4 top-2 flex flex-col gap-1 z-10">
            {item.isExclusive && (
              <Badge className="bg-purple-500 text-white text-xs py-0">
                Exclusive
              </Badge>
            )}
            {item.isBestseller && (
              <Badge className="bg-amber-500 text-white text-xs py-0">
                Bestseller
              </Badge>
            )}
            {item.discount && (
              <Badge className="bg-emerald-500 text-white text-xs py-0">
                {item.discount}% Off
              </Badge>
            )}
          </div>
        </div>

        <div className="w-full text-center">
          <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-1 overflow-ellipsis">{item.name}</h3>
          <p className="text-muted-foreground text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[2.5rem] overflow-hidden">{item.description}</p>

          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="flex items-center">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 fill-amber-400" />
              <span className="ml-1 text-xs sm:text-sm font-medium">{item.rating}</span>
            </div>
            <span className="mx-1 sm:mx-2 text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{item.reviews} reviews</span>
          </div>

          <div className="flex justify-between items-center px-2 mb-2 sm:mb-3">
            <div>
              {item.discount ? (
                <div className="flex flex-col items-start">
                  <span className="text-base sm:text-lg font-bold">
                    ${(item.price * (1 - item.discount / 100)).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-base sm:text-lg font-bold">${item.price.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Two-button layout with consistent naming as requested */}
          <div className="shop-item-buttons flex w-full gap-2 mt-1">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 py-1 h-8 sm:h-9 text-xs sm:text-sm border-purple-400 text-purple-500 hover:text-purple-700 hover:bg-purple-50 cosmic-hover-glow"
              onClick={handleViewProduct}
            >
              Explore
            </Button>
            
            <Button 
              size="sm" 
              className="flex-1 py-1 h-8 sm:h-9 text-xs sm:text-sm gap-1 bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border-0 cosmic-hover-glow"
              onClick={() => onAddToCart && onAddToCart(item)}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CosmicCollectibles;