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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Search</h2>
            <ProductSearchComponent 
              placeholder="Search products..."
              className="w-full"
              onResultClick={handleProductSelect}
            />
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-2">Categories</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <Button
                  variant={category === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start px-2"
                  onClick={() => setCategory('all')}
                >
                  All Categories
                </Button>
              </div>
              
              {categoryList.map(cat => (
                <div className="flex items-center" key={cat}>
                  <Button
                    variant={category === cat ? 'default' : 'ghost'}
                    className="w-full justify-start px-2"
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-2">Price Range</h2>
            <div className="space-y-3">
              <Slider
                value={priceRange}
                min={0}
                max={1000}
                step={10}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="my-6"
              />
              <div className="flex justify-between">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-2">Sort By</h2>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Shop</h1>
            {searchQuery && (
              <p className="text-muted-foreground">
                Search results for "{searchQuery}"
                {category !== 'all' && ` in ${category}`}
              </p>
            )}
            {!searchQuery && category !== 'all' && (
              <p className="text-muted-foreground">
                Browsing {category}
              </p>
            )}
            
            {products && (
              <p className="text-muted-foreground mt-1">
                {products.length} products • {formatPriceRange()}
              </p>
            )}
          </div>
          
          {renderProducts()}
        </div>
      </div>
    </div>
  );
}