/**
 * AdvancedSearchPage.tsx
 * 
 * A comprehensive search page that provides advanced filtering options
 * and detailed results presentation for all content types.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/ui/date-picker';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Music,
  ShoppingBag,
  FileText,
  Users,
  Mail,
  MessageSquare, 
  Calendar,
  Star,
  Filter,
  X,
  ChevronRight,
  Clock,
  Flame,
  ThumbsUp,
  BarChart,
  Calendar as CalendarIcon,
  Tag,
  Headphones,
  Sparkles,
} from 'lucide-react';

interface AdvancedSearchPageProps {
  initialQuery?: string;
  initialType?: string;
}

const AdvancedSearchPage: React.FC<AdvancedSearchPageProps> = ({
  initialQuery = '',
  initialType = 'all'
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentTab, setCurrentTab] = useState(initialType);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Navigation
  const [, navigate] = useLocation();
  
  // Debounce search query to prevent excessive API calls
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Handle search parameter changes through the URL
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
    if (initialType && initialType !== 'all') {
      setCurrentTab(initialType);
    }
  }, [initialQuery, initialType]);

  // Build query parameters for the API call
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    params.set('type', currentTab);
    params.set('page', page.toString());
    params.set('sort', sortBy);
    
    if (startDate) {
      params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    
    // Add any active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle arrays (like tags)
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    return params;
  };

  // Query for search results
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['advancedSearch', debouncedQuery, currentTab, page, sortBy, activeFilters, startDate, endDate],
    queryFn: async () => {
      if (!debouncedQuery) return { results: [], totalCount: 0, totalPages: 0 };
      
      const params = buildQueryParams();
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      return await response.json();
    },
    enabled: debouncedQuery.length > 0,
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    // Reset pagination when changing tabs
    setPage(1);
    
    // Update the URL without triggering a page reload
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    params.set('type', value);
    navigate(`/search?${params.toString()}`);
    
    // Reset active filters when changing tabs
    setActiveFilters({});
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    // Reset to first page when filters change
    setPage(1);
  };

  // Handle filter removal
  const removeFilter = (filterType: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterType];
      return newFilters;
    });
  };

  // Handle page changes for pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setSortBy('relevance');
    setPage(1);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = Object.keys(activeFilters).length;
    if (startDate) count++;
    if (endDate) count++;
    if (sortBy !== 'relevance') count++;
    return count;
  };
  
  // Render filter badges
  const renderFilterBadges = () => {
    const badges = [];
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle arrays (like tags)
          value.forEach(v => {
            badges.push(
              <Badge key={`${key}-${v}`} variant="secondary" className="mr-2 mb-2">
                {key.charAt(0).toUpperCase() + key.slice(1)}: {v}
                <button 
                  onClick={() => {
                    const newValue = value.filter(item => item !== v);
                    handleFilterChange(key, newValue.length ? newValue : undefined);
                  }}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          });
        } else {
          badges.push(
            <Badge key={key} variant="secondary" className="mr-2 mb-2">
              {key.charAt(0).toUpperCase() + key.slice(1)}: {value.toString()}
              <button onClick={() => removeFilter(key)} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        }
      }
    });
    
    if (startDate) {
      badges.push(
        <Badge key="startDate" variant="secondary" className="mr-2 mb-2">
          From: {startDate.toLocaleDateString()}
          <button onClick={() => setStartDate(undefined)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (endDate) {
      badges.push(
        <Badge key="endDate" variant="secondary" className="mr-2 mb-2">
          To: {endDate.toLocaleDateString()}
          <button onClick={() => setEndDate(undefined)} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    if (sortBy && sortBy !== 'relevance') {
      badges.push(
        <Badge key="sortBy" variant="secondary" className="mr-2 mb-2">
          Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          <button onClick={() => setSortBy('relevance')} className="ml-1">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }
    
    return badges;
  };

  // Render different result formats based on content type
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-xl font-semibold text-red-500 mb-2">
            Error loading search results
          </div>
          <p className="text-muted-foreground mb-4">
            Something went wrong while fetching your search results. Please try again.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      );
    }

    if (!data || !data.results || data.results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-xl font-semibold mb-2">
            No results found
          </div>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
          {getActiveFilterCount() > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      );
    }

    switch (currentTab) {
      case 'music':
        return renderMusicResults(Array.isArray(data.results) ? data.results : data.music || []);
      case 'products':
        return renderProductResults(Array.isArray(data.results) ? data.results : data.products || []);
      case 'posts':
        return renderPostResults(Array.isArray(data.results) ? data.results : data.posts || []);
      case 'users':
        return renderUserResults(Array.isArray(data.results) ? data.results : data.users || []);
      case 'newsletters':
        return renderNewsletterResults(Array.isArray(data.results) ? data.results : data.newsletters || []);
      case 'suggestions':
        return renderSuggestionResults(Array.isArray(data.results) ? data.results : data.suggestions || []);
      default:
        // Handle the case where data.results is an object with arrays by type
        if (!Array.isArray(data.results) && typeof data.results === 'object') {
          // Create a flattened array with _type property for mixed results
          const mixedResults = [];
          
          // Add type property to each item in the arrays
          if (data.music && Array.isArray(data.music)) {
            mixedResults.push(...data.music.map(item => ({ ...item, _type: 'music' })));
          }
          if (data.products && Array.isArray(data.products)) {
            mixedResults.push(...data.products.map(item => ({ ...item, _type: 'products' })));
          }
          if (data.posts && Array.isArray(data.posts)) {
            mixedResults.push(...data.posts.map(item => ({ ...item, _type: 'posts' })));
          }
          if (data.users && Array.isArray(data.users)) {
            mixedResults.push(...data.users.map(item => ({ ...item, _type: 'users' })));
          }
          if (data.newsletters && Array.isArray(data.newsletters)) {
            mixedResults.push(...data.newsletters.map(item => ({ ...item, _type: 'newsletters' })));
          }
          if (data.suggestions && Array.isArray(data.suggestions)) {
            mixedResults.push(...data.suggestions.map(item => ({ ...item, _type: 'suggestions' })));
          }
          
          return renderMixedResults(mixedResults);
        }
        
        return renderMixedResults(Array.isArray(data.results) ? data.results : []);
    }
  };

  const renderMusicResults = (results: any[]) => {
    return (
      <div className="space-y-4 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="music-result-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    <Headphones className="mr-2 h-5 w-5 text-primary" />
                    <a href={`/music/${item.id}`} className="hover:text-primary">
                      {item.title}
                    </a>
                  </CardTitle>
                  <CardDescription>
                    Artist: {item.artist}
                    {item.album && ` • Album: ${item.album}`}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {item.duration || 'N/A'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-sm line-clamp-2 mb-2">{item.description}</p>
              )}
              
              <div className="flex flex-wrap gap-1 mt-2">
                {item.frequency && (
                  <Badge variant="outline" className="bg-primary/10">
                    {item.frequency} Hz
                  </Badge>
                )}
                
                {item.tags && item.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-primary/5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-2">
              <div>
                <span>Added: {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/music/${item.id}`}>
                  Listen <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderProductResults = (results: any[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="product-result-card h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                <a href={`/shop/${item.id}`} className="hover:text-primary line-clamp-1">
                  {item.name}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {item.images && item.images.length > 0 ? (
                <div className="aspect-square mb-3 bg-muted rounded-md overflow-hidden">
                  <img 
                    src={item.images[0]} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square mb-3 bg-muted rounded-md flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <p className="text-sm line-clamp-2 mb-2">
                {item.shortDescription || item.description.substring(0, 120)}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ${parseFloat(item.price).toFixed(2)}
                </Badge>
                
                {item.category && (
                  <Badge variant="secondary" className="bg-primary/5">
                    {item.category}
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3">
              <Button variant="default" size="sm" className="w-full" asChild>
                <a href={`/shop/${item.id}`}>
                  View Details
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderPostResults = (results: any[]) => {
    return (
      <div className="space-y-6 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="post-result-card hover:shadow-md transition-shadow">
            <div className="md:flex">
              {item.featuredImage && (
                <div className="md:w-1/3 shrink-0">
                  <div className="aspect-video md:aspect-square bg-muted rounded-t-md md:rounded-l-md md:rounded-tr-none overflow-hidden">
                    <img 
                      src={item.featuredImage} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className={item.featuredImage ? 'md:w-2/3' : 'w-full'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-primary" />
                    <a href={`/blog/${item.id}`} className="hover:text-primary">
                      {item.title}
                    </a>
                  </CardTitle>
                  <CardDescription>
                    Published: {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3 mb-3">
                    {item.excerpt || item.content.substring(0, 160) + '...'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags && item.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-primary/5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-2">
                  <div>
                    {item.author && (
                      <span>By: {item.author}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/blog/${item.id}`}>
                      Read More <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderUserResults = (results: any[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="user-result-card h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-2 w-20 h-20 rounded-full overflow-hidden bg-muted">
                {item.avatar ? (
                  <img 
                    src={item.avatar} 
                    alt={item.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <CardTitle className="text-lg">
                <a href={`/profile/${item.username}`} className="hover:text-primary">
                  {item.displayName || item.firstName && item.lastName ? 
                    `${item.firstName} ${item.lastName}` : 
                    item.username}
                </a>
              </CardTitle>
              <CardDescription>
                @{item.username}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              {item.bio && (
                <p className="text-sm line-clamp-3 mb-3">
                  {item.bio}
                </p>
              )}
              
              <div className="flex justify-center flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="bg-primary/10">
                  {item.role}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`/profile/${item.username}`}>
                  View Profile
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderNewsletterResults = (results: any[]) => {
    return (
      <div className="space-y-4 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="newsletter-result-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-primary" />
                    <a href={`/newsletters/${item.id}`} className="hover:text-primary">
                      {item.subject || item.title}
                    </a>
                  </CardTitle>
                  <CardDescription>
                    {item.sentAt ? 
                      `Sent: ${new Date(item.sentAt).toLocaleDateString()}` : 
                      `Draft: ${new Date(item.createdAt).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <div>
                  <Badge variant={item.status === 'sent' ? 'default' : 'outline'}>
                    {item.status === 'sent' ? 'Sent' : 'Draft'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-2 mb-3">
                {item.content.substring(0, 200) + '...'}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {item.category && (
                  <Badge variant="secondary" className="bg-primary/5">
                    {item.category}
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-2">
              <div className="flex items-center">
                {item.openRate !== undefined && (
                  <div className="mr-4 flex items-center">
                    <BarChart className="mr-1 h-4 w-4" />
                    <span>Open rate: {(item.openRate * 100).toFixed(1)}%</span>
                  </div>
                )}
                
                {item.clickRate !== undefined && (
                  <div className="flex items-center">
                    <ThumbsUp className="mr-1 h-4 w-4" />
                    <span>Click rate: {(item.clickRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/newsletters/${item.id}`}>
                  View <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderSuggestionResults = (results: any[]) => {
    return (
      <div className="space-y-4 mt-4">
        {results.map((item) => (
          <Card key={item.id} className="suggestion-result-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                    <a href={`/suggestions/${item.id}`} className="hover:text-primary">
                      {item.title}
                    </a>
                  </CardTitle>
                  <CardDescription>
                    Submitted by: {item.authorName || 'Anonymous'} • {new Date(item.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex">
                  {item.status && (
                    <Badge variant={
                      item.status === 'implemented' ? 'default' : 
                      item.status === 'planned' ? 'secondary' : 'outline'
                    }>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  )}
                  <div className="ml-2 flex items-center">
                    <ThumbsUp className="mr-1 h-4 w-4" />
                    <span>{item.votes || 0}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3 mb-3">
                {item.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {item.category && (
                  <Badge variant="secondary" className="bg-primary/5">
                    {item.category}
                  </Badge>
                )}
                {item.tags && item.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="bg-primary/5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground flex justify-between items-center pt-2">
              <div>
                {item.commentCount > 0 && (
                  <span>{item.commentCount} comment{item.commentCount !== 1 ? 's' : ''}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={`/suggestions/${item.id}`}>
                  View Details <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderMixedResults = (results: any[]) => {
    // Group results by type
    const groupedResults: Record<string, any[]> = {};
    
    results.forEach(item => {
      const type = item._type || 'unknown';
      if (!groupedResults[type]) {
        groupedResults[type] = [];
      }
      groupedResults[type].push(item);
    });
    
    return (
      <div className="space-y-8 mt-4">
        {Object.entries(groupedResults).map(([type, items]) => (
          <div key={type}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              {type === 'music' && <Music className="mr-2 h-5 w-5" />}
              {type === 'products' && <ShoppingBag className="mr-2 h-5 w-5" />}
              {type === 'posts' && <FileText className="mr-2 h-5 w-5" />}
              {type === 'users' && <Users className="mr-2 h-5 w-5" />}
              {type === 'newsletters' && <Mail className="mr-2 h-5 w-5" />}
              {type === 'suggestions' && <MessageSquare className="mr-2 h-5 w-5" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} ({items.length} results)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.slice(0, 3).map(item => {
                switch (type) {
                  case 'music':
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <Headphones className="mr-2 h-4 w-4 text-primary" />
                            <a href={`/music/${item.id}`} className="hover:text-primary line-clamp-1">
                              {item.title}
                            </a>
                          </CardTitle>
                          <CardDescription>
                            {item.artist}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {item.description && (
                            <p className="text-sm line-clamp-1">{item.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  
                  case 'products':
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <ShoppingBag className="mr-2 h-4 w-4 text-primary" />
                            <a href={`/shop/${item.id}`} className="hover:text-primary line-clamp-1">
                              {item.name}
                            </a>
                          </CardTitle>
                          <CardDescription>
                            ${parseFloat(item.price).toFixed(2)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {(item.shortDescription || item.description) && (
                            <p className="text-sm line-clamp-1">
                              {item.shortDescription || item.description.substring(0, 80)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  
                  case 'posts':
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-primary" />
                            <a href={`/blog/${item.id}`} className="hover:text-primary line-clamp-1">
                              {item.title}
                            </a>
                          </CardTitle>
                          <CardDescription>
                            {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {(item.excerpt || item.content) && (
                            <p className="text-sm line-clamp-1">
                              {item.excerpt || item.content.substring(0, 80)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  
                  case 'users':
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 text-center">
                          <div className="mx-auto mb-2 w-12 h-12 rounded-full overflow-hidden bg-muted">
                            {item.avatar ? (
                              <img 
                                src={item.avatar} 
                                alt={item.username} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            <a href={`/profile/${item.username}`} className="hover:text-primary">
                              {item.displayName || item.firstName && item.lastName ? 
                                `${item.firstName} ${item.lastName}` : 
                                item.username}
                            </a>
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  
                  default:
                    return (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            <a href={`/${type}/${item.id}`} className="hover:text-primary line-clamp-1">
                              {item.title || item.name || item.subject || 'Unknown'}
                            </a>
                          </CardTitle>
                          <CardDescription>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                }
              })}
            </div>
            
            {items.length > 3 && (
              <div className="mt-2 text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTabChange(type)}
                >
                  See all {items.length} {type} results
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render filters based on content type
  const renderFilters = () => {
    switch (currentTab) {
      case 'music':
        return renderMusicFilters();
      case 'products':
        return renderProductFilters();
      case 'posts':
        return renderPostFilters();
      case 'users':
        return renderUserFilters();
      case 'newsletters':
        return renderNewsletterFilters();
      case 'suggestions':
        return renderSuggestionFilters();
      default:
        return null;
    }
  };

  const renderMusicFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Duration</h3>
          <Select
            value={activeFilters.duration || ''}
            onValueChange={(value) => handleFilterChange('duration', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any duration</SelectItem>
              <SelectItem value="short">Short (&lt; 5 min)</SelectItem>
              <SelectItem value="medium">Medium (5-15 min)</SelectItem>
              <SelectItem value="long">Long (&gt; 15 min)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Frequency Range (Hz)</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min"
                value={activeFilters.minFrequency || ''}
                onChange={(e) => handleFilterChange('minFrequency', e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max"
                value={activeFilters.maxFrequency || ''}
                onChange={(e) => handleFilterChange('maxFrequency', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Release Date</h3>
          <div className="space-y-2">
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

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="frequency">Frequency (Low to High)</SelectItem>
              <SelectItem value="frequency-desc">Frequency (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderProductFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min"
                value={activeFilters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max"
                value={activeFilters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          <Select
            value={activeFilters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="meditation">Meditation</SelectItem>
              <SelectItem value="sound-healing">Sound Healing</SelectItem>
              <SelectItem value="merchandise">Merchandise</SelectItem>
              <SelectItem value="courses">Courses</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Date Added</h3>
          <div className="space-y-2">
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

        <div>
          <div className="flex items-center mb-2">
            <Checkbox
              id="inStock"
              checked={activeFilters.inStock === 'true'}
              onCheckedChange={(checked) => 
                handleFilterChange('inStock', checked ? 'true' : undefined)
              }
            />
            <label
              htmlFor="inStock"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              In Stock Only
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderPostFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Publication Date</h3>
          <div className="space-y-2">
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

        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {['meditation', 'spirituality', 'healing', 'cosmic', 'personal growth', 'whales'].map((tag) => (
              <Badge 
                key={tag}
                variant={(activeFilters.tags && activeFilters.tags.includes(tag)) ? 'default' : 'outline'}
                className="cursor-pointer mb-1"
                onClick={() => {
                  const currentTags = activeFilters.tags || [];
                  if (currentTags.includes(tag)) {
                    handleFilterChange('tags', currentTags.filter(t => t !== tag));
                  } else {
                    handleFilterChange('tags', [...currentTags, tag]);
                  }
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <Checkbox
              id="featuredOnly"
              checked={activeFilters.featured === 'true'}
              onCheckedChange={(checked) => 
                handleFilterChange('featured', checked ? 'true' : undefined)
              }
            />
            <label
              htmlFor="featuredOnly"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Featured Posts Only
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="comments">Most Comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderUserFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Role</h3>
          <Select
            value={activeFilters.role || ''}
            onValueChange={(value) => handleFilterChange('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="user">Regular User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="contributor">Contributor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Date Joined</h3>
          <div className="space-y-2">
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

        <div>
          <div className="flex items-center mb-2">
            <Checkbox
              id="activeOnly"
              checked={activeFilters.active === 'true'}
              onCheckedChange={(checked) => 
                handleFilterChange('active', checked ? 'true' : undefined)
              }
            />
            <label
              htmlFor="activeOnly"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Active Users Only
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest Members</SelectItem>
              <SelectItem value="oldest">Longest Members</SelectItem>
              <SelectItem value="activity">Most Active</SelectItem>
              <SelectItem value="contributions">Most Contributions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderNewsletterFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Status</h3>
          <Select
            value={activeFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          <Select
            value={activeFilters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="promotions">Promotions</SelectItem>
              <SelectItem value="product">Product Updates</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Date Range</h3>
          <div className="space-y-2">
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

        <div>
          <h3 className="text-sm font-medium mb-2">Engagement Filter</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Min Open Rate:</span>
              <Select
                value={activeFilters.minOpenRate || ''}
                onValueChange={(value) => handleFilterChange('minOpenRate', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.2">20%</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                  <SelectItem value="0.4">40%</SelectItem>
                  <SelectItem value="0.5">50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Min Click Rate:</span>
              <Select
                value={activeFilters.minClickRate || ''}
                onValueChange={(value) => handleFilterChange('minClickRate', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.10">10%</SelectItem>
                  <SelectItem value="0.15">15%</SelectItem>
                  <SelectItem value="0.20">20%</SelectItem>
                  <SelectItem value="0.25">25%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="engagement">Highest Engagement</SelectItem>
              <SelectItem value="openRate">Best Open Rate</SelectItem>
              <SelectItem value="clickRate">Best Click Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderSuggestionFilters = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Status</h3>
          <Select
            value={activeFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          <Select
            value={activeFilters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="content">Content Request</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Date Submitted</h3>
          <div className="space-y-2">
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

        <div>
          <h3 className="text-sm font-medium mb-2">Votes</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min"
                value={activeFilters.minVotes || ''}
                onChange={(e) => handleFilterChange('minVotes', e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max"
                value={activeFilters.maxVotes || ''}
                onChange={(e) => handleFilterChange('maxVotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Sort By</h3>
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-votes">Most Votes</SelectItem>
              <SelectItem value="most-comments">Most Comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="advanced-search-container">
      <div className="mb-8">
        <Tabs 
          defaultValue={currentTab} 
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              <span className="hidden md:inline">All Content</span>
              <span className="md:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="text-xs md:text-sm">
              <Music className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Music</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs md:text-sm">
              <ShoppingBag className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs md:text-sm">
              <FileText className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              <Users className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="newsletters" className="text-xs md:text-sm">
              <Mail className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Newsletters</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs md:text-sm">
              <MessageSquare className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Suggestions</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Filters Column */}
            <div className="md:col-span-1">
              <div className="space-y-6">
                <div className="sticky top-4 bg-card rounded-lg p-4 border shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Filter className="mr-2 h-5 w-5" />
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </h2>
                  
                  {getActiveFilterCount() > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap mb-2">
                        {renderFilterBadges()}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-muted-foreground"
                        onClick={clearAllFilters}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                  
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue="filters"
                    className="w-full"
                  >
                    <AccordionItem value="filters" className="border-none">
                      <AccordionTrigger className="py-2 text-base">
                        Filter Options
                      </AccordionTrigger>
                      <AccordionContent>
                        <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                          {renderFilters()}
                        </ScrollArea>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
            
            {/* Results Column */}
            <div className="md:col-span-3">
              <TabsContent value="all" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="music" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="products" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="posts" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="newsletters" className="mt-0">
                {renderResults()}
              </TabsContent>
              <TabsContent value="suggestions" className="mt-0">
                {renderResults()}
              </TabsContent>
              
              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        // Show first page, last page, current page, and pages around current page
                        return (
                          pageNum === 1 || 
                          pageNum === data.totalPages || 
                          Math.abs(pageNum - page) <= 1
                        );
                      })
                      .map((pageNum, index, array) => {
                        // Add ellipsis when there are gaps
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;
                        
                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                isActive={pageNum === page}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(data.totalPages, page + 1))}
                        className={page === data.totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;