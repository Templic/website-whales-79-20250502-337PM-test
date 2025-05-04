/**
 * Rate Limiting System
 *
 * This module combines all components of the rate limiting system and exports
 * configured instances and middlewares for use throughout the application.
 */

import { Request, Response, NextFunction } from 'express';
import { TokenBucketRateLimiter, RateLimitConfig } from './TokenBucketRateLimiter';
import { RateLimitContextBuilder } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { threatDetectionService } from './ThreatDetectionService';
import { log } from '../../../utils/logger';

// Create the rate limit analytics instance
export const rateLimitAnalytics = new RateLimitAnalytics();

// Create the adaptive rate limiter
export const adaptiveRateLimiter = new AdaptiveRateLimiter({
  minBurstMultiplier: 0.5,
  maxBurstMultiplier: 3.0,
  systemLoadThreshold: 0.75,
  threatLevelImpact: 0.5,
  errorRateThreshold: 0.1,
  adjustmentInterval: 60000, // 1 minute
  analytics: rateLimitAnalytics
});

// Define the context builder
export const contextBuilder = new RateLimitContextBuilder();

// Create different rate limiters for different tiers of access
export const rateLimiters = {
  // Global rate limiter (applies to all requests)
  global: new TokenBucketRateLimiter({
    capacity: 100,       // 100 requests
    refillRate: 30,      // 30 tokens refilled
    refillInterval: 10000, // every 10 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  }),
  
  // Authentication rate limiter
  auth: new TokenBucketRateLimiter({
    capacity: 20,        // 20 requests
    refillRate: 5,       // 5 tokens refilled
    refillInterval: 60000, // every 60 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  }),
  
  // Admin rate limiter
  admin: new TokenBucketRateLimiter({
    capacity: 50,        // 50 requests
    refillRate: 10,      // 10 tokens refilled
    refillInterval: 10000, // every 10 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  }),
  
  // Security operations rate limiter
  security: new TokenBucketRateLimiter({
    capacity: 30,        // 30 requests
    refillRate: 10,      // 10 tokens refilled
    refillInterval: 30000, // every 30 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  }),
  
  // API rate limiter
  api: new TokenBucketRateLimiter({
    capacity: 60,        // 60 requests
    refillRate: 15,      // 15 tokens refilled
    refillInterval: 15000, // every 15 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  }),
  
  // Public routes rate limiter
  public: new TokenBucketRateLimiter({
    capacity: 120,       // 120 requests
    refillRate: 40,      // 40 tokens refilled
    refillInterval: 10000, // every 10 seconds
    contextAware: true,
    analytics: rateLimitAnalytics
  })
};

// Define a type for the different tiers
export type RateLimitTier = keyof typeof rateLimiters;

// Options for the unified rate limit middleware
export interface UnifiedRateLimitOptions {
  tier?: RateLimitTier;
  statusCode?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  headers?: boolean;
}

/**
 * Create a unified rate limit middleware
 * 
 * @param options Options for the rate limiter
 * @returns Express middleware function
 */
export function createUnifiedRateLimit(options: UnifiedRateLimitOptions = {}) {
  // Default options
  const {
    tier = 'api',
    statusCode = 429,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    headers = true
  } = options;
  
  // Get the appropriate rate limiter
  const limiter = rateLimiters[tier];
  
  // Return the middleware function
  return function unifiedRateLimit(req: Request, res: Response, next: NextFunction) {
    try {
      // Skip certain requests
      if (req.method === 'OPTIONS') {
        return next();
      }
      
      // Build context from the request for context-aware limiting
      const context = contextBuilder.buildContext(req);
      
      // Calculate the request cost based on the context
      const cost = contextBuilder.calculateRequestCost(req, context);
      
      // Get adaptive multiplier based on system conditions
      const adaptiveMultiplier = adaptiveRateLimiter.getAdaptiveMultiplier(context);
      
      // Try to consume tokens from the bucket
      const result = limiter.consume(
        context.identifier,
        cost,
        context,
        adaptiveMultiplier
      );
      
      // Set rate limit headers if enabled
      if (headers) {
        res.setHeader('X-RateLimit-Limit', limiter.getCapacity(context.identifier).toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        
        if (result.limited) {
          res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
        }
      }
      
      if (result.limited) {
        // Rate limited - record the violation
        rateLimitAnalytics.recordViolation({
          timestamp: new Date().toISOString(),
          ip: context.ip,
          identifier: context.identifier,
          endpoint: req.path,
          method: req.method,
          tier,
          cost,
          context,
          adaptiveMultiplier
        });
        
        // Update threat detection service
        threatDetectionService.recordViolation(context.identifier);
        
        // Send the rate limit response
        log(`Rate limited: ${context.identifier} (${req.method} ${req.path})`, 'security');
        
        return res.status(statusCode).json({
          success: false,
          message,
          retryAfter: Math.ceil(result.retryAfter / 1000)
        });
      }
      
      // Track successful request
      rateLimitAnalytics.trackRequest(context.resourceType);
      
      // Continue with the request
      return next();
    } catch (error) {
      // Log the error
      log(`Rate limit error: ${error}`, 'security');
      
      // Continue with the request on error (fail open)
      return next();
    }
  };
}

// Create middleware instances for different tiers
export const globalRateLimit = createUnifiedRateLimit({ tier: 'global' });
export const authRateLimit = createUnifiedRateLimit({ tier: 'auth' });
export const adminRateLimit = createUnifiedRateLimit({ tier: 'admin' });
export const securityRateLimit = createUnifiedRateLimit({ tier: 'security' });
export const apiRateLimit = createUnifiedRateLimit({ tier: 'api' });
export const publicRateLimit = createUnifiedRateLimit({ tier: 'public' });

/**
 * Generate a comprehensive report on rate limiting activity
 * 
 * @returns A detailed report
 */
export function generateRateLimitReport() {
  try {
    // Get analytics report
    const analyticsReport = rateLimitAnalytics.generateReport();
    
    // Get limiter statistics
    const limiterStats = {} as Record<string, any>;
    
    for (const [tier, limiter] of Object.entries(rateLimiters)) {
      limiterStats[tier] = limiter.getStats();
    }
    
    // Get adaptive rate limiting metrics
    const adaptiveMetrics = adaptiveRateLimiter.getAdjustmentMetrics();
    
    // Build the comprehensive report
    return {
      timestamp: new Date().toISOString(),
      analytics: analyticsReport,
      limiters: limiterStats,
      adaptive: adaptiveMetrics
    };
  } catch (error) {
    log(`Error generating rate limit report: ${error}`, 'security');
    
    return {
      timestamp: new Date().toISOString(),
      error: 'Failed to generate report'
    };
  }
}

/**
 * Get the adaptive adjustment metrics
 * 
 * @returns Current adaptive metrics
 */
export function getAdaptiveAdjustmentMetrics() {
  return adaptiveRateLimiter.getAdjustmentMetrics();
}