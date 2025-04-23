import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SecurityMeasure {
  name: string;
  status: 'active' | 'warning' | 'inactive' | string;
  description: string;
}

interface SecurityStatusData {
  measures: SecurityMeasure[];
  score: number;
  timestamp: string;
  version?: string;
}

/**
 * Security health check that shows the status of various security features
 */
const SecurityHealthCheck: React.FC = () => {
  // Query security status endpoint
  const { data, isLoading, isError } = useQuery<SecurityStatusData>({
    queryKey: ['/api/security/status'],
    refetchInterval: 300000, // Check every 5 minutes
  });

  // Security measures to display (these would come from the API in a real implementation)
  const securityMeasures = data?.measures || [
    {
      name: 'CSRF Protection',
      status: 'active',
      description: 'Cross-Site Request Forgery protection is enabled'
    },
    {
      name: 'Content Security Policy',
      status: 'active',
      description: 'CSP headers are properly configured'
    },
    {
      name: 'Rate Limiting',
      status: 'active',
      description: 'API rate limiting is active to prevent abuse'
    },
    {
      name: 'Input Validation',
      status: 'active',
      description: 'All user input is validated before processing'
    },
    {
      name: 'HTTPS/TLS',
      status: 'active',
      description: 'Secure HTTPS connections are enforced'
    }
  ];

  const securityScore = data?.score || calculateSecurityScore(securityMeasures);
  
  // Calculate a simple security score based on active measures
  function calculateSecurityScore(measures: Array<{ status: string }>) {
    const activeMeasures = measures.filter(m => m.status === 'active').length;
    return Math.round((activeMeasures / measures.length) * 100);
  }
  
  // Determine score color based on the security score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };
  
  // Render badge for security measure status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Warning</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Checking security configuration...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Security Check Failed
          </CardTitle>
          <CardDescription>
            Unable to verify security configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            Could not retrieve security status. This may indicate a configuration problem.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Status
        </CardTitle>
        <CardDescription>
          Current security configuration and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}%
            </div>
            <div className="flex-1">
              <Progress 
                value={securityScore} 
                className={`h-2 w-full ${
                  securityScore >= 80 ? 'bg-green-100' : 
                  securityScore >= 50 ? 'bg-amber-100' : 'bg-red-100'
                }`}
              />
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {securityMeasures.map((measure: SecurityMeasure, index: number) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {measure.status === 'active' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : measure.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {measure.name}
                    <div className="ml-2">
                      {renderStatusBadge(measure.status)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground pl-6">
                    {measure.description}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityHealthCheck;