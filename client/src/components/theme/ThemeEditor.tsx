/**
 * Theme Editor Component
 * 
 * A component that allows users to create and edit themes.
 * It provides a user-friendly interface for modifying theme tokens.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeTokens } from '@shared/theme/tokens';
import { defaultLightTokens, defaultDarkTokens } from '@shared/theme/defaultThemes';
import { ColorPicker } from './ColorPicker';

// Schema for theme metadata
const themeMetadataSchema = z.object({
  name: z.string().min(3, { message: "Theme name must be at least 3 characters" }),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.string().optional().transform(val => 
    val ? val.split(',').map(tag => tag.trim()) : []
  ),
  versionNotes: z.string().optional(),
  versionNumber: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: "Version must be in format x.y.z (e.g., 1.0.0)"
  })
});

// The token categories for editing
const TOKEN_CATEGORIES = [
  { key: 'colors', label: 'Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'shadows', label: 'Shadows' },
  { key: 'radius', label: 'Border Radius' },
  { key: 'components', label: 'Components' },
];

interface ThemeEditorProps {
  themeId?: number;
  versionId?: number;
  initialTokens?: ThemeTokens;
  onSave?: (result: { theme: any, version: any }) => void;
  onCancel?: () => void;
}

export function ThemeEditor({
  themeId,
  versionId,
  initialTokens,
  onSave,
  onCancel
}: ThemeEditorProps) {
  const [activeTab, setActiveTab] = useState('metadata');
  const [tokens, setTokens] = useState<ThemeTokens>(
    initialTokens || defaultLightTokens
  );
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch theme if editing
  const { data: theme, isLoading: isLoadingTheme } = useQuery({
    queryKey: ['/api/themes', themeId],
    enabled: !!themeId,
  });

  // Fetch theme version if editing
  const { data: version, isLoading: isLoadingVersion } = useQuery({
    queryKey: versionId 
      ? ['/api/themes', themeId, 'versions', versionId] 
      : ['/api/themes', themeId, 'versions', 'active'],
    enabled: !!themeId,
  });

  // Effect to update tokens from loaded version
  useEffect(() => {
    if (version && version.tokens) {
      setTokens(version.tokens as ThemeTokens);
    }
  }, [version]);

  // Form for theme metadata
  const form = useForm<z.infer<typeof themeMetadataSchema>>({
    resolver: zodResolver(themeMetadataSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      tags: '',
      versionNotes: '',
      versionNumber: '1.0.0'
    }
  });

  // Effect to update form values when theme is loaded
  useEffect(() => {
    if (theme) {
      form.setValue('name', theme.name);
      form.setValue('description', theme.description || '');
      form.setValue('isPublic', theme.isPublic);
      form.setValue('tags', theme.tags ? theme.tags.join(', ') : '');
    }
    
    if (version) {
      form.setValue('versionNumber', version.version);
      form.setValue('versionNotes', version.changeNotes || '');
    }
  }, [theme, version, form]);

  // Create new theme with version
  const createThemeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/themes/with-version', {
        method: 'POST',
        data
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Theme created',
        description: 'Your theme has been created successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      
      if (onSave) {
        onSave(data);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error creating theme',
        description: 'There was a problem creating your theme. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating theme:', error);
    }
  });

  // Update existing theme
  const updateThemeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { theme, version } = data;
      
      // Update theme metadata
      const themeResponse = await apiRequest(`/api/themes/${themeId}`, {
        method: 'PUT',
        data: theme
      });
      
      // Create new version
      const versionResponse = await apiRequest(`/api/themes/${themeId}/versions`, {
        method: 'POST',
        data: version
      });
      
      return { theme: themeResponse, version: versionResponse };
    },
    onSuccess: (data) => {
      toast({
        title: 'Theme updated',
        description: 'Your theme has been updated successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId, 'versions'] });
      
      if (onSave) {
        onSave(data);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error updating theme',
        description: 'There was a problem updating your theme. Please try again.',
        variant: 'destructive',
      });
      console.error('Error updating theme:', error);
    }
  });

  // Handle form submission
  const onSubmit = (formData: z.infer<typeof themeMetadataSchema>) => {
    const payload = {
      theme: {
        name: formData.name,
        description: formData.description,
        isPublic: formData.isPublic,
        tags: formData.tags
      },
      version: {
        version: formData.versionNumber,
        changeNotes: formData.versionNotes,
        tokens,
        isActive: true
      }
    };
    
    if (themeId) {
      // Update existing theme
      updateThemeMutation.mutate(payload);
    } else {
      // Create new theme
      createThemeMutation.mutate(payload);
    }
  };

  // Toggle light/dark mode
  const toggleThemeMode = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
      setTokens(defaultDarkTokens);
    } else {
      setThemeMode('light');
      setTokens(defaultLightTokens);
    }
  };

  // Update a token value
  const updateToken = (category: string, key: string, value: any) => {
    setTokens(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof ThemeTokens],
        [key]: value
      }
    }));
  };

  // Update a nested token value
  const updateNestedToken = (category: string, parent: string, key: string, value: any) => {
    setTokens(prev => {
      const categoryTokens = prev[category as keyof ThemeTokens] as Record<string, any>;
      return {
        ...prev,
        [category]: {
          ...categoryTokens,
          [parent]: {
            ...categoryTokens[parent],
            [key]: value
          }
        }
      };
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {themeId ? 'Edit Theme' : 'Create New Theme'}
        </CardTitle>
        <CardDescription>
          {themeId 
            ? 'Update the design of your existing theme' 
            : 'Design a custom theme for your application'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metadata" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {TOKEN_CATEGORIES.map(category => (
              <TabsTrigger key={category.key} value={category.key}>
                {category.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Metadata Tab */}
          <TabsContent value="metadata">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter theme name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your theme" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="corporate, dark, accessible, etc." 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Public Theme</FormLabel>
                        <FormDescription>
                          Make this theme available to other users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="versionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1.0.0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="versionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What's changed in this version?" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <div>
                    <span className="mr-2">Light</span>
                    <Switch 
                      checked={themeMode === 'dark'} 
                      onCheckedChange={toggleThemeMode} 
                    />
                    <span className="ml-2">Dark</span>
                  </div>
                  <div className="space-x-2">
                    {onCancel && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={
                        createThemeMutation.isPending || 
                        updateThemeMutation.isPending
                      }
                    >
                      {themeId ? 'Update Theme' : 'Create Theme'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Base Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tokens.colors && Object.entries(tokens.colors).map(([key, value]) => (
                    <ColorTokenEditor
                      key={key}
                      name={key}
                      value={value as string}
                      onChange={(newValue) => updateToken('colors', key, newValue)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography">
            <div className="space-y-8">
              {tokens.typography && Object.entries(tokens.typography).map(([categoryKey, categoryValue]) => (
                <div key={categoryKey}>
                  <h3 className="text-lg font-medium mb-4 capitalize">{categoryKey}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categoryValue as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="p-4 border rounded-md">
                        <label className="text-sm font-medium block mb-2">{key}</label>
                        <Input
                          value={value as string}
                          onChange={(e) => updateNestedToken('typography', categoryKey, key, e.target.value)}
                        />
                        <div className="mt-2 text-sm" style={{ 
                          fontFamily: categoryKey === 'fontFamily' ? value as string : undefined,
                          fontSize: categoryKey === 'fontSize' ? value as string : undefined,
                          fontWeight: categoryKey === 'fontWeight' ? value as string : undefined
                        }}>
                          {categoryKey === 'fontFamily' ? 'Sample Text' : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.spacing && Object.entries(tokens.spacing).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-md">
                    <label className="text-sm font-medium block mb-2">{key}</label>
                    <Input
                      value={value as string}
                      onChange={(e) => updateToken('spacing', key, e.target.value)}
                    />
                    <div 
                      className="mt-3 bg-primary-200 dark:bg-primary-800" 
                      style={{ height: value as string, width: '100%' }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Border Radius Tab */}
          <TabsContent value="radius">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tokens.radius && Object.entries(tokens.radius).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-md">
                    <label className="text-sm font-medium block mb-2">{key}</label>
                    <Input
                      value={value as string}
                      onChange={(e) => updateToken('radius', key, e.target.value)}
                    />
                    <div 
                      className="mt-3 bg-primary-200 dark:bg-primary-800" 
                      style={{ 
                        borderRadius: value as string, 
                        height: '64px', 
                        width: '100%' 
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Shadows Tab */}
          <TabsContent value="shadows">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tokens.shadows && Object.entries(tokens.shadows).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-md">
                    <label className="text-sm font-medium block mb-2">{key}</label>
                    <Input
                      value={value as string}
                      onChange={(e) => updateToken('shadows', key, e.target.value)}
                    />
                    <div 
                      className="mt-3 bg-card" 
                      style={{ 
                        boxShadow: value as string, 
                        height: '64px', 
                        width: '100%' 
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components">
            <div className="space-y-8">
              {tokens.components && Object.entries(tokens.components).map(([componentName, variants]) => (
                <div key={componentName}>
                  <h3 className="text-lg font-medium mb-4 capitalize">{componentName}</h3>
                  <div className="space-y-4">
                    {Object.entries(variants as Record<string, any>).map(([variantName, properties]) => (
                      <div key={variantName} className="p-4 border rounded-md">
                        <h4 className="font-medium mb-3 capitalize">{variantName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(properties as Record<string, string>).map(([propKey, propValue]) => (
                            <div key={propKey} className="space-y-1">
                              <label className="text-sm block">{propKey}</label>
                              <Input
                                value={propValue}
                                onChange={(e) => {
                                  setTokens(prev => {
                                    const components = { ...prev.components };
                                    components[componentName][variantName][propKey] = e.target.value;
                                    return { ...prev, components };
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <div className="p-6 space-y-6 border rounded-lg">
              <h3 className="text-2xl font-bold">Theme Preview</h3>
              <p className="text-muted-foreground">
                This is how your theme will look when applied to components.
              </p>
              
              <div className="flex gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
              
              <div className="flex gap-2">
                <Badge>Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
                <Badge variant="destructive">Destructive Badge</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description goes here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This is the content of the card which demonstrates how text and other elements will look.</p>
                  </CardContent>
                  <CardFooter>
                    <Button>Action</Button>
                  </CardFooter>
                </Card>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Input Example</h4>
                    <Input placeholder="Enter some text..." />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Typography</h4>
                    <h1 className="text-2xl font-bold">Heading 1</h1>
                    <h2 className="text-xl font-semibold">Heading 2</h2>
                    <h3 className="text-lg font-medium">Heading 3</h3>
                    <p>Regular paragraph text</p>
                    <p className="text-sm">Small text</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {!activeTab.includes('metadata') && (
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('metadata')}
            >
              Back to Metadata
            </Button>
          )}
        </div>
        {activeTab.includes('preview') && (
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              createThemeMutation.isPending || 
              updateThemeMutation.isPending
            }
          >
            {themeId ? 'Update Theme' : 'Create Theme'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Color Token Editor Component
function ColorTokenEditor({ 
  name, 
  value, 
  onChange 
}: { 
  name: string; 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div className="p-3 border rounded-md">
      <label className="text-sm font-medium block mb-2">{name}</label>
      <div className="flex gap-2 items-center">
        <div
          className="h-8 w-8 rounded-md border"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}