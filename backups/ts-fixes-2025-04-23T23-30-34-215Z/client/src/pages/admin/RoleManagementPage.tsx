/**
 * RoleManagementPage.tsx
 * 
 * Admin page for managing user roles and permissions
 */
import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { RoleManagement } from "@/components/features/admin";

export default function RoleManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        </div>
        
        <RoleManagement />
      </div>
    </AdminLayout>
  );
}