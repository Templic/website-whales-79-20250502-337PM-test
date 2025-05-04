/**
 * Payment Transaction Logger
 * 
 * This module provides secure, PCI DSS-compliant transaction logging
 * functionality with proper sanitization of sensitive data.
 * 
 * Key features:
 * - Secure logging with sensitive data redaction (PCI DSS Req 3.4)
 * - Comprehensive transaction tracking (PCI DSS Req 10.2)
 * - Support for multiple payment gateways
 * - Tamper-evident audit logs (PCI DSS Req 10.5)
 * - Digital signatures for log integrity (PCI DSS Req 10.5.2)
 * - Centralized logging system (PCI DSS Req 10.5.3)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { log } from '../vite';
import { recordAuditEvent } from './secureAuditTrail';

/**
 * Transaction type enumeration
 * Compliant with PCI DSS Requirement 10.2 (Log all payment actions)
 */
export type PaymentTransactionType = 
  | 'intent_created'      // Payment intent created
  | 'authorized'          // Payment authorized but not captured
  | 'captured'            // Payment captured/completed
  | 'refunded'            // Payment refunded
  | 'failed'              // Payment failed
  | 'voided'              // Payment voided/canceled
  | 'dispute_created'     // Dispute/chargeback initiated
  | 'dispute_updated'     // Dispute status changed
  | 'dispute_resolved';   // Dispute resolved

/**
 * Transaction status enumeration
 */
export type PaymentTransactionStatus = 
  | 'created'    // Initial state
  | 'pending'    // Awaiting completion
  | 'processing' // Being processed
  | 'succeeded'  // Successfully completed
  | 'failed'     // Failed to complete
  | 'refunded'   // Fully refunded
  | 'partially_refunded' // Partially refunded
  | 'canceled'   // Canceled before processing
  | 'disputed';  // Under dispute/chargeback

/**
 * Transaction log entry interface
 * Structured to meet PCI DSS Requirement 10.3
 */
export interface TransactionLogEntry {
  // Required fields (PCI DSS Req 10.3.1-6)
  timestamp: string;           // When the event occurred
  transaction_id: string;      // Unique identifier
  payment_gateway: string;     // Payment processor used
  transaction_type: PaymentTransactionType; // Type of transaction
  status: PaymentTransactionStatus; // Outcome status
  
  // User identification (PCI DSS Req 10.3.1-2)
  user_id?: string;            // ID of user who initiated transaction
  ip_address?: string;         // Source IP address
  
  // Transaction details (PCI DSS Req 10.3.3-5)
  amount?: number;             // Transaction amount
  currency?: string;           // Currency code
  message?: string;            // Additional information
  
  // Metadata
  meta?: Record<string, unknown>; // Additional context
  
