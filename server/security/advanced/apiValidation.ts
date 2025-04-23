/**
 * Advanced API Validation Module
 * 
 * This module provides a comprehensive API input validation framework
 * that ensures all user inputs are properly validated before processing.
 * 
 * Features:
 * - Schema-based validation using Zod
 * - Validation middleware for Express routes
 * - Type inference for validated request data
 * - Detailed error reporting
 * - Consistent error responses
 * - Protection against common input attacks
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnyZodObject, ZodError } from 'zod';
import { logSecurityEvent } from '../security';

// Type definitions
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers' | 'cookies';
export type ValidationOptions = {
  strictMode?: boolean;
  errorStatus?: number;
  allowUnknownFields?: boolean;
  customErrorMap?: z.ZodErrorMap;
  errorHandler?: (errors: z.ZodError, req: Request, res: Response) => void;
};

/**
 * Creates a validation middleware for Express routes
 * 
 * @param schema The Zod schema to validate against
 * @param target The request property to validate
 * @param options Validation options
 */
export function validate<T extends AnyZodObject>(
  schema: T,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  const {
    strictMode = true,
    errorStatus = 400,
    allowUnknownFields = false,
    customErrorMap,
    errorHandler
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Choose the validation target
      const targetData = req[target as keyof Request];
      
      // Choose the right parsing method based on options
      let validationResult;
      if (strictMode) {
        validationResult = schema.strict().parse(targetData);
      } else if (allowUnknownFields) {
        validationResult = schema.passthrough().parse(targetData);
      } else {
        validationResult = schema.parse(targetData);
      }
      
      // Replace the original data with the validated data
      req[target as keyof Request] = validationResult as any;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log validation failure as security event
        logSecurityEvent({
          type: 'input-validation-failure',
          category: 'api-security',
          details: {
            endpoint: req.path,
            method: req.method,
            target,
            errors: error.errors
          },
          timestamp: new Date().toISOString()
        });
        
        // Use custom error handler if provided
        if (errorHandler) {
          return errorHandler(error, req, res);
        }
        
        // Default error handling
        res.status(errorStatus).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        // Handle unexpected errors
        console.error('Unexpected validation error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error occurred'
        });
      }
    }
  };
}

/**
 * Creates a combined validation middleware that validates multiple parts of a request
 */
export function validateAll(schemas: Record<ValidationTarget, AnyZodObject>, options?: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targets = Object.keys(schemas) as ValidationTarget[];
    
    for (const target of targets) {
      const schema = schemas[target];
      const middleware = validate(schema, target, options);
      
      // Create a promise that resolves when middleware completes or rejects if it errors
      await new Promise<void>((resolve, reject) => {
        middleware(req, res, (err?: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }).catch((err) => {
        // If any validation fails, the function ends here
        return;
      });
    }
    
    // If all validations pass, continue
    next();
  };
}

/**
 * Creates a validation middleware specifically for API parameters
 */
export function validateParams<T extends AnyZodObject>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'params', options);
}

/**
 * Creates a validation middleware specifically for query parameters
 */
export function validateQuery<T extends AnyZodObject>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'query', options);
}

/**
 * Creates a validation middleware specifically for request bodies
 */
export function validateBody<T extends AnyZodObject>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'body', options);
}

/**
 * Creates a validation middleware specifically for request headers
 */
export function validateHeaders<T extends AnyZodObject>(schema: T, options?: ValidationOptions) {
  return validate(schema, 'headers', options);
}

/**
 * Creates schema for common validation patterns
 */
export const validationPatterns = {
  // User input validation
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  
  // Common parameters validation
  id: z.coerce.number().int().positive(),
  uuid: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  
  // Content validation
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  
  // Pagination validation
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Date validation
  date: z.string().datetime(),
  
  // Upload validation
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
  
  // Security validation
  token: z.string().min(10).max(500),
  csrfToken: z.string().min(20).max(200),
};

/**
 * Creates common schemas that can be reused across routes
 */
export const commonSchemas = {
  // Pagination schema
  pagination: z.object({
    page: validationPatterns.page,
    limit: validationPatterns.limit,
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('asc')
  }),
  
  // User registration schema
  userRegistration: z.object({
    username: validationPatterns.username,
    email: validationPatterns.email,
    password: validationPatterns.password,
    confirmPassword: z.string()
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  // Search schema
  search: z.object({
    query: z.string().min(1).max(100),
    filters: z.record(z.string()).optional(),
    page: validationPatterns.page,
    limit: validationPatterns.limit
  }),
  
  // Secure content schema
  contentSubmission: z.object({
    title: validationPatterns.title,
    content: z.string().min(1).max(50000),
    summary: z.string().max(500).optional(),
    tags: z.array(z.string()).max(10).optional(),
    published: z.boolean().optional().default(false)
  })
};

/**
 * Security validation middleware that checks for common attack patterns
 */
export function securityValidation() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for SQL injection attempts
    const sqlInjectionRegex = /('|"|;|--|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update)/i;
    
    // Check request parameters for SQL injection attempts
    const checkForSQLInjection = (obj: any) => {
      if (!obj) return false;
      
      return Object.values(obj).some(value => {
        if (typeof value === 'string' && sqlInjectionRegex.test(value)) {
          return true;
        }
        if (typeof value === 'object') {
          return checkForSQLInjection(value);
        }
        return false;
      });
    };
    
    // Check body, params, and query for SQL injection attempts
    if (
      checkForSQLInjection(req.body) || 
      checkForSQLInjection(req.params) || 
      checkForSQLInjection(req.query)
    ) {
      logSecurityEvent({
        type: 'sql-injection-attempt',
        category: 'api-security',
        details: {
          endpoint: req.path,
          method: req.method,
          ip: req.ip
        },
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        success: false,
        message: 'Request contains potentially malicious content'
      });
    }
    
    // Additional security checks can be added here
    
    next();
  };
}