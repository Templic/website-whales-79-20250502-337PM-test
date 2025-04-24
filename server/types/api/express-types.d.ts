/**
 * Express Type Extensions
 * 
 * This file extends Express's Request, Response, and other types
 * to add custom properties and methods used in our application.
 */

import { SessionData } from '../core/common-types';
import { SecurityConfig } from '../core/security-types';

// Extend Express Request
declare namespace Express {
  export interface Request {
    /** User session data */
    session: {
      /** Session ID */
      id: string;
      
      /** Session data */
      data: SessionData;
      
      /** Regenerate session */
      regenerate(callback: (err: any) => void): void;
      
      /** Save session */
      save(callback: (err: any) => void): void;
      
      /** Destroy session */
      destroy(callback: (err: any) => void): void;
      
      /** Reset session max age */
      touch(): void;
      
      /** Session cookie */
      cookie: {
        maxAge: number;
        originalMaxAge: number;
        expires: Date;
        secure?: boolean;
        httpOnly: boolean;
        domain?: string;
        path: string;
        sameSite?: boolean | 'lax' | 'strict' | 'none';
      };
    };
    
    /** Authenticated user */
    user?: {
      id: string;
      username: string;
      email: string;
      roles: string[];
      permissions: string[];
      isAdmin: boolean;
    };
    
    /** CSRF token */
    csrfToken(): string;
    
    /** Request start time for performance tracking */
    startTime?: number;
    
    /** Request ID for tracing */
    requestId?: string;
    
    /** Security configuration */
    securityConfig?: SecurityConfig;
    
    /** Original request IP (handles proxies) */
    realIp?: string;
    
    /** Custom validation function */
    validate?(schema: any): { valid: boolean; errors?: any };
    
    /** Rate limit information */
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime: number;
    };
    
    /** Check if request is authenticated */
    isAuthenticated(): boolean;
    
    /** Check if user has specific permission */
    hasPermission(permission: string): boolean;
    
    /** Check if user has specific role */
    hasRole(role: string): boolean;
    
    /** Original URL before redirects */
    originalUrl: string;
    
    /** Parse a query parameter as an integer */
    parseIntParam(paramName: string, defaultValue?: number): number;
    
    /** Parse a query parameter as a boolean */
    parseBoolParam(paramName: string, defaultValue?: boolean): boolean;
  }

  // Extend Express Response
  export interface Response {
    /** Send a successful response */
    success<T>(data: T, status?: number): Response;
    
    /** Send an error response */
    error(message: string, statusCode?: number, errorCode?: string | number): Response;
    
    /** Send a paginated response */
    paginated<T>(data: T[], total: number, page: number, limit: number): Response;
    
    /** Set cache headers */
    setCache(maxAge: number): Response;
    
    /** Send a no-content response */
    noContent(): Response;
    
    /** Send a created response */
    created<T>(data: T): Response;
    
    /** Set security headers */
    setSecurityHeaders(): Response;
    
    /** Send a redirect with flash message */
    redirectWithMessage(url: string, message: string, type?: 'success' | 'info' | 'warning' | 'error'): void;
    
    /** Set response headers for file download */
    prepareDownload(filename: string, mimeType?: string): Response;
    
    /** Typed response */
    json<T>(body?: T): TypedResponse<T>;
    
    /** Typed status */
    status(code: number): TypedResponse<any>;
  }

  // Add TypedResponse to fix express response typing issues
  export interface TypedResponse<T> extends Response {
    /** Send JSON response with type */
    json(body: T): TypedResponse<T>;
    
    /** Set response status code with type */
    status(code: number): TypedResponse<T>;
    
    /** Send response with type */
    send(body: T): TypedResponse<T>;
  }
}

// Extend NextFunction
declare namespace Express {
  export interface NextFunction {
    (err?: any): void;
  }
}

// Extend Error
declare namespace Express {
  export interface ErrorRequestHandler {
    (err: any, req: Request, res: Response, next: NextFunction): void;
  }
}

// Need to export something to make it a module
export {};