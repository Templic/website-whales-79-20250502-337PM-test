import { useState, useEffect } from 'react';

// User interface representing the authenticated user's data
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
}

// Simple hook that provides auth functionality
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call to verify the user's session
        const storedUser = localStorage.getItem('cosmic_user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Authentication failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock login - in a real app, this would be an API call
      // Simulating a successful login with mock data
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: email,
        role: 'user',
        avatar: '/images/avatars/default.png',
        createdAt: new Date().toISOString(),
      };
      
      // Save user to localStorage for persistence
      localStorage.setItem('cosmic_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock registration - in a real app, this would be an API call
      // Simulating a successful registration with mock data
      const mockUser: User = {
        id: '1',
        name: name,
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      
      // Save user to localStorage for persistence
      localStorage.setItem('cosmic_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('cosmic_user');
    setUser(null);
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call to initiate password reset
      // For now, we'll just simulate a successful request
      console.log(`Password reset requested for: ${email}`);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Failed to request password reset. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // In a real app, this would be an API call to reset the password
      // For now, we'll just simulate a successful request
      console.log(`Password reset with token: ${token}`);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to reset password. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };
}