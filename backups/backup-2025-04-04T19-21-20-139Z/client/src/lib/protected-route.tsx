import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Authentication control - set to false for production
const BYPASS_AUTHENTICATION = false;

export function ProtectedRoute({
  path,
  component: Component,
  children,
}: {
  path: string;
  component?: () => React.JSX.Element;
  children?: (params$2 => React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

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

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return Component ? 
    <Route path={path} component={Component} /> : 
    <Route path={path}>{children}</Route>;
}
