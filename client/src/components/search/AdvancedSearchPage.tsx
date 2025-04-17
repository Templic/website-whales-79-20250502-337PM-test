/**
 * AdvancedSearchPage.tsx
 * 
 * An enhanced search page component that provides advanced filtering and
 * search capabilities across all content types.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Music, ShoppingBag, FileText, Settings, Tags, Calendar, X } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { UniversalSearchBar, searchCategories } from './UniversalSearchBar';

// Define filter types
interface PriceRange {
  min: number | null;
  max: number | null;
}

interface SearchFilters {
  music: {
    frequency: string;
    artist: string;
    releaseYear: string;
  };
  products: {
    priceRange: PriceRange;
    category: string;
    inStock: boolean | null;
  };
  posts: {
    tags: string[];
    dateRange: {
      from: string;
      to: string;
    };
  };
}

export default function AdvancedSearchPage() {
  // Location and URL state
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const urlQuery = queryParams.get('q') || '';
  const urlType = (queryParams.get('type') || 'all') as string;
  
  // State for search query and filters
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlType);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters state
  const [filters, setFilters] = useState<SearchFilters>({
    music: {
      frequency: '',
      artist: '',
      releaseYear: '',
    },
    products: {
      priceRange: { min: null, max: null },
      category: 'all',
      inStock: null,
    },
    posts: {
      tags: [],
      dateRange: {
        from: '',
        to: '',
      },
    },
  });
  
  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('type', selectedCategory);
    
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, selectedCategory]);
  
  // Update document title
  useEffect(() => {
    document.title = searchQuery 
      ? `Search: ${searchQuery} - Cosmic Music` 
      : 'Advanced Search - Cosmic Music';
  }, [searchQuery]);
  
  // Function to update specific filters
  const updateFilter = (
    category: keyof SearchFilters,
    field: string,
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };
  
  // Build query parameters for API call
  const buildQueryParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    
    // Basic search parameters
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('type', selectedCategory);
    
    // Add category-specific filters
    if (selectedCategory === 'music' || selectedCategory === 'all') {
      if (filters.music.frequency) params.set('frequency', filters.music.frequency);
      if (filters.music.artist) params.set('artist', filters.music.artist);
      if (filters.music.releaseYear) params.set('year', filters.music.releaseYear);
    }
    
    if (selectedCategory === 'products' || selectedCategory === 'all') {
      if (filters.products.priceRange.min !== null) 
        params.set('minPrice', filters.products.priceRange.min.toString());
      if (filters.products.priceRange.max !== null) 
        params.set('maxPrice', filters.products.priceRange.max.toString());
      if (filters.products.category !== 'all') 
        params.set('category', filters.products.category);
      if (filters.products.inStock !== null) 
        params.set('inStock', filters.products.inStock.toString());
    }
    
    if (selectedCategory === 'posts' || selectedCategory === 'all') {
      if (filters.posts.tags.length > 0) 
        params.set('tags', filters.posts.tags.join(','));
      if (filters.posts.dateRange.from) 
        params.set('dateFrom', filters.posts.dateRange.from);
      if (filters.posts.dateRange.to) 
        params.set('dateTo', filters.posts.dateRange.to);
    }
    
    return params;
  };
  
  // Query for search results
  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['advancedSearch', searchQuery, selectedCategory, filters],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === '') {
        return { music: [], products: [], posts: [], users: [] };
      }
      
      const params = buildQueryParams();
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });
  
  // Handle search form submission
  const handleSearch = (query: string, category: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    refetch();
  };
  
  // Toggle advanced filters visibility
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      music: {
        frequency: '',
        artist: '',
        releaseYear: '',
      },
      products: {
        priceRange: { min: null, max: null },
        category: 'all',
        inStock: null,
      },
      posts: {
        tags: [],
        dateRange: {
          from: '',
          to: '',
        },
      },
    });
  };
  
  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    clearAllFilters();
  };
  
  // Total result count
  const getTotalResultCount = () => {
    if (!results) return 0;
    
    return (
      (results.music?.length || 0) +
      (results.products?.length || 0) +
      (results.posts?.length || 0) +
      (results.users?.length || 0)
    );
  };
  
  // Renders category-specific filter UI
  const renderFilters = () => {
    switch (selectedCategory) {
      case 'music':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Frequency (Hz):</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="e.g. 432, 528"
                value={filters.music.frequency}
                onChange={(e) => updateFilter('music', 'frequency', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Artist:</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Artist name"
                value={filters.music.artist}
                onChange={(e) => updateFilter('music', 'artist', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Release Year:</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.music.releaseYear}
                onChange={(e) => updateFilter('music', 'releaseYear', e.target.value)}
              >
                <option value="">Any</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        );
        
      case 'products':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Price Range:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="Min"
                  value={filters.products.priceRange.min || ''}
                  onChange={(e) => updateFilter('products', 'priceRange', {
                    ...filters.products.priceRange,
                    min: e.target.value ? Number(e.target.value) : null
                  })}
                />
                <span>-</span>
                <input
                  type="number"
                  className="w-full p-2 border rounded-md"
                  placeholder="Max"
                  value={filters.products.priceRange.max || ''}
                  onChange={(e) => updateFilter('products', 'priceRange', {
                    ...filters.products.priceRange,
                    max: e.target.value ? Number(e.target.value) : null
                  })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category:</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.products.category}
                onChange={(e) => updateFilter('products', 'category', e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="cosmic-tools">Cosmic Tools</option>
                <option value="meditation">Meditation</option>
                <option value="accessories">Accessories</option>
                <option value="apparel">Apparel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Availability:</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.products.inStock === null ? '' : filters.products.inStock.toString()}
                onChange={(e) => {
                  const value = e.target.value === '' 
                    ? null 
                    : e.target.value === 'true' ? true : false;
                  updateFilter('products', 'inStock', value);
                }}
              >
                <option value="">Any</option>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>
        );
        
      case 'posts':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tags:</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Enter comma-separated tags"
                value={filters.posts.tags.join(',')}
                onChange={(e) => updateFilter('posts', 'tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Range:</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={filters.posts.dateRange.from}
                  onChange={(e) => updateFilter('posts', 'dateRange', {
                    ...filters.posts.dateRange,
                    from: e.target.value
                  })}
                />
                <span>to</span>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={filters.posts.dateRange.to}
                  onChange={(e) => updateFilter('posts', 'dateRange', {
                    ...filters.posts.dateRange,
                    to: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Content Type:</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {searchCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={clearAllFilters} variant="outline" className="mb-1">
                Clear Filters
              </Button>
              <Button onClick={() => refetch()} className="mb-1">
                Apply Filters
              </Button>
            </div>
          </div>
        );
    }
  };
  
  // Render search results
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!results || getTotalResultCount() === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your search query or filters to find what you're looking for.
          </p>
          {(searchQuery || selectedCategory !== 'all' || showAdvancedFilters) && (
            <Button onClick={resetSearch} variant="outline" className="mt-4">
              Reset Search
            </Button>
          )}
        </div>
      );
    }
    
    // Define which tab to show by default
    const defaultTabValue = selectedCategory !== 'all' ? selectedCategory : 
      results.music?.length ? 'music' : 
      results.products?.length ? 'products' : 
      results.posts?.length ? 'posts' : 'all';
    
    return (
      <Tabs defaultValue={defaultTabValue} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Results ({getTotalResultCount()})</TabsTrigger>
          {results.music?.length > 0 && (
            <TabsTrigger value="music">
              Music ({results.music.length})
            </TabsTrigger>
          )}
          {results.products?.length > 0 && (
            <TabsTrigger value="products">
              Products ({results.products.length})
            </TabsTrigger>
          )}
          {results.posts?.length > 0 && (
            <TabsTrigger value="posts">
              Blog Posts ({results.posts.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* All Results Tab */}
        <TabsContent value="all" className="space-y-8">
          {/* Music Results */}
          {results.music?.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <Music className="mr-2 h-5 w-5" />
                <h2 className="text-xl font-semibold">Music</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.music.slice(0, 4).map((track: any) => (
                  <Card key={track.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                          <Music className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                          <div className="flex flex-wrap gap-2">
                            {track.frequency && (
                              <Badge variant="outline">
                                {track.frequency} Hz
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {results.music.length > 4 && (
                <Button variant="link" className="mt-2" asChild>
                  <a href="/music/search">View all {results.music.length} music results</a>
                </Button>
              )}
            </section>
          )}
          
          {/* Products Results */}
          {results.products?.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <ShoppingBag className="mr-2 h-5 w-5" />
                <h2 className="text-xl font-semibold">Products</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.products.slice(0, 4).map((product: any) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                          <div className="flex flex-wrap gap-2">
                            {product.category && (
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {results.products.length > 4 && (
                <Button variant="link" className="mt-2" asChild>
                  <a href="/shop/search">View all {results.products.length} product results</a>
                </Button>
              )}
            </section>
          )}
          
          {/* Blog Posts Results */}
          {results.posts?.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <FileText className="mr-2 h-5 w-5" />
                <h2 className="text-xl font-semibold">Blog Posts</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.posts.slice(0, 4).map((post: any) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {post.tags?.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {results.posts.length > 4 && (
                <Button variant="link" className="mt-2" asChild>
                  <a href="/blog/search">View all {results.posts.length} blog post results</a>
                </Button>
              )}
            </section>
          )}
        </TabsContent>
        
        {/* Music Tab */}
        <TabsContent value="music" className="space-y-4">
          {results.music?.map((track: any) => (
            <Card key={track.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{track.title}</h3>
                      <p className="text-sm text-muted-foreground">{track.artist}</p>
                      <div className="flex flex-wrap gap-2">
                        {track.frequency && (
                          <Badge variant="outline">
                            {track.frequency} Hz
                          </Badge>
                        )}
                        {track.duration && (
                          <span className="text-xs text-muted-foreground">
                            {track.duration}
                          </span>
                        )}
                      </div>
                      {track.description && (
                        <p className="text-sm mt-2">{track.description}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/music/track/${track.id}`}>View</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {results.products?.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                      <div className="flex flex-wrap gap-2">
                        {product.category && (
                          <Badge variant="outline">
                            {product.category}
                          </Badge>
                        )}
                        {product.inStock === false && (
                          <Badge variant="secondary">Out of Stock</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm mt-2">{product.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/shop/product/${product.id}`}>View</a>
                    </Button>
                    <Button size="sm" disabled={product.inStock === false}>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Blog Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {results.posts?.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                      {post.excerpt && (
                        <p className="text-sm mt-2">{post.excerpt}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/blog/post/${post.id}`}>Read</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    );
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Advanced Search</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={toggleAdvancedFilters}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetSearch}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
      
      <div className="w-full">
        <UniversalSearchBar
          variant="expanded"
          defaultCategory={selectedCategory}
          placeholder="Search the entire library..."
          onSearch={handleSearch}
          darkMode={false}
          className="w-full"
        />
      </div>
      
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Advanced Filters</h2>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
            
            {renderFilters()}
          </CardContent>
        </Card>
      )}
      
      <Separator className="my-6" />
      
      {/* Display result count */}
      {searchQuery && !isLoading && (
        <div className="text-sm text-muted-foreground mb-4">
          Found {getTotalResultCount()} results for "{searchQuery}"
        </div>
      )}
      
      {/* Search Results */}
      {renderResults()}
    </div>
  );
}