/**
 * Rate Limit Integration Module
 *
 * This module integrates the rate limiting system with CSRF protection
 * and other security features.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { initializeRateLimiting, createUnifiedRateLimit } from './RateLimitingSystem';
import { recordAuditEvent } from '../../secureAuditTrail';

// Default CSRF exempt paths to avoid rate limiting issues
// These paths should match those in the CSRF protection module
const DEFAULT_EXEMPT_PATHS = [
  // Authentication endpoints (especially for Replit Auth)
  '/api/login',
  '/api/callback',
  '/api/auth',
  '/api/auth/callback',
  '/api/logout',
  
  // Public API endpoints that don't change state
  '/api/public',
  '/api/health',
  '/api/metrics',
  
  // External webhooks (typically have their own auth mechanisms)
  '/api/webhook',
  
  // The CSRF token endpoint itself
  '/api/csrf-token',
  
  // Static assets
  '/static',
  '/assets',
  '/favicon.ico',
  
  // Root path (landing page)
  '/'
];

// Additional exempt paths specific to our application
const ADDITIONAL_EXEMPT_PATHS = [
  // Public documentation
  '/docs',
  '/api/docs',
  
  // API version endpoint
  '/api/version',
  
  // Public resources
  '/api/resources/public',
  
  // Public user profiles
  '/api/users/public',
  
  // Health and status endpoints
  '/api/status',
  '/api/system/health',
  
  // Add more paths as needed
];

// Combine all exempt paths
const ALL_EXEMPT_PATHS = [...DEFAULT_EXEMPT_PATHS, ...ADDITIONAL_EXEMPT_PATHS];

/**
 * Check if a path is exempt from CSRF protection
 *
 * @param path Request path
 * @returns True if the path is exempt
 */
export function isCsrfExemptPath(path: string): boolean {
  // Check for exact match
  if (ALL_EXEMPT_PATHS.includes(path)) {
    return true;
  }
  
  // Check for path prefix (e.g., /static/ matches /static/css/style.css)
  for (const exemptPath of ALL_EXEMPT_PATHS) {
    if (exemptPath.endsWith('/') && path.startsWith(exemptPath)) {
      return true;
    }
  }
  
  // Special cases for static assets
  if (
    path.includes('/static/') ||
    path.includes('/assets/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.gif') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2') ||
    path.endsWith('.ttf') ||
    path.endsWith('.eot')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Create a middleware that handles CSRF errors and integrates with rate limiting
 *
 * @param csrfInstance CSRF protection instance
 * @returns Middleware function
 */
export function createCsrfErrorHandler(csrfInstance: any) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code !== 'EBADCSRFTOKEN') {
      return next(err);
    }
    
    try {
      // Log CSRF token error
      log(`CSRF token validation failed: ${req.method} ${req.path}`, 'security');
      
      // Record in audit trail
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'CSRF_VALIDATION_FAILED',
        resource: req.path,
        result: 'failure',
        severity: 'warning',
        details: {
          ip: req.ip,
          userId: req.session?.userId,
          method: req.method,
          path: req.path,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer
        }
      });
      
      // Send appropriate response
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          error: 'CSRF token validation failed',
          code: 'CSRF_ERROR',
          message: 'Invalid security token. Please refresh the page and try again.'
        });
      } else {
        // For HTML page requests, redirect to CSRF error page or show inline error
        return res.status(403).send(`<!DOCTYPE html>
          <html>
            <head>
              <title>Security Verification Required</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 2rem; }
                h1 { color: #e53e3e; margin-top: 0; }
                .card { background: #f8f9fa; border-left: 4px solid #e53e3e; padding: 1rem 1.5rem; border-radius: 4px; margin-bottom: 1.5rem; }
                .btn { display: inline-block; background: #4299e1; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: 500; }
                .btn:hover { background: #3182ce; }
              </style>
              <script>
                function refreshPage() {
                  // Get a fresh CSRF token first
                  fetch('/api/csrf-token')
                    .then(response => response.json())
                    .then(() => {
                      // Then reload the page
                      window.location.reload();
                    })
                    .catch(err => {
                      console.error('Failed to refresh CSRF token', err);
                      // Reload anyway
                      window.location.reload();
                    });
                }
                
                // Auto refresh token after a short delay
                setTimeout(() => {
                  fetch('/api/csrf-token')
                    .then(response => response.json())
                    .then(data => console.log('CSRF token refreshed'))
                    .catch(err => console.error('Failed to refresh CSRF token', err));
                }, 1000);
              </script>
            </head>
            <body>
              <h1>Security Verification Required</h1>
              <div class="card">
                <p>Your security token has expired or is invalid.</p>
                <p>This is a protection mechanism to keep your account secure.</p>
              </div>
              <p>Please try one of the following:</p>
              <ul>
                <li>Click the button below to refresh the page</li>
                <li>Go back to the <a href="/">home page</a> and try again</li>
              </ul>
              <button class="btn" onclick="refreshPage()">Refresh Page</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      log(`Error handling CSRF error: ${error}`, 'security');
      
      // Fail open
      return next(err);
    }
  };
}

/**
 * Create middleware to track request context
 * 
 * This middleware stores rate limit context in the request object
 * for use by other components. It doesn't perform rate limiting
 * itself, but makes the context available downstream.
 * 
 * @returns Middleware function
 */
export function createContextTracker() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip exempt paths
      if (isCsrfExemptPath(req.path)) {
        return next();
      }
      
      // Get the context from the request
      const context = (req as any).rateLimitContext;
      
      // If no context is available, proceed (context should be created by rate limiting middleware)
      if (!context) {
        return next();
      }
      
      // Add the context to the response locals for use in templates
      res.locals.rateLimitContext = context;
      
      // Proceed
      next();
    } catch (error) {
      log(`Error tracking rate limit context: ${error}`, 'security');
      
      // Fail open
      next();
    }
  };
}

/**
 * Initialize all rate limiting and CSRF integration
 * 
 * @returns Object with rate limiting middleware and CSRF integration
 */
export function initializeRateLimitingAndCsrf() {
  try {
    log('Initializing rate limiting and CSRF integration...', 'security');
    
    // Initialize rate limiting
    const rateLimitMiddleware = initializeRateLimiting();
    
    // Create context tracker
    const contextTracker = createContextTracker();
    
    // Log initialization
    log('Rate limiting and CSRF integration initialized successfully', 'security');
    
    // Return middleware
    return {
      rateLimitMiddleware,
      contextTracker,
      globalRateLimit: createUnifiedRateLimit('global'),
      authRateLimit: createUnifiedRateLimit('auth'),
      apiRateLimit: createUnifiedRateLimit('api'),
      adminRateLimit: createUnifiedRateLimit('admin'),
      securityRateLimit: createUnifiedRateLimit('security'),
      publicRateLimit: createUnifiedRateLimit('public'),
      createCsrfErrorHandler
    };
  } catch (error) {
    log(`Error initializing rate limiting and CSRF integration: ${error}`, 'security');
    
    // Return pass-through middleware
    return {
      rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => next(),
      contextTracker: (req: Request, res: Response, next: NextFunction) => next(),
      globalRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      authRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      apiRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      adminRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      securityRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      publicRateLimit: (req: Request, res: Response, next: NextFunction) => next(),
      createCsrfErrorHandler: () => (err: any, req: Request, res: Response, next: NextFunction) => next(err)
    };
  }
}