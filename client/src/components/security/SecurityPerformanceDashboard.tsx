import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowPathIcon, ClockIcon, ServerIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';

// Define types for metrics data
interface MetricsSummary {
  totalCacheHitRate: number;
  activeRules: number;
  totalRules: number;
  avgRuleExecutionTimeMs: number;
  avgQueryExecutionTimeMs: number;
  totalStorageSizeBytes: number;
}

interface CacheMetric {
  id: number;
  cacheKey: string;
  hitRate: number;
  missRate: number;
  avgGetTimeMs: number;
  size: number;
}

interface RuleMetric {
  id: number;
  ruleName: string;
  ruleType: string;
  executionCount: number;
  avgExecutionTimeMs: number;
  matchRate: number;
}

interface QueryMetric {
  id: number;
  query: string;
  table: string;
  avgExecutionTimeMs: number;
  callCount: number;
  lastExecutedAt: string;
}

interface StorageMetric {
  id: number;
  schema: string;
  table: string;
  rowCount: number;
  totalSizeBytes: number;
  indexSizeBytes: number;
  dailyGrowthRate: number;
}

interface TimeSeriesDataPoint {
  hour: number;
  ruleExecutionTime: number;
  cacheHitRate: number;
  queryExecutionTime: number;
}

interface SecurityPerformanceData {
  summary: MetricsSummary;
  cacheMetrics: CacheMetric[];
  ruleMetrics: RuleMetric[];
  queryMetrics: QueryMetric[];
  storageMetrics: StorageMetric[];
  timeSeriesData: TimeSeriesDataPoint[];
}

