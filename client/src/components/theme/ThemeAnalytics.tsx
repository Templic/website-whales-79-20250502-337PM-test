/**
 * Theme Analytics Component
 * 
 * This component provides insights and statistics for theme usage
 * and performance across the application.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { 
  BarChart3, 
  Calendar, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Users, 
  Share2,
  Download
} from 'lucide-react';

interface ThemeAnalyticsProps {
  themeId?: number;
  userId?: number;
  isAdmin?: boolean;
}

export function ThemeAnalytics({ themeId, userId, isAdmin = false }: ThemeAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('usage');
  
  // Mock analytics data - will be replaced with real API calls
  const usageData = {
    totalApplications: 1243,
    uniqueUsers: 526,
    averageTimeActive: '3.2 days',
    popularComponents: [
      { name: 'Buttons', usage: 78 },
      { name: 'Cards', usage: 65 },
      { name: 'Forms', usage: 52 },
      { name: 'Navigation', usage: 47 },
      { name: 'Dialogs', usage: 38 },
    ],
    usageByDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      applications: Math.floor(Math.random() * 100) + 20,
    })),
    userSentiment: {
      positive: 72,
      neutral: 23,
      negative: 5,
    },
  };
  
  const accessibilityData = {
    wcagCompliance: 'AA',
    contrastRatio: 4.8,
    colorBlindnessPerformance: 'Good',
    motionReductionSupport: 'Partial',
    keyboardNavigability: 'Excellent',
    issuesByCategory: [
      { category: 'Color Contrast', issues: 2 },
      { category: 'Focus Indicators', issues: 1 },
      { category: 'Hover States', issues: 3 },
      { category: 'Text Sizing', issues: 0 },
      { category: 'Animation Control', issues: 2 },
    ],
  };
  
  const performanceData = {
    firstLoadTime: '284ms',
    themeChangeTime: '86ms',
    cssSize: '32KB',
    renderingEfficiency: 'Excellent',
    memoryUsage: 'Low',
    performanceByBrowser: [
      { browser: 'Chrome', score: 92 },
      { browser: 'Firefox', score: 89 },
      { browser: 'Safari', score: 84 },
      { browser: 'Edge', score: 90 },
    ],
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Theme Analytics</h2>
          <p className="text-muted-foreground">
            Insights and statistics about theme performance and usage
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usage</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from previous period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +8.2% from previous period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Time Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageData.averageTimeActive}</div>
                <p className="text-xs text-muted-foreground">
                  +1.4 days from previous period
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-7 gap-6">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Daily Applications</CardTitle>
                <CardDescription>
                  Number of times this theme was applied daily
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {/* Placeholder for chart */}
                  <div className="w-full h-full bg-muted/20 rounded-md flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-muted" />
                    <span className="sr-only">Chart showing daily applications</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Popular Components</CardTitle>
                <CardDescription>
                  Most frequently used UI components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageData.popularComponents.map((component) => (
                    <div key={component.name} className="flex items-center">
                      <div className="w-1/3 font-medium">{component.name}</div>
                      <div className="w-2/3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${Math.min((component.usage / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {component.usage}% usage
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Sentiment</CardTitle>
              <CardDescription>
                Feedback based on user interactions and explicit ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-[200px] h-[200px] relative">
                  {/* Placeholder for pie chart */}
                  <div className="w-full h-full bg-muted/20 rounded-full flex items-center justify-center">
                    <PieChartIcon className="h-12 w-12 text-muted" />
                    <span className="sr-only">Pie chart showing user sentiment</span>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span>Positive</span>
                      </div>
                      <span className="font-medium">{usageData.userSentiment.positive}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${usageData.userSentiment.positive}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span>Neutral</span>
                      </div>
                      <span className="font-medium">{usageData.userSentiment.neutral}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2"
                        style={{ width: `${usageData.userSentiment.neutral}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span>Negative</span>
                      </div>
                      <span className="font-medium">{usageData.userSentiment.negative}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-red-500 rounded-full h-2"
                        style={{ width: `${usageData.userSentiment.negative}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accessibility" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  WCAG Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accessibilityData.wcagCompliance}</div>
                <p className="text-xs text-muted-foreground">
                  Meets AA conformance level
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Contrast Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accessibilityData.contrastRatio}:1</div>
                <p className="text-xs text-muted-foreground">
                  Exceeds minimum requirements
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Colorblindness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accessibilityData.colorBlindnessPerformance}</div>
                <p className="text-xs text-muted-foreground">
                  Works well across simulations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Keyboard Nav
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accessibilityData.keyboardNavigability}</div>
                <p className="text-xs text-muted-foreground">
                  Fully navigable without mouse
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Issues</CardTitle>
              <CardDescription>
                Detected issues by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {accessibilityData.issuesByCategory.map((issue) => (
                  <div key={issue.category} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{issue.category}</span>
                      <span className={`${issue.issues > 0 ? 'text-amber-500' : 'text-green-500'} font-medium`}>
                        {issue.issues} {issue.issues === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${issue.issues > 0 ? 'bg-amber-500' : 'bg-green-500'} rounded-full h-2`}
                        style={{ width: issue.issues > 0 ? `${(issue.issues / 5) * 100}%` : '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  First Load Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.firstLoadTime}</div>
                <p className="text-xs text-muted-foreground">
                  -18ms from previous version
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Theme Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.themeChangeTime}</div>
                <p className="text-xs text-muted-foreground">
                  -12ms from previous version
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  CSS Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.cssSize}</div>
                <p className="text-xs text-muted-foreground">
                  -4KB from previous version
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.memoryUsage}</div>
                <p className="text-xs text-muted-foreground">
                  Optimized variable usage
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance by Browser</CardTitle>
              <CardDescription>
                Theme rendering performance across browsers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.performanceByBrowser.map((browser) => (
                  <div key={browser.browser} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{browser.browser}</span>
                      <span className="text-sm">{browser.score}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`rounded-full h-2 ${
                          browser.score >= 90
                            ? 'bg-green-500'
                            : browser.score >= 80
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${browser.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>
                Theme performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {/* Placeholder for chart */}
                <div className="w-full h-full bg-muted/20 rounded-md flex items-center justify-center">
                  <LineChartIcon className="h-12 w-12 text-muted" />
                  <span className="sr-only">Chart showing performance trend</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}