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
  onAddToCart?: (product: any) => void;
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
      <div className="flex items-center gap-3 mb-8 cosmic-glass-card px-6 py-4 rounded-xl">
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

// Card component for collection items
const CollectibleCard: React.FC<{ item: CollectionItem, onAddToCart?: (product: any) => void }> = ({ item, onAddToCart }) => {
  return (
    <Card className="cosmic-glass-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-48 object-cover"
        />
        
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 hover:text-white"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-2">
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
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{item.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{item.description}</p>
        
        <div className="flex items-center mb-3">
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
            className="gap-1"
            onClick={() => onAddToCart && onAddToCart(item)}
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CosmicCollectibles;