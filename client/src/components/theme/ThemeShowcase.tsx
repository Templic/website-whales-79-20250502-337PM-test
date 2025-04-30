import React, { useState } from 'react';
import { Theme } from '../../../shared/schema';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Paintbrush,
  Search,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  Grid,
  List,
  Heart,
  Download,
  Share,
  Star,
  ArrowRight,
  Copy,
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

interface ThemeShowcaseProps {
  themes: Theme[];
  onSelectTheme?: (theme: Theme) => void;
  currentTheme?: Theme;
  isFilterable?: boolean;
  isSearchable?: boolean;
  showActions?: boolean;
  layout?: 'grid' | 'list';
  emptyMessage?: React.ReactNode;
}

const ThemeShowcase: React.FC<ThemeShowcaseProps> = ({
  themes,
  onSelectTheme,
  currentTheme,
  isFilterable = true,
  isSearchable = true,
  showActions = true,
  layout = 'grid',
  emptyMessage = 'No themes found'
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>(layout);
  const [showOnlyPublic, setShowOnlyPublic] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Get all categories from the themes (from tags)
  const allCategories = React.useMemo(() => {
    const categories = new Set<string>();
    categories.add('all');
    
    themes.forEach(theme => {
      if (theme.tags) {
        theme.tags.forEach(tag => categories.add(tag));
      }
    });
    
    return Array.from(categories);
  }, [themes]);
  
  // Filter and sort themes
  const filteredThemes = React.useMemo(() => {
    return themes
      .filter(theme => {
        // Filter by public/private
        if (showOnlyPublic && !theme.isPublic) {
          return false;
        }
        
        // Filter by category
        if (activeCategory !== 'all' && (!theme.tags || !theme.tags.includes(activeCategory))) {
          return false;
        }
        
        // Filter by search
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = theme.name.toLowerCase().includes(searchLower);
          const descMatch = theme.description?.toLowerCase().includes(searchLower) ?? false;
          const tagMatch = theme.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ?? false;
          
          return nameMatch || descMatch || tagMatch;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'oldest':
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          case 'name':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [themes, activeCategory, searchTerm, showOnlyPublic, sortBy]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Render UI Components based on theme colors
  const renderThemePreview = (theme: Theme) => {
    return (
      <div 
        className="rounded-md overflow-hidden"
        style={{ 
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderRadius: theme.borderRadius || '0.5rem',
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div 
              className="h-8 w-32 rounded-md flex items-center justify-center text-xs"
              style={{ 
                backgroundColor: theme.primaryColor,
                color: '#ffffff',
              }}
            >
              Header
            </div>
            
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs"
              style={{ 
                backgroundColor: theme.accentColor,
                color: '#ffffff',
              }}
            >
              <Paintbrush className="h-4 w-4" />
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div 
              className="h-3 w-3/4 rounded-sm"
              style={{ backgroundColor: theme.textColor, opacity: 0.2 }}
            />
            <div 
              className="h-3 w-1/2 rounded-sm"
              style={{ backgroundColor: theme.textColor, opacity: 0.2 }}
            />
            <div 
              className="h-3 w-5/6 rounded-sm"
              style={{ backgroundColor: theme.textColor, opacity: 0.2 }}
            />
          </div>
          
          <div className="flex space-x-2 mb-4">
            <div 
              className="px-3 py-1 text-xs rounded-md"
              style={{ 
                backgroundColor: theme.primaryColor, 
                color: '#ffffff',
                opacity: 0.8,
              }}
            >
              Button
            </div>
            <div 
              className="px-3 py-1 text-xs rounded-md"
              style={{ 
                backgroundColor: 'transparent', 
                border: `1px solid ${theme.accentColor}`,
                color: theme.accentColor,
              }}
            >
              Button
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {theme.tags && theme.tags.map((tag, i) => (
              <div 
                key={i}
                className="px-2 py-1 text-xs rounded-md"
                style={{ 
                  backgroundColor: theme.textColor,
                  color: theme.backgroundColor,
                  opacity: 0.2,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the search and filter bar
  const renderFilters = () => {
    if (!isFilterable && !isSearchable) return null;
    
    return (
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {isSearchable && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search themes..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        )}
        
        {isFilterable && (
          <div className="flex flex-wrap gap-2">
            <Select
              value={activeCategory}
              onValueChange={setActiveCategory}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="public-only"
                checked={showOnlyPublic}
                onCheckedChange={setShowOnlyPublic}
              />
              <Label htmlFor="public-only" className="text-sm">
                Public only
              </Label>
            </div>
            
            <div className="flex justify-end items-center border rounded-md overflow-hidden">
              <Button
                variant={viewLayout === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewLayout('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button
                variant={viewLayout === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewLayout('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render theme as a grid item
  const renderGridItem = (theme: Theme) => {
    const isActive = currentTheme?.id === theme.id;
    
    return (
      <Card key={theme.id} className={`transition-all duration-300 overflow-hidden ${isActive ? 'ring-2 ring-primary' : ''}`}>
        <div 
          className="w-full h-3"
          style={{ backgroundColor: theme.primaryColor }}
        />
        
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold">{theme.name}</CardTitle>
            {isActive && (
              <Badge variant="outline" className="ml-2">
                <Check className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          {theme.description && (
            <CardDescription className="mt-1 line-clamp-2">
              {theme.description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="px-4 pt-0 pb-4">
          <div className="mb-4 rounded overflow-hidden">
            {renderThemePreview(theme)}
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {theme.tags && theme.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        
        {onSelectTheme && (
          <CardFooter className="px-4 py-3 bg-muted/10 flex justify-between">
            <Button
              variant={isActive ? "secondary" : "default"}
              onClick={() => onSelectTheme(theme)}
              disabled={isActive}
              className="w-full"
            >
              {isActive ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Applied
                </>
              ) : (
                <>
                  <Paintbrush className="h-4 w-4 mr-2" />
                  Apply
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };
  
  // Render theme as a list item
  const renderListItem = (theme: Theme) => {
    const isActive = currentTheme?.id === theme.id;
    
    return (
      <Card key={theme.id} className={`transition-all duration-300 ${isActive ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center p-4">
          <div className="flex-shrink-0 w-32 h-20 mr-4 rounded-md overflow-hidden">
            {renderThemePreview(theme)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">{theme.name}</h3>
              {isActive && (
                <Badge variant="outline" className="ml-2">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            
            {theme.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {theme.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.tags && theme.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          {onSelectTheme && (
            <div className="flex-shrink-0 ml-4">
              <Button
                variant={isActive ? "secondary" : "default"}
                onClick={() => onSelectTheme(theme)}
                disabled={isActive}
                size="sm"
              >
                {isActive ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Applied
                  </>
                ) : "Apply"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  return (
    <div>
      {renderFilters()}
      
      {filteredThemes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </div>
      ) : (
        <div className={viewLayout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredThemes.map(theme => 
            viewLayout === 'grid' 
              ? renderGridItem(theme)
              : renderListItem(theme)
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeShowcase;