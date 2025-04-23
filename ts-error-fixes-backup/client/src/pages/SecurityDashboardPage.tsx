/**
 * Security Dashboard Page
 * 
 * Provides a comprehensive interface for monitoring security metrics,
 * visualizing threats, and managing security configurations.
 */

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Lock, 
  Unlock, 
  Clock, 
  Database, 
  Globe, 
  Settings, 
  UserX, 
  Filter,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Dummy data for the dashboard - in a real app, this would come from the API
const securityScoreData = {
  overall: 85,
  authentication: 90,
  dataProtection: 85,
  vulnerabilities: 70,
  apiSecurity: 95,
  anomalyDetection: 80,
  quantum: 100
};

const recentEventsData = [
  { 
    id: 1, 
    timestamp: new Date(Date.now() - 2 * 60 * 1000), 
    type: 'warning', 
    category: 'authentication', 
    message: 'Failed login attempt from unknown IP', 
    details: { ip: '192.168.1.123', username: 'admin', attempts: 3 }
  },
  { 
    id: 2, 
    timestamp: new Date(Date.now() - 5 * 60 * 1000), 
    type: 'error', 
    category: 'api', 
    message: 'Malformed API request blocked', 
    details: { endpoint: '/api/users', method: 'POST', reason: 'SQL injection attempt' }
  },
  { 
    id: 3, 
    timestamp: new Date(Date.now() - 10 * 60 * 1000), 
    type: 'info', 
    category: 'system', 
    message: 'Security scan completed', 
    details: { duration: '2m 34s', threats: 0, warnings: 2 }
  },
  { 
    id: 4, 
    timestamp: new Date(Date.now() - 20 * 60 * 1000), 
    type: 'success', 
    category: 'authentication', 
    message: 'MFA enabled for user', 
    details: { user: 'john.doe', method: 'TOTP' }
  },
  { 
    id: 5, 
    timestamp: new Date(Date.now() - 30 * 60 * 1000), 
    type: 'warning', 
    category: 'anomaly', 
    message: 'Unusual API access pattern detected', 
    details: { endpoint: '/api/data', frequency: '120 req/min', threshold: '100 req/min' }
  },
  { 
    id: 6, 
    timestamp: new Date(Date.now() - 45 * 60 * 1000), 
    type: 'info', 
    category: 'quantum', 
    message: 'Quantum resistance test performed', 
    details: { algorithm: 'Kyber', result: 'pass' }
  },
  { 
    id: 7, 
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), 
    type: 'error', 
    category: 'csrf', 
    message: 'Invalid CSRF token detected', 
    details: { path: '/api/profile', method: 'PUT' }
  },
  { 
    id: 8, 
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
    type: 'success', 
    category: 'blockchain', 
    message: 'Security log committed to blockchain', 
    details: { entries: 245, hash: '0x3F2E1A7B...' }
  }
];

const securityConfigData = {
  mfaRequired: true,
  passwordRequirements: {
    minLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    requireLowercase: true
  },
  sessionTimeout: 30, // minutes
  ipWhitelist: ['192.168.1.0/24', '10.0.0.1'],
  quantumProtection: 'high', // 'low', 'medium', 'high'
  apiRateLimiting: {
    enabled: true,
    requestsPerMinute: 100
  },
  blockTor: true,
  blockVPNs: false,
  anomalyDetection: {
    sensitivity: 'medium', // 'low', 'medium', 'high'
    autoBlock: true,
    alertThreshold: 'medium' // 'low', 'medium', 'high'
  },
  securityScanSchedule: 'daily' // 'hourly', 'daily', 'weekly'
};

