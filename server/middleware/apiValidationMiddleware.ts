/**
 * API Validation Middleware
 * 
 * Provides middleware to validate API requests using the ValidationEngine.
 * This middleware integrates with Express to validate requests before they
 * reach route handlers, ensuring data integrity and security.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationEngine, ValidationOptions } from '../security/advanced/apiValidation/ValidationEngine';

// Use a simpler logger to avoid circular dependencies
const logger = {
  info: (data: any, domain?: string) => {
    console.log(`[INFO] [${domain || 'API_VALIDATION'}]`, typeof data === 'string' ? data : JSON.stringify(data));
  },
  error: (data: any, domain?: string) => {
    console.error(`[ERROR] [${domain || 'API_VALIDATION'}]`, typeof data === 'string' ? data : JSON.stringify(data));
  },
  warn: (data: any, domain?: string) => {
    console.warn(`[WARN] [${domain || 'API_VALIDATION'}]`, typeof data === 'string' ? data : JSON.stringify(data));
  }
};

/**
 * Create validation middleware for an API endpoint
 */
export function createValidationMiddleware(ruleIds: string[], options?: ValidationOptions) {
  return ValidationEngine.createValidationMiddleware(ruleIds, options);
}

/**
 * Apply validation middleware to specific endpoints
 */
export function applyValidationRules(endpoint: string, ruleIds: string[]) {
  try {
    ValidationEngine.applyRulesToEndpoint(endpoint, ruleIds);
    logger.info({
      action: 'VALIDATION_RULES_APPLIED',
      endpoint,
      ruleIds,
      timestamp: Date.now()
    }, 'API_VALIDATION');
    return true;
  } catch (error) {
    logger.error({
      action: 'VALIDATION_RULES_ERROR',
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, 'API_VALIDATION');
    return false;
  }
}

/**
 * Create validation middleware that will be automatically applied
 * to endpoints that have validation rules defined
 */
export function createAutoValidationMiddleware(defaultOptions?: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    try {
      // Try to get validation rules for this endpoint
      const endpoint = req.path;
      const middleware = ValidationEngine.createEndpointValidation(endpoint, defaultOptions);
      
      // Apply validation middleware
      return middleware(req, res, next);
    } catch (error) {
      // If no validation rules exist, just continue
      if (error instanceof Error && error.message.includes('No validation rules found')) {
        return next();
      }
      
      // Log other errors
      logger.error({
        action: 'AUTO_VALIDATION_ERROR',
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      }, 'API_VALIDATION');
      
      // Continue without validation in case of errors
      return next();
    }
  };
}

/**
 * Initialize common validation rules
 */
export function initializeCommonValidationRules() {
  // This function would set up common validation rules for typical API endpoints
  // For example, user authentication, pagination parameters, etc.
  logger.info({
    action: 'COMMON_VALIDATION_RULES_INITIALIZED',
    timestamp: Date.now()
  }, 'API_VALIDATION');
}

export default {
  createValidationMiddleware,
  applyValidationRules,
  createAutoValidationMiddleware,
  initializeCommonValidationRules
};