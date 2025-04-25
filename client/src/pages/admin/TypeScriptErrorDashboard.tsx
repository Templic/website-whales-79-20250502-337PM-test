import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, AlertCircle, FileText, Code, Wrench, ClipboardList, BarChart, RefreshCw, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ErrorCategory = 
  | 'type_mismatch' 
  | 'missing_type' 
  | 'undefined_variable' 
  | 'null_undefined' 
  | 'syntax_error' 
  | 'import_error' 
  | 'declaration_error' 
  | 'module_error' 
  | 'configuration_error' 
  | 'other';

type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type ErrorStatus = 
  | 'detected' 
  | 'analyzing' 
  | 'pattern_identified' 
  | 'fix_available' 
  | 'fix_applied' 
  | 'fixed' 
  | 'requires_manual_fix' 
  | 'false_positive' 
  | 'ignored';

interface TypeScriptError {
  id: number;
  errorCode: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  errorMessage: string;
  errorContext: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  status: ErrorStatus;
  detectedAt: string;
  resolvedAt?: string;
  fixId?: number;
  patternId?: number;
  userId?: number;
  metadata?: {
    tscVersion?: string;
    nodeVersion?: string;
    compiler_options?: Record<string, any>;
    stack_trace?: string;
    related_errors?: number[];
    suggestions?: string[];
  };
  occurrenceCount: number;
  lastOccurrenceAt: string;
}

interface ErrorStats {
  totalErrors: number;
  fixedErrors: number;
  fixRate: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  topFiles: Array<{ filePath: string; count: number }>;
}

interface ErrorFix {
  id: number;
  name: string;
  description: string;
  fixCode: string;
  method: string;
  autoFixable: boolean;
}

const TypeScriptErrorDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedError, setSelectedError] = useState<TypeScriptError | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [filteredSeverity, setFilteredSeverity] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); // days

  // Fetch all errors
  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ['/api/typescript'],
    retry: false,
  });

  // Fetch error statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/typescript/stats', { fromDate: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString() }],
    retry: false,
  });

  // Fetch fixes for selected error
  const { data: fixes, isLoading: fixesLoading } = useQuery({
    queryKey: ['/api/typescript', selectedError?.id, 'fixes'],
    enabled: !!selectedError,
    retry: false,
  });

  // Run analysis mutation
  const runAnalysis = useMutation({
    mutationFn: () => {
      return apiRequest('/api/typescript/analyze', { method: 'POST' });
    },
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'TypeScript error analysis has been completed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript'] });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: `Failed to analyze TypeScript errors: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Run fix mutation
  const runFix = useMutation({
    mutationFn: () => {
      return apiRequest('/api/typescript/fix', { 
        method: 'POST',
        data: { autoFixOnly: true }
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Fixes Applied',
        description: `Successfully fixed ${data.result.fixed} errors.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript'] });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Fix Failed',
        description: `Failed to apply fixes: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Apply specific fix to an error
  const applyFix = useMutation({
    mutationFn: ({ errorId, fixId }: { errorId: number, fixId: number }) => {
      return apiRequest(`/api/typescript/${errorId}/fix`, { 
        method: 'POST',
        data: { fixId }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Fix Applied',
        description: 'The fix has been applied successfully.',
      });
      setSelectedError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/typescript'] });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Fix Failed',
        description: `Failed to apply fix: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Filter errors based on selected category and severity
  const filteredErrors = React.useMemo(() => {
    if (!errors) return [];
    
    return errors.filter((error: TypeScriptError) => {
      if (filteredCategory && error.category !== filteredCategory) return false;
      if (filteredSeverity && error.severity !== filteredSeverity) return false;
      return true;
    });
  }, [errors, filteredCategory, filteredSeverity]);

  // Generate data for charts
  const chartData = React.useMemo(() => {
    if (!stats) return [];
    
    // Create data for category chart
    const categoryData = Object.entries(stats.byCategory).map(([category, count]) => ({
      name: category,
      value: count,
    }));
    
    return categoryData;
  }, [stats]);

  // Handle error selection
  const handleErrorSelect = (error: TypeScriptError) => {
    setSelectedError(error);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get badge color based on severity
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'info': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status label
  const getStatusLabel = (status: ErrorStatus) => {
    switch (status) {
      case 'detected': return 'Detected';
      case 'analyzing': return 'Analyzing';
      case 'pattern_identified': return 'Pattern Identified';
      case 'fix_available': return 'Fix Available';
      case 'fix_applied': return 'Fix Applied';
      case 'fixed': return 'Fixed';
      case 'requires_manual_fix': return 'Requires Manual Fix';
      case 'false_positive': return 'False Positive';
      case 'ignored': return 'Ignored';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">TypeScript Error Dashboard</h1>
          <p className="text-gray-500">Manage and fix TypeScript errors in your codebase</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
          >
            {runAnalysis.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Analyze Project
          </Button>
          <Button 
            variant="default" 
            onClick={() => runFix.mutate()}
            disabled={runFix.isPending}
          >
            {runFix.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code className="mr-2 h-4 w-4" />}
            Apply Fixes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="fixes">Fixes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          {statsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Errors</CardTitle>
                  <CardDescription>All detected TypeScript errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{stats.totalErrors}</div>
                  <div className="mt-2">
                    <Progress value={(stats.fixedErrors / (stats.totalErrors || 1)) * 100} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-gray-500">
                    {stats.fixedErrors} fixed ({stats.fixRate.toFixed(1)}% fix rate)
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Error Severity</CardTitle>
                  <CardDescription>Distribution by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.bySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${getSeverityColor(severity as ErrorSeverity)}`} />
                          <span className="capitalize">{severity}</span>
                        </div>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Error Categories</CardTitle>
                  <CardDescription>Distribution by error type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                        </div>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Charts and Graphs */}
              <Card className="col-span-1 md:col-span-3">
                <CardHeader>
                  <CardTitle>Error Categories Overview</CardTitle>
                  <CardDescription>Distribution of errors by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Files with Errors */}
              <Card className="col-span-1 md:col-span-3">
                <CardHeader>
                  <CardTitle>Top Files with Errors</CardTitle>
                  <CardDescription>Files with the most TypeScript errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Path</TableHead>
                        <TableHead className="text-right">Error Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.topFiles.length > 0 ? (
                        stats.topFiles.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{file.filePath}</TableCell>
                            <TableCell className="text-right">{file.count}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">No files with errors found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load TypeScript error statistics. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="errors">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>TypeScript Errors</CardTitle>
                    <div className="flex gap-2">
                      <select 
                        className="text-sm border rounded p-1"
                        value={filteredSeverity || ''}
                        onChange={(e) => setFilteredSeverity(e.target.value || null)}
                      >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="info">Info</option>
                      </select>
                      <select 
                        className="text-sm border rounded p-1"
                        value={filteredCategory || ''}
                        onChange={(e) => setFilteredCategory(e.target.value || null)}
                      >
                        <option value="">All Categories</option>
                        <option value="type_mismatch">Type Mismatch</option>
                        <option value="missing_type">Missing Type</option>
                        <option value="undefined_variable">Undefined Variable</option>
                        <option value="null_undefined">Null/Undefined</option>
                        <option value="syntax_error">Syntax Error</option>
                        <option value="import_error">Import Error</option>
                        <option value="declaration_error">Declaration Error</option>
                        <option value="module_error">Module Error</option>
                        <option value="configuration_error">Configuration Error</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {errorsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Error</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Detected</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredErrors && filteredErrors.length > 0 ? (
                            filteredErrors.map((error: TypeScriptError) => (
                              <TableRow 
                                key={error.id} 
                                className={`cursor-pointer ${selectedError?.id === error.id ? 'bg-muted' : ''}`}
                                onClick={() => handleErrorSelect(error)}
                              >
                                <TableCell>
                                  <div className="font-medium">{error.errorCode}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-[250px]">
                                    {error.errorMessage}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono text-xs">{error.filePath}</div>
                                  <div className="text-xs text-gray-500">
                                    Line {error.lineNumber}, Col {error.columnNumber}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getSeverityColor(error.severity)}>
                                    {error.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={error.status === 'fixed' ? 'default' : 'outline'}>
                                    {getStatusLabel(error.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(error.detectedAt)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                {errors && errors.length > 0
                                  ? 'No errors match the current filters'
                                  : 'No TypeScript errors found'
                                }
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full md:w-1/3">
              {selectedError ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Error Details</CardTitle>
                    <CardDescription>{selectedError.errorCode}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">Message</h3>
                      <p className="text-sm">{selectedError.errorMessage}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold">Location</h3>
                      <p className="text-sm font-mono">
                        {selectedError.filePath}:{selectedError.lineNumber}:{selectedError.columnNumber}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold">Context</h3>
                      <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {selectedError.errorContext || 'No context available'}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold">Metadata</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Category:</span>
                          <span>{selectedError.category.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Severity:</span>
                          <span>{selectedError.severity}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Status:</span>
                          <span>{getStatusLabel(selectedError.status)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Occurrences:</span>
                          <span>{selectedError.occurrenceCount}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Last Occurred:</span>
                          <span>{formatDate(selectedError.lastOccurrenceAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Available Fixes</h3>
                      {fixesLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : fixes && fixes.length > 0 ? (
                        <div className="space-y-2">
                          {fixes.map((fix: ErrorFix) => (
                            <div key={fix.id} className="border rounded p-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{fix.name}</span>
                                <Badge variant={fix.autoFixable ? 'default' : 'outline'}>
                                  {fix.autoFixable ? 'Auto-fixable' : 'Manual'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{fix.description}</p>
                              {fix.fixCode && (
                                <pre className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">
                                  {fix.fixCode}
                                </pre>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 w-full"
                                disabled={applyFix.isPending || !fix.autoFixable}
                                onClick={() => applyFix.mutate({ errorId: selectedError.id, fixId: fix.id })}
                              >
                                {applyFix.isPending ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <Tool className="mr-2 h-3 w-3" />
                                )}
                                Apply Fix
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No fixes available for this error</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Error Details</CardTitle>
                    <CardDescription>Select an error to view details</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p>Select an error from the list to view details and available fixes</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Error Patterns</CardTitle>
              <CardDescription>Common error patterns and their fixes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-sm text-gray-500">Error pattern management will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fixes">
          <Card>
            <CardHeader>
              <CardTitle>Fix Library</CardTitle>
              <CardDescription>Browse and manage error fixes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-sm text-gray-500">Fix library management will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Fix History</CardTitle>
              <CardDescription>Track applied fixes and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-sm text-gray-500">Fix history tracking will be available in a future update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TypeScriptErrorDashboard;