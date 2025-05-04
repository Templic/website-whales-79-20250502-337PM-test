/**
 * Content API CSRF Bypass Middleware
 * 
 * This middleware is specifically designed to bypass CSRF protection for content API routes.
 * It should be applied BEFORE any CSRF protection middleware to ensure content API routes are never checked.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Check if a request is to a content API route
 */
function isContentApiRoute(path: string): boolean {
  return path.startsWith('/api/content/') || 
         path.startsWith('/api/content-ai/') || 
         path.startsWith('/api/content-recommendations/');
}

/**
 * Middleware to set __skipCSRF flag on all content API routes
 * This ensures they will be excluded from CSRF checks
 */
export function contentApiCsrfBypass(req: Request, res: Response, next: NextFunction) {
  if (isContentApiRoute(req.path)) {
    console.log(`[Content API] Setting __skipCSRF flag for content API route: ${req.path}`);
    
    // Set the special flag that our CSRF middleware checks for
    (req as any).__skipCSRF = true;
    
    // Set special headers to ensure content API requests can be embedded
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    
    // Remove Iframe and CSP restrictions 
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
  }
  
  next();
}