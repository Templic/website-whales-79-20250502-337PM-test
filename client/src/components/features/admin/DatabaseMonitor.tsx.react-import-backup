/**
 * DatabaseMonitor.tsx
 * 
 * Component Type: feature
 * Migrated as part of the repository reorganization.
 */import React from "react";

import { useState, useEffect } from 'react';

// Add named export for backward compatibility
export { default as DatabaseMonitor } from './DatabaseMonitor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, RefreshCw, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types for database status response
interface DatabaseStatus {
  status: string;
  time: string;
  database_size: {
    size: string;
    size_bytes: number;
  };
  pool_stats: {
    total: number | string;
    active: number | string;
    idle: number | string;
    waiting: number | string;
  };
  table_stats: Array<{
    table_name: string;
    row_count: number;
    total_size: string;
    table_size: string;
    index_size: string;
  }>;
  index_stats: Array<{
    index_name: string;
    table_name: string;
    scan_count: number;
    tuples_read: number;
    tuples_fetched: number;
    index_size: string;
  }>;
}

// Types for query statistics
interface QueryStats {
  status: string;
  message?: string;  // Optional message for error states
  query_stats: Array<{
    query: string;
    calls: number;
    total_time: number;
    min_time: number;
    max_time: number;
    mean_time: number;
    stddev_time: number;
    rows: number;
  }>;
}



/**
 * Original DatabaseMonitor component merged from: client/src/components/admin/DatabaseMonitor.tsx
 * Merge date: 2025-04-05
 */
