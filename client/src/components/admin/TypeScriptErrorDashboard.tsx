/**
 * TypeScript Error Dashboard
 * 
 * A comprehensive dashboard for visualizing TypeScript errors and their resolutions.
 * This component provides an interactive interface for developers to monitor,
 * analyze, and fix TypeScript errors throughout the codebase.
 * 
 * Features:
 * - Responsive design for different screen sizes
 * - Interactive visualizations of error trends
 * - Detailed error view with fix suggestions
 * - One-click application of fixes with validation
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  TextField,
  Menu,
  MenuItem
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Refresh,
  Code,
  BugReport,
  MoreVert,
  Search,
  FilterList
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@lib/queryClient';

// Types for the dashboard
interface TypeScriptError {
  id: number;
  code: string;
  message: string;
  filePath: string;
  line: number;
  column: number;
  severity: string;
  category: string;
  status: string;
  patternId?: number;
  fixId?: number;
  detectedAt: string;
  resolvedAt?: string;
  userId?: string;
}

interface ErrorFix {
  id: number;
  errorId: number;
  patternId?: number;
  description: string;
  replacements: Array<{
    filePath: string;
    start: number;
    end: number;
    newText: string;
    description: string;
  }>;
  isAIGenerated: boolean;
  confidence: number;
  successRate?: number;
  userId?: string;
  createdAt: string;
}

interface ErrorPattern {
  id: number;
  name: string;
  category: string;
  errorCode: string;
  autoFixable: boolean;
  frequency: number;
}

interface ResolutionResult {
  success: boolean;
  diagnostics: string[];
  fixId?: number;
  timeMs: number;
}

interface FeedbackData {
  fixId: number;
  userId: string;
  rating: number;
  comment?: string;
}

interface MetricsData {
  strategyRates: Array<{
    strategyName: string;
    successRate: number;
    totalApplications: number;
    averageTimeMs: number;
  }>;
  errorTypeRates: Array<{
    errorCode: string;
    category: string;
    successRate: number;
    totalErrors: number;
    fixCount: number;
  }>;
  trends: Array<{
    date: string;
    totalFixes: number;
    successfulFixes: number;
    aiGeneratedFixes: number;
    averageConfidence: number;
    averageSuccessRate: number;
  }>;
  aiMetrics: {
    totalFixes: number;
    successRate: number;
    averageConfidence: number;
    averageUserRating: number;
    fixesByModel: Record<string, number>;
  };
}

// Dashboard filters
interface FilterOptions {
  severity: string[];
  category: string[];
  status: string[];
  search: string;
}

// Color constants
const COLORS = {
  critical: '#ff1744',
  high: '#ff9100',
  medium: '#ffea00',
  low: '#00e676',
  info: '#00b0ff',
  success: '#00c853',
  error: '#d50000',
  warning: '#ff9100',
  pending: '#651fff',
  fixed: '#00c853',
  ignored: '#9e9e9e',
  aiGenerated: '#aa00ff',
  manual: '#2962ff'
};

/**
 * TypeScript Error Dashboard Component
 */
