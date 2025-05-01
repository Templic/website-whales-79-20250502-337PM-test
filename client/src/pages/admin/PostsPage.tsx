import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import {
  Edit,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Eye,
  AlertCircle,
  Check,
  X,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Post type
interface Post {
  id: number;
  title: string;
  content: string;
  authorId: string;
  category: string;
  slug: string;
  coverImage: string;
  published: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  publishDate?: string;
  expiryDate?: string;
}

// Author type
interface Author {
  id: string;
  username: string;
  name?: string;
}

const PostsPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  
  // Fetch posts
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });
  
  // Filter posts based on filter and search term
  const filteredPosts = React.useMemo(() => {
    if (!posts) return [];
    
    return posts.filter(post => {
      // Filter by status
      const statusMatch = selectedFilter === 'all' ||
        (selectedFilter === 'published' && post.published) ||
        (selectedFilter === 'drafts' && !post.published) ||
        (selectedFilter === 'pending' && post.published && !post.approved);
      
      // Filter by search term
      const searchMatch = searchTerm === '' ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      return statusMatch && searchMatch;
    });
  }, [posts, selectedFilter, searchTerm]);
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Get post status
  const getPostStatus = (post: Post) => {
    if (!post.published) return 'Draft';
    if (!post.approved) return 'Pending';
    return 'Published';
  };
  
  // Handle post selection
  const togglePostSelection = (postId: number) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };
  
  // Select/deselect all posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id));
    }
  };
  
  // Handle post deletion
  const deletePost = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      return postId;
    },
    onSuccess: (postId) => {
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Remove from selected posts
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    }
  });
  
  // Bulk delete posts
  const bulkDeletePosts = useMutation({
    mutationFn: async (postIds: number[]) => {
      // In a real app, this would be a single API call
      // For now, we'll delete posts one by one
      await Promise.all(
        postIds.map(postId => 
          fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' })
        )
      );
      
      return postIds;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${selectedPosts.length} posts deleted successfully`,
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Clear selected posts
      setSelectedPosts([]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete posts',
        variant: 'destructive',
      });
    }
  });
  
  // Toggle post status (published/approved)
  const togglePostStatus = useMutation({
    mutationFn: async ({ postId, field, value }: { postId: number; field: 'published' | 'approved'; value: boolean }) => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update post status');
      }
      
      return { postId, field, value };
    },
    onSuccess: ({ field, value }) => {
      toast({
        title: 'Success',
        description: `Post ${field === 'published' ? 'publication' : 'approval'} status updated`,
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post status',
        variant: 'destructive',
      });
    }
  });
  
  // Navigate to edit post
  const navigateToEditPost = (postId: number) => {
    setLocation(`/admin/posts/edit/${postId}`);
  };
  
  // Navigate to view post
  const navigateToViewPost = (slug: string) => {
    setLocation(`/blog/${slug}`);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
              <Skeleton className="h-10 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-6/12" />
                  <Skeleton className="h-6 w-2/12" />
                  <Skeleton className="h-6 w-2/12" />
                  <Skeleton className="h-6 w-2/12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Posts
            </CardTitle>
            <CardDescription className="text-red-600">
              There was a problem loading the posts. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/posts'] })}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage all blog posts</p>
        </div>
        
        <Button onClick={() => setLocation('/admin/posts/new')} className="flex items-center gap-1.5">
          <Plus size={16} />
          New Post
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full md:w-auto">
              <Tabs 
                value={selectedFilter} 
                onValueChange={setSelectedFilter}
                className="w-full"
              >
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {selectedPosts.length > 0 && (
            <div className="bg-muted/30 mb-4 p-2 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  {selectedPosts.length} {selectedPosts.length === 1 ? 'post' : 'posts'} selected
                </span>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the {selectedPosts.length} selected 
                      {selectedPosts.length === 1 ? ' post' : ' posts'}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => bulkDeletePosts.mutate(selectedPosts)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-md">
              <p className="text-muted-foreground">No posts found.</p>
              <Button 
                variant="link" 
                onClick={() => setLocation('/admin/posts/new')}
                className="mt-2"
              >
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={
                          filteredPosts.length > 0 && 
                          selectedPosts.length === filteredPosts.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPosts.includes(post.id)}
                          onCheckedChange={() => togglePostSelection(post.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            post.published && post.approved 
                              ? "default" 
                              : post.published 
                                ? "warning" 
                                : "secondary"
                          }
                          className="flex w-fit items-center gap-1"
                        >
                          {post.published && post.approved && <Check className="h-3 w-3" />}
                          {post.published && !post.approved && <AlertCircle className="h-3 w-3" />}
                          {!post.published && <X className="h-3 w-3" />}
                          {getPostStatus(post)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          <span className="text-sm">{formatDate(post.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigateToViewPost(post.slug)}
                            title="View Post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigateToEditPost(post.id)}
                            title="Edit Post"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" title="More Options">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigateToEditPost(post.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigateToViewPost(post.slug)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {post.published ? (
                                <DropdownMenuItem 
                                  onClick={() => togglePostStatus.mutate({
                                    postId: post.id,
                                    field: 'published',
                                    value: false
                                  })}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Unpublish
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => togglePostStatus.mutate({
                                    postId: post.id,
                                    field: 'published',
                                    value: true
                                  })}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {post.approved ? (
                                <DropdownMenuItem 
                                  onClick={() => togglePostStatus.mutate({
                                    postId: post.id,
                                    field: 'approved',
                                    value: false
                                  })}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Unapprove
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => togglePostStatus.mutate({
                                    postId: post.id,
                                    field: 'approved',
                                    value: true
                                  })}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this post.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePost.mutate(post.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {posts?.length || 0} posts
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostsPage;