/**
 * PostsPage.tsx
 * 
 * Enhanced Blog Post Management for the Admin Portal
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreHorizontal,
  PlusCircle,
  RefreshCw,
  FileEdit,
  Trash2,
  Eye,
  Check,
  X,
  Calendar,
  Tag,
  Filter
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  published: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string | null;
  authorId: number;
  author?: {
    username: string;
    email: string;
  };
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export default function PostsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDetailsOpen, setIsPostDetailsOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const postsPerPage = 10;

  // Fetch posts
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    }
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  // Toggle publish state mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ postId, published }: { postId: number; published: boolean }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: published ? 'publish' : 'unpublish' })
      });
      if (!res.ok) throw new Error(`Failed to ${published ? 'publish' : 'unpublish'} post`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: variables.published ? "Post Published" : "Post Unpublished",
        description: `Post has been ${variables.published ? 'published' : 'unpublished'} successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update post status',
        variant: "destructive"
      });
    }
  });

  // Toggle approval state mutation
  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ postId, approved }: { postId: number; approved: boolean }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: approved ? 'approve' : 'unapprove' })
      });
      if (!res.ok) throw new Error(`Failed to ${approved ? 'approve' : 'unapprove'} post`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: variables.approved ? "Post Approved" : "Post Unapproved",
        description: `Post has been ${variables.approved ? 'approved' : 'unapproved'} successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update approval status',
        variant: "destructive"
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsDeleteConfirmOpen(false);
      toast({
        title: "Post Deleted",
        description: "The post has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: "destructive"
      });
    }
  });

  // Filter posts based on search query and filters
  const filteredPosts = posts?.filter(post => {
    const matchesSearch = 
      searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" 
      || (statusFilter === "published" && post.published)
      || (statusFilter === "draft" && !post.published)
      || (statusFilter === "approved" && post.approved)
      || (statusFilter === "pending" && !post.approved);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Paginate posts
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Total pages for pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // View post details
  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setIsPostDetailsOpen(true);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setIsNewPostModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Manage Posts</CardTitle>
            <CardDescription>
              Create, edit, and manage blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search posts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center w-full md:w-auto gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPosts.length > 0 ? (
                        paginatedPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {post.featuredImage ? (
                                  <div className="h-10 w-10 rounded-md bg-muted overflow-hidden">
                                    <img 
                                      src={post.featuredImage} 
                                      alt={post.title} 
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                    <FileEdit className="h-5 w-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{post.title}</div>
                                  {post.excerpt && (
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {post.excerpt}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={post.published ? "default" : "outline"}>
                                  {post.published ? "Published" : "Draft"}
                                </Badge>
                                {post.published && (
                                  <Badge 
                                    variant={post.approved ? "outline" : "destructive"} 
                                    className={post.approved ? "mt-1 bg-green-100 text-green-800 border-green-200" : "mt-1"}
                                  >
                                    {post.approved ? "Approved" : "Pending"}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.author ? post.author.username : `User ID: ${post.authorId}`}
                            </TableCell>
                            <TableCell>
                              {formatDate(post.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewPost(post)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`/blog/${post.id}`, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileEdit className="h-4 w-4 mr-2" />
                                    Edit Post
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => togglePublishMutation.mutate({ 
                                      postId: post.id, 
                                      published: !post.published 
                                    })}
                                  >
                                    {post.published ? (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Unpublish
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Publish
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {post.published && (
                                    <DropdownMenuItem 
                                      onClick={() => toggleApprovalMutation.mutate({ 
                                        postId: post.id, 
                                        approved: !post.approved 
                                      })}
                                    >
                                      {post.approved ? (
                                        <>
                                          <X className="h-4 w-4 mr-2" />
                                          Unapprove
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-4 w-4 mr-2" />
                                          Approve
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setIsDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No posts found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Post details dialog */}
        <Dialog open={isPostDetailsOpen} onOpenChange={setIsPostDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            {selectedPost && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedPost.title}</DialogTitle>
                  <DialogDescription>
                    Post details and content preview
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  {selectedPost.featuredImage && (
                    <div className="rounded-md overflow-hidden h-[200px] bg-muted">
                      <img 
                        src={selectedPost.featuredImage} 
                        alt={selectedPost.title} 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Created:</span>
                        <span className="text-sm">{formatDate(selectedPost.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Updated:</span>
                        <span className="text-sm">{formatDate(selectedPost.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="published">Published:</Label>
                      <Switch 
                        id="published"
                        checked={selectedPost.published}
                        onCheckedChange={(checked) => {
                          togglePublishMutation.mutate({
                            postId: selectedPost.id,
                            published: checked
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Label htmlFor="approved">Approved:</Label>
                      <Switch 
                        id="approved"
                        checked={selectedPost.approved}
                        onCheckedChange={(checked) => {
                          toggleApprovalMutation.mutate({
                            postId: selectedPost.id,
                            approved: checked
                          });
                        }}
                      />
                    </div>
                  </div>
                  
                  {selectedPost.categories && selectedPost.categories.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Categories:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPost.categories.map(category => (
                          <Badge key={category.id} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Content Preview:</Label>
                    <div className="mt-2 p-4 rounded-md border bg-muted/50 h-[200px] overflow-y-auto">
                      <div className="text-sm whitespace-pre-wrap">
                        {selectedPost.content}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsPostDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  <Button>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Edit Post
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedPost && deletePostMutation.mutate(selectedPost.id)}
                disabled={deletePostMutation.isPending}
              >
                {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New post dialog */}
        <Dialog open={isNewPostModalOpen} onOpenChange={setIsNewPostModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Create a new blog post. Fill out the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter post title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" placeholder="Brief summary of the post" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content" 
                  placeholder="Post content" 
                  className="min-h-[200px]"
                />
              </div>
              <div className="grid gap-2">
                <Label>Categories</Label>
                {/* Category selection would go here */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="publish" />
                  <Label htmlFor="publish">Publish immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-approve" />
                  <Label htmlFor="auto-approve">Auto-approve</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsNewPostModalOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button>Create Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}