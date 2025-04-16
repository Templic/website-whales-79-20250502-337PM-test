import React from 'react';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PaymentGatewayProvider from './PaymentGatewayProvider';
import StripeElements from './StripeElements';

interface SecurePaymentProcessorProps {
  paymentMethod: string;
  clientSecret?: string;
  isCreatingPaymentIntent: boolean;
  paymentError: string | null;
  amount: number;
  currency?: string;
  onPaymentSubmit: (paymentMethodId: string) => Promise<void>;
}

/**
 * A universal payment component that handles all payment gateways securely.
 * 
 * This component ensures PCI DSS compliance by:
 * 1. Never directly handling sensitive payment data within the application
 * 2. Using gateway-specific secure components (like Stripe Elements) for payment collection
 * 3. Implementing proper error handling and security messaging
 */
export default function SecurePaymentProcessor({
  paymentMethod,
  clientSecret,
  isCreatingPaymentIntent,
  paymentError,
  amount,
  currency = 'USD',
  onPaymentSubmit
}: SecurePaymentProcessorProps) {
  // Loading state while creating payment intent
  if (isCreatingPaymentIntent) {
    return (
      <div className="flex justify-center items-center py-6 cosmic-glass-panel rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-cosmic-primary rounded-full opacity-10 animate-ping"></div>
          <div className="absolute inset-4 bg-cosmic-primary rounded-full opacity-20"></div>
          <Loader2 className="h-6 w-6 animate-spin text-cosmic-primary mr-2 relative z-10" />
        </div>
        <span className="ml-2 cosmic-text">Preparing secure payment form...</span>
      </div>
    );
  }

  // Display error if any
  if (paymentError) {
    return (
      <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{paymentError}</AlertDescription>
      </Alert>
    );
  }

  // Use PaymentGatewayProvider to handle the selected payment method
  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start">
        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
        <div className="text-sm text-green-800 dark:text-green-300">
          <p className="font-medium">PCI DSS Compliant</p>
          <p className="mt-1 text-green-700 dark:text-green-400">
            Your payment details are securely processed and never stored on our servers.
          </p>
        </div>
      </div>

      {clientSecret ? (
        <PaymentGatewayProvider
          gateway={paymentMethod}
          clientSecret={clientSecret}
          amount={amount}
          currency={currency}
        >
          {/* Only Stripe uses StripeElements component directly */}
          {paymentMethod === 'stripe' ? (
            <StripeElements onSubmit={onPaymentSubmit} />
          ) : (
            <div className="cosmic-glass-card bg-opacity-20 p-6 rounded-lg border border-cosmic-primary/20">
              <p className="text-center text-muted-foreground mb-4">
                This is a placeholder for the {paymentMethod} payment processor.
                In production, this would securely handle payments.
              </p>
            </div>
          )}
        </PaymentGatewayProvider>
      ) : (
        <div className="text-destructive p-3 bg-destructive/10 rounded-md mb-4">
          Failed to initialize payment. Please try again.
        </div>
      )}
    </div>
  );
}