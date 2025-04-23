/**
 * Rate Limiting Middleware
 * 
 * This module provides configurable rate limiters to protect against brute force attacks,
 * API abuse, and denial of service attacks.
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimit, Options } from 'express-rate-limit';
import { logger } from '../../utils/logger';
import { logSecurityEvent } from '../utils/securityUtils';

/**
 * Default rate limit configurations for different endpoint types
 */
const RATE_LIMIT_DEFAULTS = {
  // General API endpoints
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later',
  },
  
  // Authentication endpoints (login, register, password reset)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later',
  },
  
  // Admin endpoints
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many administrative requests, please try again later',
  },
  
  // Payment and sensitive endpoints
  PAYMENT: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many payment requests, please try again later',
  }
};

/**
 * Creates a standard rate limiter middleware with default options
 * 
 * @returns Express middleware function
 */
export function standardRateLimiter() {
  return createRateLimiter(RATE_LIMIT_DEFAULTS.STANDARD);
}

/**
 * Creates a more restrictive rate limiter for authentication endpoints
 * 
 * @returns Express middleware function
 */
export function authRateLimiter() {
  return createRateLimiter(RATE_LIMIT_DEFAULTS.AUTH);
}

/**
 * Creates a rate limiter for admin endpoints
 * 
 * @returns Express middleware function
 */
export function adminRateLimiter() {
  return createRateLimiter(RATE_LIMIT_DEFAULTS.ADMIN);
}

/**
 * Creates a rate limiter for payment and other sensitive endpoints
 * 
 * @returns Express middleware function
 */
export function paymentRateLimiter() {
  return createRateLimiter(RATE_LIMIT_DEFAULTS.PAYMENT);
}

/**
 * Creates a customized rate limiter with specified options
 * 
 * @param options Rate limiter configuration options
 * @returns Express middleware function
 */
export function createRateLimiter(options: Partial<Options>) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => false, // No skipping by default
    keyGenerator: (req: Request) => {
      // Use IP address as the default key
      return req.ip || 'unknown';
    },
    handler: (req: Request, res: Response, next: NextFunction, options: Options) => {
      // Log the rate limit violation
      const path = req.originalUrl || req.url;
      const ip = req.ip || 'unknown';
      const method = req.method;
      
      logger.warn(`Rate limit exceeded for ${method} ${path}`, {
        ip,
        userAgent: req.headers['user-agent']
      });
      
      // Log as security event
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        method,
        path,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      });
      
      // Send standardized error response
      res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded',
        error: 'TOO_MANY_REQUESTS',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  };
  
  return rateLimit({...defaultOptions, ...options});
}

/**
 * Creates a sliding window rate limiter that tracks requests over time
 * more precisely than the standard rate limiter
 * 
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum requests allowed in the window
 * @returns Express middleware function
 */
export function slidingWindowRateLimiter(windowMs = 60000, maxRequests = 30) {
  // Map to store client request timestamps
  const requestLog = new Map<string, number[]>();
  
  // Clean up old entries periodically
  const cleanup = () => {
    const now = Date.now();
    for (const [key, timestamps] of requestLog.entries()) {
      const newTimestamps = timestamps.filter(time => now - time < windowMs);
      if (newTimestamps.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, newTimestamps);
      }
    }
  };
  
  // Run cleanup every windowMs
  setInterval(cleanup, windowMs);
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const timestamps = requestLog.get(key) || [];
    
    // Filter out timestamps outside the current window
    const recentTimestamps = timestamps.filter(time => now - time < windowMs);
    
    // Check if adding this request would exceed the limit
    if (recentTimestamps.length >= maxRequests) {
      // Log the rate limit violation
      logger.warn(`Sliding window rate limit exceeded for ${req.method} ${req.path}`, {
        ip: key,
        userAgent: req.headers['user-agent']
      });
      
      // Log as security event
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip: key,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      });
      
      // Send standardized error response
      return res.status(429).json({
        status: 'error',
        message: 'Rate limit exceeded',
        error: 'TOO_MANY_REQUESTS',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add the current timestamp and update the store
    recentTimestamps.push(now);
    requestLog.set(key, recentTimestamps);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - recentTimestamps.length));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
    
    next();
  };
}

/**
 * Creates a rate limiter that is sensitive to the user's authentication status
 * Authenticated users get a higher rate limit than unauthenticated users
 * 
 * @param authMaxRequests Maximum requests allowed for authenticated users
 * @param unauthMaxRequests Maximum requests allowed for unauthenticated users
 * @param windowMs Time window in milliseconds
 * @returns Express middleware function
 */
export function userAwareRateLimiter(
  authMaxRequests = 150,
  unauthMaxRequests = 50,
  windowMs = 15 * 60 * 1000
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine if the user is authenticated (using session)
    const isAuthenticated = !!(req.session && req.session.userId);
    
    // Apply appropriate rate limiter based on authentication status
    const limiter = createRateLimiter({
      windowMs,
      max: isAuthenticated ? authMaxRequests : unauthMaxRequests,
      // Use a key that includes the user ID for authenticated users
      keyGenerator: (req) => {
        if (isAuthenticated && req.session && req.session.userId) {
          return `user_${req.session.userId}`;
        }
        return req.ip || 'unknown';
      }
    });
    
    return limiter(req, res, next);
  };
}