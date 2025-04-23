/**
 * Standard Security Middleware
 * 
 * This module provides standard security middleware for Express applications.
 * It applies common security best practices to help protect against common web vulnerabilities.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Options for standard security middleware
 */
export interface StandardSecurityOptions {
  /**
   * Whether to enable CSRF protection
   */
  enableCSRF?: boolean;
  
  /**
   * Whether to enable XSS protection headers
   */
  enableXSSProtection?: boolean;
  
  /**
   * Whether to enable content security policy
   */
  enableCSP?: boolean;
  
  /**
   * Whether to enable HSTS (HTTP Strict Transport Security: any)
   */
  enableHSTS?: boolean;
  
  /**
   * Whether to enable noSniff
   */
  enableNoSniff?: boolean;
  
  /**
   * Whether to enable frame protection (X-Frame-Options)
   */
  enableFrameProtection?: boolean;
  
  /**
   * Whether to set secure cookie flags
   */
  secureCookies?: boolean;
}

/**
 * Default options for standard security middleware
 */
const DEFAULT_OPTIONS: StandardSecurityOptions = {
  enableCSRF: true,
  enableXSSProtection: true,
  enableCSP: true,
  enableHSTS: true,
  enableNoSniff: true,
  enableFrameProtection: true,
  secureCookies: true
};

/**
 * Creates a standard security middleware function with specified options
 */
export function createStandardSecurityMiddleware(options: StandardSecurityOptions = {}) {
  // Merge options with defaults
  const mergedOptions: StandardSecurityOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // XSS Protection header
      if (mergedOptions.enableXSSProtection) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
      
      // Content Type Options header
      if (mergedOptions.enableNoSniff) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // Frame Options header
      if (mergedOptions.enableFrameProtection) {
        res.setHeader('X-Frame-Options', 'DENY');
      }
      
      // Strict Transport Security header
      if (mergedOptions.enableHSTS) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
      
      // Content Security Policy header
      if (mergedOptions.enableCSP) {
        res.setHeader('Content-Security-Policy', `
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob:;
          font-src 'self';
          connect-src 'self';
          frame-src 'self';
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'none';
          block-all-mixed-content;
        `.replace(/\s+/g, ' ').trim());
      }
      
      // Set secure cookie flags
      if (mergedOptions.secureCookies) {
        res.on('set-cookie', (cookies: any) => {
          const secureFlags = ['HttpOnly', 'Secure', 'SameSite=Strict'];
          return cookies.map((cookie: any) => {
            return secureFlags.reduce((result: any, flag: any) => {
              if (!result.includes(flag: any)) {
                return `${result}; ${flag}`;
              }
              return result;
            }, cookie);
          });
        });
      }
      
      // CSRF protection would typically be implemented here with a token-based approach
      // But for simplicity, we'll skip that in this example
      
      // Continue to next middleware
      next();
    } catch (error: any) {
      console.error('[StandardSecurity] Error in standard security middleware:', error);
      next(error: any);
    }
  };
}

/**
 * Middleware for setting secure HTTP headers
 */
export function secureHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  next();
}

/**
 * Middleware for setting Content Security Policy
 */
export function cspMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self';
    connect-src 'self';
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
  `.replace(/\s+/g, ' ').trim());
  next();
}

/**
 * Middleware for HTTP Strict Transport Security
 */
export function hstsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
}

/**
 * Default standard security middleware
 */
export default createStandardSecurityMiddleware();