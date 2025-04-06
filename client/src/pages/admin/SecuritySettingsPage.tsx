import React from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SecurityDashboard from '@/components/admin/SecurityDashboard';

/**
 * SecuritySettingsPage.tsx
 * 
 * Security dashboard and settings management for administrators
 */
export default function SecuritySettingsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Page title would normally go here */}
      
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin">Admin Portal</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Security Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Portal
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Security Management</h1>
        </div>
        
        <Separator />
        
        <SecurityDashboard />
      </div>
    </div>
  );
}