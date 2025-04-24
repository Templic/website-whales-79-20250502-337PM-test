/**
 * CommentsManagementPage.tsx
 * 
 * Page for managing and moderating comments for admin users
 */import React from "react";

import { Suspense } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { CommentManagement } from "@/components/features/admin/CommentManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, CheckCircle, AlertCircle, 
  MessageCircle, Users, Flag, BarChart2, Settings 
} from "lucide-react";

export default function CommentsManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Comments Management</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Review and moderate comments across your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Use this dashboard to approve or reject user comments, filter spam, and manage interactions throughout your platform.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto">
            <TabsTrigger value="pending" className="flex items-center py-3">
              <AlertCircle className="mr-2 h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center py-3">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center py-3">
              <Flag className="mr-2 h-4 w-4" />
              Flagged
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center py-3">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <CommentManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Approved Comments
                </CardTitle>
                <CardDescription>
                  View all approved comments with options to filter by post or user
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Approved Comments view is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="mr-2 h-5 w-5" />
                  Flagged Comments
                </CardTitle>
                <CardDescription>
                  Review comments flagged by users or automated moderation
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Flagged Comments system is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Comment Analytics
                </CardTitle>
                <CardDescription>
                  View statistics about comment volume, approval rates, and user engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Comments</p>
                        <h3 className="text-2xl font-bold">243</h3>
                      </div>
                      <MessageSquare className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Approval Rate</p>
                        <h3 className="text-2xl font-bold">87%</h3>
                      </div>
                      <CheckCircle className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Unique Commenters</p>
                        <h3 className="text-2xl font-bold">128</h3>
                      </div>
                      <Users className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground">
                  Detailed comment analytics are currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}