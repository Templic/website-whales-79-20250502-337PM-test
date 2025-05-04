/**
 * No Security Middleware
 * 
 * This middleware completely bypasses all security checks including CSRF validation
 * for specific testing routes. This is ONLY for testing purposes and should never
 * be used in production.
 * 
 * WARNING: This disables ALL security checks. Use with extreme caution.
 */

import { Request, Response, NextFunction } from 'express';

// Special symbol to mark requests as having no security
const NO_SECURITY_FLAG = '__noSecurity';

/**
 * Middleware that disables all security checks
 */
export function noSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Flag this request to bypass all security checks
  (req as any)[NO_SECURITY_FLAG] = true;
  (req as any).__skipCSRF = true;
  
  // Log that security is completely bypassed for this request
  console.log(`[SECURITY BYPASS] Complete security bypass for: ${req.method} ${req.path.split('?')[0]}`);
  
  // Add a header to indicate this is a no-security route (for debugging)
  res.setHeader('X-Security-Mode', 'COMPLETELY_BYPASSED');
  
  // Allow all origins for this specific request (CORS bypass)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Continue to the next middleware
  next();
}

/**
 * Middleware factory that creates a middleware function to check if a request
 * has the security bypass flag. This is used to conditionally skip other middleware.
 */
export function skipIfNoSecurity(middleware: (req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip the middleware if the request has the no-security flag
    if ((req as any)[NO_SECURITY_FLAG]) {
      return next();
    }
    
    // Otherwise, apply the middleware
    return middleware(req, res, next);
  };
}

/**
 * Utility to check if a request has the no-security flag
 */
export function hasNoSecurityFlag(req: Request): boolean {
  return Boolean((req as any)[NO_SECURITY_FLAG]);
}