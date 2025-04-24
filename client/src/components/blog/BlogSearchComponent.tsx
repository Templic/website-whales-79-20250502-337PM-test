/**
 * BlogSearchComponent.tsx
 * 
 * A specialized search component for the blog section that provides
 * blog-specific filtering options and displays results in a blog-optimized format.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Search, 
  FileText, 
  Tag, 
  Calendar, 
  User, 
  ChevronRight 
} from 'lucide-react';

interface BlogSearchComponentProps {
  showFilters?: boolean;
  maxResults?: number;
  initialQuery?: string;
  initialTags?: string[];
  className?: string;
}

const BlogSearchComponent: React.FC<BlogSearchComponentProps> = ({
  showFilters = true,
  maxResults = 10,
  initialQuery = '',
  initialTags = [],
  className = ''
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  
  // Navigation
  const [, navigate] = useLocation();
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Effect to handle initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);
  
  // Effect to handle initialTags changes
  useEffect(() => {
    if (initialTags.length > 0) {
      setSelectedTags(initialTags);
    }
  }, [initialTags]);
  
  // Query for blog search results
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blogSearch', debouncedQuery, selectedTags, authorFilter, startDate, endDate, featuredOnly, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      }
      
      params.set('type', 'posts');
      params.set('limit', maxResults.toString());
      
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => params.append('tags', tag));
      }
      
      if (authorFilter) {
        params.set('author', authorFilter);
      }
      
      if (startDate) {
        params.set('startDate', startDate.toISOString().split('T')[0]);
      }
      
      if (endDate) {
        params.set('endDate', endDate.toISOString().split('T')[0]);
      }
      
      if (featuredOnly) {
        params.set('featured', 'true');
      }
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog search results');
      }
      
      return await response.json();
    },
    enabled: true,
  });
  
  // Handle submitting search (navigates to main search page with filters)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    params.set('type', 'posts');
    
    if (selectedTags.length > 0) {
      selectedTags.forEach(tag => params.append('tags', tag));
    }
    
    if (authorFilter) {
      params.set('author', authorFilter);
    }
    
    if (startDate) {
      params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    
    if (featuredOnly) {
      params.set('featured', 'true');
    }
    
    navigate(`/search?${params.toString()}`);
  };
  
  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Available blog tags
  const availableTags = [
    'meditation', 'spirituality', 'healing', 'cosmic', 
    'personal growth', 'whales', 'nature', 'music'
  ];
  
  return (
    <div className={`blog-search-component ${className}`}>
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
            Search
          </Button>
        </div>
        
        {showFilters && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <User className="mr-2 h-4 w-4" /> Author
              </h3>
              <Input
                type="text"
                placeholder="Filter by author..."
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Date Range
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <DatePicker 
                    date={startDate} 
                    setDate={setStartDate} 
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <DatePicker 
                    date={endDate} 
                    setDate={setEndDate} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featuredOnly"
                checked={featuredOnly}
                onCheckedChange={(checked) => 
                  setFeaturedOnly(checked as boolean)
                }
              />
              <label
                htmlFor="featuredOnly"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured posts only
              </label>
            </div>
          </div>
        )}
      </form>
      
      {/* Results */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FileText className="mr-2 h-5 w-5" /> 
          {debouncedQuery
            ? `Results for "${debouncedQuery}"`
            : "Latest Blog Posts"
          }
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-1/4" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Error loading blog posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading the search results. Please try again later.</p>
            </CardContent>
          </Card>
        ) : data?.results?.length > 0 ? (
          <div className="space-y-4">
            {data.results.map((post: any) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="md:flex">
                  {post.featuredImage && (
                    <div className="md:w-1/3">
                      <div className="aspect-video md:h-full bg-muted rounded-t-md md:rounded-l-md md:rounded-tr-none overflow-hidden">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className={post.featuredImage ? "md:w-2/3" : "w-full"}>
                    <CardHeader>
                      <CardTitle>
                        <a href={`/blog/${post.id}`} className="hover:text-primary">
                          {post.title}
                        </a>
                      </CardTitle>
                      <CardDescription>
                        {post.author 
                          ? `By ${post.author} • ${new Date(post.createdAt).toLocaleDateString()}`
                          : new Date(post.createdAt).toLocaleDateString()
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm">
                        {post.excerpt || post.content.substring(0, 150) + '...'}
                      </p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {post.readTime ? `${post.readTime} min read` : ''}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/blog/${post.id}`}>
                          Read More <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
            
            {data.totalCount > maxResults && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={handleSearchSubmit}>
                  View All {data.totalCount} Blog Posts
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No posts found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {debouncedQuery 
                  ? `No blog posts matching "${debouncedQuery}" were found. Try adjusting your search terms or filters.`
                  : "No blog posts are available at this time."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BlogSearchComponent;