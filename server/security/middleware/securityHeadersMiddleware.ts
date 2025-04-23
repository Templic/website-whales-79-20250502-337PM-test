/**
 * Security Headers Middleware
 * 
 * This middleware applies security headers to all responses to protect against
 * various web vulnerabilities like XSS, clickjacking, etc.
 * 
 * Following OWASP Security Headers best practices.
 */

import { Request, Response, NextFunction } from 'express';
import { applySecurityHeaders } from '../utils/securityUtils';

/**
 * Middleware that applies security headers to all responses
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Apply security headers
  applySecurityHeaders(res);
  
  // Continue to the next middleware
  next();
}

/**
 * Create a custom security headers middleware with specific options
 */
export function createSecurityHeadersMiddleware(options: {
  contentSecurityPolicy?: string | false;
  strictTransportSecurity?: string | false;
  xContentTypeOptions?: string | false;
  xFrameOptions?: string | false;
  xXssProtection?: string | false;
  referrerPolicy?: string | false;
  permissionsPolicy?: string | false;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Content-Security-Policy
    if (options.contentSecurityPolicy !== false) {
      res.setHeader('Content-Security-Policy', options.contentSecurityPolicy || 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://analytics.example.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https://img.example.com; " +
        "connect-src 'self' https://api.example.com; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
      );
    }
    
    // Strict-Transport-Security
    if (options.strictTransportSecurity !== false) {
      res.setHeader('Strict-Transport-Security', options.strictTransportSecurity || 
        'max-age=31536000; includeSubDomains; preload'
      );
    }
    
    // X-Content-Type-Options
    if (options.xContentTypeOptions !== false) {
      res.setHeader('X-Content-Type-Options', options.xContentTypeOptions || 'nosniff');
    }
    
    // X-Frame-Options
    if (options.xFrameOptions !== false) {
      res.setHeader('X-Frame-Options', options.xFrameOptions || 'DENY');
    }
    
    // X-XSS-Protection
    if (options.xXssProtection !== false) {
      res.setHeader('X-XSS-Protection', options.xXssProtection || '1; mode=block');
    }
    
    // Referrer-Policy
    if (options.referrerPolicy !== false) {
      res.setHeader('Referrer-Policy', options.referrerPolicy || 'strict-origin-when-cross-origin');
    }
    
    // Permissions-Policy
    if (options.permissionsPolicy !== false) {
      res.setHeader('Permissions-Policy', options.permissionsPolicy || 
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      );
    }
    
    // Continue to the next middleware
    next();
  };
}

/**
 * Create a security headers middleware for API routes
 */
export const apiSecurityHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'no-referrer',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()'
});

/**
 * Create a security headers middleware for static content routes
 */
export const staticContentSecurityHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://analytics.example.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://img.example.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests;",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
});