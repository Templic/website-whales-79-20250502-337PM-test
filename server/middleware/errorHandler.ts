/**
 * Error handling middleware for consistent error responses
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../security/security';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Utility to wrap async route handlers for consistent error handling
export const asyncHandler = (fn: Function) => (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const validateQueryParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingParams = requiredParams.filter(param => !req.query[param]);

    if (missingParams.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required query parameters: ${missingParams.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let errorCode = 'server_error';
  let message = 'Internal Server Error';
  let details = undefined;

  // Get original URL and method for logging
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;

  // Use ApiError values if available
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code || getDefaultErrorCode(statusCode);
    message = err.message;
    details = err.details;
  }

  // For development, include stack trace
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  // Log errors 
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  console[logLevel](`[${statusCode}] ${method} ${originalUrl} - ${message}`, 
    stack || '', 
    details || ''
  );

  // Log security event for server errors
  if (statusCode >= 500) {
    logSecurityEvent({
      type: 'ERROR',
      details: `Server error: ${method} ${originalUrl} - ${message}`,
      severity: 'high',
      path: originalUrl,
      method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id,
      metadata: {
        statusCode,
        errorCode,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
      }
    });
  }

  // Return error response
  res.status(statusCode).json({
    error: {
      status: statusCode,
      code: errorCode,
      message,
      details: details,
      ...(process.env.NODE_ENV === 'development' ? { stack } : {})
    }
  });
}

/**
 * 404 handler for routes that don't match
 */
export function notFoundHandler(req: Request, res: Response): void {
  const originalUrl = req.originalUrl || req.url;
  const method = req.method;

  console.warn(`[404] ${method} ${originalUrl} - Route not found`);

  res.status(404).json({
    error: {
      status: 404,
      code: 'not_found',
      message: 'The requested resource was not found'
    }
  });
}

/**
 * Get default error code based on status code
 */
function getDefaultErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'bad_request';
    case 401: return 'unauthorized';
    case 403: return 'forbidden';
    case 404: return 'not_found';
    case 409: return 'conflict';
    case 422: return 'validation_error';
    case 429: return 'too_many_requests';
    case 500: return 'server_error';
    case 503: return 'service_unavailable';
    default: return `error_${statusCode}`;
  }
}

export default {
  ApiError,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  validateQueryParams
};