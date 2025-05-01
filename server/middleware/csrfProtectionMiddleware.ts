/**
 * CSRF Protection Middleware Integration
 */
import { Express, Request, Response, NextFunction } from 'express';
import { createCSRFMiddleware, generateToken } from '../security/csrf/CSRFProtection';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';
import { csrfExemptRoutes } from '../utils/auth-config';

/**
 * Setup CSRF protection for Express application
 */
export function setupCSRFProtection(app: Express): void {
  // Create CSRF middleware with default options
  const csrfMiddleware = createCSRFMiddleware({
    cookie: {
      key: 'X-CSRF-Token',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    ignorePaths: [
      ...csrfExemptRoutes,
      '/api/public',
      '/api/health',
      '/api/metrics',
      '/api/test/csrf-exempt',
      '/api/webhook'
    ]
  });

  // Apply CSRF middleware globally to all routes
  app.use(csrfMiddleware);

  // Add a convenience endpoint for SPAs to get a fresh CSRF token
  app.get('/api/csrf-token', function(req: Request, res: Response) {
    const token = generateToken(req);
    res.json({ csrfToken: token });
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
      const csrfToken = (req as any).csrfToken;
      const templateVars = { ...options, csrfToken };
      
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
      // Handle CSRF token validation errors
      logSecurityEvent({
        category: SecurityEventCategory.CSRF,
        severity: SecurityEventSeverity.WARNING,
        message: 'CSRF token validation failed',
        data: {
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
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
        description: 'Your session may have expired. Please refresh the page.'
      });
    }
    
    // Pass to next error handler
    next(err);
  });
}

/**
 * Helper function to add CSRF protection to specific routes
 */
export function protectRoute(route: Express): Express {
  const csrfMiddleware = createCSRFMiddleware();
  route.use(csrfMiddleware);
  return route;
}

/**
 * Helper function to get CSRF token for a request
 */
export { generateToken as getCSRFToken };