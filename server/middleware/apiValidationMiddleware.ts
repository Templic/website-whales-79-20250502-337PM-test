/**
 * API Validation Middleware
 * 
 * Implements PCI DSS requirements:
 * - 6.5.1 (Injection Flaws)
 * - 6.5.3 (Insecure Inputs)
 * - 6.5.5 (Improper Error Handling)
 */

import { Request, Response, NextFunction } from 'express';
import paymentValidationService from '../validation/PaymentValidationService';
import { recordAuditEvent } from '../security/secureAuditTrail';
import { getClientIPFromRequest } from '../utils/security';

/**
 * Middleware to validate payment API requests and sanitize responses
 */
export function apiValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Skip validation for non-payment routes
    if (!req.path.includes('/payment')) {
      return next();
    }
    
    // Skip validation for GET requests (they shouldn't modify payment data)
    if (req.method === 'GET') {
      return next();
    }
    
    // Get client IP for audit trail
    const clientIp = getClientIPFromRequest(req);
    const userId = req.user?.id || req.session?.userId;
    
    // Log the validation attempt
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_API_VALIDATION',
      resource: `payment:${req.path}`,
      userId: userId as string,
      ipAddress: clientIp,
      result: 'pending',
      severity: 'info',
      details: {
        method: req.method,
        path: req.path
      }
    });
    
    // Validate incoming request
    const validation = paymentValidationService.validatePaymentRequest(req.path, req.body);
    
    if (!validation.valid) {
      // Log validation failure
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'PAYMENT_API_VALIDATION_FAILURE',
        resource: `payment:${req.path}`,
        userId: userId as string,
        ipAddress: clientIp,
        result: 'failure',
        severity: 'warning',
        details: {
          method: req.method,
          path: req.path,
          errors: validation.errors
        }
      });
      
      // Return validation errors
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors || ['Invalid request data']
      });
    }
    
    // If validation passed, update the request body with the validated data
    req.body = validation.data;
    
    // Override res.json to validate responses
    const originalJson = res.json;
    res.json = function(body: any): any {
      try {
        // Validate and sanitize response
        const validatedResponse = paymentValidationService.validateResponse(req.path, body);
        
        // Use the validated response data
        return originalJson.call(this, validatedResponse.data);
      } catch (error) {
        // Log response validation error
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'PAYMENT_RESPONSE_VALIDATION_ERROR',
          resource: `payment:${req.path}`,
          userId: userId as string,
          ipAddress: clientIp,
          result: 'failure',
          severity: 'error',
          details: {
            method: req.method,
            path: req.path,
            error: error.message
          }
        });
        
        // Fallback to original response
        return originalJson.call(this, body);
      }
    };
    
    next();
  } catch (error) {
    // Log unexpected validation middleware error
    const clientIp = getClientIPFromRequest(req);
    const userId = req.user?.id || req.session?.userId;
    
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'PAYMENT_API_VALIDATION_ERROR',
      resource: `payment:${req.path}`,
      userId: userId as string,
      ipAddress: clientIp,
      result: 'failure',
      severity: 'error',
      details: {
        method: req.method,
        path: req.path,
        error: error.message
      }
    });
    
    // Don't expose internal error details - send generic error message
    return res.status(500).json({
      success: false,
      message: 'An error occurred during request validation'
    });
  }
}