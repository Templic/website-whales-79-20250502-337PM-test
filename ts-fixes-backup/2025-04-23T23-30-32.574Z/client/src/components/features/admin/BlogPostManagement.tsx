/**
 * BlogPostManagement.tsx
 * 
 * Component for managing blog posts in the admin portal
 */import React from "react";


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Edit, Check, X, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  published: boolean;
  approved: boolean;
  authorId: number;
  authorName?: string;
  createdAt: string;
  updatedAt?: string;
  featuredImage?: string;
}

export function BlogPostManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all-posts');
  
  // Form state for new/edit post
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    published: false,
  });

  // Fetch all posts
  const { data: allPosts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    queryFn: () => fetch('/api/posts').then(res => {
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    })
  });

  // Fetch unapproved posts (admin only)
  const { data: unapprovedPosts, isLoading: isLoadingUnapproved } = useQuery<Post[]>({
    queryKey: ['/api/admin/posts/unapproved'],
    queryFn: () => fetch('/api/admin/posts/unapproved').then(res => {
      if (!res.ok) throw new Error('Failed to fetch unapproved posts');
      return res.json();
    }),
    enabled: user?.role === 'admin' || user?.role === 'super_admin'
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (post: Omit<Post, 'id' | 'authorId' | 'createdAt' | 'approved'>) => {
      return apiRequest('/api/posts', 'POST', {
        ...post,
        authorId: user?.id || 1, // Default to the first user if somehow not authenticated
        approved: user?.role === 'admin' || user?.role === 'super_admin', // Auto-approve if admin
      });
    },
    onSuccess: () => {
      // Clear form
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        published: false,
      });
      
      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Blog post created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({ id, post }: { id: number, post: Partial<Post> }) => {
      return apiRequest(`/api/posts/${id}`, 'PATCH', post);
    },
    onSuccess: () => {
      // Clear form and editing state
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        published: false,
      });
      setIsEditing(false);
      setEditingPostId(null);
      
      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Blog post updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Approve post mutation
  const approvePostMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/posts/${id}/approve`, 'POST');
    },
    onSuccess: () => {
      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Blog post approved.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/posts/${id}`, 'DELETE');
    },
    onSuccess: () => {
      // Refresh posts list
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts/unapproved'] });
      
      toast({
        title: "Success!",
        description: "Blog post deleted.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission for new/edit post
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingPostId) {
      updatePostMutation.mutate({
        id: editingPostId,
        post: formData
      });
    } else {
      createPostMutation.mutate(formData as any);
    }
  };

  // Handle edit post
  const handleEditPost = (post: Post) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      published: post.published,
    });
    setIsEditing(true);
    setEditingPostId(post.id);
    setActiveTab('new-post');
  };

  // Handle approve post
  const handleApprovePost = (id: number) => {
    if (confirm('Are you sure you want to approve this post?')) {
      approvePostMutation.mutate(id);
    }
  };

  // Handle delete post
  const handleDeletePost = (id: number) => {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deletePostMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all-posts">All Posts</TabsTrigger>
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <TabsTrigger value="pending-approval">
              Pending Approval
              {unapprovedPosts && unapprovedPosts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unapprovedPosts.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="new-post">
            {isEditing ? 'Edit Post' : 'New Post'}
          </TabsTrigger>
        </TabsList>

        {/* All posts tab */}
        <TabsContent value="all-posts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">All Blog Posts</h2>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditingPostId(null);
                setFormData({
                  title: '',
                  excerpt: '',
                  content: '',
                  published: false,
                });
                setActiveTab('new-post');
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Post
            </Button>
          </div>

          {isLoadingPosts ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!allPosts || allPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  allPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.authorName || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {post.published ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                          {!post.approved && (
                            <Badge variant="destructive">Pending Approval</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(post.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'super_admin') && !post.approved && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprovePost(post.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Pending approval tab (admin only) */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <TabsContent value="pending-approval" className="space-y-4">
            <h2 className="text-xl font-bold">Posts Pending Approval</h2>
            
            {isLoadingUnapproved ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !unapprovedPosts || unapprovedPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>No posts pending approval.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {unapprovedPosts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{post.title}</span>
                        <Badge>Pending</Badge>
                      </CardTitle>
                      <CardDescription>
                        {post.authorName || 'Unknown'} • {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-1">Excerpt:</h3>
                        <p className="text-sm text-muted-foreground">{post.excerpt || 'No excerpt'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Content Preview:</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/post/${post.id}`, '_blank')}
                      >
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprovePost(post.id)}
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* New/edit post tab */}
        <TabsContent value="new-post">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Update your blog post details below.' 
                  : user?.role === 'admin' || user?.role === 'super_admin'
                    ? 'Your post will be published immediately.'
                    : 'Your post will be submitted for approval.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (optional)</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={10}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData({...formData, published: checked})}
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        title: '',
                        excerpt: '',
                        content: '',
                        published: false,
                      });
                      setIsEditing(false);
                      setEditingPostId(null);
                      setActiveTab('all-posts');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                  >
                    {createPostMutation.isPending || updatePostMutation.isPending ? (
                      <>Saving...</>
                    ) : isEditing ? (
                      <>Update Post</>
                    ) : (
                      <>Create Post</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BlogPostManagement;