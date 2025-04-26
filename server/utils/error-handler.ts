/**
 * Error Handler Utility
 * 
 * Provides standardized error handling functions for use throughout the application.
 * These utilities ensure consistent error handling, proper type safety, and
 * detailed logging.
 */

import { 
  BaseError, 
  SecurityError, 
  ValidationError, 
  DatabaseError,
  ApiError,
  AuthError,
  RateLimitError
} from '../types/core/error-types';

// Import for security logging if available
let securityLogger: any;
try {
  // Dynamic import to avoid circular dependencies
  const { logSecurityEvent } = require('../security/utils/securityLogger');
  securityLogger = { logSecurityEvent };
} catch (err) {
  // Fallback if security logger isn't available
  securityLogger = {
    logSecurityEvent: (type: string, data: any) => {
      console.warn(`[Security Event: ${type}]`, data);
    }
  };
}

/**
 * Environment-aware error logger that sanitizes sensitive information
 */
function logError(error: unknown, context: Record<string, unknown> = {}): void {
  // Sanitize context to avoid logging sensitive information
  const sanitizedContext = { ...context };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  for (const field of sensitiveFields) {
    if (field in sanitizedContext) {
      sanitizedContext[field] = '[REDACTED]';
    }
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    console.error(`[ERROR] ${error.name}: ${error.message}`, {
      stack: error.stack,
      ...sanitizedContext
    });
    return;
  }
  
  // Handle unknown errors
  console.error('[ERROR] Unknown error:', error, sanitizedContext);
}

/**
 * Safely converts unknown errors to typed errors
 * 
 * @param error - The error to convert
 * @param defaultMessage - Default message if error is not an Error object
 * @returns BaseError with consistent structure
 */
export function handleError(
  error: unknown, 
  defaultMessage = 'An unexpected error occurred'
): BaseError {
  // Handle Error instance by converting to BaseError
  if (error instanceof Error) {
    // Extract standard Error properties
    const { name, message, stack } = error;
    
    // Create a properly formed BaseError
    const baseError: BaseError = {
      name,
      message,
      stack,
      code: (error as any).code || 'ERR_UNKNOWN',
      statusCode: (error as any).statusCode || 500,
      timestamp: (error as any).timestamp || Date.now()
    };
    
    return baseError;
  }
  
  // Create a new error for non-Error objects
  return {
    name: 'UnknownError',
    message: typeof error === 'string' 
      ? error 
      : defaultMessage,
    code: 'ERR_UNKNOWN',
    statusCode: 500,
    timestamp: Date.now(),
    stack: new Error().stack
  } as BaseError;
}

/**
 * Handles security-related errors
 * 
 * @param error - The error to convert
 * @param severity - Security severity level
 * @returns SecurityError with added security context
 */
export function handleSecurityError(
  error: unknown, 
  severity: SecurityError['severity'] = 'medium',
  context: Record<string, unknown> = {}
): SecurityError {
  const baseError = handleError(error);
  
  // Log security event
  securityLogger.logSecurityEvent('SECURITY_ERROR', {
    errorName: baseError.name,
    errorMessage: baseError.message,
    severity,
    context
  });
  
  return {
    ...baseError,
    severity,
    name: 'SecurityError',
    code: baseError.code || 'SECURITY_ERROR',
    context: {
      userId: context.userId,
      ipAddress: context.ipAddress || context.ip,
      userAgent: context.userAgent,
      endpoint: (context.endpoint || context.path || '').toString()
    }
  } as SecurityError;
}

/**
 * Handles validation errors
 * 
 * @param error - The error to convert
 * @param fieldErrors - Field-specific validation errors
 * @returns ValidationError with field error details
 */
export function handleValidationError(
  error: unknown,
  fieldErrors?: Record<string, string>
): ValidationError {
  const baseError = handleError(error);
  
  return {
    ...baseError,
    name: 'ValidationError',
    code: baseError.code || 'VALIDATION_ERROR',
    statusCode: 400,
    fieldErrors: fieldErrors || {}
  } as ValidationError;
}

/**
 * Handles database errors
 * 
 * @param error - The error to convert
 * @param operation - Database operation type
 * @param query - The query that caused the error
 * @returns DatabaseError with database context
 */
