/**
 * NewsletterManagement.tsx
 * 
 * Component for managing newsletter subscribers and campaigns
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, RefreshCw, ChevronDown, 
  Trash2, Download, Send, Plus, PenTool, MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Subscriber {
  id: number;
  email: string;
  name?: string;
  subscribed: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  tags?: string[];
}

interface Newsletter {
  id: number;
  subject: string;
  content: string;
  sentAt?: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  openRate?: number;
  clickRate?: number;
  recipientCount?: number;
}

const NewsletterManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers');
  const [subscriberFilter, setSubscriberFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [campaignFilter, setcampaignFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all');

  // Fetch subscribers data
  const { 
    data: subscribers, 
    isLoading: subscribersLoading, 
    error: subscribersError,
    refetch: refetchSubscribers
  } = useQuery<Subscriber[]>({
    queryKey: ['/api/admin/subscribers'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/subscribers');
        if (!res.ok) throw new Error('Failed to fetch subscribers');
        return res.json();
      } catch (err) {
        console.error('Error fetching subscribers:', err);
        return [];
      }
    },
  });

  // Fetch newsletters data
  const { 
    data: newsletters, 
    isLoading: newslettersLoading, 
    error: newslettersError,
    refetch: refetchNewsletters
  } = useQuery<Newsletter[]>({
    queryKey: ['/api/admin/newsletters'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/newsletters');
        if (!res.ok) throw new Error('Failed to fetch newsletters');
        return res.json();
      } catch (err) {
        console.error('Error fetching newsletters:', err);
        return [];
      }
    },
  });

  // Delete subscriber mutation
  const deleteSubscriberMutation = useMutation({
    mutationFn: async (subscriberId: number) => {
      const res = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete subscriber');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscribers'] });
      toast({
        title: 'Subscriber Deleted',
        description: 'The subscriber has been permanently removed from your list.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete subscriber: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Send newsletter mutation
  const sendNewsletterMutation = useMutation({
    mutationFn: async (newsletterId: number) => {
      const res = await fetch(`/api/admin/newsletters/${newsletterId}/send`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send newsletter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletters'] });
      toast({
        title: 'Newsletter Sent',
        description: 'The newsletter is being sent to all subscribers.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send newsletter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Filter subscribers based on filter type and search term
  const filteredSubscribers = subscribers?.filter(subscriber => {
    // First apply status filter
    if (subscriberFilter === 'active' && !subscriber.subscribed) return false;
    if (subscriberFilter === 'unsubscribed' && subscriber.subscribed) return false;
    // Then apply search term filter if present
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        subscriber.email.toLowerCase().includes(searchLower) ||
        (subscriber.name && subscriber.name.toLowerCase().includes(searchLower))
      );
    }
    return true;
  }) || [];

  // Filter newsletters based on filter type and search term
  const filteredNewsletters = newsletters?.filter(newsletter => {
    // First apply status filter
    if (campaignFilter === 'draft' && newsletter.status !== 'draft') return false;
    if (campaignFilter === 'scheduled' && newsletter.status !== 'scheduled') return false;
    if (campaignFilter === 'sent' && newsletter.status !== 'sent') return false;
    // Then apply search term filter if present
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        newsletter.subject.toLowerCase().includes(searchLower) ||
        newsletter.content.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock data if API fails or not available yet
  React.useEffect(() => {
    if (!subscribers && !subscribersLoading) {
      const mockSubscribers: Subscriber[] = [
        {
          id: 1,
          email: "cosmicjourney@example.com",
          name: "Cosmic Journey",
          subscribed: true,
          subscribedAt: new Date(Date.now() - 3000000).toISOString(),
          tags: ["frequency", "meditation"]
        },
        {
          id: 2,
          email: "soundhealer@example.com",
          name: "Sound Healer",
          subscribed: true,
          subscribedAt: new Date(Date.now() - 6000000).toISOString(),
          tags: ["healing", "sound-therapy"]
        },
        {
          id: 3,
          email: "vibrationallover@example.com",
          name: "Vibrational Lover",
          subscribed: true,
          subscribedAt: new Date(Date.now() - 9000000).toISOString(),
          tags: ["frequency", "sound-healing"]
        },
        {
          id: 4,
          email: "unsubscribed@example.com",
          name: "Former Subscriber",
          subscribed: false,
          subscribedAt: new Date(Date.now() - 12000000).toISOString(),
          unsubscribedAt: new Date(Date.now() - 1000000).toISOString(),
          tags: ["meditation"]
        },
        {
          id: 5,
          email: "newest@example.com",
          subscribed: true,
          subscribedAt: new Date(Date.now() - 500000).toISOString(),
          tags: ["new-user"]
        }
      ];

      queryClient.setQueryData(['/api/admin/subscribers'], mockSubscribers);
    }
  }, [subscribers, subscribersLoading, queryClient]);

  React.useEffect(() => {
    if (!newsletters && !newslettersLoading) {
      const mockNewsletters: Newsletter[] = [
        {
          id: 1,
          subject: "New Frequency Meditation Tools",
          content: "Explore our latest meditation tools designed to help you reach deeper states of consciousness...",
          sentAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
          status: "sent",
          openRate: 68,
          clickRate: 42,
          recipientCount: 857
        },
        {
          id: 2,
          subject: "Upcoming Cosmic Sound Healing Workshop",
          content: "Join us next month for an immersive sound healing experience...",
          scheduledFor: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks in future
          status: "scheduled",
          recipientCount: 921
        },
        {
          id: 3,
          subject: "Summer Frequency Sale - Draft",
          content: "Take advantage of our summer sale with 20% off all cosmic frequency products...",
          status: "draft"
        },
        {
          id: 4,
          subject: "Introduction to Sound Healing",
          content: "Learn about the fundamental principles of sound healing in our comprehensive guide...",
          sentAt: new Date(Date.now() - 2592000000).toISOString(), // 1 month ago
          status: "sent",
          openRate: 74,
          clickRate: 38,
          recipientCount: 782
        },
        {
          id: 5,
          subject: "Special Announcement - New Album Release",
          content: "We're excited to announce the release of our new cosmic frequency album...",
          status: "draft"
        }
      ];

      queryClient.setQueryData(['/api/admin/newsletters'], mockNewsletters);
    }
  }, [newsletters, newslettersLoading, queryClient]);

  // Status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Scheduled</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (subscribersLoading && activeTab === 'subscribers') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  if (newslettersLoading && activeTab === 'campaigns') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-[400px] w-full" />
        </Card>
      </div>
    );
  }

  if ((subscribersError && activeTab === 'subscribers') || (newslettersError && activeTab === 'campaigns')) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
        <h3 className="font-bold">Error Loading Data</h3>
        <p>
          {subscribersError instanceof Error && activeTab === 'subscribers' 
            ? subscribersError.message 
            : newslettersError instanceof Error && activeTab === 'campaigns'
              ? newslettersError.message
              : 'Failed to load data'}
        </p>
        <Button 
          onClick={() => activeTab === 'subscribers' ? refetchSubscribers() : refetchNewsletters()} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Tabs 
      defaultValue="subscribers" 
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as 'subscribers' | 'campaigns')}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {activeTab === 'subscribers' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-between">
                  <span>
                    {subscriberFilter === 'all' && 'All Subscribers'}
                    {subscriberFilter === 'active' && 'Active'}
                    {subscriberFilter === 'unsubscribed' && 'Unsubscribed'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSubscriberFilter('all')}>All Subscribers</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSubscriberFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSubscriberFilter('unsubscribed')}>Unsubscribed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {activeTab === 'campaigns' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-between">
                  <span>
                    {campaignFilter === 'all' && 'All Campaigns'}
                    {campaignFilter === 'draft' && 'Drafts'}
                    {campaignFilter === 'scheduled' && 'Scheduled'}
                    {campaignFilter === 'sent' && 'Sent'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setcampaignFilter('all')}>All Campaigns</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setcampaignFilter('draft')}>Drafts</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setcampaignFilter('scheduled')}>Scheduled</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setcampaignFilter('sent')}>Sent</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="outline" size="icon" onClick={() => 
            activeTab === 'subscribers' ? refetchSubscribers() : refetchNewsletters()
          }>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {activeTab === 'campaigns' && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          )}
        </div>
      </div>
      
      <TabsContent value="subscribers" className="mt-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Subscribers</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscriber
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed Date</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No subscribers found. {searchTerm && "Try adjusting your search term."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>{subscriber.name || '-'}</TableCell>
                        <TableCell>
                          {subscriber.subscribed ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Unsubscribed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(subscriber.subscribedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {subscriber.tags?.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {!subscriber.tags?.length && '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => deleteSubscriberMutation.mutate(subscriber.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem>Manage Tags</DropdownMenuItem>
                                <DropdownMenuItem>View Activity</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="campaigns" className="mt-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Email Campaigns</span>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNewsletters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No campaigns found. {searchTerm && "Try adjusting your search term."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNewsletters.map((newsletter) => (
                      <TableRow key={newsletter.id}>
                        <TableCell className="font-medium">{newsletter.subject}</TableCell>
                        <TableCell>
                          {getStatusBadge(newsletter.status)}
                        </TableCell>
                        <TableCell>
                          {newsletter.status === 'sent' 
                            ? formatDate(newsletter.sentAt) 
                            : newsletter.status === 'scheduled'
                              ? `Scheduled: ${formatDate(newsletter.scheduledFor)}`
                              : '-'}
                        </TableCell>
                        <TableCell>
                          {newsletter.recipientCount || '-'}
                        </TableCell>
                        <TableCell>
                          {newsletter.status === 'sent' ? (
                            <div className="text-sm">
                              <div>Opens: {newsletter.openRate}%</div>
                              <div>Clicks: {newsletter.clickRate}%</div>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {newsletter.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                title="Edit"
                              >
                                <PenTool className="h-4 w-4" />
                              </Button>
                            )}
                            {(newsletter.status === 'draft' || newsletter.status === 'scheduled') && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => sendNewsletterMutation.mutate(newsletter.id)}
                                title="Send"
                              >
                                <Send className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {newsletter.status === 'draft' && (
                                  <DropdownMenuItem>Schedule</DropdownMenuItem>
                                )}
                                <DropdownMenuItem>Preview</DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                {newsletter.status === 'sent' && (
                                  <DropdownMenuItem>View Report</DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default NewsletterManagement;