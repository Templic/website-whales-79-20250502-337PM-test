/**
 * SearchPage.tsx
 * Handles site-wide search functionality with specialized results by section
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Music, 
  ShoppingBag, 
  Users, 
  Home, 
  Calendar,
  Newspaper, 
  BookOpen,
  MessageCircle,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { SpotlightEffect } from '@/components/SpotlightEffect';

// Define result types
interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'page' | 'music' | 'product' | 'user' | 'event' | 'post';
  image?: string;
  metadata?: Record<string, any>;
}

// Parse query parameters
function useQueryParams() {
  const [location] = useLocation();
  return new URLSearchParams(location.split('?')[1]);
}

export default function SearchPage() {
  // Get query parameters from URL
  const params = useQueryParams();
  const queryParam = params.get('q') || '';
  const scopeParam = params.get('scope') || 'all';
  
  // Local state for search
  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<string>(scopeParam);
  
  // Update URL when search parameters change
  useEffect(() => {
    const [, navigate] = useLocation();
    
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}&scope=${activeTab}`, { 
        replace: true 
      });
    }
  }, [query, activeTab]);
  
  // Search API call
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, activeTab],
    queryFn: async () => {
      if (!query) return { results: [], counts: {} };
      
      const response = await axios.get(`/api/search`, {
        params: { q: query, scope: activeTab }
      });
      
      return response.data;
    },
    enabled: !!query,
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will update through state, which will trigger the useEffect
  };
  
  // Generate result counts for tabs
  const resultCounts = data?.counts || {
    all: 0,
    pages: 0,
    music: 0,
    products: 0,
    users: 0,
    events: 0,
    posts: 0,
  };
  
  // Format the search results into groups
  const results = data?.results || [];
  
  return (
    <div className="min-h-screen">
      <SpotlightEffect />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
          Search Results
        </h1>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search the entire site..."
              className="pl-10 py-6 text-lg border-cyan-700/30 focus:border-cyan-500/50 bg-black/20 backdrop-blur-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-600"
            >
              Search
            </Button>
          </div>
        </form>
        
        {/* Tabs for different search categories */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-4 md:grid-cols-7 lg:grid-cols-8 mb-4">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Home className="h-4 w-4" /> 
              All
              <Badge variant="outline" className="ml-1">{resultCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-1">
              <Info className="h-4 w-4" /> 
              Pages
              <Badge variant="outline" className="ml-1">{resultCounts.pages}</Badge>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-1">
              <Music className="h-4 w-4" /> 
              Music
              <Badge variant="outline" className="ml-1">{resultCounts.music}</Badge>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" /> 
              Shop
              <Badge variant="outline" className="ml-1">{resultCounts.products}</Badge>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> 
              Events
              <Badge variant="outline" className="ml-1">{resultCounts.events}</Badge>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-1">
              <Newspaper className="h-4 w-4" /> 
              Blog
              <Badge variant="outline" className="ml-1">{resultCounts.posts}</Badge>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" /> 
              Users
              <Badge variant="outline" className="ml-1">{resultCounts.users}</Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* Results panel */}
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="bg-red-50 border-red-200 text-red-800">
                <CardContent className="p-4">
                  <p>Error searching: {error instanceof Error ? error.message : 'Unknown error'}</p>
                </CardContent>
              </Card>
            ) : results.length === 0 && query ? (
              <Card className="bg-blue-50/10 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-xl mb-2">No results found for "{query}"</p>
                  <p className="text-muted-foreground">Try different keywords or browse categories</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result: SearchResult) => (
                  <Link key={result.id} href={result.url}>
                    <Card className="h-full cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg overflow-hidden group">
                      {result.image && (
                        <div className="h-40 overflow-hidden">
                          <img 
                            src={result.image} 
                            alt={result.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl line-clamp-1 group-hover:text-cyan-400 transition-colors">
                            {result.title}
                          </CardTitle>
                          <Badge className="capitalize">
                            {result.type === 'page' && <Info className="h-3 w-3 mr-1" />}
                            {result.type === 'music' && <Music className="h-3 w-3 mr-1" />}
                            {result.type === 'product' && <ShoppingBag className="h-3 w-3 mr-1" />}
                            {result.type === 'user' && <Users className="h-3 w-3 mr-1" />}
                            {result.type === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                            {result.type === 'post' && <Newspaper className="h-3 w-3 mr-1" />}
                            {result.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-muted-foreground line-clamp-2">{result.description}</p>
                        
                        {/* Display metadata based on result type */}
                        {result.type === 'music' && result.metadata && (
                          <div className="mt-2 text-sm">
                            {result.metadata.frequency && (
                              <span className="inline-block mr-4">
                                Frequency: {result.metadata.frequency}
                              </span>
                            )}
                            {result.metadata.duration && (
                              <span className="inline-block">
                                Duration: {result.metadata.duration}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {result.type === 'product' && result.metadata && (
                          <div className="mt-2 text-sm flex items-center justify-between">
                            <span className="font-bold text-green-400">${result.metadata.price?.toFixed(2)}</span>
                            {result.metadata.rating && (
                              <span className="flex items-center text-amber-400">
                                ★ {result.metadata.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}