export function handleDatabaseError(
  error: unknown,
  operation?: DatabaseError['operation'],
  query?: string,
  params?: unknown[]
): DatabaseError {
  const baseError = handleError(error);
  
  // Check for common Postgres error codes
  let dbErrorCode: string | number | undefined;
  if (error && typeof error === 'object' && 'code' in error) {
    dbErrorCode = (error as any).code;
  }
  
  const dbError: DatabaseError = {
    ...baseError,
    name: 'DatabaseError',
    code: baseError.code || 'DATABASE_ERROR',
    statusCode: 500,
    operation,
    query,
    params,
    dbErrorCode
  };
  
  // Log database error
  logError(error, { 
    operation, 
    query: query ? `${query.substring(0, 100)}${query.length > 100 ? '...' : ''}` : undefined,
    dbErrorCode 
  });
  
  return dbError;
}

/**
 * Handles API errors
 * 
 * @param error - The error to convert
 * @param endpoint - The API endpoint that raised the error
 * @param method - HTTP method used in the request
 * @returns ApiError with API context
 */
export function handleApiError(
  error: unknown,
  endpoint?: string,
  method?: string,
  requestData?: unknown
): ApiError {
  const baseError = handleError(error);
  
  return {
    ...baseError,
    name: 'ApiError',
    code: baseError.code || 'API_ERROR',
    endpoint,
    method,
    requestData
  } as ApiError;
}

/**
 * Handles authentication errors
 * 
 * @param error - The error to convert
 * @param authErrorType - The type of auth error
 * @param context - Additional context
 * @returns AuthError with authentication context
 */
export function handleAuthError(
  error: unknown,
  authErrorType: AuthError['authErrorType'] = 'unauthorized',
  context: Record<string, unknown> = {}
): AuthError {
  const securityError = handleSecurityError(error, 'high', context);
  
  // Determine appropriate status code
  let statusCode = 401;
  if (authErrorType === 'forbidden') statusCode = 403;
  if (authErrorType === 'invalid_token' || authErrorType === 'expired_token') statusCode = 401;
  
  return {
    ...securityError,
    name: 'AuthError',
    code: securityError.code || 'AUTH_ERROR',
    statusCode,
    authErrorType,
    requiredPermission: context.requiredPermission
  } as AuthError;
}

/**
 * Creates a standardized error response object
 * 
 * @param success - Whether the operation was successful
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param errorCode - Application-specific error code
 * @param data - Optional data to include
 * @returns Standardized error response object
 */
export function createErrorResponse(
  message: string,
  statusCode = 500,
  errorCode?: string | number,
  data?: any
): Record<string, unknown> {
  return {
    success: false,
    error: {
      message,
      code: errorCode || 'ERROR',
      statusCode
    },
    data,
    timestamp: Date.now()
  };
}

/**
 * Standard catch block wrapper with typed error handling
 * 
 * @param fn - Async function to execute
 * @param errorHandler - Custom error handler
 * @returns Promise that handles errors consistently
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: BaseError) => BaseError | Promise<BaseError>
): Promise<T> {
  return fn().catch(async (error: unknown) => {
    // Convert to BaseError
    let typedError = handleError(error);
    
    // Apply custom error handler if provided
    if (errorHandler) {
      typedError = await errorHandler(typedError);
    }
    
    // Log the error
    logError(typedError);
    
    // Rethrow with proper type
    throw typedError;
  });
}

/**
 * Express error handler middleware factory
 * 
 * @param options - Options for the error handler
 * @returns Express error handler middleware
 */
export function createErrorHandlerMiddleware(options: {
  logErrors?: boolean;
  exposeErrors?: boolean;
  defaultMessage?: string;
} = {}) {
  const {
    logErrors = true,
    exposeErrors = process.env.NODE_ENV !== 'production',
    defaultMessage = 'An unexpected error occurred'
  } = options;
  
  return (err: any, req: any, res: any, next: any) => {
    // Convert to BaseError
    const error = handleError(err, defaultMessage);
    
    // Log error if enabled
    if (logErrors) {
      logError(error, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
      });
    }
    
    // Don't expose sensitive details in production
    const responseError = exposeErrors
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          stack: error.stack
        }
      : {
          message: defaultMessage,
          code: error.code
        };
    
    // Send error response
    res.status(error.statusCode || 500).json({
      success: false,
      error: responseError,
      timestamp: Date.now()
    });
  };
}

export default {
  handleError,
  handleSecurityError,
  handleValidationError,
  handleDatabaseError,
  handleApiError,
  handleAuthError,
  createErrorResponse,
  withErrorHandling,
  createErrorHandlerMiddleware
};