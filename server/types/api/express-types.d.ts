/**
 * Express Type Definitions
 * 
 * Type definitions for Express applications and middleware.
 * These extend the core Express types with additional properties
 * specific to this application.
 */

import { AuthenticatedUser } from '../core/security-types';

// Extend Express Request interface
declare namespace Express {
  interface Request {
    user?: AuthenticatedUser;
    csrfToken?: () => string;
    startTime?: number;
    correlationId?: string;
    session?: {
      id: string;
      userId?: string;
      createdAt: number;
      expiresAt: number;
      data: Record<string, unknown>;
      regenerate: (callback: (err?: Error) => void) => void;
      destroy: (callback: (err?: Error) => void) => void;
      reload: (callback: (err?: Error) => void) => void;
      save: (callback: (err?: Error) => void) => void;
      touch: (callback: (err?: Error) => void) => void;
    };
    flash?: (type: string, message: string) => void;
    isAuthenticated?: () => boolean;
  }

  // Extend Express Response interface with typed methods
  interface Response {
    // Type safe response methods
    success: <T>(data?: T, statusCode?: number, meta?: Record<string, unknown>) => Response;
    error: (message: string, statusCode?: number, errorCode?: string | number, details?: any) => Response;
    created: <T>(data?: T, meta?: Record<string, unknown>) => Response;
    notFound: (message?: string, errorCode?: string | number) => Response;
    badRequest: (message?: string, errorCode?: string | number, details?: any) => Response;
    unauthorized: (message?: string, errorCode?: string | number) => Response;
    forbidden: (message?: string, errorCode?: string | number) => Response;
    tooManyRequests: (message?: string, resetTime?: number) => Response;
    serverError: (message?: string, errorCode?: string | number, details?: any) => Response;
    noContent: () => Response;
    accepted: <T>(data?: T, meta?: Record<string, unknown>) => Response;
    
    // Cache control
    withCache: (maxAgeSeconds: number, options?: {
      public?: boolean;
      private?: boolean;
      noCache?: boolean;
      noStore?: boolean;
      mustRevalidate?: boolean;
      proxyRevalidate?: boolean;
      sMaxAgeSeconds?: number;
    }) => Response;
    
    // JSON format response with proper typing
    json<T>(body: T): Response;
    
    // Status with typing
    status(code: number): Response;
  }
  
  // Add TypedResponse to fix express response typing issues
  interface TypedResponse<ResBody> extends Response {
    json(body: ResBody): TypedResponse<ResBody>;
    status(code: number): TypedResponse<ResBody>;
  }
}

/**
 * Middleware function type
 */
export type ExpressMiddleware = (
  req: Express.Request, 
  res: Express.Response, 
  next: (error?: any) => void
) => void | Promise<void>;

/**
 * Error handling middleware function type
 */
export type ExpressErrorMiddleware = (
  err: any,
  req: Express.Request, 
  res: Express.Response, 
  next: (error?: any) => void
) => void | Promise<void>;

/**
 * Route handler function type
 */
export type ExpressRouteHandler = (
  req: Express.Request, 
  res: Express.Response
) => void | Promise<void>;

/**
 * Express controller with route handlers
 */
export interface ExpressController {
  [key: string]: ExpressRouteHandler;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';
  handler: ExpressRouteHandler;
  middleware?: ExpressMiddleware[];
  validate?: {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
  };
  description?: string;
  isProtected?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  cache?: {
    enabled: boolean;
    duration: number;
  };
}

// Export this as a module
export {};