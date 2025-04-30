import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { 
  Loader2, 
  PlusCircle, 
  Trash, 
  Save, 
  History, 
  FileCode, 
  Cog, 
  EyeIcon, 
  Edit, 
  CopyIcon, 
  Tags,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Define the schema for theme creation/editing
const themeFormSchema = z.object({
  name: z.string().min(3, { message: "Theme name must be at least 3 characters." }),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  tokens: z.record(z.any()).optional(),
  parentThemeId: z.number().nullable().optional(),
  version: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

// Token panel definitions for the theme editor
const tokenPanels = [
  { id: 'colors', label: 'Colors', description: 'Define the color palette for the theme' },
  { id: 'typography', label: 'Typography', description: 'Set fonts, sizes, and text styles' },
  { id: 'spacing', label: 'Spacing', description: 'Configure margins, paddings, and gaps' },
  { id: 'borders', label: 'Borders', description: 'Set border widths, radii, and styles' },
  { id: 'shadows', label: 'Shadows', description: 'Define box and text shadows' },
  { id: 'effects', label: 'Effects', description: 'Configure animations and transitions' },
  { id: 'components', label: 'Components', description: 'Style specific UI components' },
];

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
}

interface ThemeVersion {
  id: number;
  themeId: number;
  version: string;
  tokens: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ThemeEditorProps {
  themeId?: number; // If provided, edit this theme; otherwise create a new one
  readOnly?: boolean; // View-only mode
  onSaved?: (theme: Theme) => void;
  onCancelled?: () => void;
}

export function ThemeEditor({
  themeId,
  readOnly = false,
  onSaved,
  onCancelled
}: ThemeEditorProps) {
  const { toast } = useToast();
  const { defaultTokens, baseTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState('colors');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ThemeVersion | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Fetch theme parents (for inheritance dropdown)
  const { data: parentThemes } = useQuery({
    queryKey: ['/api/themes/public'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/themes/public');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching parent themes:', error);
        return [];
      }
    },
    initialData: []
  });

  // Fetch theme data if editing
  const { 
    data: theme, 
    isLoading: isLoadingTheme,
    isError: isThemeError,
    error: themeError
  } = useQuery({
    queryKey: ['/api/themes', themeId],
    queryFn: async () => {
      if (!themeId) return null;
      const response = await fetch(`/api/themes/${themeId}`);
      if (!response.ok) {
        if (response.status === 403) {
          setAccessError('You do not have permission to edit this theme');
          throw new Error('Permission denied');
        }
        throw new Error('Failed to fetch theme');
      }
      return await response.json();
    },
    enabled: !!themeId
  });

  // Fetch theme version history if editing
  const { 
    data: versionHistory = [], 
    isLoading: isLoadingVersions 
  } = useQuery({
    queryKey: ['/api/themes', themeId, 'versions'],
    queryFn: async () => {
      if (!themeId) return [];
      try {
        const response = await fetch(`/api/themes/${themeId}/versions`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching version history:', error);
        return [];
      }
    },
    enabled: !!themeId
  });

  // Form setup
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
      tags: [],
      tokens: defaultTokens,
      parentThemeId: null,
      version: '1.0.0',
      metadata: {}
    }
  });

  // Update form when theme data is loaded
  useEffect(() => {
    if (theme) {
      form.reset({
        name: theme.name,
        description: theme.description || '',
        isPublic: theme.isPublic,
        tags: theme.tags || [],
        tokens: theme.tokens,
        parentThemeId: theme.parentThemeId || null,
        version: theme.version,
        metadata: theme.metadata || {}
      });
      
      // Update JSON editor if open
      if (showJsonEditor) {
        setJsonEditorValue(JSON.stringify(theme.tokens, null, 2));
      }
    }
  }, [theme, form]);

  // Update JSON editor value when active panel changes
  useEffect(() => {
    if (showJsonEditor) {
      const tokens = form.getValues('tokens') || {};
      setJsonEditorValue(JSON.stringify(tokens, null, 2));
    }
  }, [showJsonEditor, form]);

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (data: ThemeFormValues) => {
      const response = await apiRequest('POST', '/api/themes', data);
      return await response.json();
    },
    onSuccess: (newTheme) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/showcase'] });
      toast({
        title: 'Theme Created',
        description: `"${newTheme.name}" has been created successfully.`,
        variant: 'default',
      });
      if (onSaved) onSaved(newTheme);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create theme: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (data: ThemeFormValues & { id: number }) => {
      const { id, ...themeData } = data;
      const response = await apiRequest('PUT', `/api/themes/${id}`, themeData);
      return await response.json();
    },
    onSuccess: (updatedTheme) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes', updatedTheme.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/showcase'] });
      toast({
        title: 'Theme Updated',
        description: `"${updatedTheme.name}" has been updated successfully.`,
        variant: 'default',
      });
      if (onSaved) onSaved(updatedTheme);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update theme: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async ({ themeId, versionId }: { themeId: number, versionId: number }) => {
      const response = await apiRequest('POST', `/api/themes/${themeId}/versions/${versionId}/restore`, {});
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes', themeId, 'versions'] });
      toast({
        title: 'Version Restored',
        description: `Theme has been restored to ${result.theme.version}.`,
        variant: 'default',
      });
      setShowRestoreConfirm(false);
      setShowVersionHistory(false);
      if (result.theme) {
        form.reset({
          name: result.theme.name,
          description: result.theme.description || '',
          isPublic: result.theme.isPublic,
          tags: result.theme.tags || [],
          tokens: result.theme.tokens,
          parentThemeId: result.theme.parentThemeId || null,
          version: result.theme.version,
          metadata: result.theme.metadata || {}
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to restore version: ${error.message}`,
        variant: 'destructive',
      });
      setShowRestoreConfirm(false);
    }
  });

  // Handle form submission
  const onSubmit = (data: ThemeFormValues) => {
    // Parse JSON tokens if in JSON editor mode
    if (showJsonEditor) {
      try {
        const parsedTokens = JSON.parse(jsonEditorValue);
        data.tokens = parsedTokens;
      } catch (e) {
        toast({
          title: 'Invalid JSON',
          description: 'Please check your JSON syntax',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (themeId) {
      // Update existing theme
      updateThemeMutation.mutate({ ...data, id: themeId });
    } else {
      // Create new theme
      createThemeMutation.mutate(data);
    }
  };

  // Handle restore version confirmation
  const handleRestoreVersion = () => {
    if (!themeId || !selectedVersion) return;
    
    restoreVersionMutation.mutate({ 
      themeId, 
      versionId: selectedVersion.id 
    });
  };

  // Handle JSON editor changes
  const handleJsonEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonEditorValue(e.target.value);
    
    // Attempt to validate JSON as user types
    try {
      JSON.parse(e.target.value);
    } catch (e) {
      // Invalid JSON, but we don't show an error until they submit
    }
  };

  // Toggle tag in the form
  const toggleTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    form.setValue('tags', newTags);
  };

  // Reset form to default or parent theme values
  const resetToDefaults = () => {
    const parentId = form.getValues('parentThemeId');
    
    if (parentId) {
      // Reset to parent theme values
      const parent = parentThemes.find(t => t.id === parentId);
      if (parent) {
        form.setValue('tokens', parent.tokens);
        toast({
          title: 'Reset to Parent Theme',
          description: `Tokens have been reset to values from parent theme "${parent.name}".`,
          variant: 'default',
        });
      }
    } else {
      // Reset to system defaults
      form.setValue('tokens', defaultTokens);
      toast({
        title: 'Reset to Defaults',
        description: 'All tokens have been reset to system defaults.',
        variant: 'default',
      });
    }
    
    setConfirmReset(false);
  };

  // Handle parent theme change
  const handleParentChange = (value: string) => {
    const parentId = value ? parseInt(value) : null;
    form.setValue('parentThemeId', parentId);
    
    // If a parent is selected, offer to inherit its tokens
    if (parentId) {
      const parent = parentThemes.find(t => t.id === parentId);
      if (parent) {
        // Ask if they want to inherit the tokens
        if (confirm(`Do you want to inherit tokens from "${parent.name}"?`)) {
          form.setValue('tokens', parent.tokens);
          form.setValue('metadata', {
            ...form.getValues('metadata'),
            inheritance: {
              parentId: parent.id,
              parentName: parent.name,
              inheritedAt: new Date(),
            }
          });
        }
      }
    }
  };

  // Loading state
  if (isLoadingTheme && themeId) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading theme...</p>
      </div>
    );
  }

  // Access error state
  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="mt-4">{accessError}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onCancelled}
        >
          Go Back
        </Button>
      </div>
    );
  }

  // Theme not found error
  if (isThemeError && themeId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="mt-4">Error loading theme: {themeError.message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onCancelled}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Information</CardTitle>
                  <CardDescription>Configure general theme settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My awesome theme" {...field} readOnly={readOnly} />
                        </FormControl>
                        <FormDescription>
                          A unique, descriptive name for your theme
                        </FormDescription>
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
                            placeholder="Describe your theme..."
                            {...field}
                            readOnly={readOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional - explain the purpose and style of your theme
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Version
                          {themeId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-6 w-6 p-0"
                              onClick={() => setShowVersionHistory(true)}
                              disabled={readOnly}
                            >
                              <History className="h-4 w-4" />
                              <span className="sr-only">Version History</span>
                            </Button>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} readOnly={readOnly} />
                        </FormControl>
                        <FormDescription>
                          Semantic versioning (e.g., 1.0.0)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentThemeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Theme</FormLabel>
                        <Select
                          disabled={readOnly}
                          onValueChange={handleParentChange}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a parent theme (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None (Base Theme)</SelectItem>
                            {parentThemes
                              .filter(t => !themeId || t.id !== themeId) // Can't inherit from self
                              .map(theme => (
                                <SelectItem key={theme.id} value={theme.id.toString()}>
                                  {theme.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Inherit properties from another theme
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public Theme</FormLabel>
                          <FormDescription>
                            Make this theme available to all users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={readOnly}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['dark', 'light', 'professional', 'vibrant', 'minimal', 'modern', 'classic', 'colorful', 'monochrome', 'accessible'].map(tag => (
                        <Badge
                          key={tag}
                          variant={form.getValues('tags')?.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => !readOnly && toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <FormDescription className="mt-2">
                      Select tags to help others find your theme
                    </FormDescription>
                  </div>

                </CardContent>
                {!readOnly && (
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancelled}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
                    >
                      {(createThemeMutation.isPending || updateThemeMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {themeId ? 'Update Theme' : 'Create Theme'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Token Editor Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="space-y-0">
                  <div className="flex items-center justify-between">
                    <CardTitle>Theme Tokens</CardTitle>
                    <div className="flex items-center space-x-2">
                      {!readOnly && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowJsonEditor(!showJsonEditor)}
                                >
                                  <FileCode className="h-4 w-4 mr-1" />
                                  {showJsonEditor ? 'Visual Editor' : 'JSON Editor'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {showJsonEditor 
                                  ? 'Switch back to visual editor' 
                                  : 'Edit theme tokens directly as JSON'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfirmReset(true)}
                                >
                                  <Cog className="h-4 w-4 mr-1" />
                                  Reset
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Reset to default or parent theme values
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewMode(!previewMode)}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              {previewMode ? 'Editor' : 'Preview'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {previewMode 
                              ? 'Return to editor mode' 
                              : 'Preview how the theme will look'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <CardDescription>
                    {showJsonEditor 
                      ? 'Edit theme tokens directly using JSON syntax' 
                      : 'Customize the appearance of your theme'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {previewMode ? (
                    <div className="space-y-8">
                      <div className="border rounded-lg p-6 space-y-4">
                        <h3 className="text-2xl font-bold">Theme Preview</h3>
                        <p className="text-muted-foreground">This is how components will look with your theme.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="space-y-4">
                            <Button variant="default">Primary Button</Button>
                            <Button variant="secondary">Secondary Button</Button>
                            <Button variant="outline">Outline Button</Button>
                            <Button variant="ghost">Ghost Button</Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Switch id="preview-mode" />
                              <Label htmlFor="preview-mode">Toggle setting</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="terms" className="rounded border-input" />
                              <label htmlFor="terms">I agree to terms</label>
                            </div>
                            
                            <Input placeholder="Text input example" className="max-w-sm" />
                            
                            <div className="flex space-x-2">
                              <Badge>Default</Badge>
                              <Badge variant="secondary">Secondary</Badge>
                              <Badge variant="outline">Outline</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Card Title</CardTitle>
                              <CardDescription>Card description goes here</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p>This is an example card with sample content to preview theme styles.</p>
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" size="sm">Action</Button>
                            </CardFooter>
                          </Card>
                          
                          <div className="space-y-2">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Info Alert</AlertTitle>
                              <AlertDescription>
                                This is an informational alert message.
                              </AlertDescription>
                            </Alert>
                            
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Error Alert</AlertTitle>
                              <AlertDescription>
                                Something went wrong!
                              </AlertDescription>
                            </Alert>
                          </div>
                          
                          <div>
                            <Accordion type="single" collapsible>
                              <AccordionItem value="item-1">
                                <AccordionTrigger>Accordion Item</AccordionTrigger>
                                <AccordionContent>
                                  This is the content inside an accordion item.
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="item-2">
                                <AccordionTrigger>Another Item</AccordionTrigger>
                                <AccordionContent>
                                  More content goes here.
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : showJsonEditor ? (
                    <div className="space-y-4">
                      <Textarea
                        className="min-h-[500px] font-mono text-sm"
                        value={jsonEditorValue}
                        onChange={handleJsonEditorChange}
                        readOnly={readOnly}
                      />
                      <p className="text-sm text-muted-foreground">
                        Edit the JSON directly. Be careful with syntax - invalid JSON will not save.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Tabs defaultValue="colors" onValueChange={setActivePanel} value={activePanel}>
                        <TabsList className="w-full flex-wrap h-auto">
                          {tokenPanels.map(panel => (
                            <TabsTrigger key={panel.id} value={panel.id} className="flex-grow">
                              {panel.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {tokenPanels.map(panel => (
                          <TabsContent key={panel.id} value={panel.id} className="pt-4 pb-2">
                            {panel.id === 'colors' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Color token inputs would go here */}
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.primary"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Primary Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#000000' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.secondary"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Secondary Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#000000' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.background"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Background Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#FFFFFF' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.text"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Text Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#000000' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.success"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Success Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#10B981' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.warning"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Warning Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#F59E0B' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.error"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Error Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#EF4444' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.colors.muted"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Muted Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#6B7280' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'typography' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tokens.typography.fontFamily"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Font Family</FormLabel>
                                      <Select
                                        disabled={readOnly}
                                        onValueChange={field.onChange}
                                        value={field.value || ''}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a font family" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Inter, system-ui, sans-serif">Inter (Sans-serif)</SelectItem>
                                          <SelectItem value="'Roboto Slab', serif">Roboto Slab (Serif)</SelectItem>
                                          <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono (Monospace)</SelectItem>
                                          <SelectItem value="system-ui, sans-serif">System Font</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.typography.fontSize"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Font Size</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="16px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.typography.lineHeight"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Line Height</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="1.5" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.typography.fontWeight"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Font Weight</FormLabel>
                                      <Select
                                        disabled={readOnly}
                                        onValueChange={field.onChange}
                                        value={field.value?.toString() || ''}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a font weight" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="300">Light (300)</SelectItem>
                                          <SelectItem value="400">Regular (400)</SelectItem>
                                          <SelectItem value="500">Medium (500)</SelectItem>
                                          <SelectItem value="600">Semi-Bold (600)</SelectItem>
                                          <SelectItem value="700">Bold (700)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'spacing' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tokens.spacing.padding"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Padding</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="16px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.spacing.margin"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Margin</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="16px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.spacing.gap"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Gap</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="16px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'borders' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tokens.borders.radius"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Border Radius</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="4px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.borders.width"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Border Width</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="1px" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.borders.color"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center">
                                        Border Color
                                        <div 
                                          className="ml-2 w-4 h-4 rounded-full border" 
                                          style={{ backgroundColor: field.value || '#E5E7EB' }}
                                        />
                                      </FormLabel>
                                      <FormControl>
                                        <Input type="color" {...field} readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'shadows' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tokens.shadows.sm"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Small Shadow</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="0 1px 2px 0 rgba(0, 0, 0, 0.05)" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.shadows.md"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Medium Shadow</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="tokens.shadows.lg"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Large Shadow</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="0 10px 15px -3px rgba(0, 0, 0, 0.1)" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'effects' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tokens.effects.transition"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Transition</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="text" placeholder="all 0.2s ease-in-out" readOnly={readOnly} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            {panel.id === 'components' && (
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium">Button Styles</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="tokens.components.button.borderRadius"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Button Border Radius</FormLabel>
                                          <FormControl>
                                            <Input {...field} type="text" placeholder="4px" readOnly={readOnly} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name="tokens.components.button.fontWeight"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Button Font Weight</FormLabel>
                                          <Select
                                            disabled={readOnly}
                                            onValueChange={field.onChange}
                                            value={field.value?.toString() || ''}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a font weight" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="400">Regular (400)</SelectItem>
                                              <SelectItem value="500">Medium (500)</SelectItem>
                                              <SelectItem value="600">Semi-Bold (600)</SelectItem>
                                              <SelectItem value="700">Bold (700)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium">Card Styles</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="tokens.components.card.borderRadius"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Card Border Radius</FormLabel>
                                          <FormControl>
                                            <Input {...field} type="text" placeholder="8px" readOnly={readOnly} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={form.control}
                                      name="tokens.components.card.shadow"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Card Shadow</FormLabel>
                                          <FormControl>
                                            <Input {...field} type="text" placeholder="0 4px 6px -1px rgba(0, 0, 0, 0.1)" readOnly={readOnly} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of this theme
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingVersions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : versionHistory.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No version history available
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {versionHistory.map((version) => (
                <div 
                  key={version.id} 
                  className={`flex items-center justify-between p-4 hover:bg-muted/50 rounded-md ${
                    selectedVersion?.id === version.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center">
                    <div className="mr-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {version.version.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Version {version.version}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.metadata?.snapshotReason && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {version.metadata.snapshotReason}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedVersion?.id === version.id) {
                          setShowRestoreConfirm(true);
                        } else {
                          setSelectedVersion(version);
                          setShowRestoreConfirm(true);
                        }
                      }}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore confirmation dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Previous Version?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore the theme to version {selectedVersion?.version}? This will overwrite your current theme tokens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreVersion}
              disabled={restoreVersionMutation.isPending}
            >
              {restoreVersionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset confirmation dialog */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Theme Tokens?</AlertDialogTitle>
            <AlertDialogDescription>
              {form.getValues('parentThemeId')
                ? "This will reset all tokens to the parent theme's values."
                : "This will reset all tokens to the system default values."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetToDefaults}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}