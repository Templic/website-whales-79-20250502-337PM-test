/**
 * Validation Middleware
 * 
 * This module provides Express middleware for integrating the validation pipeline
 * into API routes, enabling automatic validation of requests.
 */

import { Request, Response, NextFunction } from 'express';
import secureLogger from '../../utils/secureLogger';
import { ValidationPipeline, validationPipeline, ValidationContext } from '../validation/ValidationPipeline';
import { ValidationErrorCategory, ValidationErrorSeverity } from '../error/ValidationErrorCategory';
import { validationAlertSystem, AlertType } from '../notification/ValidationAlertSystem';

// Configure component name for logging
const logComponent = 'ValidationMiddleware';

/**
 * Options for validation middleware
 */
export interface ValidationMiddlewareOptions {
  // Whether to continue with the request if validation fails
  continueOnError?: boolean;
  
  // Status code to return on validation failure
  errorStatusCode?: number;
  
  // Whether to include validation error details in the response
  includeErrorDetails?: boolean;
  
  // Whether to skip validation in development mode
  skipInDevelopment?: boolean;
  
  // Custom error formatter
  errorFormatter?: (errors: any[]) => any;
  
  // Additional context metadata
  contextMetadata?: Record<string, any> | ((req: Request) => Record<string, any>);
}

/**
 * Default middleware options
 */
const defaultOptions: ValidationMiddlewareOptions = {
  continueOnError: false,
  errorStatusCode: 400,
  includeErrorDetails: process.env.NODE_ENV !== 'production',
  skipInDevelopment: false,
  errorFormatter: undefined,
  contextMetadata: undefined
};

/**
 * Create validation middleware for a specific rule
 */
export function createValidationMiddleware(
  ruleId: string,
  target: 'body' | 'query' | 'params' | 'headers',
  options?: ValidationMiddlewareOptions
) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip validation in development if configured
    if (mergedOptions.skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }
    
    try {
      // Create validation context
      const contextMetadata = typeof mergedOptions.contextMetadata === 'function'
        ? mergedOptions.contextMetadata(req)
        : mergedOptions.contextMetadata;
      
      const context = ValidationPipeline.createContextFromRequest(req, target, contextMetadata);
      
      // Get data to validate based on target
      const data = req[target];
      
      // Perform validation
      const result = await validationPipeline.validate(ruleId, data, context);
      
      // Handle validation result
      if (result.success) {
        // Update request data with validated data
        req[target] = result.data;
        return next();
      } else {
        // Log validation failure
        secureLogger('warn', logComponent, `Validation failed for ${req.method} ${req.path}`, {
          metadata: {
            ruleId,
            target,
            errors: result.errors,
            requestPath: req.path,
            requestMethod: req.method,
            requestId: context.requestId
          }
        });
        
        // Send alert for validation failure if there are critical errors
        const hasCriticalErrors = result.errors?.some(e => 
          e.severity === ValidationErrorSeverity.CRITICAL || 
          e.severity === ValidationErrorSeverity.HIGH
        );
        
        if (hasCriticalErrors) {
          validationAlertSystem.sendAlert(
            AlertType.VALIDATION_FAILURE,
            `Critical validation failure for ${req.method} ${req.path}`,
            {
              ruleId,
              target,
              errors: result.errors,
              requestPath: req.path,
              requestMethod: req.method,
              requestId: context.requestId
            }
          );
        }
        
        // Prepare error response
        const errorResponse: any = {
          success: false,
          message: 'Validation failed',
          errors: mergedOptions.includeErrorDetails
            ? (mergedOptions.errorFormatter 
                ? mergedOptions.errorFormatter(result.errors || [])
                : result.errors?.map(e => ({
                    message: e.message,
                    path: e.path,
                    severity: e.severity
                  })))
            : undefined
        };
        
        // Send error response or continue
        if (mergedOptions.continueOnError) {
          // Store validation errors in request for later use
          (req as any).validationErrors = result.errors;
          return next();
        } else {
          return res.status(mergedOptions.errorStatusCode || 400).json(errorResponse);
        }
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      secureLogger('error', logComponent, `Validation middleware error: ${errorMessage}`, {
        metadata: {
          ruleId,
          target,
          requestPath: req.path,
          requestMethod: req.method,
          error: errorMessage
        }
      });
      
      // Continue or send error response
      if (mergedOptions.continueOnError) {
        (req as any).validationError = {
          message: errorMessage,
          type: ValidationErrorCategory.SYSTEM_DEPENDENCY,
          severity: ValidationErrorSeverity.HIGH
        };
        return next();
      } else {
        return res.status(500).json({
          success: false,
          message: 'Validation system error',
          error: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
        });
      }
    }
  };
}

/**
 * Create validation middleware for a specific rule with typed result
 */
export function createTypedValidationMiddleware<T>(
  ruleId: string,
  target: 'body' | 'query' | 'params' | 'headers',
  options?: ValidationMiddlewareOptions
) {
  return createValidationMiddleware(ruleId, target, options) as 
    (req: Request & { [K in typeof target]: T }, res: Response, next: NextFunction) => Promise<void>;
}

/**
 * Middleware to skip validation in certain conditions
 * 
 * This is useful for excluding certain routes from validation,
 * or implementing conditional validation logic.
 */
export function skipValidation(
  condition: boolean | ((req: Request) => boolean | Promise<boolean>)
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Evaluate condition
      const shouldSkip = typeof condition === 'function'
        ? await condition(req)
        : condition;
      
      // Set skip flag if condition is met
      if (shouldSkip) {
        (req as any).__skipValidation = true;
        secureLogger('info', logComponent, `Validation skipped for ${req.method} ${req.path}`, {
          metadata: {
            requestPath: req.path,
            requestMethod: req.method
          }
        });
      }
      
      next();
    } catch (error) {
      // If condition evaluation fails, continue without skipping
      secureLogger('error', logComponent, `Skip validation condition error: ${error instanceof Error ? error.message : String(error)}`, {
        metadata: {
          requestPath: req.path,
          requestMethod: req.method
        }
      });
      next();
    }
  };
}

/**
 * Middleware to check for validation skip flag
 */
export function checkValidationSkip() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if ((req as any).__skipValidation) {
      secureLogger('debug', logComponent, `Validation skip detected for ${req.method} ${req.path}`);
      next('route'); // Skip to the next route handler
    } else {
      next(); // Continue to validation
    }
  };
}