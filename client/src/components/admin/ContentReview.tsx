import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Check, X, AlertCircle, Eye, FileText, Music, MessageSquare } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define interfaces based on our database schema
interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string | null;
  authorName?: string; // Added in API response
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string | null;
  authorName?: string; // Added in API response
  postTitle?: string; // Added in API response
}

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
  updatedAt: string | null;
  uploadedById?: number;
  uploadedByName?: string; // Added in API response
}

// Union type for content display
type ContentItem = 
  | (Post & { type: 'post' })
  | (Comment & { type: 'comment' })
  | (Track & { type: 'track' });

export default function ContentReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch unapproved posts
  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['unapprovedPosts'],
    queryFn: () => fetch('/api/admin/posts/unapproved').then(res => {
      if (!res.ok) throw new Error('Failed to fetch unapproved posts');
      return res.json();
    })
  });

  // Fetch unapproved comments
  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['unapprovedComments'],
    queryFn: () => fetch('/api/admin/comments/unapproved').then(res => {
      if (!res.ok) throw new Error('Failed to fetch unapproved comments');
      return res.json();
    }),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch recent tracks for review
  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ['recentTracks'],
    queryFn: () => fetch('/api/admin/tracks/recent').then(res => {
      if (!res.ok) throw new Error('Failed to fetch recent tracks');
      return res.json();
    })
  });

  // Create combined content items list
  const allContentItems: ContentItem[] = [
    ...(posts?.map(post => ({ ...post, type: 'post' as const })) || []),
    ...(comments?.map(comment => ({ ...comment, type: 'comment' as const })) || []),
    ...(tracks?.map(track => ({ ...track, type: 'track' as const })) || [])
  ];

  // Mutations for different content types
  const approvePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await fetch(`/api/admin/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unapprovedPosts'] });
      toast({ title: 'Success', description: 'Post approved successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to approve post', 
        variant: 'destructive' 
      });
    }
  });

  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unapprovedComments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] }); // Refresh all posts
      toast({ title: 'Success', description: 'Comment approved successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to approve comment', 
        variant: 'destructive' 
      });
    }
  });

  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await fetch(`/api/admin/comments/${commentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unapprovedComments'] });
      toast({ title: 'Success', description: 'Comment rejected successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to reject comment', 
        variant: 'destructive' 
      });
    }
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      await fetch(`/api/admin/tracks/${trackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTracks'] });
      toast({ title: 'Success', description: 'Track deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to delete track', 
        variant: 'destructive' 
      });
    }
  });

  // Handle approve/reject actions
  const handleApprove = (item: ContentItem) => {
    switch (item.type) {
      case 'post':
        approvePostMutation.mutate(item.id);
        break;
      case 'comment':
        approveCommentMutation.mutate(item.id);
        break;
      default:
        toast({ 
          title: 'Info', 
          description: 'Tracks are approved by default', 
          variant: 'default'
        });
    }
  };

  const handleReject = (item: ContentItem) => {
    switch (item.type) {
      case 'post':
        // We could add a reject post mutation if needed
        toast({ title: 'Info', description: 'Post rejection not implemented yet' });
        break;
      case 'comment':
        rejectCommentMutation.mutate(item.id);
        break;
      case 'track':
        if (confirm('Are you sure you want to delete this track?')) {
          deleteTrackMutation.mutate(item.id);
        }
        break;
    }
  };

  // Handle item view
  const handleViewItem = (item: ContentItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  const isLoading = postsLoading || commentsLoading || tracksLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  const renderContentItems = (items: ContentItem[]) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <p className="text-muted-foreground">No content items to review</p>
          </CardContent>
        </Card>
      );
    }

    return items.map((item) => (
      <Card key={`${item.type}-${item.id}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              {item.type === 'post' && (
                <>
                  <FileText className="h-4 w-4 text-blue-500" />
                  {item.title}
                </>
              )}
              {item.type === 'comment' && (
                <>
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Comment on {item.postTitle || 'Unknown Post'}
                </>
              )}
              {item.type === 'track' && (
                <>
                  <Music className="h-4 w-4 text-purple-500" />
                  {item.title} by {item.artist}
                </>
              )}
            </CardTitle>
            <Badge variant={
              item.type === 'post' ? "default" :
              item.type === 'comment' ? "outline" : "secondary"
            }>
              {item.type}
            </Badge>
          </div>
          <CardDescription>
            {item.type === 'post' && `By ${item.authorName || 'Unknown'} • ${format(new Date(item.createdAt), 'MMM d, yyyy')}`}
            {item.type === 'comment' && `By ${item.authorName || 'Unknown'} • ${format(new Date(item.createdAt), 'MMM d, yyyy')}`}
            {item.type === 'track' && `Uploaded by ${item.uploadedByName || 'Unknown'} • ${format(new Date(item.createdAt), 'MMM d, yyyy')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {item.type === 'post' && <p className="line-clamp-2">{item.content}</p>}
          {item.type === 'comment' && <p className="line-clamp-2">{item.content}</p>}
          {item.type === 'track' && <p className="line-clamp-2">Audio file: {item.audioUrl}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewItem(item)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(item)}
            >
              <X className="mr-2 h-4 w-4" />
              {item.type === 'track' ? 'Delete' : 'Reject'}
            </Button>
            <Button
              size="sm"
              onClick={() => handleApprove(item)}
              disabled={item.type === 'track'} // Tracks don't need approval
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Content ({allContentItems.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts?.length || 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments?.length || 0})</TabsTrigger>
          <TabsTrigger value="tracks">Tracks ({tracks?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {renderContentItems(allContentItems)}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {renderContentItems(posts?.map(post => ({ ...post, type: 'post' as const })) || [])}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {renderContentItems(comments?.map(comment => ({ ...comment, type: 'comment' as const })) || [])}
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          {renderContentItems(tracks?.map(track => ({ ...track, type: 'track' as const })) || [])}
        </TabsContent>
      </Tabs>

      {/* Content view dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'post' && selectedItem.title}
              {selectedItem?.type === 'comment' && `Comment on ${selectedItem.postTitle || 'Unknown Post'}`}
              {selectedItem?.type === 'track' && `${selectedItem.title} by ${selectedItem.artist}`}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.type === 'post' && `By ${selectedItem.authorName || 'Unknown'} • ${new Date(selectedItem.createdAt).toLocaleString()}`}
              {selectedItem?.type === 'comment' && `By ${selectedItem.authorName || 'Unknown'} • ${new Date(selectedItem.createdAt).toLocaleString()}`}
              {selectedItem?.type === 'track' && `Uploaded by ${selectedItem.uploadedByName || 'Unknown'} • ${new Date(selectedItem.createdAt).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedItem?.type === 'post' && (
              <div className="prose prose-sm dark:prose-invert">
                {selectedItem.content}
              </div>
            )}
            {selectedItem?.type === 'comment' && (
              <div className="prose prose-sm dark:prose-invert">
                {selectedItem.content}
              </div>
            )}
            {selectedItem?.type === 'track' && (
              <div className="space-y-4">
                <div className="w-full">
                  <p><strong>Audio URL:</strong> {selectedItem.audioUrl}</p>
                  {selectedItem.audioUrl && (
                    <audio controls className="w-full mt-2">
                      <source src={selectedItem.audioUrl} type="audio/mp3" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedItem && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReject(selectedItem);
                    setViewDialogOpen(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  {selectedItem.type === 'track' ? 'Delete' : 'Reject'}
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(selectedItem);
                    setViewDialogOpen(false);
                  }}
                  disabled={selectedItem.type === 'track'} // Tracks don't need approval
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}