/**
 * TypeScriptErrorScanner Component
 * 
 * A component for scanning the codebase for TypeScript errors and
 * displaying the results in an organized, filterable interface with
 * AI-powered fix suggestions.
 */
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Eye,
  FileWarning,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
  ZapOff
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from '@tanstack/react-query';

// Define TypeScript error interface
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
    explanation?: string;
    confidence: 'high' | 'medium' | 'low';
    aiGenerated: boolean;
    appliedAt?: string;
    generatedAt?: string;
  };
}

// Define scan result interface
interface ScanResult {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorCount: number;
  fixedCount: number;
  summary?: string;
  aiEnabled: boolean;
  errors: TypeScriptError[];
}

// Get severity color based on error severity
function getSeverityColor(severity: TypeScriptError['severity']): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500 hover:bg-red-600';
    case 'HIGH':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'MEDIUM':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'LOW':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

// Get status color based on error status
function getStatusColor(status: TypeScriptError['status']): string {
  switch (status) {
    case 'FIXED':
      return 'text-green-500 border-green-500';
    case 'IGNORED':
      return 'text-gray-500 border-gray-500';
    case 'FIXING':
      return 'text-orange-500 border-orange-500';
    case 'NEW':
      return 'text-red-500 border-red-500';
    default:
      return 'text-gray-500 border-gray-500';
  }
}

// Get status icon based on error status
function getStatusIcon(status: TypeScriptError['status']) {
  switch (status) {
    case 'FIXED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'IGNORED':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    case 'FIXING':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'NEW':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <FileWarning className="h-4 w-4" />;
  }
}

// Format date to a readable string
function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// Format duration between two dates
function formatDuration(startTime: string, endTime?: string) {
  if (!endTime) return 'In Progress';
  
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.floor(durationMs / 1000)}s`;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  } catch (e) {
    return 'Unknown';
  }
}

// Main component
export default function TypeScriptErrorScanner() {
  const { toast } = useToast();
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [errorFilter, setErrorFilter] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<TypeScriptError | null>(null);
  
  // Fetch scan history
  const { 
    data: scanHistory = [], 
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['typescriptScans'],
    queryFn: async () => {
      const response = await fetch('/api/admin/typescript-errors/scans');
      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }
      return response.json() as Promise<ScanResult[]>;
    }
  });

  // Fetch selected scan details
  const { 
    data: scanDetails, 
    isLoading: scanDetailsLoading,
    refetch: refetchScanDetails
  } = useQuery({
    queryKey: ['typescriptScan', selectedScanId],
    queryFn: async () => {
      if (!selectedScanId) return null;
      
      const response = await fetch(`/api/admin/typescript-errors/scans/${selectedScanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scan details');
      }
      return response.json() as Promise<ScanResult>;
    },
    enabled: !!selectedScanId
  });

  // Start new scan mutation
  const startScanMutation = useMutation({
    mutationFn: async (withAI: boolean) => {
      const response = await fetch('/api/admin/typescript-errors/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aiEnabled: withAI })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start scan');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedScanId(data.id);
      setSelectedTab('details');
      toast({
        title: 'Scan Started',
        description: `TypeScript scan ${data.aiEnabled ? 'with AI' : ''} initiated successfully`,
      });
      
      // Refresh data
      setTimeout(() => {
        refetchHistory();
        refetchScanDetails();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Scan Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Apply fix mutation
  const applyFixMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      const response = await fetch(`/api/admin/typescript-errors/scans/${scanId}/errors/${errorId}/fix`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Fix Applied',
        description: 'Fix has been applied successfully',
      });
      
      // Refresh data
      setTimeout(() => {
        refetchScanDetails();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Fix Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Ignore error mutation
  const ignoreErrorMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      const response = await fetch(`/api/admin/typescript-errors/scans/${scanId}/errors/${errorId}/ignore`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to ignore error');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Error Ignored',
        description: 'Error has been marked as ignored',
      });
      
      // Refresh data
      setTimeout(() => {
        refetchScanDetails();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Ignore',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Generate AI fix mutation
  const generateAIFixMutation = useMutation({
    mutationFn: async ({ scanId, errorId }: { scanId: string; errorId: string }) => {
      const response = await fetch(`/api/admin/typescript-errors/scans/${scanId}/errors/${errorId}/ai-fix`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate AI fix');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'AI Fix Generation Started',
        description: 'The AI is analyzing the error and generating a fix...',
      });
      
      // Refresh data
      setTimeout(() => {
        refetchScanDetails();
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: 'AI Fix Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Select the latest scan automatically
  useEffect(() => {
    if (scanHistory.length > 0 && !selectedScanId) {
      setSelectedScanId(scanHistory[0].id);
    }
  }, [scanHistory, selectedScanId]);

  // Filter errors based on selection
  const filteredErrors = scanDetails?.errors?.filter(error => {
    if (errorFilter === 'all') return true;
    if (errorFilter === 'fixed') return error.status === 'FIXED';
    if (errorFilter === 'new') return error.status === 'NEW';
    if (errorFilter === 'fixing') return error.status === 'FIXING';
    if (errorFilter === 'ignored') return error.status === 'IGNORED';
    if (errorFilter === 'critical') return error.severity === 'CRITICAL';
    if (errorFilter === 'high') return error.severity === 'HIGH';
    if (errorFilter === 'medium') return error.severity === 'MEDIUM';
    if (errorFilter === 'low') return error.severity === 'LOW';
    return true;
  }) || [];

  // Check if a scan is in progress
  const isScanInProgress = scanHistory.some(scan => scan.status === 'IN_PROGRESS');

  // Calculate stats for the current scan
  const currentScanStats = scanDetails ? {
    total: scanDetails.errorCount || 0,
    fixed: scanDetails.fixedCount || 0,
    percent: scanDetails.errorCount > 0 
      ? Math.round((scanDetails.fixedCount / scanDetails.errorCount) * 100) 
      : 0
  } : { total: 0, fixed: 0, percent: 0 };

  // Handle error selection for details view
  const showErrorDetails = (error: TypeScriptError) => {
    setSelectedError(error);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>TypeScript Error Management</span>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                refetchHistory();
                if (selectedScanId) refetchScanDetails();
              }}
              disabled={historyLoading || scanDetailsLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => startScanMutation.mutate(false)} 
              disabled={isScanInProgress || startScanMutation.isPending}
            >
              {startScanMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Code className="h-4 w-4 mr-2" />
              )}
              Run Scan
            </Button>
            <Button 
              onClick={() => startScanMutation.mutate(true)} 
              disabled={isScanInProgress || startScanMutation.isPending}
            >
              {startScanMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Run Scan with AI
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Scan the codebase for TypeScript errors and manage fixes with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedScanId}>
              Scan Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <div className="text-3xl font-bold">{scanHistory.length}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {scanHistory.length > 0 ? scanHistory[0].errorCount - scanHistory[0].fixedCount : 0}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fixed Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <div className="text-3xl font-bold">
                      {scanHistory.length > 0 ? scanHistory[0].fixedCount : 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Fixed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[30px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[30px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[30px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      </TableRow>
                    ))
                  ) : scanHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No scans found. Run a new scan to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    scanHistory.map((scan) => (
                      <TableRow key={scan.id} className={scan.id === selectedScanId ? "bg-muted/50" : ""}>
                        <TableCell>{formatDate(scan.startTime)}</TableCell>
                        <TableCell>
                          <Badge variant={scan.status === 'COMPLETED' ? 'default' : scan.status === 'IN_PROGRESS' ? 'outline' : 'destructive'}>
                            {scan.status === 'IN_PROGRESS' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {scan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{scan.errorCount}</TableCell>
                        <TableCell>{scan.fixedCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={scan.errorCount > 0 ? (scan.fixedCount / scan.errorCount) * 100 : 0} className="h-2" />
                            <span className="text-xs">{scan.errorCount > 0 ? Math.round((scan.fixedCount / scan.errorCount) * 100) : 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {scan.aiEnabled ? <Zap className="h-4 w-4 text-yellow-500" /> : <ZapOff className="h-4 w-4 text-gray-400" />}
                        </TableCell>
                        <TableCell>{formatDuration(scan.startTime, scan.endTime)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedScanId(scan.id);
                            setSelectedTab('details');
                          }}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            {scanDetailsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !scanDetails ? (
              <Alert>
                <AlertTitle>No scan selected</AlertTitle>
                <AlertDescription>
                  Please select a scan from the overview tab or run a new scan.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      Scan from {formatDate(scanDetails.startTime)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {scanDetails.aiEnabled ? 'AI-powered scan' : 'Standard scan'} • 
                      {scanDetails.status === 'IN_PROGRESS' ? ' In progress...' : ` Completed in ${formatDuration(scanDetails.startTime, scanDetails.endTime)}`}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchScanDetails()}
                      disabled={scanDetailsLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    {scanDetails.status === 'IN_PROGRESS' && (
                      <Button variant="outline" size="sm" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentScanStats.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fixed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentScanStats.fixed}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentScanStats.total - currentScanStats.fixed}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-2xl font-bold">{currentScanStats.percent}%</div>
                      <Progress value={currentScanStats.percent} className="h-2 mt-2" />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={errorFilter === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('all')}
                    >
                      All ({scanDetails.errors?.length || 0})
                    </Button>
                    <Button 
                      variant={errorFilter === 'new' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('new')}
                    >
                      New ({scanDetails.errors?.filter(e => e.status === 'NEW').length || 0})
                    </Button>
                    <Button 
                      variant={errorFilter === 'fixing' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('fixing')}
                    >
                      Fixing ({scanDetails.errors?.filter(e => e.status === 'FIXING').length || 0})
                    </Button>
                    <Button 
                      variant={errorFilter === 'fixed' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('fixed')}
                    >
                      Fixed ({scanDetails.errors?.filter(e => e.status === 'FIXED').length || 0})
                    </Button>
                    <Button 
                      variant={errorFilter === 'ignored' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('ignored')}
                    >
                      Ignored ({scanDetails.errors?.filter(e => e.status === 'IGNORED').length || 0})
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={errorFilter === 'critical' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('critical')}
                    >
                      Critical
                    </Button>
                    <Button 
                      variant={errorFilter === 'high' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('high')}
                    >
                      High
                    </Button>
                    <Button 
                      variant={errorFilter === 'medium' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('medium')}
                    >
                      Medium
                    </Button>
                    <Button 
                      variant={errorFilter === 'low' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setErrorFilter('low')}
                    >
                      Low
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="lg:w-1/2">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">TypeScript Errors</CardTitle>
                        <CardDescription>
                          {filteredErrors.length} errors found with filter: {errorFilter}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                          {filteredErrors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                              <Shield className="h-12 w-12 text-green-500 mb-4" />
                              <p className="text-center text-muted-foreground">
                                {errorFilter === 'all' 
                                  ? "No errors found in this scan!" 
                                  : `No errors found with filter: ${errorFilter}`}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredErrors.map((error) => (
                                <div 
                                  key={error.id} 
                                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedError?.id === error.id ? 'bg-muted border-primary' : ''}`}
                                  onClick={() => showErrorDetails(error)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <Badge variant="outline" className={getStatusColor(error.status)}>
                                        <span className="flex items-center gap-1">
                                          {getStatusIcon(error.status)}
                                          {error.status}
                                        </span>
                                      </Badge>
                                      <div>
                                        <p className="font-medium truncate" title={error.message}>
                                          {error.message.length > 70 ? error.message.substring(0, 70) + '...' : error.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {error.file.split('/').pop()} at line {error.line}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className={getSeverityColor(error.severity)}>
                                      {error.severity}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:w-1/2">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">Error Details</CardTitle>
                        <CardDescription>
                          {selectedError ? `${selectedError.file}:${selectedError.line}` : 'Select an error to view details'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!selectedError ? (
                          <div className="flex flex-col items-center justify-center h-[400px]">
                            <Code className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-center text-muted-foreground">
                              Select an error from the list to view details
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-1">Error</h4>
                              <p className="text-sm">{selectedError.message}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-1">Location</h4>
                              <p className="text-sm">
                                {selectedError.file}:{selectedError.line}:{selectedError.column}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-1">Code</h4>
                              <p className="text-sm font-mono bg-muted p-2 rounded">
                                {selectedError.code}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-1">Category</h4>
                              <p className="text-sm">
                                {selectedError.category}
                              </p>
                            </div>
                            
                            {selectedError.fixDetails?.suggestion && (
                              <div>
                                <h4 className="font-semibold mb-1">Suggested Fix</h4>
                                <div className="text-sm font-mono bg-muted p-2 rounded">
                                  {selectedError.fixDetails.suggestion}
                                </div>
                                {selectedError.fixDetails.explanation && (
                                  <div className="mt-2">
                                    <h4 className="font-semibold mb-1">Explanation</h4>
                                    <p className="text-sm">
                                      {selectedError.fixDetails.explanation}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    {selectedError.fixDetails.aiGenerated ? 'AI Generated' : 'System Generated'}
                                  </Badge>
                                  <Badge variant="outline" className={
                                    selectedError.fixDetails.confidence === 'high' ? 'text-green-500 border-green-500' :
                                    selectedError.fixDetails.confidence === 'medium' ? 'text-yellow-500 border-yellow-500' :
                                    'text-red-500 border-red-500'
                                  }>
                                    {selectedError.fixDetails.confidence.charAt(0).toUpperCase() + selectedError.fixDetails.confidence.slice(1)} Confidence
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                      {selectedError && (
                        <CardFooter className="flex justify-end gap-2 pt-2">
                          {selectedError.status !== 'IGNORED' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => ignoreErrorMutation.mutate({ 
                                scanId: scanDetails.id, 
                                errorId: selectedError.id 
                              })}
                              disabled={ignoreErrorMutation.isPending}
                            >
                              {ignoreErrorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Ignore Error
                            </Button>
                          )}
                          
                          {selectedError.status !== 'FIXED' && scanDetails.aiEnabled && !selectedError.fixDetails?.suggestion && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => generateAIFixMutation.mutate({ 
                                scanId: scanDetails.id, 
                                errorId: selectedError.id 
                              })}
                              disabled={generateAIFixMutation.isPending}
                            >
                              {generateAIFixMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              <Zap className="h-4 w-4 mr-2" />
                              Generate AI Fix
                            </Button>
                          )}
                          
                          {selectedError.status !== 'FIXED' && selectedError.fixDetails?.suggestion && (
                            <Button 
                              size="sm"
                              onClick={() => applyFixMutation.mutate({ 
                                scanId: scanDetails.id, 
                                errorId: selectedError.id 
                              })}
                              disabled={applyFixMutation.isPending}
                            >
                              {applyFixMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Apply Fix
                            </Button>
                          )}
                        </CardFooter>
                      )}
                    </Card>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}