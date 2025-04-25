/**
 * use-auth.tsx
 * 
 * A hook that provides JWT authentication context and user information.
 * This implements secure JWT authentication with automatic token refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

// Define User type with proper typing matching the schema.ts definition
export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'user' | 'admin' | 'super_admin';
  isBanned: boolean;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  lastLogin?: Date | string | null;
  createdAt: Date | string | null;
  updatedAt?: Date | string | null;
}

// Define token response interface
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Define Auth Context type with stronger typing
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
  getCsrfToken: () => Promise<string>;
  
  // Extended AuthContext functionality for 2FA support
  requires2FA?: boolean;
  setUser: (user: User) => void;
  clearRequires2FA: () => void;
  setRequires2FA: (value: boolean) => void;
  verify2FAMutation?: any;
  verifyBackupCodeMutation?: any;
}

// Create Auth Context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
  refreshToken: async () => false,
  getAccessToken: () => null,
  getCsrfToken: async () => '',
  requires2FA: false,
  setUser: () => {},
  clearRequires2FA: () => {},
  setRequires2FA: () => {},
  verify2FAMutation: undefined,
  verifyBackupCodeMutation: undefined
});

// JWT token storage keys
const ACCESS_TOKEN_KEY = 'cosmic_access_token';
const REFRESH_TOKEN_KEY = 'cosmic_refresh_token';
const USER_DATA_KEY = 'cosmic_user_data';
let csrfToken: string | null = null;

// Auth Provider Component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Create axios instance with interceptors
  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add CSRF token if available
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If error is 401 and we haven't tried to refresh the token already
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshed = await refreshToken();
          if (refreshed) {
            // Update the token in the original request
            const token = localStorage.getItem(ACCESS_TOKEN_KEY);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, logout
          await logout();
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  // Function to get CSRF token
  const getCsrfToken = useCallback(async (): Promise<string> => {
    if (csrfToken) return csrfToken;
    
    try {
      const response = await axios.get('/api/csrf-token');
      const token = response.data.csrfToken;
      csrfToken = token;
      return token;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      return '';
    }
  }, []);
  
  // Get the current access token
  const getAccessToken = useCallback((): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have user data in either localStorage (for persistent login)
        // or sessionStorage (for current session only)
        const storedUserData = localStorage.getItem(USER_DATA_KEY) || 
                                sessionStorage.getItem('currentUser');
        
        if (!storedUserData) {
          // No user data found
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Check if 2FA is required from previous login
        const requires2FA = sessionStorage.getItem('requires2FA') === 'true';
        if (requires2FA) {
          setRequires2FA(true);
          setIsLoading(false);
          return;
        }
        
        try {
          // Parse stored user data
          const userData = JSON.parse(storedUserData) as User;
          
          // Set user state directly from stored data
          setUser(userData);
          
          // Optional: you can still verify with the server if needed
          // await api.get('/api/auth/user');
        } catch (error) {
          console.error('Failed to parse user data:', error);
          // Clear invalid data
          localStorage.removeItem(USER_DATA_KEY);
          sessionStorage.removeItem('currentUser');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Get CSRF token first, then check auth
    getCsrfToken().then(checkAuth);
  }, []);
  
  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        return false;
      }
      
      // Request new tokens
      const response = await axios.post<TokenResponse>('/api/auth/refresh', { refreshToken });
      
      // Store new tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // First get a CSRF token
      await getCsrfToken();
      
      // Attempt login
      const response = await api.post<{user: User} & TokenResponse>('/auth/login', {
        username,
        password
      });
      
      // Store tokens and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
      
      // Update state
      setUser(response.data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.data.user.username}!`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Authentication failed. Please check your credentials.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Get CSRF token for the request
      await getCsrfToken();
      
      // Send logout request to revoke refresh token
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data regardless of request success
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      setUser(null);
    }
  };
  
  // Add 2FA related state
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  
  // Function to clear 2FA requirement
  const clearRequires2FA = useCallback(() => {
    setRequires2FA(false);
    sessionStorage.removeItem('requires2FA');
  }, []);
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout,
        refreshToken,
        getAccessToken,
        getCsrfToken,
        
        // 2FA related properties
        requires2FA,
        setRequires2FA,
        clearRequires2FA,
        setUser,
        // These are optional and might be implemented later
        verify2FAMutation: undefined,
        verifyBackupCodeMutation: undefined
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use Auth context with proper error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;