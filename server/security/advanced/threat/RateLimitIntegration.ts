/**
 * Rate Limit Integration
 * 
 * This module integrates rate limiting with other security features like CSRF protection.
 * It handles coordination between different security mechanisms to prevent conflicts.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp } from '../../../utils/ip-utils';
import { RateLimitContextBuilder } from './RateLimitContextBuilder';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';

// Default rate limit configurations
const DEFAULT_LIMITS = {
  global: {
    capacity: 300,
    refillRate: 50,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  auth: {
    capacity: 20,
    refillRate: 10,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  api: {
    capacity: 100,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  admin: {
    capacity: 100,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  security: {
    capacity: 30,
    refillRate: 10,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  public: {
    capacity: 60,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  }
};

// Singleton instances
let contextBuilder: RateLimitContextBuilder;
let analytics: RateLimitAnalytics;
let adaptiveRateLimiter: AdaptiveRateLimiter;
let rateLimiters: {
  global: TokenBucketRateLimiter;
  auth: TokenBucketRateLimiter;
  admin: TokenBucketRateLimiter;
  security: TokenBucketRateLimiter;
  api: TokenBucketRateLimiter;
  public: TokenBucketRateLimiter;
};

// Cache of recently verified CSRF tokens to prevent double rate limiting
const csrfVerifiedRequests = new Map<string, number>();

// Configuration for CSRF integration
const CSRF_CONFIG = {
  // Cache verified tokens for this long (ms)
  cacheTime: 60 * 1000, // 1 minute
  
  // Paths that should get CSRF verification but not rate limiting
  csrfOnlyPaths: [
    // These paths are already verified via CSRF but should not be rate limited
    '/api/csrf-token',    // Token generation endpoint
    '/api/security/check', // Security check endpoint
    '/api/auth/status'    // Auth status check
  ],
  
  // CSRF error types to track
  csrfErrorTypes: [
    'token_missing',
    'token_invalid',
    'token_expired',
    'token_used',
    'entropy_failure'
  ],
  
  // Cleanup interval for verified request cache
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
};

// Set up cleanup for verified requests
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize rate limiting and CSRF integration
 * 
 * @returns Middleware function
 */
export function initializeRateLimitingAndCsrf() {
  try {
    log('Initializing rate limiting and CSRF integration...', 'security');
    
    // Create context builder
    contextBuilder = new RateLimitContextBuilder({
      whitelistedIps: process.env.RATE_LIMIT_WHITELIST?.split(',') || [],
      blacklistedIps: process.env.RATE_LIMIT_BLACKLIST?.split(',') || []
    });
    
    // Create analytics
    analytics = new RateLimitAnalytics({
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
      reportInterval: 60 * 60 * 1000 // 1 hour
    });
    
    // Create rate limiters
    rateLimiters = {
      global: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.global,
        contextAware: true,
        name: 'global'
      }),
      
      auth: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.auth,
        contextAware: true,
        name: 'auth'
      }),
      
      api: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.api,
        contextAware: true,
        name: 'api'
      }),
      
      admin: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.admin,
        contextAware: true,
        name: 'admin'
      }),
      
      security: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.security,
        contextAware: true,
        name: 'security'
      }),
      
      public: new TokenBucketRateLimiter({
        ...DEFAULT_LIMITS.public,
        contextAware: true,
        name: 'public'
      })
    };
    
    // Create adaptive rate limiter
    adaptiveRateLimiter = new AdaptiveRateLimiter({
      analytics
    });
    
    // Start cleanup interval
    cleanupInterval = setInterval(() => {
      cleanupVerifiedRequests();
    }, CSRF_CONFIG.cleanupInterval);
    
    // Log initialization
    log('Rate limiting and CSRF integration initialized successfully', 'security');
    
    // Return middleware
    return createRateLimitAndCsrfMiddleware();
  } catch (error) {
    log(`Error initializing rate limiting and CSRF integration: ${error}`, 'security');
    
    // Return pass-through middleware
    return (req: Request, res: Response, next: NextFunction) => next();
  }
}

/**
 * Create a middleware function for rate limiting with CSRF integration
 * 
 * @returns Middleware function
 */
function createRateLimitAndCsrfMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if this is a successful CSRF verification that was already rate limited
      const requestId = getRequestIdentifier(req);
      if (csrfVerifiedRequests.has(requestId)) {
        // Request was already verified by CSRF middleware
        csrfVerifiedRequests.delete(requestId);
        return next();
      }
      
      // Get client IP
      const ip = getClientIp(req);
      
      // Skip rate limiting for whitelisted paths
      if (shouldSkipRateLimiting(req.path)) {
        return next();
      }
      
      // Build context
      const context = contextBuilder.buildContext(req);
      
      // Attach context to request for other middleware
      (req as any).rateLimitContext = context;
      
      // Get adaptive multiplier
      const adaptiveMultiplier = adaptiveRateLimiter.getAdaptiveMultiplier(context);
      
      // Calculate request cost
      const tokens = contextBuilder.calculateRequestCost(req, context);
      
      // Get appropriate limiter
      const limiterType = determineRateLimiterType(req);
      const limiter = rateLimiters[limiterType];
      
      // Get bucket key
      const key = getBucketKey(req, context);
      
      // Try to consume tokens
      const result = limiter.consume(key, tokens, context, adaptiveMultiplier);
      
      // Set headers
      res.setHeader('X-RateLimit-Limit', limiter.getCapacity(key, context, adaptiveMultiplier).toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000).toString());
      
      // Check if rate limited
      if (result.limited) {
        // Record limit
        analytics.recordLimit(req, res, context, tokens, limiter.getCapacity(key, context, adaptiveMultiplier), result.retryAfter);
        
        // Set retry-after header
        res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
        
        // Log rate limit
        log(`Rate limited: ${req.method} ${req.path} (${ip})`, 'security');
        
        // Send rate limit response
        return sendRateLimitResponse(req, res, result.retryAfter);
      }
      
      // Record pass
      analytics.recordPass(req, context);
      
      // If this request needs CSRF but not rate limiting, add to verified cache
      if (isPathWithCsrfOnly(req.path) && req.method !== 'GET') {
        // Mark as verified to prevent double rate limiting
        csrfVerifiedRequests.set(requestId, Date.now());
      }
      
      // Proceed to next middleware
      next();
    } catch (error) {
      log(`Error in rate limit middleware: ${error}`, 'security');
      
      // Fail open
      next();
    }
  };
}

/**
 * Get request identifier for caching
 * 
 * @param req Express request
 * @returns Unique identifier
 */
function getRequestIdentifier(req: Request): string {
  // Create unique identifier for this request
  const ip = getClientIp(req);
  const userId = req.session?.userId || 'anonymous';
  const path = req.path;
  const method = req.method;
  
  return `${ip}:${userId}:${method}:${path}`;
}

/**
 * Check if this path needs CSRF but not rate limiting
 * 
 * @param path Request path
 * @returns Whether to skip rate limiting
 */
