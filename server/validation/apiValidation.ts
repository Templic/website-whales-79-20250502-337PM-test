/**
 * API Validation Middleware
 * 
 * This module provides enhanced middleware for validating API requests
 * using Zod schemas with detailed error reporting and contextual validation.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import {
  ValidationContext,
  ValidationSeverity,
  zodErrorToValidationError,
  createNormalizedError,
  ErrorCategory
} from '../../shared/validation/validationTypes';

// Request parts that can be validated
export type RequestPart = 'body' | 'query' | 'params' | 'headers' | 'cookies';

// Validation options
export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  detailed?: boolean;
  contextData?: Record<string, any>;
}

// Default validation options
const defaultOptions: ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  logLevel: 'warn',
  detailed: true
};

/**
 * Mask sensitive data before logging
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'api_key', 'key', 
    'auth', 'authorization', 'credit_card', 'creditCard'
  ];
  
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '******';
    }
  }
  
  return masked;
}

/**
 * Log security event
 */
function logSecurityEvent(
  eventType: string, 
  eventData: any, 
  level: 'error' | 'warn' | 'info' | 'log' = 'warn'
): void {
  switch (level) {
    case 'error':
      console.error(`[SECURITY] ${eventType}:`, maskSensitiveData(eventData));
      break;
    case 'warn':
      console.warn(`[SECURITY] ${eventType}:`, maskSensitiveData(eventData));
      break;
    case 'info':
      console.info(`[SECURITY] ${eventType}:`, maskSensitiveData(eventData));
      break;
    case 'log':
      console.log(`[SECURITY] ${eventType}:`, maskSensitiveData(eventData));
      break;
  }
}

/**
 * Validates request data against schemas
 * 
 * @param schemas Schemas for validating different parts of the request
 * @param options Validation options
 */
export function validateRequest(
  schemas: Partial<Record<RequestPart, AnyZodObject>>,
  options: ValidationOptions = defaultOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Process each schema in sequence
    for (const [part, schema] of Object.entries(schemas) as [RequestPart, AnyZodObject][]) {
      try {
        const requestData = req[part];
        
        if (!requestData) {
          return res.status(400).json(
            createNormalizedError(
              `Request ${part} is undefined or null`,
              'INVALID_REQUEST',
              ErrorCategory.VALIDATION,
              400
            )
          );
        }
        
        // Parse the data through the schema
        const validatedData = await schema.parseAsync(requestData);
        
        // If stripUnknown is true, replace the original request part with the validated data
        if (options.stripUnknown) {
          req[part] = validatedData;
        }
      } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
          const validationErrors = zodErrorToValidationError(
            error, 
            ValidationContext.API
          );
          
          // Log the validation failure
          if (options.logLevel !== 'none') {
            const logMessage = `API validation failed for ${req.method} ${req.path} on ${part}`;
            console.warn(logMessage, {
              errors: validationErrors,
              requestData: maskSensitiveData(req[part])
            });
            
            // Log as security event
            logSecurityEvent('API_VALIDATION_FAILURE', {
              method: req.method,
              path: req.path,
              part,
              errors: validationErrors,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              timestamp: new Date()
            });
          }
          
          // Create normalized error response
          const normalizedError = createNormalizedError(
            `Validation failed for ${part}`,
            'VALIDATION_ERROR',
            ErrorCategory.VALIDATION,
            400,
            options.detailed ? validationErrors : undefined
          );
          
          // Send the error response
          return res.status(400).json(normalizedError);
        }
        
        // Handle other errors
        console.error(`Unexpected error during API validation for ${part}:`, { error });
        return next(error);
      }
    }
    
    // If all validations pass, continue
    next();
  };
}

/**
 * Validates request body
 * 
 * @param schema Schema for validating request body
 * @param options Validation options
 */
export function validateBody(
  schema: AnyZodObject,
  options: ValidationOptions = defaultOptions
) {
  return validateRequest({ body: schema }, options);
}

/**
 * Validates query parameters
 * 
 * @param schema Schema for validating query parameters
 * @param options Validation options
 */
export function validateQuery(
  schema: AnyZodObject,
  options: ValidationOptions = defaultOptions
) {
  return validateRequest({ query: schema }, options);
}

/**
 * Validates route parameters
 * 
 * @param schema Schema for validating route parameters
 * @param options Validation options
 */
export function validateParams(
  schema: AnyZodObject,
  options: ValidationOptions = defaultOptions
) {
  return validateRequest({ params: schema }, options);
}

/**
 * Validates multiple parts of a request
 * 
 * @param bodySchema Schema for validating request body
 * @param querySchema Schema for validating query parameters
 * @param paramsSchema Schema for validating route parameters
 * @param options Validation options
 */
export function validateMultiple(
  bodySchema?: AnyZodObject,
  querySchema?: AnyZodObject,
  paramsSchema?: AnyZodObject,
  options: ValidationOptions = defaultOptions
) {
  const schemas: Partial<Record<RequestPart, AnyZodObject>> = {};
  
  if (bodySchema) schemas.body = bodySchema;
  if (querySchema) schemas.query = querySchema;
  if (paramsSchema) schemas.params = paramsSchema;
  
  return validateRequest(schemas, options);
}

/**
 * Validates content-specific data based on content type
 * 
 * @param contentTypeSchemas Map of content types to validation schemas
 * @param options Validation options
 */
export function validateContentType(
  contentTypeSchemas: Record<string, AnyZodObject>,
  options: ValidationOptions = defaultOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || 'application/json';
    
    // Get schema based on content type
    const schema = contentTypeSchemas[contentType];
    
    if (!schema) {
      return res.status(415).json(
        createNormalizedError(
          `Unsupported content type: ${contentType}`,
          'UNSUPPORTED_CONTENT_TYPE',
          ErrorCategory.VALIDATION,
          415
        )
      );
    }
    
    // Apply validation with the selected schema
    return validateBody(schema, options)(req, res, next);
  };
}