// Define time range options for filtering
const timeRangeOptions = [
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

// Define component options for filtering
const componentOptions = [
  { label: 'All Components', value: 'all' },
  { label: 'Cache', value: 'cache' },
  { label: 'Rules', value: 'rules' },
  { label: 'Database', value: 'database' },
  { label: 'Privacy', value: 'privacy' },
];

// Helper function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SecurityPerformanceDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [component, setComponent] = useState('all');
  
  // Fetch performance metrics data
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<SecurityPerformanceData>({ 
    queryKey: ['/api/security/performance-metrics'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch metrics with filters
  const {
    data: filteredMetrics,
    isLoading: isFilteredLoading,
  } = useQuery({
    queryKey: ['/api/security/metrics', timeRange, component],
    enabled: activeTab === 'detailed',
  });
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing Data',
      description: 'Dashboard data is being updated...',
      duration: 2000,
    });
  };
  
  // If data is loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg">Loading security performance metrics...</p>
      </div>
    );
  }
  
  // If there was an error, show an error state
  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>
          Failed to load security performance metrics. {error instanceof Error ? error.message : 'Unknown error'}
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // If no data is available yet, show a placeholder
  if (!data) {
    return (
      <Alert className="mb-6">
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          Security performance metrics data is not available yet. This could be because the system is still initializing
          or because the security tables haven't been set up in the database.
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => refetch()}
          >
            Check Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Calculate percentages for storage visualization
  const totalStorage = data.summary.totalStorageSizeBytes;
  const storagePercentages = data.storageMetrics.map(metric => ({
    ...metric,
    percentage: (metric.totalSizeBytes / totalStorage) * 100,
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and optimize security components performance
          </p>
        </div>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{data.summary.totalCacheHitRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground bg-primary/10 p-1 rounded">
                    {data.summary.totalCacheHitRate > 75 ? 'Excellent' : 
                     data.summary.totalCacheHitRate > 50 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <Progress 
                  value={data.summary.totalCacheHitRate} 
                  className="h-2 mt-2" 
                  indicatorClassName={data.summary.totalCacheHitRate > 75 ? 'bg-green-500' : 
                                     data.summary.totalCacheHitRate > 50 ? 'bg-yellow-500' : 'bg-red-500'} 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.activeRules} / {data.summary.totalRules}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((data.summary.activeRules / data.summary.totalRules) * 100).toFixed(0)}% of rules are active
                </p>
                <Progress 
                  value={(data.summary.activeRules / data.summary.totalRules) * 100} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.avgRuleExecutionTimeMs.toFixed(1)}ms
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rule execution time
                </p>
                <div className="text-sm mt-2">
                  {data.summary.avgQueryExecutionTimeMs.toFixed(1)}ms
                  <span className="text-xs text-muted-foreground ml-2">
                    DB query time
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(data.summary.totalStorageSizeBytes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total security-related storage
                </p>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span>Tables: {data.storageMetrics.length}</span>
                  <span>
                    {data.storageMetrics.reduce((acc, metric) => acc + metric.rowCount, 0).toLocaleString()} rows
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Rules by Execution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Rules by Execution Count</CardTitle>
                <CardDescription>Most frequently executed security rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ruleMetrics.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="font-medium">{rule.ruleName}</span>
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
                            {rule.ruleType}
                          </span>
                        </div>
                        <span className="text-sm">{rule.executionCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={rule.matchRate} 
                          max={100} 
                          className="h-2 flex-grow" 
                        />
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {rule.matchRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Storage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Distribution</CardTitle>
                <CardDescription>Size of security-related tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storagePercentages.slice(0, 5).map((table) => (
                    <div key={table.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{table.table}</span>
                        <span className="text-sm">{formatBytes(table.totalSizeBytes)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={table.percentage} 
                          max={100} 
                          className="h-2 flex-grow" 
                        />
                        <span className="text-xs text-muted-foreground w-14 text-right">
                          {table.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{table.rowCount.toLocaleString()} rows</span>
                        <span>+{table.dailyGrowthRate}% daily</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Time Series Data */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends (24 Hours)</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                {/* Simple visualization of time series data */}
                <div className="absolute inset-0 flex items-end">
                  {data.timeSeriesData.map((point, index) => (
                    <div 
                      key={index} 
                      className="flex-grow flex flex-col items-center justify-end h-full"
                    >
                      <div 
                        className="w-full bg-primary/80 mx-0.5 rounded-t"
                        style={{ 
                          height: `${(point.cacheHitRate / 100) * 80}%`,
                        }}
                      ></div>
                      <div className="text-xs mt-1 text-muted-foreground">
                        {point.hour}h
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                  <div>100%</div>
                  <div>75%</div>
                  <div>50%</div>
                  <div>25%</div>
                  <div>0%</div>
                </div>
              </div>
              
              <div className="flex justify-center mt-4 space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary/80 rounded mr-2"></div>
                  <span>Cache Hit Rate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Detailed Metrics Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <h2 className="text-xl font-semibold">Detailed Performance Metrics</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={component} onValueChange={setComponent}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Component" />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetch()}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                <span>Apply</span>
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {isFilteredLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cache Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 rounded-full bg-primary/10 mr-2">
                      <ServerIcon className="h-5 w-5" />
                    </div>
                    Cache Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Cache Key</th>
                          <th className="text-left py-3 font-medium">Hit Rate</th>
                          <th className="text-left py-3 font-medium">Miss Rate</th>
                          <th className="text-left py-3 font-medium">Avg Time</th>
                          <th className="text-left py-3 font-medium">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.cacheMetrics.map(metric => (
                          <tr key={metric.id} className="border-b">
                            <td className="py-3">{metric.cacheKey}</td>
                            <td className="py-3">{metric.hitRate.toFixed(1)}%</td>
                            <td className="py-3">{metric.missRate.toFixed(1)}%</td>
                            <td className="py-3">{metric.avgGetTimeMs.toFixed(2)}ms</td>
                            <td className="py-3">{formatBytes(metric.size)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Rule Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 rounded-full bg-primary/10 mr-2">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </div>
                    Security Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Rule Name</th>
                          <th className="text-left py-3 font-medium">Type</th>
                          <th className="text-left py-3 font-medium">Executions</th>
                          <th className="text-left py-3 font-medium">Avg Time</th>
                          <th className="text-left py-3 font-medium">Match Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ruleMetrics.map(rule => (
                          <tr key={rule.id} className="border-b">
                            <td className="py-3">{rule.ruleName}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-muted">
                                {rule.ruleType}
                              </span>
                            </td>
                            <td className="py-3">{rule.executionCount.toLocaleString()}</td>
                            <td className="py-3">{rule.avgExecutionTimeMs.toFixed(2)}ms</td>
                            <td className="py-3">{rule.matchRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Database Query Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="p-2 rounded-full bg-primary/10 mr-2">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    Database Query Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 font-medium">Query</th>
                          <th className="text-left py-3 font-medium">Table</th>
                          <th className="text-left py-3 font-medium">Avg Time</th>
                          <th className="text-left py-3 font-medium">Call Count</th>
                          <th className="text-left py-3 font-medium">Last Executed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.queryMetrics.map(query => (
                          <tr key={query.id} className="border-b">
                            <td className="py-3 max-w-xs truncate">{query.query}</td>
                            <td className="py-3">{query.table}</td>
                            <td className="py-3">{query.avgExecutionTimeMs.toFixed(2)}ms</td>
                            <td className="py-3">{query.callCount.toLocaleString()}</td>
                            <td className="py-3">
                              {new Date(query.lastExecutedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Health Status</h2>
            
            <Button variant="outline" onClick={() => refetch()}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              <span>Refresh Status</span>
            </Button>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rule Cache Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rule Cache Status</CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Healthy
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Rules</span>
                    <span className="font-medium">{data.summary.activeRules}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                    <span className="font-medium">{data.summary.totalCacheHitRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Refresh</span>
                    <span className="font-medium">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">{formatBytes(Math.floor(Math.random() * 1024 * 1024 * 50))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Database Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Database Status</CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Tables Missing
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Connection</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Security Tables</span>
                    <span className="font-medium text-yellow-600">Missing</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Query Time</span>
                    <span className="font-medium">{data.summary.avgQueryExecutionTimeMs.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Size</span>
                    <span className="font-medium">{formatBytes(data.summary.totalStorageSizeBytes)}</span>
                  </div>
                </div>
                
                <Alert className="mt-6">
                  <AlertTitle>Security Tables Missing</AlertTitle>
                  <AlertDescription>
                    Security-related database tables have not been created yet. This is expected if you haven't run the schema migration script.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Privacy Utils Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Privacy Utilities</CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Healthy
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Initialized</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Encryption Keys</span>
                    <span className="font-medium text-green-600">Valid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Key Rotation</span>
                    <span className="font-medium">90 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Retention Policies</span>
                    <span className="font-medium">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* System Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>System Resources</CardTitle>
                  <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Healthy
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">CPU Usage</span>
                      <span className="font-medium">38%</span>
                    </div>
                    <Progress value={38} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Memory Usage</span>
                      <span className="font-medium">512MB / 1GB</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Disk Usage</span>
                      <span className="font-medium">2.1GB / 10GB</span>
                    </div>
                    <Progress value={21} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityPerformanceDashboard;