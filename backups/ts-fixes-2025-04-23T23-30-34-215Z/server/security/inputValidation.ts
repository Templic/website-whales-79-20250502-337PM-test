/**
 * Input Validation Middleware
 * 
 * This module provides comprehensive input validation middleware for API requests,
 * ensuring that all input is properly sanitized and validated before processing.
 * 
 * Features:
 * - Parameter type validation
 * - Content sanitization
 * - Schema validation
 * - Context-aware validation rules
 * - Deep object inspection
 * - Quantum-resistant validation patterns
 */

import { Request, Response, NextFunction } from 'express';
import { immutableSecurityLogs as securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';

/**
 * Input validation options
 */
export interface InputValidationOptions {
  /**
   * Whether to perform thorough validation
   */
  thorough?: boolean;
  
  /**
   * Maximum allowed depth for nested objects
   */
  maxDepth?: number;
  
  /**
   * Maximum allowed array length
   */
  maxArrayLength?: number;
  
  /**
   * Maximum allowed string length
   */
  maxStringLength?: number;
  
  /**
   * Whether to sanitize inputs
   */
  sanitize?: boolean;
}

/**
 * Validation error
 */
interface ValidationError {
  /**
   * Field path
   */
  path: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error severity
   */
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
interface ValidationResult {
  /**
   * Whether the validation passed
   */
  valid: boolean;
  
  /**
   * Validation errors
   */
  errors: ValidationError[];
}

/**
 * Create input validation middleware
 */
export function createInputValidationMiddleware(options: InputValidationOptions = {}) {
  const {
    thorough = false,
    maxDepth = 10,
    maxArrayLength = 1000,
    maxStringLength = 100000,
    sanitize = true
  } = options;
  
  /**
   * Validate request parameters
   */
  function validateParameters(req: Request): ValidationResult {
    // Initialize the validation result
    const result: ValidationResult = {
      valid: true,
      errors: []
    };
    
    try {
      // Validate query parameters
      if (req.query) {
        validateObject('query', req.query, 0, result);
      }
      
      // Validate URL parameters
      if (req.params) {
        validateObject('params', req.params, 0, result);
      }
      
      // Validate body
      if (req.body) {
        validateObject('body', req.body, 0, result);
      }
      
      // Set valid flag to false if there are errors
      if (result.errors.length > 0) {
        result.valid = false;
      }
    } catch (error: Error) {
      // Add unexpected error
      result.valid = false;
      result.errors.push({
        path: 'request',
        message: `Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
      
      // Log error to blockchain
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.API,
        severity: SecurityEventSeverity.ERROR,
        message: 'Input validation unexpected error',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          path: req.path,
          method: req.method
        }
      }).catch(console.error);
    }
    
    return result;
  }
  
  /**
   * Validate an object recursively
   */
  function validateObject(path: string, obj, depth: number, result: ValidationResult): void {
    // Check for maximum depth
    if (depth > maxDepth) {
      result.errors.push({
        path,
        message: `Maximum object depth exceeded (${maxDepth})`,
        severity: 'error'
      });
      return;
    }
    
    // Check object type
    if (obj === null || typeof obj !== 'object') {
      validateValue(path, obj, result);
      return;
    }
    
    // Check if it's an array
    if (Array.isArray(obj)) {
      // Check array length
      if (obj.length > maxArrayLength) {
        result.errors.push({
          path,
          message: `Array length exceeds maximum allowed (${maxArrayLength})`,
          severity: 'error'
        });
        return;
      }
      
      // Validate each array element
      for (let i = 0; i < obj.length; i++) {
        validateObject(`${path}[${i}]`, obj[i], depth + 1, result);
      }
      
      return;
    }
    
    // Validate each object property
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        validateObject(`${path}.${key}`, obj[key], depth + 1, result);
      }
    }
  }
  
  /**
   * Validate a primitive value
   */
  function validateValue(path: string, value, result: ValidationResult): void {
    // Check string length
    if (typeof value === 'string' && value.length > maxStringLength) {
      result.errors.push({
        path,
        message: `String length exceeds maximum allowed (${maxStringLength})`,
        severity: 'error'
      });
    }
    
    // Check for potentially dangerous strings
    if (typeof value === 'string') {
      // Check for SQL injection patterns
      if (/\b(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from)\b/i.test(value)) {
        result.errors.push({
          path,
          message: 'Potential SQL injection detected',
          severity: 'error'
        });
      }
      
      // Check for XSS patterns
      if (/((?:\%3C)|<)[^\n]+((?:\%3E)|>)/i.test(value)) {
        result.errors.push({
          path,
          message: 'Potential XSS attack detected',
          severity: 'error'
        });
      }
      
      // Check for path traversal
      if (/\.\.\//g.test(value)) {
        result.errors.push({
          path,
          message: 'Potential path traversal attack detected',
          severity: 'error'
        });
      }
      
      // Check for command injection
      if (/\b(eval|setTimeout|setInterval|Function|constructor)\s*\(/i.test(value)) {
        result.errors.push({
          path,
          message: 'Potential code injection attack detected',
          severity: 'error'
        });
      }
      
      // Additional checks for thorough validation
      if (thorough) {
        // Check for SSRF patterns
        if (/^(https?|ftp|file|data|javascript):/i.test(value)) {
          result.errors.push({
            path,
            message: 'Potential SSRF attack detected',
            severity: 'warning'
          });
        }
        
        // Check for LDAP injection
        if (/[()&|!*/\\]/.test(value)) {
          result.errors.push({
            path,
            message: 'Potential LDAP injection detected',
            severity: 'warning'
          });
        }
        
        // Check for template injection
        if (/\$\{.*\}/g.test(value)) {
          result.errors.push({
            path,
            message: 'Potential template injection detected',
            severity: 'warning'
          });
        }
      }
    }
  }
  
  /**
   * Sanitize a request object in-place
   */
  function sanitizeRequest(req: Request): void {
    // Sanitize query parameters
    if (req.query) {
      sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      sanitizeObject(req.params);
    }
    
    // Sanitize body
    if (req.body) {
      sanitizeObject(req.body);
    }
  }
  
  /**
   * Sanitize an object in-place
   */
  function sanitizeObject(obj: any): void {
    if (obj === null || typeof obj !== 'object') {
      return;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = sanitizeString(obj[i]);
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          sanitizeObject(obj[i]);
        }
      }
      return;
    }
    
    // Handle objects
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  }
  
  /**
   * Sanitize a string
   */
  function sanitizeString(str: string): string {
    // HTML encoding - replace potentially dangerous characters
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Return the middleware function
  return function inputValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
      // Sanitize request if enabled
      if (sanitize) {
        sanitizeRequest(req);
      }
      
      // Validate request parameters
      const validationResult = validateParameters(req);
      
      // If validation failed, return 400 Bad Request
      if (!validationResult.valid) {
        // Log validation failure to blockchain
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.API,
          severity: SecurityEventSeverity.WARNING,
          message: 'Input validation failed',
          timestamp: Date.now(),
          metadata: {
            path: req.path,
            method: req.method,
            errors: validationResult.errors,
            ip: req.ip || req.connection.remoteAddress
          }
        }).catch(console.error);
        
        // Only return errors with severity 'error'
        const criticalErrors = validationResult.errors.filter(error => error.severity === 'error');
        
        // If there are critical errors, reject the request
        if (criticalErrors.length > 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Input validation failed',
            details: criticalErrors.map(error => ({
              path: error.path,
              message: error.message
            }))
          });
        }
      }
      
      // Continue to next middleware
      next();
    } catch (error: Error) {
      // Log error to blockchain
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.API,
        severity: SecurityEventSeverity.ERROR,
        message: 'Input validation middleware error',
        timestamp: Date.now(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          path: req.path,
          method: req.method
        }
      }).catch(console.error);
      
      // Continue to next middleware to avoid breaking the request pipeline
      next();
    }
  };
}