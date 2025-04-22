/**
 * Security Middleware Utilities
 * 
 * This module provides helper functions to easily apply multiple security middlewares
 * to routes with consistent configurations.
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from './validation';
import { verifyApiAuthentication, verifyApiAuthorization, validateApiRequest, enforceApiRateLimit } from './apiSecurity';
import { authenticateJwt, authorizeJwtRole } from './jwtAuth';

/**
 * Available rate limit types 
 */
export type RateLimitType = 'default' | 'auth' | 'security' | 'admin' | 'public';

/**
 * Middleware configuration options for securing routes
 */
export interface SecurityMiddlewareOptions {
  /** 
   * Whether authentication is required
   * @default false
   */
  authenticate?: boolean;
  
  /**
   * Required roles for authorization (if empty array, any authenticated user is allowed)
   * @default []
   */
  requiredRoles?: string[];
  
  /**
   * Schema for validating request body
   */
  bodySchema?: z.ZodType<any>;
  
  /**
   * Schema for validating query parameters
   */
  querySchema?: z.ZodType<any>;
  
  /**
   * Schema for validating URL parameters
   */
  paramsSchema?: z.ZodType<any>;
  
  /**
   * Rate limit type to apply
   * @default 'default'
   */
  rateLimit?: RateLimitType;
  
  /**
   * Additional custom middleware
   */
  customMiddleware?: RequestHandler[];
}

/**
 * Applies security middleware to a route based on the provided options
 * 
 * @param router Express router
 * @param method HTTP method ('get', 'post', 'put', 'delete', 'patch')
 * @param path Route path
 * @param handlers Request handlers (controller functions)
 * @param options Security middleware options
 */
export function secureRoute(
  router: Router,
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  handlers: RequestHandler | RequestHandler[],
  options: SecurityMiddlewareOptions = {}
): void {
  const middleware: RequestHandler[] = [];
  
  // Apply rate limiting first (to prevent abuse before processing request)
  middleware.push(enforceApiRateLimit(options.rateLimit || 'default'));
  
  // Add authentication if required
  if (options.authenticate) {
    middleware.push(verifyApiAuthentication);
  }
  
  // Add authorization if roles are specified
  if (options.authenticate && options.requiredRoles && options.requiredRoles.length > 0) {
    middleware.push(verifyApiAuthorization(options.requiredRoles));
  }
  
  // Add validation middleware if schemas are provided
  if (options.bodySchema) {
    middleware.push(validateApiRequest(options.bodySchema));
  }
  
  if (options.querySchema) {
    middleware.push(validateQuery(options.querySchema));
  }
  
  if (options.paramsSchema) {
    middleware.push(validateParams(options.paramsSchema));
  }
  
  // Add any custom middleware
  if (options.customMiddleware) {
    middleware.push(...options.customMiddleware);
  }
  
  // Add the route handlers
  const routeHandlers = Array.isArray(handlers) ? handlers : [handlers];
  
  // Apply all middleware and handlers to the route
  router[method](path, ...middleware, ...routeHandlers);
}

/**
 * Creates a new router with security middleware applied to all routes
 * 
 * @param baseOptions Default security options for all routes
 * @returns Router with added secureGet, securePost, etc. methods
 */
export function createSecureRouter(baseOptions: SecurityMiddlewareOptions = {}): Router & {
  secureGet: Function;
  securePost: Function;
  securePut: Function;
  secureDelete: Function;
  securePatch: Function;
} {
  const router = Router() as any;
  
  // Add secure route methods
  router.secureGet = (path: string, handlers: RequestHandler | RequestHandler[], options: SecurityMiddlewareOptions = {}) => {
    secureRoute(router, 'get', path, handlers, { ...baseOptions, ...options });
  };
  
  router.securePost = (path: string, handlers: RequestHandler | RequestHandler[], options: SecurityMiddlewareOptions = {}) => {
    secureRoute(router, 'post', path, handlers, { ...baseOptions, ...options });
  };
  
  router.securePut = (path: string, handlers: RequestHandler | RequestHandler[], options: SecurityMiddlewareOptions = {}) => {
    secureRoute(router, 'put', path, handlers, { ...baseOptions, ...options });
  };
  
  router.secureDelete = (path: string, handlers: RequestHandler | RequestHandler[], options: SecurityMiddlewareOptions = {}) => {
    secureRoute(router, 'delete', path, handlers, { ...baseOptions, ...options });
  };
  
  router.securePatch = (path: string, handlers: RequestHandler | RequestHandler[], options: SecurityMiddlewareOptions = {}) => {
    secureRoute(router, 'patch', path, handlers, { ...baseOptions, ...options });
  };
  
  return router;
}

/**
 * Creates an admin router with authentication and admin role required by default
 */
export function createAdminRouter(): Router & {
  secureGet: Function;
  securePost: Function;
  securePut: Function;
  secureDelete: Function;
  securePatch: Function;
} {
  return createSecureRouter({
    authenticate: true,
    requiredRoles: ['admin', 'super_admin'],
    rateLimit: 'admin'
  });
}

/**
 * Creates a security operations router with strict rate limiting
 * and super_admin role required by default
 */
export function createSecurityRouter(): Router & {
  secureGet: Function;
  securePost: Function;
  securePut: Function;
  secureDelete: Function;
  securePatch: Function;
} {
  return createSecureRouter({
    authenticate: true,
    requiredRoles: ['super_admin'],
    rateLimit: 'security'
  });
}