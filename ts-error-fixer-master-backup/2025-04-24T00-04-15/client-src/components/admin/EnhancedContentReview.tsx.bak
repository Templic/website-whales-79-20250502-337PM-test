import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format, isAfter, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export interface ContentVersion {
  id: number;
  contentId: number;
  version: number;
  content: string;
  createdAt: string;
  createdBy: number;
  userName?: string;
}

export interface ContentHistoryEntry {
  id: number;
  contentId: number;
  userId: number;
  action: string;
  comments: string;
  timestamp: string;
  username: string;
}

export interface ContentReviewProps {
  contentId: number;
  title: string;
  status: 'draft' | 'review' | 'changes_requested' | 'approved' | 'published' | 'archived';
  version: number;
  createdAt?: string;
  updatedAt?: string;
  scheduledPublishAt?: string | null;
  expirationDate?: string | null;
  content?: string;
  onStatusChange?: (newStatus: string) => void;
}

export function EnhancedContentReview({
  contentId,
  title,
  status,
  version,
  createdAt,
  updatedAt,
  scheduledPublishAt,
  expirationDate,
  content,
  onStatusChange
}: ContentReviewProps) {
  const [activeTab, setActiveTab] = useState('current');
  const [reviewComments, setReviewComments] = useState('');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch content versions
  const { 
    data: versionsData, 
    isLoading: isLoadingVersions, 
    error: versionsError 
  } = useQuery({
    queryKey: [`/api/content-workflow/content/${contentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content-workflow/content/${contentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch content details');
      }
      const data = await response.json();
      return {
        content: data.content,
        versions: data.versions,
        workflowHistory: data.workflowHistory
      };
    },
    enabled: !!contentId
  });
  
  // Fetch workflow history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: [`/api/content-workflow/review-history/${contentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/content-workflow/review-history/${contentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch review history');
      }
      return response.json();
    },
    enabled: !!contentId
  });
  
  // Content Action Mutations
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/content-workflow/approve/${contentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: reviewComments })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve content');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Approved",
        description: data.scheduledPublishAt 
          ? `Content will be published at the scheduled time.` 
          : `Content has been published.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/content/${contentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/review-history/${contentId}`] });
      
      // Close dialog and reset comments
      setIsActionDialogOpen(false);
      setReviewComments('');
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(data.scheduledPublishAt ? 'approved' : 'published');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/content-workflow/reject/${contentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: reviewComments })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject content');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Content Rejected",
        description: "Content has been returned to draft status.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/content/${contentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/review-history/${contentId}`] });
      
      // Close dialog and reset comments
      setIsActionDialogOpen(false);
      setReviewComments('');
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange('draft');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  const requestChangesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/content-workflow/request-changes/${contentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: reviewComments })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request changes');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Changes Requested",
        description: "Your feedback has been sent to the content creator.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/content/${contentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/content-workflow/review-history/${contentId}`] });
      
      // Close dialog and reset comments
      setIsActionDialogOpen(false);
      setReviewComments('');
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange('changes_requested');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to request changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  // Handle action submission
  const handleActionSubmit = () => {
    if (selectedAction === 'approve') {
      approveMutation.mutate();
    } else if (selectedAction === 'reject') {
      rejectMutation.mutate();
    } else if (selectedAction === 'request_changes') {
      if (!reviewComments.trim()) {
        toast({
          title: "Comments Required",
          description: "Please provide specific feedback when requesting changes.",
          variant: "destructive"
        });
        return;
      }
      requestChangesMutation.mutate();
    }
  };
  
  // Helper functions for rendering
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'review':
        return <Badge variant="secondary">In Review</Badge>;
      case 'changes_requested':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Changes Requested</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">Approved</Badge>;
      case 'published':
        return <Badge>Published</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge variant="outline">Created</Badge>;
      case 'updated':
        return <Badge variant="outline">Updated</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">Approved</Badge>;
      case 'published':
        return <Badge>Published</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'requested_changes':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Changes Requested</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(status)}
                <span className="text-sm">Version {version}</span>
                {scheduledPublishAt && (
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Scheduled for {format(new Date(scheduledPublishAt), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
                {expirationDate && (
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Expires {format(new Date(expirationDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </CardDescription>
          </div>
          
          {status === 'review' && (
            <div className="flex gap-2">
              <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="default" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedAction('approve');
                      setReviewComments('');
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </DialogTrigger>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => {
                    setSelectedAction('request_changes');
                    setIsActionDialogOpen(true);
                    setReviewComments('');
                  }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Request Changes
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => {
                    setSelectedAction('reject');
                    setIsActionDialogOpen(true);
                    setReviewComments('');
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedAction === 'approve' && 'Approve Content'}
                      {selectedAction === 'reject' && 'Reject Content'}
                      {selectedAction === 'request_changes' && 'Request Changes'}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedAction === 'approve' && 'Content will be published or scheduled based on the publish date.'}
                      {selectedAction === 'reject' && 'Content will be moved back to draft status.'}
                      {selectedAction === 'request_changes' && 'Please provide specific feedback for the content creator.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Label htmlFor="comments" className="text-right">
                      {selectedAction === 'approve' 
                        ? 'Approval Comments (Optional)' 
                        : 'Feedback Comments'}
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder={
                        selectedAction === 'approve' 
                          ? 'Enter any comments about this approval (optional)' 
                          : 'Enter specific feedback for the content creator'
                      }
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      className="mt-2"
                      rows={5}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleActionSubmit}
                      disabled={
                        selectedAction === 'request_changes' && !reviewComments.trim() ||
                        approveMutation.isPending || 
                        rejectMutation.isPending || 
                        requestChangesMutation.isPending
                      }
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="current">
              <Eye className="h-4 w-4 mr-1" />
              Current Version
            </TabsTrigger>
            <TabsTrigger value="versions">
              <History className="h-4 w-4 mr-1" />
              Version History
            </TabsTrigger>
            <TabsTrigger value="activity">
              <MessageSquare className="h-4 w-4 mr-1" />
              Review Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            <div className="border rounded-md p-4 whitespace-pre-wrap">
              {content || (versionsData?.content?.content || 'Content not available')}
            </div>
            
            {scheduledPublishAt && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="font-medium flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Publishing Schedule
                </h4>
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Scheduled to publish:</span>
                    <span className="font-medium">
                      {format(new Date(scheduledPublishAt), 'MMMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {expirationDate && (
                    <div className="flex justify-between items-center mt-1">
                      <span>Content expires:</span>
                      <span className="font-medium">
                        {format(new Date(expirationDate), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="versions">
            {isLoadingVersions ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : versionsError ? (
              <div className="text-center p-4 text-destructive">
                Failed to load version history.
              </div>
            ) : (versionsData?.versions?.length || 0) === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No version history available.
              </div>
            ) : (
              <div className="space-y-4">
                {versionsData?.versions?.map((ver: ContentVersion, index: number) => (
                  <div key={ver.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium flex items-center">
                          <span className="mr-2">Version {ver.version}</span>
                          {index === 0 && (
                            <Badge variant="outline">Current</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(ver.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                    {index < (versionsData?.versions?.length || 0) - 1 && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Changes from previous version
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity">
            {isLoadingHistory ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
              </div>
            ) : historyError ? (
              <div className="text-center p-4 text-destructive">
                Failed to load activity history.
              </div>
            ) : (!historyData || historyData.length === 0) ? (
              <div className="text-center p-4 text-muted-foreground">
                No review activity available.
              </div>
            ) : (
              <div className="space-y-4">
                {historyData.map((entry: ContentHistoryEntry) => (
                  <div key={entry.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(entry.action)}
                          <h4 className="font-medium">
                            <span className="text-muted-foreground">by</span> {entry.username || 'System'}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-sm text-right text-muted-foreground">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                    
                    {entry.comments && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm whitespace-pre-wrap">{entry.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {createdAt && `Created ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`}
          {updatedAt && ` • Updated ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}`}
        </div>
        
        <div className="flex gap-2">
          {status === 'changes_requested' && (
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          
          {status === 'draft' && (
            <Button variant="default" size="sm" className="flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              Submit for Review
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}