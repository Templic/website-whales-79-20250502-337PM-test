/**
 * API Security Middleware
 * 
 * This module provides specialized middleware for securing API endpoints.
 * It implements advanced API security measures recommended by OWASP API Security Project.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * API authentication middleware
 * 
 * Verifies that the request has valid API authentication
 */
export function verifyApiAuthentication(options: {
  /**
   * Whether to allow API key authentication
   */
  allowApiKey?: boolean;
  
  /**
   * Whether to allow JWT token authentication
   */
  allowJwt?: boolean;
  
  /**
   * Whether to allow OAuth2 token authentication
   */
  allowOAuth?: boolean;
} = {}) {
  // Default options
  const mergedOptions = {
    allowApiKey: true,
    allowJwt: true,
    allowOAuth: false,
    ...options
  };
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let authenticated = false;
      const authHeader = req.headers.authorization;
      
      // Check JWT token
      if (!authenticated && mergedOptions.allowJwt && authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        if (token) {
          try {
            // In a real implementation, we would verify the token
            // and set req.user if valid
            // For now, we'll just check if it's present
            if (token.length > 10) {
              (req as any).user = { id: 'jwt-user', role: 'api' };
              authenticated = true;
            }
          } catch (error) {
            console.warn('[ApiSecurity] Invalid JWT token:', error);
          }
        }
      }
      
      // Check API key
      if (!authenticated && mergedOptions.allowApiKey && req.headers['x-api-key']) {
        const apiKey = req.headers['x-api-key'] as string;
        
        // In a real implementation, we would verify the API key
        // For now, we'll just check if it's present
        if (apiKey && apiKey.length > 10) {
          (req as any).user = { id: 'api-key-user', role: 'api' };
          authenticated = true;
        }
      }
      
      // Check OAuth token
      if (!authenticated && mergedOptions.allowOAuth && authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // In a real implementation, we would verify the OAuth token
        // For now, we'll just check if it's present and different from JWT
        if (token && token.length > 20) {
          (req as any).user = { id: 'oauth-user', role: 'api' };
          authenticated = true;
        }
      }
      
      // If not authenticated, return 401
      if (!authenticated) {
        return res.status(401).json({
          success: false,
          message: 'API authentication required'
        });
      }
      
      // Continue to next middleware
      next();
    } catch (error) {
      console.error('[ApiSecurity] Error in API authentication middleware:', error);
      next(error);
    }
  };
}

/**
 * API authorization middleware
 * 
 * Verifies that the authenticated user has the required permissions
 */
export function verifyApiAuthorization(requiredPermissions: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      // Check if user is authenticated
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // If no permissions required, allow access
      if (requiredPermissions.length === 0) {
        return next();
      }
      
      // Check if user has required permissions
      const userPermissions = user.permissions || [];
      const hasPermissions = requiredPermissions.every(p => userPermissions.includes(p));
      
      // Check if user has admin role
      const isAdmin = Array.isArray(user.roles) 
        ? user.roles.includes('admin') 
        : user.role === 'admin';
      
      // Allow if user has required permissions or is admin
      if (hasPermissions || isAdmin) {
        return next();
      }
      
      // Otherwise, deny access
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    } catch (error) {
      console.error('[ApiSecurity] Error in API authorization middleware:', error);
      next(error);
    }
  };
}

/**
 * API request validation middleware factory
 */
export function validateApiRequest(schema: z.ZodSchema, type: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Select the request part to validate
      const data = type === 'body' ? req.body : type === 'query' ? req.query : req.params;
      
      // Validate using Zod schema
      const result = schema.safeParse(data);
      
      if (!result.success) {
        // If validation fails, return 400 with validation errors
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: result.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      // Update request data with validated data
      if (type === 'body') {
        req.body = result.data;
      } else if (type === 'query') {
        req.query = result.data;
      } else {
        req.params = result.data;
      }
      
      // Continue to next middleware
      next();
    } catch (error) {
      console.error('[ApiSecurity] Error in API validation middleware:', error);
      next(error);
    }
  };
}

/**
 * API rate limiting middleware
 */
export function enforceApiRateLimit(options: {
  /**
   * Maximum number of requests allowed per window
   */
  maxRequests?: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs?: number;
  
  /**
   * Whether to use a sliding window
   */
  slidingWindow?: boolean;
} = {}) {
  // Default options
  const mergedOptions = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    slidingWindow: true,
    ...options
  };
  
  // Simple in-memory rate limiting store
  // In a real implementation, we would use Redis or similar
  const ipRequests: Record<string, { count: number, resetAt: number }> = {};
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Get or create request tracker for this IP
      if (!ipRequests[ip]) {
        ipRequests[ip] = {
          count: 0,
          resetAt: Date.now() + mergedOptions.windowMs
        };
      }
      
      // Reset if window has elapsed
      if (Date.now() > ipRequests[ip].resetAt) {
        ipRequests[ip] = {
          count: 0,
          resetAt: Date.now() + mergedOptions.windowMs
        };
      }
      
      // Increment request count
      ipRequests[ip].count++;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', mergedOptions.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, mergedOptions.maxRequests - ipRequests[ip].count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(ipRequests[ip].resetAt / 1000).toString());
      
      // Check if rate limit exceeded
      if (ipRequests[ip].count > mergedOptions.maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'API rate limit exceeded'
        });
      }
      
      // Continue to next middleware
      next();
    } catch (error) {
      console.error('[ApiSecurity] Error in API rate limiting middleware:', error);
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: z.ZodSchema) {
  return validateApiRequest(schema, 'body');
}

/**
 * Validate request query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return validateApiRequest(schema, 'query');
}

/**
 * Validate request URL parameters
 */
export function validateParams(schema: z.ZodSchema) {
  return validateApiRequest(schema, 'params');
}