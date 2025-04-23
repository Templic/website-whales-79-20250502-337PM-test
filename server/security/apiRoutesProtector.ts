/**
 * API Routes Protector
 * 
 * This module provides a middleware factory that applies comprehensive
 * security protection to API routes, combining multiple security layers.
 */

import { Express, Request, Response, NextFunction } from 'express';
import { defaultApiValidation } from '../middleware/apiValidationMiddleware';
import { sensitiveProceduresMiddleware, apiSecurityMiddleware } from '../middleware/apiSecurityMiddleware';
import { raspMiddleware } from './advanced/rasp';
import { securityFabric } from './advanced/SecurityFabric';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';

/**
 * API protection options
 */
export interface ApiProtectionOptions {
  /**
   * Whether to enable RASP protection
   */
  enableRASP?: boolean;
  
  /**
   * Whether to enable API security middleware
   */
  enableApiSecurity?: boolean;
  
  /**
   * Whether to enable default API validation
   */
  enableDefaultValidation?: boolean;
  
  /**
   * Whether to enable sensitive procedures protection
   */
  enableSensitiveProcedures?: boolean;
  
  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];
  
  /**
   * Additional middlewares to apply
   */
  additionalMiddlewares?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

/**
 * Create API protection middleware
 * 
 * @param options Protection options
 */
export function createApiProtection(options: ApiProtectionOptions = {}) {
  const {
    enableRASP = true,
    enableApiSecurity = true,
    enableDefaultValidation = true,
    enableSensitiveProcedures = false,
    excludePaths = [],
    additionalMiddlewares = []
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Create a chain of middlewares
    const middlewareChain = [];
    
    // Add RASP middleware first if enabled
    if (enableRASP) {
      middlewareChain.push(raspMiddleware);
    }
    
    // Add API security middleware if enabled
    if (enableApiSecurity) {
      middlewareChain.push(apiSecurityMiddleware());
    }
    
    // Add default API validation if enabled
    if (enableDefaultValidation) {
      middlewareChain.push(defaultApiValidation());
    }
    
    // Add sensitive procedures middleware if enabled
    if (enableSensitiveProcedures) {
      middlewareChain.push(sensitiveProceduresMiddleware());
    }
    
    // Add additional middlewares
    middlewareChain.push(...additionalMiddlewares);
    
    // Execute middleware chain
    const executeMiddlewareChain = (index: number) => {
      if (index >= middlewareChain.length) {
        return next();
      }
      
      middlewareChain[index](req, res, (err: any) => {
        if (err) {
          return next(err);
        }
        
        executeMiddlewareChain(index + 1);
      });
    };
    
    // Start executing middlewares
    executeMiddlewareChain(0);
  };
}

/**
 * Apply API protection to the entire Express app
 * 
 * @param app Express app
 * @param options Protection options
 */
export function protectApiRoutes(app: Express, options: ApiProtectionOptions = {}) {
  // Create API protection middleware
  const apiProtection = createApiProtection(options);
  
  // Apply to all API routes
  app.use('/api', apiProtection);
  
  // Log API protection initialization
  securityBlockchain.addSecurityEvent({
    severity: SecurityEventSeverity.INFO,
    category: SecurityEventCategory.SYSTEM,
    message: 'API routes protection initialized',
    metadata: {
      options
    },
    timestamp: new Date()
  }).catch(error => {
    console.error('[API-PROTECTION] Error logging security event:', error);
  });
  
  securityFabric.emit('security:api:protection:initialized', {
    options,
    timestamp: new Date()
  });
  
  console.log('[SECURITY] API routes protection initialized');
}

/**
 * Default instance with maximum protection
 */
export const maximumApiProtection = createApiProtection({
  enableRASP: true,
  enableApiSecurity: true,
  enableDefaultValidation: true,
  enableSensitiveProcedures: true,
  excludePaths: [
    '/api/health',
    '/api/public',
    '/api/webhooks',
    '/api/external-callbacks',
    '/api/stripe-webhook'
  ]
});