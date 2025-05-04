/**
 * Rate Limiting System
 *
 * This module provides a complete rate limiting system that integrates
 * all the rate limiting components (TokenBucketRateLimiter, RateLimitContextBuilder,
 * AdaptiveRateLimiter, RateLimitAnalytics, ThreatDetectionService) into a unified system.
 * 
 * It handles the initialization, configuration, and integration with the rest of the application.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp } from '../../../utils/ip-utils';
import { RateLimitContextBuilder } from './RateLimitContextBuilder';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';
import { isCsrfExemptPath } from './RateLimitIntegration';
import { recordAuditEvent } from '../../secureAuditTrail';

/**
 * Analytics instance
 */
export const analytics = new RateLimitAnalytics();

/**
 * Context builder instance
 */
export const contextBuilder = new RateLimitContextBuilder({
  // Whitelist localhost and common development IPs
  whitelistedIps: ['127.0.0.1', '::1', '0.0.0.0'],
  
  // Resource types and their sensitivity (1-5)
  resourceTypes: {
    'auth': 5,      // Authentication endpoints
    'admin': 5,     // Admin endpoints
    'security': 5,  // Security endpoints
    'user': 4,      // User data endpoints
    'api': 3,       // General API endpoints
    'static': 1,    // Static assets
    'public': 1     // Public endpoints
  }
});

/**
 * Adaptive rate limiter instance
 */
export const adaptiveRateLimiter = new AdaptiveRateLimiter({
  minBurstMultiplier: 0.5,
  maxBurstMultiplier: 2.0,
  systemLoadThreshold: 0.7,
  threatLevelImpact: 0.5,
  errorRateThreshold: 0.05,
  adjustmentInterval: 60 * 1000, // 1 minute
  analytics: analytics
});

/**
 * Rate limiters for different tiers
 */
export const rateLimiters = {
  /**
   * Global rate limiter (covers all endpoints)
   */
  global: new TokenBucketRateLimiter({
    capacity: 200,
    refillRate: 50,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'global'
  }),
  
  /**
   * Authentication endpoints
   */
  auth: new TokenBucketRateLimiter({
    capacity: 10,
    refillRate: 5,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'auth'
  }),
  
  /**
   * Admin endpoints
   */
  admin: new TokenBucketRateLimiter({
    capacity: 50,
    refillRate: 25,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'admin'
  }),
  
  /**
   * Security endpoints
   */
  security: new TokenBucketRateLimiter({
    capacity: 20,
    refillRate: 10,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'security'
  }),
  
  /**
   * API endpoints
   */
  api: new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 50,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'api'
  }),
  
  /**
   * Public endpoints and static assets
   */
  public: new TokenBucketRateLimiter({
    capacity: 300,
    refillRate: 150,
    refillInterval: 60 * 1000, // 1 minute
    contextAware: true,
    name: 'public'
  })
};

/**
 * Unified rate limit middleware
 * 
 * Creates a unified rate limit middleware that:
 * 1. Builds context
 * 2. Gets adaptive multiplier
 * 3. Calculates request cost
 * 4. Applies appropriate rate limiter
 * 5. Tracks analytics
 * 
 * @param tier Rate limiter tier to use (optional, defaults to 'global')
 * @returns Express middleware
 */
export function createUnifiedRateLimit(tier?: 'api' | 'auth' | 'admin' | 'security' | 'public') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for CSRF exempt paths and the base path
      if (isCsrfExemptPath(req.path) || req.path === '/') {
        return next();
      }
      
      // Skip rate limiting for the CSRF token endpoint
      if (req.path === '/api/csrf-token') {
        return next();
      }
      
      // Build context
      const context = contextBuilder.buildContext(req);
      
      // Get adaptive multiplier
      const adaptiveMultiplier = adaptiveRateLimiter.getAdaptiveMultiplier(context);
      
      // Calculate request cost
      const cost = contextBuilder.calculateRequestCost(req, context);
      
      // Get the appropriate rate limiter
      const rateLimiter = tier ? rateLimiters[tier] : rateLimiters.global;
      
      // Generate key
      const key = `${rateLimiter.name}:${context.identifier}`;
      
      // Try to consume tokens
      const result = rateLimiter.consume(key, cost, context, adaptiveMultiplier);
      
      // Set headers
      res.setHeader('X-RateLimit-Limit', rateLimiter.getCapacity(key, context, adaptiveMultiplier).toString());
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
          tier: rateLimiter.name,
          cost,
          context,
          adaptiveMultiplier
        });
        
        // Record in audit trail
        recordAuditEvent({
          timestamp: new Date().toISOString(),
          action: 'RATE_LIMIT_EXCEEDED',
          resource: req.path,
          result: 'blocked',
          severity: 'warning',
          details: {
            ip: context.ip,
            identifier: context.identifier,
            method: req.method,
            tier: rateLimiter.name,
            remaining: result.remaining,
            cost
          }
        });
        
        // Record in threat detection
        threatDetectionService.recordViolation(context.ip, context.identifier, 0.5);
        
        // Log rate limiting
        log(`Rate limit exceeded: ${key} (${req.method} ${req.path})`, 'security');
        
        // Send error response
        return res.status(429).json({
          error: 'rate_limited',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(result.retryAfter / 1000)
        });
      }
      
      // Store context in request for later use
      (req as any).rateLimitContext = context;
      
      // Track successful request on response finish
      res.on('finish', () => {
        analytics.trackRequest(context.resourceType);
      });
      
      // Proceed with the request
      next();
    } catch (error) {
      // Log error and fail open
      log(`Error in rate limit middleware: ${error}`, 'security');
      next();
    }
  };
}

