/**
 * Payment Types
 * 
 * This file defines types related to payment processing.
 * These types ensure consistency and type safety for payment operations.
 */

/**
 * Payment Method interface
 * 
 * This represents a tokenized payment method (card, bank account, etc.)
 * that can be used for payment processing.
 * 
 * Note: This never contains sensitive card data directly, only tokenized references
 * that comply with PCI DSS requirements.
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  name?: string;
  token?: string;
}

/**
 * Payment Method Type
 * 
 * Supported payment method types across different payment gateways
 */
export type PaymentMethodType = 
  | 'card'             // Credit or debit card
  | 'bank_account'     // ACH or direct bank account
  | 'bank_transfer'    // Bank transfer
  | 'wallet'           // Digital wallet (Apple Pay, Google Pay, etc.)
  | 'crypto'           // Cryptocurrency
  | 'pix'              // Brazilian instant payment system
  | 'sepa_debit'       // SEPA Direct Debit
  | 'sofort'           // Sofort banking
  | 'giropay'          // Giropay
  | 'ideal'            // iDEAL
  | 'eps'              // EPS
  | 'bancontact'       // Bancontact
  | 'p24'              // Przelewy24
  | 'alipay'           // Alipay
  | 'wechat'           // WeChat Pay
  | 'klarna'           // Klarna
  | 'affirm'           // Affirm
  | 'afterpay_clearpay'; // Afterpay/Clearpay

/**
 * Payment Status
 * 
 * Possible statuses for a payment at various stages
 */
export type PaymentStatus =
  | 'requires_payment_method' // Initial state - needs payment method
  | 'requires_confirmation'   // Payment method attached, needs confirmation
  | 'requires_action'         // Requires customer action (3D Secure, etc.)
  | 'processing'              // Being processed
  | 'succeeded'               // Successful payment
  | 'canceled'                // Canceled payment
  | 'failed';                 // Failed payment

/**
 * Payment Intent
 * 
 * Represents a payment intent/order with a customer
 */
export interface PaymentIntent {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  clientSecret?: string;
  paymentMethod?: PaymentMethod;
  created: number;
  metadata?: Record<string, string>;
}

/**
 * Payment Error
 * 
 * Standardized payment error structure
 */
export interface PaymentError {
  code: string;
  message: string;
  declineCode?: string;
  param?: string;
}

/**
 * Security compliance level for payment operations
 */
export enum PaymentSecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Payment Gateway Configuration
 */
export interface PaymentGatewayConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  publicKey?: string;
  webhookSecret?: string;
  testMode: boolean;
  supportedMethods: PaymentMethodType[];
  supportedCurrencies: string[];
  securitySettings: {
    requires3DS: boolean;
    requiresAVS: boolean;
    fraudDetection: boolean;
    complianceLevel: PaymentSecurityLevel;
  };
}