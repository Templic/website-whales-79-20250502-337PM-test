/**
 * Stripe Elements Component
 * 
 * This component provides a PCI-compliant integration with Stripe
 * using Stripe Elements for secure payment processing.
 * 
 * Critical PCI DSS features:
 * - Card data never touches our servers
 * - Card data is securely tokenized by Stripe
 * - Elements are loaded from Stripe's secure domain
 * - Secure transport via TLS
 */

import React, { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe (outside component to avoid re-initialization)
// Using empty string as fallback, but the component won't render properly without a valid key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Define component props
interface StripeElementsProps {
  clientSecret: string;
  onSubmit: (paymentMethodId: string) => Promise<void>;
}

/**
 * Stripe Elements wrapper component
 */
export default function StripeElements({ clientSecret, onSubmit }: StripeElementsProps) {
  // Theme for Stripe Elements
  const appearance = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#6366f1', // Indigo-500
      colorBackground: '#ffffff',
      colorText: '#1f2937', // Gray-800
      colorDanger: '#ef4444', // Red-500
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  // Options for Elements
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="w-full">
      {/* Only render Elements if clientSecret is available */}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm onSubmit={onSubmit} />
        </Elements>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>
            Unable to initialize payment. Please try again later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Internal checkout form component
 * This must be wrapped by Elements
 */
function CheckoutForm({ onSubmit }: { onSubmit: (paymentMethodId: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate stripe and elements are loaded
    if (!stripe || !elements) {
      setErrorMessage('Payment system is still loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setPaymentStatus('processing');

    try {
      // Confirm the payment with Stripe
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-complete',
        },
        redirect: 'if_required',
      });

      // Handle errors
      if (result.error) {
        setErrorMessage(result.error.message || 'An unknown error occurred');
        setPaymentStatus('error');
        return;
      }

      // Get the payment method
      if (!result.paymentIntent?.payment_method) {
        setErrorMessage('Payment method information not available');
        setPaymentStatus('error');
        return;
      }

      // Payment succeeded
      const paymentMethodId = result.paymentIntent.payment_method.toString();
      setPaymentStatus('succeeded');

      // Call the onSubmit callback
      await onSubmit(paymentMethodId);
    } catch (error: any) {
      // Handle unexpected errors
      setErrorMessage(error.message || 'An unexpected error occurred');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show success message if payment was successful
  if (paymentStatus === 'succeeded') {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Payment Successful</AlertTitle>
        <AlertDescription className="text-green-600">
          Your payment has been processed successfully.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display error message if any */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Stripe Payment Element - securely collects payment info */}
      <PaymentElement 
        className="mb-6"
        options={{
          layout: 'tabs',
        }}
      />

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>

      {/* PCI compliance notice */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Payment processed securely by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}