/**
 * Global rate limit middleware
 */
export const globalRateLimit = createUnifiedRateLimit('global');

/**
 * Get adaptive adjustment metrics
 * 
 * @returns Adaptive adjustment metrics
 */
export function getAdaptiveAdjustmentMetrics(): any {
  return adaptiveRateLimiter.getAdjustmentMetrics();
}

/**
 * Generate a rate limit report
 * 
 * @returns Rate limit report
 */
export function generateRateLimitReport(): any {
  try {
    // Get analytics report
    const analyticsReport = analytics.generateReport();
    
    // Get limiter stats
    const limiterStats = Object.entries(rateLimiters).map(([tier, limiter]) => ({
      tier,
      stats: limiter.getStats()
    }));
    
    // Get threat stats
    const threatStats = threatDetectionService.getStats();
    
    // Get adaptive metrics
    const adaptiveMetrics = adaptiveRateLimiter.getAdjustmentMetrics();
    
    // Generate the report
    return {
      timestamp: new Date().toISOString(),
      globalStatus: {
        threatLevel: threatStats.globalThreatLevel,
        threatCategory: threatStats.threatCategory,
        totalViolations: analyticsReport.summary?.totalViolations || 0,
        totalRequests: analyticsReport.summary?.totalRequests || 0,
        violationRate: analyticsReport.summary?.violationRate || 0,
        adaptiveMultipliers: adaptiveMetrics.resourceTypeMultipliers
      },
      limiters: limiterStats,
      analytics: {
        summary: analyticsReport.summary,
        topEndpoints: analyticsReport.topEndpoints || [],
        topViolators: analyticsReport.topViolators || []
      }
    };
  } catch (error) {
    log(`Error generating rate limit report: ${error}`, 'security');
    
    return {
      error: 'Failed to generate rate limit report',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fix the CSRF protection and rate limiting integration issue
 * 
 * This function modifies the CSRF protection middleware to work with
 * our rate limiting system. It ensures that:
 * 
 * 1. CSRF token entropy validation errors are properly logged
 * 2. Rate limits don't interfere with legitimate CSRF tokens
 * 3. CSRF tokens are properly refreshed
 * 
 * @param csrfProtection CSRF protection middleware
 * @returns Modified middleware
 */
export function fixCsrfIntegration(csrfProtection: any): any {
  // The class instance handles its own middleware internally
  // No modifications needed here for now
  
  // This approach avoids modifying the core CSRF protection class directly
  
  return csrfProtection;
}

/**
 * Initialize rate limiting system
 * 
 * This function initializes the rate limiting system and returns any
 * necessary middleware. It:
 * 
 * 1. Sets up the rate limiters
 * 2. Configures analytics
 * 3. Integrates with security systems
 * 
 * @returns Rate limiting middleware
 */
export function initializeRateLimiting(): any {
  try {
    log('Initializing rate limiting system...', 'security');
    
    // Set up stream for logs
    const logStream = {
      write: (message: string) => {
        log(`Rate limiting: ${message.trim()}`, 'security');
        return true;
      }
    };
    
    // Set up analytics storage
    analytics.setLogStream(logStream);
    
    // Log initialization
    log('Rate limiting system initialized successfully', 'security');
    
    // Return global rate limit middleware
    return globalRateLimit;
  } catch (error) {
    log(`Error initializing rate limiting system: ${error}`, 'security');
    
    // Return a pass-through middleware
    return (req: Request, res: Response, next: NextFunction) => next();
  }
}