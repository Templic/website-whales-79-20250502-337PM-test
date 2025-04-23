/**
 * CosmicCollectibles.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */
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

// Sample collection items data
const collectionItems: CollectionItem[] = [
  {
    id: "item-1",
    name: "Celestial Harmonic Pendant",
    description: "This pendant is tuned to the frequency of celestial harmonies, helping you connect with cosmic energies.",
    price: 89.99,
    image: "/placeholder.svg?height=200&width=200&text=Pendant",
    category: "jewelry",
    isFeatured: true,
    isExclusive: true,
    rating: 4.9,
    reviews: 128
  },
  {
    id: "item-2",
    name: "Cosmic Voyager Journal",
    description: "Record your spiritual journeys with this handcrafted journal made from recycled materials.",
    price: 34.99,
    image: "/placeholder.svg?height=200&width=200&text=Journal",
    category: "accessories",
    isBestseller: true,
    rating: 4.8,
    reviews: 97,
    discount: 15
  },
  {
    id: "item-3",
    name: "Starseed Oracle Deck",
    description: "A beautifully illustrated oracle deck to guide your spiritual practice and cosmic connection.",
    price: 42.99,
    image: "/placeholder.svg?height=200&width=200&text=Oracle+Deck",
    category: "spiritual",
    isFeatured: true,
    rating: 4.7,
    reviews: 156
  },
  {
    id: "item-4",
    name: "Nebula Meditation Cushion",
    description: "Ergonomic meditation cushion with cosmic-inspired design for comfort during long sessions.",
    price: 64.99,
    image: "/placeholder.svg?height=200&width=200&text=Cushion",
    category: "home",
    rating: 4.6,
    reviews: 83
  },
  {
    id: "item-5",
    name: "Astral Journey Incense Set",
    description: "Handcrafted incense made from ethically sourced herbs to enhance your meditation experience.",
    price: 19.99,
    image: "/placeholder.svg?height=200&width=200&text=Incense",
    category: "spiritual",
    isBestseller: true,
    rating: 4.5,
    reviews: 211,
    discount: 10
  },
  {
    id: "item-6",
    name: "Cosmic Frequency T-Shirt",
    description: "Organic cotton tee with sacred geometry design that resonates with cosmic frequencies.",
    price: 29.99,
    image: "/placeholder.svg?height=200&width=200&text=Tshirt",
    category: "clothing",
    rating: 4.4,
    reviews: 76
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
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
            backgroundColor: "rgba(155, 135, 245, 0.05)"
          }}
        />
        <div className="relative z-10 flex items-center gap-3 px-6 py-6">
          <CosmicIcon name="star" size={24} className="text-purple-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 cosmic-text-glow">
            Cosmic Collectibles & Rewards
          </h2>
          <div className="ml-auto bg-indigo-900/80 px-6 py-2 rounded-md flex items-center">
            <span className="mr-2 text-sm text-purple-200">1250 Points</span>
            <Button 
              variant="link" 
              className="text-purple-300 hover:text-purple-100 p-0 h-auto text-sm"
            >
              View Collectibles
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="jewelry">Jewelry</TabsTrigger>
          <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
          <TabsTrigger value="clothing">Clothing</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
          <TabsTrigger value="home">Home</TabsTrigger>
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
        <Button size="lg">
          View All Collectibles
        </Button>
      </div>
    </div>
  );
};

// Card component for collection items with elliptical image container
const CollectibleCard: React.FC<{ item: CollectionItem, onAddToCart?: (product$2 => void }> = ({ item, onAddToCart }) => {
  return (
    <Card className="cosmic-glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <div className="p-4 flex flex-col items-center">
        {/* Elliptical image container */}
        <div className="relative w-full aspect-[5/4] mb-4 overflow-hidden">
          <div 
            className="absolute inset-0 border border-purple-500/20 overflow-hidden flex items-center justify-center"
            style={{
              borderRadius: "50%",
              background: "linear-gradient(to bottom, rgba(75, 0, 130, 0.1), rgba(20, 20, 60, 0.2))"
            }}
          >
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Purple border overlay */}
          <div 
            className="absolute inset-0 border border-purple-500/30 pointer-events-none"
            style={{ borderRadius: "50%" }}
          ></div>

          {/* Heart button */}
          <div className="absolute top-2 right-4 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 hover:text-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute left-4 top-2 flex flex-col gap-2 z-10">
            {item.isExclusive && (
              <Badge className="bg-purple-500 text-white">
                Exclusive
              </Badge>
            )}
            {item.isBestseller && (
              <Badge className="bg-amber-500 text-white">
                Bestseller
              </Badge>
            )}
            {item.discount && (
              <Badge className="bg-emerald-500 text-white">
                {item.discount}% Off
              </Badge>
            )}
          </div>
        </div>

        <div className="w-full text-center">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{item.name}</h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.description}</p>

          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="ml-1 text-sm font-medium">{item.rating}</span>
            </div>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{item.reviews} reviews</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              {item.discount ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">
                    ${(item.price * (1 - item.discount / 100)).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-bold">${item.price.toFixed(2)}</span>
              )}
            </div>

            <Button 
              size="sm" 
              className="gap-1 ml-auto"
              onClick={() => onAddToCart && onAddToCart(item)}
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CosmicCollectibles;