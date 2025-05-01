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
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  AlertOctagon, 
  CheckCircle2, 
  X, 
  Eye, 
  Activity, 
  BarChart, 
  Shield as ShieldIcon, 
  ListFilter, 
  Lock, 
  Terminal, 
  Zap, 
  RefreshCw, 
  Ban
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

// Interfaces for API responses
interface Threat {
  id: string;
  timestamp: number;
  threatType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  sourceIp: string;
  userId?: string | number;
  requestPath?: string;
  requestMethod?: string;
  evidence?: any;
  ruleId: string;
  actionTaken?: string[];
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  threatType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  pattern?: string;
  threshold?: number;
  timeWindow?: number;
  autoBlock?: boolean;
  autoNotify?: boolean;
}

interface ThreatStatistics {
  totalThreats: number;
  activeThreats: number;
  resolvedThreats: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
  threatsByTimeOfDay: Record<string, number>;
  threatsByIp: Record<string, number>;
  threatsByEndpoint: Record<string, number>;
  topRules: Array<{id: string, count: number, name: string}>;
  lastUpdated: number;
}

interface SecurityScore {
  overall: number;
  components: {
    threatMitigation: number;
    configurationSecurity: number;
    userSecurity: number;
    dataProtection: number;
    monitoring: number;
  };
  recommendations: string[];
  lastUpdated: number;
}

interface RecommendedAction {
  id: string;
  name: string;
  description: string;
  automatic: boolean;
}

