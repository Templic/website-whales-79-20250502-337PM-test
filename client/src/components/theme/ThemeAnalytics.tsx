/**
 * Theme Analytics Component
 * 
 * This component displays analytics about theme usage and popularity.
 * It shows usage statistics, user engagement, and accessibility compliance.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ThemeAnalyticsProps {
  themeId?: number; // Optional: specific theme to analyze
  userId?: number; // Optional: filter by user
  isAdmin?: boolean; // Whether to show admin-only analytics
}

export function ThemeAnalytics({
  themeId,
  userId,
  isAdmin = false,
}: ThemeAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Fetch theme usage analytics
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/themes/analytics/usage', { themeId, userId, timeRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (themeId) params.set('themeId', themeId.toString());
      if (userId) params.set('userId', userId.toString());
      params.set('timeRange', timeRange);
      
      return apiRequest(`/api/themes/analytics/usage?${params.toString()}`);
    },
  });
  
  // Fetch theme engagement analytics (e.g., views, downloads, shares)
  const { data: engagementData, isLoading: isLoadingEngagement } = useQuery({
    queryKey: ['/api/themes/analytics/engagement', { themeId, userId, timeRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (themeId) params.set('themeId', themeId.toString());
      if (userId) params.set('userId', userId.toString());
      params.set('timeRange', timeRange);
      
      return apiRequest(`/api/themes/analytics/engagement?${params.toString()}`);
    },
  });
  
  // Fetch theme accessibility compliance
  const { data: accessibilityData, isLoading: isLoadingAccessibility } = useQuery({
    queryKey: ['/api/themes/analytics/accessibility', { themeId, userId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (themeId) params.set('themeId', themeId.toString());
      if (userId) params.set('userId', userId.toString());
      
      return apiRequest(`/api/themes/analytics/accessibility?${params.toString()}`);
    },
  });

  // Demo data for usage chart (in a real app, this would come from API)
  const usageChartData = {
    labels: getLabelsForTimeRange(timeRange),
    datasets: [
      {
        label: 'Theme Applied',
        data: generateDemoData(timeRange, 10, 50),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Demo data for engagement chart
  const engagementChartData = {
    labels: getLabelsForTimeRange(timeRange),
    datasets: [
      {
        label: 'Views',
        data: generateDemoData(timeRange, 100, 500),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Downloads',
        data: generateDemoData(timeRange, 10, 50),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Shares',
        data: generateDemoData(timeRange, 1, 20),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  // Demo data for accessibility compliance
  const accessibilityChartData = {
    labels: ['Contrast Ratio', 'Color Blind Safe', 'Reduced Motion Support', 'Screen Reader Ready'],
    datasets: [
      {
        label: 'Compliance Score',
        data: [85, 90, 100, 95],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(53, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(53, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Demo data for theme comparison
  const comparisonChartData = {
    labels: ['Performance', 'Accessibility', 'Popularity', 'Versatility', 'Complexity'],
    datasets: [
      {
        label: 'Your Theme',
        data: [90, 85, 65, 80, 40],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average',
        data: [70, 65, 75, 60, 50],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Loading states
  if (isLoadingUsage || isLoadingEngagement || isLoadingAccessibility) {
    return <ThemeAnalyticsSkeleton />;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{themeId ? 'Theme Analytics' : 'Theme System Analytics'}</CardTitle>
          <CardDescription>
            Track usage, engagement, and accessibility metrics
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="usage">
          <TabsList className="mb-6">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin Insights</TabsTrigger>}
          </TabsList>

          <TabsContent value="usage">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Applications"
                  value="1,248"
                  trend="+12.5%"
                  trendDirection="up"
                />
                <MetricCard
                  title="Active Users"
                  value="384"
                  trend="+5.3%"
                  trendDirection="up"
                />
                <MetricCard
                  title="Avg. Session Duration"
                  value="4m 32s"
                  trend="-1.2%"
                  trendDirection="down"
                />
              </div>
              
              <div className="h-80">
                <Line
                  data={usageChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                    plugins: {
                      title: {
                        display: true,
                        text: 'Theme Usage Over Time',
                      },
                    },
                  }}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Usage Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Device Type</CardTitle>
                    </CardHeader>
                    <CardContent className="h-60">
                      <Pie
                        data={{
                          labels: ['Desktop', 'Mobile', 'Tablet'],
                          datasets: [
                            {
                              data: [65, 25, 10],
                              backgroundColor: [
                                'rgba(53, 162, 235, 0.5)',
                                'rgba(75, 192, 192, 0.5)',
                                'rgba(255, 206, 86, 0.5)',
                              ],
                              borderColor: [
                                'rgba(53, 162, 235, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(255, 206, 86, 1)',
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mode Preference</CardTitle>
                    </CardHeader>
                    <CardContent className="h-60">
                      <Pie
                        data={{
                          labels: ['Light', 'Dark', 'System'],
                          datasets: [
                            {
                              data: [30, 45, 25],
                              backgroundColor: [
                                'rgba(255, 206, 86, 0.5)',
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(153, 102, 255, 0.5)',
                              ],
                              borderColor: [
                                'rgba(255, 206, 86, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(153, 102, 255, 1)',
                              ],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Views"
                  value="5,842"
                  trend="+18.7%"
                  trendDirection="up"
                />
                <MetricCard
                  title="Downloads"
                  value="1,284"
                  trend="+22.3%"
                  trendDirection="up"
                />
                <MetricCard
                  title="Shares"
                  value="347"
                  trend="+15.1%"
                  trendDirection="up"
                />
                <MetricCard
                  title="Rating"
                  value="4.7/5"
                  trend="+0.2"
                  trendDirection="up"
                />
              </div>
              
              <div className="h-80">
                <Bar
                  data={engagementChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Engagement Metrics Over Time',
                      },
                      legend: {
                        position: 'top' as const,
                      },
                    },
                  }}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Most Engaged Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Button', 'Card', 'Form', 'Navigation', 'Typography'].map((component) => (
                    <Card key={component}>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{component}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary rounded-full h-3 w-3"></div>
                            <span>Usage Score</span>
                          </div>
                          <span className="font-semibold">{Math.floor(Math.random() * 40) + 60}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-secondary rounded-full h-3 w-3"></div>
                            <span>Customization</span>
                          </div>
                          <span className="font-semibold">{Math.floor(Math.random() * 40) + 60}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accessibility">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Overall Score"
                  value="92/100"
                  trend="+4 pts"
                  trendDirection="up"
                  color="green"
                />
                <MetricCard
                  title="WCAG Compliance"
                  value="AA+"
                  badges={['AA', 'AAA']}
                />
                <MetricCard
                  title="Color Contrast"
                  value="4.8:1"
                  trend="+0.3"
                  trendDirection="up"
                />
                <MetricCard
                  title="Screen Reader"
                  value="Excellent"
                  color="green"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Accessibility Scores</CardTitle>
                    <CardDescription>Breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-60">
                    <Radar
                      data={accessibilityChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            min: 0,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Accessibility Issues</CardTitle>
                    <CardDescription>Detected problems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Warning
                          </Badge>
                          <span>Button text contrast ratio (3.8:1)</span>
                        </div>
                        <Button variant="outline" size="sm">Fix</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Suggestion
                          </Badge>
                          <span>Add reduced motion alternative</span>
                        </div>
                        <Button variant="outline" size="sm">Fix</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Suggestion
                          </Badge>
                          <span>Improve focus indicator visibility</span>
                        </div>
                        <Button variant="outline" size="sm">Fix</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Keyboard Navigation', 'Color Blind Mode', 'High Contrast', 'Screen Reader'].map((feature) => (
                  <Card key={feature} className="flex flex-col items-center p-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-sm text-center">{feature}</CardTitle>
                    <CardDescription className="text-center">Supported</CardDescription>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Total Themes"
                    value="248"
                    trend="+35"
                    trendDirection="up"
                  />
                  <MetricCard
                    title="Active Developers"
                    value="86"
                    trend="+12"
                    trendDirection="up"
                  />
                  <MetricCard
                    title="System Load"
                    value="23%"
                    trend="-5%"
                    trendDirection="up"
                    color="green"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Theme Comparison</CardTitle>
                    <CardDescription>Your theme vs. system average</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <Radar
                      data={comparisonChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            min: 0,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-medium mb-4">System Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Theme Processing Time</CardTitle>
                      </CardHeader>
                      <CardContent className="h-60">
                        <Line
                          data={{
                            labels: getLabelsForTimeRange('30d', 7),
                            datasets: [
                              {
                                label: 'Processing Time (ms)',
                                data: generateDemoData('30d', 50, 150, 7),
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">API Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="h-60">
                        <Line
                          data={{
                            labels: getLabelsForTimeRange('30d', 7),
                            datasets: [
                              {
                                label: 'API Requests',
                                data: generateDemoData('30d', 500, 2000, 7),
                                borderColor: 'rgb(255, 99, 132)',
                                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">
          Data last updated: {new Date().toLocaleString()}
        </div>
        <Button variant="outline" size="sm">
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  color?: 'default' | 'green' | 'red' | 'blue';
  badges?: string[];
}

function MetricCard({
  title,
  value,
  trend,
  trendDirection,
  color = 'default',
  badges,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="mt-2 flex items-center">
          <div className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-600'
            : color === 'red' ? 'text-red-600'
            : color === 'blue' ? 'text-blue-600'
            : ''
          }`}>
            {value}
          </div>
          {trend && (
            <span className={`ml-2 flex items-center text-sm ${
              trendDirection === 'up' ? 'text-green-600'
              : trendDirection === 'down' ? 'text-red-600'
              : ''
            }`}>
              {trendDirection === 'up' ? <ArrowUpIcon className="mr-1 h-4 w-4" /> 
              : trendDirection === 'down' ? <ArrowDownIcon className="mr-1 h-4 w-4" /> 
              : null}
              {trend}
            </span>
          )}
        </div>
        {badges && (
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <Badge key={badge} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Radar Chart Component (needed for accessibility chart)
function Radar({ data, options }: { data: any; options: any }) {
  return (
    <div className="h-full w-full">
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <Bar  // Fallback to Bar since we don't have RadarElement registered
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}

// Loading skeleton
function ThemeAnalyticsSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-80 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-2/3" />
      </CardFooter>
    </Card>
  );
}

// Helper functions
function getLabelsForTimeRange(timeRange: string, count = 0): string[] {
  const today = new Date();
  let labels: string[] = [];
  
  switch (timeRange) {
    case '7d':
      labels = Array.from({ length: count || 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (7 - i - 1));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });
      break;
    case '30d':
      labels = Array.from({ length: count || 10 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor((30 / (count || 10)) * (10 - i - 1)));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      break;
    case '90d':
      labels = Array.from({ length: count || 12 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor((90 / (count || 12)) * (12 - i - 1)));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      break;
    case '1y':
      labels = Array.from({ length: count || 12 }, (_, i) => {
        const date = new Date(today);
        date.setMonth(date.getMonth() - (12 - i - 1));
        return date.toLocaleDateString('en-US', { month: 'short' });
      });
      break;
  }
  
  return labels;
}

function generateDemoData(timeRange: string, min: number, max: number, count = 0): number[] {
  const length = count || (timeRange === '7d' ? 7 : timeRange === '30d' ? 10 : timeRange === '90d' ? 12 : 12);
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// Icon components
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}