import React, { useState } from 'react';
import { ThemeShowcase } from '@/components/theme/ThemeShowcase';
import { ThemeEditor } from '@/components/theme/ThemeEditor';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, Settings } from 'lucide-react';

export default function ThemePage() {
  const { user } = useAuth();
  const [showCreateTheme, setShowCreateTheme] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [editingTheme, setEditingTheme] = useState<number | null>(null);
  
  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Handle creating a new theme
  const handleCreateTheme = () => {
    setEditingTheme(null);
    setShowCreateTheme(true);
  };
  
  // Handle editing a theme
  const handleEditTheme = (themeId: number) => {
    setEditingTheme(themeId);
    setShowCreateTheme(true);
  };
  
  // Handle cancelling theme creation/editing
  const handleCancelTheme = () => {
    setShowCreateTheme(false);
    setEditingTheme(null);
  };
  
  // Handle theme saved callback
  const handleThemeSaved = () => {
    setShowCreateTheme(false);
    setEditingTheme(null);
  };
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theme Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Explore and customize themes for your experience
          </p>
        </div>
        
        {isAdmin && !showCreateTheme && (
          <Button onClick={handleCreateTheme} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Create New Theme
          </Button>
        )}
      </div>
      
      <Separator className="mb-8" />
      
      {showCreateTheme ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {editingTheme ? 'Edit Theme' : 'Create New Theme'}
            </h2>
            <Button variant="outline" onClick={handleCancelTheme}>
              Cancel
            </Button>
          </div>
          
          <ThemeEditor
            themeId={editingTheme || undefined}
            onSaved={handleThemeSaved}
            onCancelled={handleCancelTheme}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Themes</TabsTrigger>
                {user && (
                  <TabsTrigger value="my">My Themes</TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                )}
              </TabsList>
              
              <Button variant="outline" size="sm" asChild>
                <a href="/theme-documentation" target="_blank" rel="noopener noreferrer">
                  <Settings className="h-4 w-4 mr-2" />
                  Theme Documentation
                </a>
              </Button>
            </div>
            
            <TabsContent value="all" className="mt-6">
              <ThemeShowcase maxItems={12} />
            </TabsContent>
            
            {user && (
              <TabsContent value="my" className="mt-6">
                <ThemeShowcase 
                  includePrivate={true}
                  maxItems={12}
                  onThemeSelect={isAdmin ? (theme) => handleEditTheme(theme.id) : undefined}
                />
              </TabsContent>
            )}
            
            {isAdmin && (
              <TabsContent value="admin" className="mt-6">
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Theme Management</h3>
                  <p className="mb-6">
                    As an administrator, you can create, edit, and delete themes. 
                    You can also manage the theme showcase and set default themes for users.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 bg-card">
                      <h4 className="font-medium mb-2">Theme Creation</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create new themes with custom colors, typography, and components.
                      </p>
                      <Button onClick={handleCreateTheme} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Theme
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-card">
                      <h4 className="font-medium mb-2">Theme Analytics</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        View usage statistics and popularity of themes.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/admin/theme-analytics">
                          View Analytics
                        </a>
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-card">
                      <h4 className="font-medium mb-2">Default Themes</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Set default themes for new users and system preferences.
                      </p>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/admin/default-themes">
                          Manage Defaults
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}