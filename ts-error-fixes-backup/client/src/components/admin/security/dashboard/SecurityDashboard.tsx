/**
 * Security Dashboard Component
 * 
 * Provides a comprehensive dashboard for monitoring and managing security features
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  Eye, 
  RefreshCw,
  Lock,
  AlertTriangle,
  Clock,
  Activity,
  Settings
} from 'lucide-react';
import { AnomalyDetectionPanel } from './AnomalyDetectionPanel';
import { SecurityEventsPanel } from './SecurityEventsPanel';
import { BlockchainPanel } from './BlockchainPanel';
import { SecuritySettingsPanel } from './SecuritySettingsPanel';
import { SystemHealthPanel } from './SystemHealthPanel';

// Interface for system health data
interface SystemHealth {
  csrfProtection: { status: string; lastChecked: Date };
  immutableLogs: { status: string; lastChecked: Date };
  quantumResistantCrypto: { status: string; lastChecked: Date };
  anomalyDetection: { status: string; lastChecked: Date };
  raspProtection: { status: string; lastChecked: Date };
  chainIntegrity: boolean;
}

// Interface for security event data
interface SecurityEvent {
  id: string;
  timestamp: number;
  category: string;
  severity: string;
  message: string;
  sourceIp?: string;
  metadata?: Record<string, any>;
}

// Interface for blockchain block data
interface BlockchainBlock {
  index: number;
  timestamp: number;
  hash: string;
  previousHash: string;
  data: SecurityEvent[];
  nonce: number;
}

/**
 * Security Dashboard Component
 */
export default function SecurityDashboard() {
  // State to track active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Toast notification hook
  const { toast } = useToast();
  
  // Query for system health data
  const { 
    data: healthData, 
    isLoading: healthLoading, 
    isError: healthError,
    refetch: refetchHealth
  } = useQuery<SystemHealth>({
    queryKey: ['/api/security/health'],
    queryFn: getQueryFn(),
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Query for security events
  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    isError: eventsError,
    refetch: refetchEvents
  } = useQuery<SecurityEvent[]>({
    queryKey: ['/api/security/events'],
    queryFn: getQueryFn(),
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Query for blockchain blocks
  const { 
    data: blocksData, 
    isLoading: blocksLoading, 
    isError: blocksError,
    refetch: refetchBlocks
  } = useQuery<BlockchainBlock[]>({
    queryKey: ['/api/security/blockchain/blocks'],
    queryFn: getQueryFn(),
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Mutation for forcing a security scan
  const scanMutation = useMutation({
    mutationFn: async (level: string) => {
      const res = await apiRequest('POST', '/api/security/scan/force', { level });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Security Scan Initiated',
        description: 'The security scan has been initiated. Results will be available soon.',
        variant: 'default'
      });
      
      // Refetch data after scan is initiated
      setTimeout(() => {
        refetchHealth();
        refetchEvents();
        refetchBlocks();
      }, 5000);
    },
    onError: (error$2 => {
      toast({
        title: 'Scan Failed',
        description: `Failed to initiate security scan: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Function to handle starting a security scan
  const handleScan = (level: string) => {
    scanMutation.mutate(level);
  };
  
  // Function to get query function
  function getQueryFn() {
    return async ({ queryKey }: { queryKey: string[] }) => {
      const response = await apiRequest("GET", queryKey[0]);
      return response.json();
    };
  }
  
  // Function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get critical events count
  const criticalEventsCount = eventsData?.filter(event => event.severity === 'HIGH' || event.severity === 'CRITICAL').length || 0;
  
  // Get recent events (last 24 hours)
  const recentEvents = eventsData?.filter(event => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return event.timestamp > oneDayAgo;
  }) || [];
  
  // Event severity breakdown
  const severityBreakdown = eventsData?.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your application's security features</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => {
              refetchHealth();
              refetchEvents();
              refetchBlocks();
              toast({
                title: 'Refreshed',
                description: 'Dashboard data has been refreshed.',
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => handleScan('normal')}
            disabled={scanMutation.isPending}
          >
            <Shield className="mr-2 h-4 w-4" />
            {scanMutation.isPending ? 'Scanning...' : 'Run Security Scan'}
          </Button>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {healthData?.chainIntegrity ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? "Loading..." : 
                healthData?.chainIntegrity ? "Secure" : "Warning"}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthData?.chainIntegrity ? 
                "All security systems functioning properly" : 
                "Security system requires attention"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventsLoading ? "Loading..." : criticalEventsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalEventsCount > 0 ? `${criticalEventsCount} critical events detected` : "No critical events detected"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Integrity</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blocksLoading ? "Loading..." : (blocksData?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Blocks in security blockchain
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventsLoading ? "Loading..." : recentEvents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Security events in last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <SystemHealthPanel
            healthData={healthData}
            isLoading={healthLoading}
            isError={healthError}
            onRunScan={handleScan}
            isPending={scanMutation.isPending}
          />
        </TabsContent>
        
        {/* Security Events Tab */}
        <TabsContent value="events">
          <SecurityEventsPanel
            eventsData={eventsData}
            isLoading={eventsLoading}
            isError={eventsError}
            onRefresh={refetchEvents}
          />
        </TabsContent>
        
        {/* Anomaly Detection Tab */}
        <TabsContent value="anomaly">
          <AnomalyDetectionPanel
            eventsData={eventsData?.filter(event => event.category === 'ANOMALY_DETECTION' || event.category === 'ANOMALY_DETECTED')}
            isLoading={eventsLoading}
            isError={eventsError}
            onRefresh={refetchEvents}
          />
        </TabsContent>
        
        {/* Blockchain Logs Tab */}
        <TabsContent value="blockchain">
          <BlockchainPanel
            blocksData={blocksData}
            isLoading={blocksLoading}
            isError={blocksError}
            onRefresh={refetchBlocks}
          />
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <SecuritySettingsPanel
            healthData={healthData}
            isLoading={healthLoading}
            onScanLevelChange={handleScan}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}