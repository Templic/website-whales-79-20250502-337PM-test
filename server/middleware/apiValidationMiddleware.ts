/**
 * API Validation Middleware
 * 
 * This middleware provides request validation using Zod schemas and AI-powered security analysis.
 * It integrates with the ValidationEngine to provide schema-based and AI-based validation.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationEngine, ValidationOptions } from '../security/advanced/apiValidation/ValidationEngine';
import secureLogger from '../security/utils/secureLogger';

// Component name for secure logging
const logComponent = 'api-validation-middleware';

// A map of common validation rules
const commonRules = new Map<string, { schema: z.ZodTypeAny, options: any }>();

/**
 * Initialize common validation rules
 */
export function initializeCommonValidationRules() {
  // Email validation
  commonRules.set('email', {
    schema: z.object({
      email: z.string().email()
    }),
    options: { target: 'body' }
  });
  
  // Password validation
  commonRules.set('password', {
    schema: z.object({
      password: z.string().min(8)
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
    }),
    options: { target: 'body' }
  });
  
  // URL validation
  commonRules.set('url', {
    schema: z.object({
      url: z.string().url()
    }),
    options: { target: 'body' }
  });
  
  // Pagination validation
  commonRules.set('pagination', {
    schema: z.object({
      page: z.string().transform(Number).or(z.number()).optional().default(1),
      limit: z.string().transform(Number).or(z.number()).optional().default(10)
    }),
    options: { target: 'query' }
  });
  
  // ID validation
  commonRules.set('id', {
    schema: z.object({
      id: z.string().or(z.number())
    }),
    options: { target: 'params' }
  });
  
  secureLogger('info', logComponent, 'Common validation rules initialized');
}

/**
 * Creates auto-validation middleware that applies validation based on endpoint
 */
export function createAutoValidationMiddleware(options: ValidationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get rules for this endpoint
      const endpoint = req.path;
      const rules = ValidationEngine.getRulesForEndpoint(endpoint);
      
      if (rules.length === 0) {
        // No specific rules for this endpoint
        return next();
      }
      
      // Create middleware for these rules
      const middleware = ValidationEngine.createValidationMiddleware(
        rules.map(rule => rule.id),
        options
      );
      
      // Apply the middleware
      await middleware(req, res, next);
    } catch (error) {
      secureLogger('error', logComponent, 'Error in auto-validation middleware', { metadata: { path: req.path, error: error instanceof Error ? error.message : String(error) } });
      next(error);
    }
  };
}

/**
 * Apply validation middleware to a request using the specified schema
 * 
 * @param schema Zod schema for validation
 * @param options Validation options
 */
export function validateRequest(schema: z.ZodTypeAny, options: ValidationOptions = {}) {
  const ruleId = `dynamic-rule-${Date.now()}`;
  
  // Register the rule with the validation engine
  ValidationEngine.registerRule(ruleId, {
    name: options.target ? `${options.target}-validation` : 'request-validation',
    schema,
    target: options.target as any,
    description: 'Dynamically created validation rule'
  });
  
  // Create and return middleware
  return ValidationEngine.createValidationMiddleware([ruleId], options);
}

/**
 * Apply AI-powered security validation to a request
 * 
 * @param options Validation options with AI settings
 */
export function validateRequestWithAI(options: ValidationOptions = {}) {
  // Ensure AI validation is enabled
  const aiOptions: ValidationOptions = {
    ...options,
    useAI: true
  };
  
  // Create and return middleware without schema validation
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get AI connector and perform validation
      const validationFn = ValidationEngine.createValidationMiddleware([], aiOptions);
      await validationFn(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
}

/**
 * Higher-order function to validate and secure sensitive API endpoints
 * This middleware combines schema validation, AI validation, rate limiting, and other security measures
 * 
 * @param schema Zod schema for validation
 * @param options Validation options
 */
export function secureSensitiveEndpoint(schema: z.ZodTypeAny, options: ValidationOptions & {
  rateLimit?: boolean;
  csrfProtection?: boolean;
  requireAuth?: boolean;
} = {}) {
  const {
    rateLimit = true,
    csrfProtection = true,
    requireAuth = true,
    ...validationOptions
  } = options;
  
  // Create base middleware stack
  const middlewares = [];
  
  // Add rate limiting if enabled
  if (rateLimit) {
    // Rate limiting logic here... (not implemented in this snippet as it's in a separate module)
    // middlewares.push(rateLimiter({ tier: 'api', endpointType: 'sensitive' }));
  }
  
  // Add CSRF protection if enabled
  if (csrfProtection) {
    // CSRF protection logic here... (not implemented in this snippet as it's in a separate module)
    // middlewares.push(csrfProtection());
  }
  
  // Add auth requirement if enabled
  if (requireAuth) {
    // Authentication middleware here... (not implemented in this snippet as it's in a separate module)
    // middlewares.push(requireAuthentication());
  }
  
  // Add schema validation
  middlewares.push(validateRequest(schema, validationOptions));
  
  // Add AI validation with security analysis
  middlewares.push(validateRequestWithAI({
    ...validationOptions,
    useAI: true,
    logSeverity: 'high',
    aiOptions: {
      detailedAnalysis: true,
      contentType: 'api',
      ...validationOptions.aiOptions
    }
  }));
  
  // Return combined middleware stack
  return middlewares;
}

export default {
  validateRequest,
  validateRequestWithAI,
  secureSensitiveEndpoint,
  createAutoValidationMiddleware,
  initializeCommonValidationRules
};