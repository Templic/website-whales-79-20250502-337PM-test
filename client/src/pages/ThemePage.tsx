import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
  Plus,
  Trash,
  History,
  Sparkles,
  Save,
  ChevronLeft,
  Loader2,
  AlertTriangle
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

interface DeleteConfirmationProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  theme,
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Theme</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the theme "{theme.name}"?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AIGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const AIGenerationDialog: React.FC<AIGenerationDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Theme with AI</DialogTitle>
          <DialogDescription>
            Provide a description of the theme you want to generate.
            Our AI will create a unique theme based on your prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A dark theme with purple accents inspired by a cosmic night sky..."
            className="w-full h-32 p-2 border rounded-md"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onGenerate(prompt)}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ThemePage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentTheme, setCurrentTheme } = useTheme();
  
  // Define states for UI management
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [viewingHistoryForTheme, setViewingHistoryForTheme] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState<boolean>(false);
  const [generatingTheme, setGeneratingTheme] = useState<boolean>(false);
  
  // Get API hooks
  const {
    useGetThemes,
    useDeleteTheme,
    useGenerateTheme,
    usePublishTheme,
    useUnpublishTheme,
    useRestoreThemeVersion
  } = useThemeAPI();
  
  // Query for themes
  const {
    data: themes = [],
    isLoading,
    isError,
    error,
  } = useGetThemes();
  
  // Mutations
  const deleteThemeMutation = useDeleteTheme();
  const generateThemeMutation = useGenerateTheme();
  const publishThemeMutation = usePublishTheme();
  const unpublishThemeMutation = useUnpublishTheme();
  const restoreVersionMutation = useRestoreThemeVersion();
  
  // Get the selected theme object from ID
  const selectedTheme = themes.find((theme: Theme) => theme.id === selectedThemeId);
  
  // Check admin/super_admin status
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Create empty theme object for new theme
  const emptyTheme: Theme = {
    id: 0,
    name: '',
    description: '',
    userId: user?.id,
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    borderRadius: '0.5rem',
    isPublic: false,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Handler functions
  const handleSaveTheme = async (theme: Theme) => {
    setEditingTheme(null);
    setActiveTab('gallery');
    
    toast({
      title: 'Theme Saved',
      description: `The theme "${theme.name}" has been saved successfully.`,
    });
  };
  
  const handleDeleteTheme = (theme: Theme) => {
    setThemeToDelete(theme);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteTheme = () => {
    if (!themeToDelete) return;
    
    deleteThemeMutation.mutate(themeToDelete.id, {
      onSuccess: () => {
        toast({
          title: 'Theme Deleted',
          description: `The theme "${themeToDelete.name}" has been deleted.`,
        });
        
        setDeleteDialogOpen(false);
        setThemeToDelete(null);
        
        // If the deleted theme was selected, unselect it
        if (selectedThemeId === themeToDelete.id) {
          setSelectedThemeId(null);
        }
        
        // If the current theme was deleted, set to default
        if (currentTheme?.id === themeToDelete.id) {
          // Find a default theme
          const defaultTheme = themes.find((t: Theme) => t.isPublic && !t.userId) || themes[0];
          if (defaultTheme) {
            setCurrentTheme(defaultTheme);
          }
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to delete theme: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleCloneTheme = (theme: Theme) => {
    // Create a copy of the theme for editing
    setEditingTheme({
      ...theme,
      id: 0, // Set ID to 0 to indicate it's a new theme
      name: `Copy of ${theme.name}`,
      userId: user?.id, // Assign to current user
      isPublic: false, // Set to private by default
    });
    setActiveTab('editor');
  };
  
  const handlePublishTheme = (theme: Theme) => {
    publishThemeMutation.mutate(theme.id, {
      onSuccess: () => {
        toast({
          title: 'Theme Published',
          description: `The theme "${theme.name}" is now available to all users.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to publish theme: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleUnpublishTheme = (theme: Theme) => {
    unpublishThemeMutation.mutate(theme.id, {
      onSuccess: () => {
        toast({
          title: 'Theme Unpublished',
          description: `The theme "${theme.name}" is now private.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to unpublish theme: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleViewHistory = (theme: Theme) => {
    setViewingHistoryForTheme(theme.id);
    setActiveTab('history');
  };
  
  const handleRestoreVersion = (historyId: number) => {
    if (!viewingHistoryForTheme) return;
    
    restoreVersionMutation.mutate(
      { themeId: viewingHistoryForTheme, historyId },
      {
        onSuccess: () => {
          toast({
            title: 'Version Restored',
            description: 'The theme has been restored to the selected version.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to restore version: ${error.message}`,
            variant: 'destructive',
          });
        }
      }
    );
  };
  
  const handleAIGenerate = (prompt: string) => {
    setGeneratingTheme(true);
    
    generateThemeMutation.mutate(prompt, {
      onSuccess: (newTheme) => {
        setGeneratingTheme(false);
        setAiDialogOpen(false);
        
        toast({
          title: 'Theme Generated',
          description: `A new theme "${newTheme.name}" has been created based on your prompt.`,
        });
        
        // Switch to editing the new theme
        setEditingTheme(newTheme);
        setActiveTab('editor');
      },
      onError: (error) => {
        setGeneratingTheme(false);
        
        toast({
          title: 'Error',
          description: `Failed to generate theme: ${error.message}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const canEdit = (theme: Theme) => userThemes.some(t => t.id === theme.id);
  
  // Filter themes into different categories
  const systemThemes = themes.filter((theme: Theme) => !theme.userId);
  const userThemes = themes.filter((theme: Theme) => theme.userId === user?.id);
  const publicThemes = themes.filter((theme: Theme) => theme.isPublic && theme.userId !== user?.id);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mx-auto max-w-2xl">
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
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Theme Manager</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of the application with themes
          </p>
        </div>
        
        <div className="flex mt-4 md:mt-0 space-x-2">
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={() => setAiDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
          )}
          
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingTheme(emptyTheme);
                setActiveTab('editor');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Theme
            </Button>
          )}
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="gallery">Theme Gallery</TabsTrigger>
          {isAdmin && <TabsTrigger value="manage">Manage Themes</TabsTrigger>}
          {isAdmin && editingTheme && <TabsTrigger value="editor">Theme Editor</TabsTrigger>}
          {isAdmin && viewingHistoryForTheme && <TabsTrigger value="history">Theme History</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="gallery" className="space-y-6">
          <div className="space-y-8">
            {/* Currently Active Theme */}
            {currentTheme && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold flex items-center">
                  <Paintbrush className="h-5 w-5 mr-2" />
                  Current Theme
                </h2>
                <div className="max-w-md">
                  <ThemeCard 
                    theme={currentTheme} 
                    isActive={true}
                    onEdit={isAdmin && canEdit(currentTheme) ? () => {
                      setEditingTheme(currentTheme);
                      setActiveTab('editor');
                    } : undefined}
                    onClone={isAdmin ? () => handleCloneTheme(currentTheme) : undefined}
                    onHistory={isAdmin ? () => handleViewHistory(currentTheme) : undefined}
                    canEdit={isAdmin && canEdit(currentTheme)}
                    canDelete={false} // Don't allow deleting the active theme
                    canPublish={isAdmin}
                  />
                </div>
              </div>
            )}
            
            {/* Available Themes */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Available Themes</h2>
              <ThemeShowcase
                themes={themes}
                onSelectTheme={(theme) => {
                  setCurrentTheme(theme);
                  setSelectedThemeId(theme.id);
                  
                  toast({
                    title: 'Theme Applied',
                    description: `The theme "${theme.name}" has been applied.`,
                  });
                }}
                currentTheme={currentTheme || undefined}
                isFilterable={true}
                isSearchable={true}
                showActions={true}
              />
            </div>
          </div>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="manage" className="space-y-6">
            <Tabs defaultValue="your-themes">
              <TabsList>
                <TabsTrigger value="your-themes">Your Themes</TabsTrigger>
                <TabsTrigger value="system-themes">System Themes</TabsTrigger>
                <TabsTrigger value="public-themes">Public Themes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="your-themes" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userThemes.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Themes Yet</CardTitle>
                        <CardDescription>
                          You haven't created any themes yet.
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button 
                          onClick={() => {
                            setEditingTheme(emptyTheme);
                            setActiveTab('editor');
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Theme
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    userThemes.map((theme: Theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={currentTheme?.id === theme.id}
                        onSelect={(theme) => {
                          setCurrentTheme(theme);
                          toast({
                            title: 'Theme Applied',
                            description: `The theme "${theme.name}" has been applied.`,
                          });
                        }}
                        onEdit={() => {
                          setEditingTheme(theme);
                          setActiveTab('editor');
                        }}
                        onDelete={() => handleDeleteTheme(theme)}
                        onClone={() => handleCloneTheme(theme)}
                        onPublish={!theme.isPublic ? () => handlePublishTheme(theme) : undefined}
                        onUnpublish={theme.isPublic ? () => handleUnpublishTheme(theme) : undefined}
                        onHistory={() => handleViewHistory(theme)}
                        canEdit={true}
                        canDelete={true}
                        canPublish={true}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="system-themes" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemThemes.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No System Themes</CardTitle>
                        <CardDescription>
                          There are no system themes available.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ) : (
                    systemThemes.map((theme: Theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={currentTheme?.id === theme.id}
                        onSelect={(theme) => {
                          setCurrentTheme(theme);
                          toast({
                            title: 'Theme Applied',
                            description: `The theme "${theme.name}" has been applied.`,
                          });
                        }}
                        onClone={() => handleCloneTheme(theme)}
                        onHistory={() => handleViewHistory(theme)}
                        canEdit={false}
                        canDelete={false}
                        canPublish={false}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="public-themes" className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicThemes.length === 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Public Themes</CardTitle>
                        <CardDescription>
                          There are no public themes created by other users.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ) : (
                    publicThemes.map((theme: Theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={currentTheme?.id === theme.id}
                        onSelect={(theme) => {
                          setCurrentTheme(theme);
                          toast({
                            title: 'Theme Applied',
                            description: `The theme "${theme.name}" has been applied.`,
                          });
                        }}
                        onClone={() => handleCloneTheme(theme)}
                        onHistory={() => handleViewHistory(theme)}
                        canEdit={false}
                        canDelete={false}
                        canPublish={false}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
        
        {isAdmin && editingTheme && (
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      setEditingTheme(null);
                      setActiveTab('gallery');
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ThemeEditor
                  theme={editingTheme.id !== 0 ? editingTheme : undefined}
                  onCancel={() => {
                    setEditingTheme(null);
                    setActiveTab('gallery');
                  }}
                  onSave={handleSaveTheme}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {isAdmin && viewingHistoryForTheme && (
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setViewingHistoryForTheme(null);
                        setActiveTab('gallery');
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <CardTitle>Theme History</CardTitle>
                  </div>
                  
                  <CardDescription>
                    {themes.find((t: Theme) => t.id === viewingHistoryForTheme)?.name || 'Theme'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ThemeHistory
                  themeId={viewingHistoryForTheme}
                  onRestoreVersion={handleRestoreVersion}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Confirmation Dialogs */}
      {themeToDelete && (
        <DeleteConfirmation
          theme={themeToDelete}
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDeleteTheme}
        />
      )}
      
      <AIGenerationDialog
        isOpen={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        onGenerate={handleAIGenerate}
        isGenerating={generatingTheme}
      />
    </div>
  );
};

export default ThemePage;