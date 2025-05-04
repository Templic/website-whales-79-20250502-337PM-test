/**
 * Rate Limiting System
 *
 * This module provides the main coordination point for the rate limiting system.
 * It creates and exports rate limiters for different tiers, the context builder,
 * and the adaptive rate limiter.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { TokenBucketRateLimiter, RateLimitConfig } from './TokenBucketRateLimiter';
import { RateLimitContextBuilder } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { getClientIp } from '../../../utils/ip-utils';

// Create analytics service
export const analytics = new RateLimitAnalytics();

// Create adaptive rate limiter
export const adaptiveRateLimiter = new AdaptiveRateLimiter({
  minBurstMultiplier: 0.5,
  maxBurstMultiplier: 2.0,
  systemLoadThreshold: 0.7,
  threatLevelImpact: 0.5,
  errorRateThreshold: 0.05,
  adjustmentInterval: 60000, // 1 minute
  analytics
});

// Create context builder
export const contextBuilder = new RateLimitContextBuilder();

// Create rate limiters for different tiers
export const rateLimiters: Record<string, TokenBucketRateLimiter> = {
  // Global tier - applies to all requests
  global: new TokenBucketRateLimiter({
    capacity: 300,
    refillRate: 100,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  }),
  
  // Authentication tier - applies to authentication endpoints
  auth: new TokenBucketRateLimiter({
    capacity: 20,
    refillRate: 10,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  }),
  
  // Admin tier - applies to admin endpoints
  admin: new TokenBucketRateLimiter({
    capacity: 60,
    refillRate: 30,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  }),
  
  // Security tier - applies to security endpoints
  security: new TokenBucketRateLimiter({
    capacity: 30,
    refillRate: 15,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  }),
  
  // API tier - applies to API endpoints
  api: new TokenBucketRateLimiter({
    capacity: 120,
    refillRate: 60,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  }),
  
  // Public tier - applies to public resources
  public: new TokenBucketRateLimiter({
    capacity: 240,
    refillRate: 80,
    refillInterval: 60000, // 1 minute
    contextAware: true,
    analytics
  })
};

// Rate limiting middleware options
interface RateLimitOptions {
  tier: string;
  statusCode?: number;
  message?: string;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create unified rate limit middleware
 * 
 * @param options Rate limit options
 * @returns Express middleware
 */
export function createUnifiedRateLimit(options: RateLimitOptions) {
  // Get rate limiter for the specified tier
  const limiter = rateLimiters[options.tier];
  if (!limiter) {
    throw new Error(`Rate limiter for tier "${options.tier}" not found`);
  }
  
  // Set default options
  const statusCode = options.statusCode || 429;
  const message = options.message || 'Too many requests, please try again later.';
  const headers = options.headers !== false;
  const skipSuccessfulRequests = options.skipSuccessfulRequests || false;
  
  // Default key generator
  const defaultKeyGenerator = (req: Request): string => {
    return `${options.tier}:${getClientIp(req)}`;
  };
  
  // Use custom key generator if provided, otherwise use default
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  
  // Return middleware function
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key for this request
      const key = keyGenerator(req);
      
      // Build context
      const context = contextBuilder.buildContext(req);
      
      // Get adaptive multiplier
      const adaptiveMultiplier = adaptiveRateLimiter.getAdaptiveMultiplier(context);
      
      // Calculate request cost
      const cost = contextBuilder.calculateRequestCost(req, context);
      
      // Try to consume tokens
      const result = limiter.consume(key, cost, context, adaptiveMultiplier);
      
      // Set headers if enabled
      if (headers) {
        res.setHeader('X-RateLimit-Limit', limiter.getCapacity(key).toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        
        if (result.limited) {
          res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
        }
      }
      
      // If rate limited, send error response
      if (result.limited) {
        // Track request with analytics
        analytics.recordViolation({
          timestamp: new Date().toISOString(),
          ip: context.ip,
          identifier: context.identifier,
          endpoint: req.path,
          method: req.method,
          tier: options.tier,
          cost,
          context,
          adaptiveMultiplier
        });
        
        // Log rate limit
        log(`Rate limit exceeded: ${key} (${req.method} ${req.path})`, 'security');
        
        // Send error response
        return res.status(statusCode).json({
          success: false,
          error: 'rate_limited',
          message,
          retryAfter: Math.ceil(result.retryAfter / 1000)
        });
      }
      
      // Store context in request for later use
      req.rateLimitContext = context;
      
      // Continue to next middleware
      next();
      
      // If skip successful requests is enabled, we're done
      if (skipSuccessfulRequests) {
        return;
      }
      
      // Setup response tracking to record analytics after response is sent
      const originalEnd = res.end;
      const originalWrite = res.write;
      
      // Override res.end to track response
      res.end = function(...args: any[]): any {
        // Track request if not rate limited
        analytics.trackRequest(context.resourceType);
        
        // Call original end
        return originalEnd.apply(res, args);
      };
      
      // Override res.write to track response
      res.write = function(...args: any[]): any {
        // Track request if not rate limited and first write
        if (!res.writableEnded) {
          analytics.trackRequest(context.resourceType);
        }
        
        // Call original write
        return originalWrite.apply(res, args);
      };
    } catch (error) {
      // Log error
      log(`Error in rate limiting middleware: ${error}`, 'security');
      
      // Continue to next middleware (fail open)
      next();
    }
  };
}

