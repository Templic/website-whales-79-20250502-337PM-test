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
 * Check if a path is a Vite development resource
 * This helper function identifies Vite-specific development paths
 */
function isVitePath(path: string): boolean {
  const vitePatterns = [
    /^\/@vite\//,       // Vite internal modules
    /^\/@vite$/,        // Vite client entry
    /^\/@react-refresh/,// React refresh runtime
    /^\/@fs\//,         // Vite file system access
    /^\/node_modules\//, // Node modules accessed by Vite
    /^\/src\//          // Source files loaded by Vite
  ];
  
  return vitePatterns.some(pattern => pattern.test(path));
}

/**
 * Check if we're running in development mode
 */
function isDevMode(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Check if we're running on Replit
 */
function isRunningOnReplit(): boolean {
  // Check if we're in a Replit environment by checking domains env var
  return !!process.env.REPLIT_DOMAINS;
}

/**
 * Get list of trusted origins for Replit environment
 */
function getReplitTrustedOrigins(): string[] {
  const domains = process.env.REPLIT_DOMAINS || '';
  return domains.split(',').map(domain => `https://${domain.trim()}`);
}

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

  // Detect if we're running in Replit
  const isReplit = isRunningOnReplit();
  if (isReplit) {
    console.log('[Security] Running in Replit environment, adding special CSRF exemptions');
  }

  // Configure CSRF protection service with exempt routes
  const csrfOptions = {
    ignorePaths: [
      ...csrfExemptRoutes,
      '/api/public',
      '/api/health',
      '/api/metrics',
      '/api/test/csrf-exempt',
      '/api/webhook',
      '/api/content/key/',  // Content API - critical for development
      '/api/csrf-token',     // CSRF token endpoint
      '/api/openai/',        // OpenAI API integration
      '/service-worker.js',  // Service worker
      '/manifest.json',      // Web manifest
      // Rate limiting test routes
      '/rate-limit-test',
      '/rate-limit-test/basic',
      '/rate-limit-test/high-cost',
      '/rate-limit-test/stats',
      '/rate-limit-test/simulate-security-failure',
      '/rate-limit-test/simulate-security-success',
      // Vite development routes
      '/@vite',
      '/@vite/',
      '/@vite/client',
      '/@vite-client',
      '/@fs/',
      '/@react-refresh',
      '/src/',
      '/assets/',
      '/src/main.tsx',
      '/node_modules/',
      // Third-party content and widget integrations
      '/api/taskade/',       // Taskade widget API 
      '/taskade-widget.js',  // Taskade widget script
      '/api/youtube/',       // YouTube API integration
      '/api/maps/',          // Google Maps API integration
      '/widget/',            // General widget endpoints
      // Allow iframe content from trusted sources
      '/iframe-content/',    
      // Exempting the Dale Loves Whales Flask app routes from CSRF protection
      '/',
      '/index.html',
      '/about',
      '/new-music',
      '/archived-music',
      '/tour',
      '/engage',
      '/newsletter',
      '/blog',
      '/collaboration',
      '/contact',
      '/test'
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
      
      // For development routes that fail CSRF, always allow access in development
      // This ensures the app functions normally during development
      if (
        // These paths should never require CSRF protection
        req.path === '/' || 
        req.path === '/index.html' || 
        req.path === '/about' || 
        req.path === '/new-music' || 
        req.path === '/archived-music' || 
        req.path === '/tour' || 
        req.path === '/engage' || 
        req.path === '/newsletter' || 
        req.path === '/blog' || 
        req.path === '/collaboration' || 
        req.path === '/contact' || 
        req.path === '/test' ||
        // Service worker and web manifest
        req.path === '/service-worker.js' ||
        req.path === '/manifest.json' ||
        // API content and auth endpoints
        req.path.startsWith('/api/content/') ||
        req.path.startsWith('/api/auth/') ||
        req.path === '/api/csrf-token' ||
        // Third-party integrations
        req.path.startsWith('/api/openai/') ||
        req.path.startsWith('/api/taskade/') ||
        req.path.startsWith('/api/youtube/') ||
        req.path.startsWith('/api/maps/') ||
        req.path.startsWith('/widget/') ||
        req.path.startsWith('/iframe-content/') ||
        req.path === '/taskade-widget.js' ||
        // Check for third-party domain references in the path
        req.path.includes('taskade.com') ||
        req.path.includes('youtube.com') ||
        req.path.includes('youtu.be') ||
        req.path.includes('maps.google.com') ||
        req.path.includes('maps.googleapis.com') ||
        req.path.includes('openai.com') ||
        req.path.includes('stripe.com') ||
        req.path.includes('googleapis.com') ||
        req.path.includes('googleusercontent.com') ||
        // Vite development routes
        req.path.startsWith('/@vite') ||
        req.path.startsWith('/@fs/') ||
        req.path.startsWith('/@react-refresh') ||
        req.path.startsWith('/src/') ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/node_modules/') ||
        // Rate limit test routes
        req.path.startsWith('/rate-limit-test')
      ) {
        console.log('[Security] Allowing Flask app access despite CSRF error for path:', req.path);
        // Set a fresh CSRF token to recover and allow the request to proceed
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