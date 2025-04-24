/**
 * ContentScheduler.tsx
 * 
 * Component for scheduling content publication and expiration
 * Allows admins to set future publication dates and expiration dates for content
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, isAfter, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock, Calendar as CalendarIcon2, TimerOff, AlertCircle, Clock10 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Types
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

// Form schemas
const scheduleSchema = z.object({
  contentId: z.number(),
  scheduledPublishAt: z.date().optional().nullable(),
  expirationDate: z
    .date()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const publishDate = z.date().optional().nullable().parse(
          z.object({ scheduledPublishAt: z.date().optional().nullable() }).parse(
            useForm().getValues()
          ).scheduledPublishAt
        );
        if (!publishDate) return true;
        return isAfter(date, publishDate);
      },
      {
        message: "Expiration date must be after the scheduled publish date",
      }
    ),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const ContentScheduler: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState<boolean>(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Form setup
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      contentId: 0,
      scheduledPublishAt: null,
      expirationDate: null,
      notes: "",
    },
  });

  // Fetch all content items
  const { data: contentItems, isLoading: isLoadingContent } = useQuery<ContentItem[]>({
    queryKey: ['/api/admin/content'],
    queryFn: () => apiRequest('GET', '/api/admin/content'),
  });

  // Update content schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) => {
      return apiRequest(
        'PATCH',
        `/api/admin/content/${data.contentId}/schedule`,
        {
          scheduledPublishAt: data.scheduledPublishAt ? new Date(data.scheduledPublishAt).toISOString() : null,
          expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
          notes: data.notes,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      setIsScheduleDialogOpen(false);
      toast({
        title: "Schedule updated",
        description: "Content schedule has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update content schedule. Please try again.",
        variant: "destructive",
      });
      console.error("Update schedule error:", error);
    },
  });

  // Handle schedule update
  const onScheduleSubmit = (data: ScheduleFormValues) => {
    updateScheduleMutation.mutate(data);
  };

  // Handle edit schedule click
  const handleScheduleContent = (content: ContentItem) => {
    setSelectedContent(content);
    form.reset({
      contentId: content.id,
      scheduledPublishAt: content.scheduledPublishAt ? new Date(content.scheduledPublishAt) : null,
      expirationDate: content.expirationDate ? new Date(content.expirationDate) : null,
      notes: "",
    });
    setIsScheduleDialogOpen(true);
  };

  // Filter content based on active tab
  const filteredContent = contentItems?.filter(content => {
    const now = new Date();
    
    if (activeTab === "all") return true;
    if (activeTab === "scheduled" && content.scheduledPublishAt) {
      return content.status !== "published" && content.status !== "archived";
    }
    if (activeTab === "published") return content.status === "published";
    if (activeTab === "expired") {
      return content.expirationDate && isBefore(new Date(content.expirationDate), now);
    }
    if (activeTab === "expiring-soon") {
      return (
        content.expirationDate && 
        isAfter(new Date(content.expirationDate), now) && 
        isBefore(new Date(content.expirationDate), addDays(now, 7))
      );
    }
    
    return true;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "review":
        return <Badge variant="secondary">In Review</Badge>;
      case "changes_requested":
        return <Badge variant="warning">Changes Requested</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "published":
        return <Badge variant="success">Published</Badge>;
      case "archived":
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get schedule status badge
  const getScheduleBadge = (content: ContentItem) => {
    const now = new Date();
    
    if (!content.scheduledPublishAt && !content.expirationDate) {
      return <Badge variant="outline" className="bg-gray-100">Not Scheduled</Badge>;
    }
    
    if (content.scheduledPublishAt && isAfter(new Date(content.scheduledPublishAt), now)) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    }
    
    if (content.expirationDate) {
      if (isBefore(new Date(content.expirationDate), now)) {
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <TimerOff className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      }
      
      if (isBefore(new Date(content.expirationDate), addDays(now, 7))) {
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      }
      
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <Clock10 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        <CalendarIcon2 className="h-3 w-3 mr-1" />
        Published
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Scheduler</h2>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="expiring-soon">Expiring Soon</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Content Schedule Management</CardTitle>
            <CardDescription>
              Schedule when content should be published and when it should expire
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableCaption>Content scheduling information</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule Status</TableHead>
                    <TableHead>Publish Date</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent?.length ? (
                    filteredContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {content.title}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(content.status)}
                        </TableCell>
                        <TableCell>
                          {getScheduleBadge(content)}
                        </TableCell>
                        <TableCell>
                          {content.scheduledPublishAt 
                            ? format(new Date(content.scheduledPublishAt), 'MMM d, yyyy') 
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {content.expirationDate 
                            ? format(new Date(content.expirationDate), 'MMM d, yyyy') 
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleScheduleContent(content)}
                          >
                            Edit Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No content found matching the filter
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
            <DialogDescription>
              Set publication and expiration dates for {selectedContent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onScheduleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="scheduledPublishAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Publication</FormLabel>
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
                              <span>Pick a publication date</span>
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
                            isBefore(date, new Date())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the content should be automatically published. Leave empty for immediate publication.
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
                    <FormLabel>Set Expiration</FormLabel>
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
                              <span>Pick an expiration date</span>
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
                          disabled={(date) => {
                            const publishDate = form.getValues("scheduledPublishAt");
                            if (publishDate) {
                              return isBefore(date, publishDate);
                            }
                            return isBefore(date, new Date());
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the content should be automatically archived. Leave empty if content doesn't expire.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional notes about this schedule change..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes or reason for scheduling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateScheduleMutation.isPending}>
                  {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentScheduler;