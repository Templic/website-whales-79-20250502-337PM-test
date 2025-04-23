/**
 * NewsletterManagementPage.tsx
 * 
 * Advanced newsletter management page for admin users
 */
import { Suspense } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import NewsletterManagement from "@/components/features/admin/NewsletterManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, Users, Send, FileText, 
  BarChart2, Calendar, Settings 
} from "lucide-react";

export default function NewsletterManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Management</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Newsletter System</CardTitle>
            <CardDescription>
              Create, schedule, and manage newsletters and subscribers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Use this dashboard to create newsletters, manage your subscribers, schedule sends, and view analytics on your email campaigns.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="flex items-center py-3">
              <Mail className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="flex items-center py-3">
              <Users className="mr-2 h-4 w-4" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center py-3">
              <Send className="mr-2 h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center py-3">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center py-3">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <NewsletterManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="subscribers" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <NewsletterManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="mr-2 h-5 w-5" />
                  Email Campaigns
                </CardTitle>
                <CardDescription>
                  Create, schedule, and monitor email campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Campaigns</p>
                        <h3 className="text-2xl font-bold">2</h3>
                      </div>
                      <Send className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                        <h3 className="text-2xl font-bold">3</h3>
                      </div>
                      <Calendar className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <h3 className="text-2xl font-bold">12</h3>
                      </div>
                      <BarChart2 className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground">
                  Advanced campaign management features are currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Create and manage reusable email templates
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Email Templates system is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Newsletter Analytics
                </CardTitle>
                <CardDescription>
                  View statistics on email open rates, click rates, and subscriber engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Newsletter Analytics dashboard is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}