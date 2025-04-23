import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, InfoIcon } from 'lucide-react';

interface HealthCheckData {
  status: string;
  timestamp: string;
  uptime: number;
  services?: {
    [key: string]: {
      status: string;
      details?: string;
    }
  }
}

/**
 * HealthCheck component that checks the server's health status
 * and displays the result
 */
const HealthCheck: React.FC = () => {
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  
  const { data, isLoading, isError, error, refetch } = useQuery<HealthCheckData>({
    queryKey: ['/api/health'],
    refetchInterval: 60000, // Auto-check every 60 seconds
  });
  
  useEffect(() => {
    if (data?.timestamp) {
      setLastCheck(new Date(data.timestamp).toLocaleTimeString());
    }
  }, [data]);
  
  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking health status...</span>
          <Progress value={40} className="w-full" />
        </div>
      );
    }
    
    if (isError) {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-500">API Unreachable: {(error as Error)?.message || 'Unknown error'}</span>
          <Badge variant="destructive">Offline</Badge>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-green-500">API is operational</span>
        <Badge className="bg-green-500 hover:bg-green-600 text-white">Online</Badge>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4" /> 
          System Health
        </CardTitle>
        <CardDescription>
          API and service health status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderStatus()}
          
          {lastCheck && (
            <div className="text-xs text-muted-foreground">
              Last checked: {lastCheck}
            </div>
          )}
          
          <button 
            onClick={() => refetch()} 
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Check Again
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthCheck;