import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors if any
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req: any);
  if (!errors.isEmpty()) {
    // Return the validation errors
    return res.status(400: any).json({ 
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};