/**
 * JWT Authentication Example Component
 * 
 * This component demonstrates how to use the JWT authentication system
 * with proper CSRF protection in a production-ready way.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Info, 
  PencilLine, 
  LogOut, 
  LogIn, 
  Shield, 
  Layers
} from 'lucide-react';

export function JwtAuthExample() {
  const { user, isAuthenticated, isLoading, login, logout, getCsrfToken, getAccessToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch CSRF token on load
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await getCsrfToken();
        setCsrfToken(token);
      } catch (err) {
        console.error('Failed to get CSRF token:', err);
        setError('Failed to get CSRF token');
      }
    };
    
    fetchCsrfToken();
  }, [getCsrfToken]);
  
  // Update access token when auth state changes
  useEffect(() => {
    setAccessToken(getAccessToken());
  }, [isAuthenticated, getAccessToken]);
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setApiResponse(null);
    
    try {
      const success = await login(username, password);
      if (success) {
        setPassword(''); // Clear password field after successful login
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    setError(null);
    setApiResponse(null);
    
    try {
      await logout();
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };
  
  // Example of making an authenticated API request
  const makeAuthenticatedRequest = async () => {
    setError(null);
    setApiResponse(null);
    
    try {
      // Get fresh CSRF token for the request
      const csrfToken = await getCsrfToken();
      
      const response = await fetch('/api/protected-resource', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'API request failed');
    }
  };
  
  // Example of making a protected mutation
  const handleProtectedAction = async () => {
    setError(null);
    setApiResponse(null);
    
    try {
      // Get fresh CSRF token for the request
      const csrfToken = await getCsrfToken();
      
      const response = await fetch('/api/protected-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'example-action',
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Protected action failed: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Protected action failed');
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-2">Loading authentication state...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          JWT Authentication Example
        </CardTitle>
        <CardDescription>
          This demonstrates how to use JWT authentication with CSRF protection
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {apiResponse && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">API Response:</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">
              {apiResponse}
            </pre>
          </div>
        )}
        
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </form>
        ) : (
          <Tabs defaultValue="user">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="user">User Info</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user" className="space-y-4">
              <div className="rounded border p-3">
                <div className="font-medium">Logged in as: {user?.username}</div>
                <div className="text-sm text-muted-foreground">Role: {user?.role}</div>
                <div className="text-sm text-muted-foreground">Email: {user?.email}</div>
                {user?.lastLogin && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Last login: {new Date(user.lastLogin).toLocaleString()}
                  </div>
                )}
              </div>
              
              <Button variant="outline" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4">
              <Button 
                onClick={makeAuthenticatedRequest} 
                variant="outline" 
                className="w-full"
              >
                <Info className="mr-2 h-4 w-4" />
                Make Authenticated GET Request
              </Button>
              
              <Button 
                onClick={handleProtectedAction} 
                variant="default" 
                className="w-full"
              >
                <Pencil1Icon className="mr-2" />
                Make Protected POST Action
              </Button>
            </TabsContent>
            
            <TabsContent value="tokens" className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <span>CSRF Token</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCsrfToken(null)} 
                    className="h-6 ml-2" 
                    title="Refresh CSRF Token"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  </Button>
                </Label>
                <div className="flex items-center">
                  <Input 
                    value={csrfToken || ''} 
                    readOnly 
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>JWT Access Token</Label>
                <div>
                  {showTokens ? (
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {accessToken || 'No token available'}
                    </pre>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowTokens(true)} 
                      className="w-full"
                    >
                      <StackIcon className="mr-2" />
                      Show Token
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div>CSRF Protection Enabled</div>
        <div>Using JWT with Refresh Token</div>
      </CardFooter>
    </Card>
  );
}

export default JwtAuthExample;