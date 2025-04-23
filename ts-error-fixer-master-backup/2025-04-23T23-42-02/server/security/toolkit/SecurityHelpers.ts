/**
 * Security Helpers
 * 
 * This module provides helper functions and decorators to make it easier to integrate
 * security features into application code.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { SecurityToolkit, SecurityLevel } from './SecurityToolkit';
import { securityBlockchain } from '../advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/blockchain/SecurityEventTypes';

/**
 * Security decorator options for method decorators
 */
export interface SecurityDecoratorOptions {
  level?: SecurityLevel;
  requireAuth?: boolean;
  logActivity?: boolean;
  blockHighRisk?: boolean;
}

/**
 * Create a secure endpoint decorator factory 
 * 
 * @returns Decorator factory
 */
export function createSecureDecorator() {
  /**
   * Decorator factory for securing endpoints with configurable options
   * 
   * @param options Security options
   * @returns Method decorator
   */
  return function secure(options: SecurityDecoratorOptions = {}) {
    const {
      level = SecurityLevel.STANDARD,
      requireAuth = false,
      logActivity = true,
      blockHighRisk = false
    } = options;
    
    /**
     * Method decorator for class methods
     */
    return function (
      target,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(req: Request, res: Response, next: NextFunction) {
        try {
          // Check authentication if required
          if (requireAuth && (!req.isAuthenticated || !req.isAuthenticated())) {
            return res.status(401).json({
              success: false,
              error: 'Authentication required'
            });
          }
          
          // Create security toolkit with specified level
          const toolkit = new SecurityToolkit({
            level,
            enableAnomalyDetection: true,
            enableBlockchainLogging: true,
            enableRuntimeProtection: level === SecurityLevel.HIGH || level === SecurityLevel.MAXIMUM,
            blockHighRiskRequests: blockHighRisk,
            anomalyThreshold: level === SecurityLevel.MAXIMUM ? 0.6 : 
                              level === SecurityLevel.HIGH ? 0.7 : 
                              level === SecurityLevel.STANDARD ? 0.8 : 0.9,
            rateLimit: level === SecurityLevel.MAXIMUM || level === SecurityLevel.HIGH ? 
                         'strict' : 'default'
          });
          
          // Log endpoint access if enabled
          if (logActivity) {
            await toolkit.logSecurityEvent(
              SecurityEventCategory.API_ACCESS,
              SecurityEventSeverity.INFO,
              `API endpoint accessed: ${propertyKey}`,
              {
                endpoint: propertyKey,
                userId: req.user?.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
              }
            );
          }
          
          // Call original method
          return await originalMethod.apply(this, [req, res, next]);
        } catch (error: unknown) {
          // Log error
          await securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.API_ERROR,
            severity: SecurityEventSeverity.ERROR,
            message: `Error in API endpoint: ${propertyKey}`,
            timestamp: Date.now(),
            metadata: {
              endpoint: propertyKey,
              error: error.message,
              stack: error.stack,
              userId: req.user?.id,
              ipAddress: req.ip
            }
          });
          
          // Pass error to next middleware
          next(error);
        }
      };
      
      return descriptor;
    };
  };
}

/**
 * Create a security-enhanced controller class
 * 
 * @param baseLevel Default security level for all methods
 * @returns Class decorator
 */
export function secureController(baseLevel: SecurityLevel = SecurityLevel.STANDARD) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    // Store the original constructor
    const originalConstructor = constructor;
    
    // Create a new constructor function
    const newConstructor: any = function(...args: any: any[]) {
      const instance = new originalConstructor(...args);
      
      // Wrap all methods with security middleware
      Object.getOwnPropertyNames(originalConstructor.prototype).forEach(methodName => {
        // Skip constructor
        if (methodName === 'constructor') return;
        
        // Get the method
        const method = (instance as any)[methodName];
        
        // Skip non-functions
        if (typeof method !== 'function') return;
        
        // Check if method already has security applied (from method decorator)
        if ((method as any).__secured) return;
        
        // Wrap method with security
        (instance as an: anyy)[methodName] = async function(req: Request, res: Response, next: NextFunction) {
          try {
            // Create security toolkit with base level
            const toolkit = new SecurityToolkit(baseLevel);
            
            // Log endpoint access
            await toolkit.logSecurityEvent(
              SecurityEventCategory.API_ACCESS,
              SecurityEventSeverity.INFO,
              `API endpoint accessed: ${methodName}`,
              {
                endpoint: methodName,
                userId: req.user?.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
              }
            );
            
            // Call original method
            return await method.apply(instance, [req, res, next]);
          } catch (error: unknown) {
            // Log error
            await securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.API_ERROR,
              severity: SecurityEventSeverity.ERROR,
              message: `Error in API endpoint: ${methodName}`,
              timestamp: Date.now(),
              metadata: {
                endpoint: methodName,
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                ipAddress: req.ip
              }
            });
            
            // Pass error to next middleware
            next(error);
          }
        };
        
        // Mark method as secured
        (instance as any)[methodName].__secured = true;
      });
      
      return instance;
    };
    
    // Copy prototype so instanceof works correctly
    newConstructor.prototype = originalConstructor.prototype;
    
    // Return new constructor
    return newConstructor;
  };
}

// Export decorator factory instance
export const secure = createSecureDecorator();

/**
 * Create middleware that adds security headers to responses
 * 
 * @returns Express middleware
 */
