import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  BarChart,
  ListFilter,
  Users,
  CalendarClock
} from 'lucide-react';
import { EnhancedContentReview } from './EnhancedContentReview';
import { WorkflowNotifications } from './WorkflowNotifications';

interface WorkflowMetrics {
  pendingReviews: number;
  approvedContent: number;
  scheduledPublications: number;
  expiringContent: number;
  averageApprovalTime: string;
  reviewerPerformance: {
    reviewerId: number;
    reviewerName: string;
    totalReviewed: number;
    averageResponseTime: string;
  }[];
}

export default function ContentWorkflowManager() {
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'scheduled'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflow metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['/api/content-workflow/metrics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/content-workflow/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch workflow metrics');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching workflow metrics:', error);
        return {
          pendingReviews: 0,
          approvedContent: 0,
          scheduledPublications: 0,
          expiringContent: 0,
          averageApprovalTime: 'N/A',
          reviewerPerformance: []
        } as WorkflowMetrics;
      }
    }
  });

  // Fetch content queue
  const {
    data: contentQueue,
    isLoading: queueLoading,
    error: queueError,
    refetch: refetchQueue
  } = useQuery({
    queryKey: ['/api/content-workflow/queue', filter],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/content-workflow/queue?filter=${filter}`);
        if (!response.ok) {
          throw new Error('Failed to fetch content queue');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching content queue:', error);
        return [];
      }
    }
  });

  // Refresh metrics and queue
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/queue', filter] }),
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Data Refreshed",
        description: "Workflow statistics and queue have been updated"
      });
    }
  });

  // Handle status change callback from content review
  const handleContentStatusChange = async (contentId: number, newStatus: string) => {
    // Refresh data after status change
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/queue', filter] }),
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })
    ]);
    
    toast({
      title: "Content Status Updated",
      description: `Content status changed to ${newStatus.replace('_', ' ')}`
    });

    // Reset selected content if it was the one that changed
    if (contentId === selectedContentId) {
      setSelectedContentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Content Workflow Management</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics?.pendingReviews || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Publications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics?.scheduledPublications || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics?.expiringContent || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics?.averageApprovalTime || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-8">
        {/* Left column: Content Queue */}
        <div className="col-span-1 lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Content Queue</span>
                <div className="inline-flex items-center rounded-md border border-input bg-background p-1 text-sm shadow-sm">
                  <Button
                    variant={filter === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                    className="text-xs"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filter === 'approved' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('approved')}
                    className="text-xs"
                  >
                    Approved
                  </Button>
                  <Button
                    variant={filter === 'scheduled' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('scheduled')}
                    className="text-xs"
                  >
                    Scheduled
                  </Button>
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs"
                  >
                    All
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {filter === 'pending' && 'Content waiting for review and approval'}
                {filter === 'approved' && 'Content approved but not yet published'}
                {filter === 'scheduled' && 'Content scheduled for future publication'}
                {filter === 'all' && 'All content in the workflow system'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {queueLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="border rounded-md p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))
                ) : contentQueue?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No content items found in the queue
                  </div>
                ) : (
                  contentQueue?.map((item: any) => (
                    <div 
                      key={item.id} 
                      className={`border rounded-md p-4 cursor-pointer transition-colors
                        ${selectedContentId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedContentId(item.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge>{item.contentType}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.updatedAtFormatted || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{item.authorName || 'Unknown author'}</span>
                        </div>
                        {item.status && (
                          <Badge 
                            variant={
                              item.status === 'published' ? 'default' : 
                              item.status === 'approved' ? 'outline' : 
                              item.status === 'review' ? 'secondary' : 
                              'outline'
                            }
                            className={
                              item.status === 'changes_requested' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                              item.status === 'approved' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 
                              ''
                            }
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Notifications and Content Review */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <WorkflowNotifications />
          
          {selectedContentId ? (
            <EnhancedContentReview 
              contentId={selectedContentId}
              title={(contentQueue?.find((item: any) => item.id === selectedContentId))?.title || ''}
              status={(contentQueue?.find((item: any) => item.id === selectedContentId))?.status || 'draft'}
              version={(contentQueue?.find((item: any) => item.id === selectedContentId))?.version || 1}
              createdAt={(contentQueue?.find((item: any) => item.id === selectedContentId))?.createdAt}
              updatedAt={(contentQueue?.find((item: any) => item.id === selectedContentId))?.updatedAt}
              scheduledPublishAt={(contentQueue?.find((item: any) => item.id === selectedContentId))?.scheduledPublishAt}
              expirationDate={(contentQueue?.find((item: any) => item.id === selectedContentId))?.expirationDate}
              onStatusChange={(newStatus) => handleContentStatusChange(selectedContentId, newStatus)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ListFilter className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-center">Select content from the queue</p>
                <p className="text-sm text-muted-foreground text-center mt-1 max-w-md">
                  Click on a content item from the queue to review it, approve it, or request changes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Workflow Performance
          </CardTitle>
          <CardDescription>
            Reviewer performance metrics and workflow efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : metrics?.reviewerPerformance?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviewer performance data available
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Reviewer Performance</h3>
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground mb-2">
                  <div>Reviewer</div>
                  <div className="text-center">Total Reviewed</div>
                  <div className="text-center">Avg. Response Time</div>
                  <div className="text-center">Status</div>
                </div>
                <div className="space-y-2">
                  {metrics?.reviewerPerformance?.map((reviewer) => (
                    <div key={reviewer.reviewerId} className="grid grid-cols-4 gap-4 py-2 border-t text-sm">
                      <div>{reviewer.reviewerName}</div>
                      <div className="text-center">{reviewer.totalReviewed}</div>
                      <div className="text-center">{reviewer.averageResponseTime}</div>
                      <div className="text-center">
                        <Badge 
                          variant="outline" 
                          className={
                            parseFloat(reviewer.averageResponseTime) < 24 ? 'bg-green-500/20 text-green-500 border-green-500/30' : 
                            parseFloat(reviewer.averageResponseTime) < 48 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 
                            'bg-red-500/20 text-red-500 border-red-500/30'
                          }
                        >
                          {parseFloat(reviewer.averageResponseTime) < 24 ? 'Good' : 
                           parseFloat(reviewer.averageResponseTime) < 48 ? 'Average' : 
                           'Slow'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}