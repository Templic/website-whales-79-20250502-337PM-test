/**
 * SecurityAlerts.tsx
 * 
 * Component for managing security alerts and notifications
 * Allows admins to configure, view, and respond to security incidents
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
import { Switch } from "@/components/ui/switch";
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
import { format, subDays, parseISO, formatDistanceToNow } from "date-fns";
import { 
  AlertCircle, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Database,
  FileText
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
interface SecurityAlert {
  id: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  source: string;
  message: string;
  details: string;
  timestamp: string;
  status: "new" | "in_progress" | "resolved" | "dismissed";
  resolvedBy?: number;
  resolvedAt?: string;
  notes?: string;
  affectedResource?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
}

interface AlertSetting {
  id: number;
  type: string;
  enabled: boolean;
  notifyMethod: "email" | "dashboard" | "both";
  autoResolve: boolean;
  threshold: number;
}

// Form schemas
const alertSettingsSchema = z.object({
  id: z.number().optional(),
  type: z.string(),
  enabled: z.boolean(),
  notifyMethod: z.enum(["email", "dashboard", "both"]),
  autoResolve: z.boolean(),
  threshold: z.number().min(1).max(100),
});

const resolveAlertSchema = z.object({
  alertId: z.number(),
  status: z.enum(["resolved", "dismissed"]),
  notes: z.string().min(5, "Resolution notes must be at least 5 characters").max(500),
});

type AlertSettingsFormValues = z.infer<typeof alertSettingsSchema>;
type ResolveAlertFormValues = z.infer<typeof resolveAlertSchema>;

// Alert types
const alertTypes = [
  { value: "login_failure", label: "Login Failures", description: "Multiple failed login attempts" },
  { value: "suspicious_activity", label: "Suspicious Activity", description: "Unusual user behavior detected" },
  { value: "api_abuse", label: "API Abuse", description: "Excessive or unusual API requests" },
  { value: "data_breach", label: "Data Breach Attempt", description: "Potential data exfiltration attempt" },
  { value: "permission_escalation", label: "Permission Escalation", description: "Attempt to gain higher privileges" },
  { value: "malicious_upload", label: "Malicious Upload", description: "Potentially harmful file uploaded" },
  { value: "config_change", label: "Configuration Change", description: "Critical system configuration modified" },
  { value: "vulnerability", label: "Vulnerability Detected", description: "Security vulnerability found" },
];

const SecurityAlerts: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("new");
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [isAlertDetailsOpen, setIsAlertDetailsOpen] = useState<boolean>(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState<boolean>(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>("7days");

  // Form setups
  const settingsForm = useForm<AlertSettingsFormValues>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      type: "",
      enabled: true,
      notifyMethod: "both",
      autoResolve: false,
      threshold: 5,
    },
  });

  const resolveForm = useForm<ResolveAlertFormValues>({
    resolver: zodResolver(resolveAlertSchema),
    defaultValues: {
      alertId: 0,
      status: "resolved",
      notes: "",
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

  // Fetch security alerts
  const { data: securityAlerts, isLoading: isLoadingAlerts } = useQuery<SecurityAlert[]>({
    queryKey: ['/api/admin/security/alerts', activeTab, timeRange],
    queryFn: () => apiRequest(
      'GET', 
      `/api/admin/security/alerts?status=${activeTab}&since=${getDateRangeFilter().toISOString()}`
    ),
  });

  // Fetch alert settings
  const { data: alertSettings, isLoading: isLoadingSettings } = useQuery<AlertSetting[]>({
    queryKey: ['/api/admin/security/alert-settings'],
    queryFn: () => apiRequest('GET', '/api/admin/security/alert-settings'),
  });

  // Update alert settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: AlertSettingsFormValues) => {
      if (data.id) {
        return apiRequest('PATCH', `/api/admin/security/alert-settings/${data.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/security/alert-settings', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/alert-settings'] });
      setIsSettingsDialogOpen(false);
      toast({
        title: "Settings updated",
        description: "Alert settings have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update alert settings. Please try again.",
        variant: "destructive",
      });
      console.error("Update settings error:", error);
    },
  });

  // Resolve/dismiss alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (data: ResolveAlertFormValues) => {
      return apiRequest('PATCH', `/api/admin/security/alerts/${data.alertId}`, {
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/alerts'] });
      setIsResolveDialogOpen(false);
      setSelectedAlert(null);
      toast({
        title: "Alert updated",
        description: `Alert has been ${resolveForm.getValues('status')}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update alert. Please try again.",
        variant: "destructive",
      });
      console.error("Resolve alert error:", error);
    },
  });

  // Handle settings form submission
  const onSettingsSubmit = (data: AlertSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  // Handle resolve form submission
  const onResolveSubmit = (data: ResolveAlertFormValues) => {
    resolveAlertMutation.mutate(data);
  };

  // Handle edit settings
  const handleEditSettings = (setting: AlertSetting) => {
    settingsForm.reset({
      id: setting.id,
      type: setting.type,
      enabled: setting.enabled,
      notifyMethod: setting.notifyMethod,
      autoResolve: setting.autoResolve,
      threshold: setting.threshold,
    });
    setIsSettingsDialogOpen(true);
  };

  // Handle create new settings
  const handleCreateSettings = () => {
    settingsForm.reset({
      type: "",
      enabled: true,
      notifyMethod: "both",
      autoResolve: false,
      threshold: 5,
    });
    setIsSettingsDialogOpen(true);
  };

  // Handle view alert details
  const handleViewAlertDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setIsAlertDetailsOpen(true);
  };

  // Handle resolve/dismiss alert
  const handleResolveAlert = (alert: SecurityAlert, initialStatus: "resolved" | "dismissed" = "resolved") => {
    setSelectedAlert(alert);
    resolveForm.reset({
      alertId: alert.id,
      status: initialStatus,
      notes: "",
    });
    setIsResolveDialogOpen(true);
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            <ShieldAlert className="h-3 w-3 mr-1" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Shield className="h-3 w-3 mr-1" />
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Low
          </Badge>
        );
      case "info":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <Bell className="h-3 w-3 mr-1" />
            Info
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {severity}
          </Badge>
        );
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            New
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "login_failure":
        return <Lock className="h-4 w-4" />;
      case "suspicious_activity":
        return <AlertCircle className="h-4 w-4" />;
      case "api_abuse":
        return <Globe className="h-4 w-4" />;
      case "data_breach":
        return <Database className="h-4 w-4" />;
      case "permission_escalation":
        return <Unlock className="h-4 w-4" />;
      case "malicious_upload":
        return <FileText className="h-4 w-4" />;
      case "config_change":
        return <Shield className="h-4 w-4" />;
      case "vulnerability":
        return <ShieldAlert className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get alert type label
  const getAlertTypeLabel = (type: string) => {
    const alertType = alertTypes.find(t => t.value === type);
    return alertType ? alertType.label : type;
  };

  // Filter alerts based on active tab
  const filteredAlerts = securityAlerts?.filter(alert => {
    if (activeTab === "all") return true;
    return alert.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Alerts</h2>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
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
          <Button onClick={handleCreateSettings}>
            Configure Alerts
          </Button>
        </div>
      </div>

      <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  Manage and respond to security incidents and suspicious activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Security alerts and incidents</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts?.length ? (
                        filteredAlerts.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getAlertTypeIcon(alert.type)}
                                <span>{getAlertTypeLabel(alert.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {alert.message}
                            </TableCell>
                            <TableCell>
                              <span title={format(parseISO(alert.timestamp), 'PPpp')}>
                                {formatDistanceToNow(parseISO(alert.timestamp), { addSuffix: true })}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(alert.status)}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAlertDetails(alert)}
                              >
                                Details
                              </Button>
                              {alert.status === "new" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert, "resolved")}
                                  >
                                    Resolve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert, "dismissed")}
                                  >
                                    Dismiss
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            No alerts found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>
                  Configure alert thresholds and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alertSettings?.map((setting) => (
                      <div 
                        key={setting.id} 
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                        onClick={() => handleEditSettings(setting)}
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getAlertTypeLabel(setting.type)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Threshold: {setting.threshold}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={setting.enabled ? "default" : "outline"}>
                            {setting.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">Edit</span>
                            {getAlertTypeIcon(setting.type)}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!alertSettings || alertSettings.length === 0) && (
                      <div className="text-center py-6 text-muted-foreground">
                        No alert settings configured
                      </div>
                    )}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleCreateSettings}
                    >
                      Add Alert Configuration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      {/* Alert Details Dialog */}
      <Dialog open={isAlertDetailsOpen} onOpenChange={setIsAlertDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Detailed information about this security alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-6">
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Status</div>
                  <div>{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Severity</div>
                  <div>{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Time</div>
                  <div>{format(parseISO(selectedAlert.timestamp), 'PPpp')}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Type</div>
                  <div className="flex items-center">
                    {getAlertTypeIcon(selectedAlert.type)}
                    <span className="ml-2">{getAlertTypeLabel(selectedAlert.type)}</span>
                  </div>
                </div>
                {selectedAlert.userId && (
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">User ID</div>
                    <div>{selectedAlert.userId}</div>
                  </div>
                )}
                {selectedAlert.ipAddress && (
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">IP Address</div>
                    <div>{selectedAlert.ipAddress}</div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="font-semibold">Message</div>
                  <div className="p-3 bg-muted rounded-md">{selectedAlert.message}</div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">Details</div>
                  <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">{selectedAlert.details}</div>
                </div>
                {selectedAlert.notes && (
                  <div className="space-y-2">
                    <div className="font-semibold">Resolution Notes</div>
                    <div className="p-3 bg-muted rounded-md">{selectedAlert.notes}</div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAlertDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedAlert.status === "new" && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => {
                        setIsAlertDetailsOpen(false);
                        handleResolveAlert(selectedAlert, "resolved");
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsAlertDetailsOpen(false);
                        handleResolveAlert(selectedAlert, "dismissed");
                      }}
                    >
                      Dismiss
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Alert Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveForm.getValues("status") === "resolved" 
                ? "Resolve Alert" 
                : "Dismiss Alert"}
            </DialogTitle>
            <DialogDescription>
              {resolveForm.getValues("status") === "resolved"
                ? "Provide resolution details for this security alert"
                : "Explain why this alert is being dismissed"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resolveForm}>
            <form onSubmit={resolveForm.handleSubmit(onResolveSubmit)} className="space-y-6">
              <FormField
                control={resolveForm.control}
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
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Mark as resolved if the issue has been fixed, or dismiss if it's not a concern
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resolveForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notes about the resolution or dismissal..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide context about how the issue was resolved or why it was dismissed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResolveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={resolveAlertMutation.isPending}>
                  {resolveAlertMutation.isPending 
                    ? "Updating..." 
                    : resolveForm.getValues("status") === "resolved" 
                      ? "Resolve Alert" 
                      : "Dismiss Alert"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Alert Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {settingsForm.getValues("id") ? "Edit Alert Settings" : "Create Alert Settings"}
            </DialogTitle>
            <DialogDescription>
              Configure how security alerts are detected and handled
            </DialogDescription>
          </DialogHeader>
          
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
              <FormField
                control={settingsForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Type</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!!settingsForm.getValues("id")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {alertTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of security event to monitor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Alerts
                      </FormLabel>
                      <FormDescription>
                        Receive notifications for this alert type
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
                control={settingsForm.control}
                name="notifyMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Method</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="dashboard">Dashboard Only</SelectItem>
                        <SelectItem value="both">Email & Dashboard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How you want to be notified of new alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        min={1}
                        max={100}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of occurrences before an alert is triggered
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="autoResolve"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-Resolve
                      </FormLabel>
                      <FormDescription>
                        Automatically resolve alerts after 24 hours of inactivity
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSettingsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending 
                    ? "Saving..." 
                    : settingsForm.getValues("id") 
                      ? "Update Settings" 
                      : "Create Settings"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityAlerts;