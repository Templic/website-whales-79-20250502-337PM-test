import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface WorkflowNotification {
  id: number;
  title: string;
  message: string;
  type: 'approval' | 'changes' | 'publish' | 'info';
  contentId: number;
  contentTitle: string;
  createdAt: string;
  isRead: boolean;
}

export function WorkflowNotifications() {
  const { toast } = useToast();

  // Fetch workflow notifications
  const { data: notifications } = useQuery<WorkflowNotification[]>({
    queryKey: ['workflow-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/workflow');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Mark notification as read when clicked
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/workflow/${id}/read`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Show notifications as toasts when they arrive
  useEffect(() => {
    if (notifications?.length) {
      // Filter only unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.isRead);
      
      unreadNotifications.forEach(notification => {
        const variant = notification.type === 'changes' ? 'destructive' : 
                        notification.type === 'approval' ? 'default' : 
                        notification.type === 'publish' ? 'success' : 'default';
        
        toast({
          title: notification.title,
          description: (
            <div className="cursor-pointer" onClick={() => markAsRead(notification.id)}>
              {notification.message}
              <p className="mt-1 text-xs opacity-70">
                Content: {notification.contentTitle}
              </p>
            </div>
          ),
          variant,
        });
      });
    }
  }, [notifications, toast]);

  // This is a background component with no UI
  return null;
}

export default WorkflowNotifications;