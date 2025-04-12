/**
 * SearchPage.tsx
 * 
 * A page that displays search results across the entire application
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Music, ShoppingBag, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// The result types that can be returned from search
type ResultType = 'all' | 'music' | 'products' | 'users' | 'posts';

export default function SearchPage() {
  // Get the search query from URL parameters
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const urlQuery = queryParams.get('q') || '';
  const urlType = (queryParams.get('type') || 'all') as ResultType;
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [resultType, setResultType] = useState<ResultType>(urlType);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (resultType !== 'all') params.set('type', resultType);
    
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, resultType]);

  // Update the document title
  useEffect(() => {
    document.title = searchQuery 
      ? `Search: ${searchQuery} - Dale Loves Whales` 
      : 'Search - Dale Loves Whales';
  }, [searchQuery]);

  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults();
  };

  // Fetch the search results
  const fetchResults = () => {
    // Refetch when search params change
    refetch();
  };

  // Use React Query to fetch search results
  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['search', searchQuery, resultType],
    queryFn: async () => {
      if (!searchQuery.trim()) return { music: [], products: [], users: [], posts: [] };
      
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (resultType !== 'all') params.set('type', resultType);
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Function to render result counts
  const renderResultCounts = () => {
    if (!results) return null;
    
    const counts = {
      music: results.music?.length || 0,
      products: results.products?.length || 0, 
      users: results.users?.length || 0,
      posts: results.posts?.length || 0
    };
    
    const totalCount = Object.values(counts).reduce((acc, val) => acc + val, 0);
    
    return (
      <p className="text-muted-foreground mt-2">
        Found {totalCount} results
        {totalCount > 0 && (
          <>
            {' '}(
            {counts.music > 0 && `${counts.music} music`}
            {counts.products > 0 && `${counts.music > 0 ? ', ' : ''}${counts.products} products`}
            {counts.users > 0 && `${counts.music > 0 || counts.products > 0 ? ', ' : ''}${counts.users} users`}
            {counts.posts > 0 && `${counts.music > 0 || counts.products > 0 || counts.users > 0 ? ', ' : ''}${counts.posts} posts`}
            )
          </>
        )}
      </p>
    );
  };

  // Render different result sections
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!results) return null;

    // No results found
    const totalResults = Object.values(results).flat().length;
    if (totalResults === 0) {
      return (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try different keywords or browse categories
          </p>
        </div>
      );
    }

    return (
      <Tabs defaultValue={resultType === 'all' ? 'all' : resultType} onValueChange={(v) => setResultType(v as ResultType)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Results</TabsTrigger>
          {results.music?.length > 0 && <TabsTrigger value="music">Music</TabsTrigger>}
          {results.products?.length > 0 && <TabsTrigger value="products">Products</TabsTrigger>}
          {results.users?.length > 0 && <TabsTrigger value="users">Users</TabsTrigger>}
          {results.posts?.length > 0 && <TabsTrigger value="posts">Blog Posts</TabsTrigger>}
        </TabsList>

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
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 h-12 w-12 rounded-md flex items-center justify-center">
                          <Music className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                          {track.frequency && (
                            <Badge variant="outline" className="mt-1">
                              {track.frequency} Hz
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {results.music.length > 4 && (
                <Button variant="link" className="mt-2" asChild>
                  <a href={`/music/search?q=${searchQuery}`}>View all {results.music.length} music results</a>
                </Button>
              )}
            </section>
          )}

          {/* Product Results */}
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
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 h-12 w-12 rounded-md flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                          {product.category && (
                            <Badge variant="outline" className="mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {results.products.length > 4 && (
                <Button variant="link" className="mt-2" asChild>
                  <a href={`/shop/search?q=${searchQuery}`}>View all {results.products.length} product results</a>
                </Button>
              )}
            </section>
          )}

          {/* Other sections (users, posts) would follow the same pattern */}
        </TabsContent>

        <TabsContent value="music" className="space-y-4">
          {results.music?.map((track: any) => (
            <Card key={track.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 h-12 w-12 rounded-md flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{track.title}</h3>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
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
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/music/track/${track.id}`}>View</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {results.products?.map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 h-12 w-12 rounded-md flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.category && (
                        <Badge variant="outline">
                          {product.category}
                        </Badge>
                      )}
                      {product.ratings && product.ratings.average && (
                        <span className="text-xs text-amber-400">
                          {product.ratings.average.toFixed(1)} ★ ({product.ratings.count})
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm mt-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/shop/product/${product.id}`}>View</a>
                    </Button>
                    <Button size="sm">Add to Cart</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Other tabs content would follow the same pattern */}
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Search</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for music, products, blog posts and more..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
        {renderResultCounts()}
      </form>

      <Separator className="my-6" />
      
      {renderResults()}
    </div>
  );
}