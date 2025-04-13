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
              Minimal test page for debugging routing issues
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="p-4 border rounded bg-blue-50">
              <p>This is a minimal test page to verify routing is working properly.</p>
              <p className="mt-2">The full components will be added once the syntax errors are resolved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}