import React from 'react';
import { Helmet } from 'react-helmet';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { WorkflowNotifications } from '@/components/admin/WorkflowNotifications';

export default function WorkflowTestPage() {
  return (
    <AdminLayout>
      <Helmet>
        <title>Workflow Test | Admin Portal</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Workflow Test Page</h1>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Workflow Components Test
            </CardTitle>
            <CardDescription>
              Testing if workflow components render correctly
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">Notifications Component</h2>
                <WorkflowNotifications />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}