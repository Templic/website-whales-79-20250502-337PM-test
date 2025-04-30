/**
 * AI Theme Generator Component
 * 
 * This component leverages OpenAI to generate theme tokens based on user input.
 * Features include:
 * - Text prompt-based theme generation
 * - Theme refinement through iterative prompts
 * - Accessibility analysis of generated themes
 * - Semantic color analysis
 * - Preview of generated themes
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '@shared/theme/ThemeContext';
import { ThemePreviewPanel } from '@shared/theme/ThemePreviewPanel';
import { checkContrastRatio } from '@shared/theme/accessibility';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Download,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Wand2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Theme } from '@shared/schema';

/**
 * Example prompts to help users get started
 */
const EXAMPLE_PROMPTS = [
  "A calming ocean blue theme with soft accent colors for a meditation app",
  "A vibrant, high-contrast theme inspired by cyberpunk aesthetics",
  "A professional theme with muted dark colors for a financial dashboard",
  "A playful theme with gradients of purple and pink for a children's game",
  "An accessible theme with earthy tones for a nature conservation website",
  "A minimalist monochrome theme with a single accent color for a photography portfolio"
];

// Interface for component props
interface AIThemeGeneratorProps {
  onThemeGenerated?: (theme: Theme) => void;
  onThemeSaved?: (theme: Theme) => void;
  defaultPrompt?: string;
  compact?: boolean;
}

