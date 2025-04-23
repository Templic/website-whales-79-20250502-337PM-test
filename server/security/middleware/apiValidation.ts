/**
 * API Input Validation Middleware
 * 
 * This module provides comprehensive input validation for API requests
 * using Zod schema validation.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';

/**
 * Validation locations in the request
 */
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
  COOKIES = 'cookies'
}

/**
 * Options for validation
 */
export interface ValidationOptions {
  /**
   * Whether to strip unknown properties (defaults to true)
   */
  stripUnknown?: boolean;
  
  /**
   * Whether to abort early on first error (defaults to false)
   */
  abortEarly?: boolean;
  
  /**
   * Custom error messages
   */
  errorMap?: z.ZodErrorMap;
  
  /**
   * Log validation failures as security events (defaults to true)
   */
  logFailures?: boolean;
  
  /**
   * Severity of validation failure log events
   */
  logSeverity?: SecurityEventSeverity;
}

/**
 * Default validation options
 */
const defaultOptions: ValidationOptions = {
  stripUnknown: true,
  abortEarly: false,
  logFailures: true,
  logSeverity: SecurityEventSeverity.MEDIUM
};

/**
 * Creates validation middleware for specified request parts
 * 
 * @param schemas - Object mapping validation targets to Zod schemas
 * @param options - Validation options
 * @returns Express middleware function
 */
export function validateRequest(
  schemas: Partial<Record<ValidationTarget, AnyZodObject>>,
  options: ValidationOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Process each validation target
      for (const [target, schema] of Object.entries(schemas)) {
        const data = req[target as keyof Request];
        
        if (schema && data) {
          // Validate data against schema
          const parsed = await schema.parseAsync(data, {
            errorMap: mergedOptions.errorMap,
            async: true
          });
          
          // Replace request data with validated (and potentially transformed) data
          if (mergedOptions.stripUnknown) {
            req[target as keyof Request] = parsed;
          }
        }
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const formattedErrors = formatZodErrors(error);
        
        // Log validation failure as security event if enabled
        if (mergedOptions.logFailures) {
          logValidationFailure(req, formattedErrors, mergedOptions.logSeverity || SecurityEventSeverity.MEDIUM);
        }
        
        // Send validation error response
        return res.status(400).json({
          status: 'error',
          message: 'Input validation failed',
          errors: formattedErrors
        });
      }
      
      // For other errors, pass to the next error handler
      next(error);
    }
  };
}

/**
 * Create a wrapped validation middleware for common patterns
 * 
 * @param bodySchema - Schema for request body
 * @param querySchema - Schema for query parameters
 * @param paramsSchema - Schema for route parameters
 * @param options - Validation options
 * @returns Express middleware function
 */
export function validate({
  body,
  query,
  params,
  headers,
  cookies,
  options = {}
}: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
  headers?: AnyZodObject;
  cookies?: AnyZodObject;
  options?: ValidationOptions;
}) {
  const schemas: Partial<Record<ValidationTarget, AnyZodObject>> = {};
  
  if (body) schemas[ValidationTarget.BODY] = body;
  if (query) schemas[ValidationTarget.QUERY] = query;
  if (params) schemas[ValidationTarget.PARAMS] = params;
  if (headers) schemas[ValidationTarget.HEADERS] = headers;
  if (cookies) schemas[ValidationTarget.COOKIES] = cookies;
  
  return validateRequest(schemas, options);
}

/**
 * Format Zod validation errors for response
 * 
 * @param error - Zod error object
 * @returns Formatted error messages
 */
function formatZodErrors(error: ZodError) {
  return error.errors.reduce((acc, err) => {
    const path = err.path.join('.');
    acc[path] = err.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Log validation failure as security event
 * 
 * @param req - Express request
 * @param errors - Validation errors
 * @param severity - Security event severity
 */
async function logValidationFailure(
  req: Request,
  errors: Record<string, string>,
  severity: SecurityEventSeverity
) {
  try {
    await securityBlockchain.addSecurityEvent({
      severity,
      category: SecurityEventCategory.INPUT_VALIDATION,
      message: 'API input validation failed',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: {
        method: req.method,
        path: req.path,
        errors,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Error logging validation failure:', error);
  }
}

/**
 * Common validation schemas for reuse
 */
export const CommonValidators = {
  /**
   * ID parameter validation
   */
  id: z.object({
    id: z.string().uuid({ message: 'Invalid ID format' })
  }),
  
  /**
   * Pagination parameters validation
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  }),
  
  /**
   * Date range validation
   */
  dateRange: z.object({
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional()
  }),
  
  /**
   * Email validation
   */
  email: z.object({
    email: z.string().email({ message: 'Invalid email format' })
  }),
  
  /**
   * Search query validation
   */
  search: z.object({
    query: z.string().trim().min(2).max(100)
  })
};