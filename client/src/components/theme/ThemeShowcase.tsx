import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, Star, Users, Clock, Check, Info, ArrowRight, Eye } from 'lucide-react';

interface ThemeStats {
  applications: number;
  views: number;
  userCount: number;
  sentiment: number;
}

interface Theme {
  id: number;
  name: string;
  description: string;
  tokens: Record<string, any>;
  tags: string[];
  isPublic: boolean;
  userId: string;
  version: string;
  parentThemeId?: number;
  metadata?: Record<string, any>;
  stats?: ThemeStats;
  previewUrl?: string;
}

interface ThemeShowcaseProps {
  adminMode?: boolean; // Additional controls for admins
  onThemeSelect?: (theme: Theme) => void;
  includePrivate?: boolean;
  maxItems?: number;
  categoryFilter?: string;
  tagFilter?: string;
}

export function ThemeShowcase({
  adminMode = false,
  onThemeSelect,
  includePrivate = false,
  maxItems = 9,
  categoryFilter,
  tagFilter
}: ThemeShowcaseProps) {
  const { toast } = useToast();
  const { setTheme, currentTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filter, setFilter] = useState({
    category: categoryFilter || '',
    tag: tagFilter || ''
  });

  // Fetch themes from the API
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['/api/themes/showcase', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.tag) params.append('tag', filter.tag);
      
      const response = await fetch(`/api/themes/showcase?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch themes');
      return await response.json();
    }
  });

  // Get categories and tags for filters
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/themes/categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/themes/categories');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    initialData: []
  });

  const { data: tagsData } = useQuery({
    queryKey: ['/api/themes/tags'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/themes/tags');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
      }
    },
    initialData: []
  });

  // Apply a theme
  const handleApplyTheme = async (theme: Theme) => {
    try {
      // Apply the theme to the context
      setTheme(theme.tokens);
      
      // Record theme usage
      await fetch(`/api/themes/${theme.id}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Show success message
      toast({
        title: 'Theme Applied',
        description: `${theme.name} theme has been applied successfully.`,
        variant: 'default',
      });
      
      // Notify parent if callback provided
      if (onThemeSelect) {
        onThemeSelect(theme);
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply theme. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Preview a theme
  const handlePreviewTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setPreviewOpen(true);
  };

  // Categories and tags components
  const categories = categoriesData || [];
  const tags = tagsData || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading themes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <Info className="h-8 w-8" />
        <p className="mt-4">Error loading themes: {error.message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const themes = data?.themes || [];
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Select 
            value={filter.category}
            onValueChange={(value) => setFilter({...filter, category: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select
            value={filter.tag}
            onValueChange={(value) => setFilter({...filter, tag: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator />
      
      {/* Theme Grid */}
      {themes.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No themes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.slice(0, maxItems).map((theme) => (
            <Card key={theme.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Theme Preview Image */}
              {theme.previewUrl && (
                <div 
                  className="h-32 bg-cover bg-center cursor-pointer"
                  style={{ backgroundImage: `url(${theme.previewUrl})` }}
                  onClick={() => handlePreviewTheme(theme)}
                >
                  <div className="h-full flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{theme.name}</CardTitle>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground mr-1">v{theme.version}</span>
                    {currentTheme?.id === theme.id && (
                      <Badge variant="outline" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {theme.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {theme.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {theme.tags?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{theme.tags.length - 3} more
                    </Badge>
                  )}
                </div>
                
                {theme.stats && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Star className="h-3 w-3 mr-1" /> Rating
                      </span>
                      <span className="font-medium">
                        {(theme.stats.sentiment * 5).toFixed(1)} / 5
                      </span>
                    </div>
                    <Progress value={theme.stats.sentiment * 100} className="h-1" />
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" /> Users
                      </span>
                      <span>{theme.stats.userCount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between bg-muted/20 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTheme(theme)}
                >
                  Preview
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApplyTheme(theme)}
                  disabled={currentTheme?.id === theme.id}
                >
                  {currentTheme?.id === theme.id ? 'Active' : 'Apply'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* More Button */}
      {themes.length > maxItems && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" className="flex items-center">
            View More Themes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Theme Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTheme?.name}</DialogTitle>
            <DialogDescription>
              {selectedTheme?.description || 'No description available'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTheme && (
            <div className="space-y-6">
              {/* Theme Preview */}
              <div className="aspect-video bg-card border rounded-md overflow-hidden">
                {selectedTheme.previewUrl ? (
                  <img 
                    src={selectedTheme.previewUrl} 
                    alt={`Preview of ${selectedTheme.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
              
              {/* Theme Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Theme Details</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Version</dt>
                      <dd>{selectedTheme.version}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created By</dt>
                      <dd>{selectedTheme.metadata?.createdBy || 'Unknown'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd>{new Date(selectedTheme.metadata?.updatedAt || Date.now()).toLocaleDateString()}</dd>
                    </div>
                    {selectedTheme.parentThemeId && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Extends Theme</dt>
                        <dd>{selectedTheme.metadata?.inheritance?.parentName || `Theme #${selectedTheme.parentThemeId}`}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Color Palette</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTheme.tokens?.colors && Object.entries(selectedTheme.tokens.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-2" 
                          style={{ backgroundColor: value as string }}
                        />
                        <span className="text-sm">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    handleApplyTheme(selectedTheme);
                    setPreviewOpen(false);
                  }}
                  disabled={currentTheme?.id === selectedTheme.id}
                >
                  {currentTheme?.id === selectedTheme.id ? 'Active Theme' : 'Apply Theme'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}