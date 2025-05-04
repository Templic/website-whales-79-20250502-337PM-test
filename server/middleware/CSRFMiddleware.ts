/**
 * CSRF Middleware
 * 
 * This middleware creates a simplified wrapper around the CSRF protection service
 * to make it easy to apply consistently throughout the application.
 */

import { Request, Response, NextFunction } from 'express';
import { csrfProtection, csrfTokenSetter } from '../security/advanced/csrf/CSRFProtectionService';
import { securityConfig } from '../security/advanced/config/SecurityConfig';

/**
 * Standard CSRF protection middleware - Use for routes that modify data
 */
export function CSRFProtection(req: Request, res: Response, next: NextFunction) {
  // Skip if CSRF protection is globally disabled
  if (!securityConfig.isFeatureEnabled('csrfProtection')) {
    return next();
  }
  
  return csrfProtection(req, res, next);
}

/**
 * Token setter middleware - Use for GET routes that render forms
 */
export function CSRFTokenSetter(req: Request, res: Response, next: NextFunction) {
  // Skip if CSRF protection is globally disabled
  if (!securityConfig.isFeatureEnabled('csrfProtection')) {
    return next();
  }
  
  return csrfTokenSetter(req, res, next);
}

// Helper function to get CSRF token from request
export function getCSRFToken(req: Request): string | undefined {
  // Skip if CSRF protection is globally disabled
  if (!securityConfig.isFeatureEnabled('csrfProtection')) {
    return undefined;
  }
  
  // Use type assertion to handle potential undefined
  const cookieToken = req.cookies && req.cookies['csrf-token'];
  return typeof cookieToken === 'string' ? cookieToken : undefined;
}

// Helper to create the hidden input field for forms
export function csrfField(req: Request): string {
  // Skip if CSRF protection is globally disabled
  if (!securityConfig.isFeatureEnabled('csrfProtection')) {
    return '';
  }
  
  const token = getCSRFToken(req);
  if (!token) {
    return '';
  }
  
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}