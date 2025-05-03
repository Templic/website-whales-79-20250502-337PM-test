/**
 * CSRF Protection Middleware
 * 
 * This module provides middleware for protecting against Cross-Site Request Forgery (CSRF) attacks.
 * It implements token-based protection while allowing specific routes to be exempted.
 */

import { Request, Response, NextFunction } from 'express';
import csurf from 'csurf';
import { log } from '../vite';

// Exempt paths that should bypass CSRF protection
// These include authentication endpoints for Replit Auth
const DEFAULT_EXEMPT_PATHS = [
  // Auth-related paths
  '/api/login',
  '/api/callback',
  '/api/auth',
  '/api/auth/callback',
  '/api/logout',
  // Public API endpoints that don't change state
  '/api/public',
  '/api/health',
  // CSRF token endpoint itself must be exempt
  '/api/csrf-token'
];

// CSRF Protection configuration
interface CSRFOptions {
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    maxAge?: number;
  };
  exemptPaths?: string[];
  ignoreMethods?: string[];
}

// Default options
const defaultOptions: CSRFOptions = {
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  exemptPaths: DEFAULT_EXEMPT_PATHS,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
};

/**
 * Creates CSRF protection middleware with configurable options
 */
export function createCSRFMiddleware(options: CSRFOptions = {}) {
  // Merge options with defaults
  const mergedOptions: CSRFOptions = {
    cookie: { ...defaultOptions.cookie, ...options.cookie },
    exemptPaths: [...(defaultOptions.exemptPaths || []), ...(options.exemptPaths || [])],
    ignoreMethods: [...(defaultOptions.ignoreMethods || []), ...(options.ignoreMethods || [])]
  };

  // Create the CSRF middleware
  const csrfProtect = csurf({
    cookie: mergedOptions.cookie,
    ignoreMethods: mergedOptions.ignoreMethods
  });

  // Return a middleware function that checks if the path should be exempt
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the request path should be exempt from CSRF protection
    const isExempt = mergedOptions.exemptPaths?.some(path => 
      req.path === path || req.path.startsWith(`${path}/`)
    );

    if (isExempt) {
      return next();
    }

    // Apply CSRF protection for non-exempt paths
    return csrfProtect(req, res, next);
  };
}

/**
 * CSRF Protection Error Handler
 */
export function csrfErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log the CSRF error
  log(`CSRF token validation failed: ${req.method} ${req.path}`, 'security');

  // Return an appropriate error response
  if (req.path.startsWith('/api/')) {
    // JSON response for API requests
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_ERROR'
    });
  }

  // HTML response for page requests
  return res.status(403).send(`
    <html>
      <head><title>Invalid Security Token</title></head>
      <body>
        <h1>Invalid Security Token</h1>
        <p>Your session may have expired. Please refresh the page and try again.</p>
        <a href="/">Return to home page</a>
      </body>
    </html>
  `);
}

/**
 * CSRF Token Provider Middleware
 * Creates an endpoint to get a CSRF token
 */
export function setupCSRFTokenEndpoint(app: any) {
  // Use the csurf middleware directly for the token endpoint
  // This ensures we always get a valid token
  const csrfProtect = csurf({
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    }
  });
  
  app.get('/api/csrf-token', csrfProtect, (req: Request, res: Response) => {
    // Generate a token using the middleware-provided function
    try {
      const token = req.csrfToken();
      log('CSRF token generated: ' + token.substring(0, 8) + '...', 'security');
      return res.json({ csrfToken: token });
    } catch (err) {
      log('Failed to generate CSRF token: ' + err, 'security');
      // If token generation fails, send a placeholder but log the error
      res.json({ csrfToken: 'csrf-token-placeholder' });
    }
  });
}