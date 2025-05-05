/**
 * use-auth.ts
 * 
 * Authentication hook for managing user state and authentication actions.
 */

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export function useAuth() {
  // In a real implementation, this would check local storage or a token
  // This is a simplified version for compatibility
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
          name: 'Demo User',
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
          name: name,
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

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user
  };
}

export default useAuth;