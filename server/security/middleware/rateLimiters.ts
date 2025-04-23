/**
 * Advanced Rate Limiting Middleware
 * 
 * This module provides comprehensive rate limiting for API requests
 * with contextual awareness and adaptive throttling.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';

// Default store for rate limiting
const memoryStore = new Map();

/**
 * Interface for advanced rate limiting options
 */
export interface AdvancedRateLimitOptions {
  /**
   * Time window in milliseconds
   */
  windowMs?: number;
  
  /**
   * Maximum number of requests within the window
   */
  max?: number;
  
  /**
   * Whether to include headers with rate limit info
   */
  standardHeaders?: boolean;
  
  /**
   * Message to send when rate limit is exceeded
   */
  message?: string | ((req: Request) => string);
  
  /**
   * Status code to send when rate limit is exceeded
   */
  statusCode?: number;
  
  /**
   * Whether to skip failed requests
   */
  skipFailedRequests?: boolean;
  
  /**
   * Whether to skip successful requests
   */
  skipSuccessfulRequests?: boolean;
  
  /**
   * Key generator function
   */
  keyGenerator?: (req: Request) => string;
  
  /**
   * Skip function to bypass rate limiting for certain requests
   */
  skip?: (req: Request) => boolean;
  
  /**
   * Whether to log rate limit events to security blockchain
   */
  logToSecurityBlockchain?: boolean;
  
  /**
   * Severity of rate limit events
   */
  securityEventSeverity?: SecurityEventSeverity;
  
  /**
   * Custom handler for rate limit exceeded
   */
  handler?: (req: Request, res: Response, next: NextFunction, optionsUsed: any) => void;
}

/**
 * Default rate limit options
 */
const defaultOptions: AdvancedRateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  logToSecurityBlockchain: true,
  securityEventSeverity: SecurityEventSeverity.MEDIUM
};

/**
 * Create a standard rate limiter for general API endpoints
 */
export function createApiRateLimiter(options: AdvancedRateLimitOptions = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Add custom handler to log to security blockchain
  const originalHandler = mergedOptions.handler;
  mergedOptions.handler = (req, res, next, optionsUsed) => {
    // Log rate limit event to security blockchain if enabled
    if (mergedOptions.logToSecurityBlockchain) {
      logRateLimitEvent(req, mergedOptions.securityEventSeverity || SecurityEventSeverity.MEDIUM);
    }
    
    // Use custom handler if provided, otherwise use default
    if (originalHandler) {
      originalHandler(req, res, next, optionsUsed);
    } else {
      res.status(mergedOptions.statusCode || 429).json({
        status: 'error',
        message: typeof mergedOptions.message === 'function' 
          ? mergedOptions.message(req) 
          : mergedOptions.message
      });
    }
  };
  
  return rateLimit(mergedOptions as any);
}

/**
 * Create an authentication rate limiter for login/signup endpoints
 */
export function createAuthRateLimiter(options: AdvancedRateLimitOptions = {}) {
  return createApiRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP in 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    securityEventSeverity: SecurityEventSeverity.HIGH,
    ...options
  });
}

/**
 * Create a sensitive operation rate limiter for password reset, etc.
 */
export function createSensitiveOpRateLimiter(options: AdvancedRateLimitOptions = {}) {
  return createApiRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per IP in 1 hour
    message: 'Too many sensitive operation attempts, please try again later.',
    securityEventSeverity: SecurityEventSeverity.HIGH,
    ...options
  });
}

/**
 * Create a strict rate limiter for security-critical endpoints
 */
export function createSecurityEndpointRateLimiter(options: AdvancedRateLimitOptions = {}) {
  return createApiRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per IP in 1 hour
    message: 'Rate limit exceeded for security-critical operation.',
    securityEventSeverity: SecurityEventSeverity.CRITICAL,
    ...options
  });
}

/**
 * Log rate limit event to security blockchain
 */
async function logRateLimitEvent(req: Request, severity: SecurityEventSeverity) {
  try {
    await securityBlockchain.addSecurityEvent({
      severity,
      category: SecurityEventCategory.RATE_LIMIT,
      message: 'Rate limit exceeded',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: {
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Error logging rate limit event:', error);
  }
}

/**
 * Export pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  /**
   * General API rate limiter (100 requests per 15 minutes)
   */
  api: createApiRateLimiter(),
  
  /**
   * Authentication rate limiter (5 attempts per 15 minutes)
   */
  auth: createAuthRateLimiter(),
  
  /**
   * Sensitive operation rate limiter (3 attempts per hour)
   */
  sensitiveOp: createSensitiveOpRateLimiter(),
  
  /**
   * Security endpoint rate limiter (10 requests per hour)
   */
  securityEndpoint: createSecurityEndpointRateLimiter()
};