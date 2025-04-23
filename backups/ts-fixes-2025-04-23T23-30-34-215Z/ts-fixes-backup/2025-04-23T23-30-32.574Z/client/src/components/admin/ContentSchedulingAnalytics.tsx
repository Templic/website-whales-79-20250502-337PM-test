import React from "react";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Calendar, 
  Clock, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  TimerOff
} from 'lucide-react';
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
  Legend 
} from 'recharts';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, addDays, subDays } from 'date-fns';

interface SchedulingAnalyticsReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalScheduled: number;
    totalPublished: number;
    totalExpired: number;
    publishRate: number;
    avgPublishTimeMs: number;
    avgPublishTimeHours: number;
  };
  detailedMetrics: any[];
  generatedAt: string;
}

interface UpcomingAnalytics {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalUpcoming: number;
    totalExpiring: number;
  };
  dailySchedule: {
    date: string;
    publishing: number;
    expiring: number;
  }[];
  upcomingContent: any[];
  expiringContent: any[];
}

export function ContentSchedulingAnalytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [upcomingDays, setUpcomingDays] = useState(7);

  // Fetch scheduling analytics data
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery<SchedulingAnalyticsReport>({
    queryKey: ['/api/content-workflow/analytics/scheduling', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/content-workflow/analytics/scheduling?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    enabled: true,
  });

  // Fetch upcoming content data
  const { 
    data: upcomingData, 
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming
  } = useQuery<UpcomingAnalytics>({
    queryKey: ['/api/content-workflow/analytics/upcoming', upcomingDays],
    queryFn: async () => {
      const response = await fetch(`/api/content-workflow/analytics/upcoming?days=${upcomingDays}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming content data');
      }
      return response.json();
    },
    enabled: true,
  });

  // Handle date range change
  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  // Calculate success rate color
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Format time
  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    if (hours < 24) {
      return `${Math.round(hours)} hours`;
    }
    return `${Math.round(hours / 24)} days`;
  };

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!analyticsData) return [];
    
    const { totalScheduled, totalPublished, totalExpired } = analyticsData.summary;
    
    return [
      { name: 'Published', value: totalPublished, percent: totalScheduled > 0 ? (totalPublished / totalScheduled) * 100 : 0 },
      { name: 'Expired', value: totalExpired, percent: totalScheduled > 0 ? (totalExpired / totalScheduled) * 100 : 0 },
      { name: 'Pending', value: totalScheduled - totalPublished - totalExpired, percent: totalScheduled > 0 ? ((totalScheduled - totalPublished - totalExpired) / totalScheduled) * 100 : 0 }
    ];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Format as percent
  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Chart color scheme
  const COLORS = ['#10b981', '#ef4444', '#6366f1'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <CalendarDays className="w-4 h-4 mr-2" />
            Upcoming Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Select Date Range</h3>
            <DateRangePicker 
              from={dateRange.from} 
              to={dateRange.to} 
              onSelect={handleDateRangeChange} 
            />
          </div>

          {isLoadingAnalytics ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : analyticsError ? (
            <div className="p-4 text-center bg-red-50 text-red-800 rounded-md">
              Error loading analytics data. Please try again.
            </div>
          ) : analyticsData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">{analyticsData.summary.totalScheduled}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      During {formatDate(analyticsData.period.start)} - {formatDate(analyticsData.period.end)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Publish Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">{formatPercent(analyticsData.summary.publishRate)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analyticsData.summary.totalPublished} of {analyticsData.summary.totalScheduled} items published
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Publish Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">{formatTime(analyticsData.summary.avgPublishTimeHours)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From creation to publishing
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expired Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TimerOff className="w-5 h-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">{analyticsData.summary.totalExpired}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPercent(analyticsData.summary.totalExpired / analyticsData.summary.totalScheduled * 100 || 0)} of total scheduled content
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Publishing Distribution</CardTitle>
                    <CardDescription>Status of scheduled content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${formatPercent(percent)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Daily Publishing Volume</CardTitle>
                    <CardDescription>Content published per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.detailedMetrics}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" name="Published Items" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[7, 14, 30].map((days) => (
              <Card 
                key={days} 
                className={`cursor-pointer transition ${upcomingDays === days ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                onClick={() => setUpcomingDays(days)}
              >
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Next {days} days</span>
                    <span className="text-xs text-muted-foreground">View upcoming content</span>
                  </div>
                  <Calendar className={`w-8 h-8 ${upcomingDays === days ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {isLoadingUpcoming ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-56 w-full" />
            </div>
          ) : upcomingError ? (
            <div className="p-4 text-center bg-red-50 text-red-800 rounded-md">
              Error loading upcoming content data. Please try again.
            </div>
          ) : upcomingData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Publications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ArrowUpRight className="w-5 h-5 mr-2 text-green-500" />
                      <span className="text-2xl font-bold">{upcomingData.summary.totalUpcoming}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled to publish in the next {upcomingDays} days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Expirations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ArrowDownRight className="w-5 h-5 mr-2 text-red-500" />
                      <span className="text-2xl font-bold">{upcomingData.summary.totalExpiring}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to expire in the next {upcomingDays} days
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Publishing & Expiration Calendar</CardTitle>
                  <CardDescription>Daily breakdown for the next {upcomingDays} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={upcomingData.dailySchedule}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="publishing" stackId="a" fill="#10b981" name="Publishing" />
                        <Bar dataKey="expiring" stackId="a" fill="#ef4444" name="Expiring" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Content</CardTitle>
                    <CardDescription>Content scheduled to be published</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingData.upcomingContent.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Scheduled For</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingData.upcomingContent.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{formatDate(item.scheduledPublishAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No upcoming content for the next {upcomingDays} days
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expiring Content</CardTitle>
                    <CardDescription>Content scheduled to expire soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingData.expiringContent.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Expiring On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingData.expiringContent.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{formatDate(item.expirationDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No content expiring in the next {upcomingDays} days
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}