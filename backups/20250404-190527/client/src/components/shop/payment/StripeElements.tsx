import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface StripeElementsProps {
  onSubmit: (paymentMethod: string) => Promise<void>;
}

export default function StripeElements({ onSubmit }: StripeElementsProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Wait until elements is ready
  useEffect(() => {
    if (elements) {
      setIsReady(true);
    }
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment method
      const { error: submitError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          type: 'card',
        },
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred with your payment');
        setProcessing(false);
        return;
      }

      if (paymentMethod) {
        // Pass the payment method ID back to the parent component
        await onSubmit(paymentMethod.id);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err$2 {
      console.error('Payment error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading payment form...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="cosmic-glass-card bg-opacity-20 p-6 rounded-lg border border-cosmic-primary/20">
        <PaymentElement className="mb-6" />
        
        {error && (
          <div className="text-destructive p-3 bg-destructive/10 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={!stripe || processing} 
          className="w-full cosmic-hover-glow bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Securely'
          )}
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground mt-4 text-center">
        <p>Your payment information is secure and encrypted.</p>
      </div>
    </form>
  );
}