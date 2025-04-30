import React, { useState, useEffect } from 'react';
import { Theme } from '../../../shared/schema';
import { useTheme } from '@/contexts/ThemeContext';

import {
  Search,
  Filter,
  X,
  Check,
  Tags,
  Grid,
  List,
  SlidersHorizontal,
  Paintbrush,
  Star,
  Zap,
  SunMoon,
  Users,
  Calendar,
  Ghost,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ThemeCard from './ThemeCard';

interface ThemeShowcaseProps {
  themes: Theme[];
  currentTheme?: Theme;
  onSelectTheme: (theme: Theme) => void;
  isFilterable?: boolean;
  isSearchable?: boolean;
  showActions?: boolean;
  initialFilters?: {
    category?: string;
    tags?: string[];
    sort?: 'newest' | 'popular' | 'name';
  };
}

const ThemeShowcase: React.FC<ThemeShowcaseProps> = ({
  themes,
  currentTheme,
  onSelectTheme,
  isFilterable = false,
  isSearchable = false,
  showActions = false,
  initialFilters = {},
}) => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tags || []);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>(initialFilters.sort || 'newest');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Extract all available tags from themes
  const allTags = [...new Set(themes.flatMap(theme => theme.tags || []))].sort();
  
  // Toggle a tag in the selected tags array
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Filter themes based on search query, category, and tags
  const filteredThemes = themes.filter(theme => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = theme.name.toLowerCase().includes(query);
      const matchesDescription = theme.description?.toLowerCase().includes(query) || false;
      const matchesTags = theme.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    // Category filter
    if (selectedCategory === 'system' && theme.userId) {
      return false;
    }
    if (selectedCategory === 'user' && !theme.userId) {
      return false;
    }
    if (selectedCategory === 'public' && !theme.isPublic) {
      return false;
    }
    if (selectedCategory === 'private' && theme.isPublic) {
      return false;
    }
    
    // Tags filter
    if (selectedTags.length > 0) {
      return selectedTags.every(tag => theme.tags?.includes(tag));
    }
    
    return true;
  });
  
  // Sort the filtered themes
  const sortedThemes = [...filteredThemes].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // For 'popular', we'd usually use analytics data - fallback to name sorting for now
    return a.name.localeCompare(b.name);
  });
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('newest');
  };
  
  // Render the category tabs
  const renderCategoryTabs = () => {
    return (
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="user">Custom</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  };
  
  // Render the tag badges
  const renderTagSelector = () => {
    return (
      <div className="flex flex-wrap gap-1 mt-4">
        {allTags.map((tag, i) => (
          <Badge
            key={i}
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            className="cursor-pointer transition-colors"
            onClick={() => toggleTag(tag)}
          >
            {tag}
            {selectedTags.includes(tag) && (
              <X className="h-3 w-3 ml-1" />
            )}
          </Badge>
        ))}
        {allTags.length === 0 && (
          <div className="text-sm text-muted-foreground">No tags available</div>
        )}
      </div>
    );
  };
  
  // Render the sort options
  const renderSortOptions = () => {
    return (
      <Select value={sortBy} onValueChange={(value: 'newest' | 'popular' | 'name') => setSortBy(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="name">Alphabetical</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };
  
  // Render the grid/list view toggle
  const renderViewTypeToggle = () => {
    return (
      <div className="flex space-x-1">
        <Button
          variant={viewType === 'grid' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewType('grid')}
          className="h-8 w-8"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewType === 'list' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewType('list')}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  // Render the search bar
  const renderSearchBar = () => {
    return (
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search themes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1.5 h-6 w-6"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };
  
  // Render the filter section
  const renderFilterSection = () => {
    const hasActiveFilters = selectedCategory !== 'all' || selectedTags.length > 0 || sortBy !== 'newest';
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
          
          <div className="flex space-x-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            )}
            
            {renderViewTypeToggle()}
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 border rounded-md bg-muted/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Categories</Label>
                {renderCategoryTabs()}
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Sort By</Label>
                {renderSortOptions()}
              </div>
            </div>
            
            <div className="mt-4">
              <Label className="text-sm font-medium mb-1.5 block">Tags</Label>
              {renderTagSelector()}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Display appropriate message when no themes match the filter
  const renderEmptyState = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-muted-foreground">
            <Ghost className="h-5 w-5 mr-2" />
            No Themes Found
          </CardTitle>
          <CardDescription>
            There are no themes matching your current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query to find more themes.
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  // Display error state
  const renderErrorState = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Themes
          </CardTitle>
          <CardDescription>
            There was a problem loading the themes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive/90 mb-4">
            Please try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  // Render the themes in grid or list view
  const renderThemes = () => {
    if (sortedThemes.length === 0) {
      return renderEmptyState();
    }
    
    if (viewType === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentTheme?.id === theme.id}
              onSelect={onSelectTheme}
              canEdit={false}
              canDelete={false}
              canPublish={false}
            />
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          {sortedThemes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden hover:shadow-sm">
              <div className="flex items-center p-3">
                <div 
                  className="h-6 w-6 mr-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">
                      {theme.name}
                      {currentTheme?.id === theme.id && (
                        <Badge variant="outline" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </h3>
                    <Button 
                      variant={currentTheme?.id === theme.id ? "outline" : "default"}
                      size="sm"
                      onClick={() => onSelectTheme(theme)}
                      disabled={currentTheme?.id === theme.id}
                    >
                      {currentTheme?.id === theme.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {theme.description && (
                    <p className="text-sm text-muted-foreground">
                      {theme.description}
                    </p>
                  )}
                  
                  {theme.tags && theme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {theme.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
  };
  
  return (
    <div className="space-y-4">
      {(isSearchable || isFilterable) && (
        <div className="space-y-4">
          {isSearchable && renderSearchBar()}
          {isFilterable && renderFilterSection()}
        </div>
      )}
      
      {renderThemes()}
    </div>
  );
};

export default ThemeShowcase;