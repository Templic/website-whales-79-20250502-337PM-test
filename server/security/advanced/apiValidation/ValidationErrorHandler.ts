/**
 * Validation Error Handler Module
 * 
 * Provides comprehensive error handling for validation failures,
 * with support for different error formats, logging levels, and
 * environment-based error detail disclosure.
 */

import { Response } from 'express';
import { z } from 'zod';
// Handle security logging with a fallback mechanism to avoid circular dependencies
function logSecurityEvent(eventData: any): void {
  try {
    // Try to load the security logger dynamically
    const securityLogger = require('../../utils/securityLogger');
    if (typeof securityLogger.logSecurityEvent === 'function') {
      securityLogger.logSecurityEvent(eventData);
      return;
    }
  } catch (error) {
    // Fallback to console logging if the security logger is not available
    console.warn('[SECURITY] Unable to load security logger, using fallback logging mechanism');
  }
  
  // Fallback implementation
  console.log(`[SECURITY] [${eventData.severity || 'info'}] ${eventData.type || 'VALIDATION'}: ${
    typeof eventData.details === 'object' ? JSON.stringify(eventData.details) : eventData.details || ''
  }`);
}

export interface ValidationErrorOptions {
  includeDetails: boolean;
  formatErrors?: boolean;
  statusCode?: number;
  logSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export class ValidationErrorHandler {
  // Default options based on environment
  static readonly DEFAULT_OPTIONS: ValidationErrorOptions = {
    includeDetails: process.env.NODE_ENV !== 'production',
    formatErrors: true,
    statusCode: 400,
    logSeverity: 'medium'
  };

  /**
   * Handle a Zod validation error and send a response
   */
  static handleZodError(
    res: Response,
    error: z.ZodError,
    options: Partial<ValidationErrorOptions> = {}
  ): Response {
    // Merge with default options
    const mergedOptions: ValidationErrorOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };

    // Format validation errors
    const formattedErrors = mergedOptions.formatErrors
      ? this.formatZodErrors(error)
      : error.errors;

    // Log the validation error
    logSecurityEvent({
      type: 'VALIDATION_ERROR',
      severity: mergedOptions.logSeverity,
      details: {
        errors: formattedErrors,
        timestamp: Date.now()
      }
    });

    // Prepare the response payload
    const payload: any = {
      error: 'Validation Error',
      message: 'The request data failed validation',
      timestamp: Date.now()
    };

    // Include detailed errors if configured
    if (mergedOptions.includeDetails) {
      payload.details = formattedErrors;
    }

    // Send the response
    return res.status(mergedOptions.statusCode).json(payload);
  }

  /**
   * Format Zod errors into a more user-friendly structure
   */
  private static formatZodErrors(error: z.ZodError): Array<{
    path: string;
    message: string;
    code: string;
  }> {
    return error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }

  /**
   * Create a validation error response for a custom error
   */
  static handleCustomError(
    res: Response, 
    message: string,
    details?: any,
    options: Partial<ValidationErrorOptions> = {}
  ): Response {
    // Merge with default options
    const mergedOptions: ValidationErrorOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };

    // Log the custom error
    logSecurityEvent({
      type: 'VALIDATION_CUSTOM_ERROR',
      severity: mergedOptions.logSeverity,
      details: {
        message: message,
        details: details,
        timestamp: Date.now()
      }
    });

    // Prepare the response payload
    const payload: any = {
      error: 'Validation Error',
      message: message,
      timestamp: Date.now()
    };

    // Include detailed errors if configured
    if (mergedOptions.includeDetails && details) {
      payload.details = details;
    }

    // Send the response
    return res.status(mergedOptions.statusCode).json(payload);
  }

  /**
   * Handle a batch of validation errors
   */
  static handleBatchErrors(
    res: Response,
    errors: Array<{ field: string; message: string; code?: string }>,
    options: Partial<ValidationErrorOptions> = {}
  ): Response {
    // Merge with default options
    const mergedOptions: ValidationErrorOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };

    // Log the batch errors
    logSecurityEvent({
      type: 'VALIDATION_BATCH_ERRORS',
      severity: mergedOptions.logSeverity,
      details: {
        errors: errors,
        count: errors.length,
        timestamp: Date.now()
      }
    });

    // Prepare the response payload
    const payload: any = {
      error: 'Validation Error',
      message: 'Multiple validation errors occurred',
      timestamp: Date.now()
    };

    // Include detailed errors if configured
    if (mergedOptions.includeDetails) {
      payload.details = errors;
    }

    // Send the response
    return res.status(mergedOptions.statusCode).json(payload);
  }

  /**
   * Create a standard error response object
   */
  static createErrorResponse(
    message: string,
    details?: any,
    includeDetails: boolean = this.DEFAULT_OPTIONS.includeDetails
  ): any {
    const response: any = {
      error: 'Validation Error',
      message: message,
      timestamp: Date.now()
    };

    if (includeDetails && details) {
      response.details = details;
    }

    return response;
  }
}