/**
 * Theme TypeScript Integration Component
 * 
 * This component integrates the theme system with the TypeScript error management system.
 * It provides tools for analyzing and fixing theme-related TypeScript errors.
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Code, FileCode, FileFix, Loader2, TerminalSquare } from 'lucide-react';

interface ThemeTypeScriptIntegrationProps {
  onGenerateTypes?: () => void;
  onFixErrors?: () => void;
}

export function ThemeTypeScriptIntegration({
  onGenerateTypes,
  onFixErrors,
}: ThemeTypeScriptIntegrationProps) {
  const { toast } = useToast();
  const [autoFix, setAutoFix] = useState(true);
  const [fixAll, setFixAll] = useState(false);
  
  // Fetch theme-related TypeScript errors
  const { data: errors, isLoading: isLoadingErrors, refetch: refetchErrors } = useQuery({
    queryKey: ['/api/typescript-simple/theme-errors'],
    queryFn: async () => {
      return apiRequest('/api/typescript-simple/theme-errors');
    },
  });
  
  // Generate theme type definitions
  const generateTypesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/typescript-simple/generate-theme-types', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Type definitions generated',
        description: 'Theme type definitions have been successfully generated.',
      });
      
      refetchErrors();
      
      if (onGenerateTypes) {
        onGenerateTypes();
      }
    },
    onError: (error) => {
      console.error('Error generating type definitions:', error);
      toast({
        title: 'Error generating type definitions',
        description: 'There was a problem generating theme type definitions.',
        variant: 'destructive',
      });
    },
  });
  
  // Fix theme TypeScript errors
  const fixErrorsMutation = useMutation({
    mutationFn: async (options: { autoFix: boolean; fixAll: boolean }) => {
      return apiRequest('/api/typescript-simple/fix-theme-errors', {
        method: 'POST',
        data: options,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Errors fixed',
        description: `Successfully fixed ${data.fixedCount} theme-related TypeScript errors.`,
      });
      
      refetchErrors();
      
      if (onFixErrors) {
        onFixErrors();
      }
    },
    onError: (error) => {
      console.error('Error fixing TypeScript errors:', error);
      toast({
        title: 'Error fixing TypeScript errors',
        description: 'There was a problem fixing theme-related TypeScript errors.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle fix errors button click
  const handleFixErrors = () => {
    fixErrorsMutation.mutate({ autoFix, fixAll });
  };
  
  // Group errors by file
  const errorsByFile = errors?.reduce((acc, error) => {
    const file = error.file;
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(error);
    return acc;
  }, {} as Record<string, any[]>) || {};
  
  // Count errors by severity
  const errorCount = errors?.filter(e => e.severity === 'error')?.length || 0;
  const warningCount = errors?.filter(e => e.severity === 'warning')?.length || 0;
  const totalCount = errors?.length || 0;
  
  // Calculate progress
  const fixableCount = errors?.filter(e => e.fixable)?.length || 0;
  const fixablePercentage = totalCount ? Math.round((fixableCount / totalCount) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Theme TypeScript Integration
            </CardTitle>
            <CardDescription>
              Manage theme-related TypeScript types and fix errors
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => generateTypesMutation.mutate()}
              disabled={generateTypesMutation.isPending}
              className="flex items-center gap-2"
            >
              {generateTypesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCode className="h-4 w-4" />
              )}
              Generate Types
            </Button>
            <Button
              onClick={handleFixErrors}
              disabled={fixErrorsMutation.isPending || !errors?.length}
              className="flex items-center gap-2"
            >
              {fixErrorsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileFix className="h-4 w-4" />
              )}
              Fix Errors
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="errors">
          <TabsList className="mb-6">
            <TabsTrigger value="errors">
              Theme Errors
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="types">Type Definitions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="errors">
            {isLoadingErrors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-medium">No Theme TypeScript Errors</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Your theme system is working correctly with TypeScript.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{errorCount}</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{warningCount}</div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{fixableCount}</div>
                      <div className="text-sm text-muted-foreground">Auto-fixable</div>
                      <div className="mt-2">
                        <Progress value={fixablePercentage} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Accordion type="multiple" className="mt-6">
                  {Object.entries(errorsByFile).map(([file, fileErrors]) => (
                    <AccordionItem key={file} value={file}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{file.split('/').pop()}</span>
                          <span className="text-xs text-muted-foreground">{file}</span>
                          <Badge variant="outline" className="ml-auto">
                            {fileErrors.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-4 py-2">
                          {fileErrors.map((error, index) => (
                            <div 
                              key={index} 
                              className="border rounded-md p-3 hover:bg-accent/5 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 flex-shrink-0 ${
                                  error.severity === 'error' ? 'text-red-500' :
                                  error.severity === 'warning' ? 'text-yellow-500' :
                                  'text-blue-500'
                                }`}>
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{error.code}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Line {error.line}, Column {error.column}
                                    </span>
                                    {error.fixable && (
                                      <Badge variant="outline" className="bg-green-100 text-green-800 ml-auto">
                                        Auto-fixable
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-1">{error.message}</p>
                                  {error.snippet && (
                                    <div className="mt-2 bg-muted p-2 rounded-md text-sm font-mono whitespace-pre overflow-x-auto">
                                      {error.snippet}
                                    </div>
                                  )}
                                  {error.suggestion && (
                                    <div className="mt-2">
                                      <span className="text-xs font-medium">Suggestion:</span>
                                      <p className="text-sm">{error.suggestion}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="types">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Theme Token Types</CardTitle>
                  <CardDescription>
                    TypeScript definitions for theme tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <pre>{`
/**
 * ThemeTokens interface defines the structure of a theme
 */
