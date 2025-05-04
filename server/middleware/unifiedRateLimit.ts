/**
 * Unified Rate Limiting Middleware
 * 
 * A comprehensive rate limiting middleware for Express that provides:
 * - Context-aware rate limiting
 * - Tiered rate limits for different resources
 * - Dynamic cost calculation based on request properties
 * - Integration with security monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { TokenBucketRateLimiter, RequestContext } from '../security/advanced/threat/TokenBucketRateLimiter';
import { buildRateLimitContext } from '../security/advanced/threat/RateLimitContextBuilder';

// Optional security event logging
let logSecurityEvent: (event: any) => void;

try {
  // Try to import security event logging if available
  logSecurityEvent = require('../security/security').logSecurityEvent;
} catch (error) {
  // Fallback if not available
  logSecurityEvent = (event: any) => {
    console.log('[Security Event]', JSON.stringify(event));
  };
}

// Central rate limiter instances
const limiters = {
  // Global limiter - applies to all requests
  global: new TokenBucketRateLimiter({
    tokensPerInterval: 1000, // 1000 requests per minute globally
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 2000
  }),
  
  // Auth endpoints - login, register, password reset
  auth: new TokenBucketRateLimiter({
    tokensPerInterval: 10,   // 10 requests per minute for auth
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 20,
    errorHandler: (context: RequestContext) => {
      logSecurityEvent({
        type: 'BRUTE_FORCE_ATTEMPT',
        ip: context.ip,
        resource: context.path,
        severity: 'high',
        details: `Rate limit exceeded on authentication endpoint: ${context.method} ${context.path}`
      });
    }
  }),
  
  // Admin endpoints
  admin: new TokenBucketRateLimiter({
    tokensPerInterval: 100,  // 100 requests per minute for admin
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 200,
    keyGenerator: (context: RequestContext) => `user:${context.userId || 'anonymous'}:admin`
  }),
  
  // Security operations
  security: new TokenBucketRateLimiter({
    tokensPerInterval: 60,   // 60 requests per minute for security
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 120,
    keyGenerator: (context: RequestContext) => `user:${context.userId || 'anonymous'}:security`
  }),
  
  // Standard API endpoints
  api: new TokenBucketRateLimiter({
    tokensPerInterval: 300,  // 300 requests per minute for API
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 500,
    costCalculator: (context: RequestContext) => {
      // Higher cost for write operations
      return context.method === 'GET' ? 1 : 2;
    }
  }),
  
  // Public endpoints
  public: new TokenBucketRateLimiter({
    tokensPerInterval: 500,  // 500 requests per minute for public
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 1000
  })
};

export interface RateLimitOptions {
  tier?: 'auth' | 'admin' | 'security' | 'api' | 'public';
  logViolations?: boolean;
  blockingEnabled?: boolean;
  customContextBuilder?: (req: Request) => Record<string, any>;
  onViolation?: (req: Request, res: Response, context: RequestContext) => void;
}

/**
 * Creates a unified rate limiting middleware that selects the appropriate
 * limiter based on the request context
 */
export function createUnifiedRateLimit(options: RateLimitOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  return async function unifiedRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Build context from request
      const context = buildRateLimitContext(req, options.customContextBuilder);
      
      // First check global rate limit
      const globalAllowed = limiters.global.consumeWithContext(context);
      
      // Determine which specific limiter to use
      const tier = options.tier || context.resourceType as string || 'api';
      const limiter = limiters[tier as keyof typeof limiters] || limiters.api;
      
      // Check specific rate limit for this tier
      const tierAllowed = limiter.consumeWithContext(context);
      
      // Handle rate limit exceeded
      if (!globalAllowed || !tierAllowed) {
        // Which limit was exceeded
        const exceededType = !globalAllowed ? 'global' : tier;
        
        // Set rate limit headers
        const resetTime = !globalAllowed 
          ? limiters.global.getTimeToNextToken(limiters.global.getKeyFromContext(context)) 
          : limiter.getTimeToNextToken(limiter.getKeyFromContext(context));
        
        res.setHeader('Retry-After', Math.ceil(resetTime / 1000).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + resetTime) / 1000).toString());
        
        // Log the violation
        if (options.logViolations !== false) {
          logSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: context.ip,
            userAgent: context.headers['user-agent'],
            userId: context.userId,
            username: (req.user as any)?.username,
            details: `${exceededType.toUpperCase()} rate limit exceeded: ${context.method} ${context.path}`,
            resource: req.originalUrl,
            severity: tier === 'auth' ? 'medium' : 'low'
          });
        }
        
        // Call custom violation handler if provided
        if (options.onViolation) {
          options.onViolation(req, res, context);
          return;
        }
        
        // Block the request if blocking is enabled
        if (options.blockingEnabled !== false) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(resetTime / 1000)
          });
        }
        
        // Just warn but allow if blocking disabled
        req.rateLimitExceeded = true;
      }
      
      // Add rate limit headers even for successful requests
      const remainingTokens = limiter.getAvailableTokens(limiter.getKeyFromContext(context));
      res.setHeader('X-RateLimit-Remaining', remainingTokens.toString());
      
      next();
    } catch (error) {
      console.error('Error in rate limiting middleware:', error);
      // Fail open - allow request to proceed
      next();
    }
  };
}

// Pre-configured rate limiters for common scenarios
export const authRateLimit = createUnifiedRateLimit({ 
  tier: 'auth',
  logViolations: true,
  blockingEnabled: true
});

export const adminRateLimit = createUnifiedRateLimit({
  tier: 'admin',
  logViolations: true,
  blockingEnabled: true
});

export const securityRateLimit = createUnifiedRateLimit({
  tier: 'security',
  logViolations: true,
  blockingEnabled: true
});

export const apiRateLimit = createUnifiedRateLimit({
  tier: 'api',
  logViolations: true,
  blockingEnabled: true
});

export const publicRateLimit = createUnifiedRateLimit({
  tier: 'public',
  logViolations: true,
  blockingEnabled: true
});