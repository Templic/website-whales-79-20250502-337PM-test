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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ShieldCheck, 
  Settings, 
  LockKeyhole, 
  FileKey, 
  Server, 
  Key, 
  UserCheck, 
  Lock, 
  Activity, 
  Filter, 
  RefreshCw,
  Undo,
  PlugZap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from '@/components/ui/skeleton';

// Define security mode enum
enum SecurityMode {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  HIGH = 'HIGH',
  MAXIMUM = 'MAXIMUM'
}

// Define security features interface
interface SecurityFeatures {
  quantumResistance: boolean;
  mlAnomalyDetection: boolean;
  blockchainLogging: boolean;
  mfa: boolean;
  csrf: boolean;
  inputValidation: boolean;
  apiSecurity: boolean;
  realTimeMonitoring: boolean;
  bruteForceProtection: boolean;
  rateLimiting: boolean;
  deepScanning: boolean;
}

// Define security configuration interface
interface SecurityConfiguration {
  mode: SecurityMode;
  features: SecurityFeatures;
}

// Define configuration history entry interface
interface ConfigHistoryEntry {
  id: string;
  timestamp: number;
  userId: string;
  previousMode: SecurityMode;
  newMode: SecurityMode;
  changedFeatures?: Partial<Record<keyof SecurityFeatures, boolean>>;
}

// Define feature categories for UI organization
const featureCategories = {
  Authentication: [
    { name: 'mfa', label: 'Multi-Factor Authentication', icon: <Lock className="w-4 h-4" /> },
    { name: 'bruteForceProtection', label: 'Brute Force Protection', icon: <Shield className="w-4 h-4" /> }
  ],
  'API & Input': [
    { name: 'csrf', label: 'CSRF Protection', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'inputValidation', label: 'Input Validation', icon: <Filter className="w-4 h-4" /> },
    { name: 'apiSecurity', label: 'API Security', icon: <Key className="w-4 h-4" /> },
    { name: 'rateLimiting', label: 'Rate Limiting', icon: <Activity className="w-4 h-4" /> }
  ],
  'Data & Privacy': [
    { name: 'quantumResistance', label: 'Quantum-Resistant Encryption', icon: <FileKey className="w-4 h-4" /> },
    { name: 'blockchainLogging', label: 'Blockchain Audit Logging', icon: <LockKeyhole className="w-4 h-4" /> }
  ],
  'Monitoring & Detection': [
    { name: 'realTimeMonitoring', label: 'Real-Time Monitoring', icon: <Activity className="w-4 h-4" /> },
    { name: 'mlAnomalyDetection', label: 'ML Anomaly Detection', icon: <PlugZap className="w-4 h-4" /> },
    { name: 'deepScanning', label: 'Deep Scanning', icon: <Server className="w-4 h-4" /> }
  ]
};

// Helper function to get user-friendly mode descriptions
const getModeDescription = (mode: SecurityMode): string => {
  switch (mode) {
    case SecurityMode.BASIC:
      return 'Minimal security for development environments with standard protection mechanisms.';
    case SecurityMode.STANDARD:
      return 'Balanced security suitable for most applications with essential protection.';
    case SecurityMode.ENHANCED:
      return 'Higher security for applications with sensitive data, including advanced features.';
    case SecurityMode.HIGH:
      return 'Rigorous security for high-value applications with comprehensive protection.';
    case SecurityMode.MAXIMUM:
      return 'Maximum security with all available protections for critical applications.';
    default:
      return 'Unknown security mode.';
  }
};

// Helper function to get feature description
const getFeatureDescription = (featureName: keyof SecurityFeatures): string => {
  const descriptions: Record<keyof SecurityFeatures, string> = {
    quantumResistance: 'Uses quantum-resistant encryption algorithms for data at rest and in transit.',
    mlAnomalyDetection: 'Applies machine learning to detect unusual patterns and potential attacks.',
    blockchainLogging: 'Records security events and audit logs in an immutable blockchain-based storage.',
    mfa: 'Requires multiple factors of authentication for sensitive operations.',
    csrf: 'Protects against Cross-Site Request Forgery attacks on forms and API endpoints.',
    inputValidation: 'Enforces strict validation of all user inputs to prevent injection attacks.',
    apiSecurity: 'Applies deep inspection and validation of API requests and responses.',
    realTimeMonitoring: 'Provides continuous monitoring of security events with immediate alerts.',
    bruteForceProtection: 'Detects and blocks credential stuffing and brute force login attempts.',
    rateLimiting: 'Restricts the number of requests to prevent abuse and DoS attacks.',
    deepScanning: 'Performs comprehensive scanning of requests for malicious patterns.'
  };
  
  return descriptions[featureName] || 'No description available.';
};

