import { ReactNode } from 'react';

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

/**
 * Temporary Stripe Provider replacement
 * 
 * This component replaces the actual Stripe integration to allow the application
 * to function in development mode without requiring Stripe keys.
 */
export default function StripeProvider({ children }: StripeProviderProps) {
  // Simply render children with a development notice
  return (
    <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg mb-4">
      <p className="text-yellow-600 font-medium">Payment system disabled for development</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}