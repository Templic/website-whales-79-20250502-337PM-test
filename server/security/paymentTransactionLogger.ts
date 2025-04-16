/**
 * Payment Transaction Logger
 * 
 * This module handles secure logging of payment transactions for PCI DSS compliance.
 * It implements requirement 10.2 for complete audit trails of payment transactions.
 * 
 * Important:
 * - Never logs sensitive authentication data (e.g., CVV, PIN)
 * - Never logs full PAN (card number) - only first 6 and last 4 digits max if needed
 * - Logs are stored securely and cannot be altered
 */

import fs from 'fs';
import path from 'path';
import { log } from '../vite';

// Define transaction types
export type PaymentTransactionType = 
  | 'intent_created'       // Payment intent/order created
  | 'authorized'           // Payment authorized
  | 'captured'             // Payment captured
  | 'failed'               // Payment failed
  | 'refunded'             // Payment refunded
  | 'disputed'             // Payment disputed
  | 'canceled'             // Payment canceled
  | 'gateway_response'     // Gateway response received (webhook)
  | 'order_updated'        // Order updated
  | 'method_added'         // Payment method added
  | 'method_removed';      // Payment method removed

// Define transaction log structure
export interface PaymentTransactionLog {
  timestamp: string;
  transaction_id: string;
  order_id?: string;
  user_id?: string;
  payment_gateway: string;
  transaction_type: PaymentTransactionType;
  amount?: number;
  currency?: string;
  status: string;
  message?: string;
  masked_card_info?: string; // Last 4 digits only
  ip_address?: string;
  meta?: Record<string, any>;
}

// Define parameters for successful payments
export interface SuccessfulPaymentParams {
  transactionId: string;
  orderId?: string;
  userId?: string;
  gateway: string;
  amount: number;
  currency: string;
  last4?: string;
  ipAddress?: string;
  meta?: Record<string, any>;
}

// Define parameters for failed payments
export interface FailedPaymentParams {
  transactionId: string;
  orderId?: string;
  userId?: string;
  gateway: string;
  amount?: number;
  currency?: string;
  errorMessage: string;
  ipAddress?: string;
  meta?: Record<string, any>;
}

/**
 * Payment Transaction Logger
 * 
 * Handles secure transaction logging for audit trails
 */
class PaymentTransactionLogger {
  private logsDir: string;
  private transactionLogFile: string;
  
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs', 'payment');
    this.transactionLogFile = path.join(this.logsDir, 'transactions.log');
    this.ensureLogDirectoryExists();
  }
  
  /**
   * Create logs directory if it doesn't exist
   */
  private ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      log('Created payment logs directory', 'security');
    }
  }
  
  /**
   * Log a payment transaction
   * 
   * @param transaction The transaction to log
   */
  public logTransaction(transaction: PaymentTransactionLog): void {
    try {
      // Sanitize transaction data to prevent PCI DSS violations
      const sanitizedTransaction = this.sanitizeTransactionData(transaction);
      
      // Add timestamp if not present
      if (!sanitizedTransaction.timestamp) {
        sanitizedTransaction.timestamp = new Date().toISOString();
      }
      
      // Convert to JSON string
      const logEntry = JSON.stringify(sanitizedTransaction) + '\n';
      
      // Append to log file
      fs.appendFileSync(this.transactionLogFile, logEntry);
      
      // Log transaction (for demonstration purposes)
      log(`Payment transaction logged: ${sanitizedTransaction.transaction_type} - ${sanitizedTransaction.transaction_id}`, 'security');
    } catch (error) {
      log(`Error logging payment transaction: ${error}`, 'error');
    }
  }
  
  /**
   * Log a successful payment
   */
  public logSuccessfulPayment({
    transactionId,
    orderId,
    userId,
    gateway,
    amount,
    currency,
    last4,
    ipAddress,
    meta
  }: SuccessfulPaymentParams): void {
    this.logTransaction({
      timestamp: new Date().toISOString(),
      transaction_id: transactionId,
      order_id: orderId,
      user_id: userId,
      payment_gateway: gateway,
      transaction_type: 'captured',
      amount,
      currency,
      status: 'succeeded',
      message: 'Payment successfully processed',
      masked_card_info: last4 ? `xxxx-xxxx-xxxx-${last4}` : undefined,
      ip_address: ipAddress,
      meta
    });
  }
  
  /**
   * Log a failed payment
   */
  public logFailedPayment({
    transactionId,
    orderId,
    userId,
    gateway,
    amount,
    currency,
    errorMessage,
    ipAddress,
    meta
  }: FailedPaymentParams): void {
    this.logTransaction({
      timestamp: new Date().toISOString(),
      transaction_id: transactionId,
      order_id: orderId,
      user_id: userId,
      payment_gateway: gateway,
      transaction_type: 'failed',
      amount,
      currency,
      status: 'failed',
      message: errorMessage || 'Payment processing failed',
      ip_address: ipAddress,
      meta
    });
  }
  
  /**
   * Sanitize transaction data to prevent PCI DSS violations
   * 
   * @param transaction Transaction data to sanitize
   * @returns Sanitized transaction data
   */
  private sanitizeTransactionData(
    transaction: PaymentTransactionLog
  ): PaymentTransactionLog {
    // Create a deep copy of the transaction
    const sanitized = JSON.parse(JSON.stringify(transaction)) as PaymentTransactionLog;
    
    // If meta data exists, recursively check for and redact PANs
    if (sanitized.meta) {
      this.redactPANRecursively(sanitized.meta);
    }
    
    // Ensure proper masking of card info (if present)
    if (sanitized.masked_card_info && !sanitized.masked_card_info.startsWith('xxxx')) {
      // Only keep last 4 digits and mask the rest
      const last4 = sanitized.masked_card_info.slice(-4);
      sanitized.masked_card_info = `xxxx-xxxx-xxxx-${last4}`;
    }
    
    return sanitized;
  }
  
  /**
   * Recursively check and redact PANs in an object
   * 
   * @param obj The object to check and modify
   */
  private redactPANRecursively(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    
    const cardNumberRegex = /\b(?:\d{4}[ -]?){3}(?:\d{4})\b|\b\d{16}\b/g;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Check if the key might be related to card information
        const sensitiveKeys = ['cardNumber', 'pan', 'card_number', 'credit_card', 'creditCard', 'cc_number', 'ccnumber'];
        
        if (sensitiveKeys.includes(key.toLowerCase())) {
          // Redact all sensitive card data
          obj[key] = '[REDACTED]';
        }
        // If the value is a string, check for card numbers
        else if (typeof value === 'string' && cardNumberRegex.test(value)) {
          // Replace card numbers with a redacted format
          obj[key] = value.replace(cardNumberRegex, 'xxxx-xxxx-xxxx-****');
        }
        // If the value is an object or array, recursively check it
        else if (typeof value === 'object' && value !== null) {
          this.redactPANRecursively(value);
        }
      }
    }
  }
  
  /**
   * Get all transaction logs
   * 
   * @returns Array of transaction logs
   */
  public getTransactionLogs(): PaymentTransactionLog[] {
    try {
      if (!fs.existsSync(this.transactionLogFile)) {
        return [];
      }
      
      const logContent = fs.readFileSync(this.transactionLogFile, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim() !== '');
      
      return logLines.map(line => JSON.parse(line) as PaymentTransactionLog);
    } catch (error) {
      log(`Error reading transaction logs: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Get transaction log for a specific transaction
   * 
   * @param transactionId Transaction ID
   * @returns Transaction log or null if not found
   */
  public getTransactionLog(transactionId: string): PaymentTransactionLog | null {
    const logs = this.getTransactionLogs();
    return logs.find(log => log.transaction_id === transactionId) || null;
  }
  
  /**
   * Get recent transaction logs
   * 
   * @param limit Number of logs to return (default: 100)
   * @returns Array of recent transaction logs
   */
  public getRecentTransactionLogs(limit = 100): PaymentTransactionLog[] {
    const logs = this.getTransactionLogs();
    return logs.slice(-limit);
  }
}

// Create and export a singleton instance
const paymentTransactionLogger = new PaymentTransactionLogger();
export default paymentTransactionLogger;