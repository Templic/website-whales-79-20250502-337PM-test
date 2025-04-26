/**
 * API Security Middleware
 * 
 * This module provides comprehensive security middleware for API routes,
 * combining various security components into a single, easy-to-use middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { standardRateLimiter } from './rateLimiters';
import { securityHeadersMiddleware, apiSecurityHeadersMiddleware } from './securityHeadersMiddleware';
import { logSecurityEvent } from '../utils/securityUtils';
import { SecurityLogLevel } from '../types/securityTypes';
import { AnyZodObject } from 'zod';
import { validate } from './apiValidation';

/**
 * API Security options
 */
interface ApiSecurityOptions {
  enableRateLimiting?: boolean;
  enableSecurityHeaders?: boolean;
  enableLogging?: boolean;
  enableStrictMode?: boolean;
  schema?: AnyZodObject;
  requestPart?: 'body' | 'query' | 'params';
}

/**
 * Default API security options
 */
const defaultOptions: ApiSecurityOptions = {
  enableRateLimiting: true,
  enableSecurityHeaders: true,
  enableLogging: true,
  enableStrictMode: false
};

/**
 * Create API security middleware with custom options
 * 
 * @param options API security options
 * @returns Express middleware
 */
export function createApiSecurityMiddleware(options: ApiSecurityOptions = defaultOptions) {
  const opts = { ...defaultOptions, ...options };
  
  return function apiSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
    // Track API request if logging is enabled
    if (opts.enableLogging) {
      logSecurityEvent('API_REQUEST', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }, SecurityLogLevel.DEBUG);
    }
    
    // Apply security headers middleware
    if (opts.enableSecurityHeaders) {
      const headersMiddleware = opts.enableStrictMode 
        ? apiSecurityHeadersMiddleware
        : securityHeadersMiddleware;
      
      headersMiddleware(req, res, () => {});
    }
    
    // Create middleware chain
    const middlewareChain = [];
    
    // Add rate limiting if enabled
    if (opts.enableRateLimiting) {
      middlewareChain.push(standardRateLimiter());
    }
    
    // Add schema validation if provided
    if (opts.schema) {
      middlewareChain.push(validate(opts.schema, opts.requestPart || 'body'));
    }
    
    // Apply middleware chain
    function runMiddlewareChain(index: number) {
      if (index >= middlewareChain.length) {
        return next();
      }
      
      middlewareChain[index](req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
        
        runMiddlewareChain(index + 1);
      });
    }
    
    runMiddlewareChain(0);
  };
}

/**
 * Standard API security middleware with default options
 */
export const apiSecurityMiddleware = createApiSecurityMiddleware();

/**
 * Strict API security middleware with enhanced security
 */
export const strictApiSecurityMiddleware = createApiSecurityMiddleware({
  enableStrictMode: true
});

/**
 * Middleware to log all API requests
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next middleware function
 */
export function apiRequestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip logging for non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  const startTime = Date.now();
  
  // Log request details
  logSecurityEvent('API_REQUEST', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  }, SecurityLogLevel.DEBUG);
  
  // Capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void) {
    const responseTime = Date.now() - startTime;
    
    // Log response details for non-successful responses
    if (res.statusCode >= 400) {
      logSecurityEvent('API_ERROR_RESPONSE', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }, res.statusCode >= 500 ? SecurityLogLevel.ERROR : SecurityLogLevel.WARN);
    }
    
    // Call the original end method
    return originalEnd.call(res, chunk, encoding, callback);
  };
  
  next();
}

/**
 * API security middleware factory that creates middleware based on route type
 */
export const ApiSecurity = {
  /**
   * Standard API security for general endpoints
   * 
   * @param schema Optional Zod schema for request validation
   * @param requestPart Request part to validate (default: 'body')
   * @returns Express middleware
   */
  standard(schema?: AnyZodObject, requestPart?: 'body' | 'query' | 'params') {
    return createApiSecurityMiddleware({
      schema,
      requestPart
    });
  },
  
  /**
   * Enhanced security for sensitive endpoints
   * 
   * @param schema Optional Zod schema for request validation
   * @param requestPart Request part to validate (default: 'body')
   * @returns Express middleware
   */
  sensitive(schema?: AnyZodObject, requestPart?: 'body' | 'query' | 'params') {
    return createApiSecurityMiddleware({
      enableStrictMode: true,
      schema,
      requestPart
    });
  },
  
  /**
   * Minimal security for public endpoints
   * 
   * @returns Express middleware
   */
  public() {
    return createApiSecurityMiddleware({
      enableRateLimiting: true,
      enableSecurityHeaders: true,
      enableLogging: true,
      enableStrictMode: false
    });
  },
  
  /**
   * Logging-only middleware for debugging
   * 
   * @returns Express middleware
   */
  logOnly() {
    return createApiSecurityMiddleware({
      enableRateLimiting: false,
      enableSecurityHeaders: false,
      enableLogging: true,
      enableStrictMode: false
    });
  }
};