export default function SecurityDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [eventCategory, setEventCategory] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [filteredEvents, setFilteredEvents] = useState(recentEventsData);
  const [securityConfig, setSecurityConfig] = useState(securityConfigData);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Filter events based on selected filters
  useEffect(() => {
    let filtered = [...recentEventsData];
    
    if (eventCategory !== 'all') {
      filtered = filtered.filter(event => event.category === eventCategory);
    }
    
    if (eventType !== 'all') {
      filtered = filtered.filter(event => event.type === eventType);
    }
    
    // Time filtering would be implemented here
    
    setFilteredEvents(filtered);
  }, [eventCategory, eventType, timeRange]);

  // Handle config changes
  const handleConfigChange = (path: string, value$2 => {
    const newConfig = { ...securityConfig };
    
    // Handle nested properties
    if (path.includes('.')) {
      const [section, property] = path.split('.');
      newConfig[section as keyof typeof newConfig][property] = value;
    } else {
      newConfig[path as keyof typeof newConfig] = value;
    }
    
    setSecurityConfig(newConfig);
    setPendingChanges(true);
  };

  // Save security configuration
  const saveSecurityConfig = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuration saved",
        description: "Security settings have been updated successfully.",
      });
      
      setPendingChanges(false);
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "There was an error saving your security settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run security scan
  const runSecurityScan = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would trigger a security scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Security scan completed",
        description: "No critical vulnerabilities were found.",
      });
    } catch (error) {
      toast({
        title: "Scan failed",
        description: "There was an error running the security scan.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format time in a relative way
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  // Get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  // Export security logs
  const exportLogs = () => {
    // In a real app, this would generate a CSV or JSON file
    toast({
      title: "Logs exported",
      description: "Security logs have been exported successfully.",
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage security metrics, threats, and configurations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={runSecurityScan}
            disabled={isLoading}
          >
            <Shield className="mr-2 h-4 w-4" />
            {isLoading ? 'Scanning...' : 'Run Security Scan'}
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-4xl mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="reports">Reports & Logs</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Security Score Card */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Security Score</CardTitle>
                <CardDescription>
                  Overall security posture and component scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Overall Security</Label>
                    <span className="text-2xl font-bold">{securityScoreData.overall}%</span>
                  </div>
                  <Progress value={securityScoreData.overall} className="h-3" />
                </div>
                
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Authentication</Label>
                      <span>{securityScoreData.authentication}%</span>
                    </div>
                    <Progress value={securityScoreData.authentication} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Data Protection</Label>
                      <span>{securityScoreData.dataProtection}%</span>
                    </div>
                    <Progress value={securityScoreData.dataProtection} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Vulnerability</Label>
                      <span>{securityScoreData.vulnerabilities}%</span>
                    </div>
                    <Progress value={securityScoreData.vulnerabilities} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">API Security</Label>
                      <span>{securityScoreData.apiSecurity}%</span>
                    </div>
                    <Progress value={securityScoreData.apiSecurity} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Anomaly Detection</Label>
                      <span>{securityScoreData.anomalyDetection}%</span>
                    </div>
                    <Progress value={securityScoreData.anomalyDetection} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Quantum Protection</Label>
                      <span>{securityScoreData.quantum}%</span>
                    </div>
                    <Progress value={securityScoreData.quantum} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </CardFooter>
            </Card>

            {/* Threat Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Threat Summary</CardTitle>
                <CardDescription>
                  Active threats and recent incidents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                    <span className="text-2xl font-bold">3</span>
                    <span className="text-sm text-muted-foreground">Active Warnings</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500 mb-2" />
                    <span className="text-2xl font-bold">0</span>
                    <span className="text-sm text-muted-foreground">Critical Threats</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Shield className="h-8 w-8 text-green-500 mb-2" />
                    <span className="text-2xl font-bold">42</span>
                    <span className="text-sm text-muted-foreground">Blocked Attempts</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Activity className="h-8 w-8 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold">7</span>
                    <span className="text-sm text-muted-foreground">Monitored Events</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Recent Activity</Label>
                  <div className="space-y-2">
                    {recentEventsData.slice(0, 3).map(event => (
                      <div 
                        key={event.id} 
                        className="flex items-center p-2 rounded-md bg-muted/50"
                      >
                        {getEventIcon(event.type)}
                        <span className="ml-2 text-sm line-clamp-1">{event.message}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("events")}
                  className="p-0"
                >
                  View all security events
                </Button>
              </CardFooter>
            </Card>

            {/* Security Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Status</CardTitle>
                <CardDescription>
                  Authentication and identity security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">MFA Enabled</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Brute Force Protection</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Session Protection</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <UserX className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="text-sm">Account Lockout</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50">Partial</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("configuration")}
                  className="p-0"
                >
                  Manage authentication settings
                </Button>
              </CardFooter>
            </Card>

            {/* Quantum Security Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quantum Security</CardTitle>
                <CardDescription>
                  Quantum-resistant cryptography status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">NIST PQC Algorithms</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Implemented</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Key Encapsulation</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Kyber-1024</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Digital Signatures</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Dilithium</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Hybrid Cryptography</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Enabled</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="link" 
                  onClick={() => {}}
                  className="p-0"
                >
                  Test quantum resistance
                </Button>
              </CardFooter>
            </Card>

            {/* API Security Card */}
            <Card>
              <CardHeader>
                <CardTitle>API Security</CardTitle>
                <CardDescription>
                  API protection and rate limiting status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Input Validation</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">Rate Limiting</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">100/min</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">CORS Protection</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Strict</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">SQL Injection Defense</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Active</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab("configuration")}
                  className="p-0"
                >
                  Configure API security
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Monitor and analyze security incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="time-range">Time Range:</Label>
                  <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                  >
                    <SelectTrigger id="time-range" className="w-[150px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="event-category">Category:</Label>
                  <Select
                    value={eventCategory}
                    onValueChange={setEventCategory}
                  >
                    <SelectTrigger id="event-category" className="w-[150px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="anomaly">Anomaly</SelectItem>
                      <SelectItem value="quantum">Quantum</SelectItem>
                      <SelectItem value="csrf">CSRF</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="event-type">Severity:</Label>
                  <Select
                    value={eventType}
                    onValueChange={setEventType}
                  >
                    <SelectTrigger id="event-type" className="w-[150px]">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-auto"
                  onClick={exportLogs}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Events Table */}
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <div className="p-4">
                  <div className="grid grid-cols-12 gap-4 font-medium py-2 border-b mb-2">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-7">Message</div>
                  </div>
                  
                  {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Filter className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No events match your filters</p>
                    </div>
                  ) : (
                    filteredEvents.map(event => (
                      <div 
                        key={event.id}
                        className="grid grid-cols-12 gap-4 py-3 border-b hover:bg-muted/50 rounded-sm cursor-pointer transition-colors"
                      >
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {formatRelativeTime(event.timestamp)}
                        </div>
                        <div className="col-span-1 flex items-center">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="capitalize">
                            {event.category}
                          </Badge>
                        </div>
                        <div className="col-span-7 text-sm">
                          {event.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Showing {filteredEvents.length} of {recentEventsData.length} events
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* CONFIGURATION TAB */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure security settings and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Authentication Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication Settings</h3>
                <Separator />
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Multi-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce MFA for all user accounts
                      </p>
                    </div>
                    <Switch 
                      checked={securityConfig.mfaRequired}
                      onCheckedChange={(checked) => handleConfigChange('mfaRequired', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Password Requirements</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="min-length" className="text-sm">Minimum Length</Label>
                        <Input 
                          id="min-length" 
                          type="number" 
                          className="w-20"
                          value={securityConfig.passwordRequirements.minLength}
                          onChange={(e) => handleConfigChange(
                            'passwordRequirements.minLength', 
                            parseInt(e.target.value)
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="special-chars">Require Special Characters</Label>
                        <Switch 
                          id="special-chars"
                          checked={securityConfig.passwordRequirements.requireSpecialChars}
                          onCheckedChange={(checked) => handleConfigChange(
                            'passwordRequirements.requireSpecialChars', 
                            checked
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="numbers">Require Numbers</Label>
                        <Switch 
                          id="numbers"
                          checked={securityConfig.passwordRequirements.requireNumbers}
                          onCheckedChange={(checked) => handleConfigChange(
                            'passwordRequirements.requireNumbers', 
                            checked
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="uppercase">Require Uppercase</Label>
                        <Switch 
                          id="uppercase"
                          checked={securityConfig.passwordRequirements.requireUppercase}
                          onCheckedChange={(checked) => handleConfigChange(
                            'passwordRequirements.requireUppercase', 
                            checked
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="session-timeout" 
                      type="number" 
                      className="w-20"
                      value={securityConfig.sessionTimeout}
                      onChange={(e) => handleConfigChange(
                        'sessionTimeout', 
                        parseInt(e.target.value)
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* API Security Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">API Security</h3>
                <Separator />
                
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">
                        Limit request frequency to prevent abuse
                      </p>
                    </div>
                    <Switch 
                      checked={securityConfig.apiRateLimiting.enabled}
                      onCheckedChange={(checked) => handleConfigChange(
                        'apiRateLimiting.enabled', 
                        checked
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="rate-limit">Requests per minute</Label>
                    <Input 
                      id="rate-limit" 
                      type="number" 
                      className="w-20"
                      value={securityConfig.apiRateLimiting.requestsPerMinute}
                      onChange={(e) => handleConfigChange(
                        'apiRateLimiting.requestsPerMinute', 
                        parseInt(e.target.value)
                      )}
                      disabled={!securityConfig.apiRateLimiting.enabled}
                    />
                  </div>
                </div>
              </div>
              
              {/* Quantum Protection Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Quantum-Resistant Protection</h3>
                <Separator />
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantum-level">Protection Level</Label>
                    <Select
                      value={securityConfig.quantumProtection}
                      onValueChange={(value) => handleConfigChange('quantumProtection', value)}
                    >
                      <SelectTrigger id="quantum-level">
                        <SelectValue placeholder="Select protection level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Basic Protection)</SelectItem>
                        <SelectItem value="medium">Medium (Standard Protection)</SelectItem>
                        <SelectItem value="high">High (Maximum Protection)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Anomaly Detection Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Anomaly Detection</h3>
                <Separator />
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="anomaly-sensitivity">Detection Sensitivity</Label>
                    <Select
                      value={securityConfig.anomalyDetection.sensitivity}
                      onValueChange={(value) => handleConfigChange('anomalyDetection.sensitivity', value)}
                    >
                      <SelectTrigger id="anomaly-sensitivity">
                        <SelectValue placeholder="Select sensitivity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Fewer Alerts)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (More Alerts)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Block Threats</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically block detected threats
                      </p>
                    </div>
                    <Switch 
                      checked={securityConfig.anomalyDetection.autoBlock}
                      onCheckedChange={(checked) => handleConfigChange(
                        'anomalyDetection.autoBlock', 
                        checked
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button 
                onClick={saveSecurityConfig}
                disabled={isLoading || !pendingChanges}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Reports & Logs</CardTitle>
              <CardDescription>
                Generate and download security reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Security Audit Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete record of all security events and system activities
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Download Audit Log</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Authentication Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Analysis of login attempts, MFA usage, and account security
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generate Report</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Threat Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Summary of detected threats, vulnerabilities, and mitigations
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generate Report</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>API Security Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed analysis of API usage, attempted exploits, and rate limiting
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generate Report</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Compliance Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Security compliance status for common standards
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Generate Report</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Custom Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Build a custom security report with selected metrics
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Create Custom Report</Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Scheduled Reports</h3>
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Security Summary</span>
                    </div>
                    <Badge>Daily</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Threat Intelligence</span>
                    </div>
                    <Badge>Weekly</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Compliance Status</span>
                    </div>
                    <Badge>Monthly</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Reports are generated in PDF format and may contain sensitive information
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}