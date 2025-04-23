/**
 * Payment Types
 * 
 * This module defines types for the payment system
 */

/**
 * Payment gateway types
 */
export type PaymentGatewayType = 'stripe' | 'paypal' | 'bitpay' | 'coinbase' | 'opennode';

/**
 * Payment method types
 */
export type PaymentMethodType = 'card' | 'bank_transfer' | 'crypto' | 'wallet';

/**
 * Payment status types
 */
export type PaymentStatusType = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

/**
 * Payment intent interface
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatusType;
  created: number;
  gateway: PaymentGatewayType;
  clientSecret?: string;
}

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  gateway: PaymentGatewayType;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  brand?: string;
  isDefault?: boolean;
}

/**
 * Payment request interface
 */
export interface PaymentRequest {
  amount: number;
  currency: string;
  gateway: PaymentGatewayType;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  status?: PaymentStatusType;
}