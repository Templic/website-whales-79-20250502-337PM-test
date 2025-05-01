/**
 * CSRF Protection Wrapper
 * 
 * This module provides a simplified wrapper around the CSRFProtection module
 * for easy integration with the SecurityMiddleware.
 */

import { Request, Response, NextFunction } from 'express';
import { csrfProtection, csrfMiddleware } from './CSRFProtection';
import { csrfExemptRoutes } from '../../../utils/auth-config';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

/**
 * Enhanced CSRF middleware with support for exempt routes
 */
export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip for methods that don't modify state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Check if route is exempt
  for (const exemptRoute of csrfExemptRoutes) {
    // Support wildcard matching
    if (exemptRoute.endsWith('*') && req.path.startsWith(exemptRoute.slice(0, -1))) {
      return next();
    }
    
    // Exact match
    if (req.path === exemptRoute) {
      return next();
    }
  }
  
  // Log that CSRF protection is being applied
  logSecurityEvent({
    category: SecurityEventCategory.CSRF,
    severity: SecurityEventSeverity.LOW,
    message: 'CSRF protection applied',
    data: {
      path: req.path,
      method: req.method,
      ip: req.ip
    }
  });
  
  // Apply the CSRF middleware
  return csrfMiddleware(req, res, next);
}

/**
 * Initialize a new CSRF token
 */
export function initializeCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const token = csrfProtection.setTokenCookie(res);
  res.setHeader('X-CSRF-Token', token);
  next();
}

/**
 * Get CSRF token for a response
 */
export function getCsrfToken(res: Response): string {
  return csrfProtection.setTokenCookie(res);
}

export default {
  csrfProtectionMiddleware,
  initializeCsrfToken,
  getCsrfToken
};