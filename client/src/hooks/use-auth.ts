/**
 * use-auth.ts
 * 
 * Dummy authentication hook that will be implemented properly in the future.
 * This exists only to make TypeScript happy in the MainHeader component.
 */

// Define user interface
export interface User {
  id: string;
  name?: string;
  email?: string;
  role?: 'user' | 'admin' | 'super_admin';
  avatar?: string;
}

// Define return type for useAuth hook
export interface AuthReturn {
  user: User | null;
  loading: boolean;
  isLoading: boolean; // Added for compatibility with protected-route.tsx
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Simple dummy auth hook that returns null values
 */
export function useAuth(): AuthReturn {
  // Return dummy values
  return {
    user: null,
    loading: false,
    isLoading: false, // Added to match interface
    error: null,
    login: async () => {},
    register: async () => {},
    logout: async () => {}
  };
}

/**
 * Dummy provider that does nothing but return children
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};