import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Share2,
  ThumbsUp,
  MessageSquare,
  Tag,
  Check,
  X,
  Globe,
  Clock8
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// Interfaces
interface Post {
  id: number;
  title: string;
  content: string;
  author_id: string;
  category: string;
  slug: string;
  cover_image: string;
  published: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

interface Author {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

const BlogPostPage = () => {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  
  // Fetch the post
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<Post>({
    queryKey: ['/api/posts', slug],
    enabled: !!slug,
  });
  
  // Fetch author information
  const { data: author, isLoading: isAuthorLoading } = useQuery<Author>({
    queryKey: ['/api/users', post?.author_id],
    enabled: !!post?.author_id,
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Format reading time
  const calculateReadingTime = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const words = plainText.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // Assuming 200 words per minute
    return readingTime === 1 ? '1 minute' : `${readingTime} minutes`;
  };
  
  // Admin actions
  const togglePostStatus = async (field: 'published' | 'approved', currentValue: boolean) => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      
      if (!response.ok) throw new Error('Failed to update post status');
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts', slug] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: 'Success',
        description: `Post ${field === 'published' ? 'publication' : 'approval'} status updated`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    }
  };
  
  const deletePost = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete post');
      
      // Update cache and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: 'Success',
        description: 'Post has been deleted',
        variant: 'default',
      });
      
      setLocation('/blog');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };
  
  // Navigate to edit post
  const navigateToEditPost = () => {
    if (!post) return;
    setLocation(`/admin/posts/edit/${post.id}`);
  };
  
  // Share post
  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: 'Check out this blog post',
        url: window.location.href,
      }).catch((error) => {
        console.error('Error sharing:', error);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };
  
  // Copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: 'URL Copied',
          description: 'Link has been copied to clipboard',
          variant: 'default',
        });
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Failed to copy link',
          variant: 'destructive',
        });
      });
  };
  
  // Check if a post is accessible to current user
  const isPostAccessible = () => {
    if (!post) return false;
    
    // Admins can see all posts
    if (isAdmin) return true;
    
    // Regular users can only see published and approved posts
    return post.published && post.approved;
  };
  
  // Handle loading state
  if (isPostLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/blog')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
        
        <div className="mb-6 aspect-[16/6] rounded-lg overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="flex gap-3 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-36" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (postError || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/blog')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
        
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-semibold text-red-800 mb-2">Post Not Found</h2>
          <p className="text-red-600">The blog post you're looking for doesn't exist or may have been removed.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setLocation('/blog')}
          >
            Return to Blog
          </Button>
        </div>
      </div>
    );
  }
  
  // Handle unauthorized access
  if (!isPostAccessible()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/blog')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
        
        <div className="text-center py-12 bg-yellow-50 rounded-lg">
          <h2 className="text-2xl font-semibold text-yellow-800 mb-2">Post Not Available</h2>
          <p className="text-yellow-600">
            This post is currently {!post.published ? 'unpublished' : 'pending approval'} and not available for viewing.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setLocation('/blog')}
          >
            Return to Blog
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and admin controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/blog')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
        
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Status badges */}
            <div className="flex items-center gap-2 mr-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={post.published ? "default" : "outline"} className="capitalize">
                      {post.published ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock8 className="h-3 w-3 mr-1" />
                      )}
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{post.published ? 'This post is published' : 'This post is still a draft'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={post.approved ? "default" : "outline"} className="capitalize">
                      {post.approved ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock8 className="h-3 w-3 mr-1" />
                      )}
                      {post.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{post.approved ? 'This post is approved' : 'This post is pending approval'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Admin buttons */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => togglePostStatus('published', post.published)}
              >
                {post.published ? 'Unpublish' : 'Publish'}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => togglePostStatus('approved', post.approved)}
              >
                {post.approved ? 'Unapprove' : 'Approve'}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={navigateToEditPost}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this post
                      and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deletePost}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
      
      {/* Featured image */}
      <div 
        className="w-full h-[40vh] bg-cover bg-center rounded-lg mb-8 relative"
        style={{ backgroundImage: `url(${post.cover_image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="mb-2">{post.category}</Badge>
          <h1 className="text-white text-3xl md:text-4xl font-bold drop-shadow-md">{post.title}</h1>
        </div>
      </div>
      
      {/* Post metadata */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(post.created_at)}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{calculateReadingTime(post.content)} read</span>
          </div>
          
          {author && (
            <div className="flex items-center">
              {author.avatar ? (
                <img 
                  src={author.avatar} 
                  alt={author.name || author.username} 
                  className="h-5 w-5 rounded-full mr-1"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-gray-200 mr-1"></div>
              )}
              <span>By {author.name || author.username}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500"
            onClick={sharePost}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Post content */}
      <article className="prose prose-lg md:prose-xl dark:prose-invert mx-auto max-w-4xl mb-12">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      
      {/* Post footer */}
      <div className="max-w-4xl mx-auto border-t pt-6">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mr-2">
              <Tag className="h-3 w-3 mr-1" /> 
              {post.category}
            </Badge>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setLocation('/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;