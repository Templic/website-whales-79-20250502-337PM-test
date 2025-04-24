/**
 * Payment Gateway Provider
 * 
 * This component provides a context for payment gateway interactions,
 * ensuring PCI DSS compliance by:
 * 
 * 1. Abstracting payment gateway interactions
 * 2. Managing client secrets and tokens securely
 * 3. Providing consistent error handling
 * 4. Never handling or storing sensitive card data
 */

import React, { createContext, ReactNode, useContext, useState } from 'react';
import axios from 'axios';
import { PaymentGatewayType, PaymentMethod } from '../../../types/payment';

// Define the context type
interface PaymentGatewayContextType {
  gateway: PaymentGatewayType;
  clientSecret: string | null;
  paymentMethod: PaymentMethod | null;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  setGateway: (gateway: PaymentGatewayType) => void;
  createPaymentIntent: (amount: number, currency: string) => Promise<string | null>;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create the context with default values
const PaymentGatewayContext = createContext<PaymentGatewayContextType>({
  gateway: 'stripe',
  clientSecret: null,
  paymentMethod: null,
  isLoading: false,
  error: null,
  
  setGateway: () => {},
  createPaymentIntent: async () => null,
  setPaymentMethod: () => {},
  setError: () => {},
  reset: () => {},
});

// Define props for the provider component
interface PaymentGatewayProviderProps {
  children: ReactNode;
  defaultGateway?: PaymentGatewayType;
}

/**
 * Payment Gateway Provider component
 * 
 * Provides payment context to child components
 */
export function PaymentGatewayProvider({
  children,
  defaultGateway = 'stripe',
}: PaymentGatewayProviderProps) {
  // State
  const [gateway, setGateway] = useState<PaymentGatewayType>(defaultGateway);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Create a payment intent
   * 
   * This is the PCI-compliant way to initiate a payment.
   * No card details are handled directly - only a client secret
   * is created which is used by the secure Elements components.
   */
  const createPaymentIntent = async (amount: number, currency: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a payment intent on the server
      const response = await axios.post('/api/payment/create-intent', {
        amount,
        currency,
        // Add optional metadata
        metadata: {
          gateway,
        },
      });
      
      if (response.data.success && response.data.clientSecret) {
        setClientSecret(response.data.clientSecret);
        return response.data.clientSecret;
      } else {
        throw new Error(response.data.message || 'Failed to create payment intent');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Reset the payment state
   */
  const reset = () => {
    setClientSecret(null);
    setPaymentMethod(null);
    setError(null);
  };
  
  // Create the context value object
  const contextValue: PaymentGatewayContextType = {
    gateway,
    clientSecret,
    paymentMethod,
    isLoading,
    error,
    
    setGateway,
    createPaymentIntent,
    setPaymentMethod,
    setError,
    reset,
  };
  
  // Provide the context to children
  return (
    <PaymentGatewayContext.Provider value={contextValue}>
      {children}
    </PaymentGatewayContext.Provider>
  );
}

/**
 * Hook to use payment gateway context
 */
export function usePaymentGateway() {
  const context = useContext(PaymentGatewayContext);
  
  if (!context) {
    throw new Error('usePaymentGateway must be used within a PaymentGatewayProvider');
  }
  
  return context;
}