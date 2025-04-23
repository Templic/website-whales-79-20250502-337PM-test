/**
 * Rate Limiters
 * 
 * This module provides various rate limiters to protect against abuse and brute force attacks.
 * It includes specialized rate limiters for different types of endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../utils/securityUtils';
import { SecurityLogLevel } from '../types/securityTypes';

// Simple logger for when the main logger is not available
const logger = {
  debug: (message: string, meta?: any) => console.debug(message, meta),
  info: (message: string, meta?: any) => console.info(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  error: (message: string, meta?: any) => console.error(message, meta)
};

/**
 * In-memory store for rate limiter data
 * In a production environment, use Redis or another distributed store
 */
const rateLimiterStore: Record<string, {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
}> = {};

/**
 * Options for rate limiters
 */
interface RateLimiterOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum number of requests in the window
  message?: string;      // Custom error message
  statusCode?: number;   // HTTP status code for rate limit errors
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  keyGenerator?: (req: Request) => string; // Function to generate keys
  handler?: (req: Request, res: Response) => void; // Custom handler
  skip?: (req: Request, res: Response) => boolean; // Function to skip rate limiting
  blockDuration?: number; // Duration to block after exceeding maxRequests
  blockThreshold?: number; // Number of violations before blocking
}

/**
 * Default rate limiter options
 */
const defaultOptions: RateLimiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,         // 100 requests per windowMs
  message: 'Too many requests, please try again later',
  statusCode: 429,          // Too Many Requests
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => `${req.ip}:${req.path}`,
  handler: undefined,
  skip: undefined,
  blockDuration: 60 * 60 * 1000, // 1 hour
  blockThreshold: 5             // Block after 5 violations
};

/**
 * Creates a middleware function that limits repeated requests
 * 
 * @param options Rate limiter options
 * @returns Express middleware
 */
export function createRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  const opts = { ...defaultOptions, ...options };
  
  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting if the skip function returns true
    if (opts.skip && opts.skip(req, res)) {
      return next();
    }
    
    const key = opts.keyGenerator(req);
    const now = Date.now();
    
    // Initialize or get the rate limiter data for this key
    if (!rateLimiterStore[key]) {
      rateLimiterStore[key] = {
        count: 0,
        resetTime: now + opts.windowMs
      };
    }
    
    const limiterData = rateLimiterStore[key];
    
    // Check if the key is blocked
    if (limiterData.blocked && limiterData.blockUntil && limiterData.blockUntil > now) {
      const remainingBlockMs = limiterData.blockUntil - now;
      const remainingBlockMinutes = Math.ceil(remainingBlockMs / 60000);
      
      // Log the blocked request
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        key,
        blocked: true,
        remainingBlockMs,
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      // Use custom handler if provided, otherwise send standard response
      if (opts.handler) {
        return opts.handler(req, res);
      }
      
      res.setHeader('Retry-After', Math.ceil(remainingBlockMs / 1000));
      return res.status(opts.statusCode).json({
        status: 'error',
        message: `Account temporarily blocked due to excessive requests. Please try again in ${remainingBlockMinutes} minute(s).`
      });
    }
    
    // Reset the counter if the reset time has passed
    if (now > limiterData.resetTime) {
      limiterData.count = 0;
      limiterData.resetTime = now + opts.windowMs;
    }
    
    // Check if the rate limit has been exceeded
    if (limiterData.count >= opts.maxRequests) {
      // Increment violation count and check if blocking is needed
      limiterData.count++;
      
      // Check if the client should be blocked due to repeated violations
      if (opts.blockThreshold && limiterData.count >= opts.maxRequests + opts.blockThreshold) {
        limiterData.blocked = true;
        limiterData.blockUntil = now + opts.blockDuration;
      }
      
      // Log the rate limit exceeded event
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        key,
        count: limiterData.count,
        maxRequests: opts.maxRequests,
        resetTime: limiterData.resetTime,
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      // Set rate limit headers
      const remainingMs = limiterData.resetTime - now;
      res.setHeader('Retry-After', Math.ceil(remainingMs / 1000));
      res.setHeader('X-RateLimit-Limit', opts.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', Math.ceil(limiterData.resetTime / 1000).toString());
      
      // Use custom handler if provided, otherwise send standard response
      if (opts.handler) {
        return opts.handler(req, res);
      }
      
      return res.status(opts.statusCode).json({
        status: 'error',
        message: opts.message
      });
    }
    
    // Increment the request count
    limiterData.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', opts.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (opts.maxRequests - limiterData.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(limiterData.resetTime / 1000).toString());
    
    // If skipSuccessfulRequests is true, decrement the counter when the response is successful
    if (opts.skipSuccessfulRequests) {
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: BufferEncoding, callback: any: any?: () => void) {
        if (res.statusCode < 400) {
          limiterData.count = Math.max(0, limiterData.count - 1);
        }
        
        return originalEnd.call(res, chunk, encoding, callback);
      };
    }
    
    next();
  };
}

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export function standardRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => {
      // Use user ID if available, otherwise use IP
      const userId = req.session?.userId;
      return userId ? `user:${userId}:${req.path}` : `ip:${req.ip}:${req.path}`;
    },
    ...options
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export function authRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 requests per 15 minutes
    message: 'Too many login attempts, please try again later',
    blockDuration: 60 * 60 * 1000, // 1 hour block
    blockThreshold: 3,        // Block after 3 additional attempts
    keyGenerator: (req) => {
      // Use provided username/email if available
      const identifier = req.body?.email || req.body?.username || req.body?.userId || req.ip;
      return `auth:${identifier}:${req.path}`;
    },
    ...options
  });
}

