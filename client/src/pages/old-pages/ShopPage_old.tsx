import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import ShopHeader from '@/components/shop/ShopHeader';
import ProductGrid from '@/components/shop/ProductGrid';
import ProductFilters from '@/components/shop/ProductFilters';
import ShoppingCart from '@/components/shop/ShoppingCart';
import { ShoppingBag, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';

// Product types
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
}

interface CartItem {
  product: Product;
  quantity: number;
}

// ShopPage component
export default function ShopPage_old() {
  const [, params] = useRoute('/shop/:category?');
  const { toast } = useToast();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products', params?.category, searchQuery, priceRange, selectedCategories],
    queryFn: async () => {
      const categoryParam = params?.category ? `category=${params.category}` : '';
      const searchParam = searchQuery ? `search=${searchQuery}` : '';
      const priceParam = `minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
      const categoriesParam = selectedCategories.length 
        ? selectedCategories.map(c => `categories=${c}`).join('&') 
        : '';
      
      const queryString = [categoryParam, searchParam, priceParam, categoriesParam]
        .filter(Boolean)
        .join('&');
      
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;
      
      try {
        // TODO: Replace with actual API call once backend is ready
        // const response = await apiRequest(url);
        // return response as Product[];
        return getMockProducts();
      } catch (err: unknown) {
        console.error('Error fetching products:', err);
        return getMockProducts();
      }
    },
  });
  
  // Fetch categories for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        // TODO: Replace with actual API call once backend is ready
        // const response = await apiRequest('/api/categories');
        // return response as string[];
        return ['Clothing', 'Accessories', 'Art', 'Music', 'Digital'];
      } catch (err: unknown) {
        console.error('Error fetching categories:', err);
        return ['Clothing', 'Accessories', 'Art', 'Music', 'Digital'];
      }
    },
  });
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Handle voice search
  const handleVoiceSearch = (transcript: string) => {
    setSearchQuery(transcript);
    toast({
      title: "Voice Search",
      description: `Searching for: "${transcript}"`,
    });
  };
  
  // Handle price filter
  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
  };
  
  // Handle category filter
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };
  
  // Add to cart
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { product, quantity }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };
  
  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
      variant: "destructive",
    });
  };
  
  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Checkout function
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some products to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to checkout page with cart items
    // The actual implementation would involve sending the cart to the backend
    // For now, we'll just navigate to a checkout page
    // window.location.href = '/checkout';
    toast({
      title: "Checkout",
      description: "Proceeding to checkout...",
    });
  };
  
  // Filter products based on search query and filters
  const filteredProducts = products;
  
  return (
    <div className="container mx-auto px-4 py-6 min-h-screen cosmic-shop-bg">
      <ShopHeader 
        onSearch={handleSearch} 
        onVoiceSearch={handleVoiceSearch}
        cartItemCount={cartItemCount}
      />
      
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Mobile Filter Button */}
        <div className="md:hidden w-full">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
        
        {/* Filters - Desktop Sidebar, Mobile Drawer */}
        {isDesktop ? (
          <div className="w-64 shrink-0">
            <ProductFilters 
              categories={categories}
              selectedCategories={selectedCategories}
              priceRange={priceRange}
              onPriceChange={handlePriceChange}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        ) : (
          <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <DrawerContent>
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                <ProductFilters 
                  categories={categories}
                  selectedCategories={selectedCategories}
                  priceRange={priceRange}
                  onPriceChange={handlePriceChange}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </DrawerContent>
          </Drawer>
        )}
        
        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-96">
              <p>Error loading products. Please try again later.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-96">
              <p className="text-lg mb-4">No products found matching your criteria.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setPriceRange([0, 1000]);
                  setSelectedCategories([]);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <ProductGrid 
              products={filteredProducts} 
              onAddToCart={addToCart}
            />
          )}
        </div>
      </div>
      
      {/* Shopping Cart - Sheet on desktop, Drawer on mobile */}
      {isDesktop ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg cosmic-btn"
              size="icon"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            <ShoppingCart 
              cartItems={cart}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeFromCart}
              onCheckout={handleCheckout}
              total={cartTotal}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg cosmic-btn"
              size="icon"
            >
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="px-4 py-2">
              <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
              <ShoppingCart 
                cartItems={cart}
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={handleCheckout}
                total={cartTotal}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

// Mock products function (temporary until backend is connected)
function getMockProducts(): Product[] {
  return [
    {
      id: '1',
      name: 'Cosmic Harmony T-Shirt',
      description: 'A unique t-shirt featuring our cosmic harmony design.',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      categories: ['Clothing', 'Featured'],
      rating: 4.5,
      inStock: true,
      featured: true
    },
    {
      id: '2',
      name: 'Astral Journey Wall Art',
      description: 'Limited edition wall art print showcasing the astral journey.',
      price: 149.99,
      image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      categories: ['Art', 'Home'],
      rating: 5,
      inStock: true
    },
    {
      id: '3',
      name: 'Cosmic Beats Digital Album',
      description: 'Experience the stellar sounds of the cosmic beats digital album.',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=769&q=80',
      categories: ['Music', 'Digital'],
      rating: 4.8,
      inStock: true
    },
    {
      id: '4',
      name: 'Nebula Crystal Pendant',
      description: 'Handcrafted crystal pendant inspired by distant nebulae.',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      categories: ['Accessories', 'Featured'],
      rating: 4.7,
      inStock: true,
      featured: true
    },
    {
      id: '5',
      name: 'Stardust Hoodie',
      description: 'Cozy hoodie with our signature stardust pattern.',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      categories: ['Clothing'],
      rating: 4.2,
      inStock: true,
      discountPercent: 15,
      new: true
    },
    {
      id: '6',
      name: 'Galaxy Explorer VR Experience',
      description: 'Digital download for our immersive Galaxy Explorer VR experience.',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=878&q=80',
      categories: ['Digital', 'Featured'],
      rating: 4.9,
      inStock: true,
      featured: true,
      new: true
    }
  ];
}