/**
 * Validation Middleware
 * 
 * This module provides middleware for validating request parameters.
 * It uses Zod schemas to ensure data integrity and proper error handling.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

interface ValidateRequestOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware to validate request data using Zod schemas
 * @param schema Validation schemas for body, query, and params
 * @returns Express middleware function
 */
export function validateRequest(schema: ValidateRequestOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema provided
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      
      // Validate query parameters if schema provided
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      
      // Validate route parameters if schema provided
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      
      next();
    } catch (error) {
      // Handle validation errors
      console.error('Validation error:', error);
      
      // Format error message for response
      const formattedError = formatZodError(error);
      
      // Return validation error response
      res.status(400).json({
        error: 'Validation Error',
        details: formattedError
      });
    }
  };
}

/**
 * Format Zod error for consistent response structure
 * @param error Zod error
 * @returns Formatted error object
 */
function formatZodError(error: any) {
  // If it's a Zod validation error, format it nicely
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err: any) => ({
      path: err.path.join('.'),
      message: err.message
    }));
  }
  
  // For other types of errors, return a generic message
  return [{ 
    path: 'validation', 
    message: 'Invalid request data' 
  }];
}

/**
 * Middleware to log request details
 * Useful for debugging but can be disabled in production
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Body:', req.body);
  console.log('Request Query:', req.query);
  next();
}

/**
 * Enhanced error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Server error:', err);
  
  // Determine status code based on error type
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message || 'An error occurred';
  } else if (err.code === 'VALIDATION_ERROR') {
    statusCode = 400;
    message = err.message || 'Validation failed';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}