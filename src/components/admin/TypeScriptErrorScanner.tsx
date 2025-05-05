import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Code, 
  Database, 
  FileText, 
  RotateCw,
  Brain,
  Cpu,
  Lock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// TypeScript error interfaces
interface TypeScriptError {
  id: string;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  timestamp: string;
  status: 'NEW' | 'FIXING' | 'FIXED' | 'IGNORED';
  fixDetails?: {
    suggestion: string;
    confidence: 'high' | 'medium' | 'low';
    aiGenerated: boolean;
    appliedAt?: string;
  };
}

interface ScanResult {
  id: string;
  startTime: string;
  endTime: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorCount: number;
  fixedCount: number;
  summary: string;
  aiEnabled: boolean;
  errors: TypeScriptError[];
}

// This component displays and manages TypeScript errors through the admin UI
const TypeScriptErrorScanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scans');
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<TypeScriptError | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch scan history
  const { 
    data: scanHistory,
    isLoading: isLoadingScans,
    error: scanError
  } = useQuery({
    queryKey: ['/api/admin/typescript/scans'],
    // The backend will be implemented to return scan history
  });
  
  // Fetch selected scan details if a scan is selected
  const {
    data: scanDetails,
    isLoading: isLoadingScanDetails
  } = useQuery({
    queryKey: ['/api/admin/typescript/scans', selectedScan],
    enabled: !!selectedScan,
    // The backend will be implemented to return details of a specific scan
  });
  
  // Start a new scan mutation
  const startScanMutation = useMutation({
    mutationFn: async (aiEnabled: boolean) => {
      return await apiRequest('/api/admin/typescript/scans', {
        method: 'POST',
        body: JSON.stringify({ aiEnabled }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Scan started',
        description: 'TypeScript error scan has been initiated.',
      });
      setScanInProgress(true);
      setScanProgress(0);
      
      // Simulate progress updates
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + (5 + Math.random() * 10);
          if (newProgress >= 100) {
            clearInterval(interval);
            setScanInProgress(false);
            // Refetch scan history
            queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans'] });
            return 100;
          }
          return newProgress;
        });
      }, 1000);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans'] });
    },
    onError: (error) => {
      toast({
        title: 'Error starting scan',
        description: error.message || 'Failed to start TypeScript error scan.',
        variant: 'destructive'
      });
      setScanInProgress(false);
    },
  });
  
  // Apply fix mutation
  const applyFixMutation = useMutation({
    mutationFn: async ({ errorId, scanId }: { errorId: string, scanId: string }) => {
      return await apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/fix`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Fix applied',
        description: 'The suggested fix has been applied successfully.',
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/typescript/scans', variables.scanId] 
      });
    },
    onError: (error) => {
      toast({
        title: 'Error applying fix',
        description: error.message || 'Failed to apply the suggested fix.',
        variant: 'destructive'
      });
    },
  });
  
  // Ignore error mutation
  const ignoreErrorMutation = useMutation({
    mutationFn: async ({ errorId, scanId }: { errorId: string, scanId: string }) => {
      return await apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/ignore`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Error ignored',
        description: 'The error has been marked as ignored.',
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/typescript/scans', variables.scanId] 
      });
    },
    onError: (error) => {
      toast({
        title: 'Error ignoring issue',
        description: error.message || 'Failed to ignore the error.',
        variant: 'destructive'
      });
    },
  });
  
  // Generate AI fix mutation
  const generateAIFixMutation = useMutation({
    mutationFn: async ({ errorId, scanId }: { errorId: string, scanId: string }) => {
      return await apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/ai-fix`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'AI fix generated',
        description: 'An AI-powered fix suggestion has been generated.',
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/typescript/scans', variables.scanId] 
      });
    },
    onError: (error) => {
      toast({
        title: 'Error generating AI fix',
        description: error.message || 'Failed to generate an AI fix suggestion.',
        variant: 'destructive'
      });
    },
  });
  
  // Handle starting a new scan
  const handleStartScan = (aiEnabled: boolean) => {
    if (scanInProgress) {
      toast({
        title: 'Scan in progress',
        description: 'Please wait for the current scan to complete.',
      });
      return;
    }
    
    startScanMutation.mutate(aiEnabled);
  };
  
  // Handle applying a fix
  const handleApplyFix = (errorId: string, scanId: string) => {
    applyFixMutation.mutate({ errorId, scanId });
  };
  
  // Handle ignoring an error
  const handleIgnoreError = (errorId: string, scanId: string) => {
    ignoreErrorMutation.mutate({ errorId, scanId });
  };
  
  // Handle generating AI fix
  const handleGenerateAIFix = (errorId: string, scanId: string) => {
    generateAIFixMutation.mutate({ errorId, scanId });
  };
  
  // Show error details
  const showErrorDetails = (error: TypeScriptError) => {
    setSelectedError(error);
  };
  
  // Render the severity badge
  const renderSeverityBadge = (severity: TypeScriptError['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Render the status badge
  const renderStatusBadge = (status: TypeScriptError['status']) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">New</Badge>;
      case 'FIXING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'FIXED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Fixed</Badge>;
      case 'IGNORED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Ignored</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Render the category badge
  const renderCategoryBadge = (category: string) => {
    switch (category.toUpperCase()) {
      case 'TYPE_MISMATCH':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Type Mismatch</Badge>;
      case 'SYNTAX_ERROR':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Syntax Error</Badge>;
      case 'IMPORT_ERROR':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Import Error</Badge>;
      case 'DECLARATION_ERROR':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Declaration Error</Badge>;
      case 'NULL_REFERENCE':
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">Null Reference</Badge>;
      case 'SECURITY':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Security</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };
  
  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>TypeScript Error Scanner</CardTitle>
          <CardDescription>
            Scan your codebase for TypeScript errors and get AI-powered fix suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="scans">Scan History</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            {/* Scan History Tab */}
            <TabsContent value="scans" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Scans</h3>
                <div className="space-x-2">
                  <Button
                    onClick={() => handleStartScan(false)}
                    disabled={scanInProgress}
                    variant="outline"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                  <Button
                    onClick={() => handleStartScan(true)}
                    disabled={scanInProgress}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Start AI-Enhanced Scan
                  </Button>
                </div>
              </div>
              
              {scanInProgress && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Scan in progress...</span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
              )}
              
              {isLoadingScans ? (
                <div className="flex justify-center py-8">
                  <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scanError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load scan history. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : scanHistory && scanHistory.length > 0 ? (
                <div className="space-y-4">
                  {scanHistory.map((scan: ScanResult) => (
                    <Card 
                      key={scan.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${selectedScan === scan.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedScan(scan.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(scan.startTime).toLocaleString()}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {scan.status === 'IN_PROGRESS' ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  <Clock className="mr-1 h-3 w-3" /> In Progress
                                </Badge>
                              ) : scan.status === 'COMPLETED' ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Completed
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="mr-1 h-3 w-3" /> Failed
                                </Badge>
                              )}
                              
                              {scan.aiEnabled && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                  <Brain className="mr-1 h-3 w-3" /> AI-Enhanced
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {scan.errorCount} errors
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {scan.fixedCount} fixed
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No scan history available</p>
                  <p className="text-sm">Run your first TypeScript error scan to get started</p>
                </div>
              )}
            </TabsContent>
            
            {/* Errors Tab */}
            <TabsContent value="errors" className="space-y-4">
              {!selectedScan ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a scan from the Scan History tab</p>
                  <p className="text-sm">to view detected TypeScript errors</p>
                </div>
              ) : isLoadingScanDetails ? (
                <div className="flex justify-center py-8">
                  <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !scanDetails ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No data available</AlertTitle>
                  <AlertDescription>
                    Scan details could not be loaded or are no longer available.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Scan Results - {new Date(scanDetails.startTime).toLocaleDateString()}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries({ 
                        queryKey: ['/api/admin/typescript/scans', selectedScan] 
                      })}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold">{scanDetails.errorCount}</div>
                        <div className="text-sm text-muted-foreground">Total Errors</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-green-600">{scanDetails.fixedCount}</div>
                        <div className="text-sm text-muted-foreground">Fixed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-yellow-600">
                          {scanDetails.errors.filter(e => e.status === 'FIXING').length}
                        </div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-gray-600">
                          {scanDetails.errors.filter(e => e.status === 'IGNORED').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Ignored</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {scanDetails.errors.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                        {scanDetails.errors.map(error => (
                          <Card 
                            key={error.id} 
                            className={`cursor-pointer hover:bg-muted/50 ${selectedError?.id === error.id ? 'border-primary' : ''}`}
                            onClick={() => showErrorDetails(error)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium truncate max-w-[500px]">
                                    {error.file}:{error.line}:{error.column}
                                  </div>
                                  <div className="text-sm truncate max-w-[500px]">
                                    {error.message}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {renderSeverityBadge(error.severity)}
                                    {renderCategoryBadge(error.category)}
                                    {renderStatusBadge(error.status)}
                                    {error.fixDetails?.aiGenerated && (
                                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                        <Brain className="mr-1 h-3 w-3" /> AI Suggestion
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {error.status !== 'FIXED' && error.fixDetails && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApplyFix(error.id, scanDetails.id);
                                      }}
                                      variant="outline"
                                      className="bg-green-100 hover:bg-green-200 text-green-800"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Apply Fix
                                    </Button>
                                  )}
                                  {error.status === 'NEW' && !error.fixDetails && scanDetails.aiEnabled && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateAIFix(error.id, scanDetails.id);
                                      }}
                                      variant="outline"
                                      className="bg-purple-100 hover:bg-purple-200 text-purple-800"
                                    >
                                      <Brain className="h-4 w-4 mr-1" />
                                      Generate Fix
                                    </Button>
                                  )}
                                  {error.status !== 'IGNORED' && error.status !== 'FIXED' && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleIgnoreError(error.id, scanDetails.id);
                                      }}
                                      variant="outline"
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Ignore
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No TypeScript errors found</p>
                      <p className="text-sm">Your codebase is error-free!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-medium">Scanner Settings</h3>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>OpenAI Integration</CardTitle>
                    <CardDescription>
                      Configure AI-powered error analysis and fix suggestions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">API Key Status</h4>
                          <p className="text-sm text-muted-foreground">
                            OpenAI API key for enhanced error analysis
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" /> Configured
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Model Selection</h4>
                          <p className="text-sm text-muted-foreground">
                            OpenAI model used for analysis
                          </p>
                        </div>
                        <Badge variant="outline">gpt-4o</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Scanner Configuration</CardTitle>
                    <CardDescription>
                      Configure TypeScript error scanner behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Auto-Apply High-Confidence Fixes</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically apply fixes with high confidence
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" /> Enabled
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Security Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            Detect security-related TypeScript issues
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <Lock className="mr-1 h-3 w-3" /> Enabled
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Scan Schedule</h4>
                          <p className="text-sm text-muted-foreground">
                            Automated scan frequency
                          </p>
                        </div>
                        <Badge variant="outline">Daily at 00:00 UTC</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Error Storage</CardTitle>
                    <CardDescription>
                      Configure how TypeScript errors are stored and managed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">Storage Location</h4>
                          <p className="text-sm text-muted-foreground">
                            Where error data is stored
                          </p>
                        </div>
                        <Badge variant="outline">
                          <Database className="mr-1 h-3 w-3" /> Database
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium">History Retention</h4>
                          <p className="text-sm text-muted-foreground">
                            How long error history is kept
                          </p>
                        </div>
                        <Badge variant="outline">30 Days</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Error Details Modal */}
      {selectedError && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setSelectedError(null)}>
          <Card className="w-[800px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Error Details</CardTitle>
              <CardDescription className="font-mono truncate">
                {selectedError.file}:{selectedError.line}:{selectedError.column}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Error Information</h4>
                    <div className="p-3 rounded-md bg-muted">
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <span className="font-medium w-20">Code:</span>
                          <span className="font-mono">{selectedError.code}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium w-20">Message:</span>
                          <span className="font-mono">{selectedError.message}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {renderSeverityBadge(selectedError.severity)}
                          {renderCategoryBadge(selectedError.category)}
                          {renderStatusBadge(selectedError.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedError.fixDetails && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Fix Suggestion</h4>
                      <div className="p-3 rounded-md bg-muted">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={
                                selectedError.fixDetails.confidence === 'high' 
                                  ? "bg-green-100 text-green-800" 
                                  : selectedError.fixDetails.confidence === 'medium'
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {selectedError.fixDetails.confidence.charAt(0).toUpperCase() + selectedError.fixDetails.confidence.slice(1)} Confidence
                            </Badge>
                            
                            {selectedError.fixDetails.aiGenerated && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                <Brain className="mr-1 h-3 w-3" /> AI Generated
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <div className="font-medium text-sm mb-1">Suggested Code:</div>
                            <pre className="p-2 bg-black text-white rounded-md overflow-x-auto text-sm">
                              {selectedError.fixDetails.suggestion}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedError(null)}>
                Close
              </Button>
              {selectedError.status !== 'FIXED' && selectedError.status !== 'IGNORED' && (
                <>
                  {selectedError.fixDetails && (
                    <Button 
                      variant="default"
                      onClick={() => {
                        const scanDetails = queryClient.getQueryData(['/api/admin/typescript/scans', selectedScan]);
                        if (scanDetails) {
                          handleApplyFix(selectedError.id, scanDetails.id);
                          setSelectedError(null);
                        }
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Apply Fix
                    </Button>
                  )}
                  
                  {!selectedError.fixDetails && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const scanDetails = queryClient.getQueryData(['/api/admin/typescript/scans', selectedScan]);
                        if (scanDetails && scanDetails.aiEnabled) {
                          handleGenerateAIFix(selectedError.id, scanDetails.id);
                        }
                      }}
                    >
                      <Brain className="mr-2 h-4 w-4" />
                      Generate AI Fix
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                    onClick={() => {
                      const scanDetails = queryClient.getQueryData(['/api/admin/typescript/scans', selectedScan]);
                      if (scanDetails) {
                        handleIgnoreError(selectedError.id, scanDetails.id);
                        setSelectedError(null);
                      }
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Ignore
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </Card>
      )}
    </div>
  );
};

export default TypeScriptErrorScanner;