/**
 * System Health Panel Component
 * 
 * Displays the current health and status of all security systems
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Lock,
  Database,
  Brain,
  AlertTriangle,
  EyeOff,
  Search
} from 'lucide-react';

// Interface for system health data
interface SystemHealth {
  csrfProtection: { status: string; lastChecked: Date };
  immutableLogs: { status: string; lastChecked: Date };
  quantumResistantCrypto: { status: string; lastChecked: Date };
  anomalyDetection: { status: string; lastChecked: Date };
  raspProtection: { status: string; lastChecked: Date };
  chainIntegrity: boolean;
}

// Props for SystemHealthPanel
interface SystemHealthPanelProps {
  healthData?: SystemHealth;
  isLoading: boolean;
  isError: boolean;
  onRunScan: (level: string) => void;
  isPending: boolean;
}

/**
 * System Health Panel Component
 */
export function SystemHealthPanel({ 
  healthData, 
  isLoading, 
  isError,
  onRunScan,
  isPending
}: SystemHealthPanelProps) {
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };
  
  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active':
        return <ShieldCheck className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ShieldAlert className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <ShieldX className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Function to get component icon
  const getComponentIcon = (component: string) => {
    switch(component) {
      case 'csrfProtection':
        return <Lock className="h-6 w-6" />;
      case 'immutableLogs':
        return <Database className="h-6 w-6" />;
      case 'quantumResistantCrypto':
        return <Shield className="h-6 w-6" />;
      case 'anomalyDetection':
        return <Brain className="h-6 w-6" />;
      case 'raspProtection':
        return <EyeOff className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };
  
  // Function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current status of all security systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If error, show error card
  if (isError) {
    return (
      <div className="space-y-4">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading System Health</CardTitle>
            <CardDescription>
              Failed to load system health data. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current status of all security systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center space-x-4">
                {healthData?.chainIntegrity ? (
                  <ShieldCheck className="h-10 w-10 text-green-500" />
                ) : (
                  <ShieldAlert className="h-10 w-10 text-yellow-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {healthData?.chainIntegrity ? 
                      "Security System Healthy" : 
                      "Security Warnings Detected"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {healthData?.chainIntegrity ? 
                      "All security components are functioning properly." : 
                      "One or more security components require attention."}
                  </p>
                </div>
                <div className="ml-auto">
                  <Button 
                    variant={healthData?.chainIntegrity ? "outline" : "default"} 
                    onClick={() => onRunScan('deep')}
                    disabled={isPending}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isPending ? 'Scanning...' : 'Run Deep Scan'}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Component Status */}
            <div className="grid gap-4 md:grid-cols-2">
              {healthData && Object.entries(healthData).map(([key, value]) => {
                // Skip chainIntegrity as it's shown separately
                if (key === 'chainIntegrity') return null;
                
                return (
                  <div 
                    key={key}
                    className="flex items-start space-x-4 rounded-md border p-4"
                  >
                    <div className="rounded-full bg-muted p-2">
                      {getComponentIcon(key)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        {getStatusBadge((value as any).status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last checked: {formatDate((value as any).lastChecked)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Security Actions */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-lg font-semibold">Security Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRunScan('normal')}
                  disabled={isPending}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Normal Scan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRunScan('deep')}
                  disabled={isPending}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Deep Scan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRunScan('maximum')}
                  disabled={isPending}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Maximum Security Scan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRunScan('quantum')}
                  disabled={isPending}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Quantum Resistance Test
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}