/**
 * Complete CSRF Bypass Middleware
 * 
 * This middleware provides a comprehensive bypass for all CSRF protection layers
 * in the application. It should ONLY be used for testing purposes and never in
 * production environments.
 * 
 * WARNING: This middleware bypasses critical security protections and should
 * only be used in controlled testing environments.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generates a fake CSRF token for testing purposes
 */
function generateFakeToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Completely bypasses all CSRF checks by modifying the request object
 * and adding necessary flags and tokens
 */
export function completeCsrfBypass() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log that we're bypassing CSRF for this request
    console.log(`[SECURITY BYPASS] Completely bypassing CSRF for: ${req.method} ${req.path}`);
    
    // Generate a fake CSRF token
    const fakeToken = generateFakeToken();
    
    // Add the fake token to the request object
    req.csrfToken = () => fakeToken;
    
    // Set the token in cookies for double-submit validation
    res.cookie('_csrf', fakeToken, { 
      httpOnly: true,
      sameSite: 'strict'
    });
    
    // Set all possible CSRF bypass flags
    (req as any).__skipCSRF = true;
    (req as any)._csrfBypass = true;
    (req as any).csrfValidated = true;
    (req as any).csrfValidationComplete = true;
    (req as any)._csrf = fakeToken;
    
    // Add the token to headers in case any code checks there
    req.headers['csrf-token'] = fakeToken;
    req.headers['x-csrf-token'] = fakeToken;
    req.headers['x-xsrf-token'] = fakeToken;
    
    // Add a verification flag in the request for our custom check
    (req as any).__csrfVerified = true;
    
    // Add our special bypass flag
    (req as any).bypassSecurityCheck = true;
    
    // Return valid token for any calls to req.csrfToken()
    (req as any).csrfToken = () => fakeToken;
    
    // Set secure headers for CSRF bypass
    res.set('X-CSRF-Bypass', 'true');
    res.set('X-Security-Bypass', 'Testing-Only');
    
    // Proceed to the next middleware
    next();
  };
}