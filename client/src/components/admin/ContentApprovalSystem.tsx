import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Define types for our content items
type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'changes_requested' | 'archived';

interface ContentItem {
  id: number;
  title: string;
  type: string;
  section: string;
  content: string;
  status: ContentStatus;
  version: number;
  createdBy: number;
  createdAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  lastModifiedBy: number | null;
  lastModifiedAt: string | null;
}

interface ContentReviewAction {
  id: number;
  status: ContentStatus;
  feedback?: string;
}

interface ContentFilter {
  status?: ContentStatus;
  section?: string;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Status badge component
const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const statusStyles = {
    draft: "bg-slate-400 hover:bg-slate-500",
    review: "bg-amber-400 hover:bg-amber-500",
    approved: "bg-green-400 hover:bg-green-500",
    published: "bg-blue-400 hover:bg-blue-500",
    changes_requested: "bg-red-400 hover:bg-red-500",
    archived: "bg-gray-400 hover:bg-gray-500"
  };

  const statusIcons = {
    draft: <Clock className="h-3 w-3 mr-1" />,
    review: <AlertCircle className="h-3 w-3 mr-1" />,
    approved: <CheckCircle className="h-3 w-3 mr-1" />,
    published: <CheckCircle className="h-3 w-3 mr-1" />,
    changes_requested: <XCircle className="h-3 w-3 mr-1" />,
    archived: <XCircle className="h-3 w-3 mr-1" />
  };

  return (
    <Badge className={statusStyles[status]}>
      {statusIcons[status]}
      {status.replace('_', ' ')}
    </Badge>
  );
};

// Content item card component
const ContentCard = ({ 
  item, 
  onReview 
}: { 
  item: ContentItem, 
  onReview: (id: number) => void 
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>
              {item.type} • {item.section} • Version {item.version}
            </CardDescription>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2 line-clamp-2">
          {item.content.length > 150 
            ? `${item.content.substring(0, 150)}...` 
            : item.content}
        </p>
        <div className="text-xs text-gray-500 flex flex-wrap gap-y-1">
          <span className="mr-3">Created: {formatDate(item.createdAt)}</span>
          {item.lastModifiedAt && (
            <span className="mr-3">Modified: {formatDate(item.lastModifiedAt)}</span>
          )}
          {item.publishedAt && (
            <span className="mr-3">Published: {formatDate(item.publishedAt)}</span>
          )}
          {item.expiresAt && (
            <span>Expires: {formatDate(item.expiresAt)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onReview(item.id)}
        >
          Review
        </Button>
      </CardFooter>
    </Card>
  );
};

// Filter component
const ContentFilters = ({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: ContentFilter) => void 
}) => {
  const [filters, setFilters] = useState<ContentFilter>({});

  const handleStatusChange = (status: ContentStatus | undefined) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Filter by status:</h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={!filters.status ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange(undefined)}
        >
          All
        </Button>
        <Button 
          variant={filters.status === 'draft' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('draft')}
        >
          Draft
        </Button>
        <Button 
          variant={filters.status === 'review' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('review')}
        >
          In Review
        </Button>
        <Button 
          variant={filters.status === 'changes_requested' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('changes_requested')}
        >
          Changes Requested
        </Button>
        <Button 
          variant={filters.status === 'approved' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('approved')}
        >
          Approved
        </Button>
        <Button 
          variant={filters.status === 'published' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('published')}
        >
          Published
        </Button>
        <Button 
          variant={filters.status === 'archived' ? "default" : "outline"} 
          size="sm"
          onClick={() => handleStatusChange('archived')}
        >
          Archived
        </Button>
      </div>
    </div>
  );
};

// Main component
const ContentApprovalSystem = () => {
  const [filters, setFilters] = useState<ContentFilter>({});
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle auto-refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/items'] });
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh, queryClient]);

  // Fetch content items
  const { 
    data: contentItems = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/content-workflow/items', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.section) params.append('section', filters.section);
      
      const response = await apiRequest(`/api/content-workflow/items?${params.toString()}`);
      return response as ContentItem[];
    }
  });

  // Handle review action
  const reviewMutation = useMutation({
    mutationFn: async (reviewAction: ContentReviewAction) => {
      const response = await apiRequest('/api/content-workflow/review', {
        method: 'POST',
        body: JSON.stringify(reviewAction)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Content review completed",
        description: "The content status has been updated successfully.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/content-workflow/items'] });
      setSelectedItemId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update content status. Please try again.",
        variant: "destructive"
      });
      console.error("Content review error:", error);
    }
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    toast({
      title: "Refreshed",
      description: "Content items have been refreshed.",
      variant: "default"
    });
  };

  // Filter content items
  const filteredItems = contentItems;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Content Approval System</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="mr-2"
            />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh (30s)
            </label>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>

      <ContentFilters onFilterChange={setFilters} />

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="all">All Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load content items. Please try again.
            </div>
          ) : filteredItems.filter(item => 
              item.status === 'review' || 
              item.status === 'changes_requested'
            ).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items pending review.
            </div>
          ) : (
            filteredItems
              .filter(item => 
                item.status === 'review' || 
                item.status === 'changes_requested'
              )
              .map(item => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  onReview={(id) => setSelectedItemId(id)} 
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load content items. Please try again.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No content items match your filters.
            </div>
          ) : (
            filteredItems.map(item => (
              <ContentCard 
                key={item.id} 
                item={item} 
                onReview={(id) => setSelectedItemId(id)} 
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Content Review Dialog would go here - using a simplified approach for now */}
      {selectedItemId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Content</CardTitle>
              <CardDescription>
                Review and approve or request changes to this content item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentItems.find(item => item.id === selectedItemId) && (
                  <>
                    <div>
                      <h3 className="font-medium">Title</h3>
                      <p>{contentItems.find(item => item.id === selectedItemId)?.title}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Content</h3>
                      <p className="whitespace-pre-wrap">
                        {contentItems.find(item => item.id === selectedItemId)?.content}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedItemId(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => 
                  reviewMutation.mutate({
                    id: selectedItemId,
                    status: 'changes_requested',
                    feedback: 'Please make the following changes...'
                  })
                }
                disabled={reviewMutation.isPending}
              >
                Request Changes
              </Button>
              <Button 
                variant="default"
                onClick={() => 
                  reviewMutation.mutate({
                    id: selectedItemId,
                    status: 'approved'
                  })
                }
                disabled={reviewMutation.isPending}
              >
                Approve
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentApprovalSystem;