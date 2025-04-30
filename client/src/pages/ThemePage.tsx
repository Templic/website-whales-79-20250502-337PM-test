import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { useToast } from '@/hooks/use-toast';
import type { Theme } from '../../shared/schema';

// UI Components
import ThemeCard from '@/components/theme/ThemeCard';
import ThemeEditor from '@/components/theme/ThemeEditor';
import ThemeShowcase from '@/components/theme/ThemeShowcase';
import ThemeHistory from '@/components/theme/ThemeHistory';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Search, Filter, Sliders } from 'lucide-react';

const ThemePage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { 
    currentTheme, 
    setTheme, 
    publicThemes,
    userThemes,
    isLoading,
    refreshThemes
  } = useTheme();

  // Get theme API hooks
  const {
    useThemeStats,
    useThemeTags,
    useThemeCategories,
    useCreateTheme,
    useDeleteTheme,
    useCloneTheme,
    useUpdateTheme,
    usePublishTheme,
    useUnpublishTheme
  } = useThemeAPI();

  // Theme statistics
  const { data: themeStats, isLoading: statsLoading } = useThemeStats();
  
  // Theme metadata for filtering
  const { data: themeTags, isLoading: tagsLoading } = useThemeTags();
  const { data: themeCategories, isLoading: categoriesLoading } = useThemeCategories();

  // State for the active tab
  const [activeTab, setActiveTab] = useState('gallery');
  
  // State to check if we're in admin mode
  const [isAdminMode, setIsAdminMode] = useState(
    location.includes('/admin/themes')
  );

  // States for theme actions
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Theme mutations
  const updateThemeMutation = useUpdateTheme();
  const deleteThemeMutation = useDeleteTheme();
  const createThemeMutation = useCreateTheme();
  const cloneThemeMutation = useCloneTheme();
  const publishThemeMutation = usePublishTheme();
  const unpublishThemeMutation = useUnpublishTheme();

  // Handler for creating a new theme
  const handleCreateTheme = () => {
    setEditingTheme({
      id: 0, // Will be assigned by server
      name: 'New Theme',
      description: 'My custom theme',
      isPublic: false,
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '4px',
      tokens: {},
      tags: ['custom'],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: null
    });
    setActiveTab('editor');
  };

  // Handler for editing an existing theme
  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setActiveTab('editor');
  };

  // Handler for saving theme changes
  const handleSaveTheme = async (theme: Theme) => {
    try {
      if (theme.id === 0) {
        // New theme
        await createThemeMutation.mutateAsync({
          name: theme.name,
          description: theme.description,
          isPublic: theme.isPublic,
          primaryColor: theme.primaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          fontFamily: theme.fontFamily,
          borderRadius: theme.borderRadius,
          tokens: theme.tokens,
          tags: theme.tags
        });
        toast({
          title: 'Theme Created',
          description: `The theme "${theme.name}" has been created successfully.`,
        });
      } else {
        // Update existing theme
        await updateThemeMutation.mutateAsync(theme);
        toast({
          title: 'Theme Updated',
          description: `The theme "${theme.name}" has been updated successfully.`,
        });
      }
      
      // Refresh themes and exit edit mode
      refreshThemes();
      setEditingTheme(null);
      setActiveTab('gallery');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Handler for cloning a theme
  const handleCloneTheme = async (theme: Theme) => {
    try {
      await cloneThemeMutation.mutateAsync({
        id: theme.id,
        name: `Copy of ${theme.name}`,
      });
      
      toast({
        title: 'Theme Cloned',
        description: `A copy of "${theme.name}" has been created.`,
      });
      
      refreshThemes();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to clone theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Handler for deleting a theme
  const handleDeleteTheme = async (theme: Theme) => {
    if (!confirm(`Are you sure you want to delete "${theme.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteThemeMutation.mutateAsync(theme.id);
      
      toast({
        title: 'Theme Deleted',
        description: `The theme "${theme.name}" has been deleted.`,
      });
      
      refreshThemes();
      
      // If we were editing this theme, exit edit mode
      if (editingTheme?.id === theme.id) {
        setEditingTheme(null);
        setActiveTab('gallery');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Handler for publishing a theme
  const handlePublishTheme = async (theme: Theme) => {
    try {
      await publishThemeMutation.mutateAsync(theme.id);
      
      toast({
        title: 'Theme Published',
        description: `The theme "${theme.name}" is now public.`,
      });
      
      refreshThemes();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to publish theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Handler for unpublishing a theme
  const handleUnpublishTheme = async (theme: Theme) => {
    try {
      await unpublishThemeMutation.mutateAsync(theme.id);
      
      toast({
        title: 'Theme Unpublished',
        description: `The theme "${theme.name}" is now private.`,
      });
      
      refreshThemes();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to unpublish theme: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  // Filter themes based on search query and category
  const filteredThemes = [...publicThemes, ...userThemes].filter((theme) => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (theme.description && theme.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by category
    const matchesCategory = 
      filterCategory === 'all' || 
      (theme.tags && theme.tags.includes(filterCategory));
    
    return matchesSearch && matchesCategory;
  });
  
  // Remove duplicates (might be in both public and user themes)
  const uniqueThemes = filteredThemes.filter(
    (theme, index, self) => index === self.findIndex((t) => t.id === theme.id)
  );
  
  // Sort themes based on sort order
  const sortedThemes = [...uniqueThemes].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === 'updated') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortOrder === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-xl">Loading themes...</span>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdminMode ? 'Theme Management' : 'Theme Gallery'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminMode 
              ? 'Create, edit, and manage themes for your application.' 
              : 'Browse and apply themes to customize your experience.'}
          </p>
        </div>
        
        {isAdminMode && (
          <Button 
            className="mt-4 md:mt-0" 
            onClick={handleCreateTheme}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Theme
          </Button>
        )}
      </div>
      
      <Tabs 
        defaultValue="gallery" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          {isAdminMode && (
            <TabsTrigger value="editor" disabled={!editingTheme}>
              {editingTheme ? 'Editor' : 'Create New'}
            </TabsTrigger>
          )}
          <TabsTrigger value="showcase">Showcase</TabsTrigger>
        </TabsList>
        
        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          {/* Filter and search controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                className="pl-10"
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-row gap-2">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {!categoriesLoading && themeCategories && themeCategories.map((category: any) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={sortOrder}
                onValueChange={setSortOrder}
              >
                <SelectTrigger className="w-[180px]">
                  <Sliders className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Stats card */}
          {!statsLoading && themeStats && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Theme Statistics</CardTitle>
                <CardDescription>Overview of theme usage and popularity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-md p-3">
                    <span className="text-muted-foreground text-sm">Total Themes</span>
                    <p className="text-2xl font-bold">{themeStats.totalThemes}</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <span className="text-muted-foreground text-sm">Public Themes</span>
                    <p className="text-2xl font-bold">{themeStats.publicThemes}</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <span className="text-muted-foreground text-sm">Recent Usage</span>
                    <p className="text-2xl font-bold">{themeStats.recentUsage}</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <span className="text-muted-foreground text-sm">Private Themes</span>
                    <p className="text-2xl font-bold">{themeStats.privateThemes}</p>
                  </div>
                </div>
                
                {themeStats.topThemes && themeStats.topThemes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Top Themes</h4>
                    <div className="space-y-2">
                      {themeStats.topThemes.map((theme: any) => (
                        <div key={theme.id} className="flex justify-between items-center">
                          <span>{theme.name}</span>
                          <span className="text-muted-foreground">{theme.count} uses</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Themes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isAdmin={isAdminMode}
                isCurrentTheme={currentTheme.id === theme.id}
                onSelect={() => setTheme(theme)}
                onEdit={() => handleEditTheme(theme)}
                onClone={() => handleCloneTheme(theme)}
                onDelete={() => handleDeleteTheme(theme)}
                onPublish={() => handlePublishTheme(theme)}
                onUnpublish={() => handleUnpublishTheme(theme)}
              />
            ))}
            
            {sortedThemes.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-xl font-medium">No themes found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || filterCategory !== 'all' 
                    ? 'Try changing your search or filters' 
                    : 'There are no themes available yet'}
                </p>
                
                {isAdminMode && (
                  <Button 
                    className="mt-4" 
                    onClick={handleCreateTheme}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Theme
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Theme Editor Tab */}
        {isAdminMode && (
          <TabsContent value="editor" className="space-y-6">
            {editingTheme ? (
              <ThemeEditor
                theme={editingTheme}
                onSave={handleSaveTheme}
                onCancel={() => {
                  setEditingTheme(null);
                  setActiveTab('gallery');
                }}
              />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium">No theme selected for editing</h3>
                <p className="text-muted-foreground mt-1">
                  Select a theme to edit or create a new one
                </p>
                
                <Button 
                  className="mt-4" 
                  onClick={handleCreateTheme}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create New Theme
                </Button>
              </div>
            )}
          </TabsContent>
        )}
        
        {/* Theme Showcase Tab */}
        <TabsContent value="showcase" className="space-y-6">
          <ThemeShowcase 
            themes={sortedThemes}
            currentTheme={currentTheme}
            onSelect={(theme) => setTheme(theme)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThemePage;