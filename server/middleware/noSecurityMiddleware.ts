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

/**
 * Middleware that disables all security checks
 */
export function noSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add a flag to the request to indicate that it's bypassing security
  (req as any).__bypassAllSecurity = true;
  
  // Log the bypass for debugging
  console.log(`[SECURITY BYPASS] Complete security bypass for: ${req.method} ${req.path}`);
  
  // Continue to the next middleware/route handler
  next();
}

/**
 * Middleware factory that creates a middleware function to check if a request
 * has the security bypass flag. This is used to conditionally skip other middleware.
 */
export function skipIfNoSecurity(middleware: (req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip the middleware if the request has the security bypass flag
    if ((req as any).__bypassAllSecurity === true) {
      console.log(`[SECURITY BYPASS] Skipping middleware for: ${req.method} ${req.path}`);
      return next();
    }
    
    // Otherwise, execute the middleware
    middleware(req, res, next);
  };
}