import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { RotateCcw, RefreshCcw, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type ContentHistory = {
  id: number;
  contentId: number;
  version: number;
  title: string;
  content: string;
  type: "text" | "image" | "html";
  page: string;
  section: string;
  imageUrl: string | null;
  modifiedAt: string;
  modifiedBy: number | null;
  changeDescription: string | null;
};

interface ContentHistoryViewProps {
  contentId: number;
  onClose?: () => void;
}

const ContentHistoryView: React.FC<ContentHistoryViewProps> = ({ contentId, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch content history
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/content/history', contentId],
    queryFn: async () => {
      const response = await fetch(`/api/content/${contentId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch content history');
      }
      return response.json() as Promise<ContentHistory[]>;
    }
  });

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: async (historyId: number) => {
      const response = await fetch(`/api/content/history/${historyId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to restore version');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Version restored",
        description: "Content has been restored to the selected version",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/history', contentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { changeDescription: string }) => {
      const response = await fetch(`/api/content/${contentId}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create version');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Version created",
        description: "A new version has been created",
      });
      
      // Invalidate history query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/content/history', contentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateVersion = () => {
    const changeDescription = prompt("Enter a description for this version (optional):");
    
    if (changeDescription !== null) {
      createVersionMutation.mutate({ changeDescription });
    }
  };
  
  const handleRestoreVersion = (historyId: number) => {
    if (confirm("Are you sure you want to restore this version? Current content will be overwritten.")) {
      restoreMutation.mutate(historyId);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Content Version History</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateVersion}
            disabled={createVersionMutation.isPending}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Create Version
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage previous versions of this content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading history...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Error loading history</p>
          </div>
        ) : history && history.length > 0 ? (
          <Table>
            <TableCaption>Version history for content</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Modified At</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="outline">{item.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {format(new Date(item.modifiedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.changeDescription || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRestoreVersion(item.id)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No version history available</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContentHistoryView;