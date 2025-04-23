/**
 * PayPal Payment Component
 * 
 * This component provides PCI-compliant integration with PayPal
 * for secure payment processing.
 * 
 * Critical PCI DSS features:
 * - No card data is ever handled by our application
 * - Uses PayPal's secure buttons and checkout flow
 * - Secure transport via TLS
 * - Tokenization of payment data
 */

import React, { useEffect, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

// Define component props
interface PayPalPaymentProps {
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentId: string) => Promise<void>;
  onPaymentError?: (error$2 => void;
}

/**
 * PayPal Payment Component
 * 
 * Handles PayPal payment processing flow in a PCI-compliant manner
 */
export default function PayPalPayment({
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError
}: PayPalPaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Get PayPal client ID from environment variables
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  
  useEffect(() => {
    // Validate PayPal configuration
    if (!paypalClientId) {
      setError('PayPal integration is not properly configured');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [paypalClientId]);
  
  // Check if we're ready to render the PayPal buttons
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-sm text-muted-foreground">
          Loading PayPal checkout...
        </p>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Handle success state
  if (success) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Payment Successful</AlertTitle>
        <AlertDescription className="text-green-600">
          Your PayPal payment has been processed successfully.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Format amount for PayPal (must be a string)
  const formattedAmount = amount.toFixed(2);
  
  // PayPal configuration options
  const paypalOptions = {
    'client-id': paypalClientId || '',
    currency: currency,
    intent: 'capture'
  };
  
  return (
    <div className="w-full">
      {paypalClientId ? (
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay'
            }}
            createOrder={(data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: formattedAmount,
                      currency_code: currency.toUpperCase()
                    },
                    description: 'Purchase from Cosmic Community',
                  }
                ]
              });
            }}
            onApprove={async (data, actions) => {
              try {
                // Capture the order
                const orderDetails = await actions.order?.capture();
                
                if (!orderDetails) {
                  throw new Error('Failed to capture PayPal order');
                }
                
                // Extract the payment ID
                const paymentId = orderDetails.id;
                
                // Set success state
                setSuccess(true);
                
                // Notify parent component
                await onPaymentSuccess(paymentId);
              } catch (error$2 {
                setError(error.message || 'An error occurred during payment processing');
                
                if (onPaymentError) {
                  onPaymentError(error);
                }
              }
            }}
            onError={(err) => {
              const errorMessage = err instanceof Error ? err.message : 'An error occurred with PayPal';
              setError(errorMessage);
              
              if (onPaymentError) {
                onPaymentError(err);
              }
            }}
          />
        </PayPalScriptProvider>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            PayPal checkout is not properly configured. Please try an alternative payment method.
          </AlertDescription>
        </Alert>
      )}
      
      {/* PCI compliance notice */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Payment processed securely by PayPal. Your payment details are never stored on our servers.
      </p>
    </div>
  );
}