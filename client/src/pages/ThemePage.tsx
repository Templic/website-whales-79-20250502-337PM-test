/**
 * Theme Management Page
 * 
 * This page provides a comprehensive interface for managing themes:
 * - Browse public and personal themes
 * - Select and apply themes
 * - Customize appearance settings
 * - View theme analytics (for admins and theme creators)
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { ThemeSettings } from '@/components/theme/ThemeSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { Separator } from '@/components/ui/separator';

export const ThemePage: React.FC = () => {
  const { currentTheme } = useTheme();
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Theme Customization</h1>
        <p className="text-muted-foreground mt-2">
          Personalize your experience by selecting themes and appearance preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left sidebar - Current theme and settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Theme</CardTitle>
              <CardDescription>Your active theme settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{currentTheme.name}</h3>
                  {currentTheme.description && (
                    <p className="text-muted-foreground text-sm mt-1">{currentTheme.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Primary</p>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: currentTheme.primaryColor }} />
                      <span className="text-xs">{currentTheme.primaryColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Accent</p>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: currentTheme.accentColor }} />
                      <span className="text-xs">{currentTheme.accentColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Background</p>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border" style={{ backgroundColor: currentTheme.backgroundColor }} />
                      <span className="text-xs">{currentTheme.backgroundColor}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Text</p>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: currentTheme.textColor }} />
                      <span className="text-xs">{currentTheme.textColor}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Font Family</p>
                  <p className="text-sm" style={{ fontFamily: currentTheme.fontFamily }}>
                    {currentTheme.fontFamily || 'System Default'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Border Radius</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-8 border"
                      style={{ borderRadius: currentTheme.borderRadius }}
                    />
                    <span className="text-xs">{currentTheme.borderRadius}</span>
                  </div>
                </div>
                
                {currentTheme.tags && currentTheme.tags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {currentTheme.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <ThemeSettings />
        </div>
        
        {/* Main content - Theme browser */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Browse Themes</CardTitle>
              <CardDescription>Select from available themes or create your own</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">About Themes</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Themes allow you to personalize your experience with custom colors, fonts, and more.
          Public themes are available to all users, while personal themes are visible only to you.
        </p>
      </div>
    </div>
  );
};

export default ThemePage;