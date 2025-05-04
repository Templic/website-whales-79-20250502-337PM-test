/**
 * Rate Limit Integration
 *
 * This module provides integration points between the rate limiting system
 * and the rest of the application, especially the CSRF protection.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp } from '../../../utils/ip-utils';
import { RateLimitContext, RateLimitContextBuilder } from './RateLimitContextBuilder';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';
import { 
  contextBuilder, 
  analytics, 
  adaptiveRateLimiter, 
  rateLimiters, 
  createUnifiedRateLimit, 
  globalRateLimit 
} from './RateLimitingSystem';

// CSRF-aware paths that should bypass rate limiting
const CSRF_EXEMPT_PATHS = [
  '/',
  '/favicon.ico',
  '/assets/', 
  '/static/',
  '/api/csrf/token',
  '/api/security/csrf/verify'
];

// Static assets and public paths with lower rate limiting
const STATIC_PATHS = [
  '/assets/',
  '/static/',
  '/images/',
  '/css/',
  '/js/',
  '/fonts/',
  '/favicon.ico'
];

/**
 * Check if a path is exempt from CSRF validation
 * 
 * @param path Path to check
 * @returns True if the path is exempt from CSRF validation
 */
export function isCsrfExemptPath(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exemptPath => 
    path === exemptPath || 
    (exemptPath.endsWith('/') && path.startsWith(exemptPath))
  );
}

/**
 * Check if a path is a static asset path
 * 
 * @param path Path to check
 * @returns True if the path is a static asset path
 */
export function isStaticPath(path: string): boolean {
  return STATIC_PATHS.some(staticPath => 
    path === staticPath || 
    (staticPath.endsWith('/') && path.startsWith(staticPath))
  );
}

/**
 * Create middleware that integrates rate limiting with CSRF protection
 * 
 * @returns Express middleware
 */
export function createIntegratedRateLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for CSRF-exempt paths
      if (isCsrfExemptPath(req.path)) {
        return next();
      }
      
      // Use different rate limiting tiers based on path
      if (req.path.startsWith('/api/auth/')) {
        // Authentication endpoints
        return rateLimiters.auth.middleware(req, res, next);
      } else if (req.path.startsWith('/api/admin/')) {
        // Admin endpoints
        return rateLimiters.admin.middleware(req, res, next);
      } else if (req.path.startsWith('/api/security/')) {
        // Security endpoints
        return rateLimiters.security.middleware(req, res, next);
      } else if (req.path.startsWith('/api/')) {
        // General API endpoints
        return rateLimiters.api.middleware(req, res, next);
      } else if (isStaticPath(req.path)) {
        // Static assets
        return rateLimiters.public.middleware(req, res, next);
      } else {
        // Everything else
        return globalRateLimit(req, res, next);
      }
    } catch (error) {
      // Log error and continue (fail open)
      log(`Error in rate limit middleware: ${error}`, 'security');
      next();
    }
  };
}

/**
 * Create middleware that handles CSRF verification while considering rate limiting
 * 
 * @param csrfProtection The CSRF protection middleware
 * @returns Combined middleware
 */
export function createCsrfRateLimitMiddleware(csrfProtection: (req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip CSRF for exempt paths
      if (isCsrfExemptPath(req.path)) {
        return next();
      }
      
      // Apply CSRF protection with rate limiting context
      return csrfProtection(req, res, (err?: any) => {
        if (err) {
          // Log CSRF errors as security violations
          if (err.code === 'EBADCSRFTOKEN') {
            const ip = getClientIp(req);
            const identifier = req.session?.userId ? `user:${req.session.userId}` : `ip:${ip}`;
            
            // Record violation in threat detection
            threatDetectionService.recordViolation(ip, identifier, 2.0);
            
            // Log CSRF failure
            log(`CSRF validation failed: ${req.path} - ${err.message}`, 'security');
          }
          
          return next(err);
        }
        
        // CSRF passed, continue
        next();
      });
    } catch (error) {
      // Log error and continue with error
      log(`Error in CSRF+rate limit middleware: ${error}`, 'security');
      next(error);
    }
  };
}

/**
 * Extended TokenBucketRateLimiter with middleware
 */
declare module './TokenBucketRateLimiter' {
  interface TokenBucketRateLimiter {
    middleware(req: Request, res: Response, next: NextFunction): void;
  }
}

// Add middleware method to TokenBucketRateLimiter
TokenBucketRateLimiter.prototype.middleware = function(req: Request, res: Response, next: NextFunction): void {
  try {
    // Build context
    const context = contextBuilder.buildContext(req);
    
    // Generate key
    const key = `${this.name}:${context.identifier}`;
    
    // Get adaptive multiplier
    const adaptiveMultiplier = adaptiveRateLimiter.getAdaptiveMultiplier(context);
    
    // Calculate request cost
    const cost = contextBuilder.calculateRequestCost(req, context);
    
    // Try to consume tokens
    const result = this.consume(key, cost, context, adaptiveMultiplier);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', this.getCapacity(key).toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    // If limited, send error response
    if (result.limited) {
      // Set retry-after header
      res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
      
      // Record violation in analytics
      analytics.recordViolation({
        timestamp: new Date().toISOString(),
        ip: context.ip,
        identifier: context.identifier,
        endpoint: req.path,
        method: req.method,
        tier: this.name,
        cost,
        context,
        adaptiveMultiplier
      });
      
      // Log rate limiting
      log(`Rate limit exceeded: ${key} (${req.method} ${req.path})`, 'security');
      
      // Send error response
      return res.status(429).json({
        success: false,
        error: 'rate_limited',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(result.retryAfter / 1000)
      });
    }
    
    // Store context in request for later use
    req.rateLimitContext = context;
    
    // Track successful request
    const trackRequest = () => {
      analytics.trackRequest(context.resourceType);
    };
    
    // Track response once it's sent
    res.on('finish', trackRequest);
    res.on('close', trackRequest);
    
    // Continue to next middleware
    next();
  } catch (error) {
    // Log error and continue (fail open)
    log(`Error in rate limit middleware: ${error}`, 'security');
    next();
  }
};