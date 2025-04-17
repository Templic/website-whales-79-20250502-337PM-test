/**
 * SearchPage.tsx
 * 
 * The main search page component that provides a consolidated interface
 * for both basic and advanced search functionality.
 */

import React from 'react';
import { useLocation } from 'wouter';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UniversalSearchBar from '@/components/search/UniversalSearchBar';
import AdvancedSearchPage from '@/components/search/AdvancedSearchPage';

const SearchPage: React.FC = () => {
  // Parse query parameters from URL
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  
  const query = params.get('q') || '';
  const type = params.get('type') || 'all';
  
  return (
    <div className="cosmic-container">
      <div className="cosmic-gradient-bg min-h-screen py-12">
        <div className="container mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold cosmic-text">Search the Cosmos</h1>
            <p className="text-lg text-cosmic-muted">
              Explore music, products, blog posts, and more
            </p>
            
            <div className="max-w-2xl mx-auto mt-8">
              <UniversalSearchBar 
                variant="expanded"
                defaultCategory={type}
                initialQuery={query}
                darkMode={true}
                className="cosmic-glow"
              />
            </div>
          </div>
          
          {query && (
            <div className="pt-4">
              <AdvancedSearchPage initialQuery={query} initialType={type} />
            </div>
          )}
          
          {!query && (
            <div className="pt-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="cosmic-card p-6 space-y-4">
                  <div className="cosmic-icon-container">
                    <Search className="w-10 h-10 text-cosmic-accent" />
                  </div>
                  <h2 className="text-2xl font-bold">Search Shortcuts</h2>
                  <ul className="space-y-2">
                    <li>
                      <a href="/search?q=meditation&type=music" className="cosmic-link">
                        Meditation music
                      </a>
                    </li>
                    <li>
                      <a href="/search?q=binaural&type=music" className="cosmic-link">
                        Binaural beats
                      </a>
                    </li>
                    <li>
                      <a href="/search?q=featured&type=products" className="cosmic-link">
                        Featured products
                      </a>
                    </li>
                    <li>
                      <a href="/search?q=cosmic&type=posts" className="cosmic-link">
                        Cosmic blog posts
                      </a>
                    </li>
                  </ul>
                </div>
                
                <div className="cosmic-card p-6 space-y-4">
                  <div className="cosmic-icon-container">
                    <Filter className="w-10 h-10 text-cosmic-accent" />
                  </div>
                  <h2 className="text-2xl font-bold">Advanced Search Tips</h2>
                  <ul className="space-y-2">
                    <li>Use the category tabs to search specific content types</li>
                    <li>Apply multiple filters to narrow your results</li>
                    <li>Sort results by relevance, date, or popularity</li>
                    <li>Save your search preferences for future visits</li>
                  </ul>
                  <Button
                    onClick={() => document.getElementById('search-input')?.focus()}
                    className="mt-4 cosmic-button"
                  >
                    Start Searching
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;