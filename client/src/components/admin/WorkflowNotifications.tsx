import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export function WorkflowNotifications() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Workflow Notifications
        </CardTitle>
        <CardDescription>
          Recent activity, scheduled content, and upcoming expirations
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          Loading notifications...
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          0 total notifications
        </div>
      </CardFooter>
    </Card>
  );
}