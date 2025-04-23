/**
 * Security Patterns
 * 
 * This module provides common security patterns and helpers for use throughout the application.
 * These patterns help ensure consistent security implementation and reduce the risk of security errors.
 */

import { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/apiValidation';
import { 
  standardRateLimiter, 
  authRateLimiter, 
  adminRateLimiter 
} from '../middleware/rateLimiters';
import { securityHeadersMiddleware } from '../middleware/securityHeadersMiddleware';
import { isAuthenticated, hasRole, logSecurityEvent } from './securityUtils';
import { AnyZodObject } from 'zod';

/**
 * Creates a secure route handler with standard security practices
 * 
 * @param schema Validation schema for request body
 * @param handler Route handler function
 * @returns Express middleware chain
 */
export function secureRoute(schema: AnyZodObject, handler: (req: Request, res: Response, next: NextFunction) => any) {
  return [
    standardRateLimiter(),
    validate(schema, 'body'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!isAuthenticated(req)) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      return handler(req, res, next);
    }
  ];
}

/**
 * Creates a secure admin route handler with enhanced security for admin routes
 * 
 * @param schema Validation schema for request body
 * @param handler Route handler function
 * @returns Express middleware chain
 */
export function secureAdminRoute(schema: AnyZodObject, handler: (req: Request, res: Response, next: NextFunction) => any) {
  return [
    adminRateLimiter(),
    validate(schema, 'body'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!isAuthenticated(req)) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      if (!hasRole(req, 'admin')) {
        logSecurityEvent('ACCESS_DENIED', {
          ip: req.ip,
          path: req.path,
          userId: (req.session as any)?.userId,
          reason: 'Missing admin role',
          timestamp: new Date()
        });
        
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      return handler(req, res, next);
    }
  ];
}

/**
 * Creates a secure public route handler that allows unauthenticated access
 * but still applies validation, rate limiting, and security headers
 * 
 * @param schema Validation schema for request body
 * @param handler Route handler function
 * @returns Express middleware chain
 */
export function securePublicRoute(schema: AnyZodObject, handler: (req: Request, res: Response, next: NextFunction) => any) {
  return [
    standardRateLimiter(),
    validate(schema, 'body'),
    securityHeadersMiddleware,
    handler
  ];
}

/**
 * Creates a secure authentication route handler with special security for auth actions
 * 
 * @param schema Validation schema for request body
 * @param handler Route handler function
 * @returns Express middleware chain
 */
export function secureAuthRoute(schema: AnyZodObject, handler: (req: Request, res: Response, next: NextFunction) => any) {
  return [
    authRateLimiter(),
    validate(schema, 'body'),
    securityHeadersMiddleware,
    handler
  ];
}

/**
 * Creates a password change route handler with enhanced security
 * 
 * @param schema Validation schema for request body
 * @param handler Route handler function
 * @returns Express middleware chain
 */
export function securePasswordRoute(schema: AnyZodObject, handler: (req: Request, res: Response, next: NextFunction) => any) {
  return [
    authRateLimiter(),
    validate(schema, 'body'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      if (!isAuthenticated(req)) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      // Log password change attempt
      logSecurityEvent('PASSWORD_CHANGE_ATTEMPTED', {
        ip: req.ip,
        userId: (req.session as any)?.userId,
        timestamp: new Date()
      });
      
      return handler(req, res, next);
    }
  ];
}

/**
 * Secure response pattern that ensures consistent and secure responses
 * 
 * @param res Express response object
 * @param data Response data
 * @param status HTTP status code
 */
export function secureResponse(res: Response, data: any, status = 200) {
  // Apply security headers if they haven't been applied yet
  if (!res.headersSent) {
    securityHeadersMiddleware(null as any, res, () => {});
  }
  
  return res.status(status).json({
    status: status >= 200 && status < 300 ? 'success' : 'error',
    data
  });
}

/**
 * Secure error response pattern that ensures consistent error handling
 * 
 * @param res Express response object
 * @param message Error message
 * @param status HTTP status code
 * @param errorCode Optional error code
 * @param details Optional error details
 */
export function secureErrorResponse(
  res: Response, 
  message: string, 
  status = 400,
  errorCode?: string,
  details?: any
) {
  // Apply security headers if they haven't been applied yet
  if (!res.headersSent) {
    securityHeadersMiddleware(null as any, res, () => {});
  }
  
  const response: any = {
    status: 'error',
    message
  };
  
  if (errorCode) {
    response.code = errorCode;
  }
  
  if (details) {
    response.details = details;
  }
  
  return res.status(status).json(response);
}

/**
 * Secure error handler middleware for express
 * 
 * @param err Error object
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log the error
  console.error('Server error:', err);
  
  // Don't expose error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction 
    ? 'An unexpected error occurred' 
    : (err.message || 'Unknown error');
  
  // Log as security event if it might be security-related
  if (err.name === 'UnauthorizedError' || 
      err.name === 'JsonWebTokenError' || 
      err.message?.includes('security') ||
      err.message?.includes('auth')) {
    logSecurityEvent('SERVER_SECURITY_ERROR', {
      ip: req.ip,
      path: req.path,
      errorName: err.name,
      errorMessage: err.message,
      timestamp: new Date()
    });
  }
  
  // If headers already sent, let Express handle it
  if (res.headersSent) {
    return next(err);
  }
  
  // Send a secure error response
  secureErrorResponse(
    res,
    errorMessage,
    err.status || 500,
    err.code || 'SERVER_ERROR',
    isProduction ? undefined : { stack: err.stack }
  );
}

/**
 * Tracks API usage patterns for security monitoring
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function apiUsageTracker(req: Request, res: Response, next: NextFunction) {
  // Skip for non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Record start time
  const startTime = Date.now();
  
  // Track when the response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Only track if duration is suspiciously long or response had an error status
    if (duration > 1000 || res.statusCode >= 400) {
      const data = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: (req.session as any)?.userId || 'anonymous',
        timestamp: new Date()
      };
      
      // Log slow or error responses
      if (res.statusCode >= 400) {
        logSecurityEvent('API_ERROR_RESPONSE', data);
      } else if (duration > 1000) {
        logSecurityEvent('API_SLOW_RESPONSE', data);
      }
    }
  });
  
  next();
}