/**
 * Security Headers Middleware
 * 
 * This middleware adds various security headers to HTTP responses to protect against
 * common web vulnerabilities such as XSS, clickjacking, and MIME sniffing.
 */

import { Request, Response, NextFunction } from 'express';
import { generateNonce } from '../utils/securityUtils';

/**
 * Options for configuring security headers
 */
export interface SecurityHeadersOptions {
  contentSecurityPolicy?: string | false;
  strictTransportSecurity?: string | false;
  xFrameOptions?: string | false;
  xContentTypeOptions?: string | false;
  referrerPolicy?: string | false;
  permissionsPolicy?: string | false;
  xXssProtection?: string | false;
  cacheControl?: string | false;
}

/**
 * Default security headers configuration
 */
const defaultOptions: SecurityHeadersOptions = {
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
    "form-action 'self';",
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  xXssProtection: '1; mode=block',
  cacheControl: 'no-store, max-age=0, must-revalidate'
};

/**
 * Creates a middleware that adds security headers to responses
 * 
 * @param options Custom security headers options
 * @returns Express middleware
 */
export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions = defaultOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Add Content-Security-Policy header
    if (mergedOptions.contentSecurityPolicy) {
      res.setHeader('Content-Security-Policy', mergedOptions.contentSecurityPolicy);
    }
    
    // Add Strict-Transport-Security header
    if (mergedOptions.strictTransportSecurity) {
      res.setHeader('Strict-Transport-Security', mergedOptions.strictTransportSecurity);
    }
    
    // Add X-Frame-Options header
    if (mergedOptions.xFrameOptions) {
      res.setHeader('X-Frame-Options', mergedOptions.xFrameOptions);
    }
    
    // Add X-Content-Type-Options header
    if (mergedOptions.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', mergedOptions.xContentTypeOptions);
    }
    
    // Add Referrer-Policy header
    if (mergedOptions.referrerPolicy) {
      res.setHeader('Referrer-Policy', mergedOptions.referrerPolicy);
    }
    
    // Add Permissions-Policy header
    if (mergedOptions.permissionsPolicy) {
      res.setHeader('Permissions-Policy', mergedOptions.permissionsPolicy);
    }
    
    // Add X-XSS-Protection header
    if (mergedOptions.xXssProtection) {
      res.setHeader('X-XSS-Protection', mergedOptions.xXssProtection);
    }
    
    // Add Cache-Control header
    if (mergedOptions.cacheControl) {
      res.setHeader('Cache-Control', mergedOptions.cacheControl);
    }
    
    next();
  };
}

/**
 * Default security headers middleware with standard configuration
 */
export const securityHeadersMiddleware = createSecurityHeadersMiddleware();

/**
 * Security headers middleware for static content with relaxed CSP
 */
export const staticContentSecurityHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' data:; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-src 'none'; " +
    "object-src 'none';",
  cacheControl: 'public, max-age=31536000, immutable'
});

/**
 * Security headers middleware for API endpoints with extra strict CSP
 */
export const apiSecurityHeadersMiddleware = createSecurityHeadersMiddleware({
  contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none'; form-action 'none';",
  cacheControl: 'no-store, no-cache, must-revalidate, max-age=0',
  xFrameOptions: 'DENY'
});

/**
 * Security headers middleware with nonce generation for CSP
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next middleware function
 */
export function nonceSecurityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate a nonce for this request
  const nonce = generateNonce();
  
  // Store the nonce in the response locals for use in templates
  res.locals.cspNonce = nonce;
  
  // Set CSP header with nonce
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' 'nonce-${nonce}'; ` +
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com; ` +
    `font-src 'self' https://fonts.gstatic.com; ` +
    `img-src 'self' data: https://img.example.com; ` +
    `connect-src 'self' https://api.example.com; ` +
    `frame-src 'none'; ` +
    `object-src 'none'; ` +
    `base-uri 'self'; ` +
    `form-action 'self';`
  );
  
  // Add other security headers
  res.setHeader('Strict-Transport-Security', defaultOptions.strictTransportSecurity!);
  res.setHeader('X-Frame-Options', defaultOptions.xFrameOptions!);
  res.setHeader('X-Content-Type-Options', defaultOptions.xContentTypeOptions!);
  res.setHeader('Referrer-Policy', defaultOptions.referrerPolicy!);
  res.setHeader('Permissions-Policy', defaultOptions.permissionsPolicy!);
  res.setHeader('X-XSS-Protection', defaultOptions.xXssProtection!);
  res.setHeader('Cache-Control', defaultOptions.cacheControl!);
  
  next();
}