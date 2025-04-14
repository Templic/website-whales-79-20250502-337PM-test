import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Edit, Eye, History, ArrowUpDown } from 'lucide-react';

// Type for content item with workflow info
interface ContentItem {
  id: number;
  type: 'text' | 'image' | 'html';
  key: string;
  title: string;
  content: string;
  page: string;
  section: string;
  imageUrl?: string;
  status: 'draft' | 'review' | 'changes_requested' | 'approved' | 'published' | 'archived';
  reviewerId?: number;
  reviewStatus?: 'pending' | 'in_progress' | 'completed';
  reviewStartedAt?: string;
  reviewCompletedAt?: string;
  scheduledPublishAt?: string;
  expirationDate?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
  version: number;
  createdBy?: number;
  lastModifiedBy?: number;
  createdByName?: string;
  reviewerName?: string;
}

// Type for content workflow history
interface ContentWorkflowHistory {
  id: number;
  contentId: number;
  fromStatus?: string;
  toStatus: string;
  actorId?: number;
  actorName?: string;
  actionAt: string;
  comments?: string;
}

// Mapping for status badges
const statusBadgeMap = {
  draft: { variant: 'outline', label: 'Draft' },
  review: { variant: 'secondary', label: 'In Review' },
  changes_requested: { variant: 'destructive', label: 'Changes Requested' },
  approved: { variant: 'secondary', label: 'Approved' },
  published: { variant: 'default', label: 'Published' },
  archived: { variant: 'outline', label: 'Archived' }
};

const WorkflowManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [workflowTab, setWorkflowTab] = useState('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [showWorkflowHistory, setShowWorkflowHistory] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  // Fetch content items
  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['contentItems', workflowTab],
    queryFn: async () => {
      const response = await fetch(`/api/admin/content?status=${workflowTab}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    },
  });

  // Fetch workflow history for a content item
  const { data: workflowHistory, isLoading: historyLoading } = useQuery<ContentWorkflowHistory[]>({
    queryKey: ['contentWorkflowHistory', selectedContent?.id],
    queryFn: async () => {
      if (!selectedContent?.id) return [];
      const response = await fetch(`/api/admin/content/${selectedContent.id}/history`);
      if (!response.ok) throw new Error('Failed to fetch workflow history');
      return response.json();
    },
    enabled: !!selectedContent?.id && showWorkflowHistory,
  });

  // Update content status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      contentId, 
      status, 
      notes, 
      scheduledPublish, 
      expiration 
    }: { 
      contentId: number; 
      status: string; 
      notes?: string;
      scheduledPublish?: string;
      expiration?: string;
    }) => {
      const response = await fetch(`/api/admin/content/${contentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          reviewNotes: notes, 
          scheduledPublishAt: scheduledPublish,
          expirationDate: expiration
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update content status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      toast({
        title: 'Status Updated',
        description: 'Content workflow status has been updated successfully',
      });
      setSelectedContent(null);
      setReviewNotes('');
      setPublishDate(undefined);
      setExpirationDate(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Function to handle workflow action
  const handleWorkflowAction = (action: 'approve' | 'reject' | 'publish' | 'archive') => {
    if (!selectedContent) return;
    
    const statusMap = {
      approve: 'approved',
      reject: 'changes_requested',
      publish: 'published',
      archive: 'archived'
    };
    
    updateStatusMutation.mutate({
      contentId: selectedContent.id,
      status: statusMap[action],
      notes: reviewNotes,
      scheduledPublish: publishDate ? publishDate.toISOString() : undefined,
      expiration: expirationDate ? expirationDate.toISOString() : undefined
    });
  };

  // Function to handle sorting
  const requestSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort content items
  const sortedItems = contentItems ? [...contentItems].sort((a, b) => {
    if (!a[sortConfig.key as keyof ContentItem] || !b[sortConfig.key as keyof ContentItem]) return 0;
    
    const aValue = a[sortConfig.key as keyof ContentItem];
    const bValue = b[sortConfig.key as keyof ContentItem];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  }) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Workflow Management</CardTitle>
          <CardDescription>
            Manage your content approval workflow and publication scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={workflowTab} onValueChange={setWorkflowTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="review">In Review</TabsTrigger>
              <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            
            <TabsContent value={workflowTab} className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : sortedItems && sortedItems.length > 0 ? (
                <Table>
                  <TableCaption>
                    {workflowTab === 'pending' && 'Content waiting for review'}
                    {workflowTab === 'review' && 'Content currently in review'}
                    {workflowTab === 'changes_requested' && 'Content that needs changes'}
                    {workflowTab === 'approved' && 'Content approved but not yet published'}
                    {workflowTab === 'published' && 'Currently published content'}
                    {workflowTab === 'archived' && 'Archived content'}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] cursor-pointer" onClick={() => requestSort('title')}>
                        Title <ArrowUpDown className="inline h-4 w-4" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort('page')}>
                        Page <ArrowUpDown className="inline h-4 w-4" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort('updatedAt')}>
                        Last Updated <ArrowUpDown className="inline h-4 w-4" />
                      </TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>
                        {workflowTab === 'published' ? 'Publish Date' : 'Status'}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{item.page}</TableCell>
                        <TableCell>
                          {item.updatedAt 
                            ? format(new Date(item.updatedAt), 'PPp') 
                            : format(new Date(item.createdAt), 'PPp')}
                        </TableCell>
                        <TableCell>{item.createdByName || 'System'}</TableCell>
                        <TableCell>
                          {workflowTab === 'published' && item.scheduledPublishAt ? (
                            format(new Date(item.scheduledPublishAt), 'PPp')
                          ) : (
                            <Badge 
                              variant={
                                statusBadgeMap[item.status]?.variant as 
                                "default" | "secondary" | "destructive" | "outline" | undefined
                              }
                            >
                              {statusBadgeMap[item.status]?.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedContent(item);
                                setShowWorkflowHistory(false);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedContent(item);
                                setShowWorkflowHistory(true);
                              }}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No content items in this status</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Review Dialog */}
      {selectedContent && !showWorkflowHistory && (
        <Dialog open={!!selectedContent} onOpenChange={(open) => !open && setSelectedContent(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review Content: {selectedContent.title}</DialogTitle>
              <DialogDescription>
                Review and update the workflow status for this content
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <h3 className="text-lg font-medium">Content Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium">Type:</p>
                    <p className="text-sm">{selectedContent.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Key:</p>
                    <p className="text-sm">{selectedContent.key}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Page:</p>
                    <p className="text-sm">{selectedContent.page}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Section:</p>
                    <p className="text-sm">{selectedContent.section}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created:</p>
                    <p className="text-sm">{format(new Date(selectedContent.createdAt), 'PPp')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Version:</p>
                    <p className="text-sm">{selectedContent.version}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Content Preview</h3>
                <div className="border rounded-md p-4 mt-2 max-h-64 overflow-auto">
                  {selectedContent.type === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                  ) : selectedContent.type === 'image' ? (
                    <div className="text-center">
                      <img 
                        src={selectedContent.imageUrl || ''} 
                        alt={selectedContent.title} 
                        className="max-h-60 inline-block" 
                      />
                    </div>
                  ) : (
                    <p>{selectedContent.content}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Workflow Actions</h3>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Review Notes</label>
                    <Textarea
                      placeholder="Add comments or feedback about this content"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
                  
                  {(workflowTab === 'pending' || workflowTab === 'review' || workflowTab === 'approved') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Schedule Publication</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {publishDate ? format(publishDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={publishDate}
                              onSelect={setPublishDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Set Expiration Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {expirationDate ? format(expirationDate, 'PPP') : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={expirationDate}
                              onSelect={setExpirationDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {workflowTab === 'published' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleWorkflowAction('archive')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Archive
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedContent(null)}
                >
                  Cancel
                </Button>
                
                {(workflowTab === 'pending' || workflowTab === 'review') && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleWorkflowAction('reject')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => handleWorkflowAction('approve')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                
                {workflowTab === 'approved' && (
                  <Button 
                    variant="default" 
                    onClick={() => handleWorkflowAction('publish')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {publishDate ? 'Schedule Publish' : 'Publish Now'}
                  </Button>
                )}
                
                {workflowTab === 'changes_requested' && (
                  <Button 
                    variant="default" 
                    onClick={() => handleWorkflowAction('approve')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Changes Completed
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Workflow History Dialog */}
      {selectedContent && showWorkflowHistory && (
        <Dialog open={showWorkflowHistory} onOpenChange={(open) => !open && setShowWorkflowHistory(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Workflow History: {selectedContent.title}</DialogTitle>
              <DialogDescription>
                View the complete approval workflow history for this content
              </DialogDescription>
            </DialogHeader>
            
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : workflowHistory && workflowHistory.length > 0 ? (
              <div className="py-4">
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {workflowHistory.map((history) => (
                      <div key={history.id} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-background"></div>
                        </div>
                        <div className="p-4 border rounded-md shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-sm font-medium">
                                {history.fromStatus ? `${statusBadgeMap[history.fromStatus as keyof typeof statusBadgeMap]?.label} → ` : ''}
                                {statusBadgeMap[history.toStatus as keyof typeof statusBadgeMap]?.label}
                              </span>
                              <Badge className="ml-2" variant="outline">
                                {history.actorName || 'System'}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(history.actionAt), 'PPp')}
                            </span>
                          </div>
                          {history.comments && (
                            <p className="text-sm mt-1">{history.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No workflow history available</p>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowWorkflowHistory(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WorkflowManagement;