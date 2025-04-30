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
import { CalendarIcon, Clock, Calendar as CalendarIcon2, TimerOff, AlertCircle, Clock10, EyeIcon } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ContentPreview from "./ContentPreview";

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
  timezone?: string;
  recurringSchedule?: any;
}

// Form schemas
const scheduleSchema = z.object({
  contentId: z.number(),
  scheduledPublishAt: z.date().optional().nullable(),
  scheduledPublishTime: z.string().optional(),
  expirationDate: z.date().optional().nullable(),
  expirationTime: z.string().optional(),
  timezone: z.string().default('UTC'),
  fallbackStrategy: z.enum(['retry', 'notify', 'abort']).default('retry'),
  previewEnabled: z.boolean().default(true),
  mediaUrls: z.array(z.string()).optional(),
  notes: z.string().optional(),
})
  .refine(
    (data) => {
      if (!data.expirationDate) return true;
      if (!data.scheduledPublishAt) return true;
      return isAfter(data.expirationDate, data.scheduledPublishAt);
    },
    {
      message: "Expiration date must be after the scheduled publish date",
      path: ["expirationDate"]
    }
  );

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
      scheduledPublishTime: "09:00",
      expirationDate: null,
      expirationTime: "23:59",
      timezone: "UTC",
      fallbackStrategy: "retry",
      previewEnabled: true,
      mediaUrls: [],
      notes: "",
    },
  });

  // Fetch all content items
  const { data: contentItems, isLoading: isLoadingContent } = useQuery<ContentItem[]>({
    queryKey: ['/api/admin/content'],
    queryFn: () => apiRequest('GET', '/api/admin/content'),
  });

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date | null, timeString: string | undefined): Date | null => {
    if (!date) return null;
    
    // Default to current time if no time string provided
    if (!timeString) return date;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate;
  };

  // Update content schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: (data: ScheduleFormValues) => {
      // Combine date and time values
      const fullPublishDate = combineDateAndTime(
        data.scheduledPublishAt || null, 
        data.scheduledPublishTime
      );
      
      const fullExpirationDate = combineDateAndTime(
        data.expirationDate || null,
        data.expirationTime
      );
      
      return apiRequest(
        'PATCH',
        `/api/admin/content/${data.contentId}/schedule`,
        {
          scheduledPublishAt: fullPublishDate ? fullPublishDate.toISOString() : null,
          expirationDate: fullExpirationDate ? fullExpirationDate.toISOString() : null,
          fallbackStrategy: data.fallbackStrategy,
          previewEnabled: data.previewEnabled,
          timezone: data.timezone,
          mediaUrls: data.mediaUrls || [],
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
    
    // Extract time info if dates exist
    const scheduledDate = content.scheduledPublishAt ? new Date(content.scheduledPublishAt) : null;
    const expirationDate = content.expirationDate ? new Date(content.expirationDate) : null;
    
    // Get time in HH:MM format for existing dates or use defaults
    const scheduledTime = scheduledDate 
      ? `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`
      : "09:00";
      
    const expirationTime = expirationDate
      ? `${expirationDate.getHours().toString().padStart(2, '0')}:${expirationDate.getMinutes().toString().padStart(2, '0')}`
      : "23:59";
    
    form.reset({
      contentId: content.id,
      scheduledPublishAt: scheduledDate,
      scheduledPublishTime: scheduledTime,
      expirationDate: expirationDate,
      expirationTime: expirationTime,
      timezone: content.timezone || "UTC",
      fallbackStrategy: "retry",
      previewEnabled: true,
      mediaUrls: [],
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
                          <div className="flex justify-end gap-2">
                            {content.scheduledPublishAt && (
                              <ContentPreview 
                                contentId={content.id} 
                                scheduledDate={content.scheduledPublishAt} 
                                timezone={content.timezone || "UTC"} 
                              />
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScheduleContent(content)}
                            >
                              Edit Schedule
                            </Button>
                          </div>
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
              {/* Publication Date */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Publication Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledPublishAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Publication Date</FormLabel>
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
                                  <span>Select date</span>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledPublishTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publication Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch("scheduledPublishAt")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  When the content should be automatically published. Leave empty for immediate publication.
                </FormDescription>
              </div>

              {/* Expiration Date and Time */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Expiration Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  <span>Select date</span>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch("expirationDate")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  When the content should be automatically archived. Leave empty if content doesn't expire.
                </FormDescription>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Advanced Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Common Timezones</SelectLabel>
                              <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                              <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                              <SelectItem value="Europe/Paris">Central European (CET/CEST)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                              <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Timezone for scheduled dates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fallbackStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fallback Strategy</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retry">Retry (Default)</SelectItem>
                            <SelectItem value="notify">Notify Admin Only</SelectItem>
                            <SelectItem value="abort">Abort</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          What to do if scheduling fails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previewEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Content Preview</FormLabel>
                          <FormDescription>
                            Allow content to be previewed before publication
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Media URLs */}
              <FormField
                control={form.control}
                name="mediaUrls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media URLs</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter media URLs (one per line)..."
                        onChange={(e) => {
                          const urls = e.target.value.split('\n').filter(url => url.trim().length > 0);
                          field.onChange(urls);
                        }}
                        value={field.value?.join('\n') || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Add multimedia content URLs (images, videos) to be included with this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
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