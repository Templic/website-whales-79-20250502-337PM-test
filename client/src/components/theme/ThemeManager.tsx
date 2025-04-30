/**
 * Harmonize Theme Manager Component
 * 
 * This advanced component provides a comprehensive interface for managing themes in the Harmonize system.
 * It includes features for:
 * - Theme browsing and selection
 * - Theme creation and editing
 * - Theme analysis and insights
 * - Theme sharing and publishing
 * - Theme personalization with accessibility features
 * 
 * The component is fully responsive and integrates with the ThemeContext for state management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@shared/theme/ThemeContext';
import { ThemePreviewPanel } from '@shared/theme/ThemePreviewPanel';
import { 
  checkContrastRatio,
  generateAccessibleVariant
} from '@shared/theme/accessibility';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Check, 
  ChevronDown, 
  Copy, 
  Download, 
  Edit, 
  ExternalLink, 
  Eye, 
  FileJson, 
  Loader2, 
  MoreHorizontal, 
  Palette, 
  Plus, 
  Save, 
  Share2, 
  Star, 
  Trash, 
  Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { apiRequest } from '@/lib/queryClient';
import { Theme, ThemeAnalytics } from '@shared/schema';
import { AIThemeGenerator } from './AIThemeGenerator';
import { ThemeAnalytics as ThemeAnalyticsComponent } from './ThemeAnalytics';

// Helper function to format tokens for display
const formatTokenValue = (value: string | null | undefined): string => {
  if (!value) return 'Not set';
  if (value.startsWith('#')) return value.toUpperCase();
  if (value.startsWith('hsl')) return value;
  if (value.startsWith('rgba')) return value;
  return value;
};

// Type definitions for props
interface ThemeManagerProps {
  initialTab?: string;
  showAnalytics?: boolean;
  compact?: boolean;
  onThemeSelect?: (theme: Theme) => void;
  userId?: number;
}

export const ThemeManager = ({
  initialTab = 'browse',
  showAnalytics = true,
  compact = false,
  onThemeSelect,
  userId
}: ThemeManagerProps) => {
  // State for theme browser
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPublicOnly, setShowPublicOnly] = useState<boolean>(false);
  const [showMineOnly, setShowMineOnly] = useState<boolean>(userId ? true : false);
  
  // State for theme editor
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentEditingTheme, setCurrentEditingTheme] = useState<Theme | null>(null);
  const [editingThemeName, setEditingThemeName] = useState<string>('');
  const [editingThemeDesc, setEditingThemeDesc] = useState<string>('');
  const [editingThemeCategory, setEditingThemeCategory] = useState<string>('');
  const [editingThemeTokens, setEditingThemeTokens] = useState<Record<string, any>>({});
  const [editingColorKey, setEditingColorKey] = useState<string | null>(null);
  const [editingColorValue, setEditingColorValue] = useState<string>('#ffffff');
  
  // State for dialogs
  const [themeDetailOpen, setThemeDetailOpen] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'css'>('json');
  
  // Access theme context for current theme
  const { theme, setTheme, mode, setMode } = useTheme();
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Query all themes with filters
  const { data: themes, isLoading, error } = useQuery({
    queryKey: ['themes', showPublicOnly, showMineOnly, userId, filterCategory],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (showPublicOnly) queryParams.append('isPublic', 'true');
      if (showMineOnly && userId) queryParams.append('userId', userId.toString());
      if (filterCategory !== 'all') queryParams.append('category', filterCategory);
      
      const url = `/api/themes?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }
      return response.json() as Promise<Theme[]>;
    }
  });
  
  // Query popular themes
  const { data: popularThemes, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['themes', 'popular'],
    queryFn: async () => {
      const response = await fetch('/api/themes/popular?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch popular themes');
      }
      return response.json() as Promise<Theme[]>;
    }
  });
  
  // Query theme analytics if a theme is selected
  const { data: themeAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['themeAnalytics', selectedTheme?.id],
    queryFn: async () => {
      if (!selectedTheme?.id) return null;
      const response = await fetch(`/api/themes/${selectedTheme.id}/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch theme analytics');
      }
      return response.json() as Promise<ThemeAnalytics>;
    },
    enabled: !!selectedTheme?.id && showAnalytics
  });
  
  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: (newTheme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiRequest('/api/themes', {
        method: 'POST',
        body: JSON.stringify(newTheme),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      resetEditor();
    },
  });
  
  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: (updatedTheme: Partial<Theme> & { id: number }) => {
      return apiRequest(`/api/themes/${updatedTheme.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTheme),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      resetEditor();
    },
  });
  
  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setSelectedTheme(null);
      setThemeDetailOpen(false);
      setShowDeleteConfirm(false);
    },
  });
  
  // Apply theme mutation
  const applyThemeMutation = useMutation({
    mutationFn: (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}/apply`, {
        method: 'POST',
      });
    }
  });
  
  // Share theme mutation
  const shareThemeMutation = useMutation({
    mutationFn: ({ themeId, isPublic }: { themeId: number, isPublic: boolean }) => {
      return apiRequest(`/api/themes/${themeId}/share`, {
        method: 'POST',
        body: JSON.stringify({ isPublic }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setShowShareDialog(false);
      if (selectedTheme) {
        setSelectedTheme({
          ...selectedTheme,
          isPublic: !selectedTheme.isPublic
        });
      }
    },
  });
  
  // Duplicate theme mutation
  const duplicateThemeMutation = useMutation({
    mutationFn: (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}/duplicate`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setSelectedTheme(data);
      setThemeDetailOpen(true);
    },
  });
  
  // Filter themes based on search query
  const filteredThemes = themes?.filter(theme => {
    if (!theme) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (theme.name && theme.name.toLowerCase().includes(query)) ||
      (theme.description && theme.description.toLowerCase().includes(query)) ||
      (theme.category && theme.category.toLowerCase().includes(query))
    );
  }) || [];
  
  // Handle theme selection
  const handleSelectTheme = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
    setThemeDetailOpen(true);
    
    if (onThemeSelect) {
      onThemeSelect(theme);
    }
  }, [onThemeSelect]);
  
  // Apply selected theme
  const handleApplyTheme = useCallback(async (theme: Theme) => {
    try {
      await applyThemeMutation.mutateAsync(theme.id);
      
      // Set the theme in the context
      if (theme.tokens) {
        setTheme(theme.tokens);
      }
      
      // Show success message
      console.log('Theme applied successfully');
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [applyThemeMutation, setTheme]);
  
  // Set up edit mode for a theme
  const handleEditTheme = useCallback((theme: Theme) => {
    setIsEditMode(true);
    setCurrentEditingTheme(theme);
    setEditingThemeName(theme.name || '');
    setEditingThemeDesc(theme.description || '');
    setEditingThemeCategory(theme.category || '');
    setEditingThemeTokens(theme.tokens || {});
    setSelectedTab('create');
  }, []);
  
  // Create a new theme from scratch
  const handleCreateNewTheme = useCallback(() => {
    setIsEditMode(false);
    setCurrentEditingTheme(null);
    setEditingThemeName('New Theme');
    setEditingThemeDesc('');
    setEditingThemeCategory('custom');
    // Start with the current theme tokens or empty object
    setEditingThemeTokens(theme || {});
    setSelectedTab('create');
  }, [theme]);
  
  // Reset theme editor
  const resetEditor = useCallback(() => {
    setIsEditMode(false);
    setCurrentEditingTheme(null);
    setEditingThemeName('');
    setEditingThemeDesc('');
    setEditingThemeCategory('');
    setEditingThemeTokens({});
    setEditingColorKey(null);
    setEditingColorValue('#ffffff');
  }, []);
  
  // Save theme (create or update)
  const handleSaveTheme = useCallback(async () => {
    try {
      const themeData = {
        name: editingThemeName,
        description: editingThemeDesc,
        category: editingThemeCategory,
        tokens: editingThemeTokens,
        isPublic: false,
        // If this is coming from a user context, include the user ID
        creatorId: userId
      };
      
      if (isEditMode && currentEditingTheme) {
        // Update existing theme
        await updateThemeMutation.mutateAsync({
          id: currentEditingTheme.id,
          ...themeData
        });
        console.log('Theme updated successfully');
      } else {
        // Create new theme
        await createThemeMutation.mutateAsync(themeData);
        console.log('Theme created successfully');
      }
      
      // Switch back to browse tab
      setSelectedTab('browse');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [
    isEditMode, 
    currentEditingTheme, 
    editingThemeName, 
    editingThemeDesc, 
    editingThemeCategory, 
    editingThemeTokens, 
    userId, 
    updateThemeMutation, 
    createThemeMutation
  ]);
  
  // Handle color picker changes
  const handleColorChange = useCallback((newColor: string) => {
    setEditingColorValue(newColor);
    
    if (editingColorKey) {
      setEditingThemeTokens(prev => ({
        ...prev,
        [editingColorKey]: newColor
      }));
    }
  }, [editingColorKey]);
  
  // Open color picker for a specific token
  const handleEditColor = useCallback((key: string, value: string) => {
    setEditingColorKey(key);
    setEditingColorValue(value || '#ffffff');
  }, []);
  
  // Export theme to different formats
  const handleExportTheme = useCallback(() => {
    if (!selectedTheme) return;
    
    let exportContent = '';
    let filename = `${selectedTheme.name.replace(/\s+/g, '-').toLowerCase()}-theme`;
    let mimeType = '';
    
    if (exportFormat === 'json') {
      exportContent = JSON.stringify(selectedTheme, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else if (exportFormat === 'css') {
      exportContent = `:root {\n`;
      
      if (selectedTheme.tokens) {
        Object.entries(selectedTheme.tokens).forEach(([key, value]) => {
          if (typeof value === 'string') {
            exportContent += `  --${key}: ${value};\n`;
          }
        });
      }
      
      exportContent += `}\n`;
      filename += '.css';
      mimeType = 'text/css';
    }
    
    // Create a download link
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportDialog(false);
  }, [selectedTheme, exportFormat]);
  
  // Component for theme card
  const ThemeCard = useCallback(({ theme }: { theme: Theme }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="relative p-0 h-32 overflow-hidden">
        <div 
          className="absolute inset-0 flex flex-wrap p-2"
          style={{ 
            backgroundColor: theme.tokens?.backgroundColor || theme.tokens?.background || '#f0f0f0'
          }}
        >
          {theme.tokens && Object.entries(theme.tokens)
            .filter(([key]) => 
              key.includes('color') || 
              key.includes('primary') || 
              key.includes('secondary') || 
              key.includes('accent')
            )
            .slice(0, 9)
            .map(([key, value]) => (
              <div 
                key={key}
                className="w-1/3 h-1/3 flex items-center justify-center text-xs"
                style={{ 
                  backgroundColor: value as string, 
                  color: checkContrastRatio(value as string, '#ffffff') > 4.5 ? 'white' : 'black'
                }}
              />
            ))}
        </div>
        
        {theme.isPublic && (
          <Badge className="absolute top-2 right-2 bg-primary/90 hover:bg-primary">
            Public
          </Badge>
        )}
        
        {theme.category && (
          <Badge variant="outline" className="absolute bottom-2 left-2 bg-background/90">
            {theme.category}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base line-clamp-1">{theme.name}</CardTitle>
            {theme.description && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {theme.description}
              </CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSelectTheme(theme)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleApplyTheme(theme)}>
                <Palette className="mr-2 h-4 w-4" />
                Apply Theme
              </DropdownMenuItem>
              {userId && (
                <>
                  <DropdownMenuItem onClick={() => handleEditTheme(theme)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateThemeMutation.mutate(theme.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        {new Date(theme.updatedAt).toLocaleDateString()}
      </CardFooter>
    </Card>
  ), [handleSelectTheme, handleApplyTheme, handleEditTheme, duplicateThemeMutation, userId]);
  
  // Editor component for creating/editing themes
  const ThemeEditor = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Edit Theme' : 'Create New Theme'}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Modify this theme\'s properties and colors' 
              : 'Design a custom theme with your preferred colors and settings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">Theme Name</Label>
            <Input 
              id="theme-name" 
              value={editingThemeName} 
              onChange={(e) => setEditingThemeName(e.target.value)}
              placeholder="My Amazing Theme"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="theme-description">Description</Label>
            <Input 
              id="theme-description" 
              value={editingThemeDesc} 
              onChange={(e) => setEditingThemeDesc(e.target.value)}
              placeholder="A short description of your theme"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="theme-category">Category</Label>
            <select
              id="theme-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={editingThemeCategory}
              onChange={(e) => setEditingThemeCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="colorful">Colorful</option>
              <option value="monochrome">Monochrome</option>
              <option value="accessible">Accessible</option>
              <option value="professional">Professional</option>
              <option value="playful">Playful</option>
              <option value="minimalist">Minimalist</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <Label>Theme Colors</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const accessibleVariant = generateAccessibleVariant(editingThemeTokens);
                  setEditingThemeTokens({
                    ...editingThemeTokens,
                    ...accessibleVariant
                  });
                }}
              >
                Make Accessible
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {editingThemeTokens && Object.entries(editingThemeTokens).map(([key, value]) => {
                // Only show color-related tokens (those with hex or hsl values)
                if (typeof value !== 'string' || (!value.startsWith('#') && !value.startsWith('hsl') && !value.startsWith('rgb'))) {
                  return null;
                }
                
                return (
                  <div 
                    key={key} 
                    className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent/10 cursor-pointer"
                    onClick={() => handleEditColor(key, value as string)}
                  >
                    <div 
                      className="w-6 h-6 rounded-md border"
                      style={{ backgroundColor: value as string }}
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-sm truncate">{key}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {formatTokenValue(value as string)}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {editingColorKey && (
            <div className="mt-6 space-y-4 border p-4 rounded-md">
              <div className="flex justify-between items-center">
                <Label>Edit Color: {editingColorKey}</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingColorKey(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <HexColorPicker 
                  color={editingColorValue} 
                  onChange={handleColorChange}
                  style={{ width: '100%', maxWidth: '320px' }}
                />
                
                <div className="flex items-center space-x-2 w-full max-w-xs">
                  <Label htmlFor="color-hex" className="w-20">Hex Value</Label>
                  <HexColorInput 
                    id="color-hex"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                    color={editingColorValue} 
                    onChange={handleColorChange}
                    prefixed
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Contrast Check</AlertTitle>
                  <AlertDescription>
                    {checkContrastRatio(editingColorValue, '#ffffff') >= 4.5 ? (
                      <span className="text-green-600">Good contrast with white text</span>
                    ) : (
                      <span className="text-amber-600">Poor contrast with white text</span>
                    )}
                    <br />
                    {checkContrastRatio(editingColorValue, '#000000') >= 4.5 ? (
                      <span className="text-green-600">Good contrast with black text</span>
                    ) : (
                      <span className="text-amber-600">Poor contrast with black text</span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setSelectedTab('browse')}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTheme}
            disabled={!editingThemeName.trim() || createThemeMutation.isPending || updateThemeMutation.isPending}
          >
            {(createThemeMutation.isPending || updateThemeMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? 'Update Theme' : 'Create Theme'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Theme Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your theme will look in the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePreviewPanel 
            themeTokens={editingThemeTokens} 
            displayMode={mode}
          />
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  // Render theme details dialog
  const renderThemeDetails = () => {
    if (!selectedTheme) return null;
    
    return (
      <Dialog open={themeDetailOpen} onOpenChange={setThemeDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{selectedTheme.name}</DialogTitle>
              <div className="flex space-x-2">
                {selectedTheme.isPublic && (
                  <Badge>Public</Badge>
                )}
                {selectedTheme.category && (
                  <Badge variant="outline">{selectedTheme.category}</Badge>
                )}
              </div>
            </div>
            <DialogDescription>
              {selectedTheme.description || 'No description provided'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Theme Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemePreviewPanel 
                  themeTokens={selectedTheme.tokens || {}} 
                  displayMode={mode}
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                >
                  Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode
                </Button>
                <Button 
                  onClick={() => handleApplyTheme(selectedTheme)}
                  disabled={applyThemeMutation.isPending}
                >
                  {applyThemeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply Theme
                </Button>
              </CardFooter>
            </Card>
            
            {/* Theme Details */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium">Created</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedTheme.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Last Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedTheme.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Theme Color Tokens */}
                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Theme Colors</h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {selectedTheme.tokens && Object.entries(selectedTheme.tokens).map(([key, value]) => {
                        // Only show color-related tokens
                        if (typeof value !== 'string' || (!value.startsWith('#') && !value.startsWith('hsl') && !value.startsWith('rgb'))) {
                          return null;
                        }
                        
                        return (
                          <div 
                            key={key} 
                            className="flex items-center space-x-2 border rounded-md p-2"
                          >
                            <div 
                              className="w-6 h-6 rounded-md border"
                              style={{ backgroundColor: value as string }}
                            />
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-xs truncate">{key}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {formatTokenValue(value as string)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Analytics Card (if enabled and data available) */}
            {showAnalytics && themeAnalytics && !isLoadingAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle>Theme Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ThemeAnalyticsComponent analytics={themeAnalytics} />
                </CardContent>
              </Card>
            )}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex space-x-2">
              {userId && (
                <>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {selectedTheme.isPublic ? 'Make Private' : 'Share'}
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExportDialog(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              {userId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicateThemeMutation.mutate(selectedTheme.id)}
                  disabled={duplicateThemeMutation.isPending}
                >
                  {duplicateThemeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {userId && (
                <Button 
                  variant="outline"
                  onClick={() => handleEditTheme(selectedTheme)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              
              <Button 
                onClick={() => handleApplyTheme(selectedTheme)}
                disabled={applyThemeMutation.isPending}
              >
                {applyThemeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Apply Theme
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Delete confirmation dialog
  const renderDeleteConfirmation = () => {
    if (!selectedTheme) return null;
    
    return (
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTheme.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteThemeMutation.mutate(selectedTheme.id)}
              disabled={deleteThemeMutation.isPending}
            >
              {deleteThemeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Share dialog
  const renderShareDialog = () => {
    if (!selectedTheme) return null;
    
    return (
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTheme.isPublic ? 'Make Theme Private' : 'Share Theme'}</DialogTitle>
            <DialogDescription>
              {selectedTheme.isPublic 
                ? 'Making your theme private will prevent others from seeing and using it.'
                : 'Sharing your theme will make it visible to all users in the theme gallery.'}
            </DialogDescription>
          </DialogHeader>
          
          {!selectedTheme.isPublic && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sharing Information</AlertTitle>
                <AlertDescription>
                  When you share a theme, other users will be able to:
                  <ul className="list-disc pl-5 mt-2">
                    <li>View your theme details</li>
                    <li>Apply your theme to their interface</li>
                    <li>Duplicate and customize your theme</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedTheme.isPublic ? "secondary" : "default"}
              onClick={() => shareThemeMutation.mutate({ 
                themeId: selectedTheme.id, 
                isPublic: !selectedTheme.isPublic 
              })}
              disabled={shareThemeMutation.isPending}
            >
              {shareThemeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedTheme.isPublic ? 'Make Private' : 'Share Theme'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Export dialog
  const renderExportDialog = () => {
    if (!selectedTheme) return null;
    
    return (
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Theme</DialogTitle>
            <DialogDescription>
              Choose a format to export your theme
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex space-x-2">
                <Button
                  variant={exportFormat === 'json' ? "default" : "outline"}
                  onClick={() => setExportFormat('json')}
                  className="flex-1"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <Button
                  variant={exportFormat === 'css' ? "default" : "outline"}
                  onClick={() => setExportFormat('css')}
                  className="flex-1"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  CSS Variables
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Information</AlertTitle>
              <AlertDescription>
                {exportFormat === 'json' 
                  ? 'JSON format includes all theme metadata and can be imported back into the system.'
                  : 'CSS Variables format can be directly included in your stylesheets.'}
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportTheme}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Themes</TabsTrigger>
          <TabsTrigger value="create">
            {isEditMode ? 'Edit Theme' : 'Create Theme'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-6">
          {/* Theme Browser */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Gallery</CardTitle>
              <CardDescription>
                Browse and select from available themes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Search themes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sm:flex-1"
                />
                
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="colorful">Colorful</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="accessible">Accessible</option>
                  <option value="professional">Professional</option>
                  <option value="playful">Playful</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {/* Additional Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public-filter"
                    checked={showPublicOnly}
                    onCheckedChange={setShowPublicOnly}
                  />
                  <Label htmlFor="public-filter">Public themes only</Label>
                </div>
                
                {userId && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="my-themes-filter"
                      checked={showMineOnly}
                      onCheckedChange={setShowMineOnly}
                    />
                    <Label htmlFor="my-themes-filter">My themes only</Label>
                  </div>
                )}
              </div>
              
              {/* Create New Theme Button (if authenticated) */}
              {userId && (
                <div className="flex justify-end">
                  <Button onClick={handleCreateNewTheme}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Theme
                  </Button>
                </div>
              )}
              
              {/* Theme Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array(8).fill(0).map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-0">
                        <Skeleton className="h-32 w-full" />
                      </CardHeader>
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load themes. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : filteredThemes.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">No themes found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery 
                      ? `No themes match "${searchQuery}". Try a different search.` 
                      : 'No themes are available with the current filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filteredThemes.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Popular Themes Section */}
          {(popularThemes?.length || 0) > 0 && !showMineOnly && (
            <Card>
              <CardHeader>
                <CardTitle>Popular Themes</CardTitle>
                <CardDescription>
                  The most frequently used themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPopular ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {Array(4).fill(0).map((_, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="p-0">
                          <Skeleton className="h-32 w-full" />
                        </CardHeader>
                        <CardContent className="p-4">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {popularThemes?.map((theme) => (
                      <ThemeCard key={theme.id} theme={theme} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="create">
          {/* Theme Editor */}
          <ThemeEditor />
        </TabsContent>
      </Tabs>
      
      {/* Theme Detail Dialog */}
      {renderThemeDetails()}
      
      {/* Delete Confirmation Dialog */}
      {renderDeleteConfirmation()}
      
      {/* Share Dialog */}
      {renderShareDialog()}
      
      {/* Export Dialog */}
      {renderExportDialog()}
    </div>
  );
};

export default ThemeManager;