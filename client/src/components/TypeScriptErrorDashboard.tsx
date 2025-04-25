import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon, CodeIcon, DatabaseIcon, FolderIcon } from 'lucide-react';

// Types for TypeScript Error Management API responses
interface TypeFoundationResponse {
  success: boolean;
  typeHealthScore: number;
  analysis: {
    typeDefinitions: {
      interfaceCount: number;
      typeAliasCount: number;
      enumCount: number;
      genericTypeCount: number;
    };
    typeUsage: {
      anyTypeCount: number;
      unknownTypeCount: number;
      primitiveTypeCount: number;
      objectTypeCount: number;
      arrayTypeCount: number;
      functionTypeCount: number;
    };
    typeSafety: {
      explicitTypeAnnotations: number;
      implicitTypeAnnotations: number;
      typeAssertions: number;
      nonNullAssertions: number;
    };
    whaleAppSpecific: {
      whaleRelatedTypes: number;
      oceanRelatedTypes: number;
      soundRelatedTypes: number;
      userInteractionTypes: number;
    };
    files: {
      analyzed: number;
      withTypes: number;
      withoutTypes: number;
    };
  };
  recommendations: string[];
  summary: {
    totalFilesAnalyzed: number;
    typeDefinitionsFound: number;
    anyTypeUsage: number;
    typeAssertionUsage: number;
    appSpecificTypes: number;
  };
}

interface BatchAnalysisResponse {
  success: boolean;
  stats: {
    totalFiles: number;
    filesWithErrors: number;
    filesWithoutErrors: number;
    percentClean: number;
    totalIssues: number;
    byCategory: {
      error: number;
      warning: number;
      info: number;
    };
  };
  hotspotFiles: Array<{
    file: string;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    totalIssues: number;
  }>;
  mostCommonErrors: Array<{
    code: number;
    count: number;
    message: string;
    examples: Array<{
      file: string;
      line: number;
      message: string;
    }>;
  }>;
  recommendedFixes: Array<{
    code: number;
    message: string;
    count: number;
    fix: string;
  }>;
}

/**
 * TypeScript Error Dashboard Component
 * 
 * Visualizes TypeScript error data from the API with a focus on the health
 * of the type system and error patterns.
 */
