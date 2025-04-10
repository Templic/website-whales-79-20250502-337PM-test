/**
 * use-auth.tsx
 * 
 * A hook that provides authentication context and user information.
 * This is a simplified mock version for demonstration purposes.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define User type
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  isBanned: boolean;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

// Define Auth Context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: 'user' | 'admin' | 'super_admin') => void; // Demo function to change roles
}

// Create Auth Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  setRole: () => {}, // Demo function to change roles
});

// Mock users for demonstration
const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin' as const,
    isBanned: false,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
  },
  superadmin: {
    id: 2,
    username: 'superadmin',
    email: 'superadmin@example.com',
    role: 'super_admin' as const,
    isBanned: false,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
  },
  user: {
    id: 3,
    username: 'user',
    email: 'user@example.com',
    role: 'user' as const,
    isBanned: false,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
  }
};

// Auth Provider Component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, you would fetch the user from the server
        // For demo, let's default to admin role
        setUser(mockUsers.admin);
        setIsLoading(false);
      } catch (error) {
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Mock login logic
      if (username === 'admin' && password === 'admin123') {
        setUser(mockUsers.admin);
        return true;
      } else if (username === 'superadmin' && password === 'superadmin123') {
        setUser(mockUsers.superadmin);
        return true;
      } else if (username === 'user' && password === 'user123') {
        setUser(mockUsers.user);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
  };
  
  // Demo function to switch roles (for testing purposes)
  const setRole = (role: 'user' | 'admin' | 'super_admin') => {
    if (role === 'admin') {
      setUser(mockUsers.admin);
    } else if (role === 'super_admin') {
      setUser(mockUsers.superadmin);
    } else {
      setUser(mockUsers.user);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout,
        setRole 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use Auth context
export const useAuth = () => useContext(AuthContext);

export default useAuth;