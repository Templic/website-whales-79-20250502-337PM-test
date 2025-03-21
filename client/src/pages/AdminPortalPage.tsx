import { useAuth } from "@/hooks/use-auth";
import AdminMusicUpload from "@/components/AdminMusicUpload";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Post, Comment } from "@shared/schema";
import { Loader2, Check, X, LogOut, Shield, Settings, Ban, UserPlus, ChartBar, Bell } from "lucide-react";
import { Redirect, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define available roles
const AVAILABLE_ROLES = ['user', 'admin', 'super_admin'] as const;
type UserRole = typeof AVAILABLE_ROLES[number];

// Define types for system settings and analytics
interface SystemSettings {
  enableRegistration: boolean;
  requireEmailVerification: boolean;
  autoApproveContent: boolean;
}

interface AnalyticsData {
  activeUsers: number;
  newRegistrations: number;
  contentReports: number;
  systemHealth: string;
}

export default function AdminPortalPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Define all mutations first
  const promoteUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: UserRole }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to ban user');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User banned successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Success",
        description: "System settings updated successfully"
      });
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments/unapproved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Comment approved successfully"
      });
    }
  });

  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`/api/posts/comments/${commentId}/reject`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reject comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/comments/unapproved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Comment rejected successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject comment",
        variant: "destructive"
      });
    }
  });

  // Define all queries
  const { data: systemSettings = {} as SystemSettings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/admin/settings'],
    enabled: !!user && user.role === 'super_admin'
  });

  const { data: analyticsData = {} as AnalyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: unapprovedPosts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts/unapproved'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  const { data: unapprovedComments = [], isLoading: commentsLoading, error: commentsError } = useQuery<Comment[]>({
    queryKey: ['/api/posts/comments/unapproved'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  // Handle errors
  if (commentsError) {
    console.error('Error loading unapproved comments:', commentsError);
    toast({
      title: "Error",
      description: "Failed to load unapproved comments",
      variant: "destructive"
    });
  }

  // Check auth status
  if (!user || user.role === 'user') {
    return <Redirect to="/" />;
  }

  // Check loading state
  if (usersLoading || postsLoading || commentsLoading || settingsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#00ebd6]">Admin Portal</h1>
        <div className="flex gap-2">
          <Link href="/admin/analytics">
            <Button
              variant="default"
              className="bg-[#00ebd6] text-[#303436] hover:bg-[#00c2b0]"
            >
              <ChartBar className="mr-2 h-4 w-4" />
              Advanced Analytics
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              "Logging out..."
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Analytics Dashboard */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Analytics Overview</h2>
            <Link href="/admin/analytics">
              <Button 
                variant="outline" 
                size="sm"
                className="text-[#00ebd6] border-[#00ebd6] hover:bg-[#00ebd6]/10"
              >
                <ChartBar className="mr-2 h-4 w-4" />
                View Detailed Analytics
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {analyticsData?.activeUsers || 0}
              </p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">New Registrations</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {analyticsData?.newRegistrations || 0}
              </p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">Content Reports</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {analyticsData?.contentReports || 0}
              </p>
            </div>
            <div className="p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
              <p className="text-sm text-gray-400">System Health</p>
              <p className="text-2xl font-bold text-[#00ebd6]">
                {analyticsData?.systemHealth || 'Good'}
              </p>
            </div>
          </div>
        </section>
        {/* Music Upload Section */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <AdminMusicUpload />
        )}
        {/* User Management Section */}
        <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">User Management</h2>
          <div className="space-y-4">
            {users?.map(managedUser => (
              <div key={managedUser.id} className="flex items-center justify-between p-4 bg-[rgba(48,52,54,0.5)] rounded-lg">
                <div>
                  <p className="font-medium">{managedUser.username}</p>
                  <p className="text-sm text-gray-400">{managedUser.email}</p>
                  <p className="text-sm text-[#00ebd6]">Current Role: {managedUser.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'super_admin' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change User Role</DialogTitle>
                          <DialogDescription>
                            Select a new role for {managedUser.username}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {AVAILABLE_ROLES.map(role => (
                            <Button
                              key={role}
                              onClick={() => promoteUserMutation.mutate({ userId: managedUser.id, role })}
                              disabled={managedUser.role === role || promoteUserMutation.isPending}
                              variant={managedUser.role === role ? "secondary" : "outline"}
                              className={managedUser.role === role ? "bg-[#00ebd6]/20" : ""}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                              {managedUser.role === role && " (Current)"}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => banUserMutation.mutate(managedUser.id)}
                    disabled={banUserMutation.isPending}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Settings Section (Super Admin Only) */}
        {user.role === 'super_admin' && (
          <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">System Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable User Registration</Label>
                  <p className="text-sm text-gray-400">Allow new users to register</p>
                </div>
                <Switch
                  checked={systemSettings?.enableRegistration}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ enableRegistration: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-gray-400">Users must verify email before login</p>
                </div>
                <Switch
                  checked={systemSettings?.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ requireEmailVerification: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Content</Label>
                  <p className="text-sm text-gray-400">Skip moderation for trusted users</p>
                </div>
                <Switch
                  checked={systemSettings?.autoApproveContent}
                  onCheckedChange={(checked) =>
                    updateSettingsMutation.mutate({ autoApproveContent: checked })
                  }
                />
              </div>
            </div>
          </section>
        )}

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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveCommentMutation.mutate(comment.id)}
                        disabled={approveCommentMutation.isPending}
                        size="sm"
                        className="bg-[#00ebd6] text-[#303436] hover:bg-[#00ebd6] hover:text-[#303436]"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectCommentMutation.mutate(comment.id)}
                        disabled={rejectCommentMutation.isPending}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}