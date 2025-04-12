
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export function WorkflowNotifications() {
  const { toast } = useToast();

  const { data: notifications } = useQuery({
    queryKey: ['workflow-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/workflow');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  useEffect(() => {
    if (notifications?.length) {
      notifications.forEach(notification => {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'approval' ? 'default' : 'destructive'
        });
      });
    }
  }, [notifications]);

  return null; // This is a background component
}
