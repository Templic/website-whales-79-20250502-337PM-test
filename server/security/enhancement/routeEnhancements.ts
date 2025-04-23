/**
 * Route Security Enhancements
 * 
 * This module applies security enhancements to existing routes.
 */

import express, { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/apiValidation';
import { RateLimiters } from '../middleware/rateLimiters';
import { 
  securityLogsQuerySchema,
  securityScanQuerySchema,
  securityAuthScanQuerySchema
} from '../validation/securityValidationSchemas';
import { applySecurityHeaders } from '../utils/securityUtils';
import { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';

/**
 * Apply enhanced security to the test security logs endpoint
 */
export function enhanceSecurityLogsEndpoint(app: express.Application) {
  const originalHandler = app._router.stack
    .filter((layer: any) => layer.route && layer.route.path === '/api/test/security/logs')
    .map((layer: any) => layer.route.stack[0].handle)[0];

  if (!originalHandler) {
    console.warn('Could not find the original security logs endpoint handler');
    return;
  }

  // Remove the original route
  app._router.stack = app._router.stack
    .filter((layer: any) => !(layer.route && layer.route.path === '/api/test/security/logs'));

  // Re-add the route with enhanced security
  app.get(
    '/api/test/security/logs',
    // Apply rate limiting
    RateLimiters.securityEndpoint,
    // Apply input validation
    validate({
      query: securityLogsQuerySchema
    }),
    // Apply the original handler with enhanced security
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Apply security headers
        applySecurityHeaders(res);
        
        // Log access to security logs
        await securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.MEDIUM,
          category: SecurityEventCategory.ACCESS_ATTEMPT,
          message: 'Access to security logs',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            userAgent: req.headers['user-agent']
          }
        });
        
        // Call the original handler
        originalHandler(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );
}

/**
 * Apply enhanced security to the security scan endpoint
 */
export function enhanceSecurityScanEndpoint(app: express.Application) {
  const originalHandler = app._router.stack
    .filter((layer: any) => layer.route && layer.route.path === '/api/security/scan')
    .map((layer: any) => layer.route.stack[0].handle)[0];

  if (!originalHandler) {
    console.warn('Could not find the original security scan endpoint handler');
    return;
  }

  // Remove the original route
  app._router.stack = app._router.stack
    .filter((layer: any) => !(layer.route && layer.route.path === '/api/security/scan'));

  // Re-add the route with enhanced security
  app.get(
    '/api/security/scan',
    // Apply rate limiting
    RateLimiters.securityEndpoint,
    // Apply input validation
    validate({
      query: securityScanQuerySchema
    }),
    // Apply the original handler with enhanced security
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Apply security headers
        applySecurityHeaders(res);
        
        // Call the original handler
        originalHandler(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );
}

/**
 * Apply enhanced security to the auth security scan endpoint
 */
export function enhanceAuthSecurityScanEndpoint(app: express.Application) {
  const originalHandler = app._router.stack
    .filter((layer: any) => layer.route && layer.route.path === '/api/security/auth-scan')
    .map((layer: any) => layer.route.stack[0].handle)[0];

  if (!originalHandler) {
    console.warn('Could not find the original auth security scan endpoint handler');
    return;
  }

  // Remove the original route
  app._router.stack = app._router.stack
    .filter((layer: any) => !(layer.route && layer.route.path === '/api/security/auth-scan'));

  // Re-add the route with enhanced security
  app.get(
    '/api/security/auth-scan',
    // Apply rate limiting
    RateLimiters.securityEndpoint,
    // Apply input validation
    validate({
      query: securityAuthScanQuerySchema
    }),
    // Apply the original handler with enhanced security
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Apply security headers
        applySecurityHeaders(res);
        
        // Call the original handler
        originalHandler(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );
}

/**
 * Apply all route enhancements
 */
export function applyRouteEnhancements(app: express.Application) {
  enhanceSecurityLogsEndpoint(app);
  enhanceSecurityScanEndpoint(app);
  enhanceAuthSecurityScanEndpoint(app);
  
  console.log('[Security] Applied enhanced security to 3 vulnerable endpoints');
}