// Main component
export default function ThreatProtection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [threatDetailsOpen, setThreatDetailsOpen] = useState(false);
  const [ipToBlock, setIpToBlock] = useState('');
  
  // Query active threats
  const { 
    data: activeThreats,
    isLoading: activeThreatsLoading,
    isError: activeThreatsError,
    refetch: refetchActiveThreats
  } = useQuery<{success: boolean, threats: Threat[], count: number}>({
    queryKey: ['/api/security/threat/active'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Query all detected threats
  const { 
    data: allThreats,
    isLoading: allThreatsLoading,
    isError: allThreatsError,
    refetch: refetchAllThreats
  } = useQuery<{success: boolean, threats: Threat[], total: number, active: number}>({
    queryKey: ['/api/security/threat/detected'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Query threat rules
  const { 
    data: threatRules,
    isLoading: rulesLoading,
    isError: rulesError,
    refetch: refetchRules
  } = useQuery<{success: boolean, rules: Rule[], count: number}>({
    queryKey: ['/api/security/threat/rules']
  });
  
  // Query blocked IPs
  const { 
    data: blockedIps,
    isLoading: blockedIpsLoading,
    isError: blockedIpsError,
    refetch: refetchBlockedIps
  } = useQuery<{success: boolean, ips: string[], count: number}>({
    queryKey: ['/api/security/threat/blocked-ips'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Query threat statistics
  const { 
    data: threatStats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats
  } = useQuery<{success: boolean, statistics: ThreatStatistics}>({
    queryKey: ['/api/security/threat/statistics'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Query security score
  const { 
    data: securityScore,
    isLoading: scoreLoading,
    isError: scoreError,
    refetch: refetchScore
  } = useQuery<{success: boolean, securityScore: SecurityScore}>({
    queryKey: ['/api/security/threat/security-score'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Query recommended actions for a threat
  const { 
    data: recommendedActions,
    isLoading: actionsLoading,
    isError: actionsError,
    refetch: refetchActions
  } = useQuery<{success: boolean, threatId: string, actions: RecommendedAction[]}>({
    queryKey: ['/api/security/threat/recommended-actions', selectedThreat?.id],
    enabled: !!selectedThreat,
  });
  
  // Block IP mutation
  const blockIpMutation = useMutation({
    mutationFn: async ({ ip }: { ip: string }) => {
      const response = await apiRequest('POST', '/api/security/threat/block-ip', { ip });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'IP Blocked',
        description: `IP address ${ipToBlock} has been blocked.`,
        variant: 'default'
      });
      setIpToBlock('');
      refetchBlockedIps();
    },
    onError: (error) => {
      toast({
        title: 'Failed to block IP',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Unblock IP mutation
  const unblockIpMutation = useMutation({
    mutationFn: async ({ ip }: { ip: string }) => {
      const response = await apiRequest('POST', '/api/security/threat/unblock-ip', { ip });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'IP Unblocked',
        description: `IP address ${variables.ip} has been unblocked.`,
        variant: 'default'
      });
      refetchBlockedIps();
    },
    onError: (error) => {
      toast({
        title: 'Failed to unblock IP',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Resolve threat mutation
  const resolveThreatMutation = useMutation({
    mutationFn: async ({ threatId }: { threatId: string }) => {
      const response = await apiRequest('POST', `/api/security/threat/resolve/${threatId}`, {});
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Threat Resolved',
        description: `Threat ${variables.threatId} has been marked as resolved.`,
        variant: 'default'
      });
      refetchActiveThreats();
      refetchAllThreats();
      refetchStats();
      
      // Close details dialog if the resolved threat was selected
      if (selectedThreat?.id === variables.threatId) {
        setThreatDetailsOpen(false);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to resolve threat',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string, updates: Partial<Rule> }) => {
      const response = await apiRequest('PUT', `/api/security/threat/rules/${ruleId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rule Updated',
        description: 'Threat detection rule has been updated.',
        variant: 'default'
      });
      refetchRules();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update rule',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async ({ actionId, threatId }: { actionId: string, threatId: string }) => {
      const response = await apiRequest('POST', '/api/security/threat/execute-action', { actionId, threatId });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Action Executed',
        description: `Action executed successfully on threat ${variables.threatId}.`,
        variant: 'default'
      });
      refetchActiveThreats();
      refetchAllThreats();
      
      // Refresh the selected threat if it was the one we performed the action on
      if (selectedThreat?.id === variables.threatId) {
        const updatedThreat = allThreats?.threats.find(t => t.id === variables.threatId) || 
                             activeThreats?.threats.find(t => t.id === variables.threatId);
        if (updatedThreat) {
          setSelectedThreat(updatedThreat);
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to execute action',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Refresh all data
  const refreshAllData = () => {
    refetchActiveThreats();
    refetchAllThreats();
    refetchRules();
    refetchBlockedIps();
    refetchStats();
    refetchScore();
    
    toast({
      title: 'Data Refreshed',
      description: 'Threat protection data has been refreshed.',
      variant: 'default'
    });
  };
  
  // Show threat details
  const showThreatDetails = (threat: Threat) => {
    setSelectedThreat(threat);
    setThreatDetailsOpen(true);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="bg-red-600">{severity}</Badge>;
      case 'HIGH':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'MEDIUM':
        return <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-500">{severity}</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="bg-blue-500 text-white border-blue-500">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };
  
  // Get threat type icon
  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'SQL_INJECTION':
        return <Terminal className="h-4 w-4 text-red-500" />;
      case 'XSS':
        return <Code className="h-4 w-4 text-orange-500" />;
      case 'CSRF':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'BRUTE_FORCE':
        return <Key className="h-4 w-4 text-red-600" />;
      case 'DDOS':
        return <Activity className="h-4 w-4 text-red-700" />;
      case 'PATH_TRAVERSAL':
        return <FolderTree className="h-4 w-4 text-orange-600" />;
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Handle block IP
  const handleBlockIp = () => {
    if (!ipToBlock.trim()) {
      toast({
        title: 'IP Required',
        description: 'Please enter an IP address to block.',
        variant: 'destructive'
      });
      return;
    }
    
    blockIpMutation.mutate({ ip: ipToBlock });
  };
  
  // Handle unblock IP
  const handleUnblockIp = (ip: string) => {
    unblockIpMutation.mutate({ ip });
  };
  
  // Handle resolve threat
  const handleResolveThreat = (threatId: string) => {
    resolveThreatMutation.mutate({ threatId });
  };
  
  // Handle toggle rule
  const handleToggleRule = (rule: Rule) => {
    updateRuleMutation.mutate({
      ruleId: rule.id,
      updates: { enabled: !rule.enabled }
    });
  };
  
  // Handle execute action
  const handleExecuteAction = (actionId: string, threatId: string) => {
    executeActionMutation.mutate({ actionId, threatId });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Advanced Threat Protection</h2>
        <Button variant="outline" size="sm" onClick={refreshAllData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="dashboard">
            <BarChart className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="threats">
            <AlertOctagon className="h-4 w-4 mr-2" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="rules">
            <ListFilter className="h-4 w-4 mr-2" />
            Detection Rules
          </TabsTrigger>
          <TabsTrigger value="ip">
            <Ban className="h-4 w-4 mr-2" />
            IP Management
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">
                      {threatStats?.statistics.activeThreats || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      of {threatStats?.statistics.totalThreats || 0} total
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <span>
                      Last updated: {formatTimestamp(threatStats?.statistics.lastUpdated || Date.now())}
                    </span>
                  )}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
              </CardHeader>
              <CardContent>
                {blockedIpsLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {blockedIps?.count || 0}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {blockedIpsLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <span>
                      Active protection barriers
                    </span>
                  )}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                {scoreLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex flex-col">
                    <div className="text-3xl font-bold">
                      {securityScore?.securityScore.overall || 0}/100
                    </div>
                    <Progress
                      value={securityScore?.securityScore.overall || 0}
                      className="h-2 mt-1"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {scoreLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <span>
                      {securityScore?.securityScore.overall || 0 >= 70 ? 'Good' : 'Needs improvement'}
                    </span>
                  )}
                </p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {threatRules?.rules.filter(r => r.enabled).length || 0}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {rulesLoading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    <span>
                      of {threatRules?.count || 0} total rules
                    </span>
                  )}
                </p>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Threats</CardTitle>
                <CardDescription>
                  Latest detected security threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allThreatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : allThreats?.threats && allThreats.threats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allThreats.threats.slice(0, 5).map((threat) => (
                        <TableRow key={threat.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getThreatTypeIcon(threat.threatType)}
                              <span>{threat.threatType.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(threat.severity)}</TableCell>
                          <TableCell>{threat.sourceIp}</TableCell>
                          <TableCell>{formatTimestamp(threat.timestamp)}</TableCell>
                          <TableCell>
                            {threat.resolved ? (
                              <Badge variant="outline" className="bg-green-500 text-white border-green-500">Resolved</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500 text-white border-red-500">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => showThreatDetails(threat)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <ShieldIcon className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-center text-muted-foreground">
                      No threats detected yet. Your system is secure.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('threats')}>
                  View All Threats
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
                <CardDescription>
                  Suggested actions to improve security
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoreLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : securityScore?.securityScore.recommendations ? (
                  <ul className="space-y-3">
                    {securityScore.securityScore.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2">
                        <ShieldIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No recommendations available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Threats by Type</CardTitle>
                <CardDescription>
                  Distribution of detected threats by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : threatStats?.statistics.threatsByType ? (
                  <div className="space-y-4">
                    {Object.entries(threatStats.statistics.threatsByType)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className="w-36 flex-shrink-0">
                            <p className="text-sm font-medium">{type.replace(/_/g, ' ')}</p>
                          </div>
                          <div className="w-full">
                            <div className="flex items-center gap-2">
                              <Progress value={count / threatStats.statistics.totalThreats * 100} className="h-2" />
                              <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No threat data available
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Score Components</CardTitle>
                <CardDescription>
                  Breakdown of security posture by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scoreLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : securityScore?.securityScore.components ? (
                  <div className="space-y-4">
                    {Object.entries(securityScore.securityScore.components).map(([component, score]) => (
                      <div key={component} className="flex items-center">
                        <div className="w-40 flex-shrink-0">
                          <p className="text-sm font-medium">
                            {component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                        </div>
                        <div className="w-full">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={score} 
                              className={`h-2 ${score < 60 ? 'bg-red-200' : score < 80 ? 'bg-yellow-200' : 'bg-green-200'}`}
                            />
                            <span className="text-sm text-muted-foreground w-10 text-right">{score}/100</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No security score data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Threats Tab */}
        <TabsContent value="threats">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Threats</CardTitle>
                <CardDescription>
                  Currently active security threats requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeThreatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : activeThreats?.threats && activeThreats.threats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeThreats.threats.map((threat) => (
                        <TableRow key={threat.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getThreatTypeIcon(threat.threatType)}
                              <span>{threat.threatType.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{threat.description}</TableCell>
                          <TableCell>{getSeverityBadge(threat.severity)}</TableCell>
                          <TableCell>{threat.sourceIp}</TableCell>
                          <TableCell>{formatTimestamp(threat.timestamp)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => showThreatDetails(threat)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleResolveThreat(threat.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <ShieldIcon className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-center text-muted-foreground">
                      No active threats detected. Your system is secure.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resolved Threats</CardTitle>
                <CardDescription>
                  Previously detected and resolved security threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allThreatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : allThreats?.threats.filter(t => t.resolved)?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Resolved At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allThreats.threats
                        .filter(t => t.resolved)
                        .slice(0, 10)
                        .map((threat) => (
                        <TableRow key={threat.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getThreatTypeIcon(threat.threatType)}
                              <span>{threat.threatType.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{threat.description}</TableCell>
                          <TableCell>{getSeverityBadge(threat.severity)}</TableCell>
                          <TableCell>{threat.sourceIp}</TableCell>
                          <TableCell>{formatTimestamp(threat.resolvedAt || threat.timestamp)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => showThreatDetails(threat)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-center text-muted-foreground">
                      No resolved threats found.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Threat Details Dialog */}
          <Dialog open={threatDetailsOpen} onOpenChange={setThreatDetailsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Threat Details</DialogTitle>
                <DialogDescription>
                  Detailed information about the detected security threat
                </DialogDescription>
              </DialogHeader>
              
              {selectedThreat && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Threat ID</Label>
                      <p className="text-sm font-mono">{selectedThreat.id}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p>
                        {selectedThreat.resolved ? (
                          <Badge variant="outline" className="bg-green-500 text-white border-green-500">Resolved</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500 text-white border-red-500">Active</Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <p className="flex items-center gap-1 mt-1">
                        {getThreatTypeIcon(selectedThreat.threatType)}
                        <span>{selectedThreat.threatType.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                    <div>
                      <Label>Severity</Label>
                      <p className="mt-1">{getSeverityBadge(selectedThreat.severity)}</p>
                    </div>
                    <div>
                      <Label>Source IP</Label>
                      <p className="text-sm">{selectedThreat.sourceIp}</p>
                    </div>
                    <div>
                      <Label>Detected At</Label>
                      <p className="text-sm">{formatTimestamp(selectedThreat.timestamp)}</p>
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <p className="text-sm">{selectedThreat.description}</p>
                    </div>
                    {selectedThreat.requestPath && (
                      <div className="col-span-2">
                        <Label>Request Path</Label>
                        <p className="text-sm font-mono">{selectedThreat.requestMethod} {selectedThreat.requestPath}</p>
                      </div>
                    )}
                    {selectedThreat.resolved && (
                      <>
                        <div>
                          <Label>Resolved By</Label>
                          <p className="text-sm">{selectedThreat.resolvedBy}</p>
                        </div>
                        <div>
                          <Label>Resolved At</Label>
                          <p className="text-sm">{formatTimestamp(selectedThreat.resolvedAt || 0)}</p>
                        </div>
                      </>
                    )}
                    {selectedThreat.actionTaken && selectedThreat.actionTaken.length > 0 && (
                      <div className="col-span-2">
                        <Label>Actions Taken</Label>
                        <ul className="text-sm list-disc pl-5 mt-1">
                          {selectedThreat.actionTaken.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {selectedThreat.evidence && (
                    <div>
                      <Label>Evidence</Label>
                      <div className="bg-muted rounded-md p-3 mt-1 overflow-x-auto">
                        <pre className="text-xs">{JSON.stringify(selectedThreat.evidence, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  
                  {!selectedThreat.resolved && (
                    <div className="border-t pt-4">
                      <Label>Recommended Actions</Label>
                      {actionsLoading ? (
                        <Skeleton className="h-20 w-full mt-2" />
                      ) : recommendedActions?.actions && recommendedActions.actions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {recommendedActions.actions.map(action => (
                            <Button 
                              key={action.id}
                              variant="outline"
                              className="justify-start h-auto py-2"
                              onClick={() => handleExecuteAction(action.id, selectedThreat.id)}
                            >
                              <div className="flex items-start">
                                <Zap className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                  <p className="font-medium text-sm">{action.name}</p>
                                  <p className="text-xs text-muted-foreground">{action.description}</p>
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">No recommended actions available</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter className="gap-2">
                {selectedThreat && !selectedThreat.resolved && (
                  <Button
                    variant="default"
                    onClick={() => handleResolveThreat(selectedThreat.id)}
                    disabled={resolveThreatMutation.isPending}
                  >
                    {resolveThreatMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setThreatDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection Rules</CardTitle>
              <CardDescription>
                Configure and manage rules for detecting security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : threatRules?.rules ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threatRules.rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getThreatTypeIcon(rule.threatType)}
                            <span>{rule.threatType.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                        <TableCell className="max-w-md truncate">{rule.description}</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleRule(rule)}
                          />
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rule Details: {rule.name}</DialogTitle>
                                <DialogDescription>
                                  Configuration details for this detection rule
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label>Rule ID</Label>
                                  <p className="text-sm font-mono">{rule.id}</p>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm">{rule.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Threat Type</Label>
                                    <p className="flex items-center gap-1 mt-1">
                                      {getThreatTypeIcon(rule.threatType)}
                                      <span>{rule.threatType.replace(/_/g, ' ')}</span>
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Severity</Label>
                                    <p className="mt-1">{getSeverityBadge(rule.severity)}</p>
                                  </div>
                                  <div>
                                    <Label>Auto Block</Label>
                                    <p className="text-sm">{rule.autoBlock ? 'Yes' : 'No'}</p>
                                  </div>
                                  <div>
                                    <Label>Auto Notify</Label>
                                    <p className="text-sm">{rule.autoNotify ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                                
                                {rule.pattern && (
                                  <div>
                                    <Label>Pattern</Label>
                                    <p className="text-sm font-mono bg-muted p-2 rounded-md mt-1 overflow-x-auto">
                                      {rule.pattern.toString()}
                                    </p>
                                  </div>
                                )}
                                
                                {rule.threshold && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Threshold</Label>
                                      <p className="text-sm">{rule.threshold} requests</p>
                                    </div>
                                    <div>
                                      <Label>Time Window</Label>
                                      <p className="text-sm">{rule.timeWindow ? `${rule.timeWindow / 1000}s` : 'N/A'}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline" type="button">
                                  Close
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <ShieldIcon className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-center text-muted-foreground">
                    No detection rules found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* IP Management Tab */}
        <TabsContent value="ip">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>IP Management</CardTitle>
                <CardDescription>
                  Block or unblock IP addresses for security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-8">
                  <div className="flex-1">
                    <Label htmlFor="ip-address">IP Address to Block</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id="ip-address"
                        type="text"
                        value={ipToBlock}
                        onChange={(e) => setIpToBlock(e.target.value)}
                        placeholder="Enter IP address"
                        className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
                      />
                      <Button 
                        onClick={handleBlockIp}
                        disabled={blockIpMutation.isPending}
                      >
                        {blockIpMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Blocking...
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Block IP
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Blocked IP Addresses</h3>
                  {blockedIpsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : blockedIps?.ips && blockedIps.ips.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedIps.ips.map((ip) => (
                          <TableRow key={ip}>
                            <TableCell>{ip}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUnblockIp(ip)}
                                disabled={unblockIpMutation.isPending}
                              >
                                {unblockIpMutation.isPending ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    Unblock
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-md">
                      <Shield className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-center text-muted-foreground">
                        No IP addresses are currently blocked
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
const Code = ({ className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 ${className}`}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const Key = ({ className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 ${className}`}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

const FolderTree = ({ className = "", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 ${className}`}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 22v-2"></path>
    <path d="M5 16v-2"></path>
    <path d="M5 10V8"></path>
    <path d="M5 2v2"></path>
    <path d="M10 6h4c.5 0 1 .5 1 1v12c0 .5-.5 1-1 1h-4c-.5 0-1-.5-1-1V7c0-.5.5-1 1-1z"></path>
    <path d="M17 6h2c.5 0 1 .5 1 1v12c0 .5-.5 1-1 1h-2c-.5 0-1-.5-1-1V7c0-.5.5-1 1-1z"></path>
    <path d="M5 8h3"></path>
    <path d="M5 16h3"></path>
  </svg>
);