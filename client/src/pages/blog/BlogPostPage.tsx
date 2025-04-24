/**
 * BlogPostPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Post, Comment, insertCommentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDisplayDate } from "@/lib/date-utils";
import { useEffect } from "react";
import { z } from "zod";

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const postId = parseInt(id);
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Log query process for debugging
  useEffect(() => {
    console.log("Fetching blog post with ID:", postId);
  }, [postId]);

  const { data: post, isLoading: postLoading, error: postError } = useQuery<Post>({
    queryKey: ['/api/posts', postId],
    queryFn: async () => {
      if (isNaN(postId)) {
        throw new Error('Invalid post ID');
      }
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !isNaN(postId)
  });

  // Fetch comments - for admins, this will include unapproved comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/posts', postId, 'comments'],
    enabled: !isNaN(postId),
    queryFn: async () => {
      console.log(`Fetching comments for post ID: ${postId}`);
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      console.log(`Received ${data.length} comments:`, data);
      return data;
    }
  });

  const form = useForm({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: {
      content: "",
      authorName: "",
      authorEmail: "",
      postId,
      approved: false
    }
  });

  // Define the comment input type
  type CommentInput = z.infer<typeof insertCommentSchema>;

  const commentMutation = useMutation({
    mutationFn: async (data: CommentInput) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to post comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
      toast({
        title: "Comment Submitted",
        description: "Your comment has been submitted and will be visible after approval by a moderator."
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Comment submission error:", error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse" role="status">
        <div className="h-8 bg-[rgba(10,50,92,0.6)] rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-[rgba(10,50,92,0.6)] rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-[rgba(10,50,92,0.6)] rounded w-full"></div>
          ))}
        </div>
        <span className="sr-only">Loading blog post...</span>
      </div>
    );
  }

  if (postError || !post) {
    toast({
      title: "Error",
      description: "Failed to load blog post",
      variant: "destructive"
    });
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Error Loading Post</h1>
        <p>We encountered an error while loading this post. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-8" 
        onClick={() => navigate('/blog')}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mr-2"
        >
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Blog
      </Button>

      <article className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">{post.title}</h1>
        <div className="flex items-center text-sm text-gray-400 mb-8">
          <time dateTime={post.createdAt ? post.createdAt.toString() : ''}>
            {formatDisplayDate(post.createdAt ? post.createdAt.toString() : null)}
          </time>
        </div>

        {/* Featured image in octagon container with cosmic glow */}
        {post.featuredImage && (
          <div className="clip-path-octagon overflow-hidden w-full max-w-2xl mx-auto mb-8 aspect-video cosmic-glow-effect">
            <img
              src={post.featuredImage}
              alt={`Featured image for ${post.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content in octagon container with clip and mask to ensure content stays within boundaries */}
        <div className="relative mb-12 clip-path-octagon overflow-hidden">
          {/* Background with border */}
          <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] backdrop-blur-sm border-2 border-[#00ebd6]/30"></div>
          
          {/* Content container with internal padding to keep text away from edges */}
          <div className="relative z-10 p-8 md:p-12">
            {/* Using a constrained width container inside the octagon */}
            <div className="prose prose-invert max-w-none text-lg mx-auto" style={{ width: '90%' }}>
              {post.content ? (
                post.content
                  .replace(/<p>/g, '')
                  .replace(/<\/p>/g, '\n\n')
                  .replace(/<br\s*\/?>/g, '\n')
                  .replace(/<div>/g, '')
                  .replace(/<\/div>/g, '\n\n')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
                  .split('\n\n')
                  .filter(para => para.trim().length > 0) // Filter out empty paragraphs
                  .map((paragraph, index) => (
                    <p key={index} className="mb-4 text-center">{paragraph.trim()}</p>
                  ))
              ) : (
                <>
                  <p className="mb-4 text-center">
                    As I embarked on my cosmic journey through the universe of sound, I found myself drawn to the ethereal qualities of music that transcends traditional boundaries. Working with artists from across the galaxy has opened my mind to new dimensions of creativity.
                  </p>
                  <p className="mb-4 text-center">
                    The latest tracks I've been developing blend elements of astral jazz with quantum electronic pulses, creating a soundscape that hopefully transports listeners to unexplored regions of consciousness.
                  </p>
                  <p className="mb-4 text-center">
                    My collaboration with the Neptune Symphony Orchestra has been particularly enlightening. Their ability to capture the harmonic resonance of deep space in acoustic form complements my digital explorations perfectly.
                  </p>
                  <p className="mb-4 text-center">
                    Stay tuned for more sonic adventures as we continue to push the boundaries of what's possible in this musical universe. The journey has just begun, and I'm excited to share it with all of you.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </article>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-8">Comments</h2>

        {/* Comment form in an octagon container with proper clipping */}
        <div className="relative mb-16 clip-path-octagon overflow-hidden">
          <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] backdrop-blur-sm border-2 border-[#00ebd6]/30"></div>
          <div className="relative z-10 p-8">
            {/* Centered content with constrained width */}
            <div className="max-w-[85%] mx-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(data => commentMutation.mutate(data))} className="space-y-6">
                  <div>
                    <label htmlFor="authorName" className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      id="authorName"
                      {...form.register("authorName")}
                      className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                      placeholder="Your name"
                      aria-label="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="authorEmail" className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      id="authorEmail"
                      {...form.register("authorEmail")}
                      type="email"
                      className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                      placeholder="your@email.com"
                      aria-label="Your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-2">Comment</label>
                    <Textarea
                      id="content"
                      {...form.register("content")}
                      className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6] min-h-[100px]"
                      placeholder="Share your thoughts..."
                      aria-label="Your comment"
                    />
                  </div>

                  <div className="text-center">
                    <Button 
                      type="submit"
                      className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white cosmic-hover-glow"
                      disabled={commentMutation.isPending}
                      aria-busy={commentMutation.isPending}
                    >
                      {commentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {commentsLoading ? (
            <div role="status" className="animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative h-[100px] mb-8">
                  <div className="absolute inset-0 bg-[rgba(10,50,92,0.6)] clip-path-octagon"></div>
                  <div className="relative z-10 p-6">
                    <div className="h-4 bg-[rgba(48,52,54,0.5)] rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-[rgba(48,52,54,0.5)] rounded w-full"></div>
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading comments...</span>
            </div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="relative mb-8 clip-path-octagon overflow-hidden">
                <div className="absolute inset-0 bg-[rgba(10,50,92,0.6)] border-2 border-[#00ebd6]/20"></div>
                <div className="relative z-10 p-6">
                  {/* Constrained width wrapper for content */}
                  <div className="max-w-[90%] mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">{comment.authorName}</span>
                      <time dateTime={comment.createdAt ? comment.createdAt.toString() : ''} className="text-sm">
                        {formatDisplayDate(comment.createdAt ? comment.createdAt.toString() : null)}
                      </time>
                    </div>
                    {/* Adding text center alignment for better containment */}
                    <p className="text-center">{comment.content}</p>
                    <div className="text-center mt-2">
                      {comment.approved ? (
                        <span className="text-green-500 text-xs inline-block">Approved</span>
                      ) : (
                        <span className="text-red-500 text-xs inline-block">Pending Approval</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="relative py-12">
              <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] clip-path-octagon"></div>
              <div className="relative z-10 p-6 text-center">
                <p className="text-gray-300">No approved comments yet. Be the first to comment!</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}