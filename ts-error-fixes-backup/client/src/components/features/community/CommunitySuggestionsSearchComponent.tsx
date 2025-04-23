/**
 * CommunitySuggestionsSearchComponent.tsx
 * 
 * A specialized search component for community suggestions and feedback
 * with features specific to community engagement content.
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search, Filter, ArrowUpDown, Clock, ThumbsUp, X } from 'lucide-react';
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

// Community suggestion categories for filtering
const suggestionCategories = [
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'music-suggestion', label: 'Music Suggestion' },
  { value: 'event-idea', label: 'Event Idea' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'general-feedback', label: 'General Feedback' },
];

// Suggestion status options for filtering
const suggestionStatuses = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
];

interface CommunitySuggestionsSearchComponentProps {
  variant?: 'minimal' | 'expanded';
  defaultCategory?: string;
  placeholder?: string;
  onSearch?: (query: string, filters: Record<string, any>) => void;
  darkMode?: boolean;
  className?: string;
  isAdminView?: boolean;
}

const CommunitySuggestionsSearchComponent: React.FC<CommunitySuggestionsSearchComponentProps> = ({
  variant = 'minimal',
  defaultCategory = 'all',
  placeholder = 'Search community suggestions...',
  onSearch,
  darkMode = false,
  className = '',
  isAdminView = false,
}) => {
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showResultsPreview, setShowResultsPreview] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [showImplemented, setShowImplemented] = useState(true);
  const [showDeclined, setShowDeclined] = useState(true);
  const [minVotes, setMinVotes] = useState(0);
  const [sortBy, setSortBy] = useState('most-votes');
  
  // Navigation hooks
  const [location, navigate] = useLocation();
  
  // Debounced search query for preview results
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Build search parameters for API request
  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    params.set('type', 'suggestions');
    
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    
    if (selectedStatus !== 'all') {
      params.set('status', selectedStatus);
    }
    
    if (dateRange.from) {
      params.set('dateFrom', dateRange.from.toISOString().split('T')[0]);
    }
    
    if (dateRange.to) {
      params.set('dateTo', dateRange.to.toISOString().split('T')[0]);
    }
    
    if (!showImplemented) {
      params.set('hideImplemented', 'true');
    }
    
    if (!showDeclined) {
      params.set('hideDeclined', 'true');
    }
    
    if (minVotes > 0) {
      params.set('minVotes', minVotes.toString());
    }
    
    if (sortBy !== 'most-votes') {
      params.set('sort', sortBy);
    }
    
    return params;
  };

  // Get preview search results with React Query
  const { data: previewResults, isLoading } = useQuery({
    queryKey: ['suggestionsSearchPreview', debouncedQuery, selectedCategory, selectedStatus],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = buildSearchParams();
      params.set('limit', '3'); // Just get a few preview results
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions search preview');
      
      const data = await response.json();
      // For suggestions we need to update the search API to return them
      return data.suggestions || [];
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
        status: selectedStatus,
        dateFrom: dateRange.from?.toISOString(),
        dateTo: dateRange.to?.toISOString(),
        hideImplemented: !showImplemented,
        hideDeclined: !showDeclined,
        minVotes: minVotes,
        sort: sortBy
      });
      return;
    }
    
    // Otherwise navigate to search page
    const params = buildSearchParams();
    const searchPath = isAdminView ? '/admin/community/suggestions/search' : '/community/suggestions/search';
    navigate(`${searchPath}?${params.toString()}`);
    setShowResultsPreview(false);
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Today';
    if (diffDays <= 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };
  
  // Calculate CSS classes based on props
  const containerClasses = `
    community-search-container relative
    ${darkMode ? 'community-search-container-dark' : ''}
    ${className}
  `.trim();
  
  const inputClasses = `
    transition-all duration-200
    ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-400' : ''}
    ${isAdvanced ? 'rounded-t-md rounded-b-none border-b-0' : 'rounded-md'}
  `.trim();
  
  // Render the status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant = 'outline';
    let colorClass = '';
    
    switch (status) {
      case 'new':
        variant = 'outline';
        colorClass = 'border-blue-500 text-blue-500';
        break;
      case 'under-review':
        variant = 'outline';
        colorClass = 'border-yellow-500 text-yellow-500';
        break;
      case 'planned':
        variant = 'outline';
        colorClass = 'border-purple-500 text-purple-500';
        break;
      case 'in-progress':
        variant = 'outline';
        colorClass = 'border-green-500 text-green-500';
        break;
      case 'completed':
        variant = 'default';
        colorClass = 'bg-green-500 text-white';
        break;
      case 'declined':
        variant = 'outline';
        colorClass = 'border-red-500 text-red-500';
        break;
      default:
        break;
    }
    
    return (
      <Badge variant={variant as any} className={colorClass}>
        {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  };
  
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
            data-testid="community-suggestions-search-input"
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
              {suggestionCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`text-sm p-1 rounded border ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'border-input'}`}
            >
              {suggestionStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
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
                  <Clock className="mr-2 h-4 w-4" />
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
              
              <AccordionItem value="visibility-filter">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  <Filter className="mr-2 h-4 w-4" />
                  Visibility Filter
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-implemented" 
                        checked={showImplemented} 
                        onCheckedChange={(checked) => setShowImplemented(checked === true)}
                      />
                      <Label htmlFor="show-implemented">Show Implemented Suggestions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-declined" 
                        checked={showDeclined} 
                        onCheckedChange={(checked) => setShowDeclined(checked === true)}
                      />
                      <Label htmlFor="show-declined">Show Declined Suggestions</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="votes-filter">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Minimum Votes
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-2">
                    <Input
                      type="number"
                      min="0"
                      value={minVotes}
                      onChange={(e) => setMinVotes(parseInt(e.target.value) || 0)}
                      className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                    />
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Only show suggestions with at least this many votes
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="sort-options">
                <AccordionTrigger className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort Options
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="sort" 
                        value="most-votes" 
                        checked={sortBy === 'most-votes'} 
                        onChange={() => setSortBy('most-votes')}
                        className="focus:ring-primary"
                      />
                      <span className={darkMode ? 'text-gray-300' : ''}>Most Votes</span>
                    </label>
                    
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
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="sort" 
                          value="most-comments" 
                          checked={sortBy === 'most-comments'} 
                          onChange={() => setSortBy('most-comments')}
                          className="focus:ring-primary"
                        />
                        <span className={darkMode ? 'text-gray-300' : ''}>Most Comments</span>
                      </label>
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
              Searching community suggestions...
            </div>
          ) : previewResults && previewResults.length > 0 ? (
            <div>
              <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                Community Suggestions
              </div>
              <ul>
                {previewResults.slice(0, 3).map((suggestion$2 => (
                  <li key={suggestion.id}>
                    <a
                      href={isAdminView ? `/admin/community/suggestions/${suggestion.id}` : `/community/suggestions/${suggestion.id}`}
                      className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                      <div className="font-medium">{suggestion.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(suggestion.createdAt)} 
                          {suggestion.category && ` • ${suggestion.category.replace('-', ' ')}`}
                          {suggestion.votesCount !== undefined && ` • ${suggestion.votesCount} votes`}
                        </div>
                        {suggestion.status && renderStatusBadge(suggestion.status)}
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
                    See all community suggestions ({previewResults.length})
                  </Button>
                </li>
              </ul>
            </div>
          ) : (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No community suggestions found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunitySuggestionsSearchComponent;