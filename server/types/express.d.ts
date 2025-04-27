/**
 * Type Declarations for Express
 * 
 * This file extends the Express namespace with custom types
 * to properly handle middleware parameters and type checking.
 */

import { JwtPayload } from '../middleware/jwtAuth';
import { ValidationResult } from 'express-validator';

declare global {
  namespace Express {
    // Extended Request interface
    interface Request {
      // JWT Authentication
      jwtPayload?: JwtPayload;
      
      // Database transactions
      dbTransaction?: unknown;
      
      // Validation results
      validationResult?: ValidationResult;
      
      // API Security
      securityChecks?: {
        authenticated?: boolean;
        authorized?: boolean;
        validated?: boolean;
        rateLimited?: boolean;
      };
      
      // Sanitized/validated parameters
      safeParams?: Record<string, unknown>;
      safeQuery?: Record<string, unknown>;
      safeBody?: Record<string, unknown>;
      
      // File Upload extensions
      files?: {
        [fieldname: string]: {
          name: string;
          data: Buffer;
          size: number;
          encoding: string;
          tempFilePath: string;
          truncated: boolean;
          mimetype: string;
          md5: string;
          mv: (path: string, callback: (err?: Error) => void) => void;
        } | Array<{
          name: string;
          data: Buffer;
          size: number;
          encoding: string;
          tempFilePath: string;
          truncated: boolean;
          mimetype: string;
          md5: string;
          mv: (path: string, callback: (err?: Error) => void) => void;
        }>;
      };
    }
    
    // Extended Response interface
    interface Response {
      // Custom response methods
      successJson?: (data: unknown, message?: string) => Response;
      errorJson?: (message: string, statusCode?: number, errors?: unknown) => Response;
    }
    
    // Extended Application interface
    interface Application {
      // Custom middleware registry
      middlewares?: Map<string, RequestHandler>;
      
      // Custom routes registry
      routes?: {
        registered: string[];
        protected: string[];
        public: string[];
      };
    }
  }
}

// Augment RouteParameters to fix express-validator type issues
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }

  // Fix express.Router() type compatibility issues
  interface IRouter {
    // Add support for array middleware
    use(path: string, ...handlers: Array<RequestHandler | ErrorRequestHandler | IRouter>): this;
    use(...handlers: Array<RequestHandler | ErrorRequestHandler | IRouter>): this;
    
    // Add support for array middleware in route handlers
    get(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    post(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    put(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    delete(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    patch(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    options(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
    head(path: string, ...handlers: Array<RequestHandler | IRouter>): this;
  }

  // Fix rate limiter compatibility types
  export interface Request {
    rateLimit?: {
      remaining: number;
      limit: number;
      current: number;
      resetTime?: Date;
    };
  }
}

// Helper type for validation middleware
export interface ValidationSchema {
  safeParse: (data: unknown) => {
    success: boolean;
    data?: unknown;
    error?: {
      format?: () => unknown;
      errors: unknown[];
    };
  };
}

// Enhanced Express Error Type
export interface ExpressError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  data?: unknown;
}