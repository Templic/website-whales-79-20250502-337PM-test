/**
 * WorkflowManagement.tsx
 * 
 * Component for managing content workflows and approval processes
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutList, CheckCircle2, XCircle, Clock, RefreshCw, 
  ChevronDown, Plus, Search, Settings2, ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Workflow stage/status types
type WorkflowStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'published' | 'archived';

// Content item interface
interface ContentItem {
  id: number;
  title: string;
  type: string;
  status: WorkflowStatus;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  lastUpdated: string;
  created: string;
  nextReviewDate?: string;
  version: number;
  reviewers?: {
    id: number;
    name: string;
    avatar?: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
}

// Content types for filtering
const contentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'blog', label: 'Blog Posts' },
  { value: 'product', label: 'Product Descriptions' },
  { value: 'page', label: 'Web Pages' },
  { value: 'newsletter', label: 'Newsletters' },
  { value: 'social', label: 'Social Media' },
];

// Workflow statuses for filtering
const workflowStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

// Mock content data (this would come from the API in a real implementation)
const mockContent: ContentItem[] = [
  {
    id: 1,
    title: 'Introduction to Cosmic Consciousness',
    type: 'blog',
    status: 'review',
    author: {
      id: 1,
      name: 'Alex Thompson',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=alex',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    version: 2,
    reviewers: [
      {
        id: 2,
        name: 'Sarah Miller',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah',
        status: 'approved',
      },
      {
        id: 3,
        name: 'James Wilson',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=james',
        status: 'pending',
      },
    ],
  },
  {
    id: 2,
    title: 'Sound Healing Products (Spring 2025)',
    type: 'product',
    status: 'approved',
    author: {
      id: 3,
      name: 'James Wilson',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=james',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    nextReviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
    version: 4,
  },
  {
    id: 3,
    title: 'April Newsletter: Cosmic Vibrations',
    type: 'newsletter',
    status: 'published',
    author: {
      id: 4,
      name: 'Elena Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=elena',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    version: 2,
  },
  {
    id: 4,
    title: 'Upcoming Summer Events',
    type: 'page',
    status: 'draft',
    author: {
      id: 2,
      name: 'Sarah Miller',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=sarah',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    version: 1,
  },
  {
    id: 5,
    title: 'Frequency Meditation Technique Guide',
    type: 'blog',
    status: 'rejected',
    author: {
      id: 5,
      name: 'Michael Chang',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=michael',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    version: 1,
    reviewers: [
      {
        id: 1,
        name: 'Alex Thompson',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=alex',
        status: 'rejected',
      },
    ],
  },
  {
    id: 6,
    title: 'Instagram Campaign: Cosmic Sounds',
    type: 'social',
    status: 'archived',
    author: {
      id: 6,
      name: 'Jasmine Lee',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=jasmine',
    },
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
    version: 3,
  },
];

const WorkflowManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'pending'>('all');
  const [contentType, setContentType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'type' | 'status' | 'lastUpdated'>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch content items from the API
  const { 
    data: contentItems,
    isLoading,
    error,
    refetch
  } = useQuery<ContentItem[]>({
    queryKey: ['/api/admin/content-workflow'],
    // In a real implementation, this would call an API endpoint
    queryFn: async () => {
      // For the demo, we'll just return mock data
      return new Promise(resolve => {
        setTimeout(() => resolve(mockContent), 500);
      });
    },
  });

  // Update content status mutation
  const updateContentStatusMutation = useMutation({
    mutationFn: async ({ 
      contentId, 
      status 
    }: { 
      contentId: number; 
      status: WorkflowStatus 
    }) => {
      // Simulate API call
      return new Promise<void>(resolve => {
        setTimeout(() => resolve(), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-workflow'] });
      toast({
        title: 'Status Updated',
        description: 'The content status has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Filter content based on active tab, content type, status, and search term
  const filteredContent = contentItems?.filter(item => {
    // First filter by tab
    if (activeTab === 'mine' && item.author.id !== 1) return false; // Assuming current user id is 1
    if (activeTab === 'pending' && item.status !== 'review') return false;
    
    // Then filter by content type
    if (contentType !== 'all' && item.type !== contentType) return false;
    
    // Then filter by status
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    
    // Finally filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.author.name.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }) || [];

  // Sort filtered content
  const sortedContent = [...filteredContent].sort((a, b) => {
    if (sortField === 'title') {
      return sortDirection === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else if (sortField === 'type') {
      return sortDirection === 'asc' 
        ? a.type.localeCompare(b.type) 
        : b.type.localeCompare(a.type);
    } else if (sortField === 'status') {
      return sortDirection === 'asc' 
        ? a.status.localeCompare(b.status) 
        : b.status.localeCompare(a.status);
    } else {
      return sortDirection === 'asc' 
        ? new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime() 
        : new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });

  // Update sort
  const updateSort = (field: 'title' | 'type' | 'status' | 'lastUpdated') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to get status badge
  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Draft</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Published</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get available status transitions for a content item
  const getAvailableStatusTransitions = (item: ContentItem): WorkflowStatus[] => {
    switch (item.status) {
      case 'draft':
        return ['review'];
      case 'review':
        return ['approved', 'rejected'];
      case 'approved':
        return ['published', 'rejected'];
      case 'rejected':
        return ['draft'];
      case 'published':
        return ['archived'];
      case 'archived':
        return ['draft'];
      default:
        return [];
    }
  };

  // Content type display
  const getContentTypeDisplay = (type: string) => {
    const found = contentTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Handle status change
  const handleStatusChange = (contentId: number, newStatus: WorkflowStatus) => {
    updateContentStatusMutation.mutate({ contentId, status: newStatus });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        <h3 className="font-bold">Error Loading Workflow Data</h3>
        <p>{error instanceof Error ? error.message : 'Failed to load workflow data'}</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center">
          <LayoutList className="mr-2 h-6 w-6" />
          Content Workflow
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Content
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'mine' | 'pending')}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="mine">My Content</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search content..."
                className="w-full md:w-[200px] pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {workflowStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-6 p-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px] cursor-pointer" onClick={() => updateSort('title')}>
                      <div className="flex items-center">
                        Title
                        {sortField === 'title' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => updateSort('type')}>
                      <div className="flex items-center">
                        Type
                        {sortField === 'type' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => updateSort('status')}>
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => updateSort('lastUpdated')}>
                      <div className="flex items-center">
                        Last Updated
                        {sortField === 'lastUpdated' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No content found. {searchTerm && "Try adjusting your search or filters."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>{getContentTypeDisplay(item.type)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.author.avatar} alt={item.author.name} />
                              <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{item.author.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>{formatDate(item.lastUpdated)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log('Edit content', item.id)}
                            >
                              Edit
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Actions <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => console.log('View content', item.id)}
                                >
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => console.log('View history', item.id)}
                                >
                                  History
                                </DropdownMenuItem>
                                
                                {/* Status transitions */}
                                {getAvailableStatusTransitions(item).length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {getAvailableStatusTransitions(item).map((status) => (
                                      <DropdownMenuItem
                                        key={status}
                                        onClick={() => handleStatusChange(item.id, status)}
                                      >
                                        {status === 'review' && 'Submit for Review'}
                                        {status === 'approved' && 'Approve'}
                                        {status === 'rejected' && 'Reject'}
                                        {status === 'published' && 'Publish'}
                                        {status === 'archived' && 'Archive'}
                                        {status === 'draft' && 'Return to Draft'}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="mt-6 p-0">
          <Card>
            <CardContent className="p-6">
              {filteredContent.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>You haven't created any content yet.</p>
                  <Button className="mt-4" onClick={() => console.log('Create content')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedContent.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-md p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{item.title}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getContentTypeDisplay(item.type)} • Last updated on {formatDate(item.lastUpdated)}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>Version {item.version}</span>
                            {item.reviewers && (
                              <>
                                <Separator orientation="vertical" className="h-3 mx-1" />
                                <span>
                                  {item.reviewers.filter(r => r.status === 'approved').length}/{item.reviewers.length} approved
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Edit content', item.id)}
                          >
                            Edit
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => console.log('View content', item.id)}
                              >
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => console.log('View history', item.id)}
                              >
                                History
                              </DropdownMenuItem>
                              
                              {/* Status transitions */}
                              {getAvailableStatusTransitions(item).length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  {getAvailableStatusTransitions(item).map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() => handleStatusChange(item.id, status)}
                                    >
                                      {status === 'review' && 'Submit for Review'}
                                      {status === 'approved' && 'Approve'}
                                      {status === 'rejected' && 'Reject'}
                                      {status === 'published' && 'Publish'}
                                      {status === 'archived' && 'Archive'}
                                      {status === 'draft' && 'Return to Draft'}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6 p-0">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>
                Content that requires your review or is waiting for others to review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>There are no items pending review at this time.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedContent.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-md p-4"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{item.title}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getContentTypeDisplay(item.type)} • Submitted on {formatDate(item.lastUpdated)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm">By:</span>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={item.author.avatar} alt={item.author.name} />
                              <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{item.author.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View content', item.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'rejected')}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      
                      {item.reviewers && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Review Status</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.reviewers.map((reviewer) => (
                              <div 
                                key={reviewer.id}
                                className="flex items-center gap-2 bg-accent/50 rounded-full px-3 py-1"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={reviewer.avatar} alt={reviewer.name} />
                                  <AvatarFallback>{reviewer.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{reviewer.name}</span>
                                {reviewer.status === 'approved' && (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )}
                                {reviewer.status === 'rejected' && (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                {reviewer.status === 'pending' && (
                                  <Clock className="h-3 w-3 text-amber-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredContent.length} of {contentItems?.length || 0} content items
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => console.log('Workflow settings')}>
          <Settings2 className="mr-2 h-4 w-4" />
          Workflow Settings
        </Button>
      </div>
    </div>
  );
};

export default WorkflowManagement;