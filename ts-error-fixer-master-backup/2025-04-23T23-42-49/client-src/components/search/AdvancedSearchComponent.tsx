/**
 * AdvancedSearchComponent.tsx
 * 
 * A specialized component for advanced searching functionality across the application.
 * This component provides more comprehensive filtering and search options.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'wouter';
import { 
  Search, Filter, SlidersHorizontal, X, 
  Music, ShoppingBag, FileText, User 
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';

// Available search categories
const searchCategories = [
  { value: 'all', label: 'All Categories', icon: <Search className="h-4 w-4" /> },
  { value: 'music', label: 'Music', icon: <Music className="h-4 w-4" /> },
  { value: 'products', label: 'Products', icon: <ShoppingBag className="h-4 w-4" /> },
  { value: 'posts', label: 'Blog Posts', icon: <FileText className="h-4 w-4" /> }
];

// Types for our advanced search filters
interface AdvancedFilters {
  music?: {
    frequency?: string;
    artist?: string;
    minDuration?: number;
    maxDuration?: number;
    includeUnreleased?: boolean;
  };
  products?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
  posts?: {
    tags?: string[];
    dateRange?: [Date | null, Date | null];
    author?: string;
  };
}

interface AdvancedSearchComponentProps {
  darkMode?: boolean;
  initialQuery?: string;
  initialCategory?: string;
}

export const AdvancedSearchComponent: React.FC<AdvancedSearchComponentProps> = ({
  darkMode = false,
  initialQuery = '',
  initialCategory = 'all'
}) => {
  const navigate = useNavigate();
  const [location] = useLocation();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  
  // State for search query and filters
  const [searchQuery, setSearchQuery] = useState(initialQuery || urlParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || urlParams.get('type') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // State for advanced filters
  const [filters, setFilters] = useState<AdvancedFilters>({
    music: {
      frequency: '',
      artist: '',
      minDuration: 0,
      maxDuration: 600, // 10 minutes in seconds
      includeUnreleased: false
    },
    products: {
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      inStock: true
    },
    posts: {
      tags: [],
      dateRange: [null, null],
      author: ''
    }
  });
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Fetch search results based on filters
  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['advancedSearch', debouncedQuery, selectedCategory, filters],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return null;
      
      // Build URL parameters
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      if (selectedCategory !== 'all') {
        params.set('type', selectedCategory);
      }
      
      // Add category-specific filters
      if (selectedCategory === 'music' || selectedCategory === 'all') {
        if (filters.music?.frequency) params.set('frequency', filters.music.frequency);
        if (filters.music?.artist) params.set('artist', filters.music.artist);
        if (filters.music?.minDuration) params.set('minDuration', filters.music.minDuration.toString());
        if (filters.music?.maxDuration) params.set('maxDuration', filters.music.maxDuration.toString());
        if (filters.music?.includeUnreleased) params.set('includeUnreleased', 'true');
      }
      
      if (selectedCategory === 'products' || selectedCategory === 'all') {
        if (filters.products?.category) params.set('category', filters.products.category);
        if (filters.products?.minPrice) params.set('minPrice', filters.products.minPrice.toString());
        if (filters.products?.maxPrice) params.set('maxPrice', filters.products.maxPrice.toString());
        if (filters.products?.inStock) params.set('inStock', 'true');
      }
      
      if (selectedCategory === 'posts' || selectedCategory === 'all') {
        if (filters.posts?.author) params.set('author', filters.posts.author);
        if (filters.posts?.tags && filters.posts.tags.length > 0) {
          params.set('tags', filters.posts.tags.join(','));
        }
      }
      
      // Make the API call
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      return response.json();
    },
    enabled: debouncedQuery.trim().length > 0
  });
  
  // Update URL with search parameters
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    if (selectedCategory !== 'all') {
      params.set('type', selectedCategory);
    }
    
    window.history.replaceState(null, '', `/search?${params.toString()}`);
  }, [debouncedQuery, selectedCategory]);
  
  // Count active filters
  useEffect(() => {
    const activeFilterList: string[] = [];
    let count = 0;
    
    // Music filters
    if (selectedCategory === 'music' || selectedCategory === 'all') {
      if (filters.music?.frequency) {
        count++;
        activeFilterList.push(`Frequency: ${filters.music.frequency}`);
      }
      if (filters.music?.artist) {
        count++;
        activeFilterList.push(`Artist: ${filters.music.artist}`);
      }
      if (filters.music?.minDuration && filters.music.minDuration > 0) {
        count++;
        activeFilterList.push(`Min Duration: ${Math.floor(filters.music.minDuration / 60)}:${String(filters.music.minDuration % 60).padStart(2, '0')}`);
      }
      if (filters.music?.maxDuration && filters.music.maxDuration < 600) {
        count++;
        activeFilterList.push(`Max Duration: ${Math.floor(filters.music.maxDuration / 60)}:${String(filters.music.maxDuration % 60).padStart(2, '0')}`);
      }
      if (filters.music?.includeUnreleased) {
        count++;
        activeFilterList.push('Include Unreleased');
      }
    }
    
    // Product filters
    if (selectedCategory === 'products' || selectedCategory === 'all') {
      if (filters.products?.category) {
        count++;
        activeFilterList.push(`Category: ${filters.products.category}`);
      }
      if (filters.products?.minPrice && filters.products.minPrice > 0) {
        count++;
        activeFilterList.push(`Min Price: $${filters.products.minPrice}`);
      }
      if (filters.products?.maxPrice && filters.products.maxPrice < 1000) {
        count++;
        activeFilterList.push(`Max Price: $${filters.products.maxPrice}`);
      }
      if (filters.products?.inStock === false) {
        count++;
        activeFilterList.push('Include Out of Stock');
      }
    }
    
    // Post filters
    if (selectedCategory === 'posts' || selectedCategory === 'all') {
      if (filters.posts?.author) {
        count++;
        activeFilterList.push(`Author: ${filters.posts.author}`);
      }
      if (filters.posts?.tags && filters.posts.tags.length > 0) {
        count++;
        activeFilterList.push(`Tags: ${filters.posts.tags.join(', ')}`);
      }
    }
    
    setActiveFilterCount(count);
    setActiveFilters(activeFilterList);
  }, [filters, selectedCategory]);
  
  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      music: {
        frequency: '',
        artist: '',
        minDuration: 0,
        maxDuration: 600,
        includeUnreleased: false
      },
      products: {
        category: '',
        minPrice: 0,
        maxPrice: 1000,
        inStock: true
      },
      posts: {
        tags: [],
        dateRange: [null, null],
        author: ''
      }
    });
  };
  
  // Update a specific filter
  const updateFilter = <T extends keyof AdvancedFilters, K extends keyof AdvancedFilters[T]>(
    category: T, 
    key: K, 
    value$2 => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };
  
  return (
    <div className={`advanced-search-component ${darkMode ? 'dark-mode' : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          {/* Search Header */}
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <div className="relative flex-grow">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
              <Input
                type="search"
                placeholder="Search across music, products, blog posts and more..."
                className={`pl-9 ${darkMode ? 'bg-black/20 border-white/10 text-white' : ''}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className={`w-[140px] ${darkMode ? 'bg-black/20 border-white/10 text-white' : ''}`}>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {searchCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <span className="flex items-center gap-2">
                        {category.icon}
                        {category.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant={showFilters ? "secondary" : "outline"}
                className={darkMode ? 'border-white/10 hover:bg-white/5' : ''}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              <Button 
                type="submit"
                className={darkMode ? 'bg-cyan-500 hover:bg-cyan-600 text-black' : ''}
              >
                Search
              </Button>
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                Active filters:
              </span>
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {filter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => {
                    // This is a simplified approach - in a real implementation, 
                    // you'd reset the specific filter being clicked
                    const [type, value] = filter.split(': ');
                    // Reset the specific filter based on its label
                  }} />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
          
          {/* Advanced Filter Panel */}
          {showFilters && (
            <Card className={darkMode ? 'bg-gray-900 border-white/10' : ''}>
              <CardContent className="p-4">
                <Accordion type="single" collapsible className="w-full">
                  {/* Music Filters */}
                  {(selectedCategory === 'music' || selectedCategory === 'all') && (
                    <AccordionItem value="music">
                      <AccordionTrigger className={darkMode ? 'text-white' : ''}>
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Music Filters
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                          <div className="space-y-2">
                            <Label className={darkMode ? 'text-gray-300' : ''}>Frequency (Hz)</Label>
                            <Input
                              type="text"
                              placeholder="e.g. 432, 528"
                              className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                              value={filters.music?.frequency || ''}
                              onChange={(e) => updateFilter('music', 'frequency', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className={darkMode ? 'text-gray-300' : ''}>Artist</Label>
                            <Input
                              type="text"
                              placeholder="Artist name"
                              className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                              value={filters.music?.artist || ''}
                              onChange={(e) => updateFilter('music', 'artist', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <div className="flex justify-between">
                              <Label className={darkMode ? 'text-gray-300' : ''}>Duration (minutes)</Label>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                {Math.floor((filters.music?.minDuration || 0) / 60)}:
                                {String((filters.music?.minDuration || 0) % 60).padStart(2, '0')} - 
                                {Math.floor((filters.music?.maxDuration || 600) / 60)}:
                                {String((filters.music?.maxDuration || 600) % 60).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="px-2">
                              <Slider
                                defaultValue={[0, 600]}
                                max={600}
                                step={30}
                                value={[
                                  filters.music?.minDuration || 0,
                                  filters.music?.maxDuration || 600
                                ]}
                                onValueChange={(value) => {
                                  updateFilter('music', 'minDuration', value[0]);
                                  updateFilter('music', 'maxDuration', value[1]);
                                }}
                                className={darkMode ? 'bg-black/20 text-white' : ''}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeUnreleased"
                              checked={filters.music?.includeUnreleased || false}
                              onCheckedChange={(checked) => 
                                updateFilter('music', 'includeUnreleased', Boolean(checked))
                              }
                              className={darkMode ? 'border-white/20' : ''}
                            />
                            <Label 
                              htmlFor="includeUnreleased"
                              className={darkMode ? 'text-gray-300' : ''}
                            >
                              Include unreleased tracks
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {/* Products Filters */}
                  {(selectedCategory === 'products' || selectedCategory === 'all') && (
                    <AccordionItem value="products">
                      <AccordionTrigger className={darkMode ? 'text-white' : ''}>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Product Filters
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                          <div className="space-y-2">
                            <Label className={darkMode ? 'text-gray-300' : ''}>Category</Label>
                            <Select 
                              value={filters.products?.category || ''} 
                              onValueChange={(value) => updateFilter('products', 'category', value)}
                            >
                              <SelectTrigger className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All Categories</SelectItem>
                                <SelectItem value="cosmic-tools">Cosmic Tools</SelectItem>
                                <SelectItem value="meditation">Meditation</SelectItem>
                                <SelectItem value="apparel">Apparel</SelectItem>
                                <SelectItem value="accessories">Accessories</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className={darkMode ? 'text-gray-300' : ''}>Price Range</Label>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                ${filters.products?.minPrice || 0} - ${filters.products?.maxPrice || 1000}
                              </span>
                            </div>
                            <div className="px-2">
                              <Slider
                                defaultValue={[0, 1000]}
                                max={1000}
                                step={5}
                                value={[
                                  filters.products?.minPrice || 0,
                                  filters.products?.maxPrice || 1000
                                ]}
                                onValueChange={(value) => {
                                  updateFilter('products', 'minPrice', value[0]);
                                  updateFilter('products', 'maxPrice', value[1]);
                                }}
                                className={darkMode ? 'bg-black/20 text-white' : ''}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="inStock"
                              checked={filters.products?.inStock || false}
                              onCheckedChange={(checked) => 
                                updateFilter('products', 'inStock', Boolean(checked))
                              }
                              className={darkMode ? 'border-white/20' : ''}
                            />
                            <Label 
                              htmlFor="inStock"
                              className={darkMode ? 'text-gray-300' : ''}
                            >
                              In stock only
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {/* Blog Posts Filters */}
                  {(selectedCategory === 'posts' || selectedCategory === 'all') && (
                    <AccordionItem value="posts">
                      <AccordionTrigger className={darkMode ? 'text-white' : ''}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Blog Post Filters
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                          <div className="space-y-2">
                            <Label className={darkMode ? 'text-gray-300' : ''}>Author</Label>
                            <Input
                              type="text"
                              placeholder="Author name"
                              className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                              value={filters.posts?.author || ''}
                              onChange={(e) => updateFilter('posts', 'author', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className={darkMode ? 'text-gray-300' : ''}>Tags (comma separated)</Label>
                            <Input
                              type="text"
                              placeholder="e.g. meditation, healing"
                              className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                              value={filters.posts?.tags?.join(', ') || ''}
                              onChange={(e) => {
                                const tagString = e.target.value;
                                const tags = tagString.split(',').map(t => t.trim()).filter(Boolean);
                                updateFilter('posts', 'tags', tags);
                              }}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearFilters}
                    className={`mr-2 ${darkMode ? 'border-white/10 hover:bg-white/5 text-white' : ''}`}
                  >
                    Reset Filters
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className={darkMode ? 'bg-cyan-500 hover:bg-cyan-600 text-black' : ''}
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
      
      {/* Search Results will be displayed by the parent component */}
    </div>
  );
};

export default AdvancedSearchComponent;