function isPathWithCsrfOnly(path: string): boolean {
  return CSRF_CONFIG.csrfOnlyPaths.some(csrfPath => {
    // Exact match
    if (csrfPath === path) {
      return true;
    }
    
    // Wildcards
    if (csrfPath.endsWith('*') && path.startsWith(csrfPath.slice(0, -1))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Clean up verified requests cache
 */
function cleanupVerifiedRequests(): void {
  try {
    const now = Date.now();
    let count = 0;
    
    // Remove expired entries
    csrfVerifiedRequests.forEach((timestamp, key) => {
      if (now - timestamp > CSRF_CONFIG.cacheTime) {
        csrfVerifiedRequests.delete(key);
        count++;
      }
    });
    
    // Log cleanup
    if (count > 0) {
      log(`Cleaned up ${count} verified CSRF requests from cache`, 'security');
    }
  } catch (error) {
    log(`Error cleaning up verified requests: ${error}`, 'security');
  }
}

/**
 * Record a CSRF verification
 * 
 * @param req Express request
 */
export function recordCsrfVerification(req: Request): void {
  try {
    // Add to verified cache
    const requestId = getRequestIdentifier(req);
    csrfVerifiedRequests.set(requestId, Date.now());
  } catch (error) {
    log(`Error recording CSRF verification: ${error}`, 'security');
  }
}

/**
 * Record a CSRF error
 * 
 * @param req Express request
 * @param errorType Error type
 */
export function recordCsrfError(req: Request, errorType: string): void {
  try {
    // Get client IP
    const ip = getClientIp(req);
    
    // Get user ID if available
    const userId = req.session?.userId;
    
    // Check if this is a known error type
    if (CSRF_CONFIG.csrfErrorTypes.includes(errorType)) {
      // Apply minor threat penalty for suspicious activity
      threatDetectionService.recordError(ip, userId, req.path, 403, false);
      
      // If multiple failures, increase threat level
      const context = contextBuilder.buildContext(req);
      
      // Update analytics for CSRF errors
      // We'll track them as special rate limit events
      analytics.recordLimit(
        req,
        {} as Response, // We don't need response here
        context,
        1,
        10,
        5000 // 5 second penalty
      );
      
      // Log CSRF error
      log(`CSRF error (${errorType}) on ${req.method} ${req.path} from ${ip}${userId ? ` (${userId})` : ''}`, 'security');
    }
  } catch (error) {
    log(`Error recording CSRF error: ${error}`, 'security');
  }
}

/**
 * Determine which rate limiter to use based on request
 * 
 * @param req Express request
 * @returns Rate limiter type
 */
function determineRateLimiterType(req: Request): 'auth' | 'admin' | 'security' | 'api' | 'public' | 'global' {
  const path = req.path.toLowerCase();
  
  // Auth endpoints
  if (
    path.includes('/auth') || 
    path.includes('/login') || 
    path.includes('/logout') || 
    path.includes('/register') || 
    path.includes('/reset-password')
  ) {
    return 'auth';
  }
  
  // Admin endpoints
  if (path.includes('/admin')) {
    return 'admin';
  }
  
  // Security endpoints
  if (path.includes('/security')) {
    return 'security';
  }
  
  // API endpoints (exclude auth and admin which are already handled)
  if (
    path.includes('/api') && 
    !path.includes('/api/auth') && 
    !path.includes('/api/admin')
  ) {
    return 'api';
  }
  
  // Public endpoints
  if (
    path === '/' || 
    path.includes('/public') || 
    path.includes('/static') || 
    path.includes('/assets') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico')
  ) {
    return 'public';
  }
  
  // Default to global
  return 'global';
}

/**
 * Get bucket key
 * 
 * @param req Express request
 * @param context Rate limit context
 * @returns Bucket key
 */
function getBucketKey(req: Request, context: any): string {
  // If authenticated, use user ID
  if (context.authenticated && context.userId) {
    return `user:${context.userId}`;
  }
  
  // For API requests with API key, use API key
  if (context.apiKey) {
    return `api:${context.apiKey}`;
  }
  
  // Otherwise, use IP
  return `ip:${context.ip}`;
}

/**
 * Should skip rate limiting for this path?
 * 
 * @param path Request path
 * @returns Whether to skip
 */
function shouldSkipRateLimiting(path: string): boolean {
  // Skip health check and certain static assets
  return (
    path === '/health' ||
    path === '/ping' ||
    path === '/favicon.ico' ||
    path.endsWith('.jpg') ||
    path.endsWith('.png') ||
    path.endsWith('.gif') ||
    path.endsWith('.svg') ||
    path.endsWith('.webp') ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2') ||
    path.endsWith('.ttf') ||
    path.endsWith('.eot') ||
    isPathWithCsrfOnly(path)
  );
}

/**
 * Send rate limit response
 * 
 * @param req Express request
 * @param res Express response
 * @param retryAfter Retry after time
 * @returns Response
 */
function sendRateLimitResponse(req: Request, res: Response, retryAfter: number): Response {
  // For API requests, send JSON
  if (req.path.includes('/api') || req.headers.accept?.includes('application/json')) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
      retryAfter: Math.ceil(retryAfter / 1000)
    });
  }
  
  // For other requests, send HTML
  return res.status(429).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Too Many Requests</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 2rem; }
          h1 { color: #e53e3e; margin-top: 0; }
          .card { background: #f8f9fa; border-left: 4px solid #e53e3e; padding: 1rem 1.5rem; border-radius: 4px; margin-bottom: 1.5rem; }
          code { background: #edf2f7; padding: 0.2rem 0.4rem; border-radius: 2px; font-size: 0.9em; }
        </style>
        <meta http-equiv="refresh" content="${Math.max(5, Math.ceil(retryAfter / 1000))}">
      </head>
      <body>
        <h1>Too Many Requests</h1>
        <div class="card">
          <p>You have sent too many requests in a short period of time.</p>
          <p>Please wait <strong>${Math.ceil(retryAfter / 1000)} seconds</strong> before trying again.</p>
        </div>
        <p>This page will automatically refresh when you can try again.</p>
        <p><small>Reference: ${req.ip} • ${new Date().toISOString()}</small></p>
      </body>
    </html>
  `);
}

/**
 * Dispose of the system
 */
export function dispose(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  
  if (adaptiveRateLimiter) {
    adaptiveRateLimiter.dispose();
  }
  
  if (analytics) {
    analytics.dispose();
  }
}

/**
 * Get the rate limiting system components (for advanced usage)
 * 
 * @returns System components
 */
export function getRateLimitingComponents() {
  return {
    contextBuilder,
    analytics,
    adaptiveRateLimiter,
    rateLimiters
  };
}