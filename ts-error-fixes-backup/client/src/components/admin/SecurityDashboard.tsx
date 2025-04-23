import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Shield, 
  Activity, 
  Lock, 
  Settings, 
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettings {
  CONTENT_SECURITY_POLICY: boolean;
  HTTPS_ENFORCEMENT: boolean;
  AUDIO_DOWNLOAD_PROTECTION: boolean;
  ADVANCED_BOT_PROTECTION: boolean;
  TWO_FACTOR_AUTHENTICATION: boolean;
  RATE_LIMITING: boolean;
  CSRF_PROTECTION: boolean;
  XSS_PROTECTION: boolean;
  SQL_INJECTION_PROTECTION: boolean;
}

interface SecurityEvent {
  type: string;
  setting?: string;
  timestamp?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  userId?: number;
  userRole?: string;
}

interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
}

interface ScanResult {
  timestamp: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  vulnerabilities: Vulnerability[];
}

interface SecurityStats {
  total: number;
  byType: Record<string, number>;
  bySetting: Record<string, number>;
  recentEvents: SecurityEvent[];
}

const SecurityDashboard: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const response = await apiRequest('/api/security/settings', {
        method: 'GET'
      });
      if (response.settings) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security settings. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiRequest('/api/security/stats', {
        method: 'GET'
      });
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security statistics. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const fetchScanResults = async () => {
    try {
      const response = await apiRequest('/api/security/scan/latest', {
        method: 'GET'
      });
      if (response.result) {
        setScanResult(response.result);
      }
    } catch (error) {
      console.error('Failed to fetch security scan results:', error);
      // Silently fail as this could be a first run with no scan results yet
    }
  };

  const runScan = async () => {
    setIsScanning(true);
    try {
      const response = await apiRequest('/api/security/scan/run', {
        method: 'POST'
      });
      if (response.result) {
        setScanResult(response.result);
        toast({
          title: 'Scan Complete',
          description: `Found ${response.result.totalIssues} security issues.`,
          variant: response.result.criticalIssues > 0 ? 'destructive' : 'default'
        });
      }
    } catch (error) {
      console.error('Failed to run security scan:', error);
      toast({
        title: 'Error',
        description: 'Failed to run security scan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const updateSetting = async (setting: string, value: boolean) => {
    try {
      const response = await apiRequest('/api/security/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({ setting, value })
      });
      
      if (response.settings) {
        setSettings(response.settings);
        toast({
          title: 'Setting Updated',
          description: `${setting.replace(/_/g, ' ')} has been ${value ? 'enabled' : 'disabled'}.`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to update security setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security setting. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSettingToggle = (setting: keyof SecuritySettings) => {
    if (settings) {
      const newValue = !settings[setting];
      updateSetting(setting, newValue);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.allSettled([
      fetchSettings(),
      fetchStats(),
      fetchScanResults()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const renderSecurityScore = () => {
    if (!settings) return 0;
    
    // Calculate a security score based on enabled settings
    const enabledSettings = Object.values(settings).filter(Boolean).length;
    const totalSettings = Object.keys(settings).length;
    return Math.round((enabledSettings / totalSettings) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderSecurityStatus = () => {
    const score = renderSecurityScore();
    
    if (score >= 80) return {
      message: 'Strong Security',
      icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
      color: 'text-green-500'
    };
    
    if (score >= 60) return {
      message: 'Moderate Security',
      icon: <Shield className="h-5 w-5 text-yellow-500" />,
      color: 'text-yellow-500'
    };
    
    return {
      message: 'Weak Security',
      icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
      color: 'text-red-500'
    };
  };

  const renderSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="ml-2">
            Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="destructive" className="ml-2 bg-orange-500">
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="ml-2 bg-yellow-500 text-gray-800">
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="ml-2">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-gray-500">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
          <p className="text-gray-500">
            Monitor and manage security settings for your application
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-1">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="overview">
            <Shield className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities">
            <AlertCircle className="h-4 w-4 mr-2" /> Vulnerabilities
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" /> Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center pt-3">
                  <div className={`text-4xl font-bold ${getScoreColor(renderSecurityScore())}`}>
                    {renderSecurityScore()}%
                  </div>
                  <div className="flex items-center mt-2">
                    {renderSecurityStatus().icon}
                    <span className={`ml-2 ${renderSecurityStatus().color}`}>
                      {renderSecurityStatus().message}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Active Protections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {settings && Object.entries(settings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                      {value ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">Total Events</span>
                    </div>
                    <Badge variant="secondary">{stats?.total || 0}</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {stats && Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[150px]">{type}</span>
                        <Badge variant="outline" className="ml-2">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full text-blue-600" 
                  onClick={() => setActiveTab('activity')}
                >
                  View All Events
                </Button>
              </CardFooter>
            </Card>
          </div>

          {scanResult && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Security Scan</CardTitle>
                <CardDescription>
                  Completed on {formatTimestamp(scanResult.timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-sm font-medium text-gray-500">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{scanResult.criticalIssues}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                      <p className="text-sm font-medium text-gray-500">High</p>
                      <p className="text-2xl font-bold text-orange-600">{scanResult.highIssues}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <p className="text-sm font-medium text-gray-500">Medium</p>
                      <p className="text-2xl font-bold text-yellow-600">{scanResult.mediumIssues}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-gray-500">Low</p>
                      <p className="text-2xl font-bold text-blue-600">{scanResult.lowIssues}</p>
                    </div>
                  </div>

                  {scanResult.totalIssues > 0 && (
                    <Alert variant={scanResult.criticalIssues > 0 ? "destructive" : "default"}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Security Issues Detected</AlertTitle>
                      <AlertDescription>
                        {scanResult.totalIssues} security {scanResult.totalIssues === 1 ? 'issue' : 'issues'} found in the latest scan.
                      </AlertDescription>
                    </Alert>
                  )}

                  {scanResult.totalIssues === 0 && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>No Security Issues</AlertTitle>
                      <AlertDescription>
                        No security vulnerabilities were detected in the latest scan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('vulnerabilities')}
                >
                  View Details
                </Button>
                <Button 
                  onClick={runScan} 
                  disabled={isScanning}
                >
                  {isScanning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Run New Scan
                </Button>
              </CardFooter>
            </Card>
          )}

          {!scanResult && (
            <Card>
              <CardHeader>
                <CardTitle>Security Scan</CardTitle>
                <CardDescription>
                  Run a security scan to detect potential vulnerabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No scan results available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run your first security scan to identify potential vulnerabilities.
                  </p>
                  <Button 
                    onClick={runScan} 
                    disabled={isScanning}
                  >
                    {isScanning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    Run Security Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security features and protections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && Object.entries(settings).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium">{key.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-500">
                      {getSettingDescription(key as keyof SecuritySettings)}
                    </p>
                  </div>
                  <Switch 
                    checked={value} 
                    onCheckedChange={() => handleSettingToggle(key as keyof SecuritySettings)} 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Vulnerabilities</CardTitle>
                <CardDescription>
                  {scanResult 
                    ? `Last scan completed on ${formatTimestamp(scanResult.timestamp)}` 
                    : 'No scan results available'}
                </CardDescription>
              </div>
              <Button 
                onClick={runScan} 
                disabled={isScanning}
                size="sm"
              >
                {isScanning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Run New Scan
              </Button>
            </CardHeader>
            <CardContent>
              {!scanResult && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No scan results available</h3>
                  <p className="text-sm text-muted-foreground">
                    Run a security scan to identify potential vulnerabilities.
                  </p>
                </div>
              )}

              {scanResult && scanResult.totalIssues === 0 && (
                <div className="text-center py-12">
                  <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No vulnerabilities detected</h3>
                  <p className="text-sm text-muted-foreground">
                    Your application is secure based on the latest scan.
                  </p>
                </div>
              )}

              {scanResult && scanResult.totalIssues > 0 && (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {scanResult.vulnerabilities.map((vuln) => (
                      <div 
                        key={vuln.id} 
                        className={`p-4 rounded-lg border ${getSeverityColor(vuln.severity)}`}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-medium flex items-center">
                            {getVulnerabilityIcon(vuln.severity)}
                            <span className="ml-2">{vuln.description}</span>
                            {renderSeverityBadge(vuln.severity)}
                          </h3>
                        </div>
                        {vuln.location && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Location:</span> {vuln.location}
                          </p>
                        )}
                        {vuln.recommendation && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Recommendation:</span> {vuln.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Activity Log</CardTitle>
              <CardDescription>
                Recent security events and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!stats || !stats.recentEvents || stats.recentEvents.length === 0) && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No security events recorded</h3>
                  <p className="text-sm text-muted-foreground">
                    Security events will appear here as they occur.
                  </p>
                </div>
              )}

              {stats && stats.recentEvents && stats.recentEvents.length > 0 && (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {stats.recentEvents.map((event, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-medium flex items-center">
                            {getEventIcon(event.type)}
                            <span className="ml-2">{event.type}</span>
                          </h3>
                          <span className="text-xs text-gray-500">
                            {event.timestamp ? formatTimestamp(event.timestamp) : 'Unknown time'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {event.setting && (
                            <p className="text-sm">
                              <span className="font-medium">Setting:</span> {event.setting}
                            </p>
                          )}
                          {event.ip && (
                            <p className="text-sm">
                              <span className="font-medium">IP:</span> {event.ip}
                            </p>
                          )}
                          {event.path && (
                            <p className="text-sm">
                              <span className="font-medium">Path:</span> {event.path}
                            </p>
                          )}
                          {event.method && (
                            <p className="text-sm">
                              <span className="font-medium">Method:</span> {event.method}
                            </p>
                          )}
                          {event.userRole && (
                            <p className="text-sm">
                              <span className="font-medium">User Role:</span> {event.userRole}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
function getSettingDescription(setting: keyof SecuritySettings): string {
  const descriptions: Record<keyof SecuritySettings, string> = {
    CONTENT_SECURITY_POLICY: 'Restrict which resources can be loaded by the browser',
    HTTPS_ENFORCEMENT: 'Redirect all HTTP requests to HTTPS',
    AUDIO_DOWNLOAD_PROTECTION: 'Prevent unauthorized downloads of audio content',
    ADVANCED_BOT_PROTECTION: 'Advanced protection against automated bot attacks',
    TWO_FACTOR_AUTHENTICATION: 'Require two-factor authentication for admin access',
    RATE_LIMITING: 'Limit the number of requests from a single IP address',
    CSRF_PROTECTION: 'Protect against Cross-Site Request Forgery attacks',
    XSS_PROTECTION: 'Filter malicious scripts in user input',
    SQL_INJECTION_PROTECTION: 'Prevent SQL injection attacks in database queries'
  };
  
  return descriptions[setting] || 'Configure this security setting';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'border-red-200 bg-red-50';
    case 'high':
      return 'border-orange-200 bg-orange-50';
    case 'medium':
      return 'border-yellow-200 bg-yellow-50';
    case 'low':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-gray-200';
  }
}

function getVulnerabilityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'high':
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'medium':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'low':
      return <AlertTriangle className="h-5 w-5 text-blue-600" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
}

function getEventIcon(type: string) {
  if (type.includes('UNAUTHORIZED')) {
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  }
  
  if (type.includes('LOGIN') || type.includes('AUTH')) {
    return <Lock className="h-5 w-5 text-blue-500" />;
  }
  
  if (type.includes('SCAN')) {
    return <Shield className="h-5 w-5 text-green-500" />;
  }
  
  if (type.includes('SETTING')) {
    return <Settings className="h-5 w-5 text-purple-500" />;
  }
  
  return <Activity className="h-5 w-5 text-gray-500" />;
}

export default SecurityDashboard;