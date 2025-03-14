import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Post, Comment } from "@shared/schema";
import { Loader2, Check } from "lucide-react";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect non-admin users
  if (!user || user.role === 'user') {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin'
  });

  const { data: unapprovedPosts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts/unapproved'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin'
  });

  const { data: unapprovedComments = [], isLoading: commentsLoading, error: commentsError } = useQuery<Comment[]>({
    queryKey: ['/api/posts/comments/unapproved'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
    retry: 1
  });

  if (commentsError) {
    console.error('Error loading unapproved comments:', commentsError);
    toast({
      title: "Error",
      description: "Failed to load unapproved comments",
      variant: "destructive"
    });
  }

  const approvePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to approve post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/unapproved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Post approved successfully"
      });
    }
  });

  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`/api/posts/comments/${commentId}/approve`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to approve comment');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both the unapproved comments list and the comments for all posts
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments/unapproved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Comment approved successfully"
      });
    }
  });

  if (usersLoading || postsLoading || commentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-[#00ebd6] mb-8">Admin Portal</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Content Moderation Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Content Moderation</h2>

          {/* Unapproved Posts */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Pending Posts</h3>
            {!unapprovedPosts?.length ? (
              <p className="text-gray-400">No posts pending approval</p>
            ) : (
              <div className="space-y-4">
                {unapprovedPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => approvePostMutation.mutate(post.id)}
                      disabled={approvePostMutation.isPending}
                      size="sm"
                      className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unapproved Comments */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Pending Comments</h3>
            {unapprovedComments.length === 0 ? (
              <p className="text-gray-400">No comments pending approval</p>
            ) : (
              <div className="space-y-4">
                {unapprovedComments.map(comment => (
                  <div key={comment.id} className="flex items-center justify-between p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
                    <div>
                      <p className="font-medium">{comment.authorName}</p>
                      <p className="text-sm text-gray-400 mb-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <Button
                      onClick={() => approveCommentMutation.mutate(comment.id)}
                      disabled={approveCommentMutation.isPending}
                      size="sm"
                      className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <div className="space-y-4">
            {users?.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-sm rounded bg-[rgba(0,235,214,0.2)] text-[#00ebd6]">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analytics Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-[#00ebd6]">{users?.length || 0}</p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {users?.filter(u => u.role !== 'user').length || 0}
              </p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Pending Posts</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {unapprovedPosts?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Pending Comments</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {unapprovedComments?.length || 0}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}