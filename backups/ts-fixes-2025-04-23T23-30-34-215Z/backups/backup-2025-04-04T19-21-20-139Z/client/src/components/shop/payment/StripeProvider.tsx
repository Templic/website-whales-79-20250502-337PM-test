import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

// Initialize Stripe outside the component to avoid re-creating it
let stripePromise: Promise<Stripe | null> | null = null;

export default function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load Stripe once
    if (!stripePromise) {
      // Replace with your actual publishable key
      const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!key) {
        console.error('Stripe publishable key is missing');
        setError('Payment system configuration error');
        setLoading(false);
        return;
      }
      
      stripePromise = loadStripe(key);
    }
    
    // Set loading to false once Stripe is loaded
    stripePromise.then(() => setLoading(false)).catch(err => {
      console.error('Error loading Stripe:', err);
      setError('Failed to load payment system');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-primary" />
        <span className="ml-2 text-cosmic-primary">Initializing payment system...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
        {error}. Please try again later or contact support.
      </div>
    );
  }

  // Set up options based on whether clientSecret is available
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: 'rgba(255, 255, 255, 0.15)',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };
  
  // Add clientSecret if available
  if (clientSecret) {
    options.clientSecret = clientSecret;
  } else {
    // We need a client secret to initialize Elements with a PaymentIntent
    return (
      <div className="text-destructive p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
        Payment initialization failed. Please try again.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}