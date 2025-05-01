import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  UserCheck, 
  UserX, 
  Shield, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  XCircle, 
  CheckCircle, 
  UsersRound, 
  Search, 
  LogOut, 
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

// User interfaces
interface UserBase {
  id: string;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
  lastLogin?: number;
  createdAt: number;
}

// User security status
interface UserSecurityStatus {
  user: UserBase;
  security: {
    mfaEnabled: boolean;
    accountLocked: boolean;
    sessionCount: number;
    suspiciousActivity: boolean;
    lastSecurityIncident?: number;
    securityScore: number;
  };
}

// Detailed user security info
interface UserSecurityDetails {
  userId: string;
  mfa: {
    enabled: boolean;
    verified: boolean;
    setupDate?: number;
    recoveryCodes?: {
      count: number;
      unused: number;
    };
  };
  accountStatus: {
    locked: boolean;
    failedLoginAttempts: number;
    lockReason?: string;
    lockTime?: number;
  };
  sessionInfo: {
    activeSessions: number;
    lastLoginTime?: number;
    lastLoginIP?: string;
    lastUserAgent?: string;
  };
  permissions: string[];
  securityIncidents: {
    total: number;
    recent: Array<{
      type: string;
      timestamp: number;
      description: string;
      severity: string;
    }>;
  };
  recentActivity: Array<{
    action: string;
    timestamp: number;
    resource: string;
    details?: any;
  }>;
}

