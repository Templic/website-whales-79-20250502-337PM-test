/**
 * Unified API Validation Module
 * 
 * This module integrates the API validation system with CSRF protection and rate limiting,
 * providing a comprehensive security validation layer for all API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationEngine, ValidationOptions } from './ValidationEngine';
import { rateLimitingSystem } from '../threat/RateLimitingSystem';

// Handle security logging with a fallback mechanism to avoid circular dependencies
function logSecurityEvent(eventData: any): void {
  try {
    // Try to load the security logger dynamically
    const securityLogger = require('../../utils/securityLogger');
    if (typeof securityLogger.logSecurityEvent === 'function') {
      securityLogger.logSecurityEvent(eventData);
      return;
    }
  } catch (error) {
    // Fallback to console logging if the security logger is not available
    console.warn('[SECURITY] Unable to load security logger, using fallback logging mechanism');
  }
  
  // Fallback implementation
  console.log(`[SECURITY] [${eventData.severity || 'info'}] ${eventData.type || 'VALIDATION'}: ${
    typeof eventData.details === 'object' ? JSON.stringify(eventData.details) : eventData.details || ''
  }`);
}

// Define options interface for unified validation
export interface UnifiedValidationOptions extends ValidationOptions {
  skipCsrf?: boolean;
  rateLimitType?: 'standard' | 'auth' | 'admin' | 'api' | 'public';
  securityLevel?: 'standard' | 'high' | 'critical';
  logFailures?: boolean;
}

/**
 * Create a unified validation middleware that combines:
 * 1. Rate limiting
 * 2. CSRF protection (optional)
 * 3. Schema validation via ValidationEngine
 */
export function createUnifiedValidation(ruleIds: string[], options: UnifiedValidationOptions = {}) {
  // Default options
  const defaultOptions: UnifiedValidationOptions = {
    mode: 'strict',
    target: 'all',
    skipCsrf: false,
    rateLimitType: 'standard',
    securityLevel: 'standard',
    logFailures: true,
    ...options
  };

  // Return combined middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      // 1. Apply rate limiting first
      // Adapt to the existing rate limiting system interface
      // Note: We're using a simplified approach that works with the existing implementation
      const rateLimitResult = {
        allowed: true,
        message: '',
        retryAfter: 0
      };
      
      // Try to use the rate limiting system if available
      try {
        // Check if the rate limiting check method exists
        if (typeof rateLimitingSystem.check === 'function') {
          const result = await rateLimitingSystem.check(req, {
            type: defaultOptions.rateLimitType
          });
          
          // Update with actual result
          rateLimitResult.allowed = result.allowed;
          rateLimitResult.message = result.message;
          rateLimitResult.retryAfter = result.retryAfter;
        } else if (typeof rateLimitingSystem.checkRate === 'function') {
          // Alternative method name
          const result = await rateLimitingSystem.checkRate(req, defaultOptions.rateLimitType);
          
          // Update with actual result
          rateLimitResult.allowed = result.allowed;
          rateLimitResult.message = result.message;
          rateLimitResult.retryAfter = result.retryAfter || 60;
        }
      } catch (error) {
        console.warn('[RATE_LIMIT] Error checking rate limit:', error instanceof Error ? error.message : String(error));
        // Allow the request to continue if rate limiting fails
        rateLimitResult.allowed = true;
      }

      if (!rateLimitResult.allowed) {
        // Log rate limit failure
        if (defaultOptions.logFailures) {
          logSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            severity: 'medium',
            details: {
              path: req.path,
              method: req.method,
              ip: req.ip,
              userId: (req as any).session?.userId,
              limiterType: defaultOptions.rateLimitType,
              retryAfter: rateLimitResult.retryAfter
            }
          });
        }

        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: rateLimitResult.message || 'Too many requests, please try again later',
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // 2. Apply CSRF protection if not skipped
      if (!defaultOptions.skipCsrf && !(req as any).__skipCSRF) {
        // Check if CSRF token is valid - rely on existing CSRF middleware
        // This validation has already been applied by the time we reach this point
        // but we add an explicit check just to be sure
        if (!(req as any).__validCSRF) {
          // Log CSRF failure
          if (defaultOptions.logFailures) {
            logSecurityEvent({
              type: 'CSRF_VALIDATION_FAILED',
              severity: 'high',
              details: {
                path: req.path,
                method: req.method,
                ip: req.ip,
                userId: (req as any).session?.userId,
                headers: req.headers
              }
            });
          }

          return res.status(403).json({
            error: 'CSRF Validation Failed',
            message: 'Invalid or missing CSRF token',
            code: 'CSRF_ERROR'
          });
        }
      }

      // 3. Apply validation rules
      const validationMiddleware = ValidationEngine.createValidationMiddleware(ruleIds, defaultOptions);

      // Execute the validation middleware
      return validationMiddleware(req, res, next);
    } catch (error) {
      // Log unexpected error
      logSecurityEvent({
        type: 'VALIDATION_SYSTEM_ERROR',
        severity: 'high',
        details: {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userId: (req as any).session?.userId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timing: {
            processingTime: Date.now() - startTime
          }
        }
      });

      // Send error response
      return res.status(500).json({
        error: 'Validation System Error',
        message: 'An unexpected error occurred during request validation',
        timestamp: Date.now()
      });
    }
  };
}

/**
 * Apply unified validation to a specific endpoint
 */
export function applyUnifiedValidation(endpoint: string, ruleIds: string[], options: UnifiedValidationOptions = {}) {
  try {
    // Register the validation rules for this endpoint
    ValidationEngine.applyRulesToEndpoint(endpoint, ruleIds);
    
    // Log the registration
    console.log(`[INFO] [UNIFIED_VALIDATION] Applied unified validation to endpoint ${endpoint} with rules: ${ruleIds.join(', ')}`);
    
    return true;
  } catch (error) {
    console.error(`[ERROR] [UNIFIED_VALIDATION] Failed to apply unified validation to endpoint ${endpoint}:`, 
      error instanceof Error ? error.message : String(error));
    
    return false;
  }
}

/**
 * Create validation middleware for a specific endpoint with unified security
 */
export function createEndpointUnifiedValidation(endpoint: string, options: UnifiedValidationOptions = {}) {
  const ruleIds = ValidationEngine['endpoints'].get(endpoint);
  
  if (!ruleIds || ruleIds.length === 0) {
    throw new Error(`No validation rules found for endpoint ${endpoint}`);
  }
  
  return createUnifiedValidation(ruleIds, options);
}