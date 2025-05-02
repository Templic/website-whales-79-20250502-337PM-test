/**
 * Enhanced CSRF Protection Middleware Integration
 * 
 * This middleware provides comprehensive Cross-Site Request Forgery protection:
 * - Double Submit Cookie pattern
 * - SameSite cookie attributes
 * - Origin and Referer validation
 * - Per-request token validation
 * - Token rotation
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

/**
 * Setup CSRF protection for Express application
 */
export function setupCSRFProtection(app: Express): void {
  // Skip setup if CSRF protection is disabled globally
  if (!securityConfig.getSecurityFeatures().csrfProtection) {
    console.log('[Security] CSRF protection is disabled globally');
    return;
  }

  // Configure CSRF protection service with exempt routes
  const csrfOptions = {
    ignorePaths: [
      ...csrfExemptRoutes,
      '/api/public',
      '/api/health',
      '/api/metrics',
      '/api/test/csrf-exempt',
      '/api/webhook'
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
  Object.assign(csrfProtectionService.options, csrfOptions);

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
      return next();
    }
    
    // Skip exempt routes
    if (csrfOptions.ignorePaths.some(pattern => {
      if (typeof pattern === 'string') {
        return req.path === pattern || req.path.startsWith(pattern);
      } else {
        return pattern.test(req.path);
      }
    })) {
      return next();
    }
    
    // Apply CSRF protection
    CSRFProtection(req, res, next);
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

  // Add CSRF error handler
  app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
    if (err && err.code === 'EBADCSRFTOKEN') {
      console.error('[Security] CSRF token validation failed for path:', req.path);
      
      // Return a JSON error for API requests
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({
          error: 'CSRF token validation failed',
          code: 'CSRF_ERROR'
        });
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