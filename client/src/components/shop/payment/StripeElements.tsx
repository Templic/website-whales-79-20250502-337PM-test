/**
 * Mock Stripe Elements Component
 * 
 * This component bypasses the actual Stripe integration for development.
 * No Stripe API keys or libraries are required.
 */

import { useState } from 'react';

interface StripeElementsProps {
  clientSecret: string;
  onSubmit: (paymentMethodId: string) => Promise<void>;
}

/**
 * Simplified Stripe Elements replacement
 */
export default function StripeElements({ clientSecret, onSubmit }: StripeElementsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle mock payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call onSubmit with a mock payment ID
      await onSubmit('mock_payment_id_development');
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
        <h3 className="font-medium">Payment Successful (Development Mode)</h3>
        <p className="text-sm text-green-600">Your mock payment has been processed successfully.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Development mode notice */}
      <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium text-yellow-700">Development Mode</h3>
        <p className="text-sm text-yellow-600">
          Stripe payment processing is disabled in development mode.
        </p>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-medium text-red-700">Payment Error</h3>
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}
      
      {/* Mock payment form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-md space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Card Information</label>
            <div className="h-10 bg-gray-100 rounded-md border border-gray-300"></div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
            <div className="h-10 bg-gray-100 rounded-md border border-gray-300"></div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Billing Address</label>
            <div className="h-10 bg-gray-100 rounded-md border border-gray-300"></div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isProcessing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Pay Now (Development Mode)'}
        </button>

        {/* Development notice */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          This is a development version. No actual payment will be processed.
        </p>
      </form>
    </div>
  );
}

