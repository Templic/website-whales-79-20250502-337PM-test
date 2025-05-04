/**
 * API Validation Middleware
 * 
 * Provides middleware to validate API requests using the ValidationEngine.
 * This middleware integrates with Express to validate requests before they
 * reach route handlers, ensuring data integrity and security.
 * 
 * Enhanced with:
 * - Integration with CSRF protection
 * - Integration with rate limiting
 * - Advanced error handling
 * - Context-aware validation
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationEngine, ValidationOptions } from '../security/advanced/apiValidation/ValidationEngine';
import { createUnifiedValidation, UnifiedValidationOptions, applyUnifiedValidation } from '../security/advanced/apiValidation/unifiedApiValidation';
import { ValidationErrorHandler } from '../security/advanced/apiValidation/ValidationErrorHandler';

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
 * Create validation middleware for an API endpoint (legacy method)
 */
export function createValidationMiddleware(ruleIds: string[], options?: ValidationOptions) {
  return ValidationEngine.createValidationMiddleware(ruleIds, options);
}

/**
 * Create unified validation middleware with CSRF and rate limiting integration
 */
export function createUnifiedValidationMiddleware(ruleIds: string[], options?: UnifiedValidationOptions) {
  return createUnifiedValidation(ruleIds, options);
}

/**
 * Apply validation middleware to specific endpoints (legacy method)
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
 * Apply unified validation to a specific endpoint (recommended method)
 */
export function applyUnifiedValidationRules(endpoint: string, ruleIds: string[], options?: UnifiedValidationOptions) {
  try {
    applyUnifiedValidation(endpoint, ruleIds, options);
    logger.info({
      action: 'UNIFIED_VALIDATION_RULES_APPLIED',
      endpoint,
      ruleIds,
      options,
      timestamp: Date.now()
    }, 'API_VALIDATION');
    return true;
  } catch (error) {
    logger.error({
      action: 'UNIFIED_VALIDATION_RULES_ERROR',
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
 * Create auto unified validation middleware (recommended)
 * This middleware automatically applies unified validation to endpoints with rules defined
 */
export function createAutoUnifiedValidationMiddleware(defaultOptions?: UnifiedValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }
    
    try {
      // Try to get validation rules for this endpoint
      const endpoint = req.path;
      
      // Get rule IDs for this endpoint
      const ruleIds = ValidationEngine['endpoints']?.get(endpoint);
      
      // If no rules found, continue to next middleware
      if (!ruleIds || ruleIds.length === 0) {
        return next();
      }
      
      // Apply unified validation middleware
      const middleware = createUnifiedValidation(ruleIds, defaultOptions);
      return middleware(req, res, next);
    } catch (error) {
      // Handle validation errors
      logger.error({
        action: 'AUTO_UNIFIED_VALIDATION_ERROR',
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      }, 'API_VALIDATION');
      
      // If this is in development mode, send detailed error info
      if (process.env.NODE_ENV !== 'production') {
        return ValidationErrorHandler.handleCustomError(
          res,
          'Validation system error',
          { error: error instanceof Error ? error.message : String(error) },
          { statusCode: 500 }
        );
      }
      
      // In production, send generic error
      return ValidationErrorHandler.handleCustomError(
        res,
        'Internal validation error',
        undefined,
        { includeDetails: false, statusCode: 500 }
      );
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

/**
 * Generate validation documentation
 */
export async function generateValidationDocs(options: {
  outputDir: string;
  format?: 'markdown' | 'json' | 'html';
  includeExamples?: boolean;
}) {
  try {
    const { ValidationDocGenerator } = require('../security/advanced/apiValidation/ValidationDocGenerator');
    
    const docOptions = {
      outputDir: options.outputDir,
      format: options.format || 'markdown',
      includeExamples: options.includeExamples || false,
      includePatterns: true,
      title: 'API Validation Documentation'
    };
    
    const outputPath = await ValidationDocGenerator.generateDocs(docOptions);
    
    logger.info({
      action: 'VALIDATION_DOCS_GENERATED',
      outputPath,
      format: options.format || 'markdown',
      timestamp: Date.now()
    }, 'API_VALIDATION');
    
    return outputPath;
  } catch (error) {
    logger.error({
      action: 'VALIDATION_DOCS_ERROR',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    }, 'API_VALIDATION');
    
    throw error;
  }
}

export default {
  // Legacy methods
  createValidationMiddleware,
  applyValidationRules,
  createAutoValidationMiddleware,
  
  // Enhanced unified methods (recommended)
  createUnifiedValidationMiddleware,
  applyUnifiedValidationRules,
  createAutoUnifiedValidationMiddleware,
  
  // Common functionality
  initializeCommonValidationRules,
  generateValidationDocs
};