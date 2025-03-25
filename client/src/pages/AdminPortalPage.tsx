
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChartBar, LogOut, Users, FileText, AlertCircle, 
         ShieldCheck, Gauge, RefreshCw, Settings } from "lucide-react";
import { ToDoList } from "@/components/admin/ToDoList";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

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

export default function AdminPortalPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Admin Portal";
  }, []);

  // Fetch admin stats (real data from API)
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          // If API isn't implemented yet, return sample data structure
          return {
            totalUsers: 0,
            pendingReviews: 0,
            systemHealth: "Optimal",
            approvalRate: 0,
            recentActivities: [],
            userRolesDistribution: { user: 0, admin: 0, super_admin: 0 }
          };
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        return {
          totalUsers: 0,
          pendingReviews: 0,
          systemHealth: "Optimal",
          approvalRate: 0,
          recentActivities: [],
          userRolesDistribution: { user: 0, admin: 0, super_admin: 0 }
        };
      }
    },
  });

  // System health calculation (for visual indicator)
  const healthStatus = useMemo(() => {
    if (!adminStats) return { color: "bg-gray-500", status: "Unknown" };
    
    switch (adminStats.systemHealth) {
      case "Optimal":
        return { color: "bg-green-500", status: "Optimal" };
      case "Warning":
        return { color: "bg-yellow-500", status: "Warning" };
      case "Critical":
        return { color: "bg-red-500", status: "Critical" };
      default:
        return { color: "bg-blue-500", status: adminStats.systemHealth };
    }
  }, [adminStats]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="tasks">Admin Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Pending Reviews
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${healthStatus.color}`} />
                    <div className="text-2xl font-bold">{healthStatus.status}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Approval Rate */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Content Approval Rate</CardTitle>
              <CardDescription>Percentage of content approved vs. rejected</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{adminStats?.approvalRate || 0}% Approval</span>
                    <span className="text-sm text-muted-foreground">Target: 80%</span>
                  </div>
                  <Progress value={adminStats?.approvalRate || 0} className="h-2" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>User access levels across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Regular Users</span>
                      <span className="text-sm font-medium">{adminStats?.userRolesDistribution?.user || 0}</span>
                    </div>
                    <Progress value={(adminStats?.userRolesDistribution?.user || 0) / 
                      ((adminStats?.totalUsers || 1) / 100)} className="h-2 bg-gray-200" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Admins</span>
                      <span className="text-sm font-medium">{adminStats?.userRolesDistribution?.admin || 0}</span>
                    </div>
                    <Progress value={(adminStats?.userRolesDistribution?.admin || 0) / 
                      ((adminStats?.totalUsers || 1) / 100)} className="h-2 bg-gray-200" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Super Admins</span>
                      <span className="text-sm font-medium">{adminStats?.userRolesDistribution?.super_admin || 0}</span>
                    </div>
                    <Progress value={(adminStats?.userRolesDistribution?.super_admin || 0) / 
                      ((adminStats?.totalUsers || 1) / 100)} className="h-2 bg-gray-200" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/users">
                    <Button className="w-full">Manage Users</Button>
                  </Link>
                  <Link href="/admin/subscribers">
                    <Button className="w-full" variant="outline">Newsletter Subscribers</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Manage site content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/posts">
                    <Button className="w-full">Manage Posts</Button>
                  </Link>
                  <Link href="/admin/music">
                    <Button className="w-full" variant="outline">Music Library</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation</CardTitle>
                <CardDescription>Review user content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/admin/comments">
                    <Button className="w-full">Review Comments</Button>
                  </Link>
                  <Link href="/admin/reports">
                    <Button className="w-full" variant="outline">Content Reports</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/settings/security">
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

        <TabsContent value="tasks">
          <div className="space-y-8">
            <ToDoList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
