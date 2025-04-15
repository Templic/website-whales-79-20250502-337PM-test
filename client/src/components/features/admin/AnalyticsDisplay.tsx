/**
 * AnalyticsDisplay.tsx
 * 
 * A comprehensive component for displaying content analytics data
 * with interactive charts and metrics visualization.
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Cell 
} from 'recharts';
import {
  Calendar,
  BarChart as BarChartIcon,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Zap,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateRangePicker } from "@/components/ui/date-range-picker";

// Define colors for consistent styling
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#a855f7',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  success: '#22c55e',
  background: '#020817',
  foreground: '#ffffff',
  muted: '#64748b'
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  review: '#f59e0b', 
  changes_requested: '#ef4444',
  approved: '#10b981',
  published: '#3b82f6',
  archived: '#6b7280'
};

// Type definitions for component props
export interface AnalyticsDisplayProps {
  /**
   * Time range for displaying analytics data
   * @default "last-30-days"
   */
  timeRange?: 'today' | 'last-7-days' | 'last-30-days' | 'last-90-days' | 'year-to-date' | 'custom';
  
  /**
   * Custom date range start (only used when timeRange is 'custom')
   */
  customRangeStart?: Date;
  
  /**
   * Custom date range end (only used when timeRange is 'custom')
   */
  customRangeEnd?: Date;
  
  /**
   * Whether to show visitor statistics
   * @default true
   */
  showVisitors?: boolean;
  
  /**
   * Whether to show conversion statistics
   * @default true
   */
  showConversions?: boolean;
  
  /**
   * Whether to show revenue statistics
   * @default true
   */
  showRevenue?: boolean;
  
  /**
   * Refresh interval in seconds (0 for no auto-refresh)
   * @default 0
   */
  refreshInterval?: number;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

