/**
 * Stripe Elements Integration
 * 
 * This component provides a PCI-compliant integration with Stripe using the Elements API.
 * It handles credit card input securely by:
 * 
 * 1. Never storing card data on our servers
 * 2. Using Stripe's secure iframe-based Elements
 * 3. Tokenizing payment information on Stripe's servers
 * 4. Following all PCI DSS requirements for card handling
 */
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Props for the StripeElements wrapper component
interface StripeElementsProps {
  clientSecret: string | null;
  amount: number;
  currency: string;
  onPaymentMethodSelected: (paymentMethodId: string) => Promise<void>;
  className?: string;
}

// Props for the inner CheckoutForm component
interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onPaymentMethodSelected: (paymentMethodId: string) => Promise<void>;
}

/**
 * The actual Stripe Elements form that collects payment information
 */
function CheckoutForm({
  clientSecret,
  amount,
  currency,
  onPaymentMethodSelected
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Format amount for display (e.g., 1000 -> $10.00)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('You must accept the terms and conditions');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Use Stripe's confirmPayment to handle card details securely
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'An error occurred during payment processing');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, pass ID to parent
        await onPaymentMethodSelected(paymentIntent.payment_method as string);
      } else {
        // Unexpected state
        setErrorMessage('Payment processing returned an unexpected result. Please try again.');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setErrorMessage((error as Error).message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <div className="text-xl font-semibold mb-2">Payment Details</div>
        <div className="text-sm text-gray-500 mb-4">
          Amount to be charged: {formattedAmount}
        </div>
        
        {/* Stripe's secure card element */}
        <PaymentElement />
      </div>

      {/* Terms acceptance checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="accept-terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
        />
        <Label htmlFor="accept-terms" className="text-sm">
          I agree to the terms and conditions and authorize this payment
        </Label>
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || !acceptedTerms}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Pay Securely'}
      </Button>

      {/* Security message */}
      <div className="text-xs text-gray-500 mt-2">
        🔒 Your payment is secured with industry-standard encryption.
        We never store your full card details on our servers.
      </div>
    </form>
  );
}

/**
 * Wrapper component that provides the Stripe Elements context
 */
export default function StripeElements({
  clientSecret,
  amount,
  currency,
  onPaymentMethodSelected,
  className = '',
}: StripeElementsProps) {
  // Show a loading message if the clientSecret isn't available yet
  if (!clientSecret) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <p>Initializing secure payment form...</p>
      </div>
    );
  }

  // Stripe Elements appearance options 
  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#1f2937',
      colorText: '#f9fafb',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  // Options for the Elements provider
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className={className}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          clientSecret={clientSecret}
          amount={amount}
          currency={currency}
          onPaymentMethodSelected={onPaymentMethodSelected}
        />
      </Elements>
    </div>
  );
}