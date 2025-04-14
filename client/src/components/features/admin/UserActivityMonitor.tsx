/**
 * UserActivityMonitor.tsx
 * 
 * Component for monitoring user activity and detecting unusual patterns
 * Provides insights into user behavior and flags potential security issues
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
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, formatDistanceToNow, subDays } from "date-fns";
import { 
  Search, 
  UserPlus, 
  User, 
  Users, 
  Shield, 
  AlertCircle, 
  Flag,
  Clock,
  Filter,
  Eye,
  Ban,
  UserCheck,
  MessageSquare,
  MousePointer,
  HardDrive,
  FileEdit,
  Download,
  Upload,
  LogIn,
  LogOut,
  RefreshCcw
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";

// Types
interface UserActivity {
  id: number;
  userId: number;
  username: string;
  activityType: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: string;
  resourceId?: number;
  resourceType?: string;
  anomalyScore?: number;
  flagged: boolean;
  reviewed: boolean;
  reviewNotes?: string;
  reviewedBy?: number;
  reviewedAt?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  lastActive?: string;
  createdAt: string;
}

interface ActivityStats {
  timeframe: string;
  totalActivities: number;
  flaggedActivities: number;
  uniqueUsers: number;
  loginAttempts: number;
  dataAccess: number;
  contentEdits: number;
  apiCalls: number;
  uploads: number;
  downloads: number;
}

// Form schemas
const reviewActivitySchema = z.object({
  activityId: z.number(),
  flagged: z.boolean(),
  reviewNotes: z.string().min(3, "Notes must be at least 3 characters").max(500),
});

type ReviewActivityFormValues = z.infer<typeof reviewActivitySchema>;

// Activity types
const activityTypes = [
  { value: "login", label: "Login", icon: <LogIn className="h-4 w-4" /> },
  { value: "logout", label: "Logout", icon: <LogOut className="h-4 w-4" /> },
  { value: "view", label: "Content View", icon: <Eye className="h-4 w-4" /> },
  { value: "edit", label: "Content Edit", icon: <FileEdit className="h-4 w-4" /> },
  { value: "upload", label: "File Upload", icon: <Upload className="h-4 w-4" /> },
  { value: "download", label: "File Download", icon: <Download className="h-4 w-4" /> },
  { value: "api_call", label: "API Call", icon: <RefreshCcw className="h-4 w-4" /> },
  { value: "message", label: "Message", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "admin_action", label: "Admin Action", icon: <Shield className="h-4 w-4" /> },
];

const UserActivityMonitor: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
  const [isActivityDetailsOpen, setIsActivityDetailsOpen] = useState<boolean>(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>("7days");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userFilter, setUserFilter] = useState<number | null>(null);
  
  // Form setup
  const reviewForm = useForm<ReviewActivityFormValues>({
    resolver: zodResolver(reviewActivitySchema),
    defaultValues: {
      activityId: 0,
      flagged: false,
      reviewNotes: "",
    },
  });

  // Calculate date range for filtering
  const getDateRangeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        return subDays(now, 1);
      case "7days":
        return subDays(now, 7);
      case "30days":
        return subDays(now, 30);
      default:
        return subDays(now, 7);
    }
  };

  // Fetch user activities
  const { data: userActivities, isLoading: isLoadingActivities } = useQuery<UserActivity[]>({
    queryKey: ['/api/admin/user-activities', activeTab, timeRange, activityTypeFilter, userFilter],
    queryFn: () => {
      let url = `/api/admin/user-activities?since=${getDateRangeFilter().toISOString()}`;
      
      if (activeTab === "flagged") {
        url += "&flagged=true";
      } else if (activeTab === "reviewed") {
        url += "&reviewed=true";
      } else if (activeTab === "unreviewed") {
        url += "&reviewed=false";
      }
      
      if (activityTypeFilter) {
        url += `&activityType=${activityTypeFilter}`;
      }
      
      if (userFilter) {
        url += `&userId=${userFilter}`;
      }
      
      return apiRequest('GET', url);
    },
  });

  // Fetch activity statistics
  const { data: activityStats, isLoading: isLoadingStats } = useQuery<ActivityStats[]>({
    queryKey: ['/api/admin/user-activities/stats', timeRange],
    queryFn: () => apiRequest('GET', `/api/admin/user-activities/stats?timeRange=${timeRange}`),
  });

  // Fetch users for filtering
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: () => apiRequest('GET', '/api/admin/users'),
  });

  // Review activity mutation
  const reviewActivityMutation = useMutation({
    mutationFn: (data: ReviewActivityFormValues) => {
      return apiRequest('PATCH', `/api/admin/user-activities/${data.activityId}/review`, {
        flagged: data.flagged,
        reviewNotes: data.reviewNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-activities'] });
      setIsReviewDialogOpen(false);
      setSelectedActivity(null);
      toast({
        title: "Activity reviewed",
        description: "The user activity has been reviewed and updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to review activity. Please try again.",
        variant: "destructive",
      });
      console.error("Review activity error:", error);
    },
  });

  // Handle review form submission
  const onReviewSubmit = (data: ReviewActivityFormValues) => {
    reviewActivityMutation.mutate(data);
  };

  // Handle view activity details
  const handleViewActivityDetails = (activity: UserActivity) => {
    setSelectedActivity(activity);
    setIsActivityDetailsOpen(true);
  };

  // Handle review activity
  const handleReviewActivity = (activity: UserActivity) => {
    setSelectedActivity(activity);
    reviewForm.reset({
      activityId: activity.id,
      flagged: activity.flagged,
      reviewNotes: activity.reviewNotes || "",
    });
    setIsReviewDialogOpen(true);
  };

  // Get activity type label and icon
  const getActivityTypeInfo = (type: string) => {
    const activityType = activityTypes.find(t => t.value === type);
    return activityType || { value: type, label: type, icon: <MousePointer className="h-4 w-4" /> };
  };

  // Filter activities based on search query and other filters
  const filteredActivities = userActivities?.filter(activity => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.username.toLowerCase().includes(query) ||
        activity.ipAddress.toLowerCase().includes(query) ||
        activity.details.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Format activity details for display
  const formatActivityDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Activity Monitor</h2>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Time Range</SelectLabel>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select 
            value={activityTypeFilter} 
            onValueChange={setActivityTypeFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Activity Type</SelectLabel>
                <SelectItem value="">All Types</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      {type.icon}
                      <span className="ml-2">{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select 
            value={userFilter?.toString() || ""} 
            onValueChange={(value) => setUserFilter(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>User</SelectLabel>
                <SelectItem value="">All Users</SelectItem>
                {users?.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, IP, or details..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="unreviewed">Unreviewed</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Activities</CardTitle>
              <CardDescription>
                User activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={activityStats}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeframe" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="totalActivities" 
                      name="Total Activities"
                      stroke="#4f46e5" 
                      fill="#4f46e5" 
                      fillOpacity={0.2} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="flaggedActivities" 
                      name="Flagged Activities"
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Activity Types</CardTitle>
              <CardDescription>
                Distribution by activity category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[activityStats ? activityStats[activityStats.length - 1] : {}]}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 50, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis 
                      dataKey="timeframe" 
                      type="category" 
                      fontSize={12} 
                      tick={false}
                    />
                    <Tooltip />
                    <Bar dataKey="loginAttempts" name="Logins" fill="#3b82f6" barSize={20} />
                    <Bar dataKey="dataAccess" name="Data Access" fill="#10b981" barSize={20} />
                    <Bar dataKey="contentEdits" name="Content Edits" fill="#6366f1" barSize={20} />
                    <Bar dataKey="apiCalls" name="API Calls" fill="#8b5cf6" barSize={20} />
                    <Bar dataKey="uploads" name="Uploads" fill="#ec4899" barSize={20} />
                    <Bar dataKey="downloads" name="Downloads" fill="#f97316" barSize={20} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>User Metrics</CardTitle>
              <CardDescription>
                Active users and activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {activityStats && activityStats.length > 0 
                          ? activityStats[activityStats.length - 1].uniqueUsers 
                          : "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Users
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {activityStats && activityStats.length > 0 
                          ? activityStats[activityStats.length - 1].flaggedActivities 
                          : "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Flagged Activities
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Login Attempts</span>
                      <span className="font-medium">
                        {activityStats && activityStats.length > 0 
                          ? activityStats[activityStats.length - 1].loginAttempts 
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Content Edits</span>
                      <span className="font-medium">
                        {activityStats && activityStats.length > 0 
                          ? activityStats[activityStats.length - 1].contentEdits 
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>API Calls</span>
                      <span className="font-medium">
                        {activityStats && activityStats.length > 0 
                          ? activityStats[activityStats.length - 1].apiCalls 
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>File Operations</span>
                      <span className="font-medium">
                        {activityStats && activityStats.length > 0 
                          ? (activityStats[activityStats.length - 1].uploads + 
                             activityStats[activityStats.length - 1].downloads)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Activity Log</CardTitle>
            <CardDescription>
              Detailed record of user activities across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableCaption>User activity history</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities?.length ? (
                    filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.username}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActivityTypeInfo(activity.activityType).icon}
                            <span>{getActivityTypeInfo(activity.activityType).label}</span>
                          </div>
                        </TableCell>
                        <TableCell>{activity.ipAddress}</TableCell>
                        <TableCell>
                          <span title={format(parseISO(activity.timestamp), 'PPpp')}>
                            {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {activity.flagged ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              <Flag className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          ) : activity.reviewed ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Reviewed
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Unreviewed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewActivityDetails(activity)}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewActivity(activity)}
                          >
                            {activity.reviewed ? "Update Review" : "Review"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No activities found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Activity Details Dialog */}
      <Dialog open={isActivityDetailsOpen} onOpenChange={setIsActivityDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">User</div>
                  <div className="font-medium">{selectedActivity.username}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Activity Type</div>
                  <div className="flex items-center font-medium">
                    {getActivityTypeInfo(selectedActivity.activityType).icon}
                    <span className="ml-2">{getActivityTypeInfo(selectedActivity.activityType).label}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                  <div>{format(parseISO(selectedActivity.timestamp), 'PPpp')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">IP Address</div>
                  <div>{selectedActivity.ipAddress}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">User Agent</div>
                <div className="text-sm p-2 bg-muted rounded-md">
                  {selectedActivity.userAgent}
                </div>
              </div>
              
              {selectedActivity.resourceId && selectedActivity.resourceType && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Resource Type</div>
                    <div>{selectedActivity.resourceType}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Resource ID</div>
                    <div>{selectedActivity.resourceId}</div>
                  </div>
                </div>
              )}
              
              {selectedActivity.anomalyScore !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Anomaly Score</div>
                  <div className="flex items-center">
                    <div
                      className={`h-2 rounded-full ${
                        selectedActivity.anomalyScore > 75
                          ? "bg-red-500"
                          : selectedActivity.anomalyScore > 50
                          ? "bg-amber-500"
                          : selectedActivity.anomalyScore > 25
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${selectedActivity.anomalyScore}%` }}
                    />
                    <span className="ml-2 text-sm">{selectedActivity.anomalyScore}%</span>
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Details</div>
                <pre className="text-xs p-3 bg-muted rounded-md overflow-auto max-h-[200px]">
                  {formatActivityDetails(selectedActivity.details)}
                </pre>
              </div>
              
              {selectedActivity.reviewed && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Review Notes</div>
                    <div className="p-3 bg-muted rounded-md">
                      {selectedActivity.reviewNotes || "No notes provided"}
                    </div>
                  </div>
                  {selectedActivity.reviewedBy && selectedActivity.reviewedAt && (
                    <div className="text-sm text-muted-foreground">
                      Reviewed by ID: {selectedActivity.reviewedBy} on{" "}
                      {format(parseISO(selectedActivity.reviewedAt), 'PPpp')}
                    </div>
                  )}
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsActivityDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsActivityDetailsOpen(false);
                    handleReviewActivity(selectedActivity);
                  }}
                >
                  {selectedActivity.reviewed ? "Update Review" : "Review"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Activity Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Activity</DialogTitle>
            <DialogDescription>
              Review this user activity and flag if necessary
            </DialogDescription>
          </DialogHeader>
          
          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-6">
              <FormField
                control={reviewForm.control}
                name="flagged"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Flag as Suspicious
                      </FormLabel>
                      <FormDescription>
                        Mark this activity for further investigation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="reviewNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about this review..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add details about your findings or actions taken
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={reviewActivityMutation.isPending}>
                  {reviewActivityMutation.isPending ? "Saving..." : "Save Review"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserActivityMonitor;