import React, { useState } from 'react';
import { Theme, InsertTheme } from '../../../shared/schema';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paintbrush, Save, Trash, X, Eye, EyeOff, Copy, Plus, Sparkles, Tags, Settings } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Color picker
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ThemeEditorProps {
  theme?: Theme;
  onCancel?: () => void;
  onSave?: (theme: Theme) => void;
  isAdmin?: boolean;
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({
  theme,
  onCancel,
  onSave,
  isAdmin = false,
}) => {
  const { toast } = useToast();
  const { currentTheme } = useTheme();
  const { useCreateTheme, useUpdateTheme } = useThemeAPI();
  
  const createThemeMutation = useCreateTheme();
  const updateThemeMutation = useUpdateTheme();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Determine if this is create or edit mode
  const isEditMode = !!theme;
  
  // For simple tag input
  const handleAddTag = () => {
    if (newTag.trim() !== '' && !form.getValues().tags?.includes(newTag.trim())) {
      const currentTags = form.getValues().tags || [];
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues().tags || [];
    form.setValue(
      'tags',
      currentTags.filter(tag => tag !== tagToRemove)
    );
  };
  
  // Setup form validation schema
  const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid HEX color'),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid HEX color'),
    backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid HEX color'),
    textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid HEX color'),
    borderRadius: z.string().optional(),
    fontFamily: z.string().optional(),
    isPublic: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    // tokens can be any shape
    tokens: z.record(z.any()).optional(),
    // Additional fields for optional advanced features
    parentThemeId: z.number().optional().nullable(),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Default values for new theme
  const defaultValues: FormValues = {
    name: '',
    description: '',
    primaryColor: '#3b82f6', // Blue
    accentColor: '#10b981',  // Green
    backgroundColor: '#ffffff', // White
    textColor: '#111827',    // Near black
    borderRadius: '0.5rem',
    fontFamily: '',
    isPublic: false,
    tags: [],
    tokens: {},
    parentThemeId: null,
  };
  
  // Initialize form with theme values or defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
      ? {
          name: theme.name,
          description: theme.description || '',
          primaryColor: theme.primaryColor || defaultValues.primaryColor,
          accentColor: theme.accentColor || defaultValues.accentColor,
          backgroundColor: theme.backgroundColor || defaultValues.backgroundColor,
          textColor: theme.textColor || defaultValues.textColor,
          borderRadius: theme.borderRadius || defaultValues.borderRadius,
          fontFamily: theme.fontFamily || '',
          isPublic: theme.isPublic || false,
          tags: theme.tags || [],
          tokens: theme.tokens || {},
          parentThemeId: theme.parentThemeId || null,
        }
      : defaultValues,
  });
  
  const handleSubmit = (values: FormValues) => {
    if (isEditMode) {
      // Update existing theme
      updateThemeMutation.mutate({
        ...theme,
        ...values,
      }, {
        onSuccess: (updatedTheme) => {
          toast({
            title: 'Theme updated',
            description: `${updatedTheme.name} has been updated successfully.`,
          });
          
          if (onSave) {
            onSave(updatedTheme);
          }
        },
      });
    } else {
      // Create new theme
      createThemeMutation.mutate(values as InsertTheme, {
        onSuccess: (newTheme) => {
          toast({
            title: 'Theme created',
            description: `${newTheme.name} has been created successfully.`,
          });
          
          // Reset form after successful creation
          form.reset();
          
          if (onSave) {
            onSave(newTheme);
          }
        },
      });
    }
  };
  
  // Preview component for the theme being edited
  const ThemePreview = () => {
    const formValues = form.getValues();
    
    return (
      <div className="overflow-hidden rounded-lg border mb-4">
        <div 
          className="p-6" 
          style={{
            backgroundColor: formValues.backgroundColor,
            color: formValues.textColor,
          }}
        >
          <div className="flex flex-col gap-4">
            <div 
              className="h-10 rounded-t-lg flex items-center px-4" 
              style={{
                backgroundColor: formValues.primaryColor,
                color: '#ffffff',
                borderRadius: formValues.borderRadius,
              }}
            >
              Header Bar
            </div>
            
            <div className="space-y-3">
              <h2
                className="text-2xl font-bold" 
                style={{ color: formValues.textColor }}
              >
                {formValues.name || 'Theme Preview'}
              </h2>
              
              <p style={{ color: formValues.textColor }}>
                {formValues.description || 'This is how your theme will look to users.'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div 
                className="px-4 py-2 rounded" 
                style={{
                  backgroundColor: formValues.primaryColor,
                  color: '#ffffff',
                  borderRadius: formValues.borderRadius,
                }}
              >
                Primary Button
              </div>
              
              <div 
                className="px-4 py-2 rounded border" 
                style={{
                  backgroundColor: 'transparent', 
                  borderColor: formValues.accentColor,
                  color: formValues.accentColor,
                  borderRadius: formValues.borderRadius,
                }}
              >
                Secondary Button
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {formValues.tags?.map((tag, index) => (
                <div 
                  key={index}
                  className="px-2 py-1 text-xs rounded" 
                  style={{
                    backgroundColor: formValues.accentColor,
                    color: '#ffffff',
                    borderRadius: formValues.borderRadius,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
            
            <div
              className="p-3 mt-3 rounded"
              style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: formValues.borderRadius,
              }}
            >
              <div className="flex justify-between items-center">
                <div>Card Element</div>
                <div 
                  className="h-6 w-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: formValues.accentColor,
                    color: '#ffffff',
                  }}
                >
                  <Paintbrush className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Custom color picker field component
  const ColorPickerField = ({ name, label, description }: { name: string, label: string, description?: string }) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <div 
                    className="h-10 w-10 rounded-md border cursor-pointer flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: field.value }}
                  >
                    <span className="sr-only">Pick a color</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker color={field.value} onChange={field.onChange} />
                </PopoverContent>
              </Popover>
              
              <div className="flex-1">
                <FormControl>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <span className="mr-2 opacity-70">#</span>
                    <HexColorInput
                      color={field.value}
                      onChange={field.onChange}
                      prefixed={false}
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                </FormControl>
              </div>
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  // Border radius field with preview
  const BorderRadiusField = () => {
    return (
      <FormField
        control={form.control}
        name="borderRadius"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Border Radius</FormLabel>
            <div className="flex space-x-2">
              <FormControl>
                <Input {...field} />
              </FormControl>
              <div 
                className="h-10 w-10 border flex-shrink-0"
                style={{ borderRadius: field.value }}
              />
            </div>
            <FormDescription>
              Use CSS values like 0.5rem, 8px, or 0 for no radius
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  // Font family selection
  const FontFamilyField = () => {
    return (
      <FormField
        control={form.control}
        name="fontFamily"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Font Family</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., 'Inter', sans-serif" />
            </FormControl>
            <FormDescription>
              Use CSS font family format: 'Primary Font', fallback, sans-serif
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  // Visibility toggle for public/private
  const VisibilityField = () => {
    return (
      <FormField
        control={form.control}
        name="isPublic"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {field.value ? 'Public Theme' : 'Private Theme'}
              </FormLabel>
              <FormDescription>
                {field.value 
                  ? 'Anyone can see and use this theme'
                  : 'Only you can see and use this theme'}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!isAdmin}
              />
            </FormControl>
          </FormItem>
        )}
      />
    );
  };
  
  // Tags input
  const TagsField = () => {
    return (
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <div className="flex items-center space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {field.value?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto w-auto p-0 ml-1"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {!field.value?.length && (
                <div className="text-sm text-muted-foreground">No tags added</div>
              )}
            </div>
            <FormDescription>
              Add tags to categorize your theme (e.g., dark, light, professional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };
  
  const AIGenerateButton = () => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    
    const handleGenerate = () => {
      if (!prompt.trim()) return;
      
      setIsGenerating(true);
      
      // Mock implementation - replace with actual API call
      setTimeout(() => {
        // Example generated values
        const primaryColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        const accentColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        const backgroundColor = '#ffffff';
        const textColor = '#111827';
        
        form.setValue('primaryColor', primaryColor);
        form.setValue('accentColor', accentColor);
        form.setValue('backgroundColor', backgroundColor);
        form.setValue('textColor', textColor);
        
        // Add a tag for AI generated
        const currentTags = form.getValues().tags || [];
        if (!currentTags.includes('ai-generated')) {
          form.setValue('tags', [...currentTags, 'ai-generated']);
        }
        
        // Add some of the prompt words as tags
        const promptWords = prompt.split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3);
          
        promptWords.forEach(word => {
          const currentTags = form.getValues().tags || [];
          if (!currentTags.includes(word)) {
            form.setValue('tags', [...currentTags, word]);
          }
        });
        
        setIsGenerating(false);
        setAiDialogOpen(false);
        
        toast({
          title: 'Theme generated',
          description: 'AI has generated a theme based on your prompt.',
        });
      }, 1500);
    };
    
    return (
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Theme with AI</DialogTitle>
            <DialogDescription>
              Describe your desired theme and our AI will generate color palettes and styles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Describe your theme... e.g., 'Ocean blue theme with calm colors for a meditation app'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-32"
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {prompt.length > 0 ? `${prompt.length} characters` : 'Enter a description'}
              </div>
              {prompt.length < 10 && prompt.length > 0 && (
                <div className="text-sm text-yellow-500">
                  Add more detail for better results
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAiDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || prompt.length < 5 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin mr-2">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  const isSubmitting = createThemeMutation.isPending || updateThemeMutation.isPending;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditMode ? `Edit Theme: ${theme.name}` : 'Create New Theme'}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Update the properties of your existing theme'
              : 'Design a new theme to customize the appearance of the application'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>
      </div>
      
      {previewMode && <ThemePreview />}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Theme" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name for your theme
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
                        <Input placeholder="A brief description..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Describe the purpose or style of this theme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <VisibilityField />
              <TagsField />
              
              <div className="flex justify-center mt-6">
                <AIGenerateButton />
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <ColorPickerField 
                  name="primaryColor" 
                  label="Primary Color" 
                  description="Used for main UI elements like buttons and headers"
                />
                
                <ColorPickerField 
                  name="accentColor" 
                  label="Accent Color" 
                  description="Used for highlights and secondary elements"
                />
              </div>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <ColorPickerField 
                  name="backgroundColor" 
                  label="Background Color" 
                  description="The main background color of the application"
                />
                
                <ColorPickerField 
                  name="textColor" 
                  label="Text Color" 
                  description="The primary color used for text content"
                />
              </div>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <BorderRadiusField />
                <FontFamilyField />
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-6">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Advanced Settings</AlertTitle>
                <AlertDescription>
                  These settings are for advanced users and allow more granular control over the theme.
                </AlertDescription>
              </Alert>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tokens">
                  <AccordionTrigger>Custom Tokens</AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground text-sm mb-2">
                        Custom tokens are stored as CSS variables and can be used throughout the application.
                        You can edit these in the theme JSON directly.
                      </p>
                      <Textarea
                        rows={8}
                        value={JSON.stringify(form.getValues().tokens || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            form.setValue('tokens', parsed);
                          } catch (err) {
                            // Don't update if JSON is invalid
                          }
                        }}
                        className="font-mono text-sm"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="inheritance">
                  <AccordionTrigger>Theme Inheritance</AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground text-sm mb-4">
                        Themes can inherit properties from a parent theme. When properties are missing,
                        they'll be taken from the parent theme.
                      </p>
                      <div className="text-sm">
                        Parent theme selection not yet implemented.
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
          
          <Separator />
          
          <div className="flex justify-between">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex space-x-2">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Clone the current theme to a new form
                    form.reset({
                      ...form.getValues(),
                      name: `Copy of ${form.getValues().name}`,
                      parentThemeId: theme.id,
                    });
                    
                    // Could add logic here to switch to "create" mode
                    toast({
                      title: 'Theme cloned',
                      description: 'You are now editing a copy of the original theme.',
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </Button>
              )}
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2">
                      <Paintbrush className="h-4 w-4" />
                    </div>
                    <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Theme' : 'Create Theme'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ThemeEditor;