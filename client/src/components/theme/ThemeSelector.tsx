/**
 * Theme Selector Component
 * 
 * This component provides a user interface for selecting and previewing themes.
 * Features:
 * - Displays a grid of available themes
 * - Shows theme previews
 * - Allows filtering by category or tag
 * - Supports switching between user themes and public themes
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Theme } from '../../../shared/schema';

interface ThemeSelectorProps {
  onThemeSelect?: (theme: Theme) => void;
  showAllOptions?: boolean;
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  onThemeSelect,
  showAllOptions = true,
  compact = false 
}) => {
  const { 
    currentTheme, 
    publicThemes, 
    userThemes, 
    setTheme, 
    isLoading,
    refreshThemes
  } = useTheme();
  
  const [activeTab, setActiveTab] = useState<string>('public');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  
  // Extract all unique tags from themes
  useEffect(() => {
    const allThemes = [...publicThemes, ...userThemes];
    const tags = allThemes.flatMap(theme => theme.tags || []);
    const uniqueTagsSet = new Set(tags);
    setUniqueTags(Array.from(uniqueTagsSet));
  }, [publicThemes, userThemes]);
  
  // Filter themes based on search query and selected tags
  const getFilteredThemes = (themes: Theme[]) => {
    return themes.filter(theme => {
      const matchesSearch = 
        searchQuery === '' || 
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (theme.description && theme.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = 
        selectedTags.length === 0 || 
        (theme.tags && selectedTags.some(tag => theme.tags?.includes(tag)));
      
      return matchesSearch && matchesTags;
    });
  };
  
  // Handle theme selection
  const handleSelectTheme = (theme: Theme) => {
    setTheme(theme);
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
  };
  
  // Toggle a tag filter
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Refresh themes from the server
  const handleRefresh = () => {
    refreshThemes();
  };
  
  // Render a theme card
  const renderThemeCard = (theme: Theme) => {
    const isActive = currentTheme.id === theme.id;
    
    return (
      <Card key={theme.id} className={`theme-card ${isActive ? 'border-primary' : ''} ${compact ? 'h-32' : 'h-48'}`}>
        <CardHeader className={compact ? 'p-3' : 'p-4'}>
          <CardTitle className={`${compact ? 'text-sm' : 'text-lg'} truncate`}>{theme.name}</CardTitle>
        </CardHeader>
        
        <CardContent className={compact ? 'px-3 py-1' : 'p-4'}>
          {/* Theme Preview */}
          <div className="theme-preview grid grid-cols-2 gap-1 mb-2">
            <div className="color-preview h-4 rounded" style={{ backgroundColor: theme.primaryColor }} title="Primary Color" />
            <div className="color-preview h-4 rounded" style={{ backgroundColor: theme.accentColor }} title="Accent Color" />
            <div className="color-preview h-4 rounded" style={{ backgroundColor: theme.backgroundColor }} title="Background Color" />
            <div className="color-preview h-4 rounded" style={{ backgroundColor: theme.textColor }} title="Text Color" />
          </div>
          
          {/* Theme description */}
          {!compact && theme.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
          )}
          
          {/* Theme tags */}
          {!compact && theme.tags && theme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {theme.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{theme.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className={compact ? 'p-3' : 'p-4'}>
          <Button 
            variant={isActive ? "default" : "outline"} 
            size={compact ? "sm" : "default"}
            className="w-full"
            onClick={() => handleSelectTheme(theme)}
          >
            {isActive ? "Current" : "Apply"}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Render loading skeleton
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <Card key={`skeleton-${i}`} className={compact ? 'h-32' : 'h-48'}>
        <CardHeader className={compact ? 'p-3' : 'p-4'}>
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        
        <CardContent className={compact ? 'px-3 py-1' : 'p-4'}>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          
          {!compact && (
            <>
              <Skeleton className="h-2 w-full mt-2" />
              <Skeleton className="h-2 w-3/4 mt-1" />
            </>
          )}
        </CardContent>
        
        <CardFooter className={compact ? 'p-3' : 'p-4'}>
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    ));
  };
  
  // Get filtered themes for the active tab
  const filteredPublicThemes = getFilteredThemes(publicThemes);
  const filteredUserThemes = getFilteredThemes(userThemes);
  
  return (
    <div className="theme-selector">
      {showAllOptions && (
        <div className="theme-selector-controls space-y-4 mb-4">
          {/* Tabs for public/user themes */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="public">Public Themes</TabsTrigger>
              <TabsTrigger value="user">Your Themes</TabsTrigger>
            </TabsList>
            
            {/* Search and filter */}
            <div className="flex items-center gap-2 mt-4">
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Refresh
              </Button>
            </div>
            
            {/* Tag filters */}
            {uniqueTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {uniqueTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Tabs>
        </div>
      )}
      
      {/* Theme grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
        {isLoading ? (
          renderSkeletons()
        ) : (
          <>
            {activeTab === 'public' || !showAllOptions ? (
              filteredPublicThemes.length > 0 ? (
                filteredPublicThemes.map(renderThemeCard)
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No public themes match your criteria
                </div>
              )
            ) : (
              filteredUserThemes.length > 0 ? (
                filteredUserThemes.map(renderThemeCard)
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You don't have any custom themes yet
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;