const TypeScriptErrorDashboard: React.FC = () => {
  const [projectRoot, setProjectRoot] = useState('.');
  const [maxFiles, setMaxFiles] = useState(30);
  
  // Query for the type foundation health report
  const typeFoundationQuery = useQuery({
    queryKey: ['/api/typescript-simple/type-foundation', projectRoot, maxFiles],
    queryFn: async () => {
      const response = await fetch('/api/typescript-simple/type-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRoot, maxFiles })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch type foundation data');
      }
      
      return response.json() as Promise<TypeFoundationResponse>;
    },
    enabled: true // Auto-fetch on component mount
  });
  
  // Query for the batch analysis results
  const batchAnalysisQuery = useQuery({
    queryKey: ['/api/typescript-simple/batch-analyze', projectRoot, maxFiles],
    queryFn: async () => {
      const response = await fetch('/api/typescript-simple/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRoot, maxFiles })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch batch analysis data');
      }
      
      return response.json() as Promise<BatchAnalysisResponse>;
    },
    enabled: true // Auto-fetch on component mount
  });
  
  // Function to get color based on health score
  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Function to get icon and color for error category
  const getErrorCategoryDetails = (category: string): { icon: React.ReactNode, color: string } => {
    switch (category) {
      case 'error':
        return { 
          icon: <AlertTriangleIcon className="h-4 w-4" />, 
          color: 'bg-red-500 text-white' 
        };
      case 'warning':
        return { 
          icon: <AlertTriangleIcon className="h-4 w-4" />, 
          color: 'bg-yellow-500 text-white' 
        };
      case 'info':
        return { 
          icon: <InfoIcon className="h-4 w-4" />, 
          color: 'bg-blue-500 text-white' 
        };
      default:
        return { 
          icon: <InfoIcon className="h-4 w-4" />, 
          color: 'bg-gray-500 text-white' 
        };
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    typeFoundationQuery.refetch();
    batchAnalysisQuery.refetch();
  };
  
  // Loading state
  if (typeFoundationQuery.isLoading || batchAnalysisQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading TypeScript analysis data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (typeFoundationQuery.isError || batchAnalysisQuery.isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-red-50 p-6 rounded-lg">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Failed to load data</h2>
          <p className="mt-2 text-gray-600">
            {typeFoundationQuery.error?.message || batchAnalysisQuery.error?.message || 'An unknown error occurred'}
          </p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Data ready state
  const typeFoundation = typeFoundationQuery.data;
  const batchAnalysis = batchAnalysisQuery.data;
  
  if (!typeFoundation || !batchAnalysis) {
    return <div>No data available</div>;
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">TypeScript Error Dashboard</h1>
          <p className="text-gray-600">
            Analysis of {typeFoundation.summary.totalFilesAnalyzed} files in the "Dale Loves Whales" project
          </p>
        </div>
        <Button onClick={handleRefresh}>
          Refresh Analysis
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Type Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Type Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{typeFoundation.typeHealthScore}/100</div>
            <Progress 
              value={typeFoundation.typeHealthScore} 
              className={`h-2 mt-2 ${getHealthScoreColor(typeFoundation.typeHealthScore)}`} 
            />
          </CardContent>
          <CardFooter>
            <span className="text-sm text-gray-500">
              {typeFoundation.typeHealthScore >= 80 ? 'Excellent' : 
               typeFoundation.typeHealthScore >= 60 ? 'Good' : 
               typeFoundation.typeHealthScore >= 40 ? 'Fair' : 'Needs Improvement'}
            </span>
          </CardFooter>
        </Card>
        
        {/* Clean Files */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Clean Files Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{batchAnalysis.stats.percentClean}%</div>
            <Progress 
              value={batchAnalysis.stats.percentClean} 
              className={`h-2 mt-2 ${
                batchAnalysis.stats.percentClean >= 80 ? 'bg-green-500' : 
                batchAnalysis.stats.percentClean >= 60 ? 'bg-yellow-500' : 
                batchAnalysis.stats.percentClean >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`} 
            />
          </CardContent>
          <CardFooter>
            <span className="text-sm text-gray-500">
              {batchAnalysis.stats.filesWithoutErrors} of {batchAnalysis.stats.totalFiles} files are error-free
            </span>
          </CardFooter>
        </Card>
        
        {/* Total Issues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{batchAnalysis.stats.totalIssues}</div>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-red-500">
                {batchAnalysis.stats.byCategory.error} Errors
              </Badge>
              <Badge className="bg-yellow-500">
                {batchAnalysis.stats.byCategory.warning} Warnings
              </Badge>
              <Badge className="bg-blue-500">
                {batchAnalysis.stats.byCategory.info} Info
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-sm text-gray-500">
              Across {batchAnalysis.stats.filesWithErrors} files
            </span>
          </CardFooter>
        </Card>
        
        {/* Domain-Specific Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Whale-Specific Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{typeFoundation.analysis.whaleAppSpecific.whaleRelatedTypes + 
              typeFoundation.analysis.whaleAppSpecific.oceanRelatedTypes + 
              typeFoundation.analysis.whaleAppSpecific.soundRelatedTypes +
              typeFoundation.analysis.whaleAppSpecific.userInteractionTypes}</div>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-blue-700">
                {typeFoundation.analysis.whaleAppSpecific.whaleRelatedTypes} Whale
              </Badge>
              <Badge className="bg-blue-500">
                {typeFoundation.analysis.whaleAppSpecific.oceanRelatedTypes} Ocean
              </Badge>
              <Badge className="bg-purple-500">
                {typeFoundation.analysis.whaleAppSpecific.soundRelatedTypes} Sound
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <span className="text-sm text-gray-500">
              Domain-specific type coverage
            </span>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Hotspot Files */}
        <Card>
          <CardHeader>
            <CardTitle>Error Hotspots</CardTitle>
            <CardDescription>Files with the most TypeScript issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchAnalysis.hotspotFiles.slice(0, 5).map((file, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <FileIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium truncate">{file.file}</p>
                      <p className="text-sm font-bold">{file.totalIssues}</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${(file.errorCount / file.totalIssues) * 100}%` }}></div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-red-500">{file.errorCount} errors</span>
                      <span className="text-xs text-yellow-500">{file.warningCount} warnings</span>
                      <span className="text-xs text-blue-500">{file.infoCount} info</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {batchAnalysis.hotspotFiles.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No error hotspots found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Common Errors */}
        <Card>
          <CardHeader>
            <CardTitle>Common Error Patterns</CardTitle>
            <CardDescription>Most frequent TypeScript issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {batchAnalysis.mostCommonErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-700">Code {error.code}</Badge>
                      <span className="text-sm font-medium">{error.message}</span>
                    </div>
                    <Badge>{error.count} occurrences</Badge>
                  </div>
                  
                  {error.examples && error.examples.length > 0 && (
                    <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
                      <p className="text-xs font-medium text-gray-500 mb-1">Example:</p>
                      <div className="flex items-center gap-1">
                        <FileIcon className="h-3 w-3 text-gray-400" />
                        <span>{error.examples[0].file}:{error.examples[0].line}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {batchAnalysis.mostCommonErrors.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No common error patterns found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Type System Details</CardTitle>
            <CardDescription>Information about TypeScript usage in your codebase</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="definitions">
              <TabsList className="mb-4">
                <TabsTrigger value="definitions">Type Definitions</TabsTrigger>
                <TabsTrigger value="usage">Type Usage</TabsTrigger>
                <TabsTrigger value="safety">Type Safety</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="definitions" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Interfaces</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{typeFoundation.analysis.typeDefinitions.interfaceCount}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Type Aliases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{typeFoundation.analysis.typeDefinitions.typeAliasCount}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Enums</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{typeFoundation.analysis.typeDefinitions.enumCount}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Generic Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{typeFoundation.analysis.typeDefinitions.genericTypeCount}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="usage">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Any Types</span>
                    <Badge className="bg-red-500">{typeFoundation.analysis.typeUsage.anyTypeCount}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Unknown Types</span>
                    <Badge className="bg-yellow-500">{typeFoundation.analysis.typeUsage.unknownTypeCount}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Primitive Types</span>
                    <Badge className="bg-green-500">{typeFoundation.analysis.typeUsage.primitiveTypeCount}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Object Types</span>
                    <Badge className="bg-blue-500">{typeFoundation.analysis.typeUsage.objectTypeCount}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Array Types</span>
                    <Badge className="bg-purple-500">{typeFoundation.analysis.typeUsage.arrayTypeCount}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Function Types</span>
                    <Badge className="bg-indigo-500">{typeFoundation.analysis.typeUsage.functionTypeCount}</Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="safety">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Explicit Type Annotations</span>
                    <Badge className="bg-green-500">{typeFoundation.analysis.typeSafety.explicitTypeAnnotations}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Implicit Type Annotations</span>
                    <Badge className="bg-yellow-500">{typeFoundation.analysis.typeSafety.implicitTypeAnnotations}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type Assertions</span>
                    <Badge className="bg-orange-500">{typeFoundation.analysis.typeSafety.typeAssertions}</Badge>
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Non-Null Assertions</span>
                    <Badge className="bg-red-500">{typeFoundation.analysis.typeSafety.nonNullAssertions}</Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="files">
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 relative">
                    <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                    <div 
                      className="absolute top-0 left-0 w-full h-full rounded-full border-8 border-t-blue-500 border-r-blue-500"
                      style={{ 
                        transform: `rotate(${(typeFoundation.analysis.files.withTypes / typeFoundation.analysis.files.analyzed) * 360}deg)`,
                        transition: 'transform 1s ease-in-out'
                      }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
                      <div className="text-3xl font-bold">{Math.round((typeFoundation.analysis.files.withTypes / typeFoundation.analysis.files.analyzed) * 100)}%</div>
                      <div className="text-sm text-gray-500">With Types</div>
                    </div>
                  </div>
                  
                  <div className="mt-8 w-full grid grid-cols-2 gap-4">
                    <Card className="bg-blue-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-5 w-5 text-blue-500" />
                          <span>Files with Types</span>
                        </div>
                        <Badge className="bg-blue-500">{typeFoundation.analysis.files.withTypes}</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-5 w-5 text-gray-500" />
                          <span>Files without Types</span>
                        </div>
                        <Badge className="bg-gray-500">{typeFoundation.analysis.files.withoutTypes}</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Suggested improvements for your TypeScript codebase</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {typeFoundation.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
              
              {batchAnalysis.recommendedFixes && batchAnalysis.recommendedFixes.map((fix, index) => (
                <li key={`fix-${index}`} className="flex items-start gap-2">
                  <CodeIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{fix.message}</div>
                    <div className="mt-1 bg-gray-50 p-2 rounded text-sm font-mono overflow-x-auto">
                      {fix.fix}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TypeScriptErrorDashboard;