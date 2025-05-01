import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  BarChart3,
  UserCog,
  Settings,
  Lock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Define security metrics interface
interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  threatDetections: number;
  activeThreats: number;
  vulnerabilitiesDetected: number;
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Define security events interface
interface SecurityEvents {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentEvents: Array<{
    id: string;
    category: string;
    severity: string;
    message: string;
    timestamp: number;
  }>;
}

// Define system health interface
interface SystemHealth {
  cpuUsage: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  activeSessions: number;
  apiResponseTime: number;
  databaseConnectionStatus: 'healthy' | 'degraded' | 'failed';
}

// Define vulnerability assessment interface
interface VulnerabilityAssessment {
  lastScanTime: number;
  vulnerabilitiesFound: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  categories: Record<string, number>;
}

// Define dashboard data interface
interface DashboardData {
  metrics: SecurityMetrics;
  events: SecurityEvents;
  systemHealth: SystemHealth;
  vulnerabilities: VulnerabilityAssessment;
  runtimeSecurity: any;
  auditActivity: {
    totalEvents: number;
    authenticationEvents: number;
    dataAccessEvents: number;
    adminActionEvents: number;
    byActionType: Record<string, number>;
  };
}

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch security dashboard data
  const { 
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<DashboardData>({
    queryKey: ['/api/security/admin/dashboard'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Handle dashboard data fetch error
  useEffect(() => {
    if (isError) {
      toast({
        title: 'Error fetching security data',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  }, [isError, error, toast]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Format number in bytes to a human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format uptime to a human-readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-orange-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="text-red-500" />;
      case 'medium':
        return <AlertTriangle className="text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="text-green-500" />;
      default:
        return <AlertTriangle className="text-gray-500" />;
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Security Dashboard</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-4 w-1/2" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-1/3" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-14 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Security Dashboard</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Vulnerabilities
          </TabsTrigger>
          <TabsTrigger value="system">
            <BarChart3 className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Clock className="h-4 w-4 mr-2" />
            Audit Activity
          </TabsTrigger>
        </TabsList>
        
        {dashboardData && (
          <>
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Security Score */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Security Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.metrics.securityScore}/100</div>
                    <Progress
                      value={dashboardData.metrics.securityScore}
                      className="h-2 mt-2"
                    />
                    <p className={`text-xs mt-1 ${getRiskLevelColor(dashboardData.metrics.riskLevel)}`}>
                      {dashboardData.metrics.riskLevel.toUpperCase()} Risk Level
                    </p>
                  </CardContent>
                </Card>
                
                {/* Active Threats */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Threats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                      {dashboardData.metrics.activeThreats}
                      {dashboardData.metrics.activeThreats > 0 ? (
                        <AlertTriangle className="ml-2 h-5 w-5 text-orange-500" />
                      ) : (
                        <ShieldCheck className="ml-2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dashboardData.metrics.threatDetections} Total Detections
                    </p>
                  </CardContent>
                </Card>
                
                {/* Request Blocking */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Request Blocking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.metrics.blockedRequests}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Out of {dashboardData.metrics.totalRequests} Total Requests
                    </p>
                    <Progress
                      value={(dashboardData.metrics.blockedRequests / Math.max(1, dashboardData.metrics.totalRequests)) * 100}
                      className="h-2 mt-2"
                    />
                  </CardContent>
                </Card>
                
                {/* Vulnerabilities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Vulnerabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.vulnerabilities.vulnerabilitiesFound}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="text-red-500">
                        {dashboardData.vulnerabilities.criticalVulnerabilities} Critical
                      </span>
                      <span className="text-orange-500">
                        {dashboardData.vulnerabilities.highVulnerabilities} High
                      </span>
                      <span className="text-yellow-500">
                        {dashboardData.vulnerabilities.mediumVulnerabilities} Medium
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Events */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Security Events</CardTitle>
                  <CardDescription>
                    Last {dashboardData.events.recentEvents.length} security events detected by the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.events.recentEvents.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">
                        No recent security events
                      </p>
                    ) : (
                      dashboardData.events.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start p-3 border rounded-md"
                        >
                          <div className="mr-4 mt-1">
                            {getSeverityIcon(event.severity)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {event.message}
                            </h4>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Category: {event.category}</span>
                              <span>Severity: {event.severity}</span>
                              <span>
                                {formatTimestamp(event.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('events')}
                  >
                    View All Events
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Events Tab */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Security Events</CardTitle>
                  <CardDescription>
                    Detailed view of all security events captured by the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Events
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.events.total}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          By Severity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {Object.entries(dashboardData.events.bySeverity).map(([severity, count]) => (
                            <div key={severity} className="flex justify-between items-center">
                              <span className={`${severity.toLowerCase() === 'high' ? 'text-red-500' : severity.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                {severity}
                              </span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          By Category
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {Object.entries(dashboardData.events.byCategory).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span>{category}</span>
                              <span>{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    {dashboardData.events.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start p-3 border rounded-md"
                      >
                        <div className="mr-4 mt-1">
                          {getSeverityIcon(event.severity)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {event.message}
                          </h4>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Category: {event.category}</span>
                            <span>Severity: {event.severity}</span>
                            <span>
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Vulnerabilities Tab */}
            <TabsContent value="vulnerabilities">
              <Card>
                <CardHeader>
                  <CardTitle>Vulnerability Assessment</CardTitle>
                  <CardDescription>
                    Last scan: {formatTimestamp(dashboardData.vulnerabilities.lastScanTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Vulnerabilities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.vulnerabilities.vulnerabilitiesFound}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Critical
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {dashboardData.vulnerabilities.criticalVulnerabilities}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          High
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                          {dashboardData.vulnerabilities.highVulnerabilities}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Medium/Low
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                          {dashboardData.vulnerabilities.mediumVulnerabilities + dashboardData.vulnerabilities.lowVulnerabilities}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-4">Vulnerability Categories</h3>
                  <div className="space-y-4">
                    {Object.entries(dashboardData.vulnerabilities.categories).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <ShieldAlert className="h-5 w-5 mr-2 text-orange-500" />
                          <span>{category}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({Math.round((count / dashboardData.vulnerabilities.vulnerabilitiesFound) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Run New Vulnerability Scan
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* System Health Tab */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Current health metrics for the application and infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          CPU Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.systemHealth.cpuUsage.toFixed(1)}%
                        </div>
                        <Progress
                          value={dashboardData.systemHealth.cpuUsage}
                          className="h-2 mt-2"
                        />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Memory Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatBytes(dashboardData.systemHealth.memoryUsage.heapUsed)}
                        </div>
                        <Progress
                          value={(dashboardData.systemHealth.memoryUsage.heapUsed / dashboardData.systemHealth.memoryUsage.heapTotal) * 100}
                          className="h-2 mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes(dashboardData.systemHealth.memoryUsage.heapUsed)} of {formatBytes(dashboardData.systemHealth.memoryUsage.heapTotal)}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Uptime
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatUptime(dashboardData.systemHealth.uptime)}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Active Sessions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.systemHealth.activeSessions}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">API Performance</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span>Average Response Time</span>
                        <span className="font-medium">{dashboardData.systemHealth.apiResponseTime.toFixed(1)} ms</span>
                      </div>
                      <Progress
                        value={Math.min(100, (dashboardData.systemHealth.apiResponseTime / 500) * 100)}
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Database Status</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <span>Connection Status</span>
                            <div className="flex items-center">
                              {dashboardData.systemHealth.databaseConnectionStatus === 'healthy' ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              ) : dashboardData.systemHealth.databaseConnectionStatus === 'degraded' ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                              )}
                              <span className={
                                dashboardData.systemHealth.databaseConnectionStatus === 'healthy'
                                  ? 'text-green-500'
                                  : dashboardData.systemHealth.databaseConnectionStatus === 'degraded'
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                              }>
                                {dashboardData.systemHealth.databaseConnectionStatus.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Audit Activity Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Activity</CardTitle>
                  <CardDescription>
                    Security and administrative activity logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Events (24h)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.auditActivity.totalEvents}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Authentication Events
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.auditActivity.authenticationEvents}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((dashboardData.auditActivity.authenticationEvents / Math.max(1, dashboardData.auditActivity.totalEvents)) * 100)}% of all events
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Admin Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dashboardData.auditActivity.adminActionEvents}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((dashboardData.auditActivity.adminActionEvents / Math.max(1, dashboardData.auditActivity.totalEvents)) * 100)}% of all events
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-4">Activity by Action Type</h3>
                  <div className="space-y-4">
                    {Object.entries(dashboardData.auditActivity.byActionType).map(([actionType, count]) => (
                      <div key={actionType} className="flex justify-between items-center">
                        <span>{actionType}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    Export Logs
                  </Button>
                  <Button variant="outline">
                    View Full Audit Log
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Security Configuration
            </CardTitle>
            <CardDescription>
              Adjust security settings and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Security Mode Configuration
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Feature-Level Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Threat Response Rules
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className="h-5 w-5 mr-2" />
              User Security Management
            </CardTitle>
            <CardDescription>
              Manage user security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Multi-Factor Authentication
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <UserCog className="h-4 w-4 mr-2" />
                User Account Security
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Session Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}