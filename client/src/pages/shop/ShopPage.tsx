/**
 * ShopPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import EnhancedShoppingExperience from "@/components/shop/EnhancedShoppingExperience";
import CosmicCollectibles from "@/components/shop/CosmicCollectibles";
import ProductComparison from "@/components/shop/ProductComparison";
import EnhancedShoppingVenn from "@/components/shop/EnhancedShoppingVenn";
import "@/components/shop/shop-animations.css";
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
    image: "/images/products/crystal-bowl.jpg", // Crystal singing bowl
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
    image: "/images/products/energy-pendant.jpg",
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
    image: "/images/products/cosmic-frequency-album.png",
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
    image: "/images/products/meditation-cushion.jpg",
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
    image: "/images/products/sacred-geometry.jpg",
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
    image: "/images/products/cosmic-journal.jpg",
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

export default function ShopPage() {
  const [, params] = useRoute('/shop/:category?');
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cosmic-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<string>("featured");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [userPoints, setUserPoints] = useState(1200); // Sample loyalty points for the user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation effect for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.cosmic-slide-up, .cosmic-scale, .cosmic-fade-in');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('in');
      }, index * 100);
    });
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cosmic-cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('cosmic-cart');
    }
  }, [cart]);

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
    
    // Add an animation to the cart button
    const cartButton = document.querySelector('.cart-floating-button');
    if (cartButton) {
      cartButton.classList.add('cart-bump');
      setTimeout(() => {
        cartButton.classList.remove('cart-bump');
      }, 300);
    }
    
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
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading products</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-sm text-red-600 dark:text-red-400"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto">
          {/* Hero Section with Trapezoid/Triangle Background */}
          <div className="relative py-12 mb-12 cosmic-slide-up">
            {/* Trapezoid background */}
            <div 
              className="absolute inset-0 -mx-4 md:-mx-12 z-0"
              style={{
                clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
                background: "linear-gradient(180deg, rgba(75, 0, 130, 0.1), rgba(25, 25, 70, 0.15))",
                borderBottom: "1px solid rgba(155, 135, 245, 0.2)"
              }}
            ></div>
            
            {/* Hero content */}
            <div className="relative z-10 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 cosmic-text-glow relative z-10">
                Shop Our Cosmic Collection
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground mb-8">
                Handcrafted items imbued with healing frequencies for mind, body, and Spirit.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search cosmic merchandise..."
                    className="pl-9 bg-indigo-950/30 border-purple-500/20"
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
                          <div className="px-1">
                            {/* Here would normally be a proper slider component */}
                            <input 
                              type="range" 
                              min="0" 
                              max="200" 
                              step="10"
                              value={priceRange[1]}
                              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Availability</h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="in-stock" className="mr-2" />
                            <label htmlFor="in-stock">In Stock Only</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="new-arrivals" className="mr-2" />
                            <label htmlFor="new-arrivals">New Arrivals</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 items-center">
                      <ChevronDown className="h-4 w-4" />
                      <span>Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Sort Products</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                      <DropdownMenuRadioItem value="featured">Featured</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-low-high">Price: Low to High</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="price-high-low">Price: High to Low</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rating">Best Rating</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2 items-center md:hidden">
                      {viewType === "grid" ? <Grid3X3 className="h-4 w-4" /> : <ListFilter className="h-4 w-4" />}
                      <span>View</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={viewType} onValueChange={(v) => setViewType(v as "grid" | "list")}>
                      <DropdownMenuRadioItem value="grid">Grid View</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="list">List View</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="mb-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {categoryFilter.length > 0 
                  ? `${categoryFilter.join(", ")} Products` 
                  : "All Products"}
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg py-12 text-center">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filter criteria to find what you're looking for.
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter([]);
                    setPriceRange([0, 200]);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewType === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {filteredProducts.map((product) => (
                  <Card key={product.id} className={`overflow-hidden transition-all duration-300 group cosmic-card ${viewType === "list" ? "flex" : ""}`}>
                    <div className={`relative ${viewType === "list" ? "w-1/3" : "h-48 sm:h-60"}`}>
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${product.image})` }}
                      ></div>
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {product.featured && (
                        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
                          Featured
                        </div>
                      )}
                      {product.new && (
                        <div className="absolute top-2 right-2 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs font-medium">
                          New
                        </div>
                      )}
                      {product.discountPercent && (
                        <div className="absolute bottom-2 left-2 bg-yellow-500/90 text-white px-2 py-0.5 rounded text-xs font-medium">
                          {product.discountPercent}% OFF
                        </div>
                      )}
                    </div>
                    <div className={`p-4 ${viewType === "list" ? "w-2/3" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="flex items-center text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs ml-1">{product.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="font-semibold">${product.price.toFixed(2)}</div>
                        <Button 
                          size="sm" 
                          disabled={!product.inStock}
                          onClick={() => addToCart(product)}
                          className="cosmic-hover-glow"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Enhanced Shopping Components */}
          <EnhancedShoppingExperience />
          <div className="mt-16">
            <EnhancedShoppingVenn />
          </div>
          <div className="mt-16">
            <CosmicCollectibles />
          </div>
          <div className="mt-16">
            <ProductComparison />
          </div>
        </div>
        
        {/* Floating Shopping Cart */}
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg cart-floating-button cosmic-hover-glow"
              size="icon"
              variant="default"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs animate-bounce-small">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Your Cosmic Cart</SheetTitle>
              <SheetDescription>
                Review your selected items and proceed to checkout
              </SheetDescription>
            </SheetHeader>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full -mt-16">
                <div className="my-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-medium">Your cart is empty</h3>
                <p className="text-muted-foreground mt-2 text-center">
                  Add some items to your cart to see them here.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="space-y-4 max-h-[60vh] overflow-auto pb-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex border-b border-border pb-4">
                      <div 
                        className="w-16 h-16 rounded-md bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${item.product.image})` }}
                      ></div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
                          <button 
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div className="text-sm text-muted-foreground">
                            ${item.product.price.toFixed(2)} × {item.quantity}
                          </div>
                          <div className="font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg mb-6">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
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
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}