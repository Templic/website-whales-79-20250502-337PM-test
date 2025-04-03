import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import EnhancedShoppingExperience from "@/components/shop/EnhancedShoppingExperience";
import CosmicCollectibles from "@/components/shop/CosmicCollectibles";
import ProductComparison from "@/components/shop/ProductComparison";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Star, 
  Filter, 
  Grid3X3, 
  ListFilter, 
  ChevronDown, 
  ShoppingCart,
  Search,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  inStock: boolean;
  categories: string[];
  featured?: boolean;
  new?: boolean;
  discountPercent?: number;
  attributes?: {
    [key: string]: string;
  };
}

// Sample products data
const sampleProducts: Product[] = [
  {
    id: "prod-1",
    name: "Celestial Crystal Sound Bowl",
    description: "Hand-crafted crystal bowl tuned to 432Hz frequency for deep healing vibrations. Each bowl is cleansed and charged under the full moon.",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=500&q=80",
    rating: 4.8,
    inStock: true,
    categories: ["Healing Tools", "Sound Therapy", "Premium"],
    featured: true,
    attributes: {
      material: "Crystal Quartz",
      frequency: "432Hz",
      diameter: "8 inches"
    }
  },
  {
    id: "prod-2",
    name: "Cosmic Energy Pendant",
    description: "Handcrafted pendant containing specialized crystals that resonate with cosmic frequencies. Designed to balance your energy field and enhance intuition.",
    price: 45.99,
    image: "https://images.unsplash.com/photo-1611085583191-a3b181e82182?auto=format&fit=crop&w=500&q=80",
    rating: 4.6,
    inStock: true,
    categories: ["Jewelry", "Energy Tools"],
    new: true,
    attributes: {
      material: "Sterling Silver with Labradorite",
      length: "18 inches",
      cleansing: "Moonlight charged"
    }
  },
  {
    id: "prod-3",
    name: "Cosmic Frequency Digital Album",
    description: "A collection of 12 tracks specifically designed to activate different energy centers. Features binaural beats and isochronic tones layered with ambient sounds.",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80",
    rating: 4.9,
    inStock: true,
    categories: ["Digital", "Music", "Featured"],
    discountPercent: 15,
    attributes: {
      format: "Digital Download (FLAC + MP3)",
      length: "74 minutes",
      tracks: "12"
    }
  },
  {
    id: "prod-4",
    name: "Meditation Cushion Set",
    description: "Ergonomically designed meditation cushion set with cosmic pattern. Created for proper alignment during extended meditation sessions.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1610380724313-576f33445b71?auto=format&fit=crop&w=500&q=80",
    rating: 4.7,
    inStock: true,
    categories: ["Meditation", "Home"],
    attributes: {
      material: "Organic Cotton",
      filling: "Buckwheat hulls",
      dimensions: "16\" diameter, 6\" height"
    }
  },
  {
    id: "prod-5",
    name: "Sacred Geometry Wall Art",
    description: "Hand-painted sacred geometry artwork design to enhance the energetic field of your space. Available in multiple geometric patterns.",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1551732998-9573f695fdbb?auto=format&fit=crop&w=500&q=80",
    rating: 4.9,
    inStock: false,
    categories: ["Art", "Home", "Premium"],
    featured: true,
    attributes: {
      material: "Canvas and non-toxic paint",
      size: "24\" x 24\"",
      pattern: "Metatron's Cube"
    }
  },
  {
    id: "prod-6",
    name: "Cosmic Journey Journal",
    description: "Beautifully designed journal with prompts to document your spiritual journey, dreams, and cosmic insights. Includes moon phase tracking.",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=500&q=80",
    rating: 4.5,
    inStock: true,
    categories: ["Books", "Self-Development"],
    new: true,
    discountPercent: 10,
    attributes: {
      pages: "200 with gilt edges",
      material: "Vegan leather cover",
      extras: "Ribbon bookmark, elastic closure"
    }
  }
];

// Cart item interface
interface CartItem {
  product: Product;
  quantity: number;
}

export default function CosmicMerchandisePage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<string>("featured");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [userPoints, setUserPoints] = useState(1200); // Sample loyalty points for the user
  
  // Animation effect for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.cosmic-slide-up, .cosmic-scale, .cosmic-fade-in');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('in');
      }, index * 100);
    });
  }, []);

  // Extract all categories from products
  const allCategories = Array.from(
    new Set(products.flatMap((product) => product.categories))
  );

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.categories.some((category) => category.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter.length > 0) {
      filtered = filtered.filter((product) =>
        product.categories.some((category) => categoryFilter.includes(category))
      );
    }
    
    // Apply price range filter
    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Apply sorting
    switch (sortOrder) {
      case "price-low-high":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => (a.new === b.new ? 0 : a.new ? -1 : 1));
        break;
      case "featured":
      default:
        filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, priceRange, sortOrder]);

  // Add item to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
    
    // Add points for each item added to cart (in a real app this would happen on purchase)
    setUserPoints((prev) => prev + Math.round(product.price));
  };
  
  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter((item) => item.product.id !== productId);
      }
    });
  };
  
  // Calculate total cart value
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  
  // Handle viewing a product
  const handleProductView = (productId: string) => {
    console.log(`Viewing product: ${productId}`);
    // In a real app, this would navigate to a product detail page
  };
  
  // Toggle category in filter
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.4} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 cosmic-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              Cosmic Merchandise Shop
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground mb-6">
              Explore our collection of consciously designed products to enhance your cosmic journey and spiritual practice.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                      Narrow down products based on your preferences
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map((category) => (
                          <Badge
                            key={category}
                            variant={categoryFilter.includes(category) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleCategoryFilter(category)}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Price Range</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                        {/* Price range slider would go here */}
                        <div className="h-1 bg-muted rounded-full relative">
                          <div 
                            className="absolute h-full bg-purple-500 rounded-full"
                            style={{ 
                              left: `${(priceRange[0] / 200) * 100}%`, 
                              width: `${((priceRange[1] - priceRange[0]) / 200) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Availability</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="cursor-pointer">
                          In Stock Only
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          New Arrivals
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer">
                          On Sale
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => {
                      setCategoryFilter([]);
                      setPriceRange([0, 200]);
                    }}>
                      Reset Filters
                    </Button>
                    <Button>Apply Filters</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Enhanced Shopping Experience - From Lovable.dev */}
          <div className="mb-12 cosmic-scale">
            <EnhancedShoppingExperience 
              onProductView={handleProductView}
              products={products}
            />
          </div>
          
          {/* Product Comparison Section */}
          <div className="mb-12 cosmic-fade-in">
            <ProductComparison 
              products={products} 
              onAddToCart={addToCart}
            />
          </div>
          
          {/* Products Section */}
          <div className="mb-12 cosmic-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                Products
                {filteredProducts.length > 0 && (
                  <span className="text-muted-foreground font-normal text-base ml-2">
                    ({filteredProducts.length} items)
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ListFilter className="h-4 w-4 mr-2" />
                      <span>Sort</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                      <DropdownMenuRadioItem value="featured">Featured</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-low-high">Price: Low to High</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-high-low">Price: High to Low</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rating">Customer Rating</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={viewType === "grid" ? "bg-muted" : ""}
                    onClick={() => setViewType("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={viewType === "list" ? "bg-muted" : ""}
                    onClick={() => setViewType("list")}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter([]);
                    setPriceRange([0, 200]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : viewType === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden flex flex-col cosmic-hover-scale cosmic-glass-card"
                  >
                    <div className="relative aspect-square">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0 left-0 w-full flex justify-between p-2">
                        {product.featured && (
                          <Badge className="bg-purple-500">
                            Featured
                          </Badge>
                        )}
                        {product.new && (
                          <Badge className="bg-cyan-500">
                            New
                          </Badge>
                        )}
                      </div>
                      {product.discountPercent && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500">
                            {product.discountPercent}% OFF
                          </Badge>
                        </div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <div className="mb-auto">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium line-clamp-1">{product.name}</h3>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-1" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.categories.map((category, idx) => (
                            <span 
                              key={`${product.id}-cat-${idx}`}
                              className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full truncate max-w-[80px]"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                      </div>
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            {product.discountPercent ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold">${(product.price * (1 - product.discountPercent / 100)).toFixed(2)}</span>
                                <span className="text-sm line-through text-muted-foreground">${product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          disabled={!product.inStock}
                          onClick={() => addToCart(product)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cosmic-glass-card overflow-hidden hover:border-purple-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-48 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {!product.inStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-medium">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="flex items-center mt-1 sm:mt-0">
                            {product.featured && (
                              <Badge className="mr-2 bg-purple-500">
                                Featured
                              </Badge>
                            )}
                            {product.new && (
                              <Badge className="mr-2 bg-cyan-500">
                                New
                              </Badge>
                            )}
                            {product.discountPercent && (
                              <Badge className="mr-2 bg-green-500">
                                {product.discountPercent}% OFF
                              </Badge>
                            )}
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-1" />
                              <span className="text-xs">{product.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.categories.map((category, idx) => (
                            <span 
                              key={`${product.id}-cat-${idx}`}
                              className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="mb-2 sm:mb-0">
                            {product.discountPercent ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold">${(product.price * (1 - product.discountPercent / 100)).toFixed(2)}</span>
                                <span className="text-sm line-through text-muted-foreground">${product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              onClick={() => handleProductView(product.id)}
                            >
                              View Details
                            </Button>
                            <Button 
                              disabled={!product.inStock}
                              onClick={() => addToCart(product)}
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Collectibles Section - From Lovable.dev */}
          <div className="mb-12 cosmic-scale">
            <CosmicCollectibles userPoints={userPoints} />
          </div>
          
          {/* Shopping Cart Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="fixed bottom-4 right-4 z-10 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg border-purple-500/30"
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 rounded-full bg-purple-500 px-2 min-w-[1.5rem] h-6 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Your Shopping Cart</SheetTitle>
                <SheetDescription>
                  {cart.length === 0
                    ? "Your cart is empty. Add some cosmic items!"
                    : `You have ${cart.reduce((total, item) => total + item.quantity, 0)} items in your cart.`}
                </SheetDescription>
              </SheetHeader>
              
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">Your cosmic cart awaits new treasures</p>
                  <Button>Browse Products</Button>
                </div>
              ) : (
                <div className="py-6">
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                          <div className="flex justify-between">
                            <div className="flex items-center mt-1">
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => addToCart(item.product)}
                              >
                                +
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${item.product.price.toFixed(2)} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2 text-muted-foreground">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Continue Shopping
                    </Button>
                    <Button className="flex-1">
                      Checkout
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Tag className="h-3 w-3" />
                    <span>You'll earn {Math.round(cartTotal)} loyalty points with this purchase</span>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}