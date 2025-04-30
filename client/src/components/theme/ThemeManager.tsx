/**
 * Theme Manager Component
 * 
 * A comprehensive component for managing themes.
 * It provides interfaces for listing, viewing, creating, editing, and applying themes.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeViewer } from './ThemeViewer';
import { ThemeEditor } from './ThemeEditor';
import { ThemeTokens } from '@shared/theme/tokens';
import { useTheme } from '@shared/theme/ThemeContext';

interface ThemeManagerProps {
  userId?: number; // Optional: filter themes by user
  showMyThemesOnly?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApply?: boolean;
}

export function ThemeManager({
  userId,
  showMyThemesOnly = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canApply = true,
}: ThemeManagerProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTokens } = useTheme();

  // Fetch themes
  const { data: themes, isLoading } = useQuery({
    queryKey: ['/api/themes', { userId: showMyThemesOnly ? userId : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (showMyThemesOnly && userId) {
        params.set('userId', userId.toString());
      }
      return apiRequest(`/api/themes?${params.toString()}`);
    },
  });

  // Fetch single theme for viewing/editing
  const { data: selectedTheme, isLoading: isLoadingSelectedTheme } = useQuery({
    queryKey: ['/api/themes', selectedThemeId],
    enabled: !!selectedThemeId,
  });

  // Search themes
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/themes/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: async () => {
      return apiRequest(`/api/themes/search?query=${encodeURIComponent(searchQuery)}`);
    },
  });

  // Delete a theme
  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: number) => {
      return apiRequest(`/api/themes/${themeId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Theme deleted',
        description: 'The theme has been permanently deleted.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting theme',
        description: 'There was a problem deleting the theme. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting theme:', error);
    }
  });

  // Apply a theme to the current session
  const handleApplyTheme = (tokens: ThemeTokens) => {
    try {
      // Update the theme context with the new tokens
      setTokens(tokens);
      
      toast({
        title: 'Theme applied',
        description: 'The theme has been applied to your interface.',
      });
      
      // Close the dialog if open
      setIsViewDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error applying theme',
        description: 'There was a problem applying the theme. Please try again.',
        variant: 'destructive',
      });
      console.error('Error applying theme:', error);
    }
  };

  // Handle theme creation
  const handleThemeCreated = (result: any) => {
    toast({
      title: 'Theme created',
      description: 'Your new theme has been created successfully.',
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
    setIsCreateDialogOpen(false);
  };

  // Handle theme update
  const handleThemeUpdated = (result: any) => {
    toast({
      title: 'Theme updated',
      description: 'Your theme has been updated successfully.',
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
    queryClient.invalidateQueries({ queryKey: ['/api/themes', selectedThemeId] });
    setIsEditDialogOpen(false);
  };

  // Filter themes based on search query
  const filteredThemes = searchQuery.length > 2
    ? searchResults || []
    : themes || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Theme Manager</CardTitle>
              <CardDescription>
                Browse, create, and manage themes for your application
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Theme
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="browse">Browse Themes</TabsTrigger>
              {showMyThemesOnly && (
                <TabsTrigger value="my-themes">My Themes</TabsTrigger>
              )}
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center mb-6">
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <TabsContent value="browse" className="space-y-4">
              <ThemeList 
                themes={filteredThemes}
                isLoading={isLoading || isSearching}
                onView={(id) => {
                  setSelectedThemeId(id);
                  setIsViewDialogOpen(true);
                }}
                onEdit={canEdit ? (id) => {
                  setSelectedThemeId(id);
                  setIsEditDialogOpen(true);
                } : undefined}
                onDelete={canDelete ? (id) => {
                  setSelectedThemeId(id);
                  setIsDeleteDialogOpen(true);
                } : undefined}
              />
            </TabsContent>
            
            <TabsContent value="my-themes" className="space-y-4">
              <ThemeList 
                themes={filteredThemes.filter(theme => theme.userId === userId)}
                isLoading={isLoading || isSearching}
                onView={(id) => {
                  setSelectedThemeId(id);
                  setIsViewDialogOpen(true);
                }}
                onEdit={canEdit ? (id) => {
                  setSelectedThemeId(id);
                  setIsEditDialogOpen(true);
                } : undefined}
                onDelete={canDelete ? (id) => {
                  setSelectedThemeId(id);
                  setIsDeleteDialogOpen(true);
                } : undefined}
              />
            </TabsContent>
            
            <TabsContent value="featured" className="space-y-4">
              <ThemeList 
                themes={filteredThemes.filter(theme => theme.featured)}
                isLoading={isLoading || isSearching}
                onView={(id) => {
                  setSelectedThemeId(id);
                  setIsViewDialogOpen(true);
                }}
                onEdit={canEdit ? (id) => {
                  setSelectedThemeId(id);
                  setIsEditDialogOpen(true);
                } : undefined}
                onDelete={canDelete ? (id) => {
                  setSelectedThemeId(id);
                  setIsDeleteDialogOpen(true);
                } : undefined}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Theme Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
            <DialogDescription>
              Design a new theme for your application
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto py-2">
            <ThemeEditor
              onSave={handleThemeCreated}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Theme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
            <DialogDescription>
              Modify this theme's properties and design
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {selectedThemeId && (
              <ThemeEditor
                themeId={selectedThemeId}
                onSave={handleThemeUpdated}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Theme Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Theme Details</DialogTitle>
            <DialogDescription>
              View the details and preview of this theme
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {selectedThemeId && (
              <ThemeViewer
                themeId={selectedThemeId}
                onApply={canApply ? handleApplyTheme : undefined}
                onExport={(tokens) => {
                  // Export theme as JSON
                  const dataStr = "data:text/json;charset=utf-8," + 
                    encodeURIComponent(JSON.stringify(tokens, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `theme-${selectedThemeId}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this theme? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
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
              {deleteThemeMutation.isPending ? 'Deleting...' : 'Delete Theme'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Theme List Component
function ThemeList({ 
  themes, 
  isLoading, 
  onView,
  onEdit,
  onDelete
}: { 
  themes: any[]; 
  isLoading: boolean;
  onView: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  if (isLoading) {
    return <ThemeListSkeleton />;
  }

  if (!themes || themes.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No themes found. Create a new theme to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Theme Name</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {themes.map((theme) => (
          <TableRow key={theme.id}>
            <TableCell className="font-medium">{theme.name}</TableCell>
            <TableCell>{theme.userName || `User ${theme.userId}`}</TableCell>
            <TableCell>{theme.latestVersion || '1.0.0'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {theme.tags && theme.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {theme.updatedAt 
                ? new Date(theme.updatedAt).toLocaleDateString() 
                : 'Unknown'}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onView(theme.id)}>
                    View
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(theme.id)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(theme.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Theme List Loading Skeleton
function ThemeListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}