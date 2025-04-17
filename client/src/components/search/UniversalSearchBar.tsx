/**
 * UniversalSearchBar.tsx
 * 
 * A universal search component that can be used across the site
 * for searching all content types. The component provides both a basic
 * search mode and an advanced search option.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';

// Search categories that can be searched across the site
export const searchCategories = [
  { id: 'all', label: 'All Content', icon: Search },
  { id: 'music', label: 'Music', icon: null },
  { id: 'products', label: 'Shop', icon: null },
  { id: 'posts', label: 'Blog', icon: null },
  { id: 'newsletters', label: 'Newsletters', icon: null },
  { id: 'suggestions', label: 'Community', icon: null },
];

interface UniversalSearchBarProps {
  variant?: 'minimal' | 'expanded';
  defaultCategory?: string;
  placeholder?: string;
  onSearch?: (query: string, category: string) => void;
  darkMode?: boolean;
  className?: string;
  width?: string;
  showCategorySelector?: boolean;
  initialQuery?: string;
}

const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  variant = 'minimal',
  defaultCategory = 'all',
  placeholder = 'Search for anything...',
  onSearch,
  darkMode = false,
  className = '',
  width = 'w-full',
  showCategorySelector = true,
  initialQuery = '',
}) => {
  // State for search parameters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [category, setCategory] = useState(defaultCategory);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Navigation hooks
  const [location, navigate] = useLocation();
  
  // Debounced search query for preview results
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Get preview search results
  const { data: previewResults, isLoading } = useQuery({
    queryKey: ['universalSearchPreview', debouncedQuery, category],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      params.set('type', category);
      params.set('limit', '3'); // Just get a few preview results
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch search preview');
      
      return await response.json();
    },
    enabled: debouncedQuery.length >= 2 && showResults,
  });
  
  // Handle form submit
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // If onSearch prop provided, call it
    if (onSearch) {
      onSearch(searchQuery, category);
      return;
    }
    
    // Otherwise navigate to search page
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (category !== 'all') {
      params.set('type', category);
    }
    
    navigate(`/search?${params.toString()}`);
    setShowResults(false);
  };
  
  // Get category display name
  const getCategoryName = (categoryId: string) => {
    const category = searchCategories.find(cat => cat.id === categoryId);
    return category ? category.label : 'All Content';
  };
  
  // Handle clicks outside the search container to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate CSS classes based on props
  const containerClasses = `
    universal-search-container relative
    ${darkMode ? 'universal-search-container-dark' : ''}
    ${className}
    ${width}
  `.trim();
  
  const inputClasses = `
    transition-all duration-200 pr-24
    ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-400' : ''}
  `.trim();
  
  // Generate results counts from preview data
  const getResultsCount = () => {
    if (!previewResults) return {};
    
    const counts: Record<string, number> = {};
    Object.keys(previewResults).forEach(key => {
      if (Array.isArray(previewResults[key])) {
        counts[key] = previewResults[key].length;
      }
    });
    
    return counts;
  };
  
  const resultsCounts = getResultsCount();
  const totalResults = Object.values(resultsCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className={containerClasses} ref={searchContainerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            className={`pl-10 ${inputClasses}`}
            data-testid="universal-search-input"
          />
          
          {/* Category selector dropdown */}
          {showCategorySelector && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-7 text-xs font-normal ${darkMode ? 'text-gray-300 hover:bg-white/10' : ''}`}
                  >
                    {getCategoryName(category)}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {searchCategories.map((cat) => (
                    <DropdownMenuItem 
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className="cursor-pointer"
                    >
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {/* Additional controls for expanded variant */}
        {variant === 'expanded' && (
          <div className="flex justify-end mt-2">
            <Button 
              type="submit"
              size="sm"
              className={darkMode ? 'bg-cyan-500 hover:bg-cyan-600 text-black' : ''}
            >
              Search
            </Button>
          </div>
        )}
      </form>
      
      {/* Search Preview Results */}
      {showResults && searchQuery.length >= 2 && (
        <div 
          className={`absolute z-50 w-full mt-1 rounded-md shadow-lg overflow-hidden ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}
        >
          {isLoading ? (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Searching...
            </div>
          ) : previewResults && totalResults > 0 ? (
            <div>
              {/* Music results */}
              {previewResults.music?.length > 0 && (
                <div>
                  <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    Music ({previewResults.music.length})
                  </div>
                  <ul>
                    {previewResults.music.slice(0, 2).map((item: any) => (
                      <li key={item.id}>
                        <a
                          href={`/music/${item.id}`}
                          className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium">{item.title}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.artist}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Blog posts results */}
              {previewResults.posts?.length > 0 && (
                <div>
                  <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    Blog Posts ({previewResults.posts.length})
                  </div>
                  <ul>
                    {previewResults.posts.slice(0, 2).map((item: any) => (
                      <li key={item.id}>
                        <a
                          href={`/blog/${item.id}`}
                          className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium">{item.title}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Products results */}
              {previewResults.products?.length > 0 && (
                <div>
                  <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    Products ({previewResults.products.length})
                  </div>
                  <ul>
                    {previewResults.products.slice(0, 2).map((item: any) => (
                      <li key={item.id}>
                        <a
                          href={`/shop/${item.id}`}
                          className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ${parseFloat(item.price).toFixed(2)}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* More results link */}
              <div className={`px-4 py-2 text-center ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSubmit}
                  className={darkMode ? 'text-cyan-400' : 'text-primary'}
                >
                  See all {totalResults} results
                </Button>
              </div>
            </div>
          ) : (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversalSearchBar;