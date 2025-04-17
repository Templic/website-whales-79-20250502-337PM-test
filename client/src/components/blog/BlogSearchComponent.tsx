/**
 * BlogSearchComponent.tsx
 * 
 * A specialized search component for searching blog posts with relevant filters
 * and advanced search capabilities specific to blog content.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';

// Common blog topics and categories for filtering
const blogCategories = [
  { value: 'cosmic-insights', label: 'Cosmic Insights' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'frequency-science', label: 'Frequency Science' },
  { value: 'sacred-geometry', label: 'Sacred Geometry' },
  { value: 'sound-healing', label: 'Sound Healing' },
  { value: 'music-production', label: 'Music Production' },
  { value: 'artist-spotlight', label: 'Artist Spotlight' },
  { value: 'community', label: 'Community' },
];

interface BlogSearchComponentProps {
  variant?: 'minimal' | 'expanded';
  defaultCategory?: string;
  placeholder?: string;
  onSearch?: (query: string, filters: Record<string, any>) => void;
  darkMode?: boolean;
  className?: string;
}

const BlogSearchComponent: React.FC<BlogSearchComponentProps> = ({
  variant = 'minimal',
  defaultCategory = 'all',
  placeholder = 'Search blog posts...',
  onSearch,
  darkMode = false,
  className = '',
}) => {
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Navigation hooks
  const [location, navigate] = useLocation();
  
  // Debounced search query for preview results
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Build search parameters
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    params.set('type', 'posts'); // Always search blog posts only
    
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    }
    
    if (dateRange.from) {
      params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
    }
    
    if (dateRange.to) {
      params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
    }
    
    if (sortBy !== 'relevance') {
      params.set('sort', sortBy);
    }
    
    return params;
  };
  
  // Get preview search results with React Query
  const { data: previewResults, isLoading } = useQuery({
    queryKey: ['blogSearchPreview', debouncedQuery, selectedCategory, selectedTags],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = buildSearchParams();
      params.set('limit', '3'); // Just get a few preview results
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch blog search preview');
      
      const data = await response.json();
      return data.posts || [];
    },
    enabled: debouncedQuery.length >= 2 && showResultsPreview,
  });
  
  // Handle search form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // If onSearch prop provided, call it
    if (onSearch) {
      onSearch(searchQuery, {
        category: selectedCategory,
        tags: selectedTags,
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        sort: sortBy
      });
      return;
    }
    
    // Otherwise navigate to search page
    const params = buildSearchParams();
    navigate(`/blog/search?${params.toString()}`);
    setShowResultsPreview(false);
  };
  
  // Toggle a tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Calculate CSS classes based on props
  const containerClasses = `
    blog-search-container relative
    ${darkMode ? 'blog-search-container-dark' : ''}
    ${className}
  `.trim();
  
  const inputClasses = `
    transition-all duration-200
    ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-400' : ''}
    ${isAdvanced ? 'rounded-t-md rounded-b-none border-b-0' : 'rounded-md'}
  `.trim();
  
  return (
    <div className={containerClasses}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Main search input */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResultsPreview(true)}
            className={`pl-10 pr-10 ${inputClasses}`}
            data-testid="blog-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        
        {/* Search Controls */}
        {variant === 'expanded' && (
          <div className="flex items-center mt-2 gap-2 flex-wrap">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`text-sm p-1 rounded border ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'border-input'}`}
            >
              <option value="all">All Categories</option>
              {blogCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdvanced(!isAdvanced)}
              className={darkMode ? 'border-white/10 hover:bg-white/5' : ''}
            >
              {isAdvanced ? 'Basic Search' : 'Advanced Search'}
            </Button>
            
            <Button 
              type="submit"
              size="sm"
              className={darkMode ? 'bg-cyan-500 hover:bg-cyan-600 text-black' : ''}
            >
              Search
            </Button>
          </div>
        )}
        
        {/* Advanced Search Options */}
        {isAdvanced && variant === 'expanded' && (
          <div className={`p-4 border rounded-b-md shadow-md ${darkMode ? 'bg-black/20 border-white/10' : 'bg-card'}`}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="date-filter">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Date Filter
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : ''}`}>From:</label>
                      <Input 
                        type="date" 
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                        className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : ''}`}>To:</label>
                      <Input 
                        type="date" 
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="tags-filter">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  <Tag className="mr-2 h-4 w-4" />
                  Tags Filter
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['meditation', 'healing', 'frequency', 'cosmic', 'music', 'community', 'tutorial', 'interview'].map(tag => (
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
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="sort-options">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  Sort Options
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="sort" 
                        value="relevance" 
                        checked={sortBy === 'relevance'} 
                        onChange={() => setSortBy('relevance')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Relevance</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="sort" 
                        value="date-desc" 
                        checked={sortBy === 'date-desc'} 
                        onChange={() => setSortBy('date-desc')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Newest First</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="sort" 
                        value="date-asc" 
                        checked={sortBy === 'date-asc'} 
                        onChange={() => setSortBy('date-asc')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Oldest First</span>
                    </label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </form>
      
      {/* Search Preview Results */}
      {showResultsPreview && searchQuery.length >= 2 && (
        <div 
          className={`absolute z-10 w-full mt-1 rounded-md shadow-lg overflow-hidden ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}
        >
          {isLoading ? (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Searching blog posts...
            </div>
          ) : previewResults && previewResults.length > 0 ? (
            <div>
              <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                Blog Posts
              </div>
              <ul>
                {previewResults.slice(0, 3).map((post: any) => (
                  <li key={post.id}>
                    <a
                      href={`/blog/${post.id}`}
                      className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                      <div className="font-medium">{post.title}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(post.createdAt).toLocaleDateString()} 
                        {post.tags?.length > 0 && ` • ${post.tags.slice(0, 2).join(', ')}${post.tags.length > 2 ? '...' : ''}`}
                      </div>
                    </a>
                  </li>
                ))}
                
                {/* More results link */}
                <li className={`px-4 py-2 text-center ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleSubmit}
                    className={darkMode ? 'text-cyan-400' : 'text-primary'}
                  >
                    See all blog results ({previewResults.length})
                  </Button>
                </li>
              </ul>
            </div>
          ) : (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No blog posts found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogSearchComponent;