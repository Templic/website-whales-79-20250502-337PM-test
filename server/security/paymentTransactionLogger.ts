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

// Payment transaction types
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

// Transaction log entry
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

/**
 * Payment Transaction Logger
 * 
 * Handles secure transaction logging for audit trails
 */
class PaymentTransactionLogger {
  private logsDir: string;
  
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs', 'payment');
    this.ensureLogDirectoryExists();
  }
  
  /**
   * Create logs directory if it doesn't exist
   */
  private ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      
      // Set secure permissions - 750 means owner (rw), group (r), others (none)
      try {
        fs.chmodSync(this.logsDir, 0o750);
      } catch (error) {
        log(`Warning: Could not set secure permissions on payment logs directory: ${error}`, 'warning');
      }
    }
  }
  
  /**
   * Log a payment transaction
   * 
   * @param transaction The transaction to log
   */
  public logTransaction(transaction: PaymentTransactionLog): void {
    try {
      // Ensure log directory exists
      this.ensureLogDirectoryExists();
      
      // Sanitize data to ensure PCI compliance
      const sanitizedTransaction = this.sanitizeTransactionData(transaction);
      
      // Format the log entry
      const logEntry = JSON.stringify({
        ...sanitizedTransaction,
        timestamp: sanitizedTransaction.timestamp || new Date().toISOString(),
      });
      
      // Write to transaction log file
      const logPath = path.join(this.logsDir, 'transactions.log');
      fs.appendFileSync(logPath, `${logEntry}\n`);
      
      // Create a per-transaction file for critical transactions
      if (
        transaction.transaction_type === 'intent_created' ||
        transaction.transaction_type === 'authorized' ||
        transaction.transaction_type === 'captured' ||
        transaction.transaction_type === 'refunded'
      ) {
        const detailedLogPath = path.join(
          this.logsDir,
          `transaction_${transaction.transaction_id}.json`
        );
        
        fs.writeFileSync(detailedLogPath, logEntry);
      }
      
      log(`Payment transaction logged: ${transaction.transaction_type}`, 'security');
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
    last4 = 'XXXX',
    ipAddress,
    meta = {}
  }: {
    transactionId: string;
    orderId?: string;
    userId?: string;
    gateway: string;
    amount: number;
    currency: string;
    last4?: string;
    ipAddress?: string;
    meta?: Record<string, any>;
  }): void {
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
      message: 'Payment processed successfully',
      masked_card_info: last4 ? `XXXX-XXXX-XXXX-${last4}` : undefined,
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
    meta = {}
  }: {
    transactionId: string;
    orderId?: string;
    userId?: string;
    gateway: string;
    amount: number;
    currency: string;
    errorMessage: string;
    ipAddress?: string;
    meta?: Record<string, any>;
  }): void {
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
      message: errorMessage,
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
    // Deep clone to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(transaction)) as PaymentTransactionLog;
    
    // Sanitize metadata to prevent sensitive data leakage
    if (sanitized.meta) {
      // Never log these fields
      const sensitiveFields = [
        'card_number',
        'cardNumber',
        'cvv',
        'cvc',
        'securityCode',
        'pin',
        'password',
        'secret',
        'token',
        'access_token',
        'refresh_token'
      ];
      
      for (const field of sensitiveFields) {
        if (field in sanitized.meta) {
          sanitized.meta[field] = '[REDACTED]';
        }
      }
      
      // Check for PAN in any string value recursively
      this.redactPANRecursively(sanitized.meta);
    }
    
    // Ensure masked_card_info only contains safe information
    if (sanitized.masked_card_info) {
      // Only allow masked format (e.g., XXXX-XXXX-XXXX-1234)
      if (!/^X{4}-X{4}-X{4}-\d{4}$/.test(sanitized.masked_card_info)) {
        sanitized.masked_card_info = '[INVALID FORMAT REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Recursively check and redact PANs in an object
   * 
   * @param obj The object to check and modify
   */
  private redactPANRecursively(obj: any): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    const panRegex = /\b(?:\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g;
    
    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Check if the string might contain a PAN
        if (panRegex.test(value)) {
          obj[key] = '[PAN REDACTED]';
        }
      } else if (typeof value === 'object') {
        // Recursively check nested objects/arrays
        this.redactPANRecursively(value);
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
      const logPath = path.join(this.logsDir, 'transactions.log');
      
      if (!fs.existsSync(logPath)) {
        return [];
      }
      
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      return lines.map(line => JSON.parse(line) as PaymentTransactionLog);
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
    try {
      const detailedLogPath = path.join(
        this.logsDir,
        `transaction_${transactionId}.json`
      );
      
      if (!fs.existsSync(detailedLogPath)) {
        // Fall back to searching the main transaction log
        const logs = this.getTransactionLogs();
        return logs.find(log => log.transaction_id === transactionId) || null;
      }
      
      const content = fs.readFileSync(detailedLogPath, 'utf8');
      return JSON.parse(content) as PaymentTransactionLog;
    } catch (error) {
      log(`Error reading transaction log: ${error}`, 'error');
      return null;
    }
  }
  
  /**
   * Get recent transaction logs
   * 
   * @param limit Number of logs to return (default: 100)
   * @returns Array of recent transaction logs
   */
  public getRecentTransactionLogs(limit = 100): PaymentTransactionLog[] {
    const logs = this.getTransactionLogs();
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
export const paymentTransactionLogger = new PaymentTransactionLogger();
export default paymentTransactionLogger;