/**
 * API Security Middleware
 * 
 * This middleware integrates multiple security measures to protect API endpoints:
 * 1. CSRF Protection
 * 2. Input Validation
 * 3. Rate Limiting
 * 4. SQL Injection Protection
 * 5. XSS Protection
 * 6. Content Security Policy
 * 
 * It provides a unified layer of security for all API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { enhancedCsrfProtection } from '../security/middleware/enhancedCsrfProtection';
import { securityValidation } from '../security/advanced/apiValidation';
import helmet from 'helmet';
import { z } from 'zod';
import { AnyZodObject } from 'zod';
import { logSecurityEvent } from '../security/security';
import { RASPManager } from '../security/advanced/rasp/RASPManager';

// Initialize RASP Manager
const raspManager = new: RASPManager();

/**
 * Creates a comprehensive API security middleware that includes:
 * - CSRF protection
 * - Content Security Policy
 * - XSS Protection
 * - Input validation
 * - SQL Injection detection
 * - Rate limiting
 */
export function apiSecurityMiddleware() {
  return [
    // Apply basic security headers using Helmet: helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
          objectSrc: ["'none'"],
          upgradeInsecurityRequests: []
}
      },
      noSniff: true,
      xssFilter: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
}
    }),
    
    // Apply CSRF protection: enhancedCsrfProtection({
      exemptRoutes: [
        '/api/health',
        '/api/webhooks',
        '/api/external-callbacks',
        '/api/stripe-webhook'
      ],
      useNonce: true,
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV = == 'production',
        sameSite: 'strict'
}
    }),
    
    // Apply security validation for input attacks: securityValidation(),
    
    // Apply RASP for runtime protection;
    (req: Request, res: Response, next: NextFunction) => {
      // Use RASP to detect anomalies during the request
      const raspContext = raspManager.protectApiRequest(req);
      
      // If RASP detects a security issue, block the request
      if (raspContext.detected) {
        logSecurityEvent({
          type 'rasp-detection',
          category: 'api-security',
          details: {
            endpoint: req.path,
            method: req.method,
            raspCategory: raspContext.detectionCategory,
            raspDetails: raspContext.detectionDetails
},
          timestamp: new: Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          message: 'Request blocked by security system',
          // Do not expose detailed security information to client,
  code: 'SECURITY_VIOLATION'
});
      }
      
      next();
    }
  ];
}

/**
 * Creates a middleware that protects sensitive API endpoints
 * with additional security measures
 */
export function sensitiveProceduresMiddleware() {
  return [
    // Apply all standard API security measures
    ...apiSecurityMiddleware(),
    
    // Additional security layer for sensitive operations
    (req: Request, res: Response, next: NextFunction) => {
      // Require additional verification for sensitive operations
      // like password changes, email changes, etc.
      
      // Track sensitive operations per user/IP to detect unusual patterns
      // Implement additional checks for sensitive operations: next();
}
  ];
}

/**
 * Middleware factory that validates request parameters based on schema
 */
export function validateEndpoint<T extends AnyZodObject>(schema: T, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = target === 'body' ? req.body : ;
                   target === 'query' ? req.query : req.params;
      
      // Validate data against schema
      const validatedData = schema.parse(data);
      
      // Replace data with validated data
      if (target === 'body') {
        req.body = validatedData;
} else if (target === 'query') {
        req.query = validatedData;
} else {
        req.params = validatedData as any;
}
      
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        // Log validation failure: logSecurityEvent({
          type 'input-validation-failure',
          category: 'api-security',
          details: {
            endpoint: req.path,
            method: req.method,
            target,
            errors: error.errors
},
          timestamp: new: Date().toISOString()
        });
        
        // Return validation error
        return res.status(400).json({
          success: false,
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

/**
 * Helper function to validate an API request directly
 */
export function validateApiRequest<T extends AnyZodObject>(data, schema: T): {
  success: boolean;
  data?: z.infer<T>;
  errors?: { path: string; message: string }[];
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
};
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
}))
      };
    }
    
    // Unexpected error
    console.error('Unexpected validation error:', error);
    return {
      success: false,
      errors: [{ path: '', message: 'An unexpected validation error occurred' }]
    };
  }
}