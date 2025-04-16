/**
 * Secure Payment Processor
 * 
 * A universal payment component that handles all payment gateways securely.
 * 
 * This component ensures PCI DSS compliance by:
 * 1. Never directly handling sensitive payment data within the application
 * 2. Using gateway-specific secure components (like Stripe Elements) for payment collection
 * 3. Implementing proper error handling and security messaging
 */
import React from 'react';
import { usePaymentGateway } from './PaymentGatewayProvider';
import StripeElements from './StripeElements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SecurePaymentProcessorProps {
  amount: number;
  currency?: string;
  onPaymentSubmit: (paymentMethodId: string) => Promise<void>;
  className?: string;
}

export default function SecurePaymentProcessor({
  amount,
  currency = 'usd',
  onPaymentSubmit,
  className = '',
}: SecurePaymentProcessorProps) {
  const {
    gateway,
    clientSecret,
    isLoading,
    error,
    setPaymentMethod,
    setError,
  } = usePaymentGateway();

  // Handle payment method selection from gateway components
  const handlePaymentMethodSelected = async (paymentMethodId: string) => {
    try {
      await onPaymentSubmit(paymentMethodId);
    } catch (error) {
      console.error('Payment submission error:', error);
      setError((error as Error).message || 'Failed to process payment');
    }
  };

  // Show loading state while creating payment intent
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-center">Processing your payment securely...</p>
      </div>
    );
  }

  // Show error if one occurred
  if (error) {
    return (
      <Alert variant="destructive" className={`mb-6 ${className}`}>
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render the appropriate payment form based on the selected gateway
  return (
    <div className={className}>
      {gateway === 'stripe' && (
        <StripeElements
          clientSecret={clientSecret}
          amount={amount}
          currency={currency}
          onPaymentMethodSelected={handlePaymentMethodSelected}
        />
      )}
      
      {gateway === 'paypal' && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-center">PayPal integration coming soon.</p>
          {/* Future PayPal component would be used here */}
        </div>
      )}
      
      {gateway === 'bitpay' && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-center">BitPay integration coming soon.</p>
          {/* Future BitPay component would be used here */}
        </div>
      )}
      
      {gateway === 'coinbase' && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-center">Coinbase integration coming soon.</p>
          {/* Future Coinbase component would be used here */}
        </div>
      )}
      
      {gateway === 'opennode' && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-center">OpenNode integration coming soon.</p>
          {/* Future OpenNode component would be used here */}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p className="mb-2">
          <strong>🔒 Secure Payment:</strong> Your payment details are securely processed and never
          stored on our servers.
        </p>
        <p>
          We adhere to PCI DSS compliance standards to ensure the highest level of payment security.
        </p>
      </div>
    </div>
  );
}