export const AIThemeGenerator = ({
  onThemeGenerated,
  onThemeSaved,
  defaultPrompt = '',
  compact = false
}: AIThemeGeneratorProps) => {
  // Access theme context
  const { mode, setMode } = useTheme();
  
  // State for user prompt and options
  const [prompt, setPrompt] = useState<string>(defaultPrompt);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Options for generation
  const [enhanceAccessibility, setEnhanceAccessibility] = useState<boolean>(true);
  const [creativityLevel, setCreativityLevel] = useState<number>(50); // 0-100
  const [includeSemanticAnalysis, setIncludeSemanticAnalysis] = useState<boolean>(true);
  
  // Generated theme state
  const [generatedTheme, setGeneratedTheme] = useState<Theme | null>(null);
  const [themeHistory, setThemeHistory] = useState<Theme[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // State for saving theme
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [themeName, setThemeName] = useState<string>('');
  const [themeDescription, setThemeDescription] = useState<string>('');
  
  // Get query client for cache updates
  const queryClient = useQueryClient();
  
  // Generate theme mutation
  const generateThemeMutation = useMutation({
    mutationFn: async (generationPrompt: string) => {
      setProcessingStage('Analyzing prompt...');
      
      const creativityParam = creativityLevel / 100; // Normalize to 0-1
      
      const response = await apiRequest('/api/themes/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: generationPrompt,
          options: {
            enhanceAccessibility,
            creativity: creativityParam,
            includeSemanticAnalysis
          }
        }),
      });
      
      return response as Theme;
    },
    onMutate: () => {
      setGenerationError(null);
      setProcessingStage('Initializing AI...');
    },
    onSuccess: (data) => {
      setProcessingStage('Finalizing theme...');
      
      // Add to history and update current
      const newHistory = [...themeHistory];
      
      // If we've gone back in history, remove everything after current index
      if (historyIndex >= 0 && historyIndex < themeHistory.length - 1) {
        newHistory.splice(historyIndex + 1);
      }
      
      newHistory.push(data);
      
      setThemeHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setGeneratedTheme(data);
      
      // Set default name and description
      if (!themeName) {
        setThemeName(data.name || `AI Generated Theme`);
      }
      if (!themeDescription) {
        setThemeDescription(data.description || `Generated from prompt: ${prompt}`);
      }
      
      // Call the callback if provided
      if (onThemeGenerated) {
        onThemeGenerated(data);
      }
      
      setProcessingStage(null);
    },
    onError: (error) => {
      console.error('Error generating theme:', error);
      setGenerationError('Failed to generate theme. Please try again or modify your prompt.');
      setProcessingStage(null);
    }
  });
  
  // Save theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async (themeToSave: Partial<Theme>) => {
      return await apiRequest('/api/themes', {
        method: 'POST',
        body: JSON.stringify(themeToSave),
      });
    },
    onMutate: () => {
      setIsSaving(true);
      setSaveSuccess(false);
    },
    onSuccess: (data) => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      
      // Call the callback if provided
      if (onThemeSaved) {
        onThemeSaved(data as Theme);
      }
      
      // Reset form after small delay
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    },
    onError: (error) => {
      console.error('Error saving theme:', error);
      setSaveSuccess(false);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });
  
  // Go back in theme history
  const handlePreviousTheme = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGeneratedTheme(themeHistory[newIndex]);
    }
  }, [historyIndex, themeHistory]);
  
  // Go forward in theme history
  const handleNextTheme = useCallback(() => {
    if (historyIndex < themeHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGeneratedTheme(themeHistory[newIndex]);
    }
  }, [historyIndex, themeHistory]);
  
  // Select an example prompt
  const handleSelectExample = useCallback((index: number) => {
    setSelectedExampleIndex(index);
    setPrompt(EXAMPLE_PROMPTS[index]);
  }, []);
  
  // Generate theme from current prompt
  const handleGenerateTheme = useCallback(() => {
    if (!prompt.trim()) return;
    
    generateThemeMutation.mutate(prompt);
  }, [prompt, generateThemeMutation]);
  
  // Refine the current theme
  const handleRefineTheme = useCallback(() => {
    if (!generatedTheme) return;
    
    const refinementPrompt = `Refine this theme: ${JSON.stringify(generatedTheme.tokens)}. 
    ${prompt}. Make it more ${enhanceAccessibility ? 'accessible and ' : ''}
    ${creativityLevel > 70 ? 'creative and unique' : 
       creativityLevel > 30 ? 'balanced and harmonious' : 
       'subtle and conventional'}.`;
    
    generateThemeMutation.mutate(refinementPrompt);
  }, [prompt, generatedTheme, enhanceAccessibility, creativityLevel, generateThemeMutation]);
  
  // Save the current theme
  const handleSaveTheme = useCallback(() => {
    if (!generatedTheme || !generatedTheme.tokens) return;
    
    const themeToSave = {
      name: themeName || `AI Generated Theme`,
      description: themeDescription || `Generated from prompt: ${prompt}`,
      tokens: generatedTheme.tokens,
      category: 'ai-generated',
      isPublic: false,
    };
    
    saveThemeMutation.mutate(themeToSave);
  }, [generatedTheme, themeName, themeDescription, prompt, saveThemeMutation]);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI Theme Generator
          </CardTitle>
          <CardDescription>
            Generate custom themes using AI based on your description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your desired theme</Label>
            <Textarea 
              id="prompt"
              placeholder="e.g., A calming blue theme with high contrast for accessibility"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>
          
          {/* Example Prompts */}
          {!compact && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Or try an example:</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                  <Badge 
                    key={index}
                    variant={selectedExampleIndex === index ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSelectExample(index)}
                  >
                    {examplePrompt.substring(0, 30)}...
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Advanced Options */}
          {!compact && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="accessibility" className="text-sm">Enhance Accessibility</Label>
                <Switch 
                  id="accessibility"
                  checked={enhanceAccessibility}
                  onCheckedChange={setEnhanceAccessibility}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="creativity" className="text-sm">Creativity Level</Label>
                  <span className="text-xs text-muted-foreground">
                    {creativityLevel < 30 ? 'Conservative' : 
                     creativityLevel < 70 ? 'Balanced' : 'Experimental'}
                  </span>
                </div>
                <Slider 
                  id="creativity"
                  min={0}
                  max={100}
                  step={5}
                  value={[creativityLevel]}
                  onValueChange={(values) => setCreativityLevel(values[0])}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="semantic" className="text-sm">Include Semantic Analysis</Label>
                <Switch 
                  id="semantic"
                  checked={includeSemanticAnalysis}
                  onCheckedChange={setIncludeSemanticAnalysis}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!generatedTheme || generateThemeMutation.isPending}
              onClick={handleRefineTheme}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refine
            </Button>
            
            {themeHistory.length > 1 && (
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyIndex <= 0}
                  onClick={handlePreviousTheme}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyIndex >= themeHistory.length - 1}
                  onClick={handleNextTheme}
                >
                  →
                </Button>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleGenerateTheme}
            disabled={!prompt.trim() || generateThemeMutation.isPending}
          >
            {generateThemeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingStage || 'Generating...'}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Theme
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Error Message */}
      {generationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generationError}</AlertDescription>
        </Alert>
      )}
      
      {/* Generated Theme Preview */}
      {generatedTheme && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Theme</CardTitle>
            <CardDescription>
              Preview of your AI-generated theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePreviewPanel 
              themeTokens={generatedTheme.tokens || {}}
              displayMode={mode}
            />
            
            {/* Theme Properties (if not in compact mode) */}
            {!compact && generatedTheme.tokens && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Color Tokens</h4>
                  <div className="space-y-2">
                    {Object.entries(generatedTheme.tokens)
                      .filter(([key, value]) => 
                        typeof value === 'string' && (
                          value.startsWith('#') || 
                          value.startsWith('hsl') || 
                          value.startsWith('rgb')
                        )
                      )
                      .slice(0, 8) // Limit to first 8 colors
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded-md border"
                            style={{ backgroundColor: value as string }}
                          />
                          <div className="text-sm truncate">{key}:</div>
                          <div className="text-sm font-mono truncate">{value as string}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Accessibility</h4>
                  <div className="space-y-1">
                    {generatedTheme.tokens.primary && (
                      <div className="text-sm">
                        Primary on Background: 
                        {checkContrastRatio(
                          generatedTheme.tokens.primary as string, 
                          generatedTheme.tokens.background as string
                        ) >= 4.5 ? (
                          <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-700">
                            Good
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 hover:text-yellow-700">
                            Poor
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {generatedTheme.tokens.text && generatedTheme.tokens.background && (
                      <div className="text-sm">
                        Text on Background: 
                        {checkContrastRatio(
                          generatedTheme.tokens.text as string, 
                          generatedTheme.tokens.background as string
                        ) >= 4.5 ? (
                          <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-700">
                            Good
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 hover:text-yellow-700">
                            Poor
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="text-sm mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                      >
                        Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Save Theme Form */}
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-name">Theme Name</Label>
                <Input 
                  id="theme-name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="My AI Generated Theme"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme-description">Description</Label>
                <Textarea 
                  id="theme-description"
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                  placeholder="A brief description of your theme"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex w-full justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => {/* TODO: Add export functionality */}}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export theme as JSON or CSS</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleSaveTheme}
                disabled={isSaving || !themeName.trim()}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saveSuccess ? 'Saved!' : 'Save Theme'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AIThemeGenerator;