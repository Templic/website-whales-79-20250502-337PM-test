/**
 * Replit Bypass Middleware
 * 
 * This middleware completely bypasses security checks when running in Replit development environment.
 * This is necessary to ensure the app loads correctly in the Replit preview pane.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Detect if running in Replit environment
 */
export function isReplitEnvironment(): boolean {
  return !!(process.env.REPLIT_DOMAINS || process.env.REPL_ID || process.env.REPL_SLUG);
}

/**
 * Middleware that bypasses security checks for Replit environment
 */
export function replitBypassMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isReplitEnvironment() && process.env.NODE_ENV !== 'production') {
    console.log('[Replit] Bypassing security checks for Replit development environment');
    
    // Mark the request as exempt from CSRF and other security checks
    (req as any).__isViteResource = true;
    (req as any).__skipCSRF = true;
    (req as any).__noSecurity = true;
    
    // Also set headers to allow embedding
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  
  next();
}

export default replitBypassMiddleware;