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
import { ValidationEngine } from '../security/advanced/apiValidation/ValidationEngine';
import { 
  ValidationOptions, 
  ValidationMode, 
  ValidationTarget 
} from '../security/advanced/apiValidation/types';
import { 
  createUnifiedValidation, 
  UnifiedValidationOptions 
} from '../security/advanced/apiValidation/unifiedApiValidation';

// A map of endpoints to their validation rules
const endpointRules = new Map<string, string[]>();

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
  // Register with the ValidationEngine
  ValidationEngine.applyRulesToEndpoint(endpoint, ruleIds);
  
  // Store locally for auto-validation middleware
  endpointRules.set(endpoint, ruleIds);
  
  console.log(`[INFO] [VALIDATION] Applied validation rules to ${endpoint}: ${ruleIds.join(', ')}`);
}

/**
 * Apply unified validation to a specific endpoint (recommended method)
 */
export function applyUnifiedValidationRules(endpoint: string, ruleIds: string[], options?: UnifiedValidationOptions) {
  // Register with the ValidationEngine
  ValidationEngine.applyRulesToEndpoint(endpoint, ruleIds);
  
  // Store locally for auto-validation middleware with options
  endpointRules.set(endpoint, ruleIds);
  
  // Store options for this endpoint in a separate map if needed
  if (options) {
    endpointOptions.set(endpoint, options);
  }
  
  console.log(`[INFO] [UNIFIED_VALIDATION] Applied unified validation to ${endpoint}: ${ruleIds.join(', ')}`);
}

// Store endpoint-specific options
const endpointOptions = new Map<string, UnifiedValidationOptions>();

/**
 * Create validation middleware that will be automatically applied
 * to endpoints that have validation rules defined
 */
export function createAutoValidationMiddleware(defaultOptions?: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the endpoint path from the request
    const endpoint = req.path;
    
    // Check if this endpoint has validation rules
    if (endpointRules.has(endpoint)) {
      const ruleIds = endpointRules.get(endpoint)!;
      
      // Create and execute the validation middleware
      const validationMiddleware = ValidationEngine.createValidationMiddleware(ruleIds, defaultOptions);
      return validationMiddleware(req, res, next);
    }
    
    // No validation rules for this endpoint, proceed
    next();
  };
}

/**
 * Create auto unified validation middleware (recommended)
 * This middleware automatically applies unified validation to endpoints with rules defined
 */
export function createAutoUnifiedValidationMiddleware(defaultOptions?: UnifiedValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the endpoint path from the request
    const endpoint = req.path;
    
    // Check if this endpoint has validation rules
    if (endpointRules.has(endpoint)) {
      const ruleIds = endpointRules.get(endpoint)!;
      
      // Get endpoint-specific options if they exist
      const options = endpointOptions.get(endpoint) || defaultOptions;
      
      // Create and execute the unified validation middleware
      const validationMiddleware = createUnifiedValidationMiddleware(ruleIds, options);
      return validationMiddleware(req, res, next);
    }
    
    // No validation rules for this endpoint, proceed
    next();
  };
}

/**
 * Initialize common validation rules
 */
export function initializeCommonValidationRules() {
  // Import common validation rules - using import instead of require
  import('../validation/commonValidationRules').then(module => {
    const commonRules = module.default || module;
    
    // Register each rule with the ValidationEngine
    Object.entries(commonRules).forEach(([ruleId, rule]: [string, any]) => {
      try {
        ValidationEngine.registerRule(ruleId, rule);
      } catch (error) {
        console.warn(`[WARNING] [VALIDATION] Failed to register common rule ${ruleId}:`, error);
      }
    });
    
    console.log(`[INFO] [VALIDATION] Initialized ${Object.keys(commonRules).length} common validation rules`);
  }).catch(error => {
    console.error('[ERROR] [VALIDATION] Failed to import common validation rules:', error);
  });
}

/**
 * Generate validation documentation
 */
export async function generateValidationDocs(options: {
  format?: 'markdown' | 'json' | 'html';
  outputDir?: string;
}) {
  try {
    return await ValidationEngine.generateDocumentation(options.format);
  } catch (error) {
    console.error('[ERROR] [VALIDATION] Failed to generate documentation:', error);
    throw error;
  }
}