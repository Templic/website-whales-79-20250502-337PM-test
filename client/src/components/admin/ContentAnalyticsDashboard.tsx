import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';

// Color constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  draft: '#CBD5E1', // slate-300
  review: '#60A5FA', // blue-400
  changes_requested: '#F97316', // orange-500
  approved: '#10B981', // emerald-500
  published: '#8B5CF6', // violet-500
  archived: '#94A3B8' // slate-400
};

export function ContentAnalyticsDashboard() {
  // State for date range
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  // Query analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
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
  
  // Handle date range changes
  const handleRangeSelect = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };
  
  // Prepare data for status distribution chart
  const getStatusDistribution = () => {
    if (!analyticsData || !analyticsData.statusDistribution) return [];
    
    return Object.entries(analyticsData.statusDistribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#CBD5E1'
    }));
  };
  
  // Prepare data for publishing success rate chart
  const getPublishingPerformance = () => {
    if (!analyticsData || !analyticsData.dailyMetrics) return [];
    
    return analyticsData.dailyMetrics.map((metric: any) => ({
      date: format(new Date(metric.date), 'MMM dd'),
      scheduled: metric.scheduled || 0,
      published: metric.published || 0,
      successRate: metric.successRate || 0
    }));
  };
  
  // Prepare data for workflow time chart
  const getWorkflowTimeMetrics = () => {
    if (!analyticsData || !analyticsData.workflowTimes) return [];
    
    return Object.entries(analyticsData.workflowTimes).map(([status, hours]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      hours: Math.round(hours as number * 10) / 10 // Round to 1 decimal
    }));
  };
  
  // Format a number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Calculate percent change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading analytics</AlertTitle>
        <AlertDescription>
          Failed to load content analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Content Analytics</h2>
        <p className="text-muted-foreground">
          Monitor and analyze your content workflow performance over time.
        </p>
        
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <DateRangePicker 
                from={dateRange.from} 
                to={dateRange.to} 
                onSelect={handleRangeSelect}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[150px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[100px] mb-4" />
                <Skeleton className="h-4 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analyticsData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(analyticsData.summary?.totalContent || 0)}
                </div>
                <div className="flex items-center text-xs mt-1">
                  {analyticsData.comparison?.contentChange >= 0 ? (
                    <ArrowUpRight className="text-emerald-500 mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="text-red-500 mr-1 h-4 w-4" />
                  )}
                  <span className={analyticsData.comparison?.contentChange >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {Math.abs(analyticsData.comparison?.contentChange || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Publishing Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analyticsData.summary?.publishRate || 0).toFixed(1)}%
                </div>
                <div className="flex items-center text-xs mt-1">
                  {analyticsData.comparison?.publishRateChange >= 0 ? (
                    <ArrowUpRight className="text-emerald-500 mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="text-red-500 mr-1 h-4 w-4" />
                  )}
                  <span className={analyticsData.comparison?.publishRateChange >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {Math.abs(analyticsData.comparison?.publishRateChange || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Review Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analyticsData.summary?.avgReviewTimeHours || 0).toFixed(1)}h
                </div>
                <div className="flex items-center text-xs mt-1">
                  {/* Lower review time is better */}
                  {analyticsData.comparison?.reviewTimeChange <= 0 ? (
                    <ArrowUpRight className="text-emerald-500 mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="text-red-500 mr-1 h-4 w-4" />
                  )}
                  <span className={analyticsData.comparison?.reviewTimeChange <= 0 ? "text-emerald-500" : "text-red-500"}>
                    {Math.abs(analyticsData.comparison?.reviewTimeChange || 0).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs previous period</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Content Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(analyticsData.summary?.pendingReview || 0)}
                </div>
                <div className="flex items-center text-xs mt-1">
                  <Clock className="text-amber-500 mr-1 h-4 w-4" />
                  <span className="text-amber-500">
                    {formatNumber(analyticsData.summary?.urgentReview || 0)}
                  </span>
                  <span className="text-muted-foreground ml-1">need urgent review</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Performance</CardTitle>
                <CardDescription>
                  Scheduled vs. published content over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getPublishingPerformance()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <YAxis yAxisId={1} orientation="right" domain={[0, 100]} unit="%" />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'successRate') return [`${value}%`, 'Success Rate'];
                          return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="scheduled" fill="#60A5FA" name="Scheduled" />
                      <Bar dataKey="published" fill="#8B5CF6" name="Published" />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        stroke="#10B981"
                        name="Success Rate"
                        yAxisId={1}
                        strokeWidth={2}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Status Distribution</CardTitle>
                <CardDescription>
                  Current distribution of content by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getStatusDistribution()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      >
                        {getStatusDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value: any) => [`${value} items`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Workflow Stage Times</CardTitle>
                <CardDescription>
                  Average time content spends in each workflow stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getWorkflowTimeMetrics()}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit="h" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip 
                        formatter={(value: any) => [`${value} hours`, 'Time']}
                      />
                      <Bar dataKey="hours" fill="#8884d8">
                        {getWorkflowTimeMetrics().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Requiring Attention</CardTitle>
                <CardDescription>
                  Items that need immediate action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.attentionItems?.length > 0 ? (
                    analyticsData.attentionItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-start border-b pb-3 last:border-0">
                        {item.type === 'review_needed' ? (
                          <Clock className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                        ) : item.type === 'scheduled_today' ? (
                          <Calendar className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        ) : item.type === 'expiring_soon' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-500 mr-2 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.message}</p>
                          <div className="flex mt-1 items-center">
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                            {item.dueTime && (
                              <span className="text-xs ml-2 text-muted-foreground">
                                {item.dueTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No content items require attention
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Alert>
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            No content analytics data is available for the selected time period.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}