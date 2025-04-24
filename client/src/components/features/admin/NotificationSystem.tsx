/**
 * NotificationSystem.tsx
 * 
 * Component for displaying real-time admin notifications
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications data
  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mock notifications for development
  useEffect(() => {
    if (!data && !isLoading) {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Comment',
          message: 'A new comment has been posted that requires approval.',
          type: 'info',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: false,
          link: '/admin/comments'
        },
        {
          id: '2',
          title: 'Security Alert',
          message: 'Multiple failed login attempts detected for admin account.',
          type: 'warning',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          link: '/admin/security'
        },
        {
          id: '3',
          title: 'Order Completed',
          message: 'Order #1089 has been successfully processed and shipped.',
          type: 'success',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          link: '/admin/shop'
        },
        {
          id: '4',
          title: 'Database Backup',
          message: 'Weekly database backup completed successfully.',
          type: 'info',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true
        },
        {
          id: '5',
          title: 'Payment Failed',
          message: 'Payment for order #1092 has failed. Customer notified.',
          type: 'error',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          read: false,
          link: '/admin/shop'
        }
      ];
      
      setNotifications(mockNotifications);
    } else if (data) {
      setNotifications(data);
    }
  }, [data, isLoading]);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 h-5 min-w-[1.25rem] bg-red-500 border-none" 
              variant="default"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px]">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8" 
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  className={cn(
                    "p-0 focus:bg-transparent",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex flex-col w-full px-4 py-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-start gap-2">
                        {getIcon(notification.type)}
                        <span className="font-medium">{notification.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="w-fit p-0 h-auto mt-1 text-xs"
                        onClick={() => {
                          markAsRead(notification.id);
                          window.location.href = notification.link!;
                        }}
                      >
                        View details
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            ))
          )}
        </ScrollArea>
        <div className="p-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.location.href = '/admin/notifications'}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationSystem;