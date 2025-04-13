import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Eye,
  Filter,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { format, isBefore, isToday, addDays } from 'date-fns';

interface Notification {
  id: number;
  type: string;
  userId: number;
  contentId?: number;
  contentTitle?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionRequired: boolean;
  dueDate?: string | null;
}

interface UpcomingContent {
  id: number;
  title: string;
  scheduledPublishAt: string;
  section: string;
  type: string;
}

interface ExpiringContent {
  id: number;
  title: string;
  expirationDate: string;
  publishedAt: string;
  section: string;
  type: string;
}

export function WorkflowNotifications() {
  const [notificationTab, setNotificationTab] = useState('all');
  
  // Fetch notifications
  const { 
    data: notificationsData, 
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return response.json();
    }
  });
  
  // Fetch upcoming scheduled content
  const {
    data: upcomingContent,
    isLoading: isLoadingUpcoming,
    error: upcomingError
  } = useQuery({
    queryKey: ['/api/content-workflow/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/content-workflow/upcoming');
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming content');
      }
      return response.json();
    }
  });
  
  // Fetch expiring content
  const {
    data: expiringContent,
    isLoading: isLoadingExpiring,
    error: expiringError
  } = useQuery({
    queryKey: ['/api/content-workflow/expiring'],
    queryFn: async () => {
      const response = await fetch('/api/content-workflow/expiring');
      if (!response.ok) {
        throw new Error('Failed to fetch expiring content');
      }
      return response.json();
    }
  });
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      refetchNotifications();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };
  
  // Filter notifications
  const getFilteredNotifications = () => {
    if (!notificationsData || !Array.isArray(notificationsData)) {
      return [];
    }
    
    if (notificationTab === 'all') {
      return notificationsData;
    } else if (notificationTab === 'unread') {
      return notificationsData.filter(notification => !notification.isRead);
    } else if (notificationTab === 'actionRequired') {
      return notificationsData.filter(notification => notification.actionRequired);
    }
    
    return notificationsData;
  };
  
  // Get notification badge based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'content_scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'content_published':
        return <Badge>Published</Badge>;
      case 'review_requested':
        return <Badge variant="secondary">Review Requested</Badge>;
      case 'changes_requested':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Changes Requested</Badge>;
      case 'content_approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">Approved</Badge>;
      case 'content_rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expiration_warning':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Expiring Soon</Badge>;
      case 'content_expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'security_alert':
        return <Badge variant="destructive">Security Alert</Badge>;
      case 'system_message':
        return <Badge variant="outline">System</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  // Format and classify upcoming content
  const classifyUpcomingContent = () => {
    if (!upcomingContent || !Array.isArray(upcomingContent)) {
      return { today: [], thisWeek: [], later: [] };
    }
    
    const today: UpcomingContent[] = [];
    const thisWeek: UpcomingContent[] = [];
    const later: UpcomingContent[] = [];
    
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    
    upcomingContent.forEach((item: UpcomingContent) => {
      const publishDate = new Date(item.scheduledPublishAt);
      
      if (isToday(publishDate)) {
        today.push(item);
      } else if (isBefore(publishDate, weekFromNow)) {
        thisWeek.push(item);
      } else {
        later.push(item);
      }
    });
    
    return { today, thisWeek, later };
  };
  
  // Format and classify expiring content
  const classifyExpiringContent = () => {
    if (!expiringContent || !Array.isArray(expiringContent)) {
      return { today: [], thisWeek: [], later: [] };
    }
    
    const today: ExpiringContent[] = [];
    const thisWeek: ExpiringContent[] = [];
    const later: ExpiringContent[] = [];
    
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    
    expiringContent.forEach((item: ExpiringContent) => {
      const expiryDate = new Date(item.expirationDate);
      
      if (isToday(expiryDate)) {
        today.push(item);
      } else if (isBefore(expiryDate, weekFromNow)) {
        thisWeek.push(item);
      } else {
        later.push(item);
      }
    });
    
    return { today, thisWeek, later };
  };
  
  const filteredNotifications = getFilteredNotifications();
  const { today: todayPublishing, thisWeek: weekPublishing, later: laterPublishing } = classifyUpcomingContent();
  const { today: todayExpiring, thisWeek: weekExpiring, later: laterExpiring } = classifyExpiringContent();
  
  const unreadCount = notificationsData?.filter((n: Notification) => !n.isRead).length || 0;
  const actionRequiredCount = notificationsData?.filter((n: Notification) => n.actionRequired).length || 0;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Workflow Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Recent activity, scheduled content, and upcoming expirations
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={handleMarkAllAsRead}
          >
            <CheckCircle className="h-4 w-4" />
            Mark All as Read
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="notifications">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="publishing" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Publishing Soon
            </TabsTrigger>
            <TabsTrigger value="expiring" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expiring Content
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <div className="mb-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger 
                  value="all" 
                  onClick={() => setNotificationTab('all')}
                  data-state={notificationTab === 'all' ? 'active' : ''}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  onClick={() => setNotificationTab('unread')}
                  data-state={notificationTab === 'unread' ? 'active' : ''}
                >
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="actionRequired" 
                  onClick={() => setNotificationTab('actionRequired')}
                  data-state={notificationTab === 'actionRequired' ? 'active' : ''}
                >
                  Action Required ({actionRequiredCount})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingNotifications ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : notificationsError ? (
                <div className="text-center py-8 text-destructive">
                  Failed to load notifications. Please try again.
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification: Notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-md p-4 ${notification.isRead ? 'bg-card' : 'bg-muted'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getNotificationBadge(notification.type)}
                          {notification.actionRequired && (
                            <Badge variant="destructive">Action Required</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      
                      <p className="mb-2">
                        {notification.message}
                      </p>
                      
                      {notification.contentId && (
                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Content: {notification.contentTitle}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </div>
                      )}
                      
                      {notification.dueDate && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Due: {format(new Date(notification.dueDate), 'MMMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="publishing">
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingUpcoming ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : upcomingError ? (
                <div className="text-center py-8 text-destructive">
                  Failed to load upcoming content. Please try again.
                </div>
              ) : (!upcomingContent || upcomingContent.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  No upcoming content scheduled for publishing
                </div>
              ) : (
                <div className="space-y-6">
                  {todayPublishing.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Publishing Today</h3>
                      <div className="space-y-3">
                        {todayPublishing.map((item) => (
                          <div key={item.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(item.scheduledPublishAt), 'h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {weekPublishing.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Publishing This Week</h3>
                      <div className="space-y-3">
                        {weekPublishing.map((item) => (
                          <div key={item.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(item.scheduledPublishAt), 'MMM d')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {laterPublishing.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Publishing Later</h3>
                      <div className="space-y-3">
                        {laterPublishing.map((item) => (
                          <div key={item.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(item.scheduledPublishAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="expiring">
            <ScrollArea className="h-[400px] pr-4">
              {isLoadingExpiring ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : expiringError ? (
                <div className="text-center py-8 text-destructive">
                  Failed to load expiring content. Please try again.
                </div>
              ) : (!expiringContent || expiringContent.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  No content expiring soon
                </div>
              ) : (
                <div className="space-y-6">
                  {todayExpiring.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Expiring Today</h3>
                      <div className="space-y-3">
                        {todayExpiring.map((item) => (
                          <div key={item.id} className="border rounded-md p-3 border-destructive/20 bg-destructive/5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                </div>
                              </div>
                              <Button variant="destructive" size="sm">
                                Extend
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {weekExpiring.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Expiring This Week</h3>
                      <div className="space-y-3">
                        {weekExpiring.map((item) => (
                          <div key={item.id} className="border rounded-md p-3 border-orange-500/20 bg-orange-500/5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                  <span>Expires: {format(new Date(item.expirationDate), 'MMM d')}</span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Extend
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {laterExpiring.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Expiring Later</h3>
                      <div className="space-y-3">
                        {laterExpiring.map((item) => (
                          <div key={item.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Badge variant="outline">{item.type}</Badge>
                                  <span>Section: {item.section}</span>
                                  <span>Expires: {format(new Date(item.expirationDate), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {notificationsData?.length || 0} total notifications
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={() => {
            refetchNotifications();
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}