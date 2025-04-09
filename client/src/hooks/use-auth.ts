/**
 * Mock Auth Hook
 * Provides a simple authentication context for demos
 */

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
}

// Simple mock implementation
export const useMockAuth = () => {
  // Return mock auth object with properly typed user
  return {
    user: null as User | null,
    login: async () => { console.log('Mock login called') },
    logout: () => { console.log('Mock logout called') },
    isLoading: false,
    error: null
  }
}

// Re-export functionality from the actual auth context
export { useAuth, AuthProvider } from './use-auth.tsx';