function DatabaseMonitorOriginal() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database status
  const { data: dbStatus, isLoading: isStatusLoading, error: statusError, refetch: refetchStatus } = 
    useQuery<DatabaseStatus>({
      queryKey: ['/api/admin/db-monitor/status'],
      refetchInterval: 60000, // Refresh every minute
    });

  // Fetch query statistics
  const { data: queryStats, isLoading: isQueryStatsLoading, error: queryStatsError, refetch: refetchQueryStats } = 
    useQuery<QueryStats>({
      queryKey: ['/api/admin/db-monitor/query-stats'],
      enabled: selectedTab === 'queries',
      refetchOnWindowFocus: false,
    });

  // Mutation for triggering maintenance tasks
  const maintenanceMutation = useMutation({
    mutationFn: async ({ task }: { task: string }) => {
      return apiRequest(`/api/admin/db-monitor/maintenance/${task}`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance task scheduled',
        description: 'The database maintenance task has been scheduled successfully.',
        variant: 'default',
      });
      // Refetch status after a delay to allow task to start
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/db-monitor/status'] });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Maintenance task failed',
        description: `Failed to schedule maintenance task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Helper to format bytes to readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handler for maintenance task buttons
  const triggerMaintenance = (task: string) => {
    maintenanceMutation.mutate({ task });
  };

  // If there are errors, show an error alert
  if (statusError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load database status. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Database Health Monitor</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStatus();
            if (selectedTab === 'queries') refetchQueryStats();
          }}
          disabled={isStatusLoading || isQueryStatsLoading}
        >
          {(isStatusLoading || isQueryStatsLoading) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="queries">Query Stats</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dbStatus.database_size.size}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatBytes(dbStatus.database_size.size_bytes)}
                    </p>
                    {/* Display size trend if available */}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Connection Pool</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{dbStatus.pool_stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Connections</p>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{dbStatus.pool_stats.active}</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{dbStatus.pool_stats.idle}</div>
                        <p className="text-xs text-muted-foreground">Idle</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Badge variant={dbStatus.status === 'connected' ? 'default' : 'destructive'} className="mr-2">
                        {dbStatus.status === 'connected' ? 'Connected' : 'Error'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Last checked: {new Date(dbStatus.time).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tables: {dbStatus.table_stats.length} | Indexes: {dbStatus.index_stats.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Tables by Size</CardTitle>
                  <CardDescription>Tables with the largest storage footprint</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Name</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbStatus.table_stats
                        .sort((a, b) => b.row_count - a.row_count)
                        .slice(0, 5)
                        .map((table) => (
                          <TableRow key={table.table_name}>
                            <TableCell className="font-medium">{table.table_name}</TableCell>
                            <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{table.total_size}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                Unable to fetch database status information. Please check your connection.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Table Statistics</CardTitle>
                <CardDescription>Detailed information about database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Table Size</TableHead>
                      <TableHead className="text-right">Index Size</TableHead>
                      <TableHead className="text-right">Total Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStatus.table_stats.map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="font-medium">{table.table_name}</TableCell>
                        <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{table.table_size}</TableCell>
                        <TableCell className="text-right">{table.index_size}</TableCell>
                        <TableCell className="text-right">{table.total_size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Indexes Tab */}
        <TabsContent value="indexes">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Index Statistics</CardTitle>
                <CardDescription>Performance metrics for database indexes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index Name</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead className="text-right">Tuples Read</TableHead>
                      <TableHead className="text-right">Tuples Fetched</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStatus.index_stats.map((index) => (
                      <TableRow key={`${index.table_name}-${index.index_name}`}>
                        <TableCell className="font-medium">{index.index_name}</TableCell>
                        <TableCell>{index.table_name}</TableCell>
                        <TableCell className="text-right">{index.scan_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.tuples_read.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.tuples_fetched.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.index_size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Query Stats Tab */}
        <TabsContent value="queries">
          {isQueryStatsLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : queryStats ? (
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Statistics about query execution performance</CardDescription>
              </CardHeader>
              <CardContent>
                {queryStats.status === 'extension_not_available' || queryStats.status === 'extension_error' ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Extension Not Available</AlertTitle>
                    <AlertDescription>
                      {queryStats.message || 'The pg_stat_statements extension is not enabled on this database. This extension is required to collect query statistics.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Mean Time (ms)</TableHead>
                        <TableHead className="text-right">Total Time (ms)</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryStats.query_stats.map((stat, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {stat.query.length > 100 
                              ? `${stat.query.substring(0, 100)}...` 
                              : stat.query}
                          </TableCell>
                          <TableCell className="text-right">{stat.calls.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {(stat.mean_time).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(stat.total_time).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{stat.rows.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : queryStatsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load query statistics. This feature may not be available on your database.
              </AlertDescription>
            </Alert>
          ) : null}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>Tools to optimize database performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">VACUUM ANALYZE</CardTitle>
                    <CardDescription>
                      Reclaims storage occupied by dead tuples and updates statistics used by the query planner.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('vacuum')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'vacuum' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Run VACUUM
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">REINDEX</CardTitle>
                    <CardDescription>
                      Rebuilds indexes to improve query performance and reduce index bloat.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('reindex')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'reindex' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Run REINDEX
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyze Slow Queries</CardTitle>
                    <CardDescription>
                      Identifies slow-performing queries for optimization.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('analyze')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'analyze' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Analyze Queries
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Maintenance Information</AlertTitle>
                <AlertDescription>
                  Database maintenance operations run in the background and may take some time to complete.
                  Heavy operations like REINDEX might temporarily impact database performance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DatabaseMonitor() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database status
  const { data: dbStatus, isLoading: isStatusLoading, error: statusError, refetch: refetchStatus } = 
    useQuery<DatabaseStatus>({
      queryKey: ['/api/admin/db-monitor/status'],
      refetchInterval: 60000, // Refresh every minute
    });

  // Fetch query statistics
  const { data: queryStats, isLoading: isQueryStatsLoading, error: queryStatsError, refetch: refetchQueryStats } = 
    useQuery<QueryStats>({
      queryKey: ['/api/admin/db-monitor/query-stats'],
      enabled: selectedTab === 'queries',
      refetchOnWindowFocus: false,
    });

  // Mutation for triggering maintenance tasks
  const maintenanceMutation = useMutation({
    mutationFn: async ({ task }: { task: string }) => {
      return apiRequest(`/api/admin/db-monitor/maintenance/${task}`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance task scheduled',
        description: 'The database maintenance task has been scheduled successfully.',
        variant: 'default',
      });
      // Refetch status after a delay to allow task to start
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/db-monitor/status'] });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Maintenance task failed',
        description: `Failed to schedule maintenance task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Helper to format bytes to readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handler for maintenance task buttons
  const triggerMaintenance = (task: string) => {
    maintenanceMutation.mutate({ task });
  };

  // If there are errors, show an error alert
  if (statusError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load database status. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Database Health Monitor</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchStatus();
            if (selectedTab === 'queries') refetchQueryStats();
          }}
          disabled={isStatusLoading || isQueryStatsLoading}
        >
          {(isStatusLoading || isQueryStatsLoading) ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="queries">Query Stats</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dbStatus.database_size.size}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatBytes(dbStatus.database_size.size_bytes)}
                    </p>
                    {/* Display size trend if available */}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Connection Pool</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{dbStatus.pool_stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total Connections</p>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{dbStatus.pool_stats.active}</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">{dbStatus.pool_stats.idle}</div>
                        <p className="text-xs text-muted-foreground">Idle</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Badge variant={dbStatus.status === 'connected' ? 'default' : 'destructive'} className="mr-2">
                        {dbStatus.status === 'connected' ? 'Connected' : 'Error'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Last checked: {new Date(dbStatus.time).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tables: {dbStatus.table_stats.length} | Indexes: {dbStatus.index_stats.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Tables by Size</CardTitle>
                  <CardDescription>Tables with the largest storage footprint</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Name</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbStatus.table_stats
                        .sort((a, b) => b.row_count - a.row_count)
                        .slice(0, 5)
                        .map((table) => (
                          <TableRow key={table.table_name}>
                            <TableCell className="font-medium">{table.table_name}</TableCell>
                            <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{table.total_size}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                Unable to fetch database status information. Please check your connection.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Table Statistics</CardTitle>
                <CardDescription>Detailed information about database tables</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Table Size</TableHead>
                      <TableHead className="text-right">Index Size</TableHead>
                      <TableHead className="text-right">Total Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStatus.table_stats.map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="font-medium">{table.table_name}</TableCell>
                        <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{table.table_size}</TableCell>
                        <TableCell className="text-right">{table.index_size}</TableCell>
                        <TableCell className="text-right">{table.total_size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Indexes Tab */}
        <TabsContent value="indexes">
          {isStatusLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dbStatus ? (
            <Card>
              <CardHeader>
                <CardTitle>Index Statistics</CardTitle>
                <CardDescription>Performance metrics for database indexes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index Name</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead className="text-right">Tuples Read</TableHead>
                      <TableHead className="text-right">Tuples Fetched</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStatus.index_stats.map((index) => (
                      <TableRow key={`${index.table_name}-${index.index_name}`}>
                        <TableCell className="font-medium">{index.index_name}</TableCell>
                        <TableCell>{index.table_name}</TableCell>
                        <TableCell className="text-right">{index.scan_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.tuples_read.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.tuples_fetched.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{index.index_size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Query Stats Tab */}
        <TabsContent value="queries">
          {isQueryStatsLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : queryStats ? (
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Statistics about query execution performance</CardDescription>
              </CardHeader>
              <CardContent>
                {queryStats.status === 'extension_not_available' || queryStats.status === 'extension_error' ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Extension Not Available</AlertTitle>
                    <AlertDescription>
                      {queryStats.message || 'The pg_stat_statements extension is not enabled on this database. This extension is required to collect query statistics.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Mean Time (ms)</TableHead>
                        <TableHead className="text-right">Total Time (ms)</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryStats.query_stats.map((stat, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {stat.query.length > 100 
                              ? `${stat.query.substring(0, 100)}...` 
                              : stat.query}
                          </TableCell>
                          <TableCell className="text-right">{stat.calls.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {(stat.mean_time).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(stat.total_time).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{stat.rows.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : queryStatsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load query statistics. This feature may not be available on your database.
              </AlertDescription>
            </Alert>
          ) : null}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>Tools to optimize database performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">VACUUM ANALYZE</CardTitle>
                    <CardDescription>
                      Reclaims storage occupied by dead tuples and updates statistics used by the query planner.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('vacuum')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'vacuum' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Run VACUUM
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">REINDEX</CardTitle>
                    <CardDescription>
                      Rebuilds indexes to improve query performance and reduce index bloat.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('reindex')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'reindex' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Run REINDEX
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analyze Slow Queries</CardTitle>
                    <CardDescription>
                      Identifies slow-performing queries for optimization.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => triggerMaintenance('analyze')}
                      disabled={maintenanceMutation.isPending}
                      className="w-full"
                    >
                      {maintenanceMutation.isPending && maintenanceMutation.variables?.task === 'analyze' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Analyze Queries
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Maintenance Information</AlertTitle>
                <AlertDescription>
                  Database maintenance operations run in the background and may take some time to complete.
                  Heavy operations like REINDEX might temporarily impact database performance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}