/**
 * AI Theme Generator Component
 * 
 * This component provides an interface for generating custom themes
 * using natural language prompts powered by AI.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ThemeTokens } from '@shared/theme/tokens';
import { useTheme } from '@shared/theme/ThemeContext';
import { ThemePreviewPanel } from '@shared/theme/ThemePreviewPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PaintBucket, Save, Wand2 } from 'lucide-react';

interface AIThemeGeneratorProps {
  onSaveTheme?: (tokens: ThemeTokens, metadata: any) => void;
}

export function AIThemeGenerator({ onSaveTheme }: AIThemeGeneratorProps) {
  const { toast } = useToast();
  const { setTokens } = useTheme();
  
  // State
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('system');
  const [style, setStyle] = useState('vibrant');
  const [themeName, setThemeName] = useState('');
  const [generatedTheme, setGeneratedTheme] = useState<ThemeTokens | null>(null);
  
  // Theme generation mutation
  const generateThemeMutation = useMutation({
    mutationFn: async (data: { prompt: string; mode: string; style: string }) => {
      return apiRequest('/api/themes/ai/generate', {
        method: 'POST',
        data,
      });
    },
    onSuccess: (data) => {
      // Extract the theme tokens
      const { tokens, prompt } = data;
      
      // Update theme name if it's provided in the response
      if (tokens.metadata?.name) {
        setThemeName(tokens.metadata.name);
      } else {
        // Generate a name based on the prompt
        setThemeName(`AI Theme - ${new Date().toLocaleDateString()}`);
      }
      
      // Save the generated theme tokens
      setGeneratedTheme(tokens);
      
      // Apply the theme for preview
      setTokens(tokens);
      
      toast({
        title: 'Theme generated',
        description: 'Your AI-generated theme is ready for preview!',
      });
    },
    onError: (error) => {
      console.error('Error generating theme:', error);
      toast({
        title: 'Error generating theme',
        description: 'There was a problem generating your theme. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle theme generation form submission
  const handleGenerateTheme = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: 'Please enter a prompt',
        description: 'You need to provide a description of the theme you want to generate.',
        variant: 'destructive',
      });
      return;
    }
    
    generateThemeMutation.mutate({
      prompt,
      mode,
      style,
    });
  };
  
  // Handle theme saving
  const handleSaveTheme = () => {
    if (!generatedTheme) {
      toast({
        title: 'No theme to save',
        description: 'You need to generate a theme first before saving it.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!themeName.trim()) {
      toast({
        title: 'Please enter a name',
        description: 'You need to provide a name for your theme before saving it.',
        variant: 'destructive',
      });
      return;
    }
    
    // Call the onSaveTheme callback if provided
    if (onSaveTheme) {
      const metadata = {
        name: themeName,
        prompt,
        mode,
        style,
      };
      
      onSaveTheme(generatedTheme, metadata);
    } else {
      toast({
        title: 'Theme ready',
        description: 'Your theme is ready to use.',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Theme Generator
          </CardTitle>
          <CardDescription>
            Create custom themes by describing them in plain language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateTheme} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe your theme</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'A calm ocean theme with blues and teals, perfect for a meditation app'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mode">Theme Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System (Both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button
                type="submit"
                className="gap-2"
                disabled={generateThemeMutation.isPending || !prompt.trim()}
              >
                {generateThemeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Generate Theme
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {generateThemeMutation.isPending && (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Generating your theme...</p>
              <p className="text-sm text-muted-foreground">
                Our AI is crafting a unique theme based on your description.
                This may take a few seconds.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {generatedTheme && !generateThemeMutation.isPending && (
        <div className="space-y-6">
          <Alert>
            <PaintBucket className="h-4 w-4" />
            <AlertTitle>Theme Generated</AlertTitle>
            <AlertDescription>
              Your custom theme has been generated and applied. You can preview it below.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your generated theme looks with various UI components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input
                  id="theme-name"
                  placeholder="Give your theme a name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  required
                />
              </div>
              
              <ThemePreviewPanel theme={generatedTheme} />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveTheme} 
                className="gap-2"
                disabled={!themeName.trim()}
              >
                <Save className="h-4 w-4" />
                Save Theme
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}