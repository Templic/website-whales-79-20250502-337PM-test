/**
 * Transaction Security Middleware
 * 
 * Implements PCI DSS requirements:
 * - 10.2 (Automated Audit Trails)
 * - 10.6 (Log Review)
 */

import { Request, Response, NextFunction } from 'express';
import transactionSecurityMonitor from '../security/TransactionSecurityMonitor';
import { recordAuditEvent } from '../security/secureAuditTrail';
import { getClientIPFromRequest } from '../utils/security';

/**
 * Middleware to monitor payment transactions for suspicious activity
 */
export function transactionSecurityMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip non-payment routes
  if (!req.path.includes('/payment')) {
    return next();
  }
  
  // Skip GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  try {
    const clientIp = getClientIPFromRequest(req);
    const userId = req.user?.id;
    
    // Extract transaction data from request
    const transactionData = {
      transactionId: req.body.paymentMethodId || req.body.transactionId || `req_${Date.now()}`,
      userId: userId,
      ipAddress: clientIp,
      timestamp: new Date().toISOString(),
      amount: req.body.amount || 0,
      currency: req.body.currency || 'usd',
      paymentMethod: req.body.paymentMethod,
      path: req.path,
      method: req.method
    };
    
    // Record the transaction for future pattern analysis
    transactionSecurityMonitor.recordTransaction(transactionData);
    
    // Analyze transaction risk
    const riskAssessment = transactionSecurityMonitor.analyzeTransactionRisk(transactionData);
    
    // Add risk assessment to request for use in later middleware or routes
    req.transactionRisk = riskAssessment;
    
    // Add headers to indicate risk assessment
    res.setHeader('X-Transaction-Risk-Score', riskAssessment.score.toString());
    
    // Handle high-risk transactions
    if (riskAssessment.recommendation === 'deny') {
      // Log denied transaction
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'HIGH_RISK_TRANSACTION_DENIED',
        resource: `payment:${req.path}`,
        userId: userId as string,
        ipAddress: clientIp,
        result: 'failure',
        severity: 'warning',
        details: {
          transactionId: transactionData.transactionId,
          riskScore: riskAssessment.score,
          factors: riskAssessment.factors,
          path: req.path,
          method: req.method
        }
      });
      
      // Return error response
      return res.status(403).json({
        success: false,
        message: 'Transaction denied due to security concerns',
        reason: 'high_risk',
        guidance: 'Please contact customer support or try a different payment method.'
      });
    }
    
    // For 'challenge' recommendation, we could implement additional verification
    // In this implementation, we'll just log it and allow with a warning
    if (riskAssessment.recommendation === 'challenge') {
      // Log challenged transaction
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'SUSPICIOUS_TRANSACTION_FLAGGED',
        resource: `payment:${req.path}`,
        userId: userId as string,
        ipAddress: clientIp,
        result: 'success',
        severity: 'warning',
        details: {
          transactionId: transactionData.transactionId,
          riskScore: riskAssessment.score,
          factors: riskAssessment.factors,
          path: req.path,
          method: req.method
        }
      });
      
      // In a real implementation, we would redirect to a challenge page
      // For now, we'll just add a flag to the request and continue
      req.requiresAdditionalVerification = true;
    }
    
    next();
  } catch (error) {
    // Log the error
    console.error('[TransactionSecurityMiddleware] Error:', error);
    
    const clientIp = getClientIPFromRequest(req);
    const userId = req.user?.id;
    
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'TRANSACTION_SECURITY_MIDDLEWARE_ERROR',
      resource: `payment:${req.path}`,
      userId: userId as string,
      ipAddress: clientIp,
      result: 'failure',
      severity: 'error',
      details: {
        error: error.message,
        path: req.path,
        method: req.method
      }
    });
    
    // Continue to next middleware even in case of error (fail open)
    next();
  }
}

// Extend Express Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      transactionRisk?: {
        score: number;
        factors: string[];
        recommendation: 'allow' | 'review' | 'challenge' | 'deny';
      };
      requiresAdditionalVerification?: boolean;
    }
  }
}