/**
 * Payment Types
 * 
 * This file contains type definitions for payment-related data structures.
 * NOTE: This file should NEVER contain actual sensitive payment data,
 * only references and safe identifiers in compliance with PCI DSS requirements.
 */

/**
 * Payment method types supported by the application
 */
export type PaymentMethodType = 
  | 'card'                // Credit/Debit card (via Stripe, etc.)
  | 'paypal'              // PayPal
  | 'crypto_bitcoin'      // Bitcoin
  | 'crypto_ethereum'     // Ethereum
  | 'crypto_litecoin'     // Litecoin
  | 'crypto_other'        // Other cryptocurrencies
  | 'bank_transfer'       // ACH or wire transfer
  | 'wallet'              // Digital wallet
  | 'other';              // Other payment types

/**
 * Payment method information
 * 
 * This type only contains non-sensitive identifiers and metadata,
 * never actual card numbers, CVVs, or other sensitive information.
 */
export interface PaymentMethod {
  id: string;                 // Payment method ID (from payment processor)
  type: PaymentMethodType;    // Type of payment method
  gateway: string;            // Payment gateway (stripe, paypal, etc.)
  
  // Display info (safe to store and display)
  label?: string;             // Display name (e.g., "Visa ending in 4242")
  last4?: string;             // Last 4 digits (for cards only, no PAN)
  expiryDisplay?: string;     // Display-formatted expiry (MM/YY, for cards only)
  imageUrl?: string;          // URL to brand/card image
  
  // Metadata
  isDefault?: boolean;
  isSaved?: boolean;
  createdAt?: string;
}

/**
 * Result of a payment process
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: {
    code: string;
    message: string;
  };
  orderId?: string;
}

/**
 * Payment status in the system
 */
export type PaymentStatus = 
  | 'created'       // Payment intent created
  | 'processing'    // Payment is being processed
  | 'authorized'    // Payment authorized but not captured
  | 'completed'     // Payment completed successfully
  | 'failed'        // Payment failed
  | 'refunded'      // Payment refunded
  | 'disputed'      // Payment disputed
  | 'canceled'      // Payment canceled
  | 'expired';      // Payment intent expired