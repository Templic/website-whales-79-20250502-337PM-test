/**
 * Global error handling middleware
 * 
 * Provides centralized error handling with structured responses,
 * logging, and different behaviors based on error types and environment.
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from '../security/security';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error log file path
const ERROR_LOG_FILE = path.join(__dirname, '../../logs/error/error.log');

// Create error log directory if it doesn't exist
const errorLogDir = path.dirname(ERROR_LOG_FILE);
if (!fs.existsSync(errorLogDir)) {
  fs.mkdirSync(errorLogDir, { recursive: true });
}

// Custom error types
export class APIError extends Error {
  statusCode: number;
  code?: string;
  data?: any;
  
  constructor(message: string, statusCode = 500, code?: string, data?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    
    // Maintains proper stack trace for debugging (Node v8+)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends APIError {
  constructor(message: string, errors: any) {
    super(message, 400, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

// Log error to file
const logError = (err: any, req: Request) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      name: err.name || 'Error',
      message: err.message,
      statusCode: err.statusCode || 500,
      code: err.code,
      stack: err.stack,
      request: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type']
        },
        ip: req.ip,
        userId: req.session?.user?.id
      }
    };
    
    const logLine = `[ERROR] ${timestamp} - ${JSON.stringify(logEntry)}\n`;
    fs.appendFileSync(ERROR_LOG_FILE, logLine);
    
    // For security-related errors, also log to security events
    if (err.statusCode === 401 || err.statusCode === 403 || 
        err.name === 'UnauthorizedError' || err.name === 'ForbiddenError' ||
        err.code === 'EBADCSRFTOKEN') {
      logSecurityEvent({
        type: 'API_ERROR',
        details: err.message,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.url,
        method: req.method,
        userId: req.session?.user?.id,
        userRole: req.session?.user?.role,
        severity: 'high'
      });
    }
  } catch (logError) {
    console.error('Error logging to file:', logError);
  }
};

// Global error handler middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  console.error(`${err.name || 'Error'}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Log to file
  logError(err, req);
  
  // Set default values for status and message
  const statusCode = err.statusCode || err.status || 500;
  
  // Format the error response based on environment
  const isDev = process.env.NODE_ENV !== 'production';
  const response: any = {
    success: false,
    message: err.message || 'Internal Server Error'
  };
  
  // Add error code if available
  if (err.code) {
    response.code = err.code;
  }
  
  // Include error details if available
  if (err.data) {
    response.data = err.data;
  }
  
  // Include stack trace only in development
  if (isDev && err.stack) {
    response.stack = err.stack.split('\n').map((line: string) => line.trim());
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    response.errors = err.data?.errors || [];
  } else if (err.name === 'UnauthorizedError') {
    // No additional details needed
  } else if (err.name === 'ForbiddenError') {
    // No additional details needed
  } else if (err.name === 'NotFoundError') {
    // No additional details needed
  } else if (err.name === 'RateLimitError') {
    if (err.data?.retryAfter) {
      res.set('Retry-After', String(err.data.retryAfter));
    }
  } else if (err.code === 'EBADCSRFTOKEN') {
    response.message = 'Invalid CSRF token. Please refresh the page and try again.';
    response.code = 'CSRF_ERROR';
  }
  
  // Send the response
  res.status(statusCode).json(response);
};

// Middleware to handle 404 errors for routes that don't exist
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  // Skip for non-API routes (let client routing handle it)
  if (!req.path.startsWith('/api')) {
    return next();
  }
  
  const err = new NotFoundError(`Endpoint not found: ${req.method} ${req.path}`);
  next(err);
};

// Async error handler wrapper for route handlers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};