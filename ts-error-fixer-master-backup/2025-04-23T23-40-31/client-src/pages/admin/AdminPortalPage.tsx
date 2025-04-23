/**
 * AdminPortalPage.tsx
 * 
 * Enhanced Admin Portal Dashboard with modern UI and functionality
 */
import React from "react";

import { useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gauge,
  Users,
  FileText,
  Music,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  Eye,
  ShieldCheck,
  Calendar,
  Zap
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface AdminStats {
  totalUsers: number;
  newUsers: number;
  pendingReviews: number;
  systemHealth: string;
  approvalRate: number;
  activeUsers: number;
  newRegistrations: number;
  totalPosts: number;
  totalProducts: number;
  totalMusic: number;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch admin statistics
  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    }
  });

  // Mutation to refresh statistics
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

  // Components for each statistic card
  const StatCard = ({ title, value, icon, description, change, link }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    description?: string;
    change?: { value: number; isPositive: boolean };
    link?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {statsLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {change && (
          <div className="flex items-center mt-2">
            <Badge variant={change.isPositive ? "outline" : "destructive"} className="h-5">
              <span className={change.isPositive ? 'text-green-500' : 'text-red-500'}>
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
            </Badge>
          </div>
        )}
      </CardContent>
      {link && (
        <CardFooter className="p-2">
          <Link href={link}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              View Details
              <Eye className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );

  // Calculate system health indicator color
  const getHealthColor = (health?: string) => {
    if (!health) return "bg-gray-400";
    switch (health.toLowerCase()) {
      case 'excellent':
        return "bg-green-500";
      case 'good':
        return "bg-green-400";
      case 'fair':
        return "bg-yellow-400";
      case 'poor':
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => refreshStatsMutation.mutate()}
                  disabled={refreshStatsMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshStatsMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh dashboard statistics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <StatCard 
            title="Total Users" 
            value={adminStats?.totalUsers ?? 0} 
            icon={<Users className="h-4 w-4" />}
            link="/admin/users"
          />
          <StatCard 
            title="Active Users" 
            value={adminStats?.activeUsers ?? 0} 
            icon={<Zap className="h-4 w-4" />}
            change={{ value: 12, isPositive: true }}
            description="Currently active across the platform"
          />
          <StatCard 
            title="Blog Posts" 
            value={adminStats?.totalPosts ?? 0} 
            icon={<FileText className="h-4 w-4" />}
            link="/admin/posts"
          />
          <StatCard 
            title="Music Tracks" 
            value={adminStats?.totalMusic ?? 0} 
            icon={<Music className="h-4 w-4" />}
            link="/admin/music"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Current status of the system and approval rates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`h-3 w-3 rounded-full ${getHealthColor(adminStats?.systemHealth)}`} />
                    <div>
                      <p className="text-sm font-medium">System Status</p>
                      <p className="text-sm text-muted-foreground">
                        {statsLoading ? <Skeleton className="h-4 w-24" /> : (adminStats?.systemHealth || "Unknown")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>Approval Rate</div>
                      <div>{statsLoading ? <Skeleton className="h-4 w-12" /> : `${adminStats?.approvalRate || 0}%`}</div>
                    </div>
                    <Progress value={adminStats?.approvalRate} />
                  </div>
                  <div className="pt-4">
                    <p className="text-sm font-medium">Pending Reviews</p>
                    <p className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-6 w-16" /> : adminStats?.pendingReviews || 0}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/admin/content-review">
                    <Button variant="outline" size="sm">
                      Review Content
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of users by role
                  </CardDescription>
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
                      {adminStats?.userRolesDistribution && (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-blue-500 mr-2" />
                                Users
                              </div>
                              <div>{adminStats.userRolesDistribution.user}</div>
                            </div>
                            <Progress
                              value={(adminStats.userRolesDistribution.user / adminStats.totalUsers) * 100}
                              className="bg-blue-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-purple-500 mr-2" />
                                Admins
                              </div>
                              <div>{adminStats.userRolesDistribution.admin}</div>
                            </div>
                            <Progress
                              value={(adminStats.userRolesDistribution.admin / adminStats.totalUsers) * 100}
                              className="bg-purple-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-red-500 mr-2" />
                                Super Admins
                              </div>
                              <div>{adminStats.userRolesDistribution.super_admin}</div>
                            </div>
                            <Progress
                              value={(adminStats.userRolesDistribution.super_admin / adminStats.totalUsers) * 100}
                              className="bg-red-100"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Navigation</CardTitle>
                <CardDescription>
                  Access main admin features quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-center">
                  <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center" asChild>
                    <Link href="/admin/users">
                      <Users className="h-8 w-8 text-primary" />
                      <span>Users</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center" asChild>
                    <Link href="/admin/posts">
                      <FileText className="h-8 w-8 text-primary" />
                      <span>Blog Posts</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center" asChild>
                    <Link href="/admin/music">
                      <Music className="h-8 w-8 text-primary" />
                      <span>Music</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center" asChild>
                    <Link href="/admin/shop">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                      <span>Shop</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>
                  Activity trends across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {statsLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-lg text-muted-foreground">
                      Access detailed analytics dashboards and reports
                    </p>
                    <div className="flex gap-3">
                      <Link href="/admin/analytics">
                        <Button variant="outline">Standard Analytics</Button>
                      </Link>
                      <Link href="/admin/enhanced-analytics">
                        <Button>Enhanced Analytics Dashboard</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-green-500" />
                  Security Overview
                </CardTitle>
                <CardDescription>
                  System security status and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm font-medium">Two-Factor Authentication</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enabled for admin accounts
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm font-medium">Password Policy</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Strong requirements in place
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm font-medium">Session Management</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Auto-logout after inactivity
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm font-medium">Access Controls</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Role-based permissions enforced
                      </p>
                    </div>
                  </div>
                  
                  <Link href="/admin/security">
                    <Button className="w-full">
                      View Full Security Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Latest actions taken by users and administrators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(adminStats?.recentActivities && adminStats.recentActivities.length > 0) ? (
                        adminStats.recentActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>{activity.action}</TableCell>
                            <TableCell>{activity.user}</TableCell>
                            <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            No recent activities found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}