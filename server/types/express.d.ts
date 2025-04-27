/**
 * Express Type Extensions
 * 
 * This file enhances the Express type definitions to add custom properties
 * used throughout the application.
 */

import { UserRecord } from "../../shared/schema";

declare global {
  namespace Express {
    // Extend Request interface
    interface Request {
      // User information from authentication
      user?: {
        id: string | number;
        email?: string;
        role?: string;
        [key: string]: unknown;
      };
      
      // Safe body access with type validation
      safeBody?: Record<string, unknown>;
      
      // Upload file data
      uploadedFiles?: {
        path: string;
        filename: string;
        mimetype: string;
        size: number;
      }[];
      
      // Authentication and session data
      isAuthenticated(): boolean;
      session: {
        userId?: string;
        [key: string]: unknown;
      } & Express.Session;
      
      // Request metadata for logging
      startTime?: number;
      requestId?: string;
      
      // Business logic specific
      contentVersion?: string;
      apiVersion?: string;
      clientVersion?: string;
    }
    
    // Extend Response interface
    interface Response {
      // Enhanced response methods with type safety
      sendSuccess<T>(data: T, message?: string): void;
      sendError(message: string, code?: number, details?: unknown): void;
      
      // Authentication helper
      requireAuthentication(): boolean;
      
      // Caching helpers
      setCache(seconds: number): this;
      noCache(): this;
      
      // Business logic specific
      contentVersion?: string;
    }
    
    // Define User interface more precisely
    interface User {
      id: string | number;
      email?: string;
      role?: string;
      permissions?: string[];
      [key: string]: unknown;
    }
  }
}

// Extend Express library types
declare module "express" {
  // Extend Router with custom method signatures
  interface Router {
    getWithAuth(path: string, ...handlers: RequestHandler[]): Router;
    postWithAuth(path: string, ...handlers: RequestHandler[]): Router;
    putWithAuth(path: string, ...handlers: RequestHandler[]): Router;
    deleteWithAuth(path: string, ...handlers: RequestHandler[]): Router;
    patchWithAuth(path: string, ...handlers: RequestHandler[]): Router;
  }
  
  // Extend Application with API versioning support
  interface Application {
    apiRouter(version: string | number): Router;
    apiVersion(version: string | number, router: Router): void;
  }
  
  // Extend RequestHandler with type safety
  interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): void | Promise<void>;
  }
  
  // Custom middleware types
  interface ValidationSchema {
    body?: object;
    query?: object;
    params?: object;
    headers?: object;
    cookies?: object;
  }
  
  interface ValidatorOptions {
    abortEarly?: boolean;
    stripUnknown?: boolean;
    allowUnknown?: boolean;
  }
  
  function validateRequest(schema: ValidationSchema, options?: ValidatorOptions): RequestHandler;
  function authenticate(strategy?: string | string[]): RequestHandler;
  function authorize(roles: string | string[]): RequestHandler;
}