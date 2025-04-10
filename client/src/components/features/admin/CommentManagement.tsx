/**
 * CommentManagement.tsx
 * 
 * Component for managing comments in the admin portal
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  postId: number;
  postTitle?: string;
  approved: boolean;
  createdAt: string;
}

export function CommentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch unapproved comments
  const { data: unapprovedComments, isLoading: isLoadingUnapproved } = useQuery<Comment[]>({
    queryKey: ['/api/posts/comments/unapproved'],
    queryFn: () => fetch('/api/posts/comments/unapproved').then(res => {
      if (!res.ok) throw new Error('Failed to fetch unapproved comments');
      return res.json();
    }),
    enabled: user?.role === 'admin' || user?.role === 'super_admin'
  });

  // Approve comment mutation
  const approveCommentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/posts/comments/${id}/approve`, 'POST');
    },
    onSuccess: () => {
      // Refresh comments list
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Comment approved.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Reject comment mutation
  const rejectCommentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/comments/${id}/reject`, 'POST');
    },
    onSuccess: () => {
      // Refresh comments list
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Comment rejected.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle approve comment
  const handleApproveComment = (id: number) => {
    if (confirm('Are you sure you want to approve this comment?')) {
      approveCommentMutation.mutate(id);
    }
  };

  // Handle reject comment
  const handleRejectComment = (id: number) => {
    if (confirm('Are you sure you want to reject this comment? This action cannot be undone.')) {
      rejectCommentMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Comments Pending Approval
        </h2>
      </div>

      {isLoadingUnapproved ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !unapprovedComments || unapprovedComments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No comments pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unapprovedComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-base">
                  <span>{comment.authorName} <span className="text-sm text-muted-foreground">({comment.authorEmail})</span></span>
                  <Badge>Pending</Badge>
                </CardTitle>
                <CardDescription>
                  Posted {format(new Date(comment.createdAt), 'PPp')} on post: {comment.postTitle || `Post ID: ${comment.postId}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-l-4 border-gray-200 pl-4 py-2 italic">
                  {comment.content}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRejectComment(comment.id)}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApproveComment(comment.id)}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentManagement;