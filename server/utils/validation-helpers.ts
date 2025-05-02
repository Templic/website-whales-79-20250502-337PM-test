import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware to validate request data against a Zod schema
 * 
 * @param schema Object containing schemas for different parts of the request
 * @returns Express middleware function
 */
export function validateRequest(schema: {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema is provided
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      // Validate query parameters if schema is provided
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      // Validate route parameters if schema is provided
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      next(error);
    }
  };
}