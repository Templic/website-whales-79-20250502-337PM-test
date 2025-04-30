/**
 * Normalized Error Handler Middleware
 * 
 * This middleware creates standardized error responses across the application
 * with appropriate categorization and consistent format.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { 
  ErrorCategory,
  NormalizedError,
  ValidationError,
  ValidationContext,
  ValidationSeverity,
  createNormalizedError,
  zodErrorToValidationError
} from '../../shared/validation/validationTypes';

// Base application error
export class AppError extends Error {
  statusCode: number;
  code: string;
  category: ErrorCategory;
  details?: Record<string, any>;
  
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'SERVER_ERROR',
    category: ErrorCategory = ErrorCategory.SYSTEM,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.category = category;
    this.details = details;
  }
}

// Validation error class
export class ValidationAppError extends AppError {
  errors: ValidationError[];
  
  constructor(
    message: string,
    errors: ValidationError[],
    statusCode: number = 400,
    code: string = 'VALIDATION_ERROR'
  ) {
    super(message, statusCode, code, ErrorCategory.VALIDATION);
    this.name = 'ValidationAppError';
    this.errors = errors;
  }
}

// Security error class
export class SecurityAppError extends AppError {
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  constructor(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    statusCode: number = 403,
    code: string = 'SECURITY_ERROR'
  ) {
    super(message, statusCode, code, ErrorCategory.SECURITY);
    this.name = 'SecurityAppError';
    this.severity = severity;
  }
}

// Business rule error
export class BusinessRuleAppError extends AppError {
  constructor(
    message: string,
    statusCode: number = 422,
    code: string = 'BUSINESS_RULE_ERROR'
  ) {
    super(message, statusCode, code, ErrorCategory.BUSINESS_RULE);
    this.name = 'BusinessRuleAppError';
  }
}

/**
 * Get appropriate status code for error
 */
function getStatusCode(error: any): number {
  // Use status code from the error if available
  if (error.statusCode) {
    return error.statusCode;
  }
  
  // Map error categories or types to status codes
  if (error instanceof ZodError) {
    return 400; // Bad Request for validation errors
  }
  
  // Use error specific properties
  if (error.code) {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 400; // Bad Request
      case 'UNAUTHORIZED':
        return 401; // Unauthorized
      case 'FORBIDDEN':
        return 403; // Forbidden
      case 'NOT_FOUND':
        return 404; // Not Found
      case 'METHOD_NOT_ALLOWED':
        return 405; // Method Not Allowed
      case 'CONFLICT':
        return 409; // Conflict
      case 'UNPROCESSABLE_ENTITY':
        return 422; // Unprocessable Entity
      case 'RATE_LIMIT_EXCEEDED':
        return 429; // Too Many Requests
      case 'SERVER_ERROR':
        return 500; // Internal Server Error
      case 'NOT_IMPLEMENTED':
        return 501; // Not Implemented
      case 'BAD_GATEWAY':
        return 502; // Bad Gateway
      case 'SERVICE_UNAVAILABLE':
        return 503; // Service Unavailable
      default:
        if (error.code.startsWith('DB_')) {
          return 500; // Database errors are server errors
        }
    }
  }
  
  // Default to 500 Internal Server Error
  return 500;
}

/**
 * Get appropriate error category
 */
function getErrorCategory(error: any): ErrorCategory {
  // Use category from the error if available
  if (error.category) {
    return error.category;
  }
  
  // Determine category based on error type
  if (error instanceof ZodError) {
    return ErrorCategory.VALIDATION;
  }
  
  if (error instanceof TypeError || error instanceof SyntaxError) {
    return ErrorCategory.SYSTEM;
  }
  
  if (error.code) {
    if (error.code.startsWith('DB_')) {
      return ErrorCategory.DATABASE;
    }
    if (error.code.includes('SECURITY') || 
        error.code.includes('AUTH') || 
        error.code.includes('PERMISSION')) {
      return ErrorCategory.SECURITY;
    }
    if (error.code.includes('NETWORK') || 
        error.code.includes('CONNECTION')) {
      return ErrorCategory.NETWORK;
    }
    if (error.code.includes('VALIDATION') || 
        error.code.includes('INVALID')) {
      return ErrorCategory.VALIDATION;
    }
    if (error.code.includes('BUSINESS') || 
        error.code.includes('RULE')) {
      return ErrorCategory.BUSINESS_RULE;
    }
  }
  
  // Default to system error
  return ErrorCategory.UNKNOWN;
}

/**
 * Get normalized error code
 */
function getErrorCode(error: any): string {
  // Use code from the error if available
  if (error.code) {
    return error.code;
  }
  
  // Determine code based on error name or type
  if (error instanceof ZodError) {
    return 'VALIDATION_ERROR';
  }
  
  if (error.name) {
    return `ERROR_${error.name.toUpperCase()}`;
  }
  
  // Default unknown error
  return 'UNKNOWN_ERROR';
}

/**
 * Create a normalized error from any error
 */
export function normalizeError(
  error: any, 
  req?: Request
): NormalizedError {
  // Get status code, category, and code
  const statusCode = getStatusCode(error);
  const category = getErrorCategory(error);
  const code = getErrorCode(error);
  
  // Extract validation errors if any
  let validationErrors: ValidationError[] | undefined;
  
  if (error instanceof ValidationAppError) {
    validationErrors = error.errors;
  } else if (error instanceof ZodError) {
    validationErrors = zodErrorToValidationError(
      error, 
      ValidationContext.API
    );
  } else if (error.errors && Array.isArray(error.errors)) {
    // Handle errors array if it exists
    validationErrors = error.errors.map((err: any) => ({
      field: err.field || err.path || 'unknown',
      message: err.message || 'Validation error',
      code: err.code || 'VALIDATION_ERROR',
      severity: err.severity || ValidationSeverity.ERROR,
      context: err.context || ValidationContext.API,
      path: err.path ? (Array.isArray(err.path) ? err.path : [err.path]) : undefined,
      value: err.value
    }));
  }
  
  // Create normalized error
  const normalizedError: NormalizedError = {
    message: error.message || 'An error occurred',
    code,
    category,
    statusCode,
    path: req ? req.path : undefined,
    timestamp: Date.now(),
    correlationId: req?.headers['x-correlation-id'] as string || `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    errors: validationErrors
  };
  
  // Add stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    normalizedError.stack = error.stack;
  }
  
  return normalizedError;
}

/**
 * Normalized error handler middleware
 */
export function errorHandler(
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Normalize the error
  const normalizedError = normalizeError(error, req);
  
  // Log the error
  console.error(
    `[ERROR] [${normalizedError.category}] ${normalizedError.code}:`,
    {
      message: normalizedError.message,
      path: req.path,
      method: req.method,
      statusCode: normalizedError.statusCode,
      correlationId: normalizedError.correlationId,
      stack: process.env.NODE_ENV === 'development' ? normalizedError.stack : undefined
    }
  );
  
  // Send the response
  res.status(normalizedError.statusCode).json(normalizedError);
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Create normalized error for not found
  const normalizedError = createNormalizedError(
    `Resource not found: ${req.path}`,
    'NOT_FOUND',
    ErrorCategory.SYSTEM,
    404
  );
  
  // Add request path
  normalizedError.path = req.path;
  
  // Send response
  res.status(404).json(normalizedError);
}