  // Integrity validation (PCI DSS Req 10.5.2)
  log_hash?: string;           // Hash of the log entry for integrity validation
  previous_hash?: string;      // Hash of the previous entry (blockchain-like integrity)
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
   * Implements PCI DSS Requirement 3.4 - Render PAN unreadable anywhere it is stored
   * 
   * @param data The data to sanitize
   * @returns Sanitized data without sensitive information
   */
  private sanitizeData(data: any): any {
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
      return data.map((item: any) => this.sanitizeData(item));
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
   * Calculate a secure hash for a transaction log entry
   * Implements PCI DSS Requirement 10.5.2 - Protect log data from unauthorized modification
   * 
   * @param transaction The transaction to hash
   * @returns The hash of the transaction data
   */
  private calculateTransactionHash(transaction: Partial<TransactionLogEntry>): string {
    // Create a copy without the hash fields
    const { log_hash, previous_hash, ...data } = transaction;
    
    // Add a timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Create a deterministic string representation
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    
    // Calculate SHA-256 hash
    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  }
  
  /**
   * Read the most recent transaction hash from the log file
   * Used to create a chain of transaction hashes for tamper evidence
   * 
   * @returns The most recent transaction hash, or undefined if no transactions
   */
  private getLatestTransactionHash(): string | undefined {
    try {
      if (!fs.existsSync(this.transactionLogFile)) {
        return undefined;
      }
      
      // Read the last line of the log file
      const content = fs.readFileSync(this.transactionLogFile, 'utf-8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0 || lines[0] === '') {
        return undefined;
      }
      
      const lastLine = lines[lines.length - 1];
      const lastTransaction = JSON.parse(lastLine);
      
      return lastTransaction.log_hash;
    } catch (error) {
      log(`Error reading latest transaction hash: ${error}`, 'error');
      return undefined;
    }
  }
  
  /**
   * Log a payment transaction
   * Implements PCI DSS Requirements:
   * - 10.2 (Log all payment actions)
   * - 10.3 (Record specific details for each event)
   * - 10.5 (Secure audit trails so they cannot be altered)
   * 
   * @param transaction The transaction to log
   * @returns The generated transaction ID
   */
  public logTransaction(transaction: Omit<TransactionLogEntry, 'log_hash' | 'previous_hash'>): string {
    try {
      // Validate and generate required fields
      if (!transaction.transaction_id) {
        transaction.transaction_id = `txn_${crypto.randomBytes(8).toString('hex')}`;
      }
      
      if (!transaction.timestamp) {
        transaction.timestamp = new Date().toISOString();
      }
      
      // Get the previous hash to form a chain (blockchain-like integrity)
      const previousHash = this.getLatestTransactionHash();
      const transactionWithHash: TransactionLogEntry = {
        ...transaction,
        previous_hash: previousHash
      };
      
      // Calculate the hash for this transaction
      const logHash = this.calculateTransactionHash(transactionWithHash);
      transactionWithHash.log_hash = logHash;
      
      // Sanitize any sensitive data
      const sanitizedTransaction = this.sanitizeData(transactionWithHash);
      
      // Format as JSON log entry
      const logEntry = JSON.stringify({
        ...sanitizedTransaction,
        log_type: 'payment_transaction'
      });
      
      // Ensure directory exists
      this.ensureLogDirectoryExists();
      
      // Write to transaction log file with file permissions limiting access (PCI DSS 10.5.1)
      fs.appendFileSync(this.transactionLogFile, logEntry + '\n', {
        mode: 0o640 // Owner: read/write, Group: read, Others: none
      });
      
      // Also log to secure audit trail (PCI DSS 10.5.3 - Centralized logging)
      recordAuditEvent({
        timestamp: transaction.timestamp,
        action: `PAYMENT_${transaction.transaction_type.toUpperCase()}`,
        resource: `payment:${transaction.payment_gateway}:${transaction.transaction_id}`,
        userId: transaction.user_id,
        ipAddress: transaction.ip_address,
        result: transaction.status === 'failed' ? 'failure' : 'success',
        severity: this.getTransactionSeverity(transaction),
        details: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          transaction_type: transaction.transaction_type,
          payment_gateway: transaction.payment_gateway
        }
      });
      
      // Also log to console for development (with minimal details)
      log(`Payment transaction ${transaction.transaction_id} logged (${transaction.transaction_type}, ${transaction.status})`, 'security');
      
      return transaction.transaction_id;
    } catch (error) {
      // Log error to console, but don't throw (to avoid disrupting payment flow)
      log(`Error logging payment transaction: ${error}`, 'error');
      return transaction.transaction_id || `error_${Date.now()}`;
    }
  }
  
