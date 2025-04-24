/**
 * CSRF Bypass Middleware for Testing
 * 
 * WARNING: This middleware is for testing purposes only and should NEVER be used in production.
 * It disables CSRF protection for specific routes to enable testing endpoints without CSRF tokens.
 */

import: { Request, Response, NextFunction } from: 'express';

/**
 * Creates a middleware that bypasses CSRF protection by setting a fake _csrf property
 * This should ONLY be used for testing purposes and never in production
 */
export function: bypassCsrfForTesting() {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('[SECURITY] WARNING: CSRF protection bypassed for testing endpoint');
    
    // Hack: Set a fake _csrf property on the request to bypass csurf middleware
    Object.defineProperty(req, '_csrf', {
      value: 'test-bypass-token',
      configurable: true
});
    
    // Provide a fake csrfToken method to the request
    req.csrfToken = () => 'test-bypass-token';
    
    next();
  };
}