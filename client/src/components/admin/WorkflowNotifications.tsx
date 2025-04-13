import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCheck, 
  AlertCircle, 
  Info, 
  MessageSquare,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  isRead: boolean;
  contentId?: number;
  contentTitle?: string;
  createdAt: string;
  userId: number;
}

export function WorkflowNotifications() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  });

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    
    // Mark as read if it isn't already
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Get icon by notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Format actual time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'PPpp'); // "Apr 29, 2021, 9:30 AM"
  };

  // Check for scheduled content notifications
  useEffect(() => {
    const scheduledNotifications = notifications.filter(
      n => n.title.includes('Scheduled Content') && !n.isRead
    );
    
    if (scheduledNotifications.length > 0) {
      toast({
        title: "Content Requires Attention",
        description: "You have scheduled content that needs your attention.",
        duration: 5000,
      });
    }
  }, [notifications, toast]);

  return (
    <>
      {/* Notification Bell with Badge */}
      <div className="relative">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs" 
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length === 0 ? (
              <div className="py-4 px-2 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={`flex items-start p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs line-clamp-2 text-muted-foreground">
                        {notification.message}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {notification.contentId && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Content
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                
                {notifications.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    {notifications.length - 10} more notifications...
                  </div>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification?.createdAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-xs text-muted-foreground">
                      {formatRelativeTime(selectedNotification.createdAt)}
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatTime(selectedNotification.createdAt)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">{selectedNotification?.message}</p>
            
            {selectedNotification?.contentTitle && (
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm font-medium">Related Content</div>
                <div className="text-sm mt-1">{selectedNotification.contentTitle}</div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {selectedNotification?.contentId && (
              <Button>
                View Content
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}