export default function UserSecurityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);

  // Fetch users with security status
  const { 
    data: usersWithSecurity, 
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorDetails,
    refetch: refetchUsers
  } = useQuery<UserSecurityStatus[]>({
    queryKey: ['/api/security/admin/users'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch detailed security info for a specific user
  const { 
    data: userSecurityDetails, 
    isLoading: detailsLoading,
    isError: detailsError,
    error: detailsErrorDetails,
    refetch: refetchDetails
  } = useQuery<UserSecurityDetails>({
    queryKey: ['/api/security/admin/users', selectedUserId],
    enabled: !!selectedUserId,
    refetchInterval: 30000 // Refresh every 30 seconds when open
  });

  // Reset MFA mutation
  const resetMfaMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/security/admin/users/${userId}/mfa/reset`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'MFA reset successful',
        description: 'Multi-Factor Authentication has been reset for this user.',
        variant: 'default'
      });
      refetchUsers();
      if (selectedUserId) {
        refetchDetails();
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to reset MFA',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });

  // Unlock account mutation
  const unlockAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/security/admin/users/${userId}/unlock`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account unlocked',
        description: 'The user account has been unlocked successfully.',
        variant: 'default'
      });
      refetchUsers();
      if (selectedUserId) {
        refetchDetails();
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to unlock account',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });

  // Enforce MFA mutation
  const enforceMfaMutation = useMutation({
    mutationFn: async ({ userId, enforce }: { userId: string, enforce: boolean }) => {
      const response = await apiRequest('POST', `/api/security/admin/users/${userId}/mfa/enforce`, { enforce });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'MFA enforcement updated',
        description: 'The MFA enforcement setting has been updated successfully.',
        variant: 'default'
      });
      refetchUsers();
      if (selectedUserId) {
        refetchDetails();
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to update MFA enforcement',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });

  // Terminate sessions mutation
  const terminateSessionsMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/security/admin/users/${userId}/sessions/terminate`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sessions terminated',
        description: 'All active sessions for this user have been terminated.',
        variant: 'default'
      });
      refetchUsers();
      if (selectedUserId) {
        refetchDetails();
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to terminate sessions',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  });

  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Filter users based on search term
  const filteredUsers = usersWithSecurity?.filter(({ user }) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  });

  // Select user and open details
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailsOpen(true);
  };

  // Handle detailed security view close
  const handleDetailsClose = () => {
    setIsUserDetailsOpen(false);
  };

  // Get security score color
  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get security score background
  const getSecurityScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Handle reset MFA
  const handleResetMfa = (userId: string) => {
    if (window.confirm('Are you sure you want to reset MFA for this user? They will need to set it up again.')) {
      resetMfaMutation.mutate(userId);
    }
  };

  // Handle unlock account
  const handleUnlockAccount = (userId: string) => {
    unlockAccountMutation.mutate(userId);
  };

  // Handle enforce MFA
  const handleEnforceMfa = (userId: string, enforce: boolean) => {
    enforceMfaMutation.mutate({ userId, enforce });
  };

  // Handle terminate sessions
  const handleTerminateSessions = (userId: string) => {
    if (window.confirm('Are you sure you want to terminate all active sessions for this user?')) {
      terminateSessionsMutation.mutate(userId);
    }
  };

  // Loading state
  if (usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">User Security Management</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <Input type="text" placeholder="Search users..." disabled />
          <Button type="submit" disabled>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users Security Status</CardTitle>
            <CardDescription>
              Manage security settings for individual users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">User Security Management</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            refetchUsers();
            if (selectedUserId) {
              refetchDetails();
            }
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
        <Input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline" onClick={() => setSearchTerm('')}>
          {searchTerm ? <XCircle className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users Security Status</CardTitle>
          <CardDescription>
            Manage security settings for individual users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersError ? (
            <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
              <p className="font-medium">Error fetching users data</p>
              <p className="text-sm">{String(usersErrorDetails)}</p>
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersRound className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>{searchTerm ? 'No users found matching search criteria' : 'No users found'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Security Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(({ user, security }) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <Badge variant="outline" className="mt-1 w-fit">{user.role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getSecurityScoreBg(security.securityScore)}`}
                        >
                          {security.securityScore}
                        </div>
                        <div className="text-sm font-medium">Security Score</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {security.mfaEnabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Fingerprint className="h-3 w-3 mr-1" />
                            MFA Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Fingerprint className="h-3 w-3 mr-1" />
                            No MFA
                          </Badge>
                        )}
                        
                        {security.accountLocked ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Unlock className="h-3 w-3 mr-1" />
                            Unlocked
                          </Badge>
                        )}
                        
                        {security.suspiciousActivity && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            Suspicious Activity
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleUserSelect(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Security Details
                        </Button>
                        
                        {security.accountLocked && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full justify-start text-green-600 hover:text-green-700"
                            onClick={() => handleUnlockAccount(user.id)}
                            disabled={unlockAccountMutation.isPending}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Account
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleTerminateSessions(user.id)}
                          disabled={terminateSessionsMutation.isPending}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Terminate Sessions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* User Security Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Security Details</DialogTitle>
            <DialogDescription>
              Detailed security information and management options
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
              
              <Skeleton className="h-6 w-1/3 mt-6 mb-2" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailsError ? (
            <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
              <p className="font-medium">Error fetching user security details</p>
              <p className="text-sm">{String(detailsErrorDetails)}</p>
            </div>
          ) : userSecurityDetails ? (
            <div className="space-y-6 py-4">
              <Tabs defaultValue="overview">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="overview">
                    <Shield className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="incidents">
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Security Incidents
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    <Activity className="h-4 w-4 mr-2" />
                    Recent Activity
                  </TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* MFA Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <div className="flex items-center">
                            <Fingerprint className="h-5 w-5 mr-2" />
                            Multi-Factor Authentication
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Status</Label>
                            <div>
                              {userSecurityDetails.mfa.enabled ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Enabled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Disabled
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {userSecurityDetails.mfa.enabled && (
                            <>
                              <div className="flex justify-between items-center">
                                <Label>Verified</Label>
                                <div>
                                  {userSecurityDetails.mfa.verified ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Yes
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      No
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <Label>Setup Date</Label>
                                <span className="text-sm">
                                  {userSecurityDetails.mfa.setupDate ? 
                                    formatTimestamp(userSecurityDetails.mfa.setupDate) : 
                                    'Unknown'
                                  }
                                </span>
                              </div>
                              
                              {userSecurityDetails.mfa.recoveryCodes && (
                                <div className="flex justify-between items-center">
                                  <Label>Recovery Codes</Label>
                                  <span className="text-sm">
                                    {userSecurityDetails.mfa.recoveryCodes.unused} unused of {userSecurityDetails.mfa.recoveryCodes.count}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetMfa(userSecurityDetails.userId)}
                          disabled={resetMfaMutation.isPending}
                        >
                          Reset MFA
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="enforce-mfa">Enforce MFA</Label>
                          <Switch 
                            id="enforce-mfa"
                            checked={false} // This would come from the user settings
                            onCheckedChange={(checked) => 
                              handleEnforceMfa(userSecurityDetails.userId, checked)
                            }
                            disabled={enforceMfaMutation.isPending}
                          />
                        </div>
                      </CardFooter>
                    </Card>
                    
                    {/* Account Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <div className="flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Account Status
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Lock Status</Label>
                            <div>
                              {userSecurityDetails.accountStatus.locked ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <Unlock className="h-3 w-3 mr-1" />
                                  Unlocked
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Label>Failed Login Attempts</Label>
                            <span className="text-sm">
                              {userSecurityDetails.accountStatus.failedLoginAttempts}
                            </span>
                          </div>
                          
                          {userSecurityDetails.accountStatus.locked && (
                            <>
                              {userSecurityDetails.accountStatus.lockReason && (
                                <div className="flex justify-between items-center">
                                  <Label>Lock Reason</Label>
                                  <span className="text-sm">
                                    {userSecurityDetails.accountStatus.lockReason}
                                  </span>
                                </div>
                              )}
                              
                              {userSecurityDetails.accountStatus.lockTime && (
                                <div className="flex justify-between items-center">
                                  <Label>Lock Time</Label>
                                  <span className="text-sm">
                                    {formatTimestamp(userSecurityDetails.accountStatus.lockTime)}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {userSecurityDetails.accountStatus.locked ? (
                          <Button
                            className="w-full"
                            onClick={() => handleUnlockAccount(userSecurityDetails.userId)}
                            disabled={unlockAccountMutation.isPending}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unlock Account
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Account Unlocked
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                    
                    {/* Sessions Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <div className="flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            Session Information
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>Active Sessions</Label>
                            <span className="text-sm font-medium">
                              {userSecurityDetails.sessionInfo.activeSessions}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Label>Last Login Time</Label>
                            <span className="text-sm">
                              {userSecurityDetails.sessionInfo.lastLoginTime ? 
                                formatTimestamp(userSecurityDetails.sessionInfo.lastLoginTime) : 
                                'Never'
                              }
                            </span>
                          </div>
                          
                          {userSecurityDetails.sessionInfo.lastLoginIP && (
                            <div className="flex justify-between items-center">
                              <Label>Last Login IP</Label>
                              <span className="text-sm">
                                {userSecurityDetails.sessionInfo.lastLoginIP}
                              </span>
                            </div>
                          )}
                          
                          {userSecurityDetails.sessionInfo.lastUserAgent && (
                            <div className="flex justify-between items-center">
                              <Label>Last User Agent</Label>
                              <span className="text-sm max-w-xs truncate">
                                {userSecurityDetails.sessionInfo.lastUserAgent}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant={userSecurityDetails.sessionInfo.activeSessions > 0 ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => handleTerminateSessions(userSecurityDetails.userId)}
                          disabled={terminateSessionsMutation.isPending || userSecurityDetails.sessionInfo.activeSessions === 0}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Terminate All Sessions
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Permissions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <div className="flex items-center">
                            <ShieldCheck className="h-5 w-5 mr-2" />
                            Security Permissions
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userSecurityDetails.permissions.length === 0 ? (
                          <p className="text-center py-2 text-muted-foreground">
                            No special permissions assigned
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {userSecurityDetails.permissions.map((permission) => (
                              <div 
                                key={permission} 
                                className="flex items-center p-2 border rounded-md"
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-sm">{permission}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Security Incidents Tab */}
                <TabsContent value="incidents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Incidents</CardTitle>
                      <CardDescription>
                        {userSecurityDetails.securityIncidents.total === 0 ? 
                          'No security incidents recorded for this user' : 
                          `${userSecurityDetails.securityIncidents.total} incident(s) recorded for this user`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userSecurityDetails.securityIncidents.total === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <ShieldCheck className="h-12 w-12 text-green-500 mb-4" />
                          <p className="text-center text-muted-foreground">
                            No security incidents recorded for this user
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userSecurityDetails.securityIncidents.recent.map((incident, index) => (
                            <Card key={index}>
                              <CardHeader className="py-3">
                                <CardTitle className="text-base flex items-center">
                                  <ShieldAlert className={`h-4 w-4 mr-2 ${
                                    incident.severity.toLowerCase() === 'high' ? 'text-red-500' : 
                                    incident.severity.toLowerCase() === 'medium' ? 'text-orange-500' : 
                                    'text-yellow-500'
                                  }`} />
                                  {incident.type}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="py-2">
                                <p className="text-sm">{incident.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatTimestamp(incident.timestamp)}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Recent Activity Tab */}
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Recent user actions and security-related events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userSecurityDetails.recentActivity.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-center text-muted-foreground">
                            No recent activity recorded for this user
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Resource</TableHead>
                              <TableHead>Timestamp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userSecurityDetails.recentActivity.map((activity, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{activity.action}</TableCell>
                                <TableCell>{activity.resource}</TableCell>
                                <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No user selected or user details not available
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDetailsClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}