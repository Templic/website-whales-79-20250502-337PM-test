
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export function EnhancedContentReview() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const { data: contentItems = [] } = useQuery({
    queryKey: ['content-for-review'],
    queryFn: async () => {
      const response = await fetch('/api/content/review-queue');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  const updateContentStatus = useMutation({
    mutationFn: async ({ id, status, notes, scheduledDate }) => {
      const response = await fetch(`/api/content/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, scheduledPublishAt: scheduledDate })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    }
  });

  const handleApprove = async () => {
    if (!selectedContent) return;
    await updateContentStatus.mutateAsync({
      id: selectedContent.id,
      status: 'approved',
      notes: reviewNotes,
      scheduledDate
    });
  };

  const handleRequestChanges = async () => {
    if (!selectedContent) return;
    await updateContentStatus.mutateAsync({
      id: selectedContent.id,
      status: 'changes_requested',
      notes: reviewNotes
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {contentItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 border rounded-lg mb-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedContent(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-500">
                          Created by {item.createdBy} on {format(new Date(item.createdAt), 'PPP')}
                        </p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Review Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <h2>{selectedContent.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Add review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />

              <div>
                <h4 className="mb-2">Schedule Publish Date (Optional)</h4>
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  className="rounded-md border"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleApprove} className="bg-green-600">
                  Approve
                </Button>
                <Button onClick={handleRequestChanges} variant="destructive">
                  Request Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
