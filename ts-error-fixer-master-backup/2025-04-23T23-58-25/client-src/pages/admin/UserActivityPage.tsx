/**
 * UserActivityPage.tsx
 * 
 * Admin page for monitoring user activity and detecting unusual behavior
 */
import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { UserActivityMonitor } from "@/components/features/admin";

export default function UserActivityPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Activity Monitor</h1>
        </div>
        
        <UserActivityMonitor />
      </div>
    </AdminLayout>
  );
}