/**
 * ContentSchedulerPage.tsx
 * 
 * Admin page for scheduling content publication and expiration
 */
import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ContentScheduler } from "@/components/features/admin";

export default function ContentSchedulerPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Content Scheduler</h1>
        </div>
        
        <ContentScheduler />
      </div>
    </AdminLayout>
  );
}