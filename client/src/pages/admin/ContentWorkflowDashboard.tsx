import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ContentApprovalSystem from '@/components/admin/ContentApprovalSystem';
import WorkflowNotificationCenter from '@/components/admin/WorkflowNotificationCenter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Types
interface ContentMetrics {
  drafts: number;
  inReview: number;
  changesRequested: number;
  approved: number;
  published: number;
  archived: number;
  totalContent: number;
  averageApprovalTime: number;
  recentActivity: {
    date: string;
    newContent: number;
    published: number;
    reviews: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
  }[];
}

// Dashboard component
const ContentWorkflowDashboard = () => {
  const [showRejected, setShowRejected] = useState(true);
  const [showDrafts, setShowDrafts] = useState(true);

  // Fetch workflow metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/content-workflow/metrics'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/content-workflow/metrics');
        return response as ContentMetrics;
      } catch (error) {
        console.error("Error fetching metrics:", error);
        return {
          drafts: 0,
          inReview: 0,
          changesRequested: 0,
          approved: 0,
          published: 0,
          archived: 0,
          totalContent: 0,
          averageApprovalTime: 0,
          recentActivity: [],
          statusDistribution: []
        };
      }
    }
  });

  // Chart colors
  const COLORS = ['#8884d8', '#fa8231', '#eb4d4b', '#6ab04c', '#4834d4', '#535c68'];
  
  // Chart data processing for display
  const getFilteredActivityData = () => {
    if (!metrics?.recentActivity || metrics.recentActivity.length === 0) return [];
    
    return metrics.recentActivity.map(day => {
      // Create a new object with formatted date
      const filteredData: {
        date: string;
        newContent?: number;
        published?: number;
        reviews?: number;
      } = { 
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      
      // Only add properties if they should be shown
      if (showDrafts) {
        filteredData.newContent = day.newContent;
      }
      
      filteredData.published = day.published;
      
      if (showRejected) {
        filteredData.reviews = day.reviews;
      }
      
      return filteredData;
    });
  };

  // Calculate total items requiring action
  const pendingActionsCount = metrics ? 
    metrics.inReview + metrics.changesRequested : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Content Workflow Dashboard</h1>
        <p className="text-gray-500">
          Manage your content approval process and workflow notifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Content awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">
                {metrics?.inReview || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">items</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Requires Changes</CardTitle>
            <CardDescription>Content needing revisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">
                {metrics?.changesRequested || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">items</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Approved & Ready</CardTitle>
            <CardDescription>Content ready to publish</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">
                {metrics?.approved || 0}
              </span>
              <span className="ml-2 text-sm text-gray-500">items</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Content Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of content by current status
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metrics && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => 
                      `${entry.name}: ${Math.round(entry.percent * 100)}%`
                    }
                  >
                    {metrics.statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center justify-between mt-1">
              <CardDescription>
                Content workflow activity over the past 7 days
              </CardDescription>
              <div className="flex items-center gap-x-4 text-xs">
                <div className="flex items-center gap-x-1">
                  <Checkbox 
                    id="show-drafts" 
                    checked={showDrafts} 
                    onCheckedChange={() => setShowDrafts(!showDrafts)}
                  />
                  <Label htmlFor="show-drafts">New Content</Label>
                </div>
                <div className="flex items-center gap-x-1">
                  <Checkbox 
                    id="show-rejected" 
                    checked={showRejected} 
                    onCheckedChange={() => setShowRejected(!showRejected)}
                  />
                  <Label htmlFor="show-rejected">Reviews</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metrics && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getFilteredActivityData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {showDrafts && (
                    <Line
                      type="monotone"
                      dataKey="newContent"
                      name="New Content"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="published"
                    name="Published"
                    stroke="#4caf50"
                  />
                  {showRejected && (
                    <Line
                      type="monotone"
                      dataKey="reviews"
                      name="Reviews"
                      stroke="#ff9800"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approval" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approval">
            Content Approval System
            {pendingActionsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingActionsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Workflow Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="approval" className="mt-6">
          <ContentApprovalSystem />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <WorkflowNotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentWorkflowDashboard;