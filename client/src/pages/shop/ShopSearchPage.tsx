/**
 * ShopSearchPage.tsx
 * 
 * A specialized search page for shop products
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, ShoppingCart, Tag, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ProductSearchComponent from '@/components/shop/ProductSearchComponent';

// Define product type
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  ratings?: {
    average: number;
    count: number;
  };
  inStock: boolean;
  imageUrl?: string;
}

// Sort options
type SortOption = 'newest' | 'price-low-high' | 'price-high-low' | 'rating' | 'name';

export default function ShopSearchPage() {
  // Get the search query from URL parameters
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const urlQuery = queryParams.get('q') || '';
  const urlCategory = queryParams.get('category') || 'all';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [categoryList, setCategoryList] = useState<string[]>([]);

  // Update the document title
  useEffect(() => {
    document.title = searchQuery 
      ? `Shop Search: ${searchQuery} - Dale Loves Whales` 
      : 'Shop - Dale Loves Whales';
  }, [searchQuery]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category !== 'all') params.set('category', category);
    
    const newUrl = `/shop/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, category]);

  // Fetch products data
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', searchQuery, category, priceRange, sortOption],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (category !== 'all') params.set('category', category);
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());
      params.set('sort', sortOption);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Fetch categories for filter
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/products/categories');
        if (response.ok) {
          const data = await response.json();
          setCategoryList(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    
    fetchCategories();
  }, []);

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled by the useQuery hook when dependencies change
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    window.location.href = `/shop/product/${product.id}`;
  };

  // Format price range for display
  const formatPriceRange = () => {
    return `$${priceRange[0]} - $${priceRange[1]}`;
  };

  // Render products grid or skeleton loading state
  const renderProducts = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square relative bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!products || products.length === 0) {
      return (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try different search terms or browse all products
          </p>
          <Button asChild>
            <a href="/shop">Browse All Products</a>
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div 
              className="aspect-square relative bg-muted"
              style={product.imageUrl ? {
                backgroundImage: `url(${product.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {!product.imageUrl && (
                <div className="flex items-center justify-center h-full">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-md font-medium">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                </div>
                
                {product.ratings && (
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400 mr-1" />
                    <span>{product.ratings.average.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              {product.category && (
                <Badge variant="outline" className="mt-2">
                  {product.category}
                </Badge>
              )}
              
              {product.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </CardContent>
            
            <CardFooter className="p-4 pt-0 gap-2">
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => handleProductSelect(product)}
              >
                View Details
              </Button>
              
              <Button 
                className="w-full"
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  useEffect(() => {
    // Scroll to top when the page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic Background with purple/blue gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-950 via-indigo-950 to-violet-950 z-0" />
      
      {/* Sacred Geometry Patterns */}
      <div className="fixed inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 transform -translate-x-1/4 -translate-y-1/4">
          <div className="w-full h-full border-2 border-indigo-400 rounded-full" />
          <div className="absolute inset-4 border-2 border-blue-400 rounded-full" />
          <div className="absolute inset-8 border-2 border-violet-400 rounded-full" />
          <div className="absolute inset-12 border-2 border-pink-400 rounded-full" />
        </div>
        
        <div className="absolute bottom-0 right-0 w-96 h-96 transform translate-x-1/4 translate-y-1/4">
          <div className="w-full h-full border-2 border-indigo-400 rounded-full" />
          <div className="absolute inset-4 border-2 border-teal-400 rounded-full" />
          <div className="absolute inset-8 border-2 border-cyan-400 rounded-full" />
          <div className="absolute inset-12 border-2 border-blue-400 rounded-full" />
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30">
          <div className="w-96 h-96 border-2 border-white rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Animated stars */}
      <div className="fixed inset-0 z-0">
        {Array.from({length: 50}).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Main content with cosmic glass effect */}
      <div className="container relative z-10 mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Filters sidebar with cosmic styling */}
          <div className="w-full md:w-64 space-y-6 cosmic-glass-card p-6 rounded-xl backdrop-blur-sm">
            <div>
              <h2 className="text-lg font-medium mb-2 cosmic-gradient-text">Cosmic Search</h2>
              <ProductSearchComponent 
                placeholder="Search celestial products..."
                className="w-full cosmic-glass-field"
                onResultClick={handleProductSelect}
              />
            </div>
            
            <Separator className="bg-indigo-300/20" />
            
            <div>
              <h2 className="text-lg font-medium mb-2 cosmic-gradient-text">Sacred Categories</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Button
                    variant={category === 'all' ? 'default' : 'ghost'}
                    className={`w-full justify-start px-2 ${category === 'all' ? 'bg-indigo-800/70 hover:bg-indigo-700/70' : 'hover:bg-indigo-900/40'}`}
                    onClick={() => setCategory('all')}
                  >
                    All Categories
                  </Button>
                </div>
                
                {categoryList.map(cat => (
                  <div className="flex items-center" key={cat}>
                    <Button
                      variant={category === cat ? 'default' : 'ghost'}
                      className={`w-full justify-start px-2 ${category === cat ? 'bg-indigo-800/70 hover:bg-indigo-700/70' : 'hover:bg-indigo-900/40'}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="bg-indigo-300/20" />
            
            <div>
              <h2 className="text-lg font-medium mb-2 cosmic-gradient-text">Energy Exchange</h2>
              <div className="space-y-3">
                <Slider
                  value={priceRange}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="my-6 cosmic-slider"
                />
                <div className="flex justify-between cosmic-glow text-indigo-200">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>
            </div>
            
            <Separator className="bg-indigo-300/20" />
            
            <div>
              <h2 className="text-lg font-medium mb-2 cosmic-gradient-text">Cosmic Order</h2>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-full cosmic-glass-field border-indigo-300/30">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="cosmic-glass-card">
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price-low-high">Energy: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Energy: High to Low</SelectItem>
                  <SelectItem value="rating">Vibration Level</SelectItem>
                  <SelectItem value="name">Sacred Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-8 cosmic-glass-card p-6 rounded-xl backdrop-blur-sm">
              <h1 className="text-3xl font-bold mb-2 cosmic-gradient-text">Sacred Treasures</h1>
              {searchQuery && (
                <p className="text-indigo-200">
                  Search results for "{searchQuery}"
                  {category !== 'all' && ` in ${category}`}
                </p>
              )}
              {!searchQuery && category !== 'all' && (
                <p className="text-indigo-200">
                  Browsing {category}
                </p>
              )}
              
              {products && (
                <p className="text-indigo-200/80 mt-1">
                  {products.length} cosmic items • {formatPriceRange()}
                </p>
              )}
            </div>
            
            <div className="cosmic-glass-card p-6 rounded-xl backdrop-blur-sm">
              {renderProducts()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}