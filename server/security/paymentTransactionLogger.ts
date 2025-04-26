/**
 * Payment Transaction Logger
 * 
 * This module provides secure, PCI DSS-compliant transaction logging
 * functionality with proper sanitization of sensitive data.
 * 
 * Key features:
 * - Secure logging with sensitive data redaction
 * - Comprehensive transaction tracking
 * - Support for multiple payment gateways
 * - Audit-friendly format
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '../vite';

/**
 * Transaction type enumeration
 */
type TransactionType = 'intent_created' | 'authorized' | 'captured' | 'refunded' | 'failed' | 'voided';

/**
 * Transaction status enumeration
 */
type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

/**
 * Transaction log entry interface
 */
interface TransactionLogEntry {
  timestamp: string;
  transaction_id: string;
  payment_gateway: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  amount?: number;
  currency?: string;
  message?: string;
  ip_address?: string;
  meta?: Record<string, unknown>;
}

/**
 * Payment Transaction Logger
 */
class PaymentTransactionLogger {
  private logsDir: string;
  private transactionLogFile: string;
  private readonly sensitivePaths = [
    'card.number',
    'cardNumber',
    'card.cvc',
    'cvv',
    'cvc',
    'securityCode',
    'card.expMonth',
    'card.expYear',
    'expiryMonth',
    'expiryYear',
    'password',
    'token.id',
    'token',
    'authorization'
  ];
  
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs', 'transactions');
    this.transactionLogFile = path.join(this.logsDir, 'payment-transactions.log');
    this.ensureLogDirectoryExists();
  }
  
  /**
   * Create log directory if it doesn't exist
   */
  private ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      log('Created payment transaction logs directory', 'security');
    }
  }
  
  /**
   * Sanitize transaction data to remove sensitive information
   * 
   * @param data The data to sanitize
   * @returns Sanitized data without sensitive information
   */
  private sanitizeData(data) {
    // Handle null or undefined
    if (data == null) {
      return data;
    }
    
    // Handle primitive values
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    // Handle objects
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (this.sensitivePaths.includes(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        // Check if this might be a credit card number
        if (
          typeof value === 'string' && 
          this.isPossibleCardData(key, value)
        ) {
          sanitized[key] = this.maskSensitiveValue(value, key);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Check if a field might contain sensitive payment data
   * 
   * @param key The field name
   * @param value The field value
   * @returns True if this might be sensitive data
   */
  private isPossibleCardData(key: string, value: string): boolean {
    // Check for possible card number
    if (
      key.toLowerCase().includes('card') ||
      key.toLowerCase().includes('number') ||
      key.toLowerCase().includes('pan')
    ) {
      // Credit card numbers are typically 13-19 digits
      if (/^\d{13,19}$/.test(value.replace(/[\s-]/g, ''))) {
        return true;
      }
    }
    
    // Check for possible CVV/CVC
    if (
      key.toLowerCase().includes('cvv') ||
      key.toLowerCase().includes('cvc') ||
      key.toLowerCase().includes('securitycode') ||
      key.toLowerCase().includes('security')
    ) {
      // CVVs are typically 3-4 digits
      if (/^\d{3,4}$/.test(value.replace(/\s/g, ''))) {
        return true;
      }
    }
    
    // Check for possible expiry date
    if (
      key.toLowerCase().includes('expiry') ||
      key.toLowerCase().includes('expiration') ||
      key.toLowerCase().includes('exp')
    ) {
      // Expiry dates are often in formats like MM/YY or MM/YYYY
      if (/^\d{1,2}\/\d{2,4}$/.test(value)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Mask sensitive data for logging
   * 
   * @param value The value to mask
   * @param key The field name (used to determine masking strategy)
   * @returns Masked value
   */
  private maskSensitiveValue(value: string, key: string): string {
    // Remove spaces and dashes for consistent formatting
    const cleaned = value.replace(/[\s-]/g, '');
    
    // Handle card numbers (show only last 4 digits)
    if (
      key.toLowerCase().includes('card') ||
      key.toLowerCase().includes('number') ||
      key.toLowerCase().includes('pan')
    ) {
      if (cleaned.length > 4) {
        return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
      }
    }
    
    // Handle CVV/CVC (complete redaction)
    if (
      key.toLowerCase().includes('cvv') ||
      key.toLowerCase().includes('cvc') ||
      key.toLowerCase().includes('securitycode') ||
      key.toLowerCase().includes('security')
    ) {
      return '[REDACTED]';
    }
    
    // Handle expiry dates (show only the month, mask the year)
    if (
      key.toLowerCase().includes('expiry') ||
      key.toLowerCase().includes('expiration') ||
      key.toLowerCase().includes('exp')
    ) {
      if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 2) {
          return parts[0] + '/XX';
        }
      }
    }
    
    // Default: full redaction for anything we're not sure about
    return '[REDACTED]';
  }
  
  /**
   * Log a payment transaction
   * 
   * @param transaction The transaction to log
   */
  public logTransaction(transaction: TransactionLogEntry): void {
    try {
      // Validate required fields
      if (!transaction.transaction_id) {
        transaction.transaction_id = `txn_${crypto.randomBytes(8).toString('hex')}`;
      }
      
      if (!transaction.timestamp) {
        transaction.timestamp = new Date().toISOString();
      }
      
      // Sanitize any sensitive data
      const sanitizedTransaction = this.sanitizeData(transaction);
      
      // Format as JSON log entry
      const logEntry = JSON.stringify({
        ...sanitizedTransaction,
        log_type: 'payment_transaction'
      });
      
      // Write to transaction log file
      fs.appendFileSync(this.transactionLogFile, logEntry + '\n');
      
      // Also log to console for development
      log(`Payment transaction ${transaction.transaction_id} logged (${transaction.transaction_type}, ${transaction.status})`, 'security');
    } catch (error) {
      // Log error to console, but don't throw (to avoid disrupting payment flow)
      log(`Error logging payment transaction: ${error}`, 'error');
    }
  }
  
  /**
   * Get transaction logs within a specified date range
   * 
   * @param startDate Start date for transaction query
   * @param endDate End date for transaction query
   * @returns Array of transactions
   */
  public getTransactionLogs(
    startDate?: Date,
    endDate?: Date
  ): TransactionLogEntry[] {
    try {
      // Check if log file exists
      if (!fs.existsSync(this.transactionLogFile)) {
        return [];
      }
      
      // Read the entire log file
      const logContent = fs.readFileSync(this.transactionLogFile, 'utf-8');
      
      // Split into lines and parse each line as JSON
      const transactions = logContent
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            log(`Error parsing transaction log line: ${e}`, 'error');
            return null;
          }
        })
        .filter(transaction => transaction !== null) as TransactionLogEntry[];
      
      // Apply date filtering if specified
      if (startDate || endDate) {
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.timestamp);
          
          if (startDate && transactionDate < startDate) {
            return false;
          }
          
          if (endDate && transactionDate > endDate) {
            return false;
          }
          
          return true;
        });
      }
      
      return transactions;
    } catch (error) {
      log(`Error getting transaction logs: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Rotate transaction logs (useful for maintenance)
   * 
   * @param maxSizeInMB Maximum log file size before rotation (default: 10)
   */
  public rotateTransactionLogs(maxSizeInMB = 10): void {
    try {
      // Check if log file exists
      if (!fs.existsSync(this.transactionLogFile)) {
        return;
      }
      
      // Check file size
      const stats = fs.statSync(this.transactionLogFile);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Rotate if file size exceeds the limit
      if (fileSizeInMB > maxSizeInMB) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const rotatedLogFile = path.join(
          this.logsDir,
          `payment-transactions-${timestamp}.log`
        );
        
        // Rename current log file to archived log file
        fs.renameSync(this.transactionLogFile, rotatedLogFile);
        
        // Create a new empty log file
        fs.writeFileSync(this.transactionLogFile, '');
        
        log(`Rotated transaction logs to ${rotatedLogFile}`, 'security');
      }
    } catch (error) {
      log(`Error rotating transaction logs: ${error}`, 'error');
    }
  }
}

// Create and export a singleton instance
const paymentTransactionLogger = new PaymentTransactionLogger();
export default paymentTransactionLogger;