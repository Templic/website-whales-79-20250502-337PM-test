/**
 * Theme Analytics Component
 * 
 * This component visualizes analytics data for a theme, including:
 * - Usage statistics
 * - User engagement metrics
 * - Accessibility scores
 * - Performance metrics
 * - Popularity trends
 * 
 * It provides insights into how a theme is being used across the application.
 */

import React from 'react';
import { ThemeAnalytics as ThemeAnalyticsType } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  LineChart, 
  DoughnutChart, 
  PieChart 
} from '@/components/ui/charts';
import { 
  AlertCircle, 
  Bar, 
  BarChart2, 
  Calendar, 
  Clock, 
  Heart, 
  LineChart as LineChartIcon,
  Maximize2, 
  Plus, 
  Share2, 
  Shuffle, 
  Star, 
  User, 
  Users
} from 'lucide-react';

// Interface for component props
interface ThemeAnalyticsProps {
  analytics: ThemeAnalyticsType;
  compact?: boolean;
}

export const ThemeAnalytics = ({ analytics, compact = false }: ThemeAnalyticsProps) => {
  // Process the events data to count occurrences
  const eventCounts = analytics.eventCounts || {};
  const totalEvents = analytics.totalEvents || 0;
  const uniqueUsers = analytics.uniqueUsers || 0;
  const anonymousUsage = analytics.anonymousUsage || 0;
  const rawAnalytics = analytics.rawAnalytics || [];
  
  // Calculate percentages for various metrics
  const appliedPercentage = (eventCounts['applied'] || 0) / (totalEvents || 1) * 100;
  const sharedPercentage = (eventCounts['shared'] || 0) / (totalEvents || 1) * 100;
  const duplicatedPercentage = (eventCounts['duplicated'] || 0) / (totalEvents || 1) * 100;
  
  // Process timestamps to create time-based data
  const timeData = processTimeData(rawAnalytics);
  
  // Create chart data
  const eventsChartData = {
    labels: Object.keys(eventCounts),
    datasets: [
      {
        label: 'Event Count',
        data: Object.values(eventCounts),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(96, 165, 250, 0.8)',
          'rgba(147, 197, 253, 0.8)',
          'rgba(191, 219, 254, 0.8)',
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(147, 197, 253, 1)',
          'rgba(191, 219, 254, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const usersChartData = {
    labels: ['Unique Users', 'Anonymous'],
    datasets: [
      {
        label: 'User Types',
        data: [uniqueUsers, anonymousUsage],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(229, 231, 235, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(209, 213, 219, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const timeChartData = {
    labels: timeData.labels,
    datasets: [
      {
        label: 'Activity',
        data: timeData.counts,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Events
                </p>
                <h4 className="text-2xl font-bold">{totalEvents}</h4>
              </div>
              <BarChart2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unique Users
                </p>
                <h4 className="text-2xl font-bold">{uniqueUsers}</h4>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Applications
                </p>
                <h4 className="text-2xl font-bold">{eventCounts['applied'] || 0}</h4>
              </div>
              <Maximize2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Shares
                </p>
                <h4 className="text-2xl font-bold">{eventCounts['shared'] || 0}</h4>
              </div>
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics */}
      {!compact && (
        <>
          <Tabs defaultValue="events">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            
            {/* Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of different events related to this theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-[300px]">
                    <BarChart
                      data={eventsChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(eventCounts).map(([event, count]) => (
                      <Badge key={event} variant="outline">
                        {event}: {count}
                      </Badge>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    Analysis of user interactions with this theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col space-y-8">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="w-full md:w-1/2">
                      <div className="h-[250px]">
                        <DoughnutChart
                          data={usersChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Applied</span>
                          <span className="font-medium">{eventCounts['applied'] || 0}</span>
                        </div>
                        <Progress value={appliedPercentage} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Shared</span>
                          <span className="font-medium">{eventCounts['shared'] || 0}</span>
                        </div>
                        <Progress value={sharedPercentage} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duplicated</span>
                          <span className="font-medium">{eventCounts['duplicated'] || 0}</span>
                        </div>
                        <Progress value={duplicatedPercentage} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Trends Tab */}
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Trends</CardTitle>
                  <CardDescription>
                    Usage patterns over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <LineChart
                      data={timeChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Time',
                            },
                          },
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Events',
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// Helper function to process time data from raw analytics
function processTimeData(rawAnalytics: any[]) {
  // Default to empty array if no data
  if (!rawAnalytics || !Array.isArray(rawAnalytics) || rawAnalytics.length === 0) {
    return { labels: [], counts: [] };
  }
  
  // Group events by date (simplified to day)
  const dateMap = new Map<string, number>();
  
  rawAnalytics.forEach(event => {
    if (event.createdAt) {
      const date = new Date(event.createdAt);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + 1);
    }
  });
  
  // Sort dates
  const sortedDates = Array.from(dateMap.keys()).sort();
  
  // Get counts
  const counts = sortedDates.map(date => dateMap.get(date) || 0);
  
  // Format dates for display
  const labels = sortedDates.map(date => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  
  return { labels, counts };
}

// Mocked chart components
const mockChartImplementation = ({ data, options }: any) => (
  <div className="flex items-center justify-center h-full text-muted-foreground italic">
    Chart visualization not available in this environment
  </div>
);

// Create mock chart components if necessary (these would normally be provided by a chart library)
export const BarChart = ({ data, options }: any) => mockChartImplementation({ data, options });
export const LineChart = ({ data, options }: any) => mockChartImplementation({ data, options });
export const DoughnutChart = ({ data, options }: any) => mockChartImplementation({ data, options });
export const PieChart = ({ data, options }: any) => mockChartImplementation({ data, options });

export default ThemeAnalytics;