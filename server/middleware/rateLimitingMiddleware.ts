/**
 * Rate Limiting Middleware
 * 
 * Implements PCI DSS requirements:
 * - 6.5.10 (Resource Exhaustion)
 * - 6.6 (Web Application Protection)
 */

import { Request, Response, NextFunction } from 'express';
import paymentRateLimiter from '../security/PaymentRateLimiter';
import { recordAuditEvent } from '../security/secureAuditTrail';
import { getClientIPFromRequest } from '../utils/security';

/**
 * Get actionable guidance for different rate limit types
 */
function getRateLimitGuidance(limitType: string): string {
  switch (limitType) {
    case 'exceeded':
      return 'You have exceeded the request rate limit. Please wait before making additional requests.';
    
    case 'blocked':
      return 'Your access has been temporarily blocked due to excessive requests. Please try again later.';
    
    case 'auto-blocked':
      return 'Your access has been automatically restricted due to suspicious activity. Please contact support if you believe this is in error.';
    
    default:
      return 'Please reduce your request rate and try again later.';
  }
}

/**
 * Middleware to apply payment-specific rate limiting
 */
export function rateLimitingMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Only apply rate limiting to payment routes
    if (!req.path.includes('/payment')) {
      return next();
    }
    
    // Check rate limits for this request
    const rateLimitResult = paymentRateLimiter.checkRateLimit(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '30'); // Default for payment operations
    
    if (rateLimitResult.remaining !== undefined) {
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    }
    
    if (rateLimitResult.retryAfter > 0) {
      res.setHeader('Retry-After', rateLimitResult.retryAfter.toString());
      res.setHeader('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + rateLimitResult.retryAfter).toString());
    }
    
    // If the request is not allowed, return a rate limit error
    if (!rateLimitResult.allowed) {
      // Log the rate limit violation
      const clientIp = getClientIPFromRequest(req);
      const userId = req.user?.id;
      
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'RATE_LIMIT_VIOLATION',
        resource: `payment:${req.path}`,
        userId: userId as string,
        ipAddress: clientIp,
        result: 'failure',
        severity: 'warning',
        details: {
          limitType: rateLimitResult.limitType,
          retryAfter: rateLimitResult.retryAfter,
          method: req.method,
          path: req.path
        }
      });
      
      // Return appropriate error response
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        // Provide actionable guidance based on the limit type
        guidance: getRateLimitGuidance(rateLimitResult.limitType)
      });
    }
    
    // If the request is allowed, proceed to the next middleware
    next();
  } catch (error) {
    // Log the error
    console.error('[RateLimitingMiddleware] Error:', error);
    
    const clientIp = getClientIPFromRequest(req);
    const userId = req.user?.id;
    
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_MIDDLEWARE_ERROR',
      resource: `payment:${req.path}`,
      userId: userId as string,
      ipAddress: clientIp,
      result: 'failure',
      severity: 'error',
      details: {
        error: error.message,
        method: req.method,
        path: req.path
      }
    });
    
    // Proceed to the next middleware in case of errors (fail open)
    next();
  }
}