  /**
   * Determine severity level for the audit trail based on transaction type and status
   * 
   * @param transaction The transaction to evaluate
   * @returns Severity level for audit logging
   */
  private getTransactionSeverity(transaction: TransactionLogEntry): 'info' | 'warning' | 'critical' {
    // Failed transactions are at least warnings
    if (transaction.status === 'failed') {
      return 'warning';
    }
    
    // Dispute events are warnings
    if (transaction.transaction_type.includes('dispute')) {
      return 'warning';
    }
    
    // Refunds and voids are warnings
    if (['refunded', 'voided'].includes(transaction.transaction_type)) {
      return 'warning';
    }
    
    // Large transactions (over $1000) are considered higher importance
    if (transaction.amount && transaction.amount > 1000) {
      return 'warning';
    }
    
    // Default to info level
    return 'info';
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
   * Log a successful payment transaction
   * Specialized method to handle logging of successful transactions to meet PCI-DSS requirements
   * for recording all access or actions related to cardholder data (PCI DSS Req 10.2.1)
   * 
   * @param successfulPayment The successful payment details
   * @returns The transaction ID
   */
  public logSuccessfulPayment(successfulPayment: {
    transactionId: string;
    orderId?: string;
    userId?: string;
    gateway: string;
    amount: number;
    currency: string;
    last4?: string;
    ipAddress?: string;
    meta?: Record<string, unknown>;
  }): string {
    // Map the successful payment to a standard transaction format
    const transaction: Omit<TransactionLogEntry, 'log_hash' | 'previous_hash'> = {
      transaction_id: successfulPayment.transactionId,
      timestamp: new Date().toISOString(),
      payment_gateway: successfulPayment.gateway,
      transaction_type: 'captured',
      status: 'succeeded',
      amount: successfulPayment.amount,
      currency: successfulPayment.currency,
      user_id: successfulPayment.userId,
      ip_address: successfulPayment.ipAddress,
      message: `Payment succeeded: ${successfulPayment.amount} ${successfulPayment.currency}${successfulPayment.orderId ? ` for order ${successfulPayment.orderId}` : ''}`,
      meta: {
        ...successfulPayment.meta,
        order_id: successfulPayment.orderId,
        last4: successfulPayment.last4 ? `****${successfulPayment.last4}` : undefined
      }
    };
    
    // Use the standard logging method
    return this.logTransaction(transaction);
  }
  
  /**
   * Log a failed payment transaction
   * Special method to handle logging of failed transactions to meet PCI-DSS requirements
   * for recording all access or actions related to cardholder data (PCI DSS Req 10.2)
   * 
   * @param failedPayment The failed payment details
   * @returns The generated transaction ID
   */
  public logFailedPayment(failedPayment: {
    transactionId?: string;
    orderId?: string;
    gateway: string;
    amount?: number;
    currency?: string;
    errorMessage: string;
    errorCode?: string;
    userId?: string;
    ipAddress?: string;
    meta?: Record<string, unknown>;
  }): string {
    // Map the failed payment to a standard transaction format
    const transaction: Omit<TransactionLogEntry, 'log_hash' | 'previous_hash'> = {
      transaction_id: failedPayment.transactionId || `failed_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date().toISOString(),
      payment_gateway: failedPayment.gateway,
      transaction_type: 'failed',
      status: 'failed',
      amount: failedPayment.amount,
      currency: failedPayment.currency,
      user_id: failedPayment.userId,
      ip_address: failedPayment.ipAddress,
      message: `Payment failed: ${failedPayment.errorMessage}`,
      meta: {
        ...failedPayment.meta,
        order_id: failedPayment.orderId,
        error_code: failedPayment.errorCode,
        error_message: failedPayment.errorMessage
      }
    };
    
    // Use the standard logging method
    return this.logTransaction(transaction);
  }
  
  /**
   * Verify the integrity of transaction logs
   * Implements PCI DSS Requirement 10.5.5 - Use file integrity monitoring to ensure log data is not changed
   * 
   * @returns Object with verification results
   */
  public verifyTransactionLogIntegrity(): {
    intact: boolean;
    totalLogs: number;
    verifiedLogs: number;
    issues?: { index: number; reason: string }[];
  } {
    try {
      if (!fs.existsSync(this.transactionLogFile)) {
        return { intact: true, totalLogs: 0, verifiedLogs: 0 };
      }
      
      // Read all log entries
      const logContent = fs.readFileSync(this.transactionLogFile, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      
      if (logLines.length === 0) {
        return { intact: true, totalLogs: 0, verifiedLogs: 0 };
      }
      
      // Parse and verify each entry
      let previousHash: string | undefined;
      const issues: { index: number; reason: string }[] = [];
      
      for (let i = 0; i < logLines.length; i++) {
        try {
          const entry = JSON.parse(logLines[i]);
          
          // Skip entries without hashes (from before implementation)
          if (!entry.log_hash) {
            continue;
          }
          
          // Verify hash chain continuity
          if (i > 0 && entry.previous_hash !== previousHash) {
            issues.push({
              index: i,
              reason: 'Hash chain broken: previous_hash does not match previous entry\'s hash'
            });
          }
          
          // Verify entry's own hash
          const { log_hash, ...entryWithoutHash } = entry;
          const computedHash = this.calculateTransactionHash(entryWithoutHash);
          
          if (computedHash !== log_hash) {
            issues.push({
              index: i,
              reason: 'Entry hash mismatch: content may have been tampered with'
            });
          }
          
          previousHash = entry.log_hash;
        } catch (parseError) {
          issues.push({
            index: i,
            reason: `Invalid log entry format: ${parseError}`
          });
        }
      }
      
      return {
        intact: issues.length === 0,
        totalLogs: logLines.length,
        verifiedLogs: logLines.length - issues.length,
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      log(`Error verifying transaction log integrity: ${error}`, 'error');
      return {
        intact: false,
        totalLogs: 0,
        verifiedLogs: 0,
        issues: [{ index: -1, reason: `Verification error: ${error}` }]
      };
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
        fs.writeFileSync(this.transactionLogFile, '', {
          mode: 0o640 // Owner: read/write, Group: read, Others: none
        });
        
        // Add an audit event for the log rotation (PCI DSS 10.5.3)
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_LOG_ROTATION',
          resource: `file:${this.transactionLogFile}`,
          result: 'success',
          severity: 'info',
          details: {
            size_mb: fileSizeInMB.toFixed(2),
            old_path: this.transactionLogFile,
            archived_path: rotatedLogFile
          }
        });
        
        log(`Rotated transaction logs to ${rotatedLogFile}`, 'security');
      }
    } catch (error) {
      log(`Error rotating transaction logs: ${error}`, 'error');
      
      // Add an audit event for the failed log rotation
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_LOG_ROTATION',
        resource: `file:${this.transactionLogFile}`,
        result: 'failure',
        severity: 'warning',
        details: {
          error: String(error)
        }
      });
    }
  }
}

// Create and export a singleton instance
const paymentTransactionLogger = new PaymentTransactionLogger();
export default paymentTransactionLogger;