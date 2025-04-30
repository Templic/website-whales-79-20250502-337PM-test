import React, { useState, useEffect } from 'react';
import { Theme, InsertTheme } from '../../../shared/schema';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeAPI } from '@/hooks/useThemeAPI';
import { HexColorPicker } from 'react-colorful';
import { useToast } from '@/hooks/use-toast';

import {
  Palette,
  Save,
  PlusCircle,
  X,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sliders
} from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ThemeEditorProps {
  theme?: Theme;
  isNew?: boolean;
  onSave?: (theme: Theme) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  previewClass?: string;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  previewClass,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleChange = (color: string) => {
    onChange(color);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              "w-5 h-5 rounded-full border cursor-pointer transition-all",
              previewClass
            )}
            style={{ backgroundColor: value }}
            onClick={() => setIsOpen(true)}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-28 h-8 text-xs"
          />
        </div>
      </div>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div 
            className="w-full h-10 rounded-md cursor-pointer flex items-center justify-between px-4 border"
            style={{ backgroundColor: value }}
          >
            <span className="text-sm font-medium" style={{ 
              color: isLightColor(value) ? '#000000' : '#ffffff',
              mixBlendMode: 'difference'
            }}>
              {value}
            </span>
            <Palette className="h-4 w-4" style={{ 
              color: isLightColor(value) ? '#000000' : '#ffffff',
              mixBlendMode: 'difference'
            }} />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <HexColorPicker color={value} onChange={handleChange} />
          <div className="grid grid-cols-5 gap-1 mt-2">
            {presetColors.map((color) => (
              <div
                key={color}
                className="w-6 h-6 rounded-md cursor-pointer border"
                style={{ backgroundColor: color }}
                onClick={() => {
                  handleChange(color);
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Helper to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Remove the hash if it exists
  color = color.replace('#', '');
  
  // Handle hex shorthand (e.g. #FFF)
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // YIQ equation to determine brightness
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128;
};

// Preset colors for quick selection
const presetColors = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', 
  '#6c757d', '#495057', '#343a40', '#212529', '#000000',
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#831843', '#1e293b'
];

const ThemeEditor: React.FC<ThemeEditorProps> = ({
  theme,
  isNew = false,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const { useCreateTheme, useUpdateTheme } = useThemeAPI();
  const createThemeMutation = useCreateTheme();
  const updateThemeMutation = useUpdateTheme();
  
  // Form validation schema
  const themeFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name is too long"),
    description: z.string().max(200, "Description is too long").optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    borderRadius: z.string().optional(),
    fontFamily: z.string().optional(),
    isPublic: z.boolean().default(false),
  });
  
  // Create form with validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof themeFormSchema>>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: theme ? {
      name: theme.name,
      description: theme.description || '',
      primaryColor: theme.primaryColor || '#3b82f6',
      accentColor: theme.accentColor || '#10b981',
      backgroundColor: theme.backgroundColor || '#ffffff',
      textColor: theme.textColor || '#000000',
      borderRadius: theme.borderRadius || '0.5rem',
      fontFamily: theme.fontFamily || '',
      isPublic: theme.isPublic || false,
    } : {
      name: '',
      description: '',
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      accentColor: '#10b981',
      textColor: '#000000',
      borderRadius: '0.5rem',
      fontFamily: '',
      isPublic: false,
    }
  });
  
  // Track tags as a separate state since they're not supported by react-hook-form directly
  const [tags, setTags] = useState<string[]>(theme?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  // Track if form is submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track if theme preview is shown in "Preview" tab
  const [showPreview, setShowPreview] = useState(false);
  
  // Track current form values for preview
  const formValues = watch();
  
  // Update preview tab when form values change
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  
  // Update the form when the theme changes (e.g. prop update)
  useEffect(() => {
    if (theme) {
      reset({
        name: theme.name,
        description: theme.description || '',
        primaryColor: theme.primaryColor || '#3b82f6',
        accentColor: theme.accentColor || '#10b981',
        backgroundColor: theme.backgroundColor || '#ffffff',
        textColor: theme.textColor || '#000000',
        borderRadius: theme.borderRadius || '0.5rem',
        fontFamily: theme.fontFamily || '',
        isPublic: theme.isPublic || false,
      });
      setTags(theme.tags || []);
    }
  }, [theme, reset]);
  
  // Update preview theme whenever form values change
  useEffect(() => {
    const updatedTheme = {
      ...(theme || {}),
      name: formValues.name,
      description: formValues.description,
      primaryColor: formValues.primaryColor,
      accentColor: formValues.accentColor,
      backgroundColor: formValues.backgroundColor,
      textColor: formValues.textColor,
      borderRadius: formValues.borderRadius,
      fontFamily: formValues.fontFamily,
      isPublic: formValues.isPublic,
      tags: tags,
    } as Theme;
    
    setPreviewTheme(updatedTheme);
  }, [formValues, tags, theme]);
  
  // Handle adding a tag
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (tags.includes(newTag.trim())) {
        toast({
          title: "Duplicate tag",
          description: "This tag already exists",
          variant: "destructive",
        });
        return;
      }
      
      if (tags.length >= 10) {
        toast({
          title: "Too many tags",
          description: "Maximum 10 tags allowed",
          variant: "destructive",
        });
        return;
      }
      
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof themeFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      const themeData = {
        ...data,
        tags,
      };
      
      if (isNew) {
        // Create new theme
        const newTheme = await createThemeMutation.mutateAsync(themeData as InsertTheme);
        
        toast({
          title: "Theme created",
          description: "Your theme has been created successfully",
        });
        
        if (onSave) {
          onSave(newTheme);
        }
      } else if (theme) {
        // Update existing theme
        const updatedTheme = await updateThemeMutation.mutateAsync({
          ...theme,
          ...themeData,
        } as Theme);
        
        toast({
          title: "Theme updated",
          description: "Your theme has been updated successfully",
        });
        
        if (onSave) {
          onSave(updatedTheme);
        }
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render theme preview
  const renderThemePreview = () => {
    if (!previewTheme) return null;
    
    return (
      <div className="space-y-8">
        <div
          className="w-full h-64 rounded-lg overflow-hidden border"
          style={{ backgroundColor: previewTheme.backgroundColor }}
        >
          <div className="p-6">
            <div className="mb-4">
              <h2 
                style={{ color: previewTheme.textColor }}
                className="text-2xl font-bold mb-2"
              >
                {previewTheme.name || 'Theme Preview'}
              </h2>
              <p 
                style={{ color: previewTheme.textColor }}
                className="opacity-80"
              >
                {previewTheme.description || 'This is how your theme will look.'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div
                className="p-3 rounded"
                style={{ 
                  backgroundColor: previewTheme.primaryColor,
                  borderRadius: previewTheme.borderRadius || '0.5rem',
                }}
              >
                <p 
                  className="font-medium" 
                  style={{ 
                    color: isLightColor(previewTheme.primaryColor) ? '#000000' : '#ffffff',
                  }}
                >
                  Primary Color
                </p>
              </div>
              
              <div
                className="p-3 rounded"
                style={{ 
                  backgroundColor: previewTheme.accentColor,
                  borderRadius: previewTheme.borderRadius || '0.5rem',
                }}
              >
                <p 
                  className="font-medium" 
                  style={{ 
                    color: isLightColor(previewTheme.accentColor) ? '#000000' : '#ffffff',
                  }}
                >
                  Accent Color
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                style={{ 
                  backgroundColor: previewTheme.primaryColor,
                  color: isLightColor(previewTheme.primaryColor) ? '#000000' : '#ffffff',
                  borderRadius: previewTheme.borderRadius || '0.5rem',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Primary Button
              </button>
              
              <button
                style={{ 
                  backgroundColor: 'transparent',
                  color: previewTheme.textColor,
                  borderRadius: previewTheme.borderRadius || '0.5rem',
                  padding: '0.5rem 1rem',
                  border: `1px solid ${previewTheme.accentColor}`,
                  cursor: 'pointer',
                }}
              >
                Secondary Button
              </button>
            </div>
            
            <div 
              className="p-3 rounded"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: previewTheme.borderRadius || '0.5rem',
              }}
            >
              <p style={{ color: previewTheme.textColor }}>
                Text will appear like this on your theme's background.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Theme Properties</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{previewTheme.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: previewTheme.primaryColor }}
                  />
                  <span>{previewTheme.primaryColor}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accent Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: previewTheme.accentColor }}
                  />
                  <span>{previewTheme.accentColor}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Background Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: previewTheme.backgroundColor }}
                  />
                  <span>{previewTheme.backgroundColor}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Text Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: previewTheme.textColor }}
                  />
                  <span>{previewTheme.textColor}</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Border Radius:</span>
                <span>{previewTheme.borderRadius}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visibility:</span>
                <div className="flex items-center gap-1">
                  {previewTheme.isPublic ? (
                    <>
                      <Globe className="h-3.5 w-3.5" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Private</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Tags</h3>
            {previewTheme.tags && previewTheme.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {previewTheme.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tags added</p>
            )}
            
            {previewTheme.description && (
              <>
                <h3 className="text-lg font-medium mt-4 mb-2">Description</h3>
                <p className="text-muted-foreground">{previewTheme.description}</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    {...register('name')} 
                    placeholder="My Custom Theme" 
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    {...register('description')} 
                    placeholder="A brief description of your theme" 
                    className="resize-none" 
                    rows={3} 
                  />
                  {errors.description && (
                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 rounded-full"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex">
                    <Input
                      type="text"
                      placeholder="Add a tag (press Enter)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    Press Enter to add. Maximum 10 tags.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={watch('isPublic')}
                    onCheckedChange={(checked) => setValue('isPublic', checked)}
                  />
                  <Label htmlFor="isPublic" className="flex items-center gap-2">
                    {watch('isPublic') ? (
                      <>
                        <Globe className="h-4 w-4" />
                        Public theme (visible to all users)
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Private theme (only visible to you)
                      </>
                    )}
                  </Label>
                </div>
              </div>
              
              {/* Colors and Styling */}
              <div className="space-y-4">
                <Accordion type="single" collapsible defaultValue="colors">
                  <AccordionItem value="colors">
                    <AccordionTrigger>Colors</AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <ColorPickerField
                          label="Primary Color"
                          value={watch('primaryColor')}
                          onChange={(color) => setValue('primaryColor', color, { shouldDirty: true })}
                          previewClass="ring-offset-background"
                        />
                        {errors.primaryColor && (
                          <p className="text-destructive text-sm mt-1">{errors.primaryColor.message}</p>
                        )}
                        
                        <ColorPickerField
                          label="Accent Color"
                          value={watch('accentColor')}
                          onChange={(color) => setValue('accentColor', color, { shouldDirty: true })}
                          previewClass="ring-offset-background"
                        />
                        {errors.accentColor && (
                          <p className="text-destructive text-sm mt-1">{errors.accentColor.message}</p>
                        )}
                        
                        <ColorPickerField
                          label="Background Color"
                          value={watch('backgroundColor')}
                          onChange={(color) => setValue('backgroundColor', color, { shouldDirty: true })}
                          previewClass="ring-offset-background"
                        />
                        {errors.backgroundColor && (
                          <p className="text-destructive text-sm mt-1">{errors.backgroundColor.message}</p>
                        )}
                        
                        <ColorPickerField
                          label="Text Color"
                          value={watch('textColor')}
                          onChange={(color) => setValue('textColor', color, { shouldDirty: true })}
                          previewClass="ring-offset-background"
                        />
                        {errors.textColor && (
                          <p className="text-destructive text-sm mt-1">{errors.textColor.message}</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="styling">
                    <AccordionTrigger>Additional Styling</AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="borderRadius">Border Radius</Label>
                          <div className="flex gap-2">
                            <Input
                              id="borderRadius"
                              {...register('borderRadius')}
                              placeholder="0.5rem"
                            />
                            <Select
                              value={watch('borderRadius')}
                              onValueChange={(value) => setValue('borderRadius', value, { shouldDirty: true })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Presets" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                <SelectItem value="0.25rem">Small</SelectItem>
                                <SelectItem value="0.5rem">Medium</SelectItem>
                                <SelectItem value="1rem">Large</SelectItem>
                                <SelectItem value="9999px">Full</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="fontFamily">Font Family</Label>
                          <Input
                            id="fontFamily"
                            {...register('fontFamily')}
                            placeholder="Inter, system-ui, sans-serif"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter a comma-separated list of font families
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
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
                disabled={isSubmitting || !isDirty}
                className="min-w-24"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isNew ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isNew ? 'Create Theme' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="preview">
          {renderThemePreview()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThemeEditor;