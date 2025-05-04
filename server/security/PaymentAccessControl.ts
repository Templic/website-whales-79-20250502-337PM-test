/**
 * Payment Access Control
 * 
 * Implements PCI DSS requirements:
 * - 7.1 (Access Restrictions)
 * - 8.1-8.3 (Authentication)
 */

import { recordAuditEvent } from './secureAuditTrail';

/**
 * Types of payment operations
 */
export enum PaymentOperationType {
  CreateIntent = 'create-intent',
  ConfirmPayment = 'confirm',
  Refund = 'refund',
  CapturePayment = 'capture',
  ViewTransaction = 'view',
}

/**
 * Context for payment operations
 */
export interface PaymentContext {
  amount?: number;
  currency?: string;
  transactionId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  requiresAdditionalVerification?: boolean;
}

/**
 * Permission levels for users
 */
interface UserPermissions {
  maxAmount?: number;
  allowedCurrencies?: string[];
  allowedOperations?: PaymentOperationType[];
  requireAdditionalVerification?: boolean;
}

/**
 * Payment access control service for authorizing payment operations
 */
export class PaymentAccessControl {
  // Store user permissions (in a real system, this would use a database)
  private userPermissions: Map<string, UserPermissions> = new Map();
  
  // Default permissions for all users
  private defaultPermissions: UserPermissions = {
    maxAmount: 10000,
    allowedCurrencies: ['usd', 'eur', 'gbp'],
    allowedOperations: [
      PaymentOperationType.CreateIntent,
      PaymentOperationType.ConfirmPayment,
      PaymentOperationType.ViewTransaction
    ],
    requireAdditionalVerification: false
  };
  
  /**
   * Register permissions for a specific user
   */
  registerUserPermissions(userId: string, permissions: UserPermissions): void {
    // Merge with existing permissions if they exist
    const existingPermissions = this.userPermissions.get(userId);
    
    if (existingPermissions) {
      this.userPermissions.set(userId, {
        ...existingPermissions,
        ...permissions
      });
    } else {
      this.userPermissions.set(userId, permissions);
    }
  }
  
  /**
   * Verify authorization for a payment operation
   */
  async authorizePaymentOperation(
    userId: string,
    operation: PaymentOperationType,
    context: PaymentContext
  ): Promise<AuthorizationResult> {
    try {
      // Admin users can perform any operation
      const isAdmin = await this.isAdminUser(userId);
      if (isAdmin) {
        // Log admin access for audit trail
        await this.logAccessDecision(userId, operation, context, true, 'admin_override');
        
        return { 
          authorized: true,
          requiresAdditionalVerification: false
        };
      }
      
      // Get user permissions
      const permissions = this.getUserPermissions(userId);
      
      // Check if operation is allowed for this user
      if (!permissions.allowedOperations?.includes(operation)) {
        await this.logAccessDecision(userId, operation, context, false, 'operation_not_allowed');
        
        return {
          authorized: false,
          reason: 'OPERATION_NOT_ALLOWED'
        };
      }
      
      // Check amount-based authorization if applicable
      if (context.amount && permissions.maxAmount) {
        if (context.amount > permissions.maxAmount) {
          await this.logAccessDecision(userId, operation, context, false, 'amount_limit_exceeded');
          
          return {
            authorized: false,
            reason: 'AMOUNT_LIMIT_EXCEEDED'
          };
        }
      }
      
      // Check currency-based authorization if applicable
      if (context.currency && permissions.allowedCurrencies) {
        if (!permissions.allowedCurrencies.includes(context.currency.toLowerCase())) {
          await this.logAccessDecision(userId, operation, context, false, 'currency_not_allowed');
          
          return {
            authorized: false,
            reason: 'CURRENCY_NOT_ALLOWED'
          };
        }
      }
      
      // Check if additional verification is required
      const requiresAdditionalVerification = permissions.requireAdditionalVerification || 
        (context.amount && context.amount >= 5000); // Require additional verification for large amounts
      
      // Log the authorization decision
      await this.logAccessDecision(
        userId, 
        operation, 
        context, 
        true,
        requiresAdditionalVerification ? 'additional_verification_required' : 'standard_authorization'
      );
      
      return { 
        authorized: true,
        requiresAdditionalVerification
      };
    } catch (error) {
      console.error('[PaymentAccessControl] Error authorizing payment operation:', error);
      
      // Log the error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_AUTHORIZATION_ERROR',
        resource: `payment:${operation}`,
        userId,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          operation,
          context
        }
      });
      
      // Default to access denied in case of errors
      return {
        authorized: false,
        reason: 'AUTHORIZATION_ERROR'
      };
    }
  }
  
  /**
   * Check if a user is an admin
   * In a real system, this would check a database or auth service
   */
  private async isAdminUser(userId: string): Promise<boolean> {
    // Placeholder implementation
    return userId === 'admin';
  }
  
  /**
   * Get permissions for a user
   */
  private getUserPermissions(userId: string): UserPermissions {
    const userPermissions = this.userPermissions.get(userId);
    
    if (userPermissions) {
      // Merge with default permissions
      return {
        ...this.defaultPermissions,
        ...userPermissions
      };
    }
    
    return this.defaultPermissions;
  }
  
  /**
   * Log access control decision for audit trail
   */
  private async logAccessDecision(
    userId: string,
    operation: PaymentOperationType,
    context: PaymentContext,
    authorized: boolean,
    reason: string
  ): Promise<void> {
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_ACCESS_CONTROL',
      resource: `payment:${operation}`,
      userId,
      result: authorized ? 'success' : 'failure',
      severity: authorized ? 'info' : 'warning',
      details: {
        operation,
        authorized,
        reason,
        amount: context.amount,
        currency: context.currency,
        transactionId: context.transactionId,
        orderId: context.orderId
      }
    });
  }
}

// Create and export singleton instance
const paymentAccessControl = new PaymentAccessControl();
export default paymentAccessControl;