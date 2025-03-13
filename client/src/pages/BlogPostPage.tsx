import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Post, Comment, insertCommentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const postId = parseInt(id);

  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ['/api/posts', postId],
    enabled: !isNaN(postId)
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['/api/posts', postId, 'comments'],
    enabled: !isNaN(postId)
  });

  const form = useForm({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: {
      content: "",
      authorName: "",
      authorEmail: "",
      postId
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to post comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'comments'] });
      toast({
        title: "Success",
        description: "Your comment has been submitted for review"
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
  });

  if (postLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-[rgba(10,50,92,0.6)] rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-[rgba(10,50,92,0.6)] rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-[rgba(10,50,92,0.6)] rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">{post.title}</h1>
        <div className="flex items-center text-sm text-gray-400 mb-8">
          <time>{new Date(post.createdAt).toLocaleDateString()}</time>
        </div>
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-[400px] object-cover rounded-xl mb-8"
          />
        )}
        <div className="prose prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-8">Comments</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => commentMutation.mutate(data))} className="space-y-6 mb-12">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                {...form.register("authorName")}
                className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                {...form.register("authorEmail")}
                type="email"
                className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                {...form.register("content")}
                className="bg-[rgba(48,52,54,0.5)] border-[#00ebd6] min-h-[100px]"
                placeholder="Share your thoughts..."
              />
            </div>

            <Button 
              type="submit"
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
              disabled={commentMutation.isPending}
            >
              {commentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        </Form>

        <div className="space-y-8">
          {commentsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl animate-pulse">
                <div className="h-4 bg-[rgba(48,52,54,0.5)] rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-[rgba(48,52,54,0.5)] rounded w-full"></div>
              </div>
            ))
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">{comment.authorName}</span>
                  <time className="text-sm text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p>{comment.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </section>
    </div>
  );
}
