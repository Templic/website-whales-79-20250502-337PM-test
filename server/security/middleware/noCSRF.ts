/**
 * NoCSRF Middleware
 * 
 * This middleware completely bypasses CSRF protection by adding special flags
 * to the request object. It's specifically designed for testing API endpoints
 * without worrying about CSRF validation.
 * 
 * WARNING: This middleware should NEVER be used in production environments.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that completely bypasses CSRF protection
 */
export function noCSRF() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Set internal flags to skip CSRF verification
    (req as any).__skipCSRF = true;
    (req as any).__csrfVerified = true;
    
    // Add debug flag to indicate this route was exempted from CSRF protection
    (req as any).__csrfSkipReason = 'test-api-validation';
    
    console.log('[Security] CSRF protection bypassed for route using noCSRF middleware');
    
    next();
  };
}