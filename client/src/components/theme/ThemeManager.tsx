/**
 * Theme Manager Component
 * 
 * This component provides a comprehensive interface for managing themes.
 * It includes theme browsing, creation, editing, and administration.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@shared/theme/ThemeContext';
import { ThemeTokens } from '@shared/theme/tokens';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AIThemeGenerator } from './AIThemeGenerator';
import { ThemeAnalytics } from './ThemeAnalytics';
import { ThemeTypeScriptIntegration } from './ThemeTypeScriptIntegration';
import { ThemeViewer } from './ThemeViewer';
import { Check, ChevronDown, Download, Edit, Loader2, MoreHorizontal, Plus, Share, Trash, Upload } from 'lucide-react';

interface ThemeManagerProps {
  userId?: number;
  isAdmin?: boolean;
}

export function ThemeManager({ userId, isAdmin = false }: ThemeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTokens } = useTheme();
  
  // State
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  
  // Fetch themes
  const { data: themes, isLoading: isLoadingThemes } = useQuery({
    queryKey: ['/api/themes', { userId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      
      return apiRequest(`/api/themes?${params.toString()}`);
    },
  });
  
  // Apply theme mutation
  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}/tokens`);
    },
    onSuccess: (data) => {
      setTokens(data as ThemeTokens);
      
      toast({
        title: 'Theme applied',
        description: 'The selected theme has been applied to the application.',
      });
    },
    onError: (error) => {
      console.error('Error applying theme:', error);
      toast({
        title: 'Error applying theme',
        description: 'There was a problem applying the theme. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Theme deleted',
        description: 'The selected theme has been permanently deleted.',
      });
      
      // Close the dialog and refresh themes
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
    },
    onError: (error) => {
      console.error('Error deleting theme:', error);
      toast({
        title: 'Error deleting theme',
        description: 'There was a problem deleting the theme. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Import theme mutation
  const importThemeMutation = useMutation({
    mutationFn: async (themeData: string) => {
      try {
        const parsedTheme = JSON.parse(themeData);
        return apiRequest('/api/themes/import', {
          method: 'POST',
          data: { theme: parsedTheme },
        });
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Theme imported',
        description: 'The theme has been successfully imported.',
      });
      
      // Close the dialog and refresh themes
      setIsImportDialogOpen(false);
      setImportData('');
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
    },
    onError: (error) => {
      console.error('Error importing theme:', error);
      toast({
        title: 'Error importing theme',
        description: `There was a problem importing the theme: ${(error as Error).message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Export theme function
  const handleExportTheme = async (themeId: number) => {
    try {
      const themeData = await apiRequest(`/api/themes/${themeId}/export`);
      
      // Create a blob and download it
      const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-${themeId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Theme exported',
        description: 'The theme has been successfully exported.',
      });
    } catch (error) {
      console.error('Error exporting theme:', error);
      toast({
        title: 'Error exporting theme',
        description: 'There was a problem exporting the theme.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle theme delete click
  const handleDeleteClick = (themeId: number) => {
    setSelectedThemeId(themeId);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle theme application
  const handleApplyTheme = (themeId: number) => {
    applyThemeMutation.mutate(themeId);
  };
  
  // Handle theme creation from AI generator
  const handleSaveAITheme = (tokens: ThemeTokens, metadata: any) => {
    // Save the generated theme to the server
    apiRequest('/api/themes', {
      method: 'POST',
      data: {
        name: metadata.name,
        description: metadata.description || metadata.prompt,
        tokens,
        isPublic: true,
      },
    })
      .then(() => {
        toast({
          title: 'Theme saved',
          description: 'Your AI-generated theme has been saved to your library.',
        });
        
        // Refresh themes
        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
        
        // Switch to browse tab
        setActiveTab('browse');
      })
      .catch((error) => {
        console.error('Error saving AI theme:', error);
        toast({
          title: 'Error saving theme',
          description: 'There was a problem saving your AI-generated theme.',
          variant: 'destructive',
        });
      });
  };
  
  // Handle import function
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    importThemeMutation.mutate(importData);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold">Theme Management</h2>
            <p className="text-muted-foreground">
              Browse, create, and manage themes for your application
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="developer">Developer</TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search themes..."
                className="max-w-xs"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <span>Filter</span> <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>My Themes</DropdownMenuItem>
                  <DropdownMenuItem>Public Themes</DropdownMenuItem>
                  <DropdownMenuItem>Private Themes</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Light Themes</DropdownMenuItem>
                  <DropdownMenuItem>Dark Themes</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                onClick={() => setActiveTab('create')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Theme
              </Button>
            </div>
          </div>
          
          {isLoadingThemes ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : themes?.length ? (
            <Card>
              <Table>
                <TableCaption>
                  All available themes
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {themes.map((theme: any) => (
                    <TableRow key={theme.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div 
                            className="h-8 w-8 rounded-full border"
                            style={{ 
                              background: `linear-gradient(135deg, ${theme.primaryColor || '#888'} 0%, ${theme.accentColor || '#eee'} 100%)` 
                            }}
                          />
                          <div className="flex flex-col">
                            <span>{theme.name}</span>
                            {theme.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-xs">
                                {theme.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(theme.createdAt)}</TableCell>
                      <TableCell>
                        {theme.isPublic ? (
                          <Badge>Public</Badge>
                        ) : (
                          <Badge variant="outline">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApplyTheme(theme.id)}
                            disabled={applyThemeMutation.isPending && applyThemeMutation.variables === theme.id}
                          >
                            {applyThemeMutation.isPending && applyThemeMutation.variables === theme.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Apply
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleExportTheme(theme.id)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" /> Export
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                              >
                                <Share className="h-4 w-4" /> Share
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(theme.id)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <div className="h-12 w-12 rounded-full border-4 border-dashed border-muted-foreground flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <CardTitle className="mb-2">No themes found</CardTitle>
              <CardDescription className="max-w-md mx-auto mb-6">
                You haven't created any themes yet. Create your first theme to customize the appearance of your application.
              </CardDescription>
              <Button
                onClick={() => setActiveTab('create')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Theme
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="create">
          <AIThemeGenerator
            onSaveTheme={handleSaveAITheme}
          />
        </TabsContent>
        
        <TabsContent value="analytics">
          <ThemeAnalytics
            themeId={selectedThemeId || undefined}
            userId={userId}
            isAdmin={isAdmin}
          />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="developer">
            <ThemeTypeScriptIntegration />
          </TabsContent>
        )}
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this theme? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedThemeId && deleteThemeMutation.mutate(selectedThemeId)}
              disabled={deleteThemeMutation.isPending}
            >
              {deleteThemeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Theme</DialogTitle>
            <DialogDescription>
              Paste the JSON data of the theme you want to import.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport}>
            <div className="space-y-4 py-4">
              <textarea
                className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                placeholder='{"name": "My Theme", "tokens": {...}}'
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={importThemeMutation.isPending || !importData.trim()}
              >
                {importThemeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}