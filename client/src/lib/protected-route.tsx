import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Authentication control - set to false for production
const BYPASS_AUTHENTICATION = false;

// Define roles and their hierarchy
export type UserRole = 'user' | 'admin' | 'super_admin';

const roleHierarchy: Record<UserRole, number> = {
  'user': 0,
  'admin': 1,
  'super_admin': 2
};

export function ProtectedRoute({
  path,
  component: Component,
  children,
  requiredRole = 'user',
}: {
  path: string;
  component?: () => React.JSX.Element;
  children?: (params: any) => React.ReactNode;
  requiredRole?: UserRole;
}) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // For testing - bypass authentication check
  if (BYPASS_AUTHENTICATION) {
    return Component ? 
      <Route path={path} component={Component} /> : 
      <Route path={path}>{children}</Route>;
  }

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has sufficient role permissions
  const userRoleLevel = roleHierarchy[user.role as UserRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  if (userRoleLevel < requiredRoleLevel) {
    return (
      <Route path={path}>
        {() => {
          // Show toast notification about insufficient permissions
          toast({
            title: "Access Denied",
            description: "You don't have the required permissions to access this page.",
            variant: "destructive"
          });
          
          // Redirect to appropriate page based on user role
          return <Redirect to="/portal" />;
        }}
      </Route>
    );
  }

  return Component ? 
    <Route path={path} component={Component} /> : 
    <Route path={path}>{children}</Route>;
}
