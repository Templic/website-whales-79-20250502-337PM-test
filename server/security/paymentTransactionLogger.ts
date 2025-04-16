/**
 * PCI DSS Compliant Payment Transaction Logger
 * 
 * This module provides secure logging for payment transactions while ensuring
 * no sensitive card data is ever logged (in compliance with PCI DSS requirement 4.2).
 * 
 * It implements requirement 10.2 by providing automated audit trails for all
 * payment transactions with appropriate data masking.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define log levels
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Define payment event types
export enum PaymentEventType {
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  PAYMENT_ATTEMPTED = 'PAYMENT_ATTEMPTED',
  PAYMENT_SUCCEEDED = 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',
  PAYMENT_CANCELED = 'PAYMENT_CANCELED',
}

// Interface for payment transaction log entries
interface PaymentTransactionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  eventType: PaymentEventType;
  gatewayType: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status: string;
  userId?: string;
  email?: string; // Partially masked in logs
  orderId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, string>;
  ipAddress?: string;
}

class PaymentTransactionLogger {
  private logDir: string;
  private transactionLogPath: string;
  private securityLogPath: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'payment');
    this.transactionLogPath = path.join(this.logDir, 'transactions.log');
    this.securityLogPath = path.join(this.logDir, 'security.log');
    this.ensureLogDirectoryExists();
  }

  /**
   * Ensure the log directory exists
   */
  private ensureLogDirectoryExists(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Mask sensitive data to comply with PCI DSS requirements
   * Never log full card numbers, CVV, or other sensitive authentication data
   */
  private maskSensitiveData(data: any): any {
    const maskedData = { ...data };

    // Mask email (if present)
    if (maskedData.email && typeof maskedData.email === 'string') {
      const [username, domain] = maskedData.email.split('@');
      if (username && domain) {
        const maskedUsername = username.length > 2 
          ? username.substring(0, 2) + '*'.repeat(username.length - 2) 
          : username;
        maskedData.email = `${maskedUsername}@${domain}`;
      }
    }

    // Never include or log any card details
    delete maskedData.cardNumber;
    delete maskedData.cvv;
    delete maskedData.expiryMonth;
    delete maskedData.expiryYear;
    delete maskedData.cardholderName;

    // If payment method details are included, ensure they're masked
    if (maskedData.paymentMethod) {
      // Keep only the payment method type, not any details
      if (typeof maskedData.paymentMethod === 'object') {
        maskedData.paymentMethod = {
          type: maskedData.paymentMethod.type
        };
      }
    }

    return maskedData;
  }

  /**
   * Log a payment transaction event
   */
  public logTransaction(
    eventType: PaymentEventType,
    level: LogLevel = LogLevel.INFO,
    data: Partial<PaymentTransactionLog>
  ): void {
    try {
      // Create log entry with required fields
      const logEntry: PaymentTransactionLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        level,
        eventType,
        gatewayType: data.gatewayType || 'unknown',
        status: data.status || 'unknown',
        ...this.maskSensitiveData(data),
      };

      // Write to transaction log
      fs.appendFileSync(
        this.transactionLogPath,
        JSON.stringify(logEntry) + '\n'
      );

      // For security-relevant events, also log to security log
      if (level === LogLevel.WARNING || level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
        fs.appendFileSync(
          this.securityLogPath,
          JSON.stringify(logEntry) + '\n'
        );
      }

      // Console log for development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[${logEntry.timestamp}] [${logEntry.level}] ${logEntry.eventType}: ${logEntry.status}`);
      }
    } catch (error) {
      console.error('Failed to log payment transaction:', error);
    }
  }

  /**
   * Log a payment intent creation
   */
  public logPaymentIntentCreated(
    gatewayType: string,
    amount: number,
    currency: string,
    userId?: string,
    email?: string,
    metadata?: Record<string, string>
  ): void {
    this.logTransaction(PaymentEventType.PAYMENT_INTENT_CREATED, LogLevel.INFO, {
      gatewayType,
      amount,
      currency,
      status: 'created',
      userId,
      email,
      metadata,
    });
  }

  /**
   * Log a payment attempt
   */
  public logPaymentAttempted(
    gatewayType: string,
    transactionId: string,
    amount: number,
    currency: string,
    userId?: string,
    email?: string,
    orderId?: string,
    ipAddress?: string
  ): void {
    this.logTransaction(PaymentEventType.PAYMENT_ATTEMPTED, LogLevel.INFO, {
      gatewayType,
      transactionId,
      amount,
      currency,
      status: 'attempted',
      userId,
      email,
      orderId,
      ipAddress,
    });
  }

  /**
   * Log a successful payment
   */
  public logPaymentSucceeded(
    gatewayType: string,
    transactionId: string,
    amount: number,
    currency: string,
    userId?: string,
    email?: string,
    orderId?: string
  ): void {
    this.logTransaction(PaymentEventType.PAYMENT_SUCCEEDED, LogLevel.INFO, {
      gatewayType,
      transactionId,
      amount,
      currency,
      status: 'succeeded',
      userId,
      email,
      orderId,
    });
  }

  /**
   * Log a failed payment
   */
  public logPaymentFailed(
    gatewayType: string,
    transactionId: string,
    amount: number,
    currency: string,
    errorCode?: string,
    errorMessage?: string,
    userId?: string,
    email?: string,
    orderId?: string
  ): void {
    this.logTransaction(PaymentEventType.PAYMENT_FAILED, LogLevel.ERROR, {
      gatewayType,
      transactionId,
      amount,
      currency,
      status: 'failed',
      errorCode,
      errorMessage,
      userId,
      email,
      orderId,
    });
  }
}

// Export singleton instance
export const paymentLogger = new PaymentTransactionLogger();
export default paymentLogger;