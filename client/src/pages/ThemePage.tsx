import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { useAuth } from '@/hooks/use-auth';
import { Theme } from '../../shared/schema';

import ThemeCard from '@/components/theme/ThemeCard';
import ThemeEditor from '@/components/theme/ThemeEditor';
import ThemeShowcase from '@/components/theme/ThemeShowcase';
import ThemeHistory from '@/components/theme/ThemeHistory';

import {
  Paintbrush,
  PlusCircle,
  Settings,
  History,
  ChevronLeft,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Lock,
  User,
  Eye,
  Palette,
  Grid,
  List,
  Sliders,
  SlidersHorizontal,
  Globe,
  Search,
  X,
  Check,
  Clock,
  ArrowLeft,
  RefreshCcw,
  Save,
  Image,
  FileImage,
  LucideIcon
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

const ThemePage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Theme context for managing the current theme
  const { 
    currentTheme, 
    setCurrentTheme,
    defaultTheme,
    resetToDefaultTheme,
    isLoading: isLoadingContext
  } = useTheme();

  // API hooks for fetching and managing themes
  const { 
    useGetThemes, 
    useDeleteTheme, 
    usePublishTheme,
    useUnpublishTheme,
    useRestoreThemeVersion,
  } = useThemeAPI();
  
  // Query to fetch all themes
  const {
    data: themes = [],
    isLoading: isLoadingThemes,
    isError: isThemesError,
    error: themesError,
  } = useGetThemes();

  // Mutations for theme actions
  const deleteThemeMutation = useDeleteTheme();
  const publishThemeMutation = usePublishTheme();
  const unpublishThemeMutation = useUnpublishTheme();
  const restoreThemeMutation = useRestoreThemeVersion();
  
  // State for managing UI
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Check if the user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Helper to check if user can edit a theme
  const canEditTheme = (theme: Theme): boolean => {
    if (!user) return false;
    return isAdmin || theme.userId === user.id;
  };
  
  // Refresh theme if needed after actions
  const handleThemeUpdate = (updatedTheme: Theme) => {
    if (currentTheme?.id === updatedTheme.id) {
      setCurrentTheme(updatedTheme);
    }
  };
  
  // Handle theme deletion
  const handleDeleteTheme = async () => {
    if (!selectedTheme) return;
    
    try {
      await deleteThemeMutation.mutateAsync(selectedTheme.id);
      
      toast({
        title: "Theme deleted",
        description: "The theme has been successfully deleted",
      });
      
      // If the deleted theme was the current one, reset to default
      if (currentTheme?.id === selectedTheme.id) {
        resetToDefaultTheme();
      }
      
      // Reset state
      setSelectedTheme(null);
      setShowDeleteDialog(false);
      setActiveTab('browse');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete theme",
        variant: "destructive",
      });
    }
  };
  
  // Handle theme publishing
  const handlePublishTheme = async (theme: Theme) => {
    try {
      const updatedTheme = await publishThemeMutation.mutateAsync(theme.id);
      handleThemeUpdate(updatedTheme);
      
      toast({
        title: "Theme published",
        description: "The theme is now publicly available",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish theme",
        variant: "destructive",
      });
    }
  };
  
  // Handle theme unpublishing
  const handleUnpublishTheme = async (theme: Theme) => {
    try {
      const updatedTheme = await unpublishThemeMutation.mutateAsync(theme.id);
      handleThemeUpdate(updatedTheme);
      
      toast({
        title: "Theme unpublished",
        description: "The theme is now private",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unpublish theme",
        variant: "destructive",
      });
    }
  };
  
  // Handle theme selection
  const handleSelectTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    
    toast({
      title: "Theme applied",
      description: `"${theme.name}" is now active`,
    });
  };
  
  // Handle theme editor actions
  const handleCreateTheme = () => {
    setIsCreatingTheme(true);
    setSelectedTheme(null);
    setActiveTab('edit');
  };
  
  const handleEditTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsEditingTheme(true);
    setActiveTab('edit');
  };
  
  const handleSaveTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsCreatingTheme(false);
    setIsEditingTheme(false);
    setActiveTab('browse');
  };
  
  const handleCancelEdit = () => {
    setIsCreatingTheme(false);
    setIsEditingTheme(false);
    setActiveTab('browse');
  };
  
  // Handle theme history
  const handleViewHistory = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsViewingHistory(true);
    setActiveTab('history');
  };
  
  const handleCloseHistory = () => {
    setIsViewingHistory(false);
    setActiveTab('browse');
  };
  
  const handleRestoreVersion = async (historyId: number) => {
    if (!selectedTheme) return;
    
    try {
      const updatedTheme = await restoreThemeMutation.mutateAsync({
        themeId: selectedTheme.id,
        historyId,
      });
      
      handleThemeUpdate(updatedTheme);
      
      toast({
        title: "Theme restored",
        description: "The theme has been restored to a previous version",
      });
      
      // Close history view
      setIsViewingHistory(false);
      setActiveTab('browse');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore theme",
        variant: "destructive",
      });
    }
  };
  
  // Helper to categorize themes
  const systemThemes = themes.filter(t => !t.userId);
  const userThemes = themes.filter(t => t.userId === user?.id);
  const otherUserThemes = themes.filter(t => t.userId && t.userId !== user?.id);
  
  // Loading and error states
  const isLoading = isLoadingContext || isLoadingThemes;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (isThemesError) {
    return (
      <Card className="border-destructive/50">
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
            {themesError instanceof Error ? themesError.message : "Unknown error occurred"}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-10">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Themes</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Customize the appearance of the application
            </p>
          </div>
          
          {(isAdmin || user) && (
            <Button 
              onClick={handleCreateTheme}
              className="self-start"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Theme
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="browse">Browse Themes</TabsTrigger>
            {isCreatingTheme && (
              <TabsTrigger value="edit">Create Theme</TabsTrigger>
            )}
            {isEditingTheme && selectedTheme && (
              <TabsTrigger value="edit">Edit Theme</TabsTrigger>
            )}
            {isViewingHistory && selectedTheme && (
              <TabsTrigger value="history">Theme History</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="browse" className="space-y-8">
            {/* Currently Active Theme */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                Current Theme
              </h2>
              
              {currentTheme ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <ThemeCard
                    theme={currentTheme}
                    isActive={true}
                    onEdit={canEditTheme(currentTheme) ? () => handleEditTheme(currentTheme) : undefined}
                    onDelete={canEditTheme(currentTheme) ? () => {
                      setSelectedTheme(currentTheme);
                      setShowDeleteDialog(true);
                    } : undefined}
                    onPublish={
                      canEditTheme(currentTheme) && !currentTheme.isPublic 
                        ? () => handlePublishTheme(currentTheme) 
                        : undefined
                    }
                    onUnpublish={
                      canEditTheme(currentTheme) && currentTheme.isPublic 
                        ? () => handleUnpublishTheme(currentTheme) 
                        : undefined
                    }
                    onHistory={canEditTheme(currentTheme) ? () => handleViewHistory(currentTheme) : undefined}
                    canEdit={canEditTheme(currentTheme)}
                    canDelete={canEditTheme(currentTheme)}
                    canPublish={canEditTheme(currentTheme)}
                  />
                </div>
              ) : (
                <Card className="border-dashed border-muted">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Paintbrush className="h-8 w-8 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center max-w-md">
                      No theme is currently applied. Select one from the available themes below.
                    </p>
                    {defaultTheme && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => handleSelectTheme(defaultTheme)}
                      >
                        Apply Default Theme
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* System Themes */}
            {systemThemes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  System Themes
                </h2>
                <ThemeShowcase
                  themes={systemThemes}
                  currentTheme={currentTheme || undefined}
                  onSelectTheme={handleSelectTheme}
                  isFilterable={true}
                  isSearchable={true}
                />
              </div>
            )}
            
            {/* User Themes */}
            {user && userThemes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your Themes
                </h2>
                <ThemeShowcase
                  themes={userThemes}
                  currentTheme={currentTheme || undefined}
                  onSelectTheme={handleSelectTheme}
                  isFilterable={true}
                  isSearchable={true}
                />
              </div>
            )}
            
            {/* Other User Themes */}
            {otherUserThemes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Community Themes
                </h2>
                <ThemeShowcase
                  themes={otherUserThemes}
                  currentTheme={currentTheme || undefined}
                  onSelectTheme={handleSelectTheme}
                  isFilterable={true}
                  isSearchable={true}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="edit">
            {isCreatingTheme && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mb-4"
                    onClick={handleCancelEdit}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Create New Theme
                </h2>
                <ThemeEditor
                  isNew={true}
                  onSave={handleSaveTheme}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}
            
            {isEditingTheme && selectedTheme && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mb-4"
                    onClick={handleCancelEdit}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Edit Theme: {selectedTheme.name}
                </h2>
                <ThemeEditor
                  theme={selectedTheme}
                  onSave={handleSaveTheme}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {isViewingHistory && selectedTheme && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mb-4"
                    onClick={handleCloseHistory}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Theme History: {selectedTheme.name}
                </h2>
                <ThemeHistory
                  themeId={selectedTheme.id}
                  onRestoreVersion={handleRestoreVersion}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Confirmation Dialog for Theme Deletion */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this theme? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTheme && (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: selectedTheme.primaryColor }}
                />
                <div>
                  <p className="font-medium">{selectedTheme.name}</p>
                  {selectedTheme.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {selectedTheme.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTheme}
              disabled={deleteThemeMutation.isPending}
            >
              {deleteThemeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Theme"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThemePage;