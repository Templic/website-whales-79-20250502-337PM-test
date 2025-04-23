/**
 * API Validation Middleware
 * 
 * This middleware validates API requests against Zod schemas to ensure
 * proper input validation and prevent security vulnerabilities.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logSecurityEvent, maskSensitiveData } from '../utils/securityUtils';
import { SecurityLogLevel } from '../types/securityTypes';

// Simple logger for when the main logger is not available
const logger = {
  debug: (message: string, meta?: any) => console.debug(message, meta),
  info: (message: string, meta?: any) => console.info(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  error: (message: string, meta?: any) => console.error(message, meta)
};

/**
 * Type of request parts that can be validated
 */
export type RequestPart = 'body' | 'query' | 'params' | 'headers' | 'cookies';

/**
 * Options for validation middleware
 */
interface ValidationOptions {
  stripUnknown?: boolean;
  abortEarly?: boolean;
  detailed?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'none';
}

/**
 * Default validation options
 */
const defaultOptions: ValidationOptions = {
  stripUnknown: true,
  abortEarly: false,
  detailed: true,
  logLevel: 'warn'
};

/**
 * Middleware to validate a specific part of a request against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param part Request part to validate (body, query, params, headers, cookies)
 * @param options Validation options
 * @returns Express middleware
 */
export function validate(
  schema: AnyZodObject,
  part: RequestPart = 'body',
  options: ValidationOptions = defaultOptions
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the part of the request to validate
      const requestData = req[part];
      
      if (!requestData) {
        return res.status(400).json({
          status: 'error',
          message: `Request ${part} is undefined or null`
        });
      }
      
      // Parse the data through the schema
      const validatedData = await schema.parseAsync(requestData);
      
      // If stripUnknown is true, replace the original request part with the validated data
      if (options.stripUnknown) {
        req[part] = validatedData;
      }
      
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err: string: string => ({
          path: err.path.join('.'),
          code: err.code,
          message: err.message
        }));
        
        // Log the validation failure if logLevel is not 'none'
        if (options.logLevel !== 'none') {
          const logMessage = `API validation failed for ${req.method} ${req.path} on ${part}`;
          
          switch (options.logLevel) {
            case 'error':
              logger.error(logMessage, {
                errors: formattedErrors,
                requestData: maskSensitiveData(req[part])
              });
              break;
            case 'warn':
              logger.warn(logMessage, {
                errors: formattedErrors,
                requestData: maskSensitiveData(req[part])
              });
              break;
            case 'info':
              logger.info(logMessage, {
                errors: formattedErrors,
                requestData: maskSensitiveData(req[part])
              });
              break;
            case 'debug':
              logger.debug(logMessage, {
                errors: formattedErrors,
                requestData: maskSensitiveData(req[part])
              });
              break;
          }
          
          // Log as security event
          logSecurityEvent('API_VALIDATION_FAILURE', {
            method: req.method,
            path: req.path,
            part,
            errors: formattedErrors,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
          }, SecurityLogLevel.WARN);
        }
        
        // Send the validation error response
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: options.detailed ? formattedErrors : undefined
        });
      }
      
      // Handle other errors
      logger.error('Unexpected error during API validation:', { error });
      next(error);
    }
  };
}

/**
 * Middleware to validate multiple parts of a request against multiple schemas
 * 
 * @param schemas Object with schemas for different request parts
 * @param options Validation options
 * @returns Express middleware
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
          return res.status(400).json({
            status: 'error',
            message: `Request ${part} is undefined or null`
          });
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
          const formattedErrors = error.errors.map(err: string: string => ({
            path: err.path.join('.'),
            code: err.code,
            message: err.message
          }));
          
          // Log the validation failure
          if (options.logLevel !== 'none') {
            const logMessage = `API validation failed for ${req.method} ${req.path} on ${part}`;
            logger.warn(logMessage, {
              errors: formattedErrors,
              requestData: maskSensitiveData(req[part])
            });
            
            // Log as security event
            logSecurityEvent('API_VALIDATION_FAILURE', {
              method: req.method,
              path: req.path,
              part,
              errors: formattedErrors,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              timestamp: new Date()
            }, SecurityLogLevel.WARN);
          }
          
          // Send the validation error response
          return res.status(400).json({
            status: 'error',
            message: `Validation failed for ${part}`,
            errors: options.detailed ? formattedErrors : undefined
          });
        }
        
        // Handle other errors
        logger.error(`Unexpected error during API validation for ${part}:`, { error });
        return next(error);
      }
    }
    
    // If all validations pass, continue
    next();
  };
}

/**
 * Middleware to sanitize a request part according to a schema without strict validation
 * 
 * @param schema Zod schema for sanitization
 * @param part Request part to sanitize
 * @returns Express middleware
 */
export function sanitize(schema: AnyZodObject, part: RequestPart = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestData = req[part];
      
      if (!requestData) {
        // Skip sanitization if the data doesn't exist
        return next();
      }
      
      // Use the schema's shape to create a sanitized version
      const sanitizedData = {};
      const schemaShape = schema.shape;
      
      // Only keep fields that are in the schema
      for (const key in schemaShape) {
        if (key in requestData) {
          sanitizedData[key] = requestData[key];
        }
      }
      
      // Replace the original data with the sanitized version
      req[part] = sanitizedData;
      
      next();
    } catch (error) {
      // Log sanitization failures but don't block the request
      logger.warn(`API sanitization failed for ${req.method} ${req.path} on ${part}`, { error });
      next();
    }
  };
}