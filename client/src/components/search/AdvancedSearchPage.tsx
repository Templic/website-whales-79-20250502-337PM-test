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
  Calendar, 
  Filter, 
  Music, 
  Package, 
  FileText, 
  Send, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowUpDown,
  Check,
  X,
  User
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { useDebounce } from '@/hooks/use-debounce';
import { searchCategories } from './UniversalSearchBar';

// Define content type icons
const contentTypeIcons = {
  music: Music,
  products: Package,
  posts: FileText,
  newsletters: Send,
  suggestions: MessageSquare,
  users: User,
};

interface AdvancedSearchPageProps {
  initialQuery?: string;
  initialType?: string;
}

// Sort options for each content type
const sortOptions = {
  music: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'a-z', label: 'Title (A-Z)' },
    { value: 'z-a', label: 'Title (Z-A)' },
  ],
  products: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price (Low to High)' },
    { value: 'price-high', label: 'Price (High to Low)' },
    { value: 'a-z', label: 'Name (A-Z)' },
    { value: 'z-a', label: 'Name (Z-A)' },
  ],
  posts: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'a-z', label: 'Title (A-Z)' },
    { value: 'z-a', label: 'Title (Z-A)' },
  ],
  newsletters: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most-opened', label: 'Most Opened' },
    { value: 'most-clicked', label: 'Most Clicked' },
  ],
  suggestions: [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most-votes', label: 'Most Votes' },
    { value: 'most-comments', label: 'Most Comments' },
  ],
  users: [
    { value: 'newest', label: 'Newest Members' },
    { value: 'oldest', label: 'Longest Members' },
    { value: 'a-z', label: 'Username (A-Z)' },
    { value: 'z-a', label: 'Username (Z-A)' },
  ],
};

