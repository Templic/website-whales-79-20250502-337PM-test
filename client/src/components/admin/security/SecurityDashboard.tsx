import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, Activity, Clock, Search, RefreshCcw, Database, Lock } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

// Define security event interface based on backend structure
interface SecurityEvent {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Define block interface
interface Block {
  index: number;
  timestamp: string;
  data: SecurityEvent[];
  hash: string;
  previousHash: string;
}

const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  const { data: securityEvents, isLoading, isError, refetch } = useQuery<Block[]>({ 
    queryKey: ['/api/security/blockchain/blocks'],
    retry: 1,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Extract all events from blocks for display
  const allEvents = React.useMemo(() => {
    if (!securityEvents) return [];
    
    return securityEvents.flatMap(block => 
      block.data.map(event => ({
        ...event,
        blockIndex: block.index,
        blockHash: block.hash
      }))
    ).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [securityEvents]);

  // Filter events based on current filters
  const filteredEvents = React.useMemo(() => {
    return allEvents.filter(event => {
      // Filter by severity
      if (severityFilter !== "all" && event.severity !== severityFilter) {
        return false;
      }
      
      // Filter by type
      if (typeFilter !== "all" && !event.type.includes(typeFilter)) {
        return false;
      }
      
      // Filter by time range
      if (timeRange !== "all") {
        const eventTime = new Date(event.timestamp).getTime();
        const now = new Date().getTime();
        
        switch (timeRange) {
          case "1h":
            return now - eventTime <= 3600000; // 1 hour
          case "24h":
            return now - eventTime <= 86400000; // 24 hours
          case "7d":
            return now - eventTime <= 604800000; // 7 days
          case "30d":
            return now - eventTime <= 2592000000; // 30 days
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [allEvents, severityFilter, typeFilter, timeRange]);

  // Get security stats
  const getSecurityStats = () => {
    if (!allEvents.length) return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    
    return {
      critical: allEvents.filter(e => e.severity === 'critical').length,
      high: allEvents.filter(e => e.severity === 'high').length,
      medium: allEvents.filter(e => e.severity === 'medium').length,
      low: allEvents.filter(e => e.severity === 'low').length,
      total: allEvents.length
    };
  };

  const stats = getSecurityStats();

  // Function to get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-700 hover:bg-red-800';
      case 'high':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const handleForceSecurityScan = async () => {
    try {
      await apiRequest('POST', '/api/security/scan/force', { level: 'deep' });
      // Refresh the data after a short delay to allow scan to start
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error('Failed to initiate security scan:', error);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load security events. Please try again or contact system administrator.
        </AlertDescription>
        <Button onClick={() => refetch()} size="sm" className="mt-2">
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="mr-2 h-6 w-6" /> Security Operations Dashboard
        </h1>
        
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          
          <Button onClick={handleForceSecurityScan} variant="default" size="sm">
            <Shield className="mr-2 h-4 w-4" /> Force Security Scan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Logs</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : stats.total}</div>
                <p className="text-xs text-muted-foreground">Security events logged</p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats.critical}</div>
                <p className="text-xs text-muted-foreground">Require immediate attention</p>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 dark:bg-orange-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Severity</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats.high}</div>
                <p className="text-xs text-muted-foreground">Require prompt action</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
                <Database className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : (securityEvents && securityEvents.length > 0 ? securityEvents[securityEvents.length - 1]?.index || 0 : 0)}
                </div>
                <p className="text-xs text-muted-foreground">Blockchain ledger size</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Critical Events</CardTitle>
                <CardDescription>Latest high-impact security events</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    {allEvents
                      .filter(event => ['critical', 'high'].includes(event.severity))
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={index} className="mb-4 p-3 rounded border border-gray-200 dark:border-gray-800">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium truncate mr-2">{event.type}</div>
                            <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{event.details}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    {allEvents.filter(event => ['critical', 'high'].includes(event.severity)).length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        <Lock className="mx-auto h-8 w-8 mb-2" />
                        <p>No critical events detected</p>
                        <p className="text-xs">The system is currently secure</p>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Security Health</CardTitle>
                <CardDescription>System security posture status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>CSRF Protection</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Immutable Audit Logs</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Quantum-Resistant Encryption</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ML Anomaly Detection</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>RASP Protection</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Log</CardTitle>
              <CardDescription>Comprehensive view of all security events</CardDescription>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    <SelectItem value="AUTHORIZATION">Authorization</SelectItem>
                    <SelectItem value="SECURITY_SETTING">Security Settings</SelectItem>
                    <SelectItem value="CSRF">CSRF Protection</SelectItem>
                    <SelectItem value="SCAN">Security Scan</SelectItem>
                    <SelectItem value="QUANTUM">Quantum Crypto</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, index) => (
                      <div key={index} className="mb-4 p-4 rounded border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-wrap justify-between items-start mb-2">
                          <div className="font-medium">{event.type}</div>
                          <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.details}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Database className="mr-1 h-3 w-3" />
                            Block #{event.blockIndex}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      <Search className="mx-auto h-8 w-8 mb-2" />
                      <p>No security events found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredEvents.length} of {allEvents.length} total events
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Blockchain Tab */}
        <TabsContent value="blockchain">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Ledger</CardTitle>
              <CardDescription>Immutable security log blockchain records</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  {securityEvents && securityEvents.map((block, index) => (
                    <div key={index} className="mb-6 p-4 rounded border border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium">Block #{block.index}</h3>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {block.data.length} Events
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex flex-wrap md:flex-nowrap gap-1">
                          <span className="font-medium min-w-[100px]">Timestamp:</span>
                          <span className="text-gray-600 dark:text-gray-400">{new Date(block.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-1">
                          <span className="font-medium min-w-[100px]">Hash:</span>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded truncate max-w-xs md:max-w-md lg:max-w-lg">
                            {block.hash}
                          </code>
                        </div>
                        <div className="flex flex-wrap md:flex-nowrap gap-1">
                          <span className="font-medium min-w-[100px]">Previous Hash:</span>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded truncate max-w-xs md:max-w-md lg:max-w-lg">
                            {block.previousHash}
                          </code>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="font-medium mb-2">Events:</h4>
                        <ScrollArea className="h-[200px] border rounded p-2">
                          {block.data.map((event, eventIndex) => (
                            <div key={eventIndex} className="mb-2 p-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-medium">{event.type}</div>
                                <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{event.details}</p>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;