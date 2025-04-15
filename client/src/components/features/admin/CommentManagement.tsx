/**
 * CommentManagement.tsx
 * 
 * Component for managing and moderating user comments
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, XCircle, AlertTriangle, 
  Search, MoreHorizontal, RefreshCw, ChevronDown
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  approved: boolean;
  postId: number;
  postTitle?: string;
}

export function CommentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('pending');

  // Fetch comments data
  const { data: comments, isLoading, error, refetch } = useQuery<Comment[]>({
    queryKey: ['/api/admin/comments'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/comments');
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
      } catch (err) {
        console.error('Error fetching comments:', err);
        return [];
      }
    },
  });

  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/comments'] });
      toast({
        title: 'Comment Approved',
        description: 'The comment has been approved and is now visible.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to approve comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Reject comment mutation
  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/admin/comments/${commentId}/reject`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to reject comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/comments'] });
      toast({
        title: 'Comment Rejected',
        description: 'The comment has been rejected and hidden from public view.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reject comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/comments'] });
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been permanently deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Filter comments based on filter type and search term
  const filteredComments = comments?.filter(comment => {
    // First apply status filter
    if (filter === 'pending' && comment.approved) return false;
    if (filter === 'approved' && !comment.approved) return false;
    // Then apply search term filter if present
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        comment.content.toLowerCase().includes(searchLower) ||
        comment.authorName.toLowerCase().includes(searchLower) ||
        comment.authorEmail.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock data if API fails or not available yet
  React.useEffect(() => {
    if (!comments && !isLoading) {
      // Only use mock data if the API fails or isn't available
      const mockComments: Comment[] = [
        {
          id: 1,
          content: "I absolutely love how the cosmic frequency tools have helped my meditation practice. The binaural beats are incredible!",
          authorName: "Cosmic Explorer",
          authorEmail: "explorer@cosmic.com",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          approved: false,
          postId: 5,
          postTitle: "Benefits of Cosmic Frequencies"
        },
        {
          id: 2,
          content: "The sound journey was life-changing. I've never experienced such deep relaxation.",
          authorName: "SoundHealer42",
          authorEmail: "healer@soundtherapy.com",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          approved: false,
          postId: 3,
          postTitle: "Multidimensional Sound Journey"
        },
        {
          id: 3,
          content: "I've been using the frequencies for a week now and already feel more balanced.",
          authorName: "BalancedSoul",
          authorEmail: "balanced@harmony.com",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          approved: true,
          postId: 6,
          postTitle: "Frequency Attunement Guide"
        },
        {
          id: 4,
          content: "How do I download these tracks to use offline?",
          authorName: "MeditationNovice",
          authorEmail: "novice@learn.com",
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          approved: false,
          postId: 2,
          postTitle: "Getting Started with Cosmic Sounds"
        },
        {
          id: 5,
          content: "Does this work with headphones or do I need speakers?",
          authorName: "TechAudiophile",
          authorEmail: "tech@audio.com",
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          approved: false,
          postId: 4,
          postTitle: "Equipment for Optimal Experience"
        }
      ];

      // Return mock data for display
      queryClient.setQueryData(['/api/admin/comments'], mockComments);
    }
  }, [comments, isLoading, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        <h3 className="font-bold">Error Loading Comments</h3>
        <p>{error instanceof Error ? error.message : 'Failed to load comments'}</p>
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search comments..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between">
                <span>
                  {filter === 'all' && 'All Comments'}
                  {filter === 'pending' && 'Pending Comments'}
                  {filter === 'approved' && 'Approved Comments'}
                  {filter === 'flagged' && 'Flagged Comments'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>All Comments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('pending')}>Pending Comments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('approved')}>Approved Comments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('flagged')}>Flagged Comments</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No comments found. {searchTerm && "Try adjusting your search term."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell className="max-w-xs">
                      <div className="font-medium truncate">{comment.content}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Post: {comment.postTitle || `Post #${comment.postId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{comment.authorName}</div>
                      <div className="text-xs text-muted-foreground">{comment.authorEmail}</div>
                    </TableCell>
                    <TableCell>
                      {formatDate(comment.createdAt)}
                    </TableCell>
                    <TableCell>
                      {comment.approved ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!comment.approved && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => approveCommentMutation.mutate(comment.id)}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {comment.approved && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => rejectCommentMutation.mutate(comment.id)}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="text-red-600"
                            >
                              Delete Comment
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Post</DropdownMenuItem>
                            <DropdownMenuItem>Flag for Review</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}