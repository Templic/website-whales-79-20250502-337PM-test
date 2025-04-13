import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface ContentItem {
  id: number;
  title: string;
  content: string;
  status: string;
  reviewStatus?: string;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  scheduledPublishAt?: string;
  creator?: {
    id: number;
    username: string;
  };
}

export function EnhancedContentReview() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for scheduled content in review queue
  const { data: reviewQueue, isLoading, error, refetch } = useQuery<ContentItem[]>({
    queryKey: ['/api/content-workflow/review-queue'],
    queryFn: async () => {
      const response = await fetch('/api/content-workflow/review-queue');
      if (!response.ok) {
        throw new Error('Failed to fetch review queue');
      }
      return response.json();
    },
    // Poll for updates every minute
    refetchInterval: 60000,
  });

  // Filter for items that have a scheduled publish date
  const scheduledItems = reviewQueue?.filter(item => 
    item.scheduledPublishAt && new Date(item.scheduledPublishAt) > new Date()
  ) || [];

  // Approve content mutation
  const approveMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(`/api/content-workflow/${contentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve content');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/review-queue'] });
      toast({
        title: 'Success',
        description: 'Content has been approved for publishing',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve content',
        variant: 'destructive',
      });
    },
  });

  // Request changes mutation
  const requestChangesMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(`/api/content-workflow/${contentId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request changes');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/review-queue'] });
      toast({
        title: 'Success',
        description: 'Changes have been requested',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request changes',
        variant: 'destructive',
      });
    },
  });

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  // Open review dialog
  const handleReviewItem = (item: ContentItem) => {
    setSelectedItem(item);
    setReviewNotes('');
    setIsOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedItem(null);
    setReviewNotes('');
  };

  // Handle approve action
  const handleApprove = () => {
    if (selectedItem) {
      approveMutation.mutate(selectedItem.id);
    }
  };

  // Handle request changes action
  const handleRequestChanges = () => {
    if (selectedItem && reviewNotes.trim().length > 0) {
      requestChangesMutation.mutate(selectedItem.id);
    } else {
      toast({
        title: 'Error',
        description: 'Please provide feedback when requesting changes',
        variant: 'destructive',
      });
    }
  };

  // Check if there are any pending items that need review
  useEffect(() => {
    if (scheduledItems && scheduledItems.length > 0) {
      // Check if there are any items that will be published soon (in 24 hours)
      const soon = scheduledItems.some(item => {
        if (!item.scheduledPublishAt) return false;
        const publishDate = new Date(item.scheduledPublishAt);
        const now = new Date();
        const timeDiff = publishDate.getTime() - now.getTime();
        return timeDiff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      });

      // Show notification for items that need review soon
      if (soon) {
        toast({
          title: "Scheduled Content Needs Review",
          description: "There are scheduled content items that will be published soon.",
          duration: 10000,
        });
      }
    }
  }, [scheduledItems, toast]);

  return (
    <>
      {/* Review detail dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Content Review</DialogTitle>
            <DialogDescription>
              Review scheduled content before publishing
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div className="border p-4 rounded">
                  <h3 className="font-bold text-lg mb-2">{selectedItem.title}</h3>
                  <div className="mt-4 whitespace-pre-wrap">
                    {selectedItem.content}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Created By</p>
                    <p>{selectedItem.creator?.username || 'Unknown'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Created At</p>
                    <p>{formatDate(selectedItem.createdAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <Badge>{selectedItem.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Scheduled Publish</p>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(selectedItem.scheduledPublishAt)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <p className="text-sm font-medium">Review Notes</p>
                    <Textarea 
                      placeholder="Add notes for the content creator or for future reference..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex items-center justify-end space-x-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRequestChanges}>
              <XCircle className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}