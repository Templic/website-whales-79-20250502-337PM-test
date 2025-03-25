
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/components/ui/use-toast";
import { Check, X } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'music' | 'comment';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  author: string;
}

export default function ContentReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['pendingContent'],
    queryFn: () => fetch('/api/admin/content/pending').then(res => res.json())
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingContent'] });
      toast({
        title: 'Content Review',
        description: 'Review action completed successfully'
      });
    }
  });

  if (isLoading) {
    return <div>Loading content...</div>;
  }

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="blog">Blog Posts</TabsTrigger>
        <TabsTrigger value="music">Music</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {contentItems?.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                {item.title}
                <Badge>{item.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                By {item.author} • {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => reviewMutation.mutate({ id: item.id, action: 'reject' })}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => reviewMutation.mutate({ id: item.id, action: 'approve' })}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
