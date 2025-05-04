/**
 * Content API CSRF Bypass Middleware
 * 
 * This middleware is specifically designed to bypass CSRF protection for content API routes.
 * It should be applied BEFORE any CSRF protection middleware to ensure content API routes are never checked.
 * 
 * This enhanced version also handles service workers and refreshes tokens when needed.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Check if a request is to a content API route
 */
function isContentApiRoute(path: string): boolean {
  return path.startsWith('/api/content/') || 
         path.startsWith('/api/content-ai/') || 
         path.startsWith('/api/content-recommendations/');
}

/**
 * Check if this is a special path that needs CSRF exemption
 */
function needsCsrfExemption(path: string): boolean {
  const exemptPaths = [
    '/service-worker.js',
    '/manifest.json',
    '/sw.js',
    '/taskade-embed'
  ];
  
  const exemptPathPrefixes = [
    '/taskade-'
  ];
  
  // Check exact path matches
  if (exemptPaths.includes(path)) {
    return true;
  }
  
  // Check path prefixes
  for (const prefix of exemptPathPrefixes) {
    if (path.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Middleware to set __skipCSRF flag on all content API routes
 * This ensures they will be excluded from CSRF checks
 */
export function contentApiCsrfBypass(req: Request, res: Response, next: NextFunction) {
  // Handle content API routes
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
    
    // Check if we need to refresh the CSRF token
    if (req.session && (!req.session['csrf-token'] || 
        Date.now() - (req.session['csrf-token-timestamp'] || 0) > 15 * 60 * 1000)) {
      
      // Generate a new random token for the session
      const csrfToken = crypto.randomBytes(32).toString('hex');
      
      // Store it in the session
      req.session['csrf-token'] = csrfToken;
      req.session['csrf-token-timestamp'] = Date.now();
      
      console.log(`[Content API] Regenerated CSRF token for stale or missing token`);
      
      // Also set it in a cookie for single-page applications
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
  }
  
  // Handle special exempt paths like service workers
  if (needsCsrfExemption(req.path)) {
    console.log(`[CSRF Debug] Exempting special path from CSRF: ${req.path}`);
    (req as any).__skipCSRF = true;
  }
  
  next();
}