/**
 * Administrative endpoint rate limiter
 * 20 requests per 15 minutes
 */
export function adminRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,          // 20 requests per 15 minutes
    message: 'Too many admin requests, please try again later',
    keyGenerator: (req) => {
      const userId = req.session?.userId;
      return userId ? `admin:${userId}:${req.path}` : `ip:${req.ip}:${req.path}`;
    },
    ...options
  });
}

/**
 * Payment endpoint rate limiter
 * 10 requests per 10 minutes
 */
export function paymentRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  return createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,          // 10 requests per 10 minutes
    message: 'Too many payment requests, please try again later',
    blockDuration: 24 * 60 * 60 * 1000, // 24 hour block for payment abuse
    blockThreshold: 2,        // Block after 2 additional attempts
    keyGenerator: (req) => {
      const userId = req.session?.userId;
      return userId ? `payment:${userId}:${req.path}` : `ip:${req.ip}:${req.path}`;
    },
    ...options
  });
}

/**
 * Sliding window rate limiter
 * More precise rate limiting based on a sliding time window
 * 
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests in the window
 * @param options Additional rate limiter options
 * @returns Express middleware
 */
export function slidingWindowRateLimiter(
  windowMs: number,
  maxRequests: number,
  options: Partial<RateLimiterOptions> = {}
) {
  // Store timestamps of requests
  const requestLog: Record<string, number[]> = {};
  
  return function slidingWindowLimiter(req: Request, res: Response, next: NextFunction) {
    // Skip rate limiting if the skip function returns true
    if (options.skip && options.skip(req, res)) {
      return next();
    }
    
    const keyGenerator = options.keyGenerator || defaultOptions.keyGenerator;
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Initialize request log for this key if not exists
    if (!requestLog[key]) {
      requestLog[key] = [];
    }
    
    // Remove timestamps outside of the window
    const windowStart = now - windowMs;
    requestLog[key] = requestLog[key].filter(timestamp => timestamp > windowStart);
    
    // Check if the rate limit has been exceeded
    if (requestLog[key].length >= maxRequests) {
      // Log the rate limit exceeded event
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        key,
        count: requestLog[key].length,
        maxRequests,
        slidingWindow: true,
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      // Set headers for rate limiting info
      const oldestRequest = requestLog[key][0];
      const resetTime = oldestRequest + windowMs;
      const remainingMs = resetTime - now;
      
      res.setHeader('Retry-After', Math.ceil(remainingMs / 1000));
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      
      // Use custom handler if provided, otherwise send standard response
      if (options.handler) {
        return options.handler(req, res);
      }
      
      const message = options.message || defaultOptions.message;
      const statusCode = options.statusCode || defaultOptions.statusCode;
      
      return res.status(statusCode).json({
        status: 'error',
        message
      });
    }
    
    // Add current timestamp to the log
    requestLog[key].push(now);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - requestLog[key].length).toString());
    
    // If there are previous requests, calculate the reset time based on the oldest
    if (requestLog[key].length > 0) {
      const oldestRequest = requestLog[key][0];
      const resetTime = oldestRequest + windowMs;
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    } else {
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());
    }
    
    next();
  };
}

/**
 * Cleanup function to periodically remove old rate limiter data
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimiters() {
  const now = Date.now();
  
  // Remove expired entries from the rate limiter store
  for (const key in rateLimiterStore) {
    const data = rateLimiterStore[key];
    
    // Remove if reset time has passed and not blocked
    if (data.resetTime < now && (!data.blocked || (data.blockUntil && data.blockUntil < now))) {
      delete rateLimiterStore[key];
    }
  }
  
  logger.debug('Rate limiter cleanup completed', {
    remainingEntries: Object.keys(rateLimiterStore).length
  });
}