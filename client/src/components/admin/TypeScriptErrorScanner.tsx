import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, FileWarning, Info, Shield, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ErrorItem {
  id: string;
  code: string;
  message: string;
  file: string;
  line: number;
  column: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  status: 'NEW' | 'ANALYZING' | 'FIXING' | 'FIXED' | 'IGNORED' | 'NEEDS_REVIEW' | 'SECURITY_REVIEW';
  fixDetails?: {
    suggestion: string;
    explanation: string;
    confidence: number;
    aiGenerated: boolean;
    appliedAt?: string;
    generatedAt?: string;
  };
}

interface ScanItem {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorCount: number;
  fixedCount: number;
  aiEnabled: boolean;
  startTime: string;
  endTime?: string;
  summary?: string;
  errors?: ErrorItem[];
}

const TypeScriptErrorScanner: React.FC = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scans
  const { 
    data: scans, 
    isLoading: isLoadingScans,
    isError: isErrorScans,
    error: errorScans
  } = useQuery({
    queryKey: ['/api/admin/typescript/scans'],
    retry: 1,
  });

  // Fetch selected scan details
  const {
    data: scanDetails,
    isLoading: isLoadingScanDetails,
    isError: isErrorScanDetails,
  } = useQuery({
    queryKey: ['/api/admin/typescript/scans', selectedScan],
    enabled: !!selectedScan,
    retry: 1,
  });

  // Start a new scan
  const startScanMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/typescript/scans', {
        method: 'POST',
        body: JSON.stringify({ aiEnabled }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Scan started',
        description: 'The TypeScript error scan is now in progress.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to start scan',
        description: error.message || 'An error occurred while trying to start the scan.',
        variant: 'destructive',
      });
    },
  });

  // Apply fix to an error
  const applyFixMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      return apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/fix`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Fix applied',
        description: 'The error has been fixed in the code.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans', variables.scanId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to apply fix',
        description: error.message || 'An error occurred while trying to apply the fix.',
        variant: 'destructive',
      });
    },
  });

  // Ignore an error
  const ignoreErrorMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      return apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/ignore`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Error ignored',
        description: 'The error has been marked as ignored.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans', variables.scanId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to ignore error',
        description: error.message || 'An error occurred while trying to ignore the error.',
        variant: 'destructive',
      });
    },
  });

  // Generate AI fix for an error
  const generateAiFixMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      return apiRequest(`/api/admin/typescript/scans/${scanId}/errors/${errorId}/ai-fix`, {
        method: 'POST',
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'AI fix generation started',
        description: 'The AI is now generating a fix for this error.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/typescript/scans', variables.scanId] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate AI fix',
        description: error.message || 'An error occurred while trying to generate the AI fix.',
        variant: 'destructive',
      });
    },
  });

  // Get the selected scan and error
  const selectedScanData = scanDetails as ScanItem;
  const selectedErrorData = selectedScanData?.errors?.find(error => error.id === selectedError);

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 hover:bg-red-600';
      case 'HIGH':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'MEDIUM':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'LOW':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'INFO':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FIXED':
        return 'bg-green-500 hover:bg-green-600';
      case 'FIXING':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'ANALYZING':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'IGNORED':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'NEEDS_REVIEW':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'SECURITY_REVIEW':
        return 'bg-red-500 hover:bg-red-600';
      case 'NEW':
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Helper function to get error icon
  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'HIGH':
        return <FileWarning className="h-5 w-5 text-orange-500" />;
      case 'MEDIUM':
        return <FileWarning className="h-5 w-5 text-yellow-500" />;
      case 'LOW':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'INFO':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TypeScript Error Scanner</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="aiEnabled" 
              checked={aiEnabled} 
              onCheckedChange={(checked) => setAiEnabled(checked as boolean)} 
            />
            <label 
              htmlFor="aiEnabled" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable AI analysis
            </label>
          </div>
          <Button 
            onClick={() => startScanMutation.mutate()} 
            disabled={startScanMutation.isPending}
          >
            {startScanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Scan...
              </>
            ) : (
              'Start New Scan'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Scans list */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Previous TypeScript error scans</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScans ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isErrorScans ? (
                <div className="bg-red-50 p-4 rounded-md text-red-800">
                  <p className="font-medium">Failed to load scans</p>
                  <p className="text-sm">{errorScans?.message || 'An error occurred'}</p>
                </div>
              ) : !scans || scans.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <p>No scans have been run yet.</p>
                  <p className="text-sm">Start a new scan to find TypeScript errors.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scans.map((scan: ScanItem) => (
                    <div 
                      key={scan.id}
                      className={`border rounded-md p-3 cursor-pointer transition hover:bg-gray-50 ${
                        selectedScan === scan.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedScan(scan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{new Date(scan.startTime).toLocaleString()}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={scan.status === 'COMPLETED' ? 'success' : scan.status === 'FAILED' ? 'destructive' : 'default'}>
                              {scan.status}
                            </Badge>
                            {scan.aiEnabled && (
                              <Badge variant="outline" className="bg-blue-50">AI Enabled</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Errors: {scan.errorCount}</p>
                          <p className="text-sm text-green-600">Fixed: {scan.fixedCount}</p>
                        </div>
                      </div>
                      {scan.status === 'IN_PROGRESS' && (
                        <div className="mt-3">
                          <Progress value={scan.fixedCount / (scan.errorCount || 1) * 100} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Scan details and error details */}
        <div className="lg:col-span-8">
          {selectedScan ? (
            isLoadingScanDetails ? (
              <div className="flex justify-center items-center p-12 bg-white rounded-lg shadow">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading scan details...</span>
              </div>
            ) : isErrorScanDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle>Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 p-4 rounded-md text-red-800">
                    <p className="font-medium">Failed to load scan details</p>
                    <p className="text-sm">An error occurred while trying to load the scan details.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Scan Details</CardTitle>
                        <CardDescription>
                          Started on {new Date(selectedScanData.startTime).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          selectedScanData.status === 'COMPLETED' 
                            ? 'success' 
                            : selectedScanData.status === 'FAILED' 
                            ? 'destructive' 
                            : 'default'
                        }
                        className="ml-2"
                      >
                        {selectedScanData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Errors</p>
                        <p className="text-2xl font-bold">{selectedScanData.errorCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fixed Errors</p>
                        <p className="text-2xl font-bold text-green-600">{selectedScanData.fixedCount}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={selectedScanData.errorCount ? (selectedScanData.fixedCount / selectedScanData.errorCount) * 100 : 0} 
                          className="h-2 flex-1" 
                        />
                        <span className="text-sm font-medium">
                          {selectedScanData.errorCount 
                            ? Math.round((selectedScanData.fixedCount / selectedScanData.errorCount) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>

                    {selectedScanData.summary && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Summary</p>
                        <p className="text-sm">{selectedScanData.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all">All Errors</TabsTrigger>
                    <TabsTrigger value="unfixed">Unfixed</TabsTrigger>
                    <TabsTrigger value="fixed">Fixed</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <Card>
                      <CardHeader>
                        <CardTitle>All TypeScript Errors</CardTitle>
                        <CardDescription>
                          Showing {selectedScanData.errors?.length || 0} total errors
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedScanData.errors || selectedScanData.errors.length === 0 ? (
                          <div className="text-center p-6 text-gray-500">
                            <p>No errors found in this scan.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedScanData.errors.map(error => (
                              <div 
                                key={error.id}
                                className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                                  selectedError === error.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                }`}
                                onClick={() => setSelectedError(error.id)}
                              >
                                <div className="flex items-start gap-3">
                                  {getErrorIcon(error.severity)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-mono text-sm">{error.code}</p>
                                      <div className="flex gap-2">
                                        <Badge className={getStatusColor(error.status)}>
                                          {error.status}
                                        </Badge>
                                        <Badge variant="outline" className={getSeverityColor(error.severity)}>
                                          {error.severity}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-sm font-medium truncate">{error.message}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {error.file}:{error.line}:{error.column}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="unfixed">
                    <Card>
                      <CardHeader>
                        <CardTitle>Unfixed Errors</CardTitle>
                        <CardDescription>
                          Showing errors that have not been fixed yet
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedScanData.errors || 
                         !selectedScanData.errors.filter(e => e.status !== 'FIXED' && e.status !== 'IGNORED').length ? (
                          <div className="text-center p-6 text-gray-500">
                            <p>All errors have been fixed or ignored.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedScanData.errors
                              .filter(e => e.status !== 'FIXED' && e.status !== 'IGNORED')
                              .map(error => (
                                <div 
                                  key={error.id}
                                  className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                                    selectedError === error.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                  }`}
                                  onClick={() => setSelectedError(error.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    {getErrorIcon(error.severity)}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className="font-mono text-sm">{error.code}</p>
                                        <Badge className={getStatusColor(error.status)}>
                                          {error.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium truncate">{error.message}</p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {error.file}:{error.line}:{error.column}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="fixed">
                    <Card>
                      <CardHeader>
                        <CardTitle>Fixed Errors</CardTitle>
                        <CardDescription>
                          Showing errors that have been fixed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedScanData.errors || 
                         !selectedScanData.errors.filter(e => e.status === 'FIXED').length ? (
                          <div className="text-center p-6 text-gray-500">
                            <p>No errors have been fixed yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedScanData.errors
                              .filter(e => e.status === 'FIXED')
                              .map(error => (
                                <div 
                                  key={error.id}
                                  className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                                    selectedError === error.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                                  }`}
                                  onClick={() => setSelectedError(error.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className="font-mono text-sm">{error.code}</p>
                                        <Badge className="bg-green-500 hover:bg-green-600">
                                          FIXED
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium truncate">{error.message}</p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {error.file}:{error.line}:{error.column}
                                      </p>
                                      {error.fixDetails?.appliedAt && (
                                        <p className="text-xs text-green-600 mt-1">
                                          Fixed on {new Date(error.fixDetails.appliedAt).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="security">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Concerns</CardTitle>
                        <CardDescription>
                          Errors that might have security implications
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedScanData.errors || 
                         !selectedScanData.errors.filter(e => e.status === 'SECURITY_REVIEW').length ? (
                          <div className="text-center p-6 text-gray-500">
                            <p>No security concerns detected.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedScanData.errors
                              .filter(e => e.status === 'SECURITY_REVIEW')
                              .map(error => (
                                <div 
                                  key={error.id}
                                  className={`border border-red-200 rounded-md p-3 cursor-pointer hover:bg-red-50 ${
                                    selectedError === error.id ? 'bg-red-50' : ''
                                  }`}
                                  onClick={() => setSelectedError(error.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-red-500" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <p className="font-mono text-sm">{error.code}</p>
                                        <Badge className="bg-red-500 hover:bg-red-600">
                                          SECURITY REVIEW
                                        </Badge>
                                      </div>
                                      <p className="text-sm font-medium truncate">{error.message}</p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {error.file}:{error.line}:{error.column}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Error details pane */}
                {selectedErrorData && (
                  <Card>
                    <CardHeader className="border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Error Details</CardTitle>
                          <CardDescription>
                            {selectedErrorData.file}:{selectedErrorData.line}:{selectedErrorData.column}
                          </CardDescription>
                        </div>
                        <Badge className={getSeverityColor(selectedErrorData.severity)}>
                          {selectedErrorData.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500">Error Code</h4>
                          <p className="font-mono">{selectedErrorData.code}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500">Message</h4>
                          <p>{selectedErrorData.message}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500">Location</h4>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">{selectedErrorData.file}:{selectedErrorData.line}:{selectedErrorData.column}</p>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                          </div>
                        </div>
                        
                        {selectedErrorData.fixDetails && (
                          <div className="mt-6 space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500">Fix Suggestion</h4>
                              <div className="mt-2 p-3 bg-gray-50 rounded-md border font-mono text-sm whitespace-pre-wrap">
                                {selectedErrorData.fixDetails.suggestion}
                              </div>
                            </div>
                            
                            {selectedErrorData.fixDetails.explanation && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500">Explanation</h4>
                                <p className="text-sm">{selectedErrorData.fixDetails.explanation}</p>
                              </div>
                            )}
                            
                            {selectedErrorData.fixDetails.confidence && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-500">Confidence</h4>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={selectedErrorData.fixDetails.confidence} 
                                    className="h-2 w-32" 
                                  />
                                  <span>{selectedErrorData.fixDetails.confidence}%</span>
                                </div>
                              </div>
                            )}
                            
                            {selectedErrorData.fixDetails.aiGenerated && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50">AI Generated</Badge>
                                {selectedErrorData.fixDetails.generatedAt && (
                                  <span className="text-xs text-gray-500">
                                    on {new Date(selectedErrorData.fixDetails.generatedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                      <Button
                        variant="outline"
                        onClick={() => ignoreErrorMutation.mutate({ 
                          scanId: selectedScan, 
                          errorId: selectedErrorData.id 
                        })}
                        disabled={
                          selectedErrorData.status === 'FIXED' || 
                          selectedErrorData.status === 'IGNORED' ||
                          ignoreErrorMutation.isPending
                        }
                      >
                        {ignoreErrorMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Ignore Error'
                        )}
                      </Button>
                      
                      <div className="space-x-2">
                        {(!selectedErrorData.fixDetails || !selectedErrorData.fixDetails.suggestion) && 
                         selectedScanData.aiEnabled && 
                         selectedErrorData.status !== 'FIXED' && 
                         selectedErrorData.status !== 'IGNORED' && (
                          <Button
                            variant="outline"
                            onClick={() => generateAiFixMutation.mutate({ 
                              scanId: selectedScan, 
                              errorId: selectedErrorData.id 
                            })}
                            disabled={generateAiFixMutation.isPending}
                          >
                            {generateAiFixMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              'Generate AI Fix'
                            )}
                          </Button>
                        )}
                        
                        {selectedErrorData.fixDetails && 
                         selectedErrorData.fixDetails.suggestion && 
                         selectedErrorData.status !== 'FIXED' && 
                         selectedErrorData.status !== 'IGNORED' && (
                          <Button
                            onClick={() => applyFixMutation.mutate({ 
                              scanId: selectedScan, 
                              errorId: selectedErrorData.id 
                            })}
                            disabled={applyFixMutation.isPending}
                          >
                            {applyFixMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              'Apply Fix'
                            )}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                )}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="text-center p-6 text-gray-500">
                  <h3 className="text-lg font-semibold mb-2">No Scan Selected</h3>
                  <p>Select a scan from the list or start a new scan.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypeScriptErrorScanner;