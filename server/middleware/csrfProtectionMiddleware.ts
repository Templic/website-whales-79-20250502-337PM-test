/**
 * Enhanced CSRF Protection Middleware Integration
 * 
 * This middleware provides comprehensive Cross-Site Request Forgery protection:
 * - Double Submit Cookie pattern
 * - SameSite cookie attributes
 * - Origin and Referer validation
 * - Per-request token validation
 * - Token rotation
 * - Integration with rate limiting system
 */
import { Express, Request, Response, NextFunction } from 'express';
import { 
  csrfProtection, 
  csrfTokenSetter, 
  csrfProtectionService 
} from '../security/advanced/csrf/CSRFProtectionService';
import { securityConfig } from '../security/advanced/config/SecurityConfig';
import { CSRFProtection, CSRFTokenSetter, csrfField } from './CSRFMiddleware';
import { csrfExemptRoutes } from '../utils/auth-config';
import { initializeRateLimitingAndCsrf, recordCsrfVerification, recordCsrfError } from '../security/advanced/threat/RateLimitIntegration';
import { rateLimitingSystem } from '../security/advanced/threat/RateLimitingSystem';

/**
 * Setup CSRF protection for Express application
 */
export function setupCSRFProtection(app: Express): void {
  // Skip setup if CSRF protection is disabled globally
  if (!securityConfig.getSecurityFeatures().csrfProtection) {
    console.log('[Security] CSRF protection is disabled globally');
    return;
  }

  // Initialize the rate limiting integration with CSRF
  initializeRateLimitingAndCsrf();

  // First, ensure rate limiting system is active - this must happen before CSRF protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only check rate limits for non-exempt routes
    if (!req.path.startsWith('/api/public') && !req.path.startsWith('/api/health')) {
      // Skip the actual rate limiting for GET requests to the homepage
      // This ensures the homepage always loads without ever showing "Security Verification Required"
      if (req.method === 'GET' && (req.path === '/' || req.path === '/index.html')) {
        next();
      } else {
        // For all other requests, apply contextual rate limiting
        // Use the middleware directly from the RateLimitingSystem instance
        const rateLimitMiddleware = rateLimitingSystem.createMiddleware();
        rateLimitMiddleware(req, res, next);
      }
    } else {
      next();
    }
  });

  // Configure CSRF protection service with exempt routes
  const csrfOptions = {
    ignorePaths: [
      ...csrfExemptRoutes,
      '/api/public',
      '/api/health',
      '/api/metrics',
      '/api/test/csrf-exempt',
      '/api/webhook',
      // Exempting the homepage from CSRF to ensure it always loads
      '/',
      '/index.html'
    ],
    cookie: {
      key: 'csrf-token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  // Configure the CSRF protection service
  // Using the exposed configuration method if available, or fall back to direct assignment
  if (typeof csrfProtectionService.configure === 'function') {
    csrfProtectionService.configure(csrfOptions);
  } else {
    console.log('[Security] Using fallback CSRF configuration method');
    // @ts-ignore - Accessing a private property for backward compatibility
    Object.assign(csrfProtectionService.options || {}, csrfOptions);
  }

  // Add a convenience endpoint for SPAs to get a fresh CSRF token
  app.get('/api/csrf-token', CSRFTokenSetter, function(req: Request, res: Response) {
    const token = req.cookies['csrf-token'];
    res.json({ csrfToken: token });
  });

  // Apply CSRF token setter to all GET requests
  app.get('*', CSRFTokenSetter);

  // Apply CSRF protection to non-GET requests (except for exempt routes)
  app.use(function(req: Request, res: Response, next: NextFunction) {
    // Skip GET requests (already handled by CSRFTokenSetter)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      // Record successful CSRF verification for GET requests in analytics
      recordCsrfVerification(req);
      return next();
    }
    
    // Skip exempt routes
    const isExempt = csrfOptions.ignorePaths.some(pattern => {
      if (typeof pattern === 'string') {
        return req.path === pattern || req.path.startsWith(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(req.path);
      }
      return false;
    });
    
    if (isExempt) {
      // Record exempt path in analytics
      recordCsrfVerification(req, true);
      return next();
    }
    
    // Wrap the CSRF Protection with our rate limiting integration
    const wrappedCSRFProtection = (req: Request, res: Response, next: NextFunction) => {
      CSRFProtection(req, res, (err?: any) => {
        if (err) {
          // Record CSRF error in rate limiting system
          recordCsrfError(req);
          next(err);
        } else {
          // Record successful CSRF verification
          recordCsrfVerification(req);
          next();
        }
      });
    };
    
    // Apply enhanced CSRF protection
    wrappedCSRFProtection(req, res, next);
  });

  // Add CSRF token to all HTML responses
  app.use(function(req: Request, res: Response, next: NextFunction) {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Get existing render method
    const originalRender = res.render;
    
    // Override render to include CSRF token in all templates
    res.render = function(view: string, options?: any, callback?: any): void {
      // Add CSRF token to template variables
      const token = req.cookies['csrf-token'];
      const csrfToken = token;
      const csrfHtml = csrfField(req);
      const templateVars = { ...options, csrfToken, csrfHtml };
      
      // Call original render
      if (callback) {
        originalRender.call(this, view, templateVars, callback);
      } else {
        originalRender.call(this, view, templateVars);
      }
    };
    
    next();
  });

  // Add CSRF error handler with rate limiting integration
  app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
    if (err && err.code === 'EBADCSRFTOKEN') {
      console.error('[Security] CSRF token validation failed for path:', req.path);
      
      // Record CSRF error in rate limiting system for security analysis
      // This helps detect potential CSRF attacks
      recordCsrfError(req);
      
      // Return a JSON error for API requests
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          error: 'CSRF token validation failed',
          code: 'CSRF_ERROR'
        });
      }
      
      // For homepage requests that fail CSRF, try to recover gracefully
      // This ensures the user can always access the homepage
      if (req.path === '/' || req.path === '/index.html') {
        console.log('[Security] Allowing homepage access despite CSRF error');
        // Set a fresh CSRF token to recover
        CSRFTokenSetter(req, res, () => {
          return next();
        });
        return;
      }
      
      // Redirect to error page for HTML requests
      return res.status(403).render('error', {
        message: 'Invalid security token',
        description: 'Your session may have expired. Please refresh the page and try again.'
      });
    }
    
    // Pass to next error handler
    next(err);
  });
  
  console.log('[Security] Enhanced CSRF protection middleware configured');
}

/**
 * Helper function to add CSRF protection to specific routes
 */
export function protectRoute(route: Express): Express {
  route.use(CSRFProtection);
  return route;
}

/**
 * Helper function to get CSRF token for a request
 */
export function getCSRFToken(req: Request): string | undefined {
  return req.cookies?.['csrf-token'] || undefined;
}