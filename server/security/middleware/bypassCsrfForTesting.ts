/**
 * Comprehensive CSRF Bypass Middleware for Testing
 * 
 * WARNING: This middleware is for testing purposes only and should NEVER be used in production.
 * It disables CSRF protection for specific routes to enable testing endpoints without CSRF tokens.
 * 
 * This enhanced version bypasses multiple layers of CSRF protection by:
 * 1. Setting the __skipCSRF flag directly on the request object
 * 2. Setting a fake CSRF token
 * 3. Providing a fake csrfToken() method
 * 4. Adding CSRF headers to the response
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Creates a middleware that comprehensively bypasses all layers of CSRF protection
 * This should ONLY be used for testing purposes and never in production
 */
export function bypassCsrfForTesting() {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('[SECURITY] WARNING: CSRF protection bypassed for testing endpoint:', req.path);
    
    // Set the __skipCSRF flag that the middleware checks for
    (req as any).__skipCSRF = true;
    
    // Set the _csrf property for the csurf middleware
    Object.defineProperty(req, '_csrf', {
      value: 'test-bypass-token',
      configurable: true
    });
    
    // Provide a fake csrfToken method to the request
    req.csrfToken = () => 'test-bypass-token';
    
    // Set a header that can be checked to verify bypass is active
    res.setHeader('X-CSRF-Bypass', 'testing');
    
    // Set the standard CSRF token header
    res.setHeader('X-CSRF-Token', 'test-bypass-token');
    
    // Add a response hook to ensure CSRF headers are on the response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      if (!res.headersSent) {
        // Ensure the CSRF bypass flag is set
        res.setHeader('X-CSRF-Bypass', 'testing');
        res.setHeader('X-CSRF-Token', 'test-bypass-token');
      }
      // @ts-ignore
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}