/**
 * Advanced CSRF Protection Module
 * 
 * This module provides a comprehensive Cross-Site Request Forgery (CSRF) protection system
 * with performance optimizations, flexible path exemptions, and detailed security logging.
 */

import { Request, Response, NextFunction, Application } from 'express';
import csurf from 'csurf';
import { log } from '../vite';

// Security event types for tracking and monitoring
enum CSRFSecurityEvent {
  TOKEN_GENERATED = 'token_generated',
  TOKEN_VALIDATION_FAILED = 'token_validation_failed',
  TOKEN_VALIDATED = 'token_validated'
}

/**
 * Paths that are exempt from CSRF protection by default
 * These include authentication routes and public endpoints
 */
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
  '/api/csrf-token'
];

/**
 * Comprehensive CSRF configuration options
 */
interface CSRFProtectionOptions {
  // Cookie configuration
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    maxAge?: number;
    path?: string;
    domain?: string;
  };
  
  // Path & method configuration
  exemptPaths?: string[];
  ignoreMethods?: string[];
  
  // Security features
  enableSecurityLogging?: boolean;
  tokenLength?: number;
  refreshTokenAutomatically?: boolean;
}

// Default CSRF protection options with secure defaults
const defaultOptions: CSRFProtectionOptions = {
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  },
  exemptPaths: DEFAULT_EXEMPT_PATHS,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  enableSecurityLogging: true,
  tokenLength: 64,
  refreshTokenAutomatically: true
};

/**
 * CSRFProtection class - provides all CSRF protection functionality
 * Using a class-based approach for better organization and state management
 */
export class CSRFProtection {
  private options: CSRFProtectionOptions;
  private csrfInstance: any;
  
  constructor(options: CSRFProtectionOptions = {}) {
    // Deep merge of provided options with defaults
    this.options = {
      cookie: { ...defaultOptions.cookie, ...options.cookie },
      exemptPaths: [
        ...(defaultOptions.exemptPaths || []), 
        ...(options.exemptPaths || [])
      ],
      ignoreMethods: [
        ...(defaultOptions.ignoreMethods || []),
        ...(options.ignoreMethods || [])
      ],
      enableSecurityLogging: 
        options.enableSecurityLogging !== undefined 
          ? options.enableSecurityLogging 
          : defaultOptions.enableSecurityLogging,
      tokenLength: options.tokenLength || defaultOptions.tokenLength,
      refreshTokenAutomatically: 
        options.refreshTokenAutomatically !== undefined
          ? options.refreshTokenAutomatically
          : defaultOptions.refreshTokenAutomatically
    };
    
    // Create the CSRF protection instance
    this.csrfInstance = csurf({
      cookie: this.options.cookie,
      ignoreMethods: this.options.ignoreMethods
    });
  }
  
  /**
   * Middleware function that applies CSRF protection
   * Checks for exempted paths and applies protection selectively
   */
  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Check if the path is exempt from CSRF protection
    if (this.isPathExempt(req.path)) {
      return next();
    }
    
    // Apply CSRF protection
    this.csrfInstance(req, res, (err: any) => {
      if (err) {
        return this.handleError(err, req, res, next);
      }
      
      // Log successful validation if enabled
      if (this.options.enableSecurityLogging && req.method !== 'GET') {
        this.logSecurityEvent(CSRFSecurityEvent.TOKEN_VALIDATED, { 
          path: req.path, 
          method: req.method 
        });
      }
      
      next();
    });
  }
  
  /**
   * Error handler for CSRF validation failures
   */
  public handleError = (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (err.code !== 'EBADCSRFTOKEN') {
      return next(err);
    }
    
    // Log the validation failure
    this.logSecurityEvent(CSRFSecurityEvent.TOKEN_VALIDATION_FAILED, {
      path: req.path,
      method: req.method,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown'
    });
    
    // Return appropriate error response based on request type
    if (req.path.startsWith('/api/')) {
      // JSON response for API requests
      return res.status(403).json({
        error: 'CSRF token validation failed',
        code: 'CSRF_ERROR',
        message: 'Invalid security token. Please refresh the page and try again.'
      });
    }
    
    // HTML response for web page requests
    return res.status(403).send(`<!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Security Token</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 2rem; }
            h1 { color: #e53e3e; margin-top: 0; }
            .card { background: #f8f9fa; border-left: 4px solid #e53e3e; padding: 1rem 1.5rem; border-radius: 4px; margin-bottom: 1.5rem; }
            .btn { display: inline-block; background: #4299e1; color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: 500; }
            .btn:hover { background: #3182ce; }
          </style>
          <script>
            function refreshPage() {
              window.location.reload();
            }
            
            // Auto refresh token after a short delay
            setTimeout(() => {
              fetch('/api/csrf-token')
                .then(response => response.json())
                .then(() => console.log('CSRF token refreshed'))
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
  
  /**
   * Configure the token endpoint on the provided Express application
   */
  public setupTokenEndpoint = (app: Application): void => {
    app.get('/api/csrf-token', this.csrfInstance, (req: Request, res: Response) => {
      try {
        // Generate a token
        const token = req.csrfToken();
        
        // Log token generation if enabled
        if (this.options.enableSecurityLogging) {
          this.logSecurityEvent(CSRFSecurityEvent.TOKEN_GENERATED, {
            tokenPreview: token.substring(0, 8)
          });
        }
        
        // Send the token to the client
        return res.json({ csrfToken: token });
      } catch (err) {
        // Handle token generation errors
        const errorMessage = err instanceof Error ? err.message : String(err);
        log(`Failed to generate CSRF token: ${errorMessage}`, 'security');
        
        // Return an error response
        return res.status(500).json({ 
          error: 'Failed to generate security token',
          code: 'TOKEN_GENERATION_FAILED'
        });
      }
    });
  }
  
  /**
   * Check if a path should be exempt from CSRF protection
   */
  private isPathExempt(path: string): boolean {
    return !!this.options.exemptPaths?.some(exemptPath => 
      path === exemptPath || 
      path.startsWith(`${exemptPath}/`) ||
      // Support wildcard exemptions (e.g., '/api/public/*')
      (exemptPath.endsWith('*') && path.startsWith(exemptPath.slice(0, -1)))
    );
  }
  
  /**
   * Log security events with consistent formatting
   */
  private logSecurityEvent(event: CSRFSecurityEvent, data: Record<string, any> = {}): void {
    if (!this.options.enableSecurityLogging) return;
    
    switch (event) {
      case CSRFSecurityEvent.TOKEN_GENERATED:
        log(`CSRF token generated: ${data.tokenPreview}...`, 'security');
        break;
        
      case CSRFSecurityEvent.TOKEN_VALIDATION_FAILED:
        log(`CSRF token validation failed: ${data.method} ${data.path}`, 'security');
        break;
        
      case CSRFSecurityEvent.TOKEN_VALIDATED:
        // Verbose logging - uncomment if needed
        // log(`CSRF token validated: ${data.method} ${data.path}`, 'security');
        break;
    }
  }
  
  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string || 
      req.socket.remoteAddress || 
      'unknown'
    );
  }
}

// Create and export a default instance
const defaultProtection = new CSRFProtection();

// Export convenience functions
export const createCSRFMiddleware = (options: CSRFProtectionOptions = {}) => {
  const protection = new CSRFProtection(options);
  return protection.middleware;
};

export const csrfErrorHandler = defaultProtection.handleError;

export function setupCSRFTokenEndpoint(app: Application): void {
  defaultProtection.setupTokenEndpoint(app);
}