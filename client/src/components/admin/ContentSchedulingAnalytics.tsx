import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, addDays, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';

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
    to: new Date()
  });

  const { data: reportData, isLoading: isReportLoading } = useQuery<SchedulingAnalyticsReport>({
    queryKey: ['content-scheduling-analytics', dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/content/analytics/scheduling?start=${dateRange.from.toISOString()}&end=${dateRange.to.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch scheduling analytics');
      return response.json();
    }
  });

  const { data: upcomingData, isLoading: isUpcomingLoading } = useQuery<UpcomingAnalytics>({
    queryKey: ['content-upcoming-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/content/analytics/upcoming?days=14');
      if (!response.ok) throw new Error('Failed to fetch upcoming content analytics');
      return response.json();
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d');
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const renderPublishRateChart = () => {
    if (!reportData) return null;

    const data = [
      { name: 'Published', value: reportData.summary.totalPublished },
      { name: 'Pending', value: reportData.summary.totalScheduled - reportData.summary.totalPublished }
    ];

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Content Items']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderUpcomingScheduleChart = () => {
    if (!upcomingData) return null;

    return (
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
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
            />
            <YAxis allowDecimals={false} />
            <Tooltip 
              labelFormatter={(label) => format(parseISO(label), 'PPP')}
              formatter={(value) => [value, 'Content Items']}
            />
            <Legend />
            <Bar dataKey="publishing" name="Scheduled to Publish" fill="#0088FE" />
            <Bar dataKey="expiring" name="Scheduled to Expire" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Content Scheduling Analytics</CardTitle>
        <CardDescription>
          Track and analyze the performance of your content scheduling system
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            {isReportLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reportData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Scheduled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{reportData.summary.totalScheduled}</p>
                    <p className="text-sm text-muted-foreground">Content items in the reporting period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Publish Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{reportData.summary.publishRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Of scheduled items published successfully</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Avg. Publishing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{reportData.summary.avgPublishTimeHours.toFixed(1)} hrs</p>
                    <p className="text-sm text-muted-foreground">From creation to publication</p>
                  </CardContent>
                </Card>

                <div className="md:col-span-3">
                  <h3 className="text-lg font-medium mb-2">Publishing Success Rate</h3>
                  {renderPublishRateChart()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No analytics data available. Ensure your content scheduling system is active.
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Date Range</h3>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4 pt-4">
            {isUpcomingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Upcoming Publications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{upcomingData.summary.totalUpcoming}</p>
                      <p className="text-sm text-muted-foreground">Content items scheduled to publish</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Upcoming Expirations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{upcomingData.summary.totalExpiring}</p>
                      <p className="text-sm text-muted-foreground">Content items scheduled to expire</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">14-Day Content Schedule</h3>
                  {renderUpcomingScheduleChart()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Upcoming Publications</h3>
                    <ScrollArea className="h-64 border rounded-md p-4">
                      {upcomingData.upcomingContent.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No upcoming publications scheduled</p>
                      ) : (
                        upcomingData.upcomingContent.map((item) => (
                          <div key={item.id} className="mb-4 pb-4 border-b last:border-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Publishes on: {format(parseISO(item.scheduledPublishAt), 'PPP')}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {format(parseISO(item.scheduledPublishAt), 'relative')}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Upcoming Expirations</h3>
                    <ScrollArea className="h-64 border rounded-md p-4">
                      {upcomingData.expiringContent.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No upcoming expirations scheduled</p>
                      ) : (
                        upcomingData.expiringContent.map((item) => (
                          <div key={item.id} className="mb-4 pb-4 border-b last:border-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Expires on: {format(parseISO(item.expirationDate), 'PPP')}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-amber-50">
                                {format(parseISO(item.expirationDate), 'relative')}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming content data available.
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 pt-4">
            {isReportLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Published Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{reportData.summary.totalPublished}</p>
                      <p className="text-sm text-muted-foreground">Successfully published items</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Archived Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{reportData.summary.totalExpired}</p>
                      <p className="text-sm text-muted-foreground">Automatically archived items</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">System Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Badge className={reportData.summary.publishRate > 95 ? "bg-green-100" : 
                                          reportData.summary.publishRate > 80 ? "bg-amber-100" : 
                                          "bg-red-100"}>
                          {reportData.summary.publishRate > 95 ? "Excellent" : 
                           reportData.summary.publishRate > 80 ? "Good" : 
                           "Needs Attention"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">System Health Report</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Scheduled publishing success rate</span>
                          <span className="font-medium">{reportData.summary.publishRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average time in workflow</span>
                          <span className="font-medium">{reportData.summary.avgPublishTimeHours.toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Content expiration rate</span>
                          <span className="font-medium">
                            {reportData.summary.totalExpired > 0 && reportData.summary.totalPublished > 0
                              ? ((reportData.summary.totalExpired / reportData.summary.totalPublished) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last system check</span>
                          <span className="font-medium">{format(parseISO(reportData.generatedAt), 'Pp')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No performance analytics available.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ContentSchedulingAnalytics;