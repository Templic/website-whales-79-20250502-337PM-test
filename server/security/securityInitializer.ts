/**
 * Security Initializer
 * 
 * This module initializes all security components and middleware for the application.
 * It provides a central place to configure and apply security features.
 */

import { Application, Router, Request, Response, NextFunction } from 'express';
import { applyGlobalSecurityMiddleware, enhanceSecurityRoutes, enhanceNewsletterRoutes, enhanceOrderRoutes } from './enhancement/routeEnhancements';
import { securityHeadersMiddleware, staticContentSecurityHeadersMiddleware } from './middleware/securityHeadersMiddleware';
import { apiUsageTracker, secureErrorHandler } from './utils/securityPatterns';
import { logSecurityEvent } from './utils/securityUtils';

interface SecurityInitializerOptions {
  enableAdvancedSecurity?: boolean;
  enableRateLimiting?: boolean;
  enableCSRFProtection?: boolean;
  enableSecurityHeaders?: boolean;
  enableInputValidation?: boolean;
  enableSecurityMonitoring?: boolean;
}

/**
 * Default security initializer options
 */
const defaultOptions: SecurityInitializerOptions = {
  enableAdvancedSecurity: true,
  enableRateLimiting: true,
  enableCSRFProtection: true,
  enableSecurityHeaders: true,
  enableInputValidation: true,
  enableSecurityMonitoring: true
};

/**
 * Initialize security features for the application
 * 
 * @param app Express application
 * @param apiRouter Express router for API routes
 * @param options Security configuration options
 */
export function initializeSecurity(
  app: Application,
  apiRouter: Router,
  shopRouter: Router,
  options: SecurityInitializerOptions = defaultOptions
): void {
  console.log('Initializing security features...');

  try {
    // Apply global security middleware to all routes
    applyGlobalSecurityMiddleware(app);
    
    // Apply security headers to static content
    app.use('/static', staticContentSecurityHeadersMiddleware);
    app.use('/assets', staticContentSecurityHeadersMiddleware);
    
    // Track API usage for security monitoring
    if (options.enableSecurityMonitoring) {
      app.use(apiUsageTracker);
    }
    
    // Enhance API routes with security features
    if (options.enableInputValidation) {
      enhanceSecurityRoutes(apiRouter);
      enhanceNewsletterRoutes(apiRouter);
      enhanceOrderRoutes(shopRouter);
    }
    
    // Set up global error handler
    app.use(secureErrorHandler);
    
    // Log successful security initialization
    console.log('Security features initialized successfully');
    logSecurityEvent('SECURITY_INITIALIZED', {
      options,
      timestamp: new Date()
    });
    
    // Return advanced security system if it was initialized
    return;
  } catch (error) {
    // Log initialization error
    console.error('Error initializing security features:', error);
    
    // Apply fallback security in case of failure
    applyFallbackSecurity(app);
  }
}

/**
 * Apply minimal fallback security if full initialization fails
 * 
 * @param app Express application
 */
function applyFallbackSecurity(app: Application): void {
  console.warn('Applying fallback security measures...');
  
  // Apply basic security headers
  app.use(securityHeadersMiddleware);
  
  // Apply basic error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error (fallback handler):', err);
    
    if (res.headersSent) {
      return next(err);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred'
    });
  });
  
  console.log('Fallback security measures applied');
}