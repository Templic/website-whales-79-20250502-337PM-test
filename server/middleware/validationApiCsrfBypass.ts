/**
 * Validation API CSRF Bypass Middleware
 * 
 * This middleware is specifically designed to bypass CSRF protection for validation API test routes.
 * It mimics the approach used by the contentApiCsrfBypass middleware.
 * It should be applied BEFORE any CSRF protection middleware is registered.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Check if a request is to a validation API test route
 */
function isValidationTestRoute(path: string): boolean {
  return path.startsWith('/api/validation-test/') || 
         path.startsWith('/api/test/basic-validation') ||
         path.startsWith('/api/test/ai-security') ||
         path.startsWith('/api/test/validation-status');
}

/**
 * Middleware to set __skipCSRF flag on all validation API test routes
 * This ensures they will be excluded from CSRF checks
 */
export function validationApiCsrfBypass(req: Request, res: Response, next: NextFunction) {
  if (isValidationTestRoute(req.path)) {
    console.log(`[Validation API] Setting __skipCSRF flag for validation test route: ${req.path}`);
    
    // Set the special flag that our CSRF middleware checks for
    (req as any).__skipCSRF = true;
    
    // Also mark as verified to pass any additional checks
    (req as any).__csrfVerified = true;
    
    // Log CSRF bypass for debugging
    console.log(`[Security] CSRF protection bypassed for ${req.path}`);
  }
  
  next();
}