// Create middleware instances for each tier
export const globalRateLimit = createUnifiedRateLimit({
  tier: 'global',
  statusCode: 429,
  message: 'Too many requests. Please try again later.',
  headers: true,
  skipSuccessfulRequests: false
});

export const authRateLimit = createUnifiedRateLimit({
  tier: 'auth',
  statusCode: 429,
  message: 'Too many authentication requests. Please try again later.',
  headers: true,
  skipSuccessfulRequests: false
});

export const adminRateLimit = createUnifiedRateLimit({
  tier: 'admin',
  statusCode: 429,
  message: 'Too many admin requests. Please try again later.',
  headers: true,
  skipSuccessfulRequests: false
});

export const securityRateLimit = createUnifiedRateLimit({
  tier: 'security',
  statusCode: 429,
  message: 'Too many security requests. Please try again later.',
  headers: true,
  skipSuccessfulRequests: false
});

export const apiRateLimit = createUnifiedRateLimit({
  tier: 'api',
  statusCode: 429,
  message: 'Too many API requests. Please try again later.',
  headers: true,
  skipSuccessfulRequests: false
});

export const publicRateLimit = createUnifiedRateLimit({
  tier: 'public',
  statusCode: 429,
  message: 'Too many requests to public resources. Please try again later.',
  headers: true,
  skipSuccessfulRequests: true
});

/**
 * Generate a rate limit report for all tiers
 * 
 * @returns Rate limit report
 */
export function generateRateLimitReport(): any {
  try {
    // Get stats from each rate limiter
    const limiterStats: Record<string, any> = {};
    
    for (const [tier, limiter] of Object.entries(rateLimiters)) {
      limiterStats[tier] = limiter.getStats();
    }
    
    // Get analytics report
    const analyticsReport = analytics.generateReport();
    
    // Get adaptive metrics
    const adaptiveMetrics = getAdaptiveAdjustmentMetrics();
    
    // Build combined report
    return {
      timestamp: new Date().toISOString(),
      limiters: limiterStats,
      analytics: analyticsReport,
      adaptive: adaptiveMetrics
    };
  } catch (error) {
    log(`Error generating rate limit report: ${error}`, 'security');
    
    return {
      timestamp: new Date().toISOString(),
      error: 'Failed to generate rate limit report'
    };
  }
}

/**
 * Get adaptive adjustment metrics
 * 
 * @returns Adaptive adjustment metrics
 */
export function getAdaptiveAdjustmentMetrics(): any {
  try {
    return adaptiveRateLimiter.getAdjustmentMetrics();
  } catch (error) {
    log(`Error getting adaptive adjustment metrics: ${error}`, 'security');
    
    return {
      timestamp: new Date().toISOString(),
      error: 'Failed to get adaptive adjustment metrics'
    };
  }
}

// Declare global type extensions for express
declare global {
  namespace Express {
    interface Request {
      rateLimitContext?: any;
    }
  }
}