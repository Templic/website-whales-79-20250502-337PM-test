/**
 * UniversalSearchBar.tsx
 * 
 * A universal search bar component that provides both basic and advanced search functionality
 * with hover dropdown for quick navigation and cosmically-styled UI elements.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';

// Quick Navigation Links - customize these as needed for your site
const quickLinks = [
  { name: "Latest Music", path: "/music/latest" },
  { name: "Featured Products", path: "/shop/featured" },
  { name: "Healing Frequencies", path: "/music/frequencies" },
  { name: "Cosmic Collection", path: "/shop/cosmic-collection" },
  { name: "Community Forum", path: "/community" },
  { name: "Recent Blog Posts", path: "/blog/recent" },
];

// Define the available search categories
export const searchCategories = [
  { value: 'all', label: 'All Content' },
  { value: 'music', label: 'Music' },
  { value: 'products', label: 'Products' },
  { value: 'posts', label: 'Blog Posts' },
  // Admin-only categories would be conditionally rendered
];

// Props type for the component
interface UniversalSearchBarProps {
  variant?: 'minimal' | 'expanded';
  defaultCategory?: string;
  placeholder?: string;
  onSearch?: (query: string, category: string) => void;
  darkMode?: boolean;
  className?: string;
}

export const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  variant = 'minimal',
  defaultCategory = 'all',
  placeholder = 'Search...',
  onSearch,
  darkMode = false,
  className = '',
}) => {
  // State for search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  
  // Navigation hooks
  const [location, navigate] = useLocation();
  
  // Debounced search query for preview results
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Get preview search results with React Query
  const { data: previewResults, isLoading } = useQuery({
    queryKey: ['searchPreview', debouncedQuery, selectedCategory],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      params.set('type', selectedCategory);
      params.set('limit', '3'); // Just get a few preview results
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch search preview');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsHovered(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle search form submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // If onSearch prop provided, call it
    if (onSearch) {
      onSearch(searchQuery, selectedCategory);
      return;
    }
    
    // Otherwise navigate to search page
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (selectedCategory !== 'all') {
      params.set('type', selectedCategory);
    }
    
    navigate(`/search?${params.toString()}`);
    setIsDropdownOpen(false);
  }, [searchQuery, selectedCategory, onSearch, navigate]);
  
  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Toggle between basic and advanced search
  const toggleAdvancedSearch = () => {
    setIsAdvanced(!isAdvanced);
  };
  
  // Determine total result count for preview display
  const getTotalPreviewCount = () => {
    if (!previewResults) return 0;
    
    return (
      (previewResults.music?.length || 0) +
      (previewResults.products?.length || 0) +
      (previewResults.posts?.length || 0) +
      (previewResults.users?.length || 0)
    );
  };
  
  // Calculate CSS classes based on props
  const containerClasses = `
    search-container relative
    ${darkMode ? 'search-container-dark' : ''}
    ${className}
  `.trim();
  
  const inputClasses = `
    transition-all duration-200
    ${darkMode ? 'bg-black/20 border-white/10 text-white placeholder-gray-400' : ''}
    ${isAdvanced ? 'rounded-t-md rounded-b-none border-b-0' : 'rounded-md'}
  `.trim();
  
  // Render the component
  return (
    <div 
      ref={searchBarRef}
      className={containerClasses}
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* Main search input */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsDropdownOpen(true)}
            className={`pl-10 pr-10 ${inputClasses}`}
            data-testid="universal-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* Search Controls for expanded variant */}
        {variant === 'expanded' && (
          <div className="flex items-center mt-2 gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`text-sm p-1 rounded border ${darkMode ? 'bg-black/20 border-white/10 text-white' : 'border-input'}`}
            >
              {searchCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={toggleAdvancedSearch}
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
        
        {/* Advanced Search Options - shown when isAdvanced is true */}
        {isAdvanced && variant === 'expanded' && (
          <div className={`p-4 border rounded-b-md shadow-md ${darkMode ? 'bg-black/20 border-white/10' : 'bg-card'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add advanced filter options based on the selected category */}
              {selectedCategory === 'music' || selectedCategory === 'all' ? (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                    Frequency (Hz):
                  </label>
                  <Input 
                    type="text" 
                    placeholder="432, 528, etc."
                    className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                  />
                </div>
              ) : null}
              
              {selectedCategory === 'products' || selectedCategory === 'all' ? (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                    Price Range:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                    />
                    <span>-</span>
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      className={darkMode ? 'bg-black/20 border-white/10 text-white' : ''}
                    />
                  </div>
                </div>
              ) : null}
              
              {/* Add more category-specific filters here */}
            </div>
          </div>
        )}
      </form>
      
      {/* Quick Links Dropdown */}
      {(isHovered || isDropdownOpen) && searchQuery.length === 0 && (
        <div 
          className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}
        >
          <div className={`py-2 ${darkMode ? 'text-gray-300' : ''}`}>
            <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Quick Links
            </div>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <a
                    href={link.path}
                    className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Search Preview Results */}
      {isDropdownOpen && searchQuery.length >= 2 && (
        <div 
          className={`absolute z-10 w-full mt-1 rounded-md shadow-lg overflow-hidden ${darkMode ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'}`}
        >
          {isLoading ? (
            <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Searching...
            </div>
          ) : previewResults && getTotalPreviewCount() > 0 ? (
            <div>
              {/* Music preview results */}
              {previewResults.music?.length > 0 && (
                <div className="border-b last:border-b-0">
                  <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    Music
                  </div>
                  <ul>
                    {previewResults.music.slice(0, 2).map((track: any) => (
                      <li key={track.id}>
                        <a
                          href={`/music/track/${track.id}`}
                          className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                        >
                          <div className="font-medium">{track.title}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {track.artist} {track.frequency ? `• ${track.frequency} Hz` : ''}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Products preview results */}
              {previewResults.products?.length > 0 && (
                <div className="border-b last:border-b-0">
                  <div className={`px-4 py-1 text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-500 bg-gray-50'}`}>
                    Products
                  </div>
                  <ul>
                    {previewResults.products.slice(0, 2).map((product: any) => (
                      <li key={product.id}>
                        <a
                          href={`/shop/product/${product.id}`}
                          className={`block px-4 py-2 text-sm hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ${product.price.toFixed(2)} • {product.category}
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
                  See all results ({getTotalPreviewCount()})
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