const AdvancedSearchPage: React.FC<AdvancedSearchPageProps> = ({
  initialQuery = '',
  initialType = 'all',
}) => {
  // Parse URL query parameters
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState(params.get('q') || initialQuery);
  const [selectedTab, setSelectedTab] = useState(params.get('type') || initialType);
  
  // Tab-specific filters
  // Music filters
  const [musicFilters, setMusicFilters] = useState({
    artist: params.get('artist') || '',
    year: params.get('year') || '',
    frequency: params.get('frequency') || '',
  });
  
  // Product filters
  const [productFilters, setProductFilters] = useState({
    category: params.get('category') || 'all',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    inStock: params.get('inStock') === 'true',
  });
  
  // Blog post filters
  const [postFilters, setPostFilters] = useState({
    tags: params.get('tags') || '',
    dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
    dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
  });
  
  // Newsletter filters
  const [newsletterFilters, setNewsletterFilters] = useState({
    category: params.get('category') || 'all',
    sent: params.get('sent') || 'all',
    dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
    dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
    minOpenRate: params.get('minOpenRate') || '',
  });
  
  // Community suggestion filters
  const [suggestionFilters, setSuggestionFilters] = useState({
    category: params.get('category') || 'all',
    status: params.get('status') || 'all',
    dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
    dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
    hideImplemented: params.get('hideImplemented') === 'true',
    hideDeclined: params.get('hideDeclined') === 'true',
    minVotes: params.get('minVotes') || '',
  });
  
  // Sort options
  const [sortOrder, setSortOrder] = useState({
    music: params.get('sort') || 'newest',
    products: params.get('sort') || 'newest',
    posts: params.get('sort') || 'newest',
    newsletters: params.get('sort') || 'newest',
    suggestions: params.get('sort') || 'most-votes',
    users: params.get('sort') || 'newest',
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const resultsPerPage = 20;
  
  // Debounce search query and filters
  const debouncedQuery = useDebounce(searchQuery, 500);
  const debouncedMusicFilters = useDebounce(musicFilters, 500);
  const debouncedProductFilters = useDebounce(productFilters, 500);
  const debouncedPostFilters = useDebounce(postFilters, 500);
  const debouncedNewsletterFilters = useDebounce(newsletterFilters, 500);
  const debouncedSuggestionFilters = useDebounce(suggestionFilters, 500);
  
  // Construct search parameters based on selected tab
  const getSearchParams = () => {
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    params.set('type', selectedTab);
    params.set('limit', resultsPerPage.toString());
    params.set('page', page.toString());
    
    if (selectedTab === 'music') {
      const currentSort = sortOrder.music;
      if (currentSort) params.set('sort', currentSort);
      
      if (debouncedMusicFilters.artist) {
        params.set('artist', debouncedMusicFilters.artist);
      }
      if (debouncedMusicFilters.year) {
        params.set('year', debouncedMusicFilters.year);
      }
      if (debouncedMusicFilters.frequency) {
        params.set('frequency', debouncedMusicFilters.frequency);
      }
    } else if (selectedTab === 'products') {
      const currentSort = sortOrder.products;
      if (currentSort) params.set('sort', currentSort);
      
      if (debouncedProductFilters.category && debouncedProductFilters.category !== 'all') {
        params.set('category', debouncedProductFilters.category);
      }
      if (debouncedProductFilters.minPrice) {
        params.set('minPrice', debouncedProductFilters.minPrice);
      }
      if (debouncedProductFilters.maxPrice) {
        params.set('maxPrice', debouncedProductFilters.maxPrice);
      }
      if (debouncedProductFilters.inStock) {
        params.set('inStock', 'true');
      }
    } else if (selectedTab === 'posts') {
      const currentSort = sortOrder.posts;
      if (currentSort) params.set('sort', currentSort);
      
      if (debouncedPostFilters.tags) {
        params.set('tags', debouncedPostFilters.tags);
      }
      if (debouncedPostFilters.dateFrom) {
        params.set('dateFrom', debouncedPostFilters.dateFrom.toISOString());
      }
      if (debouncedPostFilters.dateTo) {
        params.set('dateTo', debouncedPostFilters.dateTo.toISOString());
      }
    } else if (selectedTab === 'newsletters') {
      const currentSort = sortOrder.newsletters;
      if (currentSort) params.set('sort', currentSort);
      
      if (debouncedNewsletterFilters.category && debouncedNewsletterFilters.category !== 'all') {
        params.set('category', debouncedNewsletterFilters.category);
      }
      if (debouncedNewsletterFilters.sent && debouncedNewsletterFilters.sent !== 'all') {
        params.set('sent', debouncedNewsletterFilters.sent);
      }
      if (debouncedNewsletterFilters.dateFrom) {
        params.set('dateFrom', debouncedNewsletterFilters.dateFrom.toISOString());
      }
      if (debouncedNewsletterFilters.dateTo) {
        params.set('dateTo', debouncedNewsletterFilters.dateTo.toISOString());
      }
      if (debouncedNewsletterFilters.minOpenRate) {
        params.set('minOpenRate', debouncedNewsletterFilters.minOpenRate);
      }
    } else if (selectedTab === 'suggestions') {
      const currentSort = sortOrder.suggestions;
      if (currentSort) params.set('sort', currentSort);
      
      if (debouncedSuggestionFilters.category && debouncedSuggestionFilters.category !== 'all') {
        params.set('category', debouncedSuggestionFilters.category);
      }
      if (debouncedSuggestionFilters.status && debouncedSuggestionFilters.status !== 'all') {
        params.set('status', debouncedSuggestionFilters.status);
      }
      if (debouncedSuggestionFilters.dateFrom) {
        params.set('dateFrom', debouncedSuggestionFilters.dateFrom.toISOString());
      }
      if (debouncedSuggestionFilters.dateTo) {
        params.set('dateTo', debouncedSuggestionFilters.dateTo.toISOString());
      }
      if (debouncedSuggestionFilters.hideImplemented) {
        params.set('hideImplemented', 'true');
      }
      if (debouncedSuggestionFilters.hideDeclined) {
        params.set('hideDeclined', 'true');
      }
      if (debouncedSuggestionFilters.minVotes) {
        params.set('minVotes', debouncedSuggestionFilters.minVotes);
      }
    }
    
    return params;
  };

  // Search query
  const { data: searchResults, isLoading, isError, error } = useQuery({
    queryKey: ['advancedSearch', debouncedQuery, selectedTab, page, sortOrder, 
      debouncedMusicFilters, debouncedProductFilters, debouncedPostFilters, 
      debouncedNewsletterFilters, debouncedSuggestionFilters
    ],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = getSearchParams();
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      
      return await response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });
  
  // Update URL with current search parameters
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const params = getSearchParams();
      
      // Update URL without reloading the page
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${params.toString()}`
      );
    }
  }, [
    debouncedQuery, selectedTab, page, sortOrder,
    debouncedMusicFilters, debouncedProductFilters, debouncedPostFilters,
    debouncedNewsletterFilters, debouncedSuggestionFilters
  ]);
  
  // Reset pagination when changing tabs or search query
  useEffect(() => {
    setPage(1);
  }, [selectedTab, debouncedQuery]);
  
  // Get current tab results
  const getCurrentResults = () => {
    if (!searchResults) return [];
    
    switch (selectedTab) {
      case 'music': return searchResults.music || [];
      case 'products': return searchResults.products || [];
      case 'posts': return searchResults.posts || [];
      case 'newsletters': return searchResults.newsletters || [];
      case 'suggestions': return searchResults.suggestions || [];
      case 'users': return searchResults.users || [];
      case 'all':
        // For 'all' tab, combine and limit results from each category
        const combinedResults = [
          ...(searchResults.music || []).slice(0, 5).map(item => ({ ...item, type: 'music' })),
          ...(searchResults.products || []).slice(0, 5).map(item => ({ ...item, type: 'products' })),
          ...(searchResults.posts || []).slice(0, 5).map(item => ({ ...item, type: 'posts' })),
          ...(searchResults.newsletters || []).slice(0, 5).map(item => ({ ...item, type: 'newsletters' })),
          ...(searchResults.suggestions || []).slice(0, 5).map(item => ({ ...item, type: 'suggestions' })),
          ...(searchResults.users || []).slice(0, 5).map(item => ({ ...item, type: 'users' })),
        ];
        return combinedResults;
      default: return [];
    }
  };
  
  // Get total results count
  const getTotalResults = () => {
    if (!searchResults) return 0;
    
    switch (selectedTab) {
      case 'music': return searchResults.music?.length || 0;
      case 'products': return searchResults.products?.length || 0;
      case 'posts': return searchResults.posts?.length || 0;
      case 'newsletters': return searchResults.newsletters?.length || 0;
      case 'suggestions': return searchResults.suggestions?.length || 0;
      case 'users': return searchResults.users?.length || 0;
      case 'all':
        return (
          (searchResults.music?.length || 0) +
          (searchResults.products?.length || 0) +
          (searchResults.posts?.length || 0) +
          (searchResults.newsletters?.length || 0) +
          (searchResults.suggestions?.length || 0) +
          (searchResults.users?.length || 0)
        );
      default: return 0;
    }
  };
  
  // Get icon for a content type
  const getContentTypeIcon = (type: string) => {
    const IconComponent = contentTypeIcons[type as keyof typeof contentTypeIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };
  
  // Get categories for current tab
  const getCategories = () => {
    switch (selectedTab) {
      case 'products':
        return [
          { id: 'all', label: 'All Categories' },
          { id: 'clothing', label: 'Clothing' },
          { id: 'accessories', label: 'Accessories' },
          { id: 'music', label: 'Music' },
          { id: 'digital', label: 'Digital Downloads' },
          { id: 'merch', label: 'Merchandise' },
        ];
      case 'posts':
        return [
          { id: 'all', label: 'All Topics' },
          { id: 'music', label: 'Music' },
          { id: 'tour', label: 'Tour Updates' },
          { id: 'news', label: 'News' },
          { id: 'lifestyle', label: 'Lifestyle' },
          { id: 'tutorials', label: 'Tutorials' },
        ];
      case 'newsletters':
        return [
          { id: 'all', label: 'All Categories' },
          { id: 'weekly', label: 'Weekly Updates' },
          { id: 'monthly', label: 'Monthly Digest' },
          { id: 'special', label: 'Special Announcements' },
          { id: 'releases', label: 'New Releases' },
        ];
      case 'suggestions':
        return [
          { id: 'all', label: 'All Categories' },
          { id: 'feature', label: 'Feature Requests' },
          { id: 'bug', label: 'Bug Reports' },
          { id: 'content', label: 'Content Requests' },
          { id: 'improvement', label: 'Improvement Ideas' },
        ];
      default:
        return [{ id: 'all', label: 'All Categories' }];
    }
  };
  
  // Get status options for suggestions
  const getStatusOptions = () => {
    return [
      { id: 'all', label: 'All Status' },
      { id: 'open', label: 'Open' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'completed', label: 'Completed' },
      { id: 'declined', label: 'Declined' },
    ];
  };
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger re-fetch via the useEffect watching debouncedQuery
    setPage(1);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setPage(1);
  };
  
  // Handle date changes for various filters
  const handleDateChange = (date: Date | undefined, field: string, filterType: string) => {
    if (filterType === 'posts') {
      setPostFilters(prev => ({ ...prev, [field]: date }));
    } else if (filterType === 'newsletters') {
      setNewsletterFilters(prev => ({ ...prev, [field]: date }));
    } else if (filterType === 'suggestions') {
      setSuggestionFilters(prev => ({ ...prev, [field]: date }));
    }
  };
  
  // Update sort order
  const handleSortChange = (value: string) => {
    if (selectedTab === 'music') {
      setSortOrder(prev => ({ ...prev, music: value }));
    } else if (selectedTab === 'products') {
      setSortOrder(prev => ({ ...prev, products: value }));
    } else if (selectedTab === 'posts') {
      setSortOrder(prev => ({ ...prev, posts: value }));
    } else if (selectedTab === 'newsletters') {
      setSortOrder(prev => ({ ...prev, newsletters: value }));
    } else if (selectedTab === 'suggestions') {
      setSortOrder(prev => ({ ...prev, suggestions: value }));
    } else if (selectedTab === 'users') {
      setSortOrder(prev => ({ ...prev, users: value }));
    }
  };
  
  // Calculate result range for pagination display
  const resultRange = () => {
    const total = getTotalResults();
    const start = (page - 1) * resultsPerPage + 1;
    const end = Math.min(page * resultsPerPage, total);
    
    if (total === 0) return '';
    
    return `Showing ${start}-${end} of ${total} results`;
  };
  
  // Render result items based on content type
  const renderResultItem = (item: any) => {
    const itemType = item.type || selectedTab;
    
    switch (itemType) {
      case 'music':
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.artist}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/music/${item.id}`}>Listen</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 'products':
        return (
          <Card key={item.id} className="overflow-hidden">
            {item.images && item.images[0] && (
              <div className="h-40 overflow-hidden">
                <img 
                  src={item.images[0]} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            )}
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>${parseFloat(item.price).toFixed(2)}</CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                {item.category && (
                  <Badge variant="outline" className="mr-2">
                    {item.category}
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/shop/${item.id}`}>View</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 'posts':
        return (
          <Card key={item.id} className="overflow-hidden">
            {item.featuredImage && (
              <div className="h-40 overflow-hidden">
                <img 
                  src={item.featuredImage} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
            )}
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              {item.excerpt && (
                <CardDescription className="line-clamp-2">{item.excerpt}</CardDescription>
              )}
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/blog/${item.id}`}>Read</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 'newsletters':
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{item.title || 'Newsletter'}</CardTitle>
              <CardDescription>
                {item.sentAt ? 
                  `Sent: ${new Date(item.sentAt).toLocaleDateString()}` : 
                  'Draft'
                }
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                {item.status === 'sent' && (
                  <Badge variant="secondary" className="mr-2">
                    Sent
                  </Badge>
                )}
                {item.status === 'draft' && (
                  <Badge variant="outline" className="mr-2">
                    Draft
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/newsletters/${item.id}`}>View</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 'suggestions':
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                {item.status && (
                  <Badge 
                    variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'in-progress' ? 'secondary' :
                      item.status === 'declined' ? 'destructive' :
                      'outline'
                    }
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {item.commentsCount || 0}
                </div>
                <div className="flex items-center">
                  <ArrowUpDown className="mr-1 h-3 w-3" />
                  {item.votesCount || 0}
                </div>
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/community/suggestions/${item.id}`}>View</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 'users':
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                {item.avatar ? (
                  <img 
                    src={item.avatar} 
                    alt={item.username} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{item.displayName || item.username}</CardTitle>
                  <CardDescription>@{item.username}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                Joined {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <Button size="sm" variant="secondary" asChild>
                <a href={`/users/${item.username}`}>Profile</a>
              </Button>
            </CardFooter>
          </Card>
        );
      
      default:
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{item.title || item.name}</CardTitle>
            </CardHeader>
            <CardFooter className="p-4 pt-0 text-right">
              <Button size="sm" variant="secondary">
                View
              </Button>
            </CardFooter>
          </Card>
        );
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Search</h1>
        <p className="text-muted-foreground">
          Search across all content with advanced filtering options
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search for anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="sm:w-auto">Search</Button>
        </div>
      </form>
      
      <Tabs 
        defaultValue={selectedTab} 
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="products">Shop</TabsTrigger>
          <TabsTrigger value="posts">Blog</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="suggestions">Community</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        {/* All Content Tab */}
        <TabsContent value="all" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">All Results</h2>
              <p className="text-sm text-muted-foreground">{resultRange()}</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading results...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              <p>Error loading results. Please try again.</p>
            </div>
          ) : getCurrentResults().length > 0 ? (
            <div className="space-y-6">
              {/* Group results by type */}
              {['music', 'products', 'posts', 'newsletters', 'suggestions', 'users'].map((type) => {
                const typeResults = getCurrentResults().filter(item => item.type === type);
                if (typeResults.length === 0) return null;
                
                return (
                  <div key={type} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        {getContentTypeIcon(type)}
                        {searchCategories.find(cat => cat.id === type)?.label || type}
                      </h3>
                      <Button variant="link" size="sm" asChild>
                        <a href={`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`}>
                          See all
                        </a>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeResults.map(renderResultItem)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </TabsContent>
        
        {/* Music Tab */}
        <TabsContent value="music" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="music-artist">Artist</Label>
                    <Input
                      id="music-artist"
                      placeholder="Filter by artist"
                      value={musicFilters.artist}
                      onChange={(e) => setMusicFilters(prev => ({ ...prev, artist: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="music-year">Year</Label>
                    <Input
                      id="music-year"
                      placeholder="Filter by year"
                      value={musicFilters.year}
                      onChange={(e) => setMusicFilters(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="music-frequency">Frequency (Hz)</Label>
                    <Input
                      id="music-frequency"
                      placeholder="Filter by frequency"
                      value={musicFilters.frequency}
                      onChange={(e) => setMusicFilters(prev => ({ ...prev, frequency: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="music-sort">Sort By</Label>
                    <Select 
                      value={sortOrder.music} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger id="music-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.music.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Results area */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Music Results</h2>
                  <p className="text-sm text-muted-foreground">{resultRange()}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading results...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Error loading results. Please try again.</p>
                </div>
              ) : getCurrentResults().length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentResults().map(renderResultItem)}
                  </div>
                  
                  {/* Pagination UI */}
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={getCurrentResults().length < resultsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p>No music results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-category">Category</Label>
                    <Select 
                      value={productFilters.category} 
                      onValueChange={(value) => setProductFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="product-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategories().map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product-price-min">Price Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="product-price-min"
                        placeholder="Min"
                        type="number"
                        value={productFilters.minPrice}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full"
                      />
                      <span>-</span>
                      <Input
                        id="product-price-max"
                        placeholder="Max"
                        type="number"
                        value={productFilters.maxPrice}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="product-in-stock"
                      checked={productFilters.inStock}
                      onCheckedChange={(checked) => setProductFilters(prev => ({ ...prev, inStock: checked }))}
                    />
                    <Label htmlFor="product-in-stock">In stock only</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product-sort">Sort By</Label>
                    <Select 
                      value={sortOrder.products} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger id="product-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.products.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Results area */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Shop Results</h2>
                  <p className="text-sm text-muted-foreground">{resultRange()}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading results...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Error loading results. Please try again.</p>
                </div>
              ) : getCurrentResults().length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentResults().map(renderResultItem)}
                  </div>
                  
                  {/* Pagination UI */}
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={getCurrentResults().length < resultsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p>No products found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Blog Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="post-tags">Tags</Label>
                    <Input
                      id="post-tags"
                      placeholder="Filter by tags (comma separated)"
                      value={postFilters.tags}
                      onChange={(e) => setPostFilters(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="post-date-from" className="text-xs">From</Label>
                        <DatePicker
                          id="post-date-from"
                          date={postFilters.dateFrom}
                          setDate={(date) => handleDateChange(date, 'dateFrom', 'posts')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="post-date-to" className="text-xs">To</Label>
                        <DatePicker
                          id="post-date-to"
                          date={postFilters.dateTo}
                          setDate={(date) => handleDateChange(date, 'dateTo', 'posts')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="post-sort">Sort By</Label>
                    <Select 
                      value={sortOrder.posts} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger id="post-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.posts.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Results area */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Blog Results</h2>
                  <p className="text-sm text-muted-foreground">{resultRange()}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading results...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Error loading results. Please try again.</p>
                </div>
              ) : getCurrentResults().length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentResults().map(renderResultItem)}
                  </div>
                  
                  {/* Pagination UI */}
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={getCurrentResults().length < resultsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p>No blog posts found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Newsletters Tab */}
        <TabsContent value="newsletters" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newsletter-category">Category</Label>
                    <Select 
                      value={newsletterFilters.category} 
                      onValueChange={(value) => setNewsletterFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="newsletter-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategories().map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newsletter-status">Status</Label>
                    <Select 
                      value={newsletterFilters.sent} 
                      onValueChange={(value) => setNewsletterFilters(prev => ({ ...prev, sent: value }))}
                    >
                      <SelectTrigger id="newsletter-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="newsletter-date-from" className="text-xs">From</Label>
                        <DatePicker
                          id="newsletter-date-from"
                          date={newsletterFilters.dateFrom}
                          setDate={(date) => handleDateChange(date, 'dateFrom', 'newsletters')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="newsletter-date-to" className="text-xs">To</Label>
                        <DatePicker
                          id="newsletter-date-to"
                          date={newsletterFilters.dateTo}
                          setDate={(date) => handleDateChange(date, 'dateTo', 'newsletters')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newsletter-min-open-rate">Min. Open Rate (%)</Label>
                    <Input
                      id="newsletter-min-open-rate"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={newsletterFilters.minOpenRate}
                      onChange={(e) => setNewsletterFilters(prev => ({ ...prev, minOpenRate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newsletter-sort">Sort By</Label>
                    <Select 
                      value={sortOrder.newsletters} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger id="newsletter-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.newsletters.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Results area */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Newsletter Results</h2>
                  <p className="text-sm text-muted-foreground">{resultRange()}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading results...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Error loading results. Please try again.</p>
                </div>
              ) : getCurrentResults().length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentResults().map(renderResultItem)}
                  </div>
                  
                  {/* Pagination UI */}
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={getCurrentResults().length < resultsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p>No newsletters found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Community Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters sidebar */}
            <div className="w-full md:w-64 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filter Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-category">Category</Label>
                    <Select 
                      value={suggestionFilters.category} 
                      onValueChange={(value) => setSuggestionFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="suggestion-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategories().map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-status">Status</Label>
                    <Select 
                      value={suggestionFilters.status} 
                      onValueChange={(value) => setSuggestionFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="suggestion-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions().map(status => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="suggestion-date-from" className="text-xs">From</Label>
                        <DatePicker
                          id="suggestion-date-from"
                          date={suggestionFilters.dateFrom}
                          setDate={(date) => handleDateChange(date, 'dateFrom', 'suggestions')}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="suggestion-date-to" className="text-xs">To</Label>
                        <DatePicker
                          id="suggestion-date-to"
                          date={suggestionFilters.dateTo}
                          setDate={(date) => handleDateChange(date, 'dateTo', 'suggestions')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-min-votes">Min. Votes</Label>
                    <Input
                      id="suggestion-min-votes"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={suggestionFilters.minVotes}
                      onChange={(e) => setSuggestionFilters(prev => ({ ...prev, minVotes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hide-implemented"
                      checked={suggestionFilters.hideImplemented}
                      onCheckedChange={(checked) => setSuggestionFilters(prev => ({ ...prev, hideImplemented: checked }))}
                    />
                    <Label htmlFor="hide-implemented">Hide implemented</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hide-declined"
                      checked={suggestionFilters.hideDeclined}
                      onCheckedChange={(checked) => setSuggestionFilters(prev => ({ ...prev, hideDeclined: checked }))}
                    />
                    <Label htmlFor="hide-declined">Hide declined</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suggestion-sort">Sort By</Label>
                    <Select 
                      value={sortOrder.suggestions} 
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger id="suggestion-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.suggestions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Results area */}
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Community Suggestions</h2>
                  <p className="text-sm text-muted-foreground">{resultRange()}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading results...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Error loading results. Please try again.</p>
                </div>
              ) : getCurrentResults().length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getCurrentResults().map(renderResultItem)}
                  </div>
                  
                  {/* Pagination UI */}
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={getCurrentResults().length < resultsPerPage}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p>No community suggestions found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Users</h2>
              <p className="text-sm text-muted-foreground">{resultRange()}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="user-sort" className="text-sm">Sort:</Label>
              <Select 
                value={sortOrder.users} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger id="user-sort" className="w-40">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.users.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading results...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              <p>Error loading results. Please try again.</p>
            </div>
          ) : getCurrentResults().length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCurrentResults().map(renderResultItem)}
              </div>
              
              {/* Pagination UI */}
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={getCurrentResults().length < resultsPerPage}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p>No users found for "{searchQuery}"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSearchPage;