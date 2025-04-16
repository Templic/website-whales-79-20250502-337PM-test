import React, { ReactNode, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Import payment gateway providers
import StripeProvider from './StripeProvider';
import PayPalProvider from './PayPalProvider';
import BitPayProvider from './BitPayProvider';
import OpenNodeProvider from './OpenNodeProvider';
import CoinbaseProvider from './CoinbaseProvider';

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
      // Use secure PayPal provider
      return (
        <PayPalProvider 
          orderId={`test-${Date.now()}`} // This would be a real order ID in production
          amount={amount}
          currency={currency}
        >
          {children}
        </PayPalProvider>
      );
    
    case 'bitpay':
      // Use secure BitPay provider
      return (
        <BitPayProvider 
          invoiceId={`test-${Date.now()}`} // This would be a real invoice ID in production
        >
          {children}
        </BitPayProvider>
      );
      
    case 'opennode':
      // Use secure OpenNode provider
      return (
        <OpenNodeProvider
          chargeId={`test-${Date.now()}`} // This would be a real charge ID in production
          amount={amount}
          currency={currency}
        >
          {children}
        </OpenNodeProvider>
      );
      
    case 'coinbase':
      // Use secure Coinbase provider
      return (
        <CoinbaseProvider
          chargeCode={`test-${Date.now()}`} // This would be a real charge code in production
          amount={amount}
          currency={currency}
        >
          {children}
        </CoinbaseProvider>
      );
    
    default:
      return (
        <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
          Unsupported payment method. Please choose another option.
        </div>
      );
  }
}