const TypeScriptErrorDashboard: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    severity: [],
    category: [],
    status: [],
    search: ''
  });
  
  // Selected error state
  const [selectedError, setSelectedError] = useState<TypeScriptError | null>(null);
  const [selectedFix, setSelectedFix] = useState<ErrorFix | null>(null);
  
  // Dialog states
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<ResolutionResult | null>(null);
  
  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // Auto-fix options
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Fetch errors
  const { 
    data: errors, 
    isLoading: errorsLoading, 
    error: errorsError,
    refetch: refetchErrors
  } = useQuery({
    queryKey: ['/api/typescript/errors'],
    queryFn: () => apiRequest('/api/typescript/errors', { 
      method: 'GET',
      params: {
        severity: filters.severity.join(','),
        category: filters.category.join(','),
        status: filters.status.join(','),
        search: filters.search
      }
    })
  });
  
  // Fetch metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['/api/typescript/metrics'],
    queryFn: () => apiRequest('/api/typescript/metrics')
  });
  
  // Fetch fixes for selected error
  const {
    data: fixes,
    isLoading: fixesLoading,
    error: fixesError
  } = useQuery({
    queryKey: ['/api/typescript/errors', selectedError?.id, 'fixes'],
    queryFn: () => apiRequest(`/api/typescript/errors/${selectedError?.id}/fixes`),
    enabled: !!selectedError
  });
  
  // Mutation for applying a fix
  const applyFixMutation = useMutation({
    mutationFn: (data: { errorId: number; fixId?: number }) => 
      apiRequest(`/api/typescript/errors/${data.errorId}/resolve`, { 
        method: 'POST',
        body: JSON.stringify({ 
          fixId: data.fixId,
          applyImmediately: true
        })
      }),
    onSuccess: (data) => {
      setResolutionResult(data);
      setResolutionDialogOpen(true);
      
      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Fix applied successfully!',
          severity: 'success'
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/typescript/errors'] });
        queryClient.invalidateQueries({ queryKey: ['/api/typescript/metrics'] });
      } else {
        setSnackbar({
          open: true,
          message: 'Fix application failed',
          severity: 'error'
        });
      }
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Run error scan mutation
  const runScanMutation = useMutation({
    mutationFn: (data: { includeDirs: string[]; autoFix?: boolean }) => 
      apiRequest('/api/typescript/scan', { 
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: `Scan completed: ${data.detectedErrors} errors found, ${data.resolvedErrors} fixed`,
        severity: 'info'
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/errors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/metrics'] });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Scan error: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Submit feedback for a fix
  const feedbackSubmitMutation = useMutation({
    mutationFn: (data: FeedbackData) => 
      apiRequest('/api/typescript/feedback', { 
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Feedback submitted successfully. Thank you!',
        severity: 'success'
      });
      
      // Reset feedback form
      setFeedbackRating(0);
      setFeedbackComment('');
      
      // Invalidate metrics query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/typescript/metrics'] });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Error submitting feedback: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Apply selected fix
  const handleApplyFix = () => {
    if (!selectedError) return;
    
    applyFixMutation.mutate({ 
      errorId: selectedError.id,
      fixId: selectedFix?.id
    });
  };
  
  // Run a new error scan
  const handleRunScan = () => {
    runScanMutation.mutate({
      includeDirs: ['./'],
      autoFix: autoFixEnabled
    });
  };
  
  // Submit feedback for a fix
  const handleSubmitFeedback = (fixId: number) => {
    // Simple validation
    if (feedbackRating < 1) {
      setSnackbar({
        open: true,
        message: 'Please provide a rating before submitting feedback',
        severity: 'warning'
      });
      return;
    }
    
    // Submit feedback
    feedbackSubmitMutation.mutate({
      fixId: fixId,
      userId: 'current-user', // In a real app, this would be the current authenticated user's ID
      rating: feedbackRating,
      comment: feedbackComment.trim() || undefined
    });
  };
  
  // Filter errors based on current filters
  const filteredErrors = React.useMemo(() => {
    if (!errors) return [];
    
    return errors.filter((error: TypeScriptError) => {
      // Apply severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(error.severity)) {
        return false;
      }
      
      // Apply category filter
      if (filters.category.length > 0 && !filters.category.includes(error.category)) {
        return false;
      }
      
      // Apply status filter
      if (filters.status.length > 0 && !filters.status.includes(error.status)) {
        return false;
      }
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          error.code.toLowerCase().includes(searchLower) ||
          error.message.toLowerCase().includes(searchLower) ||
          error.filePath.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [errors, filters]);
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Format error severity for display
  const getSeverityChip = (severity: string) => {
    const severityMap: Record<string, { color: string; icon: React.ReactNode }> = {
      CRITICAL: { color: COLORS.critical, icon: <ErrorIcon /> },
      HIGH: { color: COLORS.high, icon: <ErrorIcon /> },
      MEDIUM: { color: COLORS.medium, icon: <Warning /> },
      LOW: { color: COLORS.low, icon: <Info /> },
      INFO: { color: COLORS.info, icon: <Info /> }
    };
    
    const { color, icon } = severityMap[severity] || { color: COLORS.info, icon: <Info /> };
    
    return (
      <Chip 
        label={severity} 
        size="small" 
        icon={icon}
        style={{ backgroundColor: color, color: '#fff' }}
      />
    );
  };
  
  // Format error status for display
  const getStatusChip = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      fixed: { color: COLORS.fixed, icon: <CheckCircle /> },
      pending: { color: COLORS.pending, icon: <Warning /> },
      ignored: { color: COLORS.ignored, icon: <Info /> },
      security_review: { color: COLORS.warning, icon: <BugReport /> }
    };
    
    const { color, icon } = statusMap[status] || { color: COLORS.pending, icon: <Warning /> };
    
    return (
      <Chip 
        label={status.toUpperCase()} 
        size="small" 
        icon={icon}
        style={{ backgroundColor: color, color: '#fff' }}
      />
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        TypeScript Error Management Dashboard
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Refresh />}
            onClick={handleRunScan}
            disabled={runScanMutation.isPending}
            sx={{ mr: 2 }}
          >
            {runScanMutation.isPending ? 'Scanning...' : 'Run Error Scan'}
          </Button>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoFixEnabled}
                onChange={(e) => setAutoFixEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-Fix Errors"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Search errors..."
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
            }}
            sx={{ mr: 2, width: 250 }}
          />
          
          <IconButton>
            <FilterList />
          </IconButton>
        </Box>
      </Box>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Errors" />
        <Tab label="Metrics" />
        <Tab label="Patterns" />
      </Tabs>
      
      {/* Errors Tab */}
      {activeTab === 0 && (
        <Box>
          {errorsLoading ? (
            <CircularProgress />
          ) : errorsError ? (
            <Alert severity="error">Error loading errors: {(errorsError as any).message}</Alert>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                {filteredErrors.length} TypeScript Errors
              </Typography>
              
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredErrors.map((error: TypeScriptError) => (
                      <TableRow key={error.id}>
                        <TableCell>{error.code}</TableCell>
                        <TableCell>{error.message.substring(0, 50)}...</TableCell>
                        <TableCell>{error.filePath.split('/').pop()}</TableCell>
                        <TableCell>{error.line}:{error.column}</TableCell>
                        <TableCell>{getSeverityChip(error.severity)}</TableCell>
                        <TableCell>{getStatusChip(error.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedError(error);
                              setFixDialogOpen(true);
                            }}
                            disabled={error.status === 'fixed'}
                          >
                            {error.status === 'fixed' ? 'Fixed' : 'Fix'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}
      
      {/* Metrics Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {metricsLoading ? (
            <CircularProgress />
          ) : metricsError ? (
            <Alert severity="error">Error loading metrics: {(metricsError as any).message}</Alert>
          ) : (
            <>
              {/* Summary Cards */}
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Errors
                    </Typography>
                    <Typography variant="h3">
                      {errors?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fixed Errors
                    </Typography>
                    <Typography variant="h3">
                      {errors?.filter((e: TypeScriptError) => e.status === 'fixed').length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Success Rate
                    </Typography>
                    <Typography variant="h3">
                      {metrics && errors && errors.length > 0 
                        ? Math.round((errors.filter((e: TypeScriptError) => e.status === 'fixed').length / errors.length) * 100)
                        : 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      AI-Generated Fixes
                    </Typography>
                    <Typography variant="h3">
                      {metrics?.aiMetrics?.totalFixes || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Charts */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Errors by Severity
                    </Typography>
                    {errors && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'CRITICAL', value: errors.filter((e: TypeScriptError) => e.severity === 'CRITICAL').length },
                              { name: 'HIGH', value: errors.filter((e: TypeScriptError) => e.severity === 'HIGH').length },
                              { name: 'MEDIUM', value: errors.filter((e: TypeScriptError) => e.severity === 'MEDIUM').length },
                              { name: 'LOW', value: errors.filter((e: TypeScriptError) => e.severity === 'LOW').length },
                              { name: 'INFO', value: errors.filter((e: TypeScriptError) => e.severity === 'INFO').length }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="CRITICAL" fill={COLORS.critical} />
                            <Cell key="HIGH" fill={COLORS.high} />
                            <Cell key="MEDIUM" fill={COLORS.medium} />
                            <Cell key="LOW" fill={COLORS.low} />
                            <Cell key="INFO" fill={COLORS.info} />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fix Success Rate by Strategy
                    </Typography>
                    {metrics?.strategyRates && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.strategyRates}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="strategyName" />
                          <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                          <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
                          <Legend />
                          <Bar dataKey="successRate" fill="#8884d8" name="Success Rate" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fix Trend Over Time
                    </Typography>
                    {metrics?.trends && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="totalFixes" stroke="#8884d8" name="Total Fixes" />
                          <Line type="monotone" dataKey="successfulFixes" stroke="#82ca9d" name="Successful Fixes" />
                          <Line type="monotone" dataKey="aiGeneratedFixes" stroke="#ffc658" name="AI-Generated Fixes" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      )}
      
      {/* Fix Dialog */}
      <Dialog
        open={fixDialogOpen}
        onClose={() => setFixDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedError && (
            <>
              Fix Error: {selectedError.code}
              <Typography variant="subtitle2">
                {selectedError.filePath}:{selectedError.line}:{selectedError.column}
              </Typography>
            </>
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedError && (
            <>
              <Typography variant="h6" gutterBottom>
                Error Details
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Message:</strong> {selectedError.message}
                </Typography>
                <Typography variant="body2">
                  <strong>Severity:</strong> {getSeverityChip(selectedError.severity)}
                </Typography>
                <Typography variant="body2">
                  <strong>Category:</strong> {selectedError.category}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {getStatusChip(selectedError.status)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Available Fixes
              </Typography>
              
              {fixesLoading ? (
                <CircularProgress />
              ) : fixesError ? (
                <Alert severity="error">Error loading fixes: {(fixesError as any).message}</Alert>
              ) : fixes && fixes.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {fixes.map((fix: ErrorFix) => (
                    <Card 
                      key={fix.id} 
                      sx={{ 
                        mb: 2, 
                        border: selectedFix?.id === fix.id ? `2px solid ${COLORS.success}` : 'none'
                      }}
                      onClick={() => setSelectedFix(fix)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">
                            {fix.description}
                          </Typography>
                          <Chip 
                            label={fix.isAIGenerated ? 'AI-Generated' : 'Manual'} 
                            color={fix.isAIGenerated ? 'secondary' : 'primary'} 
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Confidence:</strong> {Math.round(fix.confidence * 100)}%
                          </Typography>
                          {fix.successRate !== undefined && (
                            <Typography variant="body2">
                              <strong>Success Rate:</strong> {Math.round(fix.successRate * 100)}%
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                            {fix.replacements.map((replacement, i) => (
                              <Box key={i} component="span" sx={{ display: 'block' }}>
                                {`--- ${replacement.filePath}`}<br />
                                {`+++ ${replacement.newText}`}
                              </Box>
                            ))}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No fixes available yet. Try generating a fix.</Alert>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleApplyFix}
                  disabled={!selectedFix || applyFixMutation.isPending}
                  fullWidth
                >
                  {applyFixMutation.isPending ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                      Applying Fix...
                    </>
                  ) : (
                    'Apply Selected Fix'
                  )}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setFixDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Resolution Result Dialog */}
      <Dialog
        open={resolutionDialogOpen}
        onClose={() => setResolutionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Fix Application Result
        </DialogTitle>
        
        <DialogContent dividers>
          {resolutionResult && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {resolutionResult.success ? (
                  <Alert severity="success" sx={{ width: '100%' }}>
                    Fix applied successfully in {resolutionResult.timeMs}ms!
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ width: '100%' }}>
                    Failed to apply fix.
                  </Alert>
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Diagnostics Log
              </Typography>
              
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2, maxHeight: '300px', overflowY: 'auto' }}>
                <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                  {resolutionResult.diagnostics.join('\n')}
                </Typography>
              </Box>
              
              {resolutionResult.success && resolutionResult.fixId && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Provide Feedback
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Your feedback helps improve the quality of automated fixes.
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Rate this fix:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <IconButton 
                          key={rating}
                          onClick={() => setFeedbackRating(rating)}
                          color={feedbackRating >= rating ? "primary" : "default"}
                          size="large"
                        >
                          {rating <= feedbackRating ? (
                            <span role="img" aria-label={`${rating} stars`}>★</span>
                          ) : (
                            <span role="img" aria-label={`${rating} stars`}>☆</span>
                          )}
                        </IconButton>
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Comments (optional):
                    </Typography>
                    <TextField
                      multiline
                      rows={2}
                      fullWidth
                      placeholder="What worked well or could be improved about this fix?"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                    
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      disabled={!feedbackRating || feedbackSubmitMutation.isPending}
                      onClick={() => handleSubmitFeedback(resolutionResult.fixId!)}
                    >
                      {feedbackSubmitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => {
              setResolutionDialogOpen(false);
              setFixDialogOpen(false);
              setFeedbackRating(0);
              setFeedbackComment('');
              // Refresh data
              refetchErrors();
              refetchMetrics();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TypeScriptErrorDashboard;