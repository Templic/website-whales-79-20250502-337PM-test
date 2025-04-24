/**
 * Login.tsx
 * 
 * Simple redirect component to the AuthPage for the /login route
 */
import { Redirect } from "wouter";

export function LoginPage() {
  return <Redirect to="/auth" />;
}

export default LoginPage;