import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// TEMPORARY FOR TESTING ONLY - REMOVE BEFORE DEPLOYMENT
const BYPASS_AUTHENTICATION = true;
const TEST_USER = {
  id: 2,
  username: "superadmin",
  email: "superadmin@example.com",
  role: "super_admin",
  createdAt: new Date()
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // For testing - bypass authentication check
  if (BYPASS_AUTHENTICATION) {
    return <Route path={path} component={Component} />;
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

  return <Route path={path} component={Component} />;
}
