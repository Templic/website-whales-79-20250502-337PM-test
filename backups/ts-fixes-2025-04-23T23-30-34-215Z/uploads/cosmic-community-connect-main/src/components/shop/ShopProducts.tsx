import { useState, useEffect } from "react";
import { Product } from "@/pages/Shop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ShopProductsProps {
  addToCart: (product: Product) => void;
  selectedCategory: string | null;
  searchQuery: string;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Cosmic Harmony T-Shirt",
    description: "Handcrafted t-shirt with cosmic designs that resonate with healing frequencies.",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    category: "clothing",
    backstory: "The design for this shirt came to us during a deep meditation session under the stars at Joshua Tree. The patterns channel the energy of celestial bodies.",
    inspiration: "Inspired by ancient star maps and the geometric patterns of cosmic energy fields that surround us all."
  },
  {
    id: "2",
    name: "Celestial Sound Pendant",
    description: "A beautiful pendant that vibrates with cosmic energy, enhancing your connection to universal harmonies.",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    category: "accessories",
    backstory: "Each pendant is tuned to 528Hz, the 'love frequency' that promotes transformation and miraculous changes. Craftspeople meditate before creating each piece.",
    inspiration: "Inspired by the sacred geometry found in nature and throughout the universe, particularly the Golden Ratio."
  },
  {
    id: "3",
    name: "Cosmic Dreams Vinyl",
    description: "Limited edition vinyl record with our most popular cosmic healing tracks embedded with intentions of peace.",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    category: "music",
    backstory: "Recorded during a rare celestial alignment that only occurs once every 12 years. The ambient sounds of the cosmos were captured and woven into the background of each track.",
    inspiration: "Inspired by the sounds of space – the actual electromagnetic vibrations of planets converted into audible frequencies."
  },
  {
    id: "4",
    name: "Astral Projection Hoodie",
    description: "Comfortable hoodie designed with sacred geometry patterns that aid in meditation and astral journeys.",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    category: "clothing"
  },
  {
    id: "5",
    name: "Frequency Crystal Set",
    description: "Set of tuned crystals that complement our music frequencies for deeper healing experiences.",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    category: "collectibles",
    backstory: "These crystals were sourced from ancient energy vortexes around the world. Each set is cleansed under the full moon and programmed with specific healing intentions.",
    inspiration: "Inspired by the ancient crystal healing traditions of Atlantis and Lemuria, combining modern quantum physics with ancient wisdom."
  },
  {
    id: "6",
    name: "Cosmic Healing Digital Album",
    description: "Our complete cosmic healing collection in high-definition digital format with bonus meditation guides.",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    category: "music"
  }
];

const ShopProducts = ({ addToCart, selectedCategory, searchQuery }: ShopProductsProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  
  useEffect(() => {
    if (selectedCategory !== null) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);
  
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value);
  };
  
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = 
      localSearchQuery === "" || 
      product.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(localSearchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearchQuery}
            onChange={handleSearch}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
      </div>
      
      <Tabs 
        value={activeCategory} 
        onValueChange={setActiveCategory}
        className="mb-8"
      >
        <TabsList className="bg-muted/50 backdrop-blur-md">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-cosmic-primary data-[state=active]:text-white"
          >
            All Items
          </TabsTrigger>
          <TabsTrigger 
            value="clothing" 
            className="data-[state=active]:bg-cosmic-primary data-[state=active]:text-white"
          >
            Clothing
          </TabsTrigger>
          <TabsTrigger 
            value="accessories" 
            className="data-[state=active]:bg-cosmic-primary data-[state=active]:text-white"
          >
            Accessories
          </TabsTrigger>
          <TabsTrigger 
            value="music" 
            className="data-[state=active]:bg-cosmic-primary data-[state=active]:text-white"
          >
            Music
          </TabsTrigger>
          <TabsTrigger 
            value="collectibles" 
            className="data-[state=active]:bg-cosmic-primary data-[state=active]:text-white"
          >
            Collectibles
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  addToCart={addToCart} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product) => void;
}

const ProductCard = ({ product, addToCart }: ProductCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasStory = product.backstory || product.inspiration;

  return (
    <Card id={`product-${product.id}`} className="cosmic-card overflow-hidden group transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50"></div>
        <div className="absolute top-2 right-2 bg-cosmic-primary/80 text-white px-2 py-1 text-xs rounded-full">
          ${product.price.toFixed(2)}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-cosmic-primary">{product.name}</h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
        
        {hasStory && (
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mb-4 space-y-2 border-t border-b border-cosmic-primary/20 py-2"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm text-cosmic-primary hover:underline focus:outline-none">
              <span>Detailed Description</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 animate-accordion-down">
              {product.backstory && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-cosmic-primary/80">The Story</h4>
                  <p className="text-sm text-muted-foreground">{product.backstory}</p>
                </div>
              )}
              {product.inspiration && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-cosmic-primary/80">Our Inspiration</h4>
                  <p className="text-sm text-muted-foreground">{product.inspiration}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <Button 
          onClick={() => addToCart(product)}
          className="w-full bg-cosmic-primary hover:bg-cosmic-vivid text-white"
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShopProducts;
