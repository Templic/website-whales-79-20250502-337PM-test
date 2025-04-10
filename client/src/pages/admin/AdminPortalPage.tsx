/**
 * AdminPortalPage.tsx
 * 
 * Migrated as part of the repository reorganization.
 */
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ChartBar, LogOut, Users, FileText, AlertCircle, ShieldCheck, Gauge, RefreshCw, Settings, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SecurityHealthCheck from "@/components/system/SecurityHealthCheck";
import HealthCheck from "@/components/system/HealthCheck";

interface AdminStats {
  totalUsers: number;
  pendingReviews: number;
  systemHealth: string;
  approvalRate: number;
  recentActivities: Array<{
    id: number;
    action: string;
    timestamp: string;
    user: string;
  }>;
  userRolesDistribution: {
    user: number;
    admin: number;
    super_admin: number;
  };
}

const UserManagementComponent = lazy(() => import('@/components/features/admin/UserManagement'));
const ContentReviewComponent = lazy(() => import('@/components/features/admin/ContentReview'));
const DatabaseMonitorComponent = lazy(() => import('@/components/features/admin/DatabaseMonitor'));
const BlogPostManagementComponent = lazy(() => import('@/components/features/admin/BlogPostManagement'));
const CommentManagementComponent = lazy(() => import('@/components/features/admin/CommentManagement'));
const ShopManagementComponent = lazy(() => import('@/components/features/admin/ShopManagement'));
const EnhancedShopManagementComponent = lazy(() => import('@/components/features/admin/EnhancedShopManagement'));
const NewsletterManagementComponent = lazy(() => import('@/components/features/admin/NewsletterManagement'));

export default function AdminPortalPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: subscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const res = await fetch('/api/subscribers');
      if (!res.ok) throw new Error('Failed to fetch subscribers');
      return res.json();
    },
    enabled: activeTab === 'subscribers',
    staleTime: 0 // Always fetch fresh data
  });

  useEffect(() => {
    if (activeTab === 'subscribers') {
      refetchSubscribers();
    }
  }, [activeTab, refetchSubscribers]);

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: () => fetch('/api/admin/stats').then(res => res.json())
  });

  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onSuccess: () => {
      toast({
        title: "Stats Refreshed",
        description: "Dashboard statistics have been updated"
      });
    }
  });

  const handleUserAction = async (userId: string, action: 'promote' | 'demote' | 'delete' | 'ban' | 'unban') => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Generate success message based on action
      let successMessage = '';
      switch (action) {
        case 'delete':
          successMessage = 'User deleted successfully';
          break;
        case 'ban':
          successMessage = 'User banned successfully';
          break;
        case 'unban':
          successMessage = 'User unbanned successfully';
          break;
        case 'promote':
          successMessage = 'User promoted successfully';
          break;
        case 'demote':
          successMessage = 'User demoted successfully';
          break;
      }

      toast({
        title: 'User Action Success',
        description: successMessage
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: `Could not ${action} user`,
        variant: 'destructive'
      });
    }
  };

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const healthStatus = useMemo(() => {
    if (!adminStats) return { color: "bg-gray-500", status: "Unknown" };
    switch (adminStats.systemHealth) {
      case "Optimal": return { color: "bg-green-500", status: "Optimal" };
      case "Warning": return { color: "bg-yellow-500", status: "Warning" };
      case "Critical": return { color: "bg-red-500", status: "Critical" };
      default: return { color: "bg-blue-500", status: adminStats.systemHealth };
    }
  }, [adminStats]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#00ebd6]">Admin Portal</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStatsMutation.mutate()}
            disabled={refreshStatsMutation.isPending}
            className="text-[#00ebd6] border-[#00ebd6] hover:bg-[#00ebd620]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshStatsMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
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
            disabled={logoutMutation.isLoading}
          >
            {logoutMutation.isLoading ? (
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status</span>
                <Badge variant={statsLoading ? "outline" : "default"}>
                  {statsLoading ? "Loading..." : adminStats?.systemHealth || "Unknown"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Approval Rate</span>
                <span>{adminStats?.approvalRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Pending Reviews</span>
                <Badge variant="outline">{adminStats?.pendingReviews || 0}</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("content")}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                Manage Content
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Users</span>
                <span>{adminStats?.userRolesDistribution?.user || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Admins</span>
                <span>{adminStats?.userRolesDistribution?.admin || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Super Admins</span>
                <span>{adminStats?.userRolesDistribution?.super_admin || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="content">Content Review</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="subscribers">Newsletter</TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-1" /> Security
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{adminStats?.totalUsers || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{adminStats?.pendingReviews || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${healthStatus.color}`}>
                  {healthStatus.status}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))
                ) : (
                  adminStats?.recentActivities.map(activity => (
                    <div key={activity.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.user}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <UserManagementComponent onAction={handleUserAction} />
          </Suspense>
        </TabsContent>

        <TabsContent value="content">
          <Tabs defaultValue="posts" className="mb-6">
            <TabsList>
              <TabsTrigger value="posts">Blog Posts</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="review">Content Review</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <BlogPostManagementComponent />
              </Suspense>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <CommentManagementComponent />
              </Suspense>
            </TabsContent>

            <TabsContent value="review" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <ContentReviewComponent />
              </Suspense>
            </TabsContent>

            <TabsContent value="shop" className="mt-4">
              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <EnhancedShopManagementComponent />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="database">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <DatabaseMonitorComponent />
          </Suspense>
        </TabsContent>

        <TabsContent value="subscribers">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <NewsletterManagementComponent />
          </Suspense>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Security Status
                </CardTitle>
                <CardDescription>
                  Overview of application security measures and their statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityHealthCheck />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Current health status of the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthCheck />
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Management</CardTitle>
                <CardDescription>Access detailed security configurations and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/security">
                  <Button className="w-full" variant="default">
                    <Shield className="mr-2 h-4 w-4" />
                    Advanced Security Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/security">
                  <Button className="w-full" variant="outline">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Security
                  </Button>
                </Link>
                <Link href="/admin/settings/notifications">
                  <Button className="w-full" variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </Link>
                <Link href="/admin/settings/general">
                  <Button className="w-full" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    General Config
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}