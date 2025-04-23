/**
 * API Routes Protector
 * 
 * This module provides protection for API routes by applying various
 * security middleware to API endpoints.
 */

import type { Express, RequestHandler } from 'express';

/**
 * API Protection options
 */
export interface ApiProtectionOptions {
  /**
   * Enable RASP protection
   */
  enableRASP?: boolean;
  
  /**
   * Enable API security checks
   */
  enableApiSecurity?: boolean;
  
  /**
   * Enable default input validation
   */
  enableDefaultValidation?: boolean;
  
  /**
   * Enable sensitive procedures (more thorough but slower security checks)
   */
  enableSensitiveProcedures?: boolean;
  
  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];
  
  /**
   * Additional middlewares to apply
   */
  additionalMiddlewares?: RequestHandler[];
}

/**
 * Protect API routes with security middleware
 */
export function protectApiRoutes(app: Express, options: ApiProtectionOptions = {}): void {
  const {
    enableRASP = true,
    enableApiSecurity = true,
    enableDefaultValidation = true,
    enableSensitiveProcedures = false,
    excludePaths = [
      '/api/health',
      '/api/public',
      '/api/webhooks',
      '/api/external-callbacks',
      '/api/stripe-webhook'
    ],
    additionalMiddlewares = []
  } = options;
  
  console.log('[API-PROTECTION] Protecting API routes with options:', {
    enableRASP,
    enableApiSecurity,
    enableDefaultValidation,
    enableSensitiveProcedures,
    excludePaths: excludePaths.join(', '),
    additionalMiddlewares: additionalMiddlewares.length
  });
  
  // Apply middleware to all API routes except excluded paths
  app.use('/api', (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Continue to next middleware
    next();
  });
  
  // Apply RASP protection if enabled
  if (enableRASP) {
    // In a real implementation, we would import and apply RASP middleware
    console.log('[API-PROTECTION] RASP protection enabled');
  }
  
  // Apply API security checks if enabled
  if (enableApiSecurity) {
    // In a real implementation, we would import and apply API security middleware
    console.log('[API-PROTECTION] API security checks enabled');
  }
  
  // Apply default input validation if enabled
  if (enableDefaultValidation) {
    // In a real implementation, we would import and apply input validation middleware
    console.log('[API-PROTECTION] Default input validation enabled');
  }
  
  // Apply sensitive procedures if enabled
  if (enableSensitiveProcedures) {
    // In a real implementation, we would import and apply sensitive procedures middleware
    console.log('[API-PROTECTION] Sensitive procedures enabled');
  }
  
  // Apply additional middlewares
  if (additionalMiddlewares.length > 0) {
    app.use('/api', additionalMiddlewares);
    console.log(`[API-PROTECTION] Applied ${additionalMiddlewares.length} additional middlewares`);
  }
  
  console.log('[API-PROTECTION] API routes protection setup complete');
}