/**
 * API Validation Middleware
 * 
 * This middleware provides robust validation for API requests using Zod schemas.
 * It validates request parameters, query strings, and body data.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../../utils/logger';
import { logSecurityEvent } from '../utils/securityUtils';

/**
 * Type for validation locations in a request
 */
type ValidationTarget = 'params' | 'query' | 'body' | 'headers' | 'cookies';

/**
 * Configuration for validation middleware
 */
interface ValidationConfig {
  sanitize?: boolean;
  abortEarly?: boolean;
  logViolations?: boolean;
  strictMode?: boolean;
}

/**
 * Default validation configuration
 */
const defaultValidationConfig: ValidationConfig = {
  sanitize: true,      // Sanitize inputs when possible
  abortEarly: false,   // Return all validation errors, not just the first one
  logViolations: true, // Log validation violations
  strictMode: true     // Reject requests with unexpected properties
};

/**
 * Creates validation middleware for a specific part of the request
 * 
 * @param schema Zod schema to validate against
 * @param target Part of request to validate ('params', 'query', 'body', etc.)
 * @param config Validation configuration options
 * @returns Express middleware function
 */
export function validate(
  schema: AnyZodObject,
  target: ValidationTarget = 'body',
  config: ValidationConfig = defaultValidationConfig
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate from the request
      const dataToValidate = req[target];
      
      // Skip validation if the target doesn't exist and we're validating body/params/query
      // Headers and cookies always exist, so we'll validate empty objects
      if (!dataToValidate && !['headers', 'cookies'].includes(target)) {
        if (config.strictMode) {
          return res.status(400).json({
            status: 'error',
            message: `Missing ${target} data to validate`,
            error: 'VALIDATION_ERROR',
            code: 'MISSING_DATA'
          });
        } else {
          return next();
        }
      }
      
      // Parse and validate the data
      const validData = await schema.parseAsync(dataToValidate);
      
      // If sanitization is enabled, replace the original data with the sanitized version
      if (config.sanitize) {
        req[target] = validData;
      }
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        // Log the validation error if configured to do so
        if (config.logViolations) {
          const validationErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }));
          
          logger.warn(`Validation error for ${req.method} ${req.path} on ${target}`, {
            validationErrors,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
          
          // Log as security event
          logSecurityEvent('API_VALIDATION_FAILURE', {
            ip: req.ip,
            method: req.method,
            path: req.path,
            target,
            errors: validationErrors,
            timestamp: new Date()
          });
        }
        
        // Send formatted validation error response
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          error: 'VALIDATION_ERROR',
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }))
        });
      }
      
      // Handle unexpected errors
      logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during request validation'
      });
    }
  };
}

/**
 * Combined validator that can validate multiple parts of a request at once
 * 
 * @param validators Object mapping request parts to schemas
 * @param config Validation configuration
 * @returns Express middleware function
 */
export function validateRequest(
  validators: Partial<Record<ValidationTarget, AnyZodObject>>,
  config: ValidationConfig = defaultValidationConfig
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create a deep copy of the request to prevent mutation during validation
      const reqCopy = JSON.parse(JSON.stringify({
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
        cookies: req.cookies
      }));
      
      // Validate each part of the request
      for (const [target, schema] of Object.entries(validators) as [ValidationTarget, AnyZodObject][]) {
        const dataToValidate = reqCopy[target];
        
        // Skip if no data and we're not in strict mode
        if (!dataToValidate && !config.strictMode) {
          continue;
        }
        
        // Validate the data
        const validData = await schema.parseAsync(dataToValidate);
        
        // Update the request with validated data if sanitization is enabled
        if (config.sanitize) {
          req[target] = validData;
        }
      }
      
      next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        if (config.logViolations) {
          const validationErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }));
          
          logger.warn(`Combined validation error for ${req.method} ${req.path}`, {
            validationErrors,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
          
          // Log as security event
          logSecurityEvent('API_VALIDATION_FAILURE', {
            ip: req.ip,
            method: req.method,
            path: req.path,
            errors: validationErrors,
            timestamp: new Date()
          });
        }
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          error: 'VALIDATION_ERROR',
          validationErrors: error.errors.map(err => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }))
        });
      }
      
      // Handle unexpected errors
      logger.error('Unexpected validation error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during request validation'
      });
    }
  };
}

/**
 * Sanitizes request data based on schemas without performing validation
 * Useful for non-critical endpoints where you want to clean data but not block requests
 * 
 * @param schema Schema to use for sanitization
 * @param target Part of request to sanitize
 * @returns Express middleware function
 */
export function sanitize(schema: AnyZodObject, target: ValidationTarget = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToSanitize = req[target];
      
      if (!dataToSanitize) {
        return next();
      }
      
      // Attempt to sanitize with the schema (but don't throw on errors)
      const result = await schema.safeParseAsync(dataToSanitize);
      
      if (result.success) {
        // Replace the original data with the sanitized version
        req[target] = result.data;
      }
      
      // Continue regardless of validation result
      next();
    } catch (error) {
      // Just log the error and continue
      logger.debug('Error during request sanitization', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method
      });
      
      next();
    }
  };
}