/**
 * Request Validation Middleware
 * 
 * This middleware validates incoming requests using Zod schemas.
 * It supports validation of request body, query parameters, and URL parameters.
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Middleware factory for request validation
 */
export const validateRequest = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema is provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      
      // Validate query parameters if schema is provided
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      
      // Validate route parameters if schema is provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      
      // Proceed to the route handler if validation passes
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Return a 400 Bad Request with the validation errors
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // For other types of errors, pass to the error handler
      next(error);
    }
  };
};