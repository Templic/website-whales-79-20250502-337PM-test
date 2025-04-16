import React, { ReactNode, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Import payment gateway providers
import StripeProvider from './StripeProvider';
// Future imports will go here as they're implemented
// import PayPalProvider from './PayPalProvider';
// import BitPayProvider from './BitPayProvider';
// import OpenNodeProvider from './OpenNodeProvider';
// import CoinbaseProvider from './CoinbaseProvider';

interface PaymentGatewayProviderProps {
  gateway: string;
  clientSecret?: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  children: ReactNode;
}

/**
 * A higher-order component that provides the appropriate payment gateway
 * context based on the selected gateway type.
 * 
 * This component makes it easy to add new payment gateways in the future
 * by centralizing the provider selection logic.
 */
export default function PaymentGatewayProvider({
  gateway,
  clientSecret,
  amount,
  currency = 'USD',
  metadata = {},
  children
}: PaymentGatewayProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when gateway changes
    setIsInitializing(true);
    setError(null);

    // Simulate gateway initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [gateway]);

  if (isInitializing) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Initializing payment system...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
        {error}. Please try another payment method or contact support.
      </div>
    );
  }

  // Select the appropriate gateway provider based on the gateway type
  switch (gateway) {
    case 'stripe':
      if (!clientSecret) {
        return (
          <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
            Payment initialization failed. Please try again.
          </div>
        );
      }
      return <StripeProvider clientSecret={clientSecret}>{children}</StripeProvider>;
    
    case 'paypal':
      // PayPal implementation will go here
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 rounded-lg">
          <div className="text-amber-800 dark:text-amber-300 text-center">
            <p className="font-medium">PayPal Integration Coming Soon</p>
            <p className="text-sm mt-2">This payment method is currently in development.</p>
          </div>
        </div>
      );
    
    case 'bitpay':
    case 'opennode':
    case 'coinbase':
      // Crypto payment implementations will go here
      return (
        <div className="flex flex-col items-center justify-center p-6 space-y-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 rounded-lg">
          <div className="text-amber-800 dark:text-amber-300 text-center">
            <p className="font-medium">Crypto Payment Integration Coming Soon</p>
            <p className="text-sm mt-2">This payment method is currently in development.</p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
          Unsupported payment method. Please choose another option.
        </div>
      );
  }
}