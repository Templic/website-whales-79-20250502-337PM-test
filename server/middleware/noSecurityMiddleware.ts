/**
 * No Security Middleware
 * 
 * This middleware completely disables all security checks for test routes.
 * WARNING: This should NEVER be used in production or exposed publicly.
 * It is intended ONLY for internal testing of validation mechanisms.
 */

import { Request, Response, NextFunction } from 'express';

export const noSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set flags to bypass security checks
  (req as any).__noSecurity = true;
  (req as any).__skipCSRF = true;
  (req as any).__bypassRateLimiting = true;
  (req as any).__bypassAuthentication = true;
  (req as any).__bypassAuthorization = true;
  (req as any).__bypassInputValidation = true;
  (req as any).__bypassSecurityValidation = true;
  (req as any).__bypassTokenVerification = true;
  
  // Also bypass any potential external checks
  (req as any).__externalSecurityValidation = 'BYPASSED';
  (req as any).__securityMode = 'COMPLETELY_BYPASSED';
  
  // Set headers to indicate no security
  res.setHeader('X-Security-Mode', 'COMPLETELY_BYPASSED');
  res.setHeader('X-Security-Notice', 'NO SECURITY - TEST ONLY');
  
  // Disable CORS restrictions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Log the security bypass
  console.log(`[NO-SECURITY] Complete security bypass for ${req.method} ${req.path}`);
  
  next();
};