export interface ThemeTokens {
  // Base colors
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  
  // Typography tokens
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
    lineHeight: Record<string, string>;
    letterSpacing: Record<string, string>;
  };
  
  // Component-specific tokens
  components: {
    button: Record<string, Record<string, string>>;
    card: Record<string, string>;
    // ...other components
  };
  
  // ...other token categories
}`}
                    </pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateTypesMutation.mutate()}
                    disabled={generateTypesMutation.isPending}
                  >
                    Regenerate Types
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integration with Error Management</CardTitle>
                  <CardDescription>
                    How theme types connect with the TypeScript error system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      The theme system is integrated with the TypeScript error management system,
                      allowing for automatic detection and fixing of theme-related type errors.
                    </p>
                    
                    <div className="rounded-md border p-4">
                      <h4 className="font-medium mb-2">Key Benefits</h4>
                      <ul className="space-y-2 list-disc pl-5">
                        <li>Automatic detection of theme token usage errors</li>
                        <li>Type safety for component styles</li>
                        <li>Consistent token usage across the application</li>
                        <li>Improved developer experience</li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-2 rounded-md border p-4 bg-yellow-50 text-yellow-900">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">
                        Changing the theme token structure requires regenerating types
                        to maintain TypeScript compatibility.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Error Fixing Options</CardTitle>
                    <CardDescription>
                      Configure how theme TypeScript errors are fixed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-fix">Auto-fix Errors</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically fix errors when possible
                        </p>
                      </div>
                      <Switch
                        id="auto-fix"
                        checked={autoFix}
                        onCheckedChange={setAutoFix}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="fix-all">Fix All Files</Label>
                        <p className="text-sm text-muted-foreground">
                          Fix errors in all files, not just theme files
                        </p>
                      </div>
                      <Switch
                        id="fix-all"
                        checked={fixAll}
                        onCheckedChange={setFixAll}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Type Generation</CardTitle>
                    <CardDescription>
                      Configure type generation settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emit-declarations">Emit Declaration Files</Label>
                        <p className="text-sm text-muted-foreground">
                          Generate .d.ts files for theme tokens
                        </p>
                      </div>
                      <Switch
                        id="emit-declarations"
                        checked={true}
                        disabled
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="strict-null-checks">Strict Null Checks</Label>
                        <p className="text-sm text-muted-foreground">
                          Enforce null checks in theme types
                        </p>
                      </div>
                      <Switch
                        id="strict-null-checks"
                        defaultChecked={true}
                        disabled
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Advanced Options</CardTitle>
                  <CardDescription>
                    Additional settings for theme TypeScript integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <h4 className="font-medium mb-2">Type Integration Method</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Choose how theme types are integrated with the TypeScript system
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="h-auto py-2 justify-start">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Declaration Merging</span>
                            <span className="text-xs text-muted-foreground">Default method</span>
                          </div>
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto py-2 justify-start" disabled>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Module Augmentation</span>
                            <span className="text-xs text-muted-foreground">Advanced</span>
                          </div>
                        </Button>
                        <Button variant="outline" size="sm" className="h-auto py-2 justify-start" disabled>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Standalone Types</span>
                            <span className="text-xs text-muted-foreground">Simple</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-4">
                      <h4 className="font-medium mb-2">Utility Types</h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        Include additional utility types for working with themes
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="deep-partial" defaultChecked />
                          <Label htmlFor="deep-partial">DeepPartial&lt;ThemeTokens&gt;</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="theme-override" defaultChecked />
                          <Label htmlFor="theme-override">ThemeOverride</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="token-path" defaultChecked />
                          <Label htmlFor="token-path">TokenPath</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="token-value" defaultChecked />
                          <Label htmlFor="token-value">TokenValue</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" className="mr-2" disabled>
                    Reset to Defaults
                  </Button>
                  <Button disabled>
                    Apply Settings
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}