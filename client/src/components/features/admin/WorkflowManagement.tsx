/**
 * WorkflowManagement.tsx
 * 
 * Component for managing content approval workflows
 * Allows admins to review, approve, or request changes to content
 */
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle, PenSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define interfaces
interface ContentItem {
  id: number;
  key: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  location: string;
  scheduledPublishAt?: string | null;
  expirationDate?: string | null;
}

interface WorkflowHistoryItem {
  id: number;
  contentId: number;
  userId: number;
  userName: string;
  fromStatus: string;
  toStatus: string;
  actionAt: string;
  reviewNotes?: string;
}

// Status options
const contentStatusOptions = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "rejected", label: "Rejected" }
];

// Status badge color mapping
const statusColor: Record<string, string> = {
  draft: "bg-gray-200 text-gray-800",
  review: "bg-blue-200 text-blue-800",
  changes_requested: "bg-amber-200 text-amber-800",
  approved: "bg-green-200 text-green-800",
  published: "bg-emerald-200 text-emerald-800",
  archived: "bg-purple-200 text-purple-800",
  rejected: "bg-red-200 text-red-800"
};

// Status icons
const statusIcon: Record<string, React.ReactNode> = {
  draft: <PenSquare className="h-4 w-4" />,
  review: <Clock className="h-4 w-4" />,
  changes_requested: <AlertCircle className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  published: <CheckCircle2 className="h-4 w-4" />,
  archived: <Clock className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />
};

// Form schema for updating content status
const updateStatusSchema = z.object({
  contentId: z.number(),
  status: z.string(),
  reviewNotes: z.string().optional(),
  scheduledPublishAt: z.date().optional().nullable(),
  expirationDate: z.date().optional().nullable(),
});

type UpdateStatusFormValues = z.infer<typeof updateStatusSchema>;

const WorkflowManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const form = useForm<UpdateStatusFormValues>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      contentId: 0,
      status: "",
      reviewNotes: "",
      scheduledPublishAt: null,
      expirationDate: null,
    },
  });

  // Fetch content items
  const { data: contentItems, isLoading: isLoadingContent } = useQuery<ContentItem[]>({
    queryKey: ['/api/admin/content'],
    select: (data: ContentItem[]) => {
      if (activeTab === "all") return data;
      return data.filter((item: ContentItem) => item.status === activeTab);
    }
  });

  // Fetch workflow history for a specific content item
  const { data: workflowHistory, isLoading: isLoadingHistory } = useQuery<WorkflowHistoryItem[]>({
    queryKey: ['/api/admin/content', selectedContentId, 'history'],
    queryFn: () => {
      return apiRequest('GET', `/api/admin/content/${selectedContentId}/history`);
    },
    enabled: !!selectedContentId,
  });

  // Mutation to update content status
  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateStatusFormValues) => {
      return apiRequest(
        'PATCH',
        `/api/admin/content/${data.contentId}/status`,
        {
          status: data.status,
          reviewNotes: data.reviewNotes,
          scheduledPublishAt: data.scheduledPublishAt ? new Date(data.scheduledPublishAt).toISOString() : null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/content', selectedContentId, 'history'] 
      });
      setIsUpdateDialogOpen(false);
      toast({
        title: "Status updated",
        description: "Content status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update content status. Please try again.",
        variant: "destructive",
      });
      console.error("Update status error:", error);
    },
  });

  const handleViewHistory = (contentId: number) => {
    setSelectedContentId(contentId);
  };

  const handleUpdateStatus = (contentItem: ContentItem) => {
    form.reset({
      contentId: contentItem.id,
      status: contentItem.status,
      reviewNotes: "",
      scheduledPublishAt: contentItem.scheduledPublishAt ? new Date(contentItem.scheduledPublishAt) : null,
      expirationDate: contentItem.expirationDate ? new Date(contentItem.expirationDate) : null,
    });
    setIsUpdateDialogOpen(true);
  };

  const onUpdateSubmit = (data: UpdateStatusFormValues) => {
    updateStatusMutation.mutate(data);
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => (
    <Badge className={statusColor[status] || "bg-gray-200"}>
      <span className="flex items-center">
        {statusIcon[status]}
        <span className="ml-1">{status.replace(/_/g, ' ')}</span>
      </span>
    </Badge>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="review">In Review</TabsTrigger>
          <TabsTrigger value="changes_requested">Changes Requested</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Content Workflow Management</CardTitle>
            <CardDescription>
              Manage the approval flow of content across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableCaption>Content items currently in the workflow</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentItems?.length ? (
                    contentItems.map((item: ContentItem) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {item.title}
                        </TableCell>
                        <TableCell>{renderStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {item.scheduledPublishAt 
                            ? format(new Date(item.scheduledPublishAt), 'MMM d, yyyy') 
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {item.expirationDate 
                            ? format(new Date(item.expirationDate), 'MMM d, yyyy') 
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewHistory(item.id)}
                          >
                            History
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(item)}
                          >
                            Update Status
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No content items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedContentId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Workflow History</CardTitle>
              <CardDescription>
                Track the approval journey of this content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>From Status</TableHead>
                      <TableHead>To Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflowHistory?.length ? (
                      workflowHistory.map((item: WorkflowHistoryItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {format(new Date(item.actionAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>{item.userName}</TableCell>
                          <TableCell>{renderStatusBadge(item.fromStatus)}</TableCell>
                          <TableCell>{renderStatusBadge(item.toStatus)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.reviewNotes || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          No workflow history available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedContentId(null)}
              >
                Close History
              </Button>
            </CardFooter>
          </Card>
        )}
      </Tabs>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Content Status</DialogTitle>
            <DialogDescription>
              Change the workflow status and set publishing schedule
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Content Status</SelectLabel>
                          {contentStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The new workflow status for this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add review notes or feedback..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes explaining the status change
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledPublishAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Publish</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When to publish this content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expiration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When to archive this content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowManagement;