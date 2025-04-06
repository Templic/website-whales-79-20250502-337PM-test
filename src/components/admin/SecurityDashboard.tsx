import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  FileWarning,
  FileLock2,
  UserCheck,
  Globe,
  Lock
} from "lucide-react";

interface SecuritySetting {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  recommended: boolean;
}

interface SecurityEvent {
  timestamp: string;
  type: string;
  [key: string]: any;
}

interface SecurityStats {
  total: number;
  byType: { [key: string]: number };
  bySetting: { [key: string]: number };
  recentEvents: SecurityEvent[];
}

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation?: string;
}

interface SecurityScanResult {
  timestamp: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  vulnerabilities: SecurityVulnerability[];
}

const SecurityDashboard: React.FC = () => {
  const [settings, setSettings] = useState<SecuritySetting[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [scanResults, setScanResults] = useState<SecurityScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [scanning, setScanning] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch security settings
      const settingsResponse = await axios.get('/api/security/settings');
      if (settingsResponse.data && settingsResponse.data.settings) {
        const settingsData = settingsResponse.data.settings;
        
        // Convert the object into an array of settings for easier rendering
        const settingsArray: SecuritySetting[] = Object.entries(settingsData).map(([key, value]) => ({
          key,
          name: formatSettingName(key),
          description: getSettingDescription(key),
          enabled: value as boolean,
          recommended: isRecommendedSetting(key)
        }));
        
        setSettings(settingsArray);
      }

      // Fetch security stats
      const statsResponse = await axios.get('/api/security/stats');
      if (statsResponse.data && statsResponse.data.stats) {
        setStats(statsResponse.data.stats);
      }

      // Fetch latest scan results
      const scanResponse = await axios.get('/api/security/scan/latest');
      if (scanResponse.data && scanResponse.data.result) {
        setScanResults(scanResponse.data.result);
      }
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Failed to fetch security data. You may not have sufficient permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    try {
      await axios.post('/api/security/settings/update', {
        setting: key,
        value: !currentValue
      });
      
      // Update local state
      setSettings(prevSettings => 
        prevSettings.map(setting => 
          setting.key === key 
            ? { ...setting, enabled: !currentValue } 
            : setting
        )
      );
      
      // Log to console for development
      console.log(`Setting ${key} toggled from ${currentValue} to ${!currentValue}`);
      
    } catch (err) {
      console.error('Error updating security setting:', err);
      setError('Failed to update security setting. You may not have sufficient permissions.');
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const response = await axios.post('/api/security/scan/run');
      if (response.data && response.data.result) {
        setScanResults(response.data.result);
      }
    } catch (err) {
      console.error('Error running security scan:', err);
      setError('Failed to run security scan. You may not have sufficient permissions.');
    } finally {
      setScanning(false);
    }
  };

  // Helper function to format setting keys to readable names
  const formatSettingName = (key: string): string => {
    return key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Helper function to get description for settings
  const getSettingDescription = (key: string): string => {
    const descriptions: {[key: string]: string} = {
      'CONTENT_SECURITY_POLICY': 'Controls allowed sources for various content types to prevent XSS attacks',
      'HTTPS_ENFORCEMENT': 'Forces all connections to use HTTPS instead of HTTP for secure data transmission',
      'AUDIO_DOWNLOAD_PROTECTION': 'Prevents unauthorized downloading of audio content through technical measures',
      'ADVANCED_BOT_PROTECTION': 'Uses patterns and behavior analysis to detect and block malicious bots',
      'TWO_FACTOR_AUTHENTICATION': 'Requires a second verification method in addition to password for login'
    };
    
    return descriptions[key] || 'No description available';
  };

  // Helper function to determine if a setting is recommended
  const isRecommendedSetting = (key: string): boolean => {
    const recommendedSettings = [
      'CONTENT_SECURITY_POLICY',
      'HTTPS_ENFORCEMENT',
      'TWO_FACTOR_AUTHENTICATION'
    ];
    
    return recommendedSettings.includes(key);
  };

  // Helper function to get color for vulnerability severity
  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical'): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Helper function to get icon for security event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'UNAUTHORIZED_ATTEMPT':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'SECURITY_SETTING_CHANGED':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'SECURITY_SCAN':
        return <FileWarning className="h-5 w-5 text-yellow-500" />;
      case 'LOGIN_SUCCESS':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'LOGIN_FAILURE':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'API_ACCESS_GRANTED':
        return <Globe className="h-5 w-5 text-blue-500" />;
      case 'API_ACCESS_DENIED':
        return <Lock className="h-5 w-5 text-orange-500" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-gray-500" />;
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate security score based on enabled recommended settings and vulnerabilities
  const calculateSecurityScore = (): number => {
    if (!settings.length || !scanResults) return 0;
    
    // Base score starts at 100
    let score = 100;
    
    // Deduct for each recommended setting that's disabled
    const recommendedSettings = settings.filter(s => s.recommended);
    const disabledRecommended = recommendedSettings.filter(s => !s.enabled);
    score -= (disabledRecommended.length / recommendedSettings.length) * 20;
    
    // Deduct for vulnerabilities based on severity
    if (scanResults) {
      score -= scanResults.criticalIssues * 15;
      score -= scanResults.highIssues * 10;
      score -= scanResults.mediumIssues * 5;
      score -= scanResults.lowIssues * 2;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Loading security information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-red-50 dark:bg-red-900/20">
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
            <XCircle className="mr-2 h-5 w-5" />
            Security Dashboard Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fetchSecurityData()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const securityScore = calculateSecurityScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
        <Button onClick={fetchSecurityData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerability Scan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Security Score</CardTitle>
                <CardDescription>
                  Overall security rating based on settings and vulnerabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative h-40 w-40">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle 
                        className="text-gray-200 dark:text-gray-800" 
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className={`${
                          securityScore >= 80 
                            ? 'text-green-500' 
                            : securityScore >= 60 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}
                        strokeWidth="10"
                        strokeDasharray={`${securityScore * 2.51} 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{securityScore}</span>
                    </div>
                  </div>
                  <p className={`text-lg font-medium ${
                    securityScore >= 80 
                      ? 'text-green-600 dark:text-green-400' 
                      : securityScore >= 60 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {
                      securityScore >= 80 
                        ? 'Good' 
                        : securityScore >= 60 
                          ? 'Needs Attention' 
                          : 'Critical Issues'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Status of security features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.slice(0, 3).map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {setting.enabled ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium truncate max-w-[150px]">
                          {setting.name}
                        </span>
                        {setting.recommended && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setActiveTab("settings")}
                >
                  View All Settings
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Vulnerability Summary</CardTitle>
                <CardDescription>
                  Results from latest security scan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scanResults ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Last scan: {formatDate(scanResults.timestamp)}</span>
                      <span className="font-semibold">{scanResults.totalIssues} issues</span>
                    </div>

                    <div className="space-y-2">
                      {scanResults.criticalIssues > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Badge className="bg-red-600 text-white mr-2">Critical</Badge>
                            <span>Critical Issues</span>
                          </span>
                          <span>{scanResults.criticalIssues}</span>
                        </div>
                      )}
                      {scanResults.highIssues > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Badge className="bg-orange-500 text-white mr-2">High</Badge>
                            <span>High Severity</span>
                          </span>
                          <span>{scanResults.highIssues}</span>
                        </div>
                      )}
                      {scanResults.mediumIssues > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Badge className="bg-yellow-500 text-black mr-2">Medium</Badge>
                            <span>Medium Severity</span>
                          </span>
                          <span>{scanResults.mediumIssues}</span>
                        </div>
                      )}
                      {scanResults.lowIssues > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Badge className="bg-blue-500 text-white mr-2">Low</Badge>
                            <span>Low Severity</span>
                          </span>
                          <span>{scanResults.lowIssues}</span>
                        </div>
                      )}
                      {scanResults.totalIssues === 0 && (
                        <div className="flex items-center justify-center py-4">
                          <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                          <span className="text-green-600">No issues detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-gray-500">No scan data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setActiveTab("vulnerabilities")}
                >
                  View Full Scan Results
                </Button>
              </CardFooter>
            </Card>
          </div>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Activity</CardTitle>
                <CardDescription>
                  Latest security events from your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                      <div className="pt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.type.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {event.setting && `Setting: ${event.setting}`}
                              {event.ip && ` • IP: ${event.ip}`}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!stats.recentEvents || stats.recentEvents.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No recent security events</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setActiveTab("events")}
                >
                  View All Security Events
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Feature Configuration</CardTitle>
              <CardDescription>
                Enable or disable security features for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {settings.map((setting) => (
                  <div key={setting.key} className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`setting-${setting.key}`} className="text-base font-medium">
                            {setting.name}
                          </Label>
                          {setting.recommended && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground pr-10">
                          {setting.description}
                        </p>
                      </div>
                      <Switch
                        id={`setting-${setting.key}`}
                        checked={setting.enabled}
                        onCheckedChange={() => handleToggleSetting(setting.key, setting.enabled)}
                      />
                    </div>
                    {setting.key === 'TWO_FACTOR_AUTHENTICATION' && !setting.enabled && (
                      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 ml-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              Two-factor authentication adds an important layer of security. 
                              We strongly recommend enabling this feature.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Log</CardTitle>
              <CardDescription>
                Detailed history of security-related events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="bg-gray-50 dark:bg-gray-800/50">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</p>
                        <p className="text-2xl font-bold mt-1">{stats.total}</p>
                      </CardContent>
                    </Card>
                    {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
                      <Card key={type} className="bg-gray-50 dark:bg-gray-800/50">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-2xl font-bold mt-1">{count}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-4 space-y-5">
                      {stats.recentEvents.map((event, index) => (
                        <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                          <div className="pt-1">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start flex-wrap">
                              <div>
                                <p className="font-medium">{event.type.replace(/_/g, ' ')}</p>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                                  {event.setting && (
                                    <p>Setting: <span className="font-medium">{event.setting}</span></p>
                                  )}
                                  {event.value !== undefined && (
                                    <p>New Value: <span className="font-medium">{String(event.value)}</span></p>
                                  )}
                                  {event.ip && (
                                    <p>IP Address: <span className="font-medium">{event.ip}</span></p>
                                  )}
                                  {event.userAgent && (
                                    <p>User Agent: <span className="font-medium">{event.userAgent}</span></p>
                                  )}
                                  {event.path && (
                                    <p>Path: <span className="font-medium">{event.path}</span></p>
                                  )}
                                  {event.userId && (
                                    <p>User ID: <span className="font-medium">{event.userId}</span></p>
                                  )}
                                  {event.userRole && (
                                    <p>User Role: <span className="font-medium">{event.userRole}</span></p>
                                  )}
                                  {event.totalIssues !== undefined && (
                                    <p>Issues Found: <span className="font-medium">{event.totalIssues}</span></p>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!stats.recentEvents || stats.recentEvents.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No security events recorded</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerability Scan Tab */}
        <TabsContent value="vulnerabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Security Vulnerability Scan</CardTitle>
                  <CardDescription>
                    Detailed report of security vulnerabilities in your application
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleRunScan} 
                  disabled={scanning}
                  className="ml-auto"
                >
                  {scanning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {scanning ? 'Scanning...' : 'Run New Scan'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scanResults ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Scan</p>
                      <p className="font-medium">{formatDate(scanResults.timestamp)}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 grid grid-cols-4 gap-4 sm:gap-6">
                      <div className="text-center">
                        <Badge className="bg-red-600 text-white font-bold mb-1">
                          {scanResults.criticalIssues}
                        </Badge>
                        <p className="text-xs">Critical</p>
                      </div>
                      <div className="text-center">
                        <Badge className="bg-orange-500 text-white font-bold mb-1">
                          {scanResults.highIssues}
                        </Badge>
                        <p className="text-xs">High</p>
                      </div>
                      <div className="text-center">
                        <Badge className="bg-yellow-500 text-black font-bold mb-1">
                          {scanResults.mediumIssues}
                        </Badge>
                        <p className="text-xs">Medium</p>
                      </div>
                      <div className="text-center">
                        <Badge className="bg-blue-500 text-white font-bold mb-1">
                          {scanResults.lowIssues}
                        </Badge>
                        <p className="text-xs">Low</p>
                      </div>
                    </div>
                  </div>

                  {scanResults.totalIssues > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <FileLock2 className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-medium">Vulnerability Details</h3>
                      </div>

                      <ScrollArea className="h-[400px] rounded-md border">
                        <div className="p-4 space-y-5">
                          {scanResults.vulnerabilities.map((vulnerability, index) => (
                            <div key={index} className="pb-4 border-b border-gray-200 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(vulnerability.severity)}>
                                  {vulnerability.severity.toUpperCase()}
                                </Badge>
                                <h4 className="font-medium">{vulnerability.id}</h4>
                              </div>
                              <p className="mt-2">{vulnerability.description}</p>
                              {vulnerability.location && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Location:</span> {vulnerability.location}
                                </p>
                              )}
                              {vulnerability.recommendation && (
                                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                                  <p className="text-sm text-blue-700 dark:text-blue-300">
                                    <span className="font-medium">Recommendation:</span> {vulnerability.recommendation}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-green-50 dark:bg-green-900/20">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                        No vulnerabilities detected
                      </h3>
                      <p className="mt-2 text-green-600 dark:text-green-300">
                        Your application passed all security checks
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileLock2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    No scan results available
                  </h3>
                  <p className="mt-2 text-gray-500 max-w-md mx-auto">
                    Run a security scan to check your application for vulnerabilities
                  </p>
                  <Button 
                    onClick={handleRunScan} 
                    disabled={scanning}
                    className="mt-4"
                  >
                    {scanning && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    {scanning ? 'Scanning...' : 'Run Security Scan'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;