export function securityHeaders(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'nonce-{nonce}'; " + 
      "style-src 'self' 'nonce-{nonce}'; " +
      "img-src 'self' data:; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none';"
    );
    
    // Generate nonce for inline scripts and styles
    const nonce = Buffer.from(Date.now() + Math.random().toString()).toString('base64');
    res.locals.nonce = nonce;
    
    // Replace nonce placeholder in CSP header
    const csp = res.getHeader('Content-Security-Policy') as string;
    res.setHeader('Content-Security-Policy', csp.replace(/{nonce}/g, nonce));
    
    next();
  };
}

/**
 * Create middleware that validates and sanitizes request data
 * 
 * @param validators Object mapping parameter names to validation functions
 * @returns Express middleware
 */
export function validateRequest(validators: Record<string, (value) => boolean | string>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};
    
    // Validate parameters
    for (const [param, validator] of Object.entries(validators)) {
      // Get value from request
      const value = req.body[param] || req.query[param] || req.params[param];
      
      // Skip if not present
      if (value === undefined) continue;
      
      // Validate
      const result = validator(value);
      
      // If validation failed, add error
      if (result !== true) {
        errors[param] = typeof result === 'string' ? result : `Invalid value for ${param}`;
      }
    }
    
    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Continue if validation passed
    next();
  };
}

/**
 * Create middleware that verifies the security blockchain periodically
 * 
 * @param intervalMs Verification interval in milliseconds
 * @returns Express middleware
 */
export function verifyBlockchainIntegrity(intervalMs: number = 60000): RequestHandler {
  let lastVerification = Date.now();
  let chainValid = true;
  
  // Schedule periodic verification
  const interval = setInterval(async () => {
    try {
      chainValid = await securityBlockchain.verifyChain();
      lastVerification = Date.now();
      
      if (!chainValid) {
        console.error('[SECURITY] Blockchain integrity verification failed!');
        
        // Log integrity failure
        await securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.SECURITY_ERROR,
          severity: SecurityEventSeverity.CRITICAL,
          message: 'Security blockchain integrity verification failed',
          timestamp: Date.now(),
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error: unknown) {
      console.error('[SECURITY] Error verifying blockchain integrity:', error);
    }
  }, intervalMs);
  
  // Ensure the interval is cleaned up when the server stops
  process.on('SIGINT', () => clearInterval(interval));
  process.on('SIGTERM', () => clearInterval(interval));
  
  // Return middleware
  return (req: Request, res: Response, next: NextFunction) => {
    // Only verify occasionally to avoid performance impact
    if (Date.now() - lastVerification > intervalMs) {
      securityBlockchain.verifyChain().then(valid => {
        chainValid = valid;
        lastVerification = Date.now();
        
        if (!chainValid) {
          // Log integrity failure
          securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.SECURITY_ERROR,
            severity: SecurityEventSeverity.CRITICAL,
            message: 'Security blockchain integrity verification failed',
            timestamp: Date.now(),
            metadata: {
              path: req.path,
              method: req.method,
              timestamp: new Date().toISOString()
            }
          }).catch(console.error);
        }
      }).catch(console.error);
    }
    
    // Add blockchain status to response
    res.locals.blockchainValid = chainValid;
    
    next();
  };
}

/**
 * Common validation functions for use with validateRequest
 */
export const validators = {
  /**
   * Validate that a value is not empty
   */
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return 'This field is required';
    }
    return true;
  },
  
  /**
   * Validate that a value is a string
   */
  string: (value) => {
    if (typeof value !== 'string') {
      return 'Must be a string';
    }
    return true;
  },
  
  /**
   * Validate that a value is a number
   */
  number: (value) => {
    if (typeof value !== 'number' && isNaN(Number(value))) {
      return 'Must be a number';
    }
    return true;
  },
  
  /**
   * Validate that a value is a boolean
   */
  boolean: (value) => {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return 'Must be a boolean';
    }
    return true;
  },
  
  /**
   * Validate that a value is an array
   */
  array: (value) => {
    if (!Array.isArray(value)) {
      return 'Must be an array';
    }
    return true;
  },
  
  /**
   * Validate that a value matches a regular expression
   * 
   * @param pattern Regular expression to match
   */
  regex: (pattern: RegExp) => (value) => {
    if (typeof value !== 'string' || !pattern.test(value)) {
      return `Must match pattern ${pattern}`;
    }
    return true;
  },
  
  /**
   * Validate that a string is at least a minimum length
   * 
   * @param min Minimum length
   */
  minLength: (min: number) => (value) => {
    if (typeof value !== 'string' || value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return true;
  },
  
  /**
   * Validate that a string is at most a maximum length
   * 
   * @param max Maximum length
   */
  maxLength: (max: number) => (value) => {
    if (typeof value !== 'string' || value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return true;
  },
  
  /**
   * Validate that a number is at least a minimum value
   * 
   * @param min Minimum value
   */
  min: (min: number) => (value) => {
    const num = Number(value);
    if (isNaN(num) || num < min) {
      return `Must be at least ${min}`;
    }
    return true;
  },
  
  /**
   * Validate that a number is at most a maximum value
   * 
   * @param max Maximum value
   */
  max: (max: number) => (value) => {
    const num = Number(value);
    if (isNaN(num) || num > max) {
      return `Must be at most ${max}`;
    }
    return true;
  },
  
  /**
   * Validate that a value is an email address
   */
  email: (value) => {
    if (typeof value !== 'string' || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Must be a valid email address';
    }
    return true;
  },
  
  /**
   * Validate that a value is a URL
   */
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch (e: unknown) {
      return 'Must be a valid URL';
    }
  }
};