export default function SecurityConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mode');
  
  // Fetch security configuration
  const { 
    data: securityConfig,
    isLoading: configLoading,
    isError: configError,
    error: configErrorDetails
  } = useQuery<SecurityConfiguration>({
    queryKey: ['/api/security/admin/config'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Fetch configuration history
  const { 
    data: configHistory,
    isLoading: historyLoading
  } = useQuery<ConfigHistoryEntry[]>({
    queryKey: ['/api/security/admin/config/history'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Set security mode mutation
  const setModeMutation = useMutation({
    mutationFn: async (newMode: SecurityMode) => {
      const response = await apiRequest('POST', '/api/security/admin/config/mode', { mode: newMode });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config/history'] });
      toast({
        title: 'Security mode updated',
        description: 'The security mode has been successfully updated.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update security mode',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Set security feature mutation
  const setFeatureMutation = useMutation({
    mutationFn: async ({ featureName, enabled }: { featureName: keyof SecurityFeatures, enabled: boolean }) => {
      const response = await apiRequest('POST', '/api/security/admin/config/feature', { featureName, enabled });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config/history'] });
      toast({
        title: 'Security feature updated',
        description: 'The security feature has been successfully updated.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update security feature',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Reset configuration mutation
  const resetConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/security/admin/config/reset', {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config/history'] });
      toast({
        title: 'Security configuration reset',
        description: 'The security configuration has been reset to defaults.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to reset security configuration',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Apply recommended configuration mutation
  const recommendedConfigMutation = useMutation({
    mutationFn: async (params: { systemSize: 'small' | 'medium' | 'large', sensitiveData: boolean, regulatory: boolean }) => {
      const response = await apiRequest('POST', '/api/security/admin/config/recommended', params);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config/history'] });
      toast({
        title: 'Recommended configuration applied',
        description: 'The recommended security configuration has been applied.',
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to apply recommended configuration',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });
  
  // Handle config error
  useEffect(() => {
    if (configError) {
      toast({
        title: 'Error fetching security configuration',
        description: `${configErrorDetails}`,
        variant: 'destructive'
      });
    }
  }, [configError, configErrorDetails, toast]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get security mode color
  const getSecurityModeColor = (mode: SecurityMode) => {
    switch (mode) {
      case SecurityMode.BASIC:
        return 'text-blue-500';
      case SecurityMode.STANDARD:
        return 'text-green-500';
      case SecurityMode.ENHANCED:
        return 'text-yellow-500';
      case SecurityMode.HIGH:
        return 'text-orange-500';
      case SecurityMode.MAXIMUM:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Handle mode change
  const handleModeChange = (mode: SecurityMode) => {
    setModeMutation.mutate(mode);
  };
  
  // Handle feature toggle
  const handleFeatureToggle = (featureName: keyof SecurityFeatures, enabled: boolean) => {
    setFeatureMutation.mutate({ featureName, enabled });
  };
  
  // Handle reset configuration
  const handleResetConfig = () => {
    if (window.confirm('Are you sure you want to reset the security configuration to defaults?')) {
      resetConfigMutation.mutate();
    }
  };
  
  // Handle apply recommended configuration
  const handleApplyRecommended = (systemSize: 'small' | 'medium' | 'large', sensitiveData: boolean, regulatory: boolean) => {
    recommendedConfigMutation.mutate({ systemSize, sensitiveData, regulatory });
  };
  
  // Loading state
  if (configLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Security Configuration</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <Tabs defaultValue="mode">
          <TabsList className="mb-4">
            <TabsTrigger value="mode">
              <Shield className="h-4 w-4 mr-2" />
              Security Mode
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="history">
              <Activity className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="mode">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-1/3" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-full" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-6 w-1/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Security Configuration</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config'] });
            queryClient.invalidateQueries({ queryKey: ['/api/security/admin/config/history'] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="mode" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="mode">
            <Shield className="h-4 w-4 mr-2" />
            Security Mode
          </TabsTrigger>
          <TabsTrigger value="features">
            <Settings className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="history">
            <Activity className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
        
        {securityConfig && (
          <>
            {/* Security Mode Tab */}
            <TabsContent value="mode">
              <Card>
                <CardHeader>
                  <CardTitle>Security Mode</CardTitle>
                  <CardDescription>
                    Select the security mode that best fits your application's needs.
                    Higher security modes enable more protective features but may impact performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label htmlFor="security-mode" className="text-lg font-medium">Current Mode:</Label>
                      <span className={`font-bold text-lg ${getSecurityModeColor(securityConfig.mode)}`}>{securityConfig.mode}</span>
                    </div>
                    
                    <Select 
                      value={securityConfig.mode} 
                      onValueChange={(value) => handleModeChange(value as SecurityMode)}
                    >
                      <SelectTrigger id="security-mode" className="w-full">
                        <SelectValue placeholder="Select a security mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SecurityMode).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            <div className="flex items-center">
                              <Shield className={`h-4 w-4 mr-2 ${getSecurityModeColor(mode)}`} />
                              <span>{mode}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      {getModeDescription(securityConfig.mode)}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Security Mode Comparison</h3>
                    
                    {Object.values(SecurityMode).map((mode) => (
                      <div 
                        key={mode} 
                        className={`border rounded-lg p-4 ${securityConfig.mode === mode ? 'border-primary bg-muted' : 'hover:bg-muted/50'}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className={`font-medium ${getSecurityModeColor(mode)}`}>{mode}</h4>
                          {securityConfig.mode === mode ? (
                            <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">Current</span>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleModeChange(mode)}
                              disabled={setModeMutation.isPending}
                            >
                              Select
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{getModeDescription(mode)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handleResetConfig}
                    disabled={resetConfigMutation.isPending}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  
                  <Button 
                    onClick={() => handleApplyRecommended('medium', true, false)}
                    disabled={recommendedConfigMutation.isPending}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Apply Recommended
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Security Features Tab */}
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Security Features</CardTitle>
                  <CardDescription>
                    Enable or disable individual security features. Note that changing the security
                    mode will automatically adjust these features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(featureCategories).map(([category, features]) => (
                    <div key={category} className="mb-8">
                      <h3 className="text-lg font-medium mb-4">{category}</h3>
                      <div className="space-y-4">
                        {features.map(({ name, label, icon }) => (
                          <div 
                            key={name} 
                            className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-muted p-2 rounded-full">
                                {icon}
                              </div>
                              <div>
                                <Label htmlFor={`feature-${name}`} className="font-medium">
                                  {label}
                                </Label>
                                <p className="text-xs text-muted-foreground max-w-md">
                                  {getFeatureDescription(name as keyof SecurityFeatures)}
                                </p>
                              </div>
                            </div>
                            <Switch 
                              id={`feature-${name}`}
                              checked={securityConfig.features[name as keyof SecurityFeatures]}
                              onCheckedChange={(checked) => handleFeatureToggle(name as keyof SecurityFeatures, checked)}
                              disabled={setFeatureMutation.isPending}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleResetConfig}
                    disabled={resetConfigMutation.isPending}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Reset All Features to Default
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Configuration History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration History</CardTitle>
                  <CardDescription>
                    Recent changes to the security configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                          <Skeleton className="h-14 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : !configHistory || configHistory.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No configuration history available
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {configHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 border rounded-md"
                        >
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">
                              Mode: {entry.previousMode} → {entry.newMode}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          
                          {entry.changedFeatures && Object.keys(entry.changedFeatures).length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">Changed Features:</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                {Object.entries(entry.changedFeatures).map(([feature, enabled]) => (
                                  <div key={feature} className="text-xs">
                                    <span className="font-medium">{feature}:</span>{' '}
                                    <span className={enabled ? 'text-green-500' : 'text-red-500'}>
                                      {enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            Changed by User ID: {entry.userId}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}