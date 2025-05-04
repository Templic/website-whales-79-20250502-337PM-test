/**
 * Validation Pipeline Middleware
 * 
 * This middleware integrates the ValidationPipeline into Express applications,
 * providing a centralized way to validate requests using both schema validation
 * and AI-powered security analysis.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validationPipeline, ValidationOptions } from '../security/advanced/validation/ValidationPipeline';
import secureLogger from '../security/utils/secureLogger'; // Fixed import

/**
 * Create a validation middleware using the validation pipeline
 */
export function createValidationMiddleware(
  schema: z.ZodType<any>,
  options: ValidationOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Determine what data to validate based on request method
      const data = ['GET', 'HEAD'].includes(req.method) ? req.query : req.body;
      
      // Run the validation pipeline
      const result = await validationPipeline.validate(req, data, schema, options);
      
      if (result.valid) {
        // Store validated data and validation metadata
        req.validatedData = result.validatedData;
        req.validationResult = result;
        
        // Log any warnings even if validation passed
        if (result.warnings && result.warnings.length > 0) {
          secureLogger.warn('Validation warnings', {
            validationId: result.validationId,
            warnings: result.warnings,
            url: req.url,
            method: req.method,
            ip: req.ip
          });
        }
        
        next();
      } else {
        // Handle validation failure
        const statusCode = 400; // Bad Request
        
        // Create a sanitized error response (don't expose internal details)
        const errorResponse = {
          success: false,
          message: 'Validation failed',
          errors: result.errors?.map(err => ({
            message: err.message,
            path: err.path,
            code: err.code
          })) || ['Invalid request data']
        };
        
        // Send validation error response
        res.status(statusCode).json(errorResponse);
      }
    } catch (error) {
      // Handle unexpected errors
      secureLogger.error('Validation middleware error', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const errorResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Could not process request due to a validation system error'
      };
      
      res.status(500).json(errorResponse);
    }
  };
}

/**
 * Create an AI-focused validation middleware
 * This middleware uses AI validation without requiring a schema
 */
export function createAIValidationMiddleware(options: ValidationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Default to API content type if not specified
      const validationOptions: ValidationOptions = {
        contentType: 'api',
        detailedAnalysis: true,
        ...options
      };
      
      // Determine what data to validate based on request method
      const data = ['GET', 'HEAD'].includes(req.method) ? req.query : req.body;
      
      // Run the validation pipeline without a schema
      const result = await validationPipeline.validate(req, data, undefined, validationOptions);
      
      if (result.valid) {
        // Store validation metadata
        req.validationResult = result;
        
        // Log any warnings even if validation passed
        if (result.warnings && result.warnings.length > 0) {
          secureLogger.warn('AI Validation warnings', {
            validationId: result.validationId,
            warnings: result.warnings,
            url: req.url,
            method: req.method,
            ip: req.ip
          });
          
          // Optionally add warnings to the response headers
          res.set('X-Validation-Warning-Count', String(result.warnings.length));
        }
        
        next();
      } else {
        // Handle validation failure
        const statusCode = 400; // Bad Request
        
        // Create a sanitized error response
        const errorResponse = {
          success: false,
          message: 'AI security validation failed',
          errors: result.errors?.map(err => ({
            message: err.message,
            type: err.type,
            severity: err.severity
          })) || ['Potential security risk detected']
        };
        
        // Send validation error response
        res.status(statusCode).json(errorResponse);
      }
    } catch (error) {
      // Handle unexpected errors
      secureLogger.error('AI validation middleware error', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const errorResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Could not process request due to an AI validation system error'
      };
      
      res.status(500).json(errorResponse);
    }
  };
}

/**
 * Middleware for database operation validation
 * This middleware specifically targets SQL queries and database operations
 */
export function createDatabaseValidationMiddleware(options: ValidationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Default to database content type
      const validationOptions: ValidationOptions = {
        contentType: 'database',
        detailedAnalysis: true,
        ...options
      };
      
      // Determine what data to validate (this would be database queries or operations)
      const data = ['GET', 'HEAD'].includes(req.method) ? req.query : req.body;
      
      // Run the validation pipeline
      const result = await validationPipeline.validate(req, data, undefined, validationOptions);
      
      if (result.valid) {
        // Store validation metadata
        req.validationResult = result;
        next();
      } else {
        // Handle validation failure
        const statusCode = 400;
        
        // Create a sanitized error response
        const errorResponse = {
          success: false,
          message: 'Database operation validation failed',
          errors: result.errors?.map(err => ({
            message: err.message,
            type: err.type,
            severity: err.severity
          })) || ['Potential database security risk detected']
        };
        
        // Send validation error response
        res.status(statusCode).json(errorResponse);
      }
    } catch (error) {
      // Handle unexpected errors
      secureLogger.error('Database validation middleware error', {
        url: req.url,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const errorResponse = {
        success: false,
        message: 'Internal validation error',
        error: 'Could not process request due to a database validation system error'
      };
      
      res.status(500).json(errorResponse);
    }
  };
}

/**
 * Global error handler for validation errors
 * This middleware should be added after all routes
 */
export function validationErrorHandler(
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // If this is not a validation error, pass it to the next error handler
  if (!err || !err.isValidationError) {
    return next(err);
  }
  
  // Log the validation error
  secureLogger.error('Unhandled validation error', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    errors: err.errors
  });
  
  // Create an appropriate error response
  const errorResponse = {
    success: false,
    message: err.message || 'Validation error',
    errors: err.errors?.map((e: any) => ({
      message: e.message,
      path: e.path,
      code: e.code
    })) || ['Invalid request data']
  };
  
  // Send a 400 Bad Request response
  res.status(400).json(errorResponse);
}

// Add type augmentation for the Request object
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      validationResult?: any;
    }
  }
}