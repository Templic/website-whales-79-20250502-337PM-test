/**
 * use-auth.ts
 * 
 * Authentication hook and context for managing user state and authentication actions.
 */

import React from 'react';
import { createContext, useState, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  isAuthenticated: false,
};

// Create the auth context
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Auth provider component
export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      console.log(`Login attempt for: ${email}`);
      
      // For demo purposes, simulate a successful login
      setTimeout(() => {
        const mockUser: User = {
          id: '123',
          email: email,
          role: 'user'
        };
        
        setUser(mockUser);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Authentication failed');
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      console.log(`Registration attempt for: ${email}`);
      
      // For demo purposes, simulate a successful registration
      setTimeout(() => {
        const mockUser: User = {
          id: '456',
          email: email,
          role: 'user'
        };
        
        setUser(mockUser);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Registration failed');
      setIsLoading(false);
    }
  };

  // Create context value object
  const contextValue: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user
  };

  // Return the provider with context value and children
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    props.children
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;