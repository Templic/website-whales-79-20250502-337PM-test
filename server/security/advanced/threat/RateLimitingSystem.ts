/**
 * Rate Limiting System
 *
 * This module coordinates all rate limiting components into a cohesive system.
 * It serves as the central orchestrator for rate limiting decisions.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp } from '../../../utils/ip-utils';
import { RateLimitContext, RateLimitContextBuilder } from './RateLimitContextBuilder';
import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { threatDetectionService } from './ThreatDetectionService';
import { recordCsrfVerification, recordCsrfError } from './RateLimitIntegration';

// Routes that should be exempt from rate limiting
// This includes static content routes and public pages
const EXEMPT_ROUTES = [
  '/',
  '/index.html',
  '/about',
  '/cosmic',
  '/community',
  '/shop',
  '/tour',
  '/contact',
  '/blog',
  // Static assets
  /\.(css|js|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/,
  // Vite development resources
  /^\/@.*$/,                         // Vite HMR and other resources
  /^\/node_modules\/.*/,             // Node modules
  /^\/src\/.*/,                      // Source files
  /^\/service-worker\.js$/,          // Service worker
  /^\/manifest\.json$/,              // Web manifest
  /^\/assets\/.*/                    // Assets
];

/**
 * Configuration for rate limiting system
 */
export interface RateLimitingSystemConfig {
  /**
   * Global rate limit
   */
  globalLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * Auth endpoint rate limit
   */
  authLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * API endpoint rate limit
   */
  apiLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * Admin endpoint rate limit
   */
  adminLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * Security endpoint rate limit
   */
  securityLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * Public endpoint rate limit
   */
  publicLimit?: {
    capacity: number;
    refillRate: number;
    refillInterval: number;
  };
  
  /**
   * Whether to use context-aware rate limiting
   */
  contextAware?: boolean;
  
  /**
   * Skip whitelisted IPs
   */
  skipWhitelisted?: boolean;
  
  /**
   * Whitelisted IPs
   */
  whitelistedIps?: string[];
  
  /**
   * Blacklisted IPs
   */
  blacklistedIps?: string[];
  
  /**
   * Paths that skip rate limiting
   */
  skipPaths?: (string | RegExp)[];
}

/**
 * Default configuration for rate limiting
 */
const DEFAULT_CONFIG: Required<RateLimitingSystemConfig> = {
  globalLimit: {
    capacity: 300,
    refillRate: 50,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  authLimit: {
    capacity: 20,
    refillRate: 10,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  apiLimit: {
    capacity: 100,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  adminLimit: {
    capacity: 100,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  securityLimit: {
    capacity: 30,
    refillRate: 10,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  publicLimit: {
    capacity: 60,
    refillRate: 20,
    refillInterval: 60 * 1000 // 1 minute
  },
  
  contextAware: true,
  
  skipWhitelisted: true,
  
  whitelistedIps: [
    '127.0.0.1',
    '::1',
    'localhost'
  ],
  
  blacklistedIps: [],
  
  skipPaths: [
    '/health',
    '/ping',
    '/favicon.ico',
    '/api/csrf-token',
    '/api/content/key/',
    '/service-worker.js',
    '/manifest.json',
    '/api/auth/session',
    /\.(jpg|png|gif|svg|webp|woff|woff2|ttf|eot)$/i,
    /^\/api\/content\/key\/.*/i,  // All content key endpoints
    /^\/@fs\/.*/i,                // Vite file system access
    /^\/@vite\/.*/i,              // Vite resources
    /^\/node_modules\/.*/i        // Node modules access
  ]
};

/**
 * Rate limit scope
 */
export type RateLimitScope = 'global' | 'auth' | 'api' | 'admin' | 'security' | 'public';

/**
 * Map for rate limiters by scope
 */
type RateLimiterMap = Record<RateLimitScope, TokenBucketRateLimiter>;

/**
 * Analysis result
 */
interface RateLimitAnalysisResult {
  /**
   * Response status
   */
  status: 'success' | 'failure' | 'warning';
  
  /**
   * Response message
   */
  message: string;
  
  /**
   * Retry after time (ms)
   */
  retryAfter?: number;
  
  /**
   * Whether to skip rate limiting
   */
  skip?: boolean;
  
  /**
   * Rate limit context
   */
  context?: RateLimitContext;
  
  /**
   * Rate limiter used
   */
  limiter?: TokenBucketRateLimiter;
  
  /**
   * Tokens consumed
   */
  tokens?: number;
  
  /**
   * Capacity available
   */
  capacity?: number;
  
  /**
   * Remaining tokens
   */
  remaining?: number;
  
  /**
   * Reset time (ms since epoch)
   */
  resetTime?: number;
  
  /**
   * Adaptive multiplier applied
   */
  adaptiveMultiplier?: number;
}

/**
 * Rate limiting system class
 */
export class RateLimitingSystem {
  private config: Required<RateLimitingSystemConfig>;
  private contextBuilder: RateLimitContextBuilder;
  private analytics: RateLimitAnalytics;
  private adaptiveRateLimiter: AdaptiveRateLimiter;
  private rateLimiters: RateLimiterMap;
  
  constructor(config: RateLimitingSystemConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      globalLimit: { ...DEFAULT_CONFIG.globalLimit, ...config.globalLimit },
      authLimit: { ...DEFAULT_CONFIG.authLimit, ...config.authLimit },
      apiLimit: { ...DEFAULT_CONFIG.apiLimit, ...config.apiLimit },
      adminLimit: { ...DEFAULT_CONFIG.adminLimit, ...config.adminLimit },
      securityLimit: { ...DEFAULT_CONFIG.securityLimit, ...config.securityLimit },
      publicLimit: { ...DEFAULT_CONFIG.publicLimit, ...config.publicLimit }
    };
    
    // Initialize components
    this.contextBuilder = new RateLimitContextBuilder({
      whitelistedIps: this.config.whitelistedIps,
      blacklistedIps: this.config.blacklistedIps
    });
    
    this.analytics = new RateLimitAnalytics({
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
      reportInterval: 60 * 60 * 1000 // 1 hour
    });
    
    this.adaptiveRateLimiter = new AdaptiveRateLimiter({
      analytics: this.analytics
    });
    
    // Create rate limiters
    this.rateLimiters = {
      global: new TokenBucketRateLimiter({
        ...this.config.globalLimit,
        contextAware: this.config.contextAware,
        name: 'global'
      }),
      
      auth: new TokenBucketRateLimiter({
        ...this.config.authLimit,
        contextAware: this.config.contextAware,
        name: 'auth'
      }),
      
      api: new TokenBucketRateLimiter({
        ...this.config.apiLimit,
        contextAware: this.config.contextAware,
        name: 'api'
      }),
      
      admin: new TokenBucketRateLimiter({
        ...this.config.adminLimit,
        contextAware: this.config.contextAware,
        name: 'admin'
      }),
      
      security: new TokenBucketRateLimiter({
        ...this.config.securityLimit,
        contextAware: this.config.contextAware,
        name: 'security'
      }),
      
      public: new TokenBucketRateLimiter({
        ...this.config.publicLimit,
        contextAware: this.config.contextAware,
        name: 'public'
      })
    };
    
    log('Rate limiting system initialized', 'security');
  }
  
  /**
   * Create middleware for rate limiting
   * 
   * @returns Express middleware
   */
  public createMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if path should be skipped
        if (this.shouldSkipPath(req.path)) {
          return next();
        }
        
        // Analyze request
        const analysis = this.analyzeRequest(req);
        
        // Skip rate limiting if necessary
        if (analysis.skip) {
          return next();
        }
        
        // If rate limited, send response
        if (analysis.status === 'failure') {
          return this.sendRateLimitResponse(req, res, analysis);
        }
        
        // Set rate limit headers
        if (analysis.remaining !== undefined && analysis.resetTime !== undefined) {
          res.setHeader('X-RateLimit-Limit', String(analysis.capacity || 0));
          res.setHeader('X-RateLimit-Remaining', String(analysis.remaining));
          res.setHeader('X-RateLimit-Reset', String(Math.floor((analysis.resetTime || 0) / 1000)));
        }
        
        // Continue to next middleware
        next();
      } catch (error) {
        // Log error
        log(`Error in rate limit middleware: ${error}`, 'error');
        
        // Fail open
        next();
      }
    };
  }
  
  /**
   * Record CSRF verification
   * 
   * @param req Express request
   */
  public recordCsrfVerification(req: Request): void {
    recordCsrfVerification(req);
  }
  
  /**
   * Record CSRF error
   * 
   * @param req Express request
   * @param errorType Error type
   */
  public recordCsrfError(req: Request, errorType: string): void {
    recordCsrfError(req, errorType);
  }
  
  /**
   * Record a successful security check
   * Rewards tokens to clients that pass security checks
   * 
   * @param params Check parameters
   */
  public recordSuccessfulSecurityCheck(params: {
    clientIp: string;
    userId?: string;
    securityComponent: string;
    checkType: string;
    successValue?: number;
  }): void {
    try {
      const { 
        clientIp, 
        userId, 
        securityComponent, 
        checkType,
        successValue = 1
      } = params;
      
      // Get the security rate limiter
      const limiter = this.rateLimiters.security;
      
      // Construct a key that's specific to this client and check type
      const key = `${clientIp}:${userId || 'anonymous'}:${securityComponent}:${checkType}`;
      
      // Add tokens as a reward for successful security checks
      limiter.addTokens(key, successValue);
      
      // Log if needed
      if (this.config.contextAware) {
        log(`Security check passed: ${securityComponent}:${checkType} for ${clientIp}`, 'security');
      }
    } catch (error) {
      log(`Error recording successful security check: ${error}`, 'error');
    }
  }
  
  /**
   * Record a failed security check
   * Penalizes clients that fail security checks
   * 
   * @param params Check parameters
   */
  public recordFailedSecurityCheck(params: {
    clientIp: string;
    userId?: string;
    securityComponent: string;
    checkType: string;
    failureType: string;
    path?: string;
    failureValue?: number;
  }): void {
    try {
      const { 
        clientIp, 
        userId, 
        securityComponent, 
        checkType,
        failureType,
        path = '/',
        failureValue = 5
      } = params;
      
      // Get the security rate limiter
      const limiter = this.rateLimiters.security;
      
      // Construct a key that's specific to this client and check type
      const key = `${clientIp}:${userId || 'anonymous'}:${securityComponent}:${checkType}`;
      
      // Consume tokens as a penalty for failed security checks
      limiter.consumeTokens(key, failureValue);
      
      // Log the failure
      log(`Security check failed: ${securityComponent}:${checkType}:${failureType} for ${clientIp} on ${path}`, 'security');
      
      // Check if this puts the client over the suspicious activity threshold
      const remainingTokens = limiter.getAvailableTokens(key);
      if (remainingTokens <= 0) {
        // Report suspicious activity
        threatDetectionService.reportThreat({
          sourceIp: clientIp,
          userId: userId,
          threatType: 'security_check_failure',
          severity: 'medium',
          details: {
            component: securityComponent,
            checkType,
            failureType,
            path
          }
        });
      }
    } catch (error) {
      log(`Error recording failed security check: ${error}`, 'error');
    }
  }
  
  /**
   * Get the token deficit for a client
   * This can be used to assess the client's suspicious level
   * 
   * @param params Parameters
   * @returns Token deficit (negative values indicate suspicious activity)
   */
  public getTokenDeficit(params: {
    clientIp: string;
    userId?: string;
    path?: string;
  }): number {
    try {
      const { clientIp, userId, path = '/' } = params;
      
      // Get the security rate limiter
      const limiter = this.rateLimiters.security;
      
      // Determine the appropriate scope based on the path
      let scope: RateLimitScope = 'security';
      if (path.startsWith('/api/auth')) {
        scope = 'auth';
      } else if (path.startsWith('/api/admin')) {
        scope = 'admin';
      } else if (path.startsWith('/api')) {
        scope = 'api';
      }
      
      // Get the limiter for this scope
      const scopeLimiter = this.rateLimiters[scope];
      
      // Construct keys for both security and scope-specific checks
      const securityKey = `${clientIp}:${userId || 'anonymous'}:security:general`;
      const scopeKey = `${clientIp}:${userId || 'anonymous'}:${scope}:general`;
      
      // Get available tokens for both limiters
      const securityTokens = limiter.getAvailableTokens(securityKey);
      const scopeTokens = scopeLimiter.getAvailableTokens(scopeKey);
      
      // Calculate deficit as the negative of available tokens
      // The worse of the two deficits is returned
      const securityDeficit = limiter.getCapacity() - securityTokens;
      const scopeDeficit = scopeLimiter.getCapacity() - scopeTokens;
      
      // Return the worse of the two deficits
      return Math.max(securityDeficit, scopeDeficit);
    } catch (error) {
      log(`Error getting token deficit: ${error}`, 'error');
      return 0;
    }
  }
  
  /**
   * Analyze request for rate limiting
   * 
   * @param req Express request
   * @returns Analysis result
   */
  private analyzeRequest(req: Request): RateLimitAnalysisResult {
    try {
      // Get client IP
      const clientIp = getClientIp(req);
      
      // Check if client is whitelisted
      if (this.config.skipWhitelisted && this.isIpWhitelisted(clientIp)) {
        return {
          status: 'success',
          message: 'Client IP is whitelisted',
          skip: true
        };
      }
      
      // Build context
      const context = this.contextBuilder.buildContext(req);
      
      // Determine scope
      const scope = this.determineScope(req);
      
      // Get appropriate limiter
      const limiter = this.rateLimiters[scope];
      
      // Get adaptive multiplier
      const adaptiveMultiplier = this.adaptiveRateLimiter.getAdaptiveMultiplier(context);
      
      // Calculate request cost
      const tokens = this.contextBuilder.calculateRequestCost(req, context);
      
      // Get bucket key
      const key = this.getBucketKey(context);
      
      // Get capacity
      const capacity = limiter.getCapacity(key, context, adaptiveMultiplier);
      
      // Check if over threat threshold
      if (context.threatLevel > 0.75) {
        // Very high threat
        this.analytics.recordLimit(req, {} as Response, context, tokens, capacity, 30000);
        
        return {
          status: 'failure',
          message: 'Rate limited due to high threat level',
          retryAfter: 30000,
          context,
          limiter,
          tokens,
          capacity,
          remaining: 0,
          resetTime: Date.now() + 30000,
          adaptiveMultiplier
        };
      }
      
      // Check if client is blacklisted
      if (context.isBlacklisted) {
        // Apply stricter rate limiting to blacklisted IPs
        const strictCapacity = Math.ceil(capacity * 0.1); // 90% reduction
        const strictTokens = tokens * 5; // 5x token cost
        
        // Record limit
        this.analytics.recordLimit(req, {} as Response, context, strictTokens, strictCapacity, 60000);
        
        return {
          status: 'failure',
          message: 'Rate limited due to blacklisted IP',
          retryAfter: 60000,
          context,
          limiter,
          tokens: strictTokens,
          capacity: strictCapacity,
          remaining: 0,
          resetTime: Date.now() + 60000,
          adaptiveMultiplier
        };
      }
      
      // Try to consume tokens
      const result = limiter.consume(key, tokens, context, adaptiveMultiplier);
      
      // Check result
      if (result.limited) {
        // Record limit
        this.analytics.recordLimit(req, {} as Response, context, tokens, capacity, result.retryAfter);
        
        return {
          status: 'failure',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          context,
          limiter,
          tokens,
          capacity,
          remaining: result.remaining,
          resetTime: result.resetTime,
          adaptiveMultiplier
        };
      }
      
      // Record successful request
      this.analytics.recordPass(req, context);
      
      return {
        status: 'success',
        message: 'Request allowed',
        context,
        limiter,
        tokens,
        capacity,
        remaining: result.remaining,
        resetTime: result.resetTime,
        adaptiveMultiplier
      };
    } catch (error) {
      log(`Error analyzing rate limit request: ${error}`, 'error');
      
      // Fail open - let request through
      return {
        status: 'warning',
        message: 'Error analyzing rate limit request',
        skip: true
      };
    }
  }
  
  /**
   * Check if path should be skipped
   * 
   * @param path Request path
   * @returns Whether to skip
   */
  private shouldSkipPath(path: string): boolean {
    // Check if this is a development environment
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Check if we're running on Replit
    const isReplit = !!process.env.REPLIT_DOMAINS;
    
    // Special handling for Replit environment
    if (isReplit) {
      // For Replit, we need to be more permissive with rate limiting to ensure smooth development
      log(`Running in Replit environment with special exemptions for path: ${path}`, 'debug');
      
      // Skip rate limiting for all static assets and content APIs on Replit
      if (path.includes('.') || 
          path.startsWith('/api/content/') ||
          path.startsWith('/api/auth/') ||
          path.startsWith('/api/public/') ||
          path.startsWith('/api/openai/') ||
          path.startsWith('/api/taskade/') ||
          path.startsWith('/api/youtube/') ||
          path.startsWith('/api/maps/') ||
          path.startsWith('/widget/') ||
          path.startsWith('/iframe-content/') ||
          path === '/api/csrf-token' ||
          path === '/taskade-widget.js') {
        log(`Skipping rate limiting for Replit resource: ${path}`, 'debug');
        return true;
      }
      
      // Skip rate limiting for third-party domains in iframe src/scripts
      const thirdPartyDomains = ['taskade.com', 'youtube.com', 'youtu.be', 'maps.google.com', 
                                'maps.googleapis.com', 'openai.com', 'stripe.com', 
                                'googleapis.com', 'googleusercontent.com'];
      
      // Check if path contains any of these third-party domain references
      for (const domain of thirdPartyDomains) {
        if (path.includes(domain)) {
          log(`Skipping rate limiting for third-party content: ${path}`, 'debug');
          return true;
        }
      }
    }
    
    // Special handling for development environment
    if (isDevelopment) {
      // Skip rate limiting for Vite/webpack dev resources
      if (path.startsWith('/@') || 
          path.startsWith('/node_modules/') ||
          path.startsWith('/src/') ||
          path.startsWith('/assets/') ||
          path === '/service-worker.js' ||
          path === '/manifest.json') {
        log(`Skipping rate limiting for dev resource: ${path}`, 'debug');
        return true;
      }
      
      // Skip for API content in development
      if (path.startsWith('/api/content/')) {
        log(`Skipping rate limiting for API content in dev: ${path}`, 'debug');
        return true;
      }
      
      // Skip for authentication endpoints in development
      if (path.startsWith('/api/auth/')) {
        log(`Skipping rate limiting for auth endpoint in dev: ${path}`, 'debug');
        return true;
      }
      
      // Skip for CSRF token endpoint
      if (path === '/api/csrf-token') {
        log(`Skipping rate limiting for CSRF token endpoint: ${path}`, 'debug');
        return true;
      }
    }
    
    // First check if this is an exempt route that should always be skipped
    for (const exemptRoute of EXEMPT_ROUTES) {
      if (typeof exemptRoute === 'string') {
        if (path === exemptRoute) {
          log(`Skipping rate limiting for exempt route: ${path}`, 'debug');
          return true;
        }
      } else if (exemptRoute instanceof RegExp) {
        if (exemptRoute.test(path)) {
          log(`Skipping rate limiting for exempt route pattern: ${path}`, 'debug');
          return true;
        }
      }
    }
    
    // Check against configured skip paths
    for (const skipPath of this.config.skipPaths) {
      if (typeof skipPath === 'string') {
        if (path === skipPath) {
          return true;
        }
      } else if (skipPath instanceof RegExp) {
        if (skipPath.test(path)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if IP is whitelisted
   * 
   * @param ip IP address
   * @returns Whether whitelisted
   */
  private isIpWhitelisted(ip: string): boolean {
    return this.config.whitelistedIps.includes(ip);
  }
  
  /**
   * Determine rate limiting scope
   * 
   * @param req Express request
   * @returns Rate limit scope
   */
  private determineScope(req: Request): RateLimitScope {
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
      !path.includes('/api/admin') &&
      !path.includes('/api/security')
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
   * @param context Rate limit context
   * @returns Bucket key
   */
  private getBucketKey(context: RateLimitContext): string {
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
   * Send rate limit response
   * 
   * @param req Express request
   * @param res Express response
   * @param analysis Rate limit analysis
   * @returns Response
   */
  private sendRateLimitResponse(
    req: Request,
    res: Response,
    analysis: RateLimitAnalysisResult
  ): Response {
    // Set retry after header
    if (analysis.retryAfter) {
      res.setHeader('Retry-After', String(Math.ceil(analysis.retryAfter / 1000)));
    }
    
    // For API requests, send JSON
    if (req.path.includes('/api') || req.headers.accept?.includes('application/json')) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: analysis.message,
        retryAfter: analysis.retryAfter ? Math.ceil(analysis.retryAfter / 1000) : 60,
        retryAt: new Date(Date.now() + (analysis.retryAfter || 60000)).toISOString()
      });
    }
    
    // For other requests, send HTML
    return res.status(429).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rate Limited</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 2rem; }
            h1 { color: #e53e3e; margin-top: 0; }
            .card { background: #f8f9fa; border-left: 4px solid #e53e3e; padding: 1rem 1.5rem; border-radius: 4px; margin-bottom: 1.5rem; }
            code { background: #edf2f7; padding: 0.2rem 0.4rem; border-radius: 2px; font-size: 0.9em; }
          </style>
          <meta http-equiv="refresh" content="${Math.max(5, Math.ceil((analysis.retryAfter || 60000) / 1000))}">
        </head>
        <body>
          <h1>Rate Limit Exceeded</h1>
          <div class="card">
            <p>You have made too many requests in a short period of time.</p>
            <p>Please wait <strong>${Math.ceil((analysis.retryAfter || 60000) / 1000)} seconds</strong> before trying again.</p>
          </div>
          <p>This page will automatically refresh when you can try again.</p>
          <p><small>Reference ID: ${req.ip} • ${new Date().toISOString()}</small></p>
        </body>
      </html>
    `);
  }
  
  /**
   * Generate a report of rate limiting activity
   * 
   * @returns Rate limiting report
   */
  public generateReport(): any {
    return this.analytics.generateReport();
  }
  
  /**
   * Get adaptive adjustment metrics
   * 
   * @returns Adaptive metrics
   */
  public getAdaptiveAdjustmentMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        // Add any adaptive metrics here
      }
    };
  }
  
  /**
   * Blacklist an IP address
   * 
   * @param ip IP address
   */
  public blacklistIp(ip: string): void {
    this.contextBuilder.blacklistIp(ip);
    this.config.blacklistedIps.push(ip);
    
    log(`Blacklisted IP: ${ip}`, 'security');
  }
  
  /**
   * Whitelist an IP address
   * 
   * @param ip IP address
   */
  public whitelistIp(ip: string): void {
    this.contextBuilder.whitelistIp(ip);
    
    // Remove from blacklist if present
    const blacklistIndex = this.config.blacklistedIps.indexOf(ip);
    if (blacklistIndex >= 0) {
      this.config.blacklistedIps.splice(blacklistIndex, 1);
    }
    
    // Add to whitelist if not present
    if (!this.config.whitelistedIps.includes(ip)) {
      this.config.whitelistedIps.push(ip);
    }
    
    log(`Whitelisted IP: ${ip}`, 'security');
  }
  
  /**
   * Reset rate limits for a key
   * 
   * @param key Bucket key
   */
  public resetLimits(key: string): void {
    // Reset in all limiters
    Object.values(this.rateLimiters).forEach(limiter => {
      limiter.reset(key);
    });
    
    log(`Reset rate limits for: ${key}`, 'security');
  }
}

// Export singleton instance for use in the application
export const rateLimitingSystem = new RateLimitingSystem();