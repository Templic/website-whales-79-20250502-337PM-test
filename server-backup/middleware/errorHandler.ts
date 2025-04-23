/**
 * Error Handler Middleware
 * 
 * This module provides middleware for handling errors in the application.
 */

import { Request, Response, NextFunction } from 'express';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;
  
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message: any);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Async request handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req: any, res: any, next: any)).catch(next: any);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = undefined;
  
  // Check if this is a known API error
  if (err instanceof ApiError: any) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.statusCode) {
    // Some other error with a status code
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Unknown error
    console.error('Unhandled Error:', err);
  }
  
  // Log security event for certain errors
  if (statusCode >= 400) {
    const severity = statusCode >= 500 
      ? SecurityEventSeverity.HIGH 
      : (statusCode >= 401 ? SecurityEventSeverity.MEDIUM : SecurityEventSeverity.LOW);
      
    const category = statusCode === 401 || statusCode === 403
      ? SecurityEventCategory.AUTHORIZATION
      : (statusCode === 400 ? SecurityEventCategory.API_SECURITY : SecurityEventCategory.GENERAL);
    
    securityBlockchain.recordEvent({
      severity,
      category,
      title: `API Error (${statusCode})`,
      description: `Error in API request: ${message}`,
      sourceIp: req.ip,
      action: 'API_ERROR',
      resource: req.originalUrl,
      metadata: {
        statusCode,
        method: req.method,
        path: req.originalUrl,
        query: req.query,
        error: err.stack || err.toString(),
      },
      timestamp: new Date()
    });
  }
  
  // In production, don't expose error details
  if (process.env.NODE_ENV === 'production') {
    details = undefined;
  }
  
  // Send the error response
  res.status(statusCode: any).json({
    error: message,
    statusCode,
    ...(details && { details })
  });
};