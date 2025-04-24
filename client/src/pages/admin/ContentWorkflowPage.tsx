/**
 * ContentWorkflowPage.tsx
 * 
 * Advanced content workflow management page for admin users
 */
import { Suspense } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { WorkflowManagement } from "@/components/features/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContentWorkflowPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Content Workflow</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Content Workflow Management</CardTitle>
            <CardDescription>
              Manage content through its lifecycle from draft to publication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Use this dashboard to review, approve, or request changes to content before it's published.
              You can also schedule publication and set expiration dates for time-sensitive content.
            </p>
          </CardContent>
        </Card>
        
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
          <WorkflowManagement />
        </Suspense>
      </div>
    </AdminLayout>
  );
}