/**
 * UserActivityMonitor.tsx
 * 
 * Component for monitoring and displaying user activity logs
 * This is a placeholder that will be implemented with full functionality
 */
import React from 'react';
import { Activity, User, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UserActivityMonitor: React.FC = () => {
  // Sample data for display purposes
  const sampleActivities = [
    {
      id: 1,
      user: "admin",
      action: "User Login",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      ipAddress: "192.168.1.102",
      status: "success"
    },
    {
      id: 2,
      user: "editor",
      action: "Content Updated",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: "192.168.1.105",
      status: "success"
    },
    {
      id: 3,
      user: "unknown",
      action: "Failed Login Attempt",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: "203.0.113.42",
      status: "failed"
    }
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-muted">
        <h3 className="font-semibold mb-2 flex items-center">
          <Activity className="mr-2 h-5 w-5 text-blue-600" />
          User Activity Monitor
        </h3>
        <p className="text-muted-foreground">
          The User Activity Monitor component for tracking and monitoring user activities is currently under development. Check back soon for the full implementation with real-time monitoring features.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleActivities.map(activity => (
              <div key={activity.id} className="p-3 border rounded-md flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {activity.status === 'success' ? (
                      <User className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">User: {activity.user}</p>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>
                <div>
                  <Badge variant={activity.status === 'success' ? 'outline' : 'destructive'}>
                    {activity.status === 'success' ? 'Success' : 'Failed'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{activity.ipAddress}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityMonitor;