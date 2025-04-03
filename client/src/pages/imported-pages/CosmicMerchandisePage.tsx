import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EnhancedShoppingExperience from "@/components/shop/EnhancedShoppingExperience";
import CosmicCollectibles from "@/components/shop/CosmicCollectibles";
import ProductComparison from "@/components/shop/ProductComparison";
import ShopHeader from "@/components/shop/ShopHeader";
import { ShoppingBag } from "lucide-react";
import { Link } from "wouter";

// Product types defined for the merchandise shop
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categories: string[];
  rating: number;
  inStock: boolean;
  featured?: boolean;
  new?: boolean;
  discountPercent?: number;
  backstory?: string;
  inspiration?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Mock products for demo
const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Cosmic Harmony T-Shirt',
    description: 'A unique t-shirt featuring our cosmic harmony design.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=774&q=80',
    categories: ['Clothing', 'Featured'],
    rating: 4.5,
    inStock: true,
    featured: true,
    backstory: "The design for this shirt came to us during a deep meditation session under the stars at Joshua Tree. The patterns channel the energy of celestial bodies."
  },
  {
    id: '4',
    name: 'Nebula Crystal Pendant',
    description: 'Handcrafted crystal pendant inspired by distant nebulae.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=774&q=80',
    categories: ['Accessories', 'Featured'],
    rating: 4.7,
    inStock: true,
    featured: true,
    inspiration: "Inspired by the sacred geometry found in nature and throughout the universe, particularly the Golden Ratio."
  },
  {
    id: '6',
    name: 'Galaxy Explorer VR Experience',
    description: 'Digital download for our immersive Galaxy Explorer VR experience.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=878&q=80',
    categories: ['Digital', 'Featured'],
    rating: 4.9,
    inStock: true,
    featured: true,
    new: true
  }
];

export default function CosmicMerchandisePage() {
  const { toast } = useToast();
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Animation effect for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.cosmic-slide-up, .cosmic-scale, .cosmic-fade-in');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('in');
      }, index * 100);
    });
  }, []);

  // Cart functions
  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    
    // Add loyalty points when purchasing
    setLoyaltyPoints(prev => prev + Math.floor(product.price * 2));
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  // Product view handler for collaborative shopping
  const handleProductView = (productId: string) => {
    toast({
      title: "Product View",
      description: `Viewing product ID: ${productId}`,
    });
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.4} />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 cosmic-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              Cosmic Merchandise
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground mb-6">
              Explore our collection of cosmic-inspired merchandise, designed to enhance your spiritual journey and connect you with the universe.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link href="/shop">
                <Button size="lg">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Browse All Products</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced Shopping Experience */}
          <div className="mb-16 cosmic-fade-in">
            <EnhancedShoppingExperience 
              onProductView={handleProductView}
              products={FEATURED_PRODUCTS}
            />
          </div>
          
          {/* Cosmic Collectibles */}
          <div className="mb-16 cosmic-scale">
            <h2 className="text-2xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
              Cosmic Collectibles
            </h2>
            <CosmicCollectibles userPoints={loyaltyPoints} />
          </div>
          
          {/* Featured Products with Shop Now Section */}
          <div className="mb-16 cosmic-slide-up">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_PRODUCTS.map((product) => (
                <Card key={product.id} className="overflow-hidden cosmic-glass-card cosmic-hover-glow">
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    {product.backstory && (
                      <p className="text-xs text-muted-foreground mb-3 italic">
                        "{product.backstory.substring(0, 80)}..."
                      </p>
                    )}
                    <Button 
                      onClick={() => addToCart(product)} 
                      className="w-full"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Product Comparison */}
          <div className="cosmic-fade-in">
            <ProductComparison products={FEATURED_PRODUCTS} onAddToCart={addToCart} />
          </div>
        </div>
      </div>
    </div>
  );
}