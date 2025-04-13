import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Bell, BellOff, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

// Types
interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  relatedItemId: number | null;
  relatedItemType: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreferences {
  contentApproval: boolean;
  contentPublished: boolean;
  contentExpiring: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Notification card component
const NotificationCard = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification,
  onMarkAsRead: (id: number) => void
}) => {
  // Type-based styling
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'approval_request':
        return "border-l-4 border-amber-500";
      case 'content_approved':
        return "border-l-4 border-green-500";
      case 'content_rejected':
        return "border-l-4 border-red-500";
      case 'content_published':
        return "border-l-4 border-blue-500";
      case 'content_expiring':
        return "border-l-4 border-purple-500";
      case 'system_alert':
        return "border-l-4 border-gray-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  // Type-based icons or badges
  const getTypeBadge = (type: string) => {
    const baseStyle = "text-xs py-1 px-2 rounded";
    
    switch (type) {
      case 'approval_request':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Approval Request</Badge>;
      case 'content_approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'content_rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Changes Requested</Badge>;
      case 'content_published':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Published</Badge>;
      case 'content_expiring':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Expiring Soon</Badge>;
      case 'system_alert':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">System Alert</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Notification</Badge>;
    }
  };

  return (
    <Card className={`mb-3 ${getTypeStyles(notification.type)} ${!notification.isRead ? 'bg-slate-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getTypeBadge(notification.type)}
              <span className="text-xs text-gray-500">
                {formatDate(notification.createdAt)}
              </span>
            </div>
            <p className="text-sm">{notification.message}</p>
            
            {/* Related item link if applicable */}
            {notification.relatedItemId && notification.relatedItemType && (
              <div className="pt-1">
                <Link 
                  to={`/admin/${notification.relatedItemType}/${notification.relatedItemId}`}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View related {notification.relatedItemType.replace('_', ' ')}
                </Link>
              </div>
            )}
          </div>
          
          {!notification.isRead && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onMarkAsRead(notification.id)}
              className="h-8 px-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Preference toggle component
const PreferenceToggle = ({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string, 
  checked: boolean, 
  onChange: () => void 
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={label.toLowerCase().replace(/\s/g, '-')} className="flex-grow">
        {label}
      </Label>
      <Switch 
        id={label.toLowerCase().replace(/\s/g, '-')} 
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
};

// Main notification center component
const WorkflowNotificationCenter = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    contentApproval: true,
    contentPublished: true,
    contentExpiring: true,
    systemAlerts: true,
    emailNotifications: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-refresh effect
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        setLastRefresh(new Date());
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh, queryClient]);

  // Fetch notifications
  const { 
    data: notifications = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await apiRequest('/api/notifications');
      return response as Notification[];
    }
  });

  // Fetch notification preferences
  const { 
    data: fetchedPreferences,
    isLoading: isLoadingPreferences
  } = useQuery({
    queryKey: ['/api/notifications/preferences'],
    queryFn: async () => {
      const response = await apiRequest('/api/notifications/preferences');
      return response as NotificationPreferences;
    },
    onSuccess: (data) => {
      setPreferences(data);
    }
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const response = await apiRequest('/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "All notifications marked as read",
        description: "Your notification inbox has been cleared.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    toast({
      title: "Refreshed",
      description: "Notifications have been refreshed.",
      variant: "default"
    });
  };

  // Handle preference change
  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    updatePreferencesMutation.mutate(newPreferences);
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Workflow Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500">{unreadCount} unread</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-1"
          >
            {showPreferences ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {showPreferences ? 'Hide Preferences' : 'Preferences'}
          </Button>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-refresh-notifications"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="mr-2"
            />
            <label htmlFor="auto-refresh-notifications" className="text-sm">
              Auto-refresh (60s)
            </label>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Preferences section */}
      {showPreferences && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Customize which notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPreferences ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-1">
                <PreferenceToggle 
                  label="Content Approval Requests" 
                  checked={preferences.contentApproval} 
                  onChange={() => handlePreferenceChange('contentApproval')}
                />
                <PreferenceToggle 
                  label="Content Published" 
                  checked={preferences.contentPublished} 
                  onChange={() => handlePreferenceChange('contentPublished')}
                />
                <PreferenceToggle 
                  label="Content Expiring Soon" 
                  checked={preferences.contentExpiring} 
                  onChange={() => handlePreferenceChange('contentExpiring')}
                />
                <PreferenceToggle 
                  label="System Alerts" 
                  checked={preferences.systemAlerts} 
                  onChange={() => handlePreferenceChange('systemAlerts')}
                />
                <div className="pt-2 border-t mt-2">
                  <PreferenceToggle 
                    label="Email Notifications" 
                    checked={preferences.emailNotifications} 
                    onChange={() => handlePreferenceChange('emailNotifications')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main notifications list */}
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Notifications</h2>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Failed to load notifications. Please try again.
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>You have no notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onMarkAsRead={(id) => markAsReadMutation.mutate(id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowNotificationCenter;