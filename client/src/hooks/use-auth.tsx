import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  requires2FA: boolean;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  verify2FAMutation: UseMutationResult<SelectUser, Error, Verify2FAData>;
  verifyBackupCodeMutation: UseMutationResult<SelectUser, Error, VerifyBackupCodeData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  setup2FAMutation: UseMutationResult<any, Error, void>;
  activate2FAMutation: UseMutationResult<void, Error, Activate2FAData>;
  disable2FAMutation: UseMutationResult<void, Error, Disable2FAData>;
  regenerateBackupCodesMutation: UseMutationResult<any, Error, RegenerateBackupCodesData>;
  clearRequires2FA: () => void;
};

type LoginData = Pick<InsertUser, "username" | "password"> & {
  rememberMe?: boolean;
};

type Verify2FAData = {
  token: string;
};

type VerifyBackupCodeData = {
  backupCode: string;
};

type Activate2FAData = {
  token: string;
};

type Disable2FAData = {
  password: string;
};

type RegenerateBackupCodesData = {
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [requires2FA, setRequires2FA] = useState(false);
  
  // Define a custom query function to fix the TypeScript error with readonly arrays
  const userQueryFn = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || 'An error occurred');
      }
      
      return await response.json() as SelectUser;
    } catch (error) {
      if ((error as Error).message === 'Failed to fetch') {
        console.error('Network error when fetching current user');
      }
      return null;
    }
  };
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: userQueryFn,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest('POST', "/api/login", credentials);
    },
    onSuccess: (response: any) => {
      if (response.requires2FA) {
        // If 2FA is required, set the state but don't update the user data yet
        setRequires2FA(true);
        return;
      }
      
      // No 2FA required, update the user data
      const userData = response.user || response;
      queryClient.setQueryData(["/api/user"], userData);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (data: Verify2FAData) => {
      return await apiRequest('POST', "/api/auth/verify-2fa", data);
    },
    onSuccess: (response: SelectUser) => {
      // 2FA verification complete, update user data
      queryClient.setQueryData(["/api/user"], response);
      setRequires2FA(false);
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyBackupCodeMutation = useMutation({
    mutationFn: async (data: VerifyBackupCodeData) => {
      return await apiRequest('POST', "/api/auth/verify-backup-code", data);
    },
    onSuccess: (response: SelectUser) => {
      // Backup code verification complete, update user data
      queryClient.setQueryData(["/api/user"], response);
      setRequires2FA(false);
      
      // Check if the response includes the count of remaining backup codes
      const backupCodesRemaining = response.backupCodes?.length || 0;
      
      toast({
        title: "Backup Code Used",
        description: `You have ${backupCodesRemaining} backup codes remaining.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Backup Code Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      return await apiRequest('POST', "/api/auth/register", credentials);
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', "/api/auth/setup-2fa");
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activate2FAMutation = useMutation({
    mutationFn: async (data: Activate2FAData) => {
      return await apiRequest('POST', "/api/auth/activate-2fa", data);
    },
    onSuccess: () => {
      // Refresh user data to reflect 2FA status
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "2FA Activated",
        description: "Two-factor authentication has been enabled for your account",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "2FA Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (data: Disable2FAData) => {
      return await apiRequest('POST', "/api/auth/disable-2fa", data);
    },
    onSuccess: () => {
      // Refresh user data to reflect 2FA status
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Disable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateBackupCodesMutation = useMutation({
    mutationFn: async (data: RegenerateBackupCodesData) => {
      return await apiRequest('POST', "/api/auth/backup-codes/regenerate", data);
    },
    onSuccess: (response: { backupCodes: string[] }) => {
      toast({
        title: "Backup Codes Regenerated",
        description: "New backup codes have been generated for your account",
        variant: "default",
      });
      
      return response;
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Regenerate Backup Codes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearRequires2FA = () => {
    setRequires2FA(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        requires2FA,
        loginMutation,
        verify2FAMutation,
        verifyBackupCodeMutation,
        logoutMutation,
        registerMutation,
        setup2FAMutation,
        activate2FAMutation,
        disable2FAMutation,
        regenerateBackupCodesMutation,
        clearRequires2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