export function AnalyticsDisplay({
  timeRange = 'last-30-days',
  customRangeStart,
  customRangeEnd,
  showVisitors = true,
  showConversions = true,
  showRevenue = true,
  refreshInterval = 0,
  className = ''
}: AnalyticsDisplayProps) {
  // Calculate date range based on timeRange prop
  const getDateRange = () => {
    const today = new Date();
    
    switch(timeRange) {
      case 'today':
        return { from: today, to: today };
      case 'last-7-days':
        return { from: subDays(today, 7), to: today };
      case 'last-30-days':
        return { from: subDays(today, 30), to: today };
      case 'last-90-days':
        return { from: subDays(today, 90), to: today };
      case 'year-to-date':
        return { from: new Date(today.getFullYear(), 0, 1), to: today };
      case 'custom':
        return { 
          from: customRangeStart || subDays(today, 30), 
          to: customRangeEnd || today 
        };
      default:
        return { from: subDays(today, 30), to: today };
    }
  };

  // State for date range
  const [dateRange, setDateRange] = useState(getDateRange());
  
  // Update date range when props change
  useEffect(() => {
    setDateRange(getDateRange());
  }, [timeRange, customRangeStart, customRangeEnd]);
  
  // Handle date range changes from the picker
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Fetch content analytics data
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics, 
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: [
      '/api/content-workflow/analytics', 
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd')
    ],
    queryFn: async () => {
      const response = await fetch(
        `/api/content-workflow/analytics?start=${format(dateRange.from, 'yyyy-MM-dd')}&end=${format(dateRange.to, 'yyyy-MM-dd')}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch content analytics');
      }
      return response.json();
    }
  });

  // Auto-refresh based on interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        refetchAnalytics();
      }, refreshInterval * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, refetchAnalytics]);

  // Prepare data for throughput chart
  const getThroughputData = () => {
    if (!analyticsData?.throughput) return [];
    
    return [
      {
        name: 'Last 24 Hours',
        Created: analyticsData.throughput.last24Hours.totalCreated,
        Published: analyticsData.throughput.last24Hours.totalPublished,
        Updated: analyticsData.throughput.last24Hours.totalUpdated,
        Archived: analyticsData.throughput.last24Hours.totalArchived,
      },
      {
        name: 'Last 7 Days',
        Created: analyticsData.throughput.last7Days.totalCreated,
        Published: analyticsData.throughput.last7Days.totalPublished,
        Updated: analyticsData.throughput.last7Days.totalUpdated,
        Archived: analyticsData.throughput.last7Days.totalArchived,
      },
      {
        name: 'Last 30 Days',
        Created: analyticsData.throughput.last30Days.totalCreated,
        Published: analyticsData.throughput.last30Days.totalPublished,
        Updated: analyticsData.throughput.last30Days.totalUpdated,
        Archived: analyticsData.throughput.last30Days.totalArchived,
      }
    ];
  };

  // Prepare data for workflow status distribution chart
  const getWorkflowStatusData = () => {
    if (!analyticsData?.workflow) return [];
    
    return [
      { name: 'Draft', value: analyticsData.workflow.totalInDraft, color: STATUS_COLORS.draft },
      { name: 'In Review', value: analyticsData.workflow.totalInReview, color: STATUS_COLORS.review },
      { name: 'Approved', value: analyticsData.workflow.totalApproved, color: STATUS_COLORS.approved },
      { name: 'Published', value: analyticsData.workflow.totalPublished, color: STATUS_COLORS.published },
      { name: 'Archived', value: analyticsData.workflow.totalArchived, color: STATUS_COLORS.archived }
    ];
  };

  // Display error if analytics fetch failed
  if (analyticsError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>
          Failed to load content analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics header with date range picker */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content Analytics</h2>
          <p className="text-muted-foreground">
            Monitor and analyze your content performance
          </p>
        </div>
        
        <div className="flex space-x-2 items-center">
          <DateRangePicker 
            from={dateRange.from}
            to={dateRange.to}
            onSelect={handleDateRangeChange}
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetchAnalytics()}
            disabled={isLoadingAnalytics}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main analytics content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingAnalytics ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-[150px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-[100px] mb-4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Content Creation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Content Creation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.throughput?.last30Days.totalCreated || 0}
                  </div>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {analyticsData?.throughput?.last24Hours.totalCreated || 0} today
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total items created in last 30 days
                  </p>
                </CardContent>
              </Card>
              
              {/* Content Published */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Published Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.throughput?.last30Days.totalPublished || 0}
                  </div>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {analyticsData?.throughput?.last24Hours.totalPublished || 0} today
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total items published in last 30 days
                  </p>
                </CardContent>
              </Card>
              
              {/* Approval Rate */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.workflow?.approvalRate.toFixed(1) || 0}%
                  </div>
                  <Progress 
                    value={analyticsData?.workflow?.approvalRate || 0} 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Percentage of content approved in the workflow
                  </p>
                </CardContent>
              </Card>
              
              {/* Upcoming Publications */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Publications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData?.scheduling?.upcomingPublications || 0}
                  </div>
                  <div className="flex items-center mt-2">
                    <Badge variant={analyticsData?.scheduling?.soonExpiring ? "destructive" : "outline"} className="text-xs">
                      {analyticsData?.scheduling?.soonExpiring || 0} expiring soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Content scheduled for future publication
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Throughput Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Content Throughput</CardTitle>
              <CardDescription>Content creation and publishing activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getThroughputData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="Created" fill={COLORS.primary} />
                    <Bar dataKey="Published" fill={COLORS.success} />
                    <Bar dataKey="Updated" fill={COLORS.info} />
                    <Bar dataKey="Archived" fill={COLORS.muted} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Workflow Distribution */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
                <CardDescription>Distribution of content by workflow status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getWorkflowStatusData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {getWorkflowStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Average time through workflow stages</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm font-medium">Avg. Time to Approval</span>
                        </div>
                        <span className="text-lg font-bold">
                          {analyticsData?.workflow?.avgTimeToApproval.toFixed(1) || 0} hours
                        </span>
                      </div>
                      <Progress value={Math.min(100, (analyticsData?.workflow?.avgTimeToApproval || 0) / 24 * 100)} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm font-medium">Avg. Time to Publish</span>
                        </div>
                        <span className="text-lg font-bold">
                          {analyticsData?.workflow?.avgTimeToPublish.toFixed(1) || 0} hours
                        </span>
                      </div>
                      <Progress value={Math.min(100, (analyticsData?.workflow?.avgTimeToPublish || 0) / 48 * 100)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/20 rounded-lg">
                        <span className="text-lg font-bold text-green-500">
                          {analyticsData?.workflow?.approvalRate.toFixed(1) || 0}%
                        </span>
                        <p className="text-xs mt-1">Approval Rate</p>
                      </div>
                      <div className="text-center p-4 bg-muted/20 rounded-lg">
                        <span className="text-lg font-bold text-red-500">
                          {analyticsData?.workflow?.rejectionRate.toFixed(1) || 0}%
                        </span>
                        <p className="text-xs mt-1">Rejection Rate</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Content metrics would go here */}
          <div className="text-center p-12 border border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Content Analysis</h3>
            <p className="text-muted-foreground">
              Detailed content performance metrics will be available soon.
            </p>
          </div>
        </TabsContent>
        
        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          {/* Workflow metrics would go here */}
          <div className="text-center p-12 border border-dashed rounded-lg">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Workflow Analysis</h3>
            <p className="text-muted-foreground">
              Detailed workflow performance metrics will be available soon.
            </p>
          </div>
        </TabsContent>
        
        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-6">
          {/* Scheduling metrics would go here */}
          <div className="text-center p-12 border border-dashed rounded-lg">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Scheduling Analysis</h3>
            <p className="text-muted-foreground">
              Detailed content scheduling metrics will be available soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last updated timestamp */}
      <div className="text-xs text-muted-foreground text-right">
        Last updated: {analyticsData?.lastUpdated ? new Date(analyticsData.lastUpdated).toLocaleString() : 'Loading...'}
      </div>
    </div>
  );
}

export default AnalyticsDisplay;