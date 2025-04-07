/**
 * Rate limiting middleware for API protection
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../security/security';

// Simple in-memory store for rate limiting
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const ipLimits: RateLimitStore = {};
const userLimits: RateLimitStore = {};

// Clean up expired rate limit entries periodically
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
setInterval(() => {
  const now = Date.now();
  
  // Clean up IP limits
  Object.keys(ipLimits).forEach(key => {
    if (now >= ipLimits[key].resetTime) {
      delete ipLimits[key];
    }
  });
  
  // Clean up user limits
  Object.keys(userLimits).forEach(key => {
    if (now >= userLimits[key].resetTime) {
      delete userLimits[key];
    }
  });
}, CLEANUP_INTERVAL);

/**
 * Rate limit middleware
 * @param options Rate limiting options
 */
export function rateLimit(options: {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
} = {}) {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes by default
    keyGenerator = (req: Request) => req.ip || 'unknown',
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipSuccessfulRequests = false
  } = options;
  
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    // Generate a unique key for this client
    const key = keyGenerator(req);
    
    // Get the current time
    const now = Date.now();
    
    // Get current rate limit info
    const store = key.startsWith('user:') ? userLimits : ipLimits;
    
    // Initialize or reset if window has passed
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Check if rate limit is exceeded
    if (store[key].count >= maxRequests) {
      // Log security event for excessive requests
      logSecurityEvent({
        type: 'WARNING',
        details: `Rate limit exceeded for ${key}`,
        severity: 'medium',
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: key.startsWith('user:') ? key.substring(5) : undefined
      });
      
      // Set rate limit headers
      res.setHeader('Retry-After', Math.ceil((store[key].resetTime - now) / 1000));
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
      
      // Return rate limit error
      return res.status(statusCode).json({
        error: {
          status: statusCode,
          code: 'rate_limit_exceeded',
          message
        }
      });
    }
    
    // Increment counter
    store[key].count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
    
    // Only count successful requests if option is enabled
    if (skipSuccessfulRequests) {
      // Decrement on successful response
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: string, callback?: () => void): Response {
        if (res.statusCode < 400) {
          store[key].count = Math.max(0, store[key].count - 1);
        }
        return originalEnd.call(this, chunk, encoding, callback);
      };
    }
    
    next();
  };
}

/**
 * User-based rate limiter - applies limits to authenticated users
 */
export function userRateLimit(options: {
  maxRequests?: number;
  windowMs?: number;
  message?: string;
  statusCode?: number;
} = {}) {
  return rateLimit({
    ...options,
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      return user && user.id ? `user:${user.id}` : req.ip || 'unknown';
    }
  });
}

/**
 * Stricter rate limit for authentication endpoints to prevent brute force
 */
export function authRateLimit() {
  return rateLimit({
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req: Request) => `auth:${req.ip || 'unknown'}`
  });
}

/**
 * API rate limit for general API endpoints
 */
export function apiRateLimit() {
  return rateLimit({
    maxRequests: 120,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many API requests, please slow down',
    skipSuccessfulRequests: true
  });
}

export default {
  rateLimit,
  userRateLimit,
  authRateLimit,
  apiRateLimit
};