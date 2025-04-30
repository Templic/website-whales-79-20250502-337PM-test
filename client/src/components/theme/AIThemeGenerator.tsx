/**
 * AI Theme Generator Component
 * 
 * This component provides an AI-powered interface for generating themes.
 * It uses OpenAI to analyze design preferences and generate theme tokens.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeTokens } from '@shared/theme/tokens';
import { ThemeViewer } from './ThemeViewer';
import { Check, Loader2, Paintbrush, Sparkles, Wand2 } from 'lucide-react';

// Form schema
const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters",
  }),
  name: z.string().min(3, {
    message: "Name must be at least 3 characters",
  }),
  baseStyle: z.enum(['modern', 'classic', 'playful', 'corporate', 'minimal']),
  colorPreference: z.enum(['warm', 'cool', 'neutral', 'vibrant', 'pastel', 'dark', 'light']),
  accessibility: z.boolean().default(true),
  complexity: z.number().min(1).max(5),
  description: z.string().optional(),
});

// Types
type AIThemeFormValues = z.infer<typeof formSchema>;

interface AIThemeGeneratorProps {
  onThemeGenerated?: (theme: ThemeTokens) => void;
  onSaveTheme?: (theme: ThemeTokens, metadata: AIThemeFormValues) => void;
}

export function AIThemeGenerator({
  onThemeGenerated,
  onSaveTheme,
}: AIThemeGeneratorProps) {
  const { toast } = useToast();
  const [generatedTheme, setGeneratedTheme] = useState<ThemeTokens | null>(null);
  const [AIInsights, setAIInsights] = useState<string[]>([]);
  const [isViewingTheme, setIsViewingTheme] = useState(false);
  
  // Form definition
  const form = useForm<AIThemeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      name: '',
      baseStyle: 'modern',
      colorPreference: 'neutral',
      accessibility: true,
      complexity: 3,
      description: '',
    },
  });
  
  // Generate theme mutation
  const generateThemeMutation = useMutation({
    mutationFn: async (values: AIThemeFormValues) => {
      return apiRequest('/api/themes/ai/generate', {
        method: 'POST',
        data: values,
      });
    },
    onSuccess: (data) => {
      setGeneratedTheme(data.theme);
      setAIInsights(data.insights || []);
      
      toast({
        title: 'Theme generated',
        description: 'Your AI-powered theme has been created.',
      });
      
      if (onThemeGenerated) {
        onThemeGenerated(data.theme);
      }
    },
    onError: (error) => {
      console.error('Error generating theme:', error);
      toast({
        title: 'Generation failed',
        description: 'There was a problem generating your theme. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: AIThemeFormValues) {
    generateThemeMutation.mutate(values);
  }
  
  // Handle save theme
  function handleSaveTheme() {
    if (!generatedTheme) return;
    
    if (onSaveTheme) {
      onSaveTheme(generatedTheme, form.getValues());
      
      toast({
        title: 'Theme saved',
        description: 'Your AI-generated theme has been saved to your library.',
      });
    }
  }
  
  const examplePrompts = [
    "A calming, ocean-inspired theme with blue tones and smooth transitions",
    "Corporate theme with professional look and high accessibility for financial app",
    "Playful and vibrant theme inspired by summer fruits with high contrast",
    "Minimalist dark theme with subtle accent colors for a coding environment",
    "Nature-inspired green theme with earthy tones and organic feel",
  ];

  return (
    <div className="space-y-8">
      {isViewingTheme && generatedTheme ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI-Generated Theme Preview</CardTitle>
                <CardDescription>
                  Preview your generated theme and its components
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsViewingTheme(false)}
              >
                Back to Editor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ThemeViewer
              themeId={9999} // Placeholder ID for preview
              initialTokens={generatedTheme}
              readOnly
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Theme Generator
            </CardTitle>
            <CardDescription>
              Generate custom themes using AI and your design preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-base">Example Prompts</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examplePrompts.map((prompt, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        className="justify-start h-auto py-2 px-3 text-left"
                        onClick={() => {
                          form.setValue('prompt', prompt);
                          form.setValue('name', `AI Theme ${i + 1}`);
                        }}
                      >
                        <span className="truncate">{prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the theme you want to generate... (e.g., A calming ocean-inspired theme with blue tones and smooth transitions)"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about colors, style, and the mood you want to convey
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My AI Theme" {...field} />
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="A brief description of your theme" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="baseStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Style</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a base style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The foundational style that will influence the design
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="colorPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Preference</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a color preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="warm">Warm Colors</SelectItem>
                            <SelectItem value="cool">Cool Colors</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                            <SelectItem value="pastel">Pastel</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The color palette direction for your theme
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design Complexity (1-5)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Simple</span>
                              <span>Complex</span>
                            </div>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="py-2"
                            />
                            <div className="flex justify-between">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <span 
                                  key={value} 
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                                    field.value >= value 
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Higher complexity means more detailed styles and variations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accessibility"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Accessibility Optimized</FormLabel>
                        <div className="flex items-center space-x-2 mt-2">
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <Label className="text-sm font-normal text-muted-foreground">
                            Ensure theme meets WCAG accessibility standards
                          </Label>
                        </div>
                        <FormDescription className="mt-2">
                          Optimizes for color contrast, readability, and assistive technologies
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={generateThemeMutation.isPending}
                    className="gap-2"
                  >
                    {generateThemeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate Theme
                  </Button>
                </div>
              </form>
            </Form>
            
            {generatedTheme && (
              <div className="mt-8 border-t pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Generated Theme</h3>
                  <p className="text-muted-foreground">
                    Your AI-generated theme based on your preferences
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    {generatedTheme.colors && Object.entries(generatedTheme.colors).slice(0, 12).map(([key, value]) => (
                      <div key={key} className="space-y-2 text-center">
                        <div 
                          className="h-12 w-full rounded-md border"
                          style={{ backgroundColor: value as string }}
                        />
                        <div className="text-xs font-medium truncate">{key}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsViewingTheme(true)}
                      className="gap-2"
                    >
                      <Paintbrush className="h-4 w-4" />
                      Preview Theme
                    </Button>
                    
                    <Button
                      onClick={handleSaveTheme}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Save Theme
                    </Button>
                  </div>
                </div>
                
                {AIInsights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">AI Design Insights</h3>
                    <ul className="space-y-2">
                      {AIInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2 p-3 border rounded-md">
                          <div className="h-5 w-5 mt-0.5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-3 w-3" />
                          </div>
                          <p className="text-sm">{insight}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}