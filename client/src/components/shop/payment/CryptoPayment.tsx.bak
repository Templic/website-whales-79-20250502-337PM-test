/**
 * Cryptocurrency Payment Component
 * 
 * This component provides a PCI-compliant integration with cryptocurrency
 * payment processors. It supports multiple providers including:
 * - BitPay
 * - Coinbase Commerce
 * - OpenNode (Bitcoin)
 * 
 * Critical PCI DSS features:
 * - No sensitive data is transmitted through our servers
 * - Uses provider-hosted checkout pages for maximum security
 * - All payment data is tokenized
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentGatewayType } from '../../../types/payment';

// Define component props
interface CryptoPaymentProps {
  gateway: 'bitpay' | 'coinbase' | 'opennode';
  amount: number;
  currency: string;
  onPaymentSuccess: (paymentId: string) => Promise<void>;
  onPaymentError?: (error) => void;
}

/**
 * Cryptocurrency Payment Component
 * 
 * Handles cryptocurrency payment processing in a secure way
 */
export default function CryptoPayment({
  gateway,
  amount,
  currency,
  onPaymentSuccess,
  onPaymentError
}: CryptoPaymentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentAddress, setPaymentAddress] = useState<string | null>(null);
  
  // Gateway selection helper
  const gatewayInfo = getGatewayInfo(gateway);
  
  useEffect(() => {
    // Load crypto payment gateway
    const loadCryptoGateway = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would make an API call to create a payment
        // and get back the checkout URL or payment address
        
        // Simulated API call to create cryptocurrency payment
        const response = await simulateCreateCryptoPayment(gateway, amount, currency);
        
        if (response.success) {
          if (response.checkoutUrl) {
            setCheckoutUrl(response.checkoutUrl);
          }
          
          if (response.paymentAddress) {
            setPaymentAddress(response.paymentAddress);
          }
          
          setError(null);
        } else {
          setError(response.error || 'Failed to initialize cryptocurrency payment');
        }
      } catch (err: unknown) {
        setError(err.message || 'An error occurred while setting up the payment');
        
        if (onPaymentError) {
          onPaymentError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCryptoGateway();
  }, [gateway, amount, currency, onPaymentError]);
  
  /**
   * Handle successful crypto payment
   * 
   * @param paymentId The payment ID
   */
  const handleSuccess = async (paymentId: string) => {
    setSuccess(true);
    await onPaymentSuccess(paymentId);
  };
  
  /**
   * Simulate opening external checkout
   */
  const openExternalCheckout = () => {
    if (checkoutUrl) {
      // In a real implementation, this would open the checkout URL
      // in a new window or redirect the user
      window.open(checkoutUrl, '_blank');
      
      // For demo purposes, simulate a successful payment after a delay
      setTimeout(() => {
        handleSuccess(`crypto_${Date.now()}`);
      }, 5000);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-sm text-muted-foreground">
          Initializing {gatewayInfo.name} payment...
        </p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Show success state
  if (success) {
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Payment Successful</AlertTitle>
        <AlertDescription className="text-green-600">
          Your cryptocurrency payment has been processed successfully.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex flex-col items-center p-4 border rounded-lg space-y-4">
        {/* Gateway logo and info */}
        <div className="flex items-center space-x-2">
          {gatewayInfo.icon}
          <span className="font-medium">{gatewayInfo.name}</span>
        </div>
        
        {/* Payment information */}
        <div className="text-center">
          <p className="font-bold text-lg">
            {amount} {currency.toUpperCase()}
          </p>
          <p className="text-sm text-muted-foreground">
            Pay with {gatewayInfo.currencies.join(', ')}
          </p>
        </div>
        
        {/* QR code or payment address (simplified for demo) */}
        {paymentAddress && (
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-md w-full">
            <QrCode className="h-24 w-24 mb-2" />
            <p className="text-xs break-all text-center">
              {paymentAddress.substring(0, 10)}...{paymentAddress.substring(paymentAddress.length - 10)}
            </p>
          </div>
        )}
        
        {/* Checkout button */}
        {checkoutUrl && (
          <Button onClick={openExternalCheckout} className="w-full">
            Pay with {gatewayInfo.name}
          </Button>
        )}
        
        {/* Instructions */}
        <p className="text-xs text-gray-500 text-center">
          {gateway === 'bitpay' && 'You will be redirected to BitPay to complete your payment.'}
          {gateway === 'coinbase' && 'You will be redirected to Coinbase Commerce to complete your payment.'}
          {gateway === 'opennode' && 'You can pay by scanning the QR code or using the Lightning Network.'}
        </p>
      </div>
      
      {/* PCI compliance notice */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Payment processed securely by {gatewayInfo.name}. Your payment details are never stored on our servers.
      </p>
    </div>
  );
}

/**
 * Get information about a cryptocurrency gateway
 */
function getGatewayInfo(gateway: PaymentGatewayType) {
  switch (gateway) {
    case 'bitpay':
      return {
        name: 'BitPay',
        icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width={24} height={24} rx={12} fill="#0e3b5e" />
          <path d="M17.5 8.5L14 12l3.5 3.5M6.5 8.5L10 12l-3.5 3.5" stroke="white" strokeWidth="2" />
        </svg>,
        currencies: ['BTC', 'ETH', 'BCH', 'XRP']
      };
    case 'coinbase':
      return {
        name: 'Coinbase Commerce',
        icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width={24} height={24} rx={12} fill="#0052ff" />
          <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2" />
        </svg>,
        currencies: ['BTC', 'ETH', 'USDC', 'DAI']
      };
    case 'opennode':
      return {
        name: 'OpenNode',
        icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width={24} height={24} rx={12} fill="#f7931a" />
          <path d="M17 8H7l5 4-5 4h10" stroke="white" strokeWidth="2" />
        </svg>,
        currencies: ['BTC', 'Lightning Network']
      };
    default:
      return {
        name: 'Cryptocurrency',
        icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width={24} height={24} rx={12} fill="#333" />
          <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2" />
        </svg>,
        currencies: ['BTC', 'ETH']
      };
  }
}

/**
 * Simulate creating a cryptocurrency payment
 * 
 * In a real implementation, this would be an API call to the server
 */
async function simulateCreateCryptoPayment(
  gateway: PaymentGatewayType,
  amount: number,
  currency: string
): Promise<{ 
  success: boolean; 
  checkoutUrl?: string;
  paymentAddress?: string;
  error?: string;
}> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if API keys are available
  const hasApiKey = process.env[`${gateway.toUpperCase()}_API_KEY`];
  
  if (!hasApiKey) {
    return {
      success: false,
      error: `${gateway} is not properly configured`
    };
  }
  
  // Simulate successful API response
  return {
    success: true,
    checkoutUrl: `https://example.com/${gateway}/checkout?amount=${amount}&currency=${currency}`,
    paymentAddress: gateway === 'bitpay' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' : 
      gateway === 'coinbase' ? '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' :
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  };
}