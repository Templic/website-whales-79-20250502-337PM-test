/**
 * NewsletterSearchComponent.tsx
 * 
 * A specialized search component for searching newsletters and subscriber content
 * with features specific to newsletter management and content.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Calendar, Filter, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';

// Newsletter categories for filtering
const newsletterCategories = [
  { value: 'announcements', label: 'Announcements' },
  { value: 'monthly-updates', label: 'Monthly Updates' },
  { value: 'music-releases', label: 'Music Releases' },
  { value: 'events', label: 'Upcoming Events' },
  { value: 'exclusive-content', label: 'Exclusive Content' },
  { value: 'cosmic-insights', label: 'Cosmic Insights' },
];

interface NewsletterSearchComponentProps {
  variant?: 'minimal' | 'expanded';
  defaultCategory?: string;
  placeholder?: string;
  onSearch?: (query: string, filters: Record<string, any>) => void;
  darkMode?: boolean;
  className?: string;
  isAdminView?: boolean;
}

const NewsletterSearchComponent: React.FC<NewsletterSearchComponentProps> = ({
  variant = 'minimal',
  defaultCategory = 'all',
  placeholder = 'Search newsletters...',
  onSearch,
  darkMode = false,
  className = '',
  isAdminView = false,
}) => {
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [sentStatus, setSentStatus] = useState<string>('all'); 
  const [openRate, setOpenRate] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState('newest');
  
  // Navigation hooks
  const [location, navigate] = useLocation();
  
  // Debounced search query for preview results
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Build search parameters for API request
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    params.set('type', 'newsletters');
    
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    
    if (dateRange.from) {
      params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
    }
    
    if (dateRange.to) {
      params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
    }
    
    if (sentStatus !== 'all') {
      params.set('sent', sentStatus);
    }
    
    if (openRate[0] > 0 || openRate[1] < 100) {
      params.set('minOpenRate', openRate[0].toString());
      params.set('maxOpenRate', openRate[1].toString());
    }
    
    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
    }
    
    return params;
  };

  // Get preview search results with React Query
  const { data: previewResults, isLoading } = useQuery({
    queryKey: ['newsletterSearchPreview', debouncedQuery, selectedCategory],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = buildSearchParams();
      params.set('limit', '3'); // Just get a few preview results
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch newsletter search preview');
      
      const data = await response.json();
      // For newsletters we return a custom structure (assuming the API is updated)
      return data.newsletters || [];
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
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        sent: sentStatus,
        openRate: openRate,
        sort: sortBy
      });
      return;
    }
    
    // Otherwise navigate to search page
    const params = buildSearchParams();
    const searchPath = isAdminView ? '/admin/newsletters/search' : '/newsletters/search';
    navigate(`${searchPath}?${params.toString()}`);
    setShowResultsPreview(false);
  };
  
  // Calculate CSS classes based on props
  const containerClasses = `
    newsletter-search-container relative
    ${darkMode ? 'newsletter-search-container-dark' : ''}
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
            data-testid="newsletter-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
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
              {newsletterCategories.map(category => (
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
                  Date Range
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
              
              {isAdminView && (
                <>
                  <AccordionItem value="status-filter">
                    <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                      <Filter className="mr-2 h-4 w-4" />
                      Status Filter
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="status-all" 
                            checked={sentStatus === 'all'} 
                            onCheckedChange={() => setSentStatus('all')}
                          />
                          <Label htmlFor="status-all">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="status-sent" 
                            checked={sentStatus === 'sent'} 
                            onCheckedChange={() => setSentStatus('sent')}
                          />
                          <Label htmlFor="status-sent">Sent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="status-draft" 
                            checked={sentStatus === 'draft'} 
                            onCheckedChange={() => setSentStatus('draft')}
                          />
                          <Label htmlFor="status-draft">Draft</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="status-scheduled" 
                            checked={sentStatus === 'scheduled'} 
                            onCheckedChange={() => setSentStatus('scheduled')}
                          />
                          <Label htmlFor="status-scheduled">Scheduled</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="open-rate-filter">
                    <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                      Open Rate Filter
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{openRate[0]}%</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{openRate[1]}%</span>
                        </div>
                        <div className="px-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={openRate[0]}
                            onChange={(e) => setOpenRate([parseInt(e.target.value), openRate[1]])}
                            className="w-full"
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={openRate[1]}
                            onChange={(e) => setOpenRate([openRate[0], parseInt(e.target.value)])}
                            className="w-full"
                          />
                        </div>
                        <div className="text-center mt-2">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                            Open Rate: {openRate[0]}% - {openRate[1]}%
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}
              
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
                        value="newest" 
                        checked={sortBy === 'newest'} 
                        onChange={() => setSortBy('newest')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Newest First</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="sort" 
                        value="oldest" 
                        checked={sortBy === 'oldest'} 
                        onChange={() => setSortBy('oldest')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Oldest First</span>
                    </label>
                    
                    {isAdminView && (
                      <>
                        <label className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="sort" 
                            value="most-opened" 
                            checked={sortBy === 'most-opened'} 
                            onChange={() => setSortBy('most-opened')}
                            className="focus:ring-primary"
                          />
                          <span className={darkMode ? 'text-gray-300' : ''}>Most Opened</span>
                        </label>
                        
                        <label className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="sort" 
                            value="most-clicked" 
                            checked={sortBy === 'most-clicked'} 
                            onChange={() => setSortBy('most-clicked')}
                            className="focus:ring-primary"
                          />
                          <span className={darkMode ? 'text-gray-300' : ''}>Most Clicked</span>
                        </label>
                      </>
                    )}
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
              Searching newsletters...
            </div>
          ) : previewResults && previewResults.length > 0 ? (
            <div>
              <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                Newsletters
              </div>
              <ul>
                {previewResults.slice(0, 3).map((newsletter) => (
                  <li key={newsletter.id}>
                    <a
                      href={isAdminView ? `/admin/newsletters/${newsletter.id}` : `/newsletters/${newsletter.id}`}
                      className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                      <div className="font-medium">{newsletter.title || newsletter.subject}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(newsletter.createdAt || newsletter.sentAt || '').toLocaleDateString()} 
                        {newsletter.category && ` • ${newsletter.category}`}
                        {isAdminView && newsletter.openRate && ` • ${newsletter.openRate}% Open Rate`}
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
                    See all newsletter results ({previewResults.length})
                  </Button>
                </li>
              </ul>
            </div>
          ) : (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No newsletters found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsletterSearchComponent;