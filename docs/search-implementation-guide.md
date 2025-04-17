# Search Implementation Guide

This guide provides instructions for implementing new search components or extending the existing search functionality in the application.

## Table of Contents
1. [Adding a New Search Component](#adding-a-new-search-component)
2. [Extending Backend Search Functionality](#extending-backend-search-functionality)
3. [Adding New Search Filters](#adding-new-search-filters)
4. [Best Practices](#best-practices)
5. [Performance Considerations](#performance-considerations)

## Adding a New Search Component

### 1. Create the Component File

Create a new TypeScript file for your component in the appropriate directory:

```typescript
// client/src/components/yourFeature/YourSearchComponent.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';

interface YourSearchComponentProps {
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  onSearch?: (query: string, filters: any) => void;
}

export default function YourSearchComponent({
  initialQuery = '',
  className = '',
  placeholder = 'Search...',
  onSearch
}: YourSearchComponentProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [, navigate] = useLocation();
  
  // Debounce the search query
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Search results query
  const { data, isLoading } = useQuery({
    queryKey: ['yourSearch', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const params = new URLSearchParams();
      params.set('q', debouncedQuery);
      params.set('type', 'yourContentType');
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      
      return await response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    if (onSearch) {
      onSearch(searchQuery, {});
    } else {
      navigate(`/your-feature/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
          Search
        </Button>
      </div>
      
      {/* Results preview or additional UI elements */}
    </form>
  );
}
```

### 2. Add Content Type to Universal Search

Update the search categories in UniversalSearchBar:

```typescript
// client/src/components/search/UniversalSearchBar.tsx

export const searchCategories = [
  { id: 'all', label: 'All Content', icon: Search },
  { id: 'music', label: 'Music', icon: null },
  { id: 'products', label: 'Shop', icon: null },
  { id: 'posts', label: 'Blog', icon: null },
  // Add your new category:
  { id: 'yourContentType', label: 'Your Feature', icon: YourIcon },
];
```

### 3. Add Support to AdvancedSearchPage

Update the AdvancedSearchPage to support your new content type:

```typescript
// client/src/components/search/AdvancedSearchPage.tsx

// Add your content type to the tabs
const renderTabs = () => (
  <TabsList className="grid grid-cols-6">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="music">Music</TabsTrigger>
    <TabsTrigger value="products">Shop</TabsTrigger>
    <TabsTrigger value="posts">Blog</TabsTrigger>
    <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
    {/* Add your new tab */}
    <TabsTrigger value="yourContentType">Your Feature</TabsTrigger>
  </TabsList>
);

// Add content-specific filters for your type
const renderFilters = () => {
  if (currentTab === 'yourContentType') {
    return (
      <div className="space-y-4">
        {/* Your specialized filters here */}
        <h3 className="text-sm font-medium">Your Feature Filters</h3>
        {/* Filter controls */}
      </div>
    );
  }
  
  // Other content type filters...
};
```

## Extending Backend Search Functionality

### 1. Add a Search Function

Add a new search function in the search routes file:

```typescript
// server/routes/search/index.ts

/**
 * Search for your content type
 */
async function searchYourContentType(query: string, limit: number, params: Record<string, any> = {}): Promise<any[]> {
  try {
    // Normalize search query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Get items from storage
    const items = await storage.getAllYourItems();
    
    // Filter items by search terms
    let filteredItems = items.filter(item => {
      // Check if item matches search terms
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      
      // Match any term against item data
      return searchTerms.some(term => 
        title.includes(term) || 
        description.includes(term)
      );
    });
    
    // Apply additional filters from searchParams
    if (params.yourFilter) {
      filteredItems = filteredItems.filter(item => 
        // Apply your custom filter logic
      );
    }
    
    // Sort and limit results
    return filteredItems.slice(0, limit);
  } catch (error) {
    console.error('Error searching your content:', error);
    return [];
  }
}
```

### 2. Add to the Main Search Endpoint

Update the main search endpoint to include your content type:

```typescript
// server/routes/search/index.ts

router.get('/', async (req: Request, res: Response) => {
  try {
    // Existing code...
    
    // Setup search results with default empty arrays
    const results: {
      music: any[];
      products: any[];
      posts: any[];
      users: any[];
      yourContentType: any[]; // Add your content type
    } = {
      music: [],
      products: [],
      posts: [],
      users: [],
      yourContentType: [], // Initialize empty array
    };
    
    // Add your content type to the supported types
    if (type === 'all' || type === 'yourContentType') {
      promises.push(searchYourContentType(query, limit, searchParams));
    }
    
    // Execute all search queries in parallel
    const results_array = await Promise.all(promises);
    
    // Map results to the appropriate fields
    // Update indices as needed
    let yourContentTypeIndex = promises.length - 1;
    
    // Add your results to the response
    if (type === 'all' || type === 'yourContentType') {
      results.yourContentType = results_array[yourContentTypeIndex] || [];
    }
    
    // Return the search results
    return res.json(results);
  } catch (error) {
    // Error handling...
  }
});
```

### 3. Create a Specialized Endpoint (Optional)

For more complex search requirements, create a specialized endpoint:

```typescript
// server/routes/search.ts

// Specialized search endpoint for your content
router.get('/api/your-feature/search', async (req, res) => {
  try {
    const { q, yourFilter1, yourFilter2 } = req.query;
    
    // If no search query, return empty results
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.json([]);
    }
    
    const searchTerm = sanitizeSearchTerm(q.trim());
    
    // Build query conditions
    const conditions = [];
    
    // Main search term
    conditions.push(
      or(
        like(yourItems.title, `%${searchTerm}%`),
        like(yourItems.description, `%${searchTerm}%`)
      )
    );
    
    // Additional filters
    if (yourFilter1 && typeof yourFilter1 === 'string') {
      conditions.push(like(yourItems.field1, `%${yourFilter1}%`));
    }
    
    // Execute the search
    const results = await db
      .select()
      .from(yourItems)
      .where(and(...conditions))
      .limit(20);
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});
```

## Adding New Search Filters

### 1. Define Filter State

Add filter state to your search component:

```typescript
// Filter state
const [filters, setFilters] = useState({
  category: '',
  dateRange: { from: null, to: null },
  status: 'all',
  // Add other filters as needed
});

// Active filters tracking
const [activeFilters, setActiveFilters] = useState<string[]>([]);
```

### 2. Create Filter UI

Add UI for the filters:

```tsx
<div className="filter-controls space-y-4">
  {/* Category filter */}
  <div>
    <Label htmlFor="category">Category</Label>
    <Select
      value={filters.category}
      onValueChange={(value) => 
        setFilters(prev => ({ ...prev, category: value }))
      }
    >
      <SelectTrigger id="category">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All categories</SelectItem>
        <SelectItem value="category1">Category 1</SelectItem>
        <SelectItem value="category2">Category 2</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  {/* Date filter */}
  <div>
    <Label>Date Range</Label>
    <div className="grid grid-cols-2 gap-2">
      <DatePicker
        date={filters.dateRange.from}
        setDate={(date) => 
          setFilters(prev => ({ 
            ...prev, 
            dateRange: { ...prev.dateRange, from: date } 
          }))
        }
        placeholder="From"
      />
      <DatePicker
        date={filters.dateRange.to}
        setDate={(date) => 
          setFilters(prev => ({ 
            ...prev, 
            dateRange: { ...prev.dateRange, to: date } 
          }))
        }
        placeholder="To"
      />
    </div>
  </div>
</div>
```

### 3. Update Query Parameters

Include filters in your API query:

```typescript
// Build query parameters with filters
const buildQueryParams = () => {
  const params = new URLSearchParams();
  params.set('q', searchQuery);
  params.set('type', 'yourContentType');
  
  if (filters.category) {
    params.set('category', filters.category);
  }
  
  if (filters.dateRange.from) {
    params.set('startDate', filters.dateRange.from.toISOString().split('T')[0]);
  }
  
  if (filters.dateRange.to) {
    params.set('endDate', filters.dateRange.to.toISOString().split('T')[0]);
  }
  
  // Add other filters as needed
  
  return params;
};

// Update your useQuery call
const { data, isLoading } = useQuery({
  queryKey: ['yourSearch', debouncedQuery, filters],
  queryFn: async () => {
    if (!debouncedQuery) return { results: [] };
    
    const params = buildQueryParams();
    const response = await fetch(`/api/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }
    
    return await response.json();
  },
  enabled: debouncedQuery.length > 0,
});
```

## Best Practices

### 1. Always Use Debouncing
Implement debouncing for all search inputs to prevent excessive API calls:

```typescript
import { useDebounce } from '@/hooks/use-debounce';

// In your component:
const debouncedQuery = useDebounce(searchQuery, 300); // 300ms delay
```

### 2. Sanitize Search Input
Always sanitize search queries on the server side:

```typescript
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_[\]^]/g, '\\$&');
}
```

### 3. Handle Loading and Error States
Provide clear feedback for loading and error states:

```tsx
{isLoading && (
  <div className="py-4 text-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
    <p className="text-sm text-muted-foreground mt-2">Searching...</p>
  </div>
)}

{isError && (
  <div className="py-4 text-center text-red-500">
    <p>An error occurred while searching.</p>
    <Button variant="outline" size="sm" onClick={() => refetch()}>
      Try Again
    </Button>
  </div>
)}
```

### 4. Make Search Results Accessible
Ensure search components are keyboard accessible:

```tsx
<div role="search">
  <label htmlFor="search-input" className="sr-only">
    Search
  </label>
  <Input
    id="search-input"
    type="search"
    aria-label="Search items"
    placeholder="Search..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  
  {showResults && (
    <div
      role="listbox"
      aria-label="Search results"
      tabIndex={0}
    >
      {results.map((result) => (
        <div
          key={result.id}
          role="option"
          aria-selected={selectedId === result.id}
          tabIndex={-1}
        >
          {result.title}
        </div>
      ))}
    </div>
  )}
</div>
```

## Performance Considerations

### 1. Limit Result Size
Always limit the number of results returned:

```typescript
// On the server:
return filteredItems.slice(0, limit);

// In the query:
params.set('limit', '20');
```

### 2. Use Query Caching
Take advantage of TanStack Query's caching:

```typescript
const { data } = useQuery({
  queryKey: ['search', debouncedQuery, filters],
  queryFn: async () => { /* ... */ },
  staleTime: 60 * 1000, // Cache results for 1 minute
  cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
});
```

### 3. Implement Pagination
For large result sets, implement pagination:

```tsx
// Component state
const [page, setPage] = useState(1);

// Query with pagination
const { data } = useQuery({
  queryKey: ['search', debouncedQuery, filters, page],
  queryFn: async () => {
    const params = buildQueryParams();
    params.set('page', page.toString());
    // API call...
  },
});

// Pagination UI
<div className="flex justify-center mt-4">
  <Button
    onClick={() => setPage(p => Math.max(p - 1, 1))}
    disabled={page === 1 || isLoading}
  >
    Previous
  </Button>
  <span className="mx-4">Page {page}</span>
  <Button
    onClick={() => setPage(p => p + 1)}
    disabled={!data?.hasMore || isLoading}
  >
    Next
  </Button>
</div>
```

### 4. Client-Side Filtering for Small Datasets
For small datasets, consider client-side filtering:

```typescript
// Fetch all data once
const { data: allItems } = useQuery({
  queryKey: ['allItems'],
  queryFn: () => fetch('/api/your-items').then(res => res.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Filter client-side
const filteredItems = React.useMemo(() => {
  if (!allItems || !searchQuery) return [];
  
  const query = searchQuery.toLowerCase();
  return allItems.filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  );
}, [allItems, searchQuery]);
```