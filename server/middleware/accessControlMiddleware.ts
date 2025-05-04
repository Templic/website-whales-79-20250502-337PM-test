/**
 * Access Control Middleware
 * 
 * Implements PCI DSS requirements:
 * - 7.1 (Access Restrictions)
 * - 8.1-8.3 (Authentication)
 */

import { Request, Response, NextFunction } from 'express';
import paymentAccessControl, { PaymentOperationType, PaymentContext } from '../security/PaymentAccessControl';
import { recordAuditEvent } from '../security/secureAuditTrail';
import { getClientIPFromRequest } from '../utils/security';

/**
 * Get user-friendly message for access denied reason
 */
function getAccessDeniedMessage(reason: string): string {
  switch (reason) {
    case 'OPERATION_NOT_ALLOWED':
      return 'You do not have permission to perform this payment operation';
    
    case 'AMOUNT_LIMIT_EXCEEDED':
      return 'The payment amount exceeds your authorized limit';
    
    case 'CURRENCY_NOT_ALLOWED':
      return 'The payment currency is not supported for your account';
    
    case 'AUTHORIZATION_ERROR':
      return 'An error occurred during payment authorization';
    
    default:
      return 'Payment operation not authorized';
  }
}

/**
 * Middleware factory to verify payment operation authorization
 */
export function requirePaymentAuthorization(operation: PaymentOperationType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip for non-authenticated requests (auth should be handled by another middleware)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for payment operations'
        });
      }
      
      const userId = req.user.id;
      const clientIp = getClientIPFromRequest(req);
      
      // Extract payment context from request
      const context: PaymentContext = {
        amount: req.body.amount,
        currency: req.body.currency,
        transactionId: req.body.paymentMethodId || req.body.transactionId,
        orderId: req.body.orderId,
        metadata: req.body.metadata
      };
      
      // Check authorization
      const authResult = await paymentAccessControl.authorizePaymentOperation(
        userId,
        operation,
        context
      );
      
      // If not authorized, return error
      if (!authResult.authorized) {
        // Log access denied
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_ACCESS_DENIED',
          resource: `payment:${operation}`,
          userId: userId,
          ipAddress: clientIp,
          result: 'failure',
          severity: 'warning',
          details: {
            operation,
            reason: authResult.reason,
            path: req.path,
            method: req.method
          }
        });
        
        // Return error response with appropriate message
        return res.status(403).json({
          success: false,
          message: getAccessDeniedMessage(authResult.reason)
        });
      }
      
      // If additional verification is required, add flag to request
      if (authResult.requiresAdditionalVerification) {
        req.requiresAdditionalVerification = true;
      }
      
      // Authorization successful, proceed to next middleware
      next();
    } catch (error) {
      // Log the error
      console.error('[AccessControlMiddleware] Error:', error);
      
      const userId = req.user?.id;
      const clientIp = getClientIPFromRequest(req);
      
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_ACCESS_CONTROL_ERROR',
        resource: `payment:${operation}`,
        userId: userId as string,
        ipAddress: clientIp,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          operation,
          path: req.path,
          method: req.method
        }
      });
      
      // Return error response
      return res.status(500).json({
        success: false,
        message: 'An error occurred during payment authorization'
      });
    }
  };
}