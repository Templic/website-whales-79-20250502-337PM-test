/**
 * Theme Viewer Component
 * 
 * A component that displays a theme with all of its token values.
 * It provides a visual representation of how the theme looks.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeTokens } from '@shared/theme/tokens';

// Common token categories for the theme viewer
const TOKEN_CATEGORIES = [
  { key: 'colors', label: 'Colors' },
  { key: 'typography', label: 'Typography' },
  { key: 'spacing', label: 'Spacing' },
  { key: 'radius', label: 'Border Radius' },
  { key: 'shadows', label: 'Shadows' },
  { key: 'transitions', label: 'Transitions' },
  { key: 'components', label: 'Components' },
];

interface ThemeViewerProps {
  themeId: number;
  versionId?: number;
  onApply?: (tokens: ThemeTokens) => void;
  onExport?: (tokens: ThemeTokens) => void;
  readOnly?: boolean;
}

export function ThemeViewer({
  themeId,
  versionId,
  onApply,
  onExport,
  readOnly = false,
}: ThemeViewerProps) {
  const [activeTab, setActiveTab] = useState('colors');

  // Fetch theme details
  const { data: theme, isLoading: isLoadingTheme } = useQuery({
    queryKey: ['/api/themes', themeId],
    enabled: !!themeId,
  });

  // Fetch theme version (active by default, specific version if versionId provided)
  const { data: version, isLoading: isLoadingVersion } = useQuery({
    queryKey: versionId 
      ? ['/api/themes', themeId, 'versions', versionId] 
      : ['/api/themes', themeId, 'versions', 'active'],
    enabled: !!themeId,
  });

  // Loading state
  if (isLoadingTheme || isLoadingVersion) {
    return <ThemeViewerSkeleton />;
  }

  // Error state
  if (!theme || !version) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Theme Not Found</CardTitle>
          <CardDescription>
            The requested theme or version could not be loaded.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tokens = version.tokens as ThemeTokens;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{theme.name}</CardTitle>
            <CardDescription>
              Version {version.version}
              {version.isActive && (
                <Badge variant="outline" className="ml-2">Active</Badge>
              )}
            </CardDescription>
          </div>
          {!readOnly && (
            <div className="space-x-2">
              {onApply && (
                <Button
                  variant="secondary"
                  onClick={() => onApply(tokens)}
                >
                  Apply Theme
                </Button>
              )}
              {onExport && (
                <Button
                  variant="outline"
                  onClick={() => onExport(tokens)}
                >
                  Export
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {TOKEN_CATEGORIES.map(category => (
              <TabsTrigger key={category.key} value={category.key}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {TOKEN_CATEGORIES.map(category => (
            <TabsContent key={category.key} value={category.key}>
              <TokenCategoryView 
                category={category.key} 
                tokens={tokens} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <div>
          {theme.description && (
            <div className="mb-2">{theme.description}</div>
          )}
          <div>
            Created by {theme.userId} • Last updated {new Date(version.publishedAt || Date.now()).toLocaleDateString()}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Component for a loading state
function ThemeViewerSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-2/3" />
      </CardFooter>
    </Card>
  );
}

// Component to visualize a category of tokens
function TokenCategoryView({ category, tokens }: { category: string; tokens: ThemeTokens }) {
  // Get the tokens for this category
  const categoryTokens = tokens[category as keyof ThemeTokens];
  
  // If category doesn't exist or has no tokens
  if (!categoryTokens || typeof categoryTokens !== 'object') {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {category} tokens defined in this theme.
      </div>
    );
  }

  // Special renderers for different token categories
  if (category === 'colors') {
    return <ColorTokensView tokens={categoryTokens as Record<string, string>} />;
  }
  
  if (category === 'typography') {
    return <TypographyTokensView tokens={categoryTokens as Record<string, any>} />;
  }
  
  if (category === 'components') {
    return <ComponentTokensView tokens={categoryTokens as Record<string, any>} />;
  }

  // Default renderer for other token categories
  return <GenericTokensView category={category} tokens={categoryTokens as Record<string, any>} />;
}

// Component to visualize color tokens
function ColorTokensView({ tokens }: { tokens: Record<string, string> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(tokens).map(([key, value]) => (
        <div key={key} className="rounded-md border overflow-hidden">
          <div 
            className="h-16 w-full" 
            style={{ backgroundColor: value }}
          />
          <div className="p-2">
            <div className="font-medium truncate">{key}</div>
            <div className="text-xs text-muted-foreground">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to visualize typography tokens
function TypographyTokensView({ tokens }: { tokens: Record<string, any> }) {
  return (
    <div className="space-y-6">
      {Object.entries(tokens).map(([key, value]) => {
        if (key === 'fontFamily') {
          return (
            <div key={key} className="rounded-md border p-4">
              <div className="mb-2 text-sm font-medium">Font Family</div>
              <div className="space-y-2">
                {Object.entries(value as Record<string, string>).map(([fontKey, fontValue]) => (
                  <div key={fontKey} className="flex justify-between">
                    <div>{fontKey}</div>
                    <div 
                      className="font-medium" 
                      style={{ fontFamily: fontValue }}
                    >
                      {fontValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        if (key === 'fontSize') {
          return (
            <div key={key} className="rounded-md border p-4">
              <div className="mb-2 text-sm font-medium">Font Size</div>
              <div className="space-y-3">
                {Object.entries(value as Record<string, any>).map(([sizeKey, sizeValue]) => (
                  <div key={sizeKey} className="flex justify-between items-center">
                    <div>{sizeKey}</div>
                    <div 
                      style={{ 
                        fontSize: typeof sizeValue === 'string' ? sizeValue : sizeValue.size 
                      }}
                    >
                      {typeof sizeValue === 'string' ? sizeValue : sizeValue.size}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        return (
          <div key={key} className="rounded-md border p-4">
            <div className="mb-2 text-sm font-medium">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="space-y-2">
              {Object.entries(value as Record<string, string>).map(([subKey, subValue]) => (
                <div key={subKey} className="flex justify-between">
                  <div>{subKey}</div>
                  <div className="font-medium">{subValue}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Component to visualize component tokens
function ComponentTokensView({ tokens }: { tokens: Record<string, any> }) {
  return (
    <div className="space-y-6">
      {Object.entries(tokens).map(([componentName, componentTokens]) => (
        <Card key={componentName}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{componentName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(componentTokens as Record<string, any>).map(([variantName, variantTokens]) => (
                <div key={variantName} className="rounded-md border p-3">
                  <div className="font-medium mb-2 capitalize">{variantName}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(variantTokens as Record<string, string>).map(([tokenName, tokenValue]) => (
                      <div key={tokenName} className="flex justify-between">
                        <div className="text-muted-foreground">{tokenName}:</div>
                        <div>{tokenValue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Default component for visualizing other token categories
function GenericTokensView({ category, tokens }: { category: string; tokens: Record<string, any> }) {
  return (
    <div className="space-y-4">
      {Object.entries(tokens).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key} className="rounded-md border p-4">
              <div className="font-medium mb-2 capitalize">{key}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                {Object.entries(value as Record<string, any>).map(([subKey, subValue]) => (
                  <div key={subKey} className="flex justify-between">
                    <div className="text-muted-foreground">{subKey}:</div>
                    <div className="font-medium truncate">
                      {typeof subValue === 'string' ? subValue : JSON.stringify(subValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        
        return (
          <div key={key} className="flex justify-between p-2 border-b">
            <div>{key}</div>
            <div className="font-medium">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}