/**
 * Theme TypeScript Integration Component
 * 
 * This component integrates the theme system with the TypeScript error management system.
 * It provides tools for analyzing and fixing theme-related TypeScript errors.
 */

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Code, FileCode, FileX, Loader2, PlayCircle, RotateCcw, X } from 'lucide-react';

interface ThemeTypeScriptIntegrationProps {
  onGenerateTypes?: () => void;
  onFixErrors?: () => void;
}

export function ThemeTypeScriptIntegration({
  onGenerateTypes,
  onFixErrors,
}: ThemeTypeScriptIntegrationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('errors');
  const [autoFix, setAutoFix] = useState(true);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  
  // Mock data for the errors - will be replaced with an actual API call
  const mockErrors = [
    {
      id: 1,
      file: 'shared/theme/tokens.ts',
      line: 45,
      column: 12,
      message: 'Property \'baseTokens\' is not exported from module \'./tokens\'',
      severity: 'error',
      code: 'TS2305',
      fix: 'Export baseTokens from tokens.ts or update import statement',
    },
    {
      id: 2,
      file: 'shared/theme/ThemeContext.tsx',
      line: 67,
      column: 23,
      message: 'Type \'ThemeMode\' is declared but never used',
      severity: 'warning',
      code: 'TS6133',
      fix: 'Export ThemeMode or remove the declaration',
    },
    {
      id: 3,
      file: 'shared/theme/accessibility.ts',
      line: 128,
      column: 18,
      message: 'Property \'AA\' does not exist on type \'ContrastCheckResult\'',
      severity: 'error',
      code: 'TS2339',
      fix: 'Add AA property to ContrastCheckResult interface',
    },
    {
      id: 4,
      file: 'shared/theme/tailwindIntegration.ts',
      line: 63,
      column: 32,
      message: 'Type \'unknown\' is not assignable to type \'string\'',
      severity: 'error',
      code: 'TS2322',
      fix: 'Add type assertion or implement proper type guard',
    },
    {
      id: 5,
      file: 'shared/theme/plugins.ts',
      line: 10,
      column: 26,
      message: 'Cannot find module \'webpack\' or its corresponding type declarations',
      severity: 'error',
      code: 'TS2307',
      fix: 'Install @types/webpack as a development dependency',
    },
  ];
  
  // Get TypeScript errors related to theme
  const { data: errors, isLoading: isLoadingErrors } = useQuery({
    queryKey: ['/api/typescript-simple/errors/theme'],
    // Temporary use mock data instead of actual API call
    queryFn: async () => mockErrors,
    enabled: activeTab === 'errors',
  });
  
  // Get TypeScript types info
  const { data: typesInfo, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['/api/typescript-simple/types/theme'],
    // Temporary use mock data
    queryFn: async () => ({
      totalTypes: 28,
      coveredTypes: 22,
      missingTypes: 6,
      lastUpdate: new Date().toISOString(),
    }),
    enabled: activeTab === 'types',
  });
  
  // Fix errors mutation
  const fixErrorsMutation = useMutation({
    mutationFn: async (errorIds: number[]) => {
      // This would be replaced with a real API call
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ fixed: errorIds.length, remaining: 0 });
        }, 2000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Errors fixed',
        description: 'TypeScript errors have been fixed successfully.',
      });
      
      // Refetch errors to update the list
      // queryClient.invalidateQueries({ queryKey: ['/api/typescript-simple/errors/theme'] });
      
      if (onFixErrors) {
        onFixErrors();
      }
    },
    onError: (error) => {
      console.error('Error fixing TypeScript errors:', error);
      toast({
        title: 'Error fixing issues',
        description: 'There was a problem fixing the TypeScript errors. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Generate types mutation
  const generateTypesMutation = useMutation({
    mutationFn: async () => {
      // This would be replaced with a real API call
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ generated: 28, updated: 12 });
        }, 2000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Types generated',
        description: 'Theme type definitions have been generated successfully.',
      });
      
      // Refetch types info
      // queryClient.invalidateQueries({ queryKey: ['/api/typescript-simple/types/theme'] });
      
      if (onGenerateTypes) {
        onGenerateTypes();
      }
    },
    onError: (error) => {
      console.error('Error generating types:', error);
      toast({
        title: 'Error generating types',
        description: 'There was a problem generating theme type definitions. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle fix all errors
  const handleFixAllErrors = () => {
    if (!errors || errors.length === 0) {
      toast({
        title: 'No errors to fix',
        description: 'There are no TypeScript errors to fix.',
      });
      return;
    }
    
    // Extract error IDs to fix
    const errorIds = errors.map(error => error.id);
    fixErrorsMutation.mutate(errorIds);
  };
  
  // Handle fix specific error
  const handleFixError = (errorId: number) => {
    fixErrorsMutation.mutate([errorId]);
  };
  
  // Handle generate types
  const handleGenerateTypes = () => {
    generateTypesMutation.mutate();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">TypeScript Integration</h2>
          <p className="text-muted-foreground">
            Manage theme-related TypeScript type definitions and error handling
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <FileX className="h-4 w-4" />
            <span>Errors</span>
            {errors && errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            <span>Types</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TypeScript Errors</CardTitle>
              <CardDescription>
                Theme-related TypeScript errors found in your codebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-fix"
                      checked={autoFix}
                      onCheckedChange={setAutoFix}
                    />
                    <Label htmlFor="auto-fix">Auto-fix when possible</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="deep-analysis"
                      checked={deepAnalysis}
                      onCheckedChange={setDeepAnalysis}
                    />
                    <Label htmlFor="deep-analysis">Deep analysis</Label>
                  </div>
                </div>
                
                <Button
                  onClick={handleFixAllErrors}
                  disabled={!errors || errors.length === 0 || fixErrorsMutation.isPending}
                  className="gap-2"
                >
                  {fixErrorsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  Fix all errors
                </Button>
              </div>
              
              {isLoadingErrors ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2" />
                    </Card>
                  ))}
                </div>
              ) : errors && errors.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {errors.map((error) => (
                    <AccordionItem
                      key={error.id}
                      value={`error-${error.id}`}
                      className="border rounded-md"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                        <div className="flex items-start">
                          <Badge
                            variant={error.severity === 'error' ? 'destructive' : 'outline'}
                            className="mr-3 mt-0.5"
                          >
                            {error.severity}
                          </Badge>
                          <div className="text-left">
                            <div className="font-medium">{error.message}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {error.file}:{error.line}:{error.column}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="space-y-4">
                          <div className="rounded-md bg-muted p-3 font-mono text-sm">
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="text-muted-foreground">{error.code}</span>
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 gap-1"
                                onClick={() => {
                                  // Copy error details to clipboard
                                  navigator.clipboard.writeText(
                                    `${error.file}:${error.line}:${error.column} - ${error.message} (${error.code})`
                                  );
                                  toast({
                                    title: 'Copied to clipboard',
                                    description: 'Error details have been copied to your clipboard.',
                                  });
                                }}
                              >
                                <Code className="h-3 w-3" />
                                <span className="text-xs">Copy</span>
                              </Button>
                            </div>
                            <Separator className="my-2" />
                            <div className="text-xs">
                              <div className="mt-1">
                                <span className="text-muted-foreground font-medium">Fix suggestion:</span>
                                <span className="ml-2">{error.fix}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleFixError(error.id)}
                              disabled={fixErrorsMutation.isPending}
                              className="gap-1"
                            >
                              {fixErrorsMutation.isPending && fixErrorsMutation.variables?.includes(error.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <PlayCircle className="h-3 w-3" />
                              )}
                              <span>Fix this error</span>
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-6 mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                      <div className="h-6 w-6 text-green-500">✓</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-medium mb-2">All clear!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No TypeScript errors were found in your theme-related code. Your type definitions are working correctly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Type Definitions</CardTitle>
              <CardDescription>
                Manage and generate TypeScript types for your theme system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTypes ? (
                <div className="space-y-6">
                  <div className="h-8 w-full bg-muted rounded animate-pulse" />
                  <div className="h-32 w-full bg-muted rounded animate-pulse" />
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                </div>
              ) : typesInfo ? (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label>Type Coverage</Label>
                    <Progress 
                      value={(typesInfo.coveredTypes / typesInfo.totalTypes) * 100} 
                      className="h-3"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {typesInfo.coveredTypes} / {typesInfo.totalTypes} types covered
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round((typesInfo.coveredTypes / typesInfo.totalTypes) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Missing Types</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          These types need to be defined for complete coverage
                        </p>
                        <div className="space-x-2">
                          <Badge variant="outline">ThemeMode</Badge>
                          <Badge variant="outline">ThemeContrast</Badge>
                          <Badge variant="outline">ThemeMotion</Badge>
                          <Badge variant="outline">baseTokens</Badge>
                          <Badge variant="outline">extendedTokens</Badge>
                          <Badge variant="outline">AccessibilityCheckOptions</Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="text-muted-foreground">Last updated</div>
                        <div>
                          {new Date(typesInfo.lastUpdate).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      onClick={handleGenerateTypes}
                      disabled={generateTypesMutation.isPending}
                      className="gap-2"
                    >
                      {generateTypesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Generate Type Definitions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Unable to load type information</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}