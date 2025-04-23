/**
 * Secure API Router
 * 
 * This module provides a secure router with comprehensive security protections
 * including CSRF protection, input validation, and quantum-resistant security.
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { createCSRFMiddleware } from '../security/csrf/CSRFProtection';
import { validateInputs } from '../security/inputValidation';
import { quantumProtect } from '../security/advanced/quantum/QuantumResistantMiddleware';
import { requireMFAVerification } from '../auth/mfaIntegration';
import { recordApiRequest } from '../security/monitoring/MetricsCollector';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';

/**
 * Create a secure API router with appropriate security middleware
 */
export function createSecureApiRouter(
  options: {
    requireMFA?: boolean;
    csrfProtection?: boolean;
    inputValidation?: boolean;
    quantumProtection?: boolean;
    logRequests?: boolean;
  } = {}
): Router {
  // Set default options
  const config = {
    requireMFA: true,
    csrfProtection: true,
    inputValidation: true,
    quantumProtection: true,
    logRequests: true,
    ...options
  };
  
  // Create router
  const router = express.Router();
  
  // Add request logging middleware
  if (config.logRequests) {
    router.use((req: Request, res: Response, next: NextFunction) => {
      // Record API request
      recordApiRequest(false);
      
      // Continue to next middleware
      next();
    });
  }
  
  // Add CSRF protection
  if (config.csrfProtection) {
    const csrfMiddleware = createCSRFMiddleware();
    router.use(csrfMiddleware);
  }
  
  // Add MFA verification
  if (config.requireMFA) {
    router.use(requireMFAVerification('/auth/mfa'));
  }
  
  // Add input validation
  if (config.inputValidation) {
    router.use(validateInputs());
  }
  
  // Add quantum-resistant protection
  if (config.quantumProtection) {
    router.use(quantumProtect());
  }
  
  // Add error handling
  router.use((err, req: Request, res: Response, next: NextFunction) => {
    // Log the error
    logSecurityEvent({
      category: SecurityEventCategory.API_SECURITY,
      severity: SecurityEventSeverity.ERROR,
      message: 'Error in secure API route',
      data: {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack
      }
    });
    
    // Record blocked request if it's a security error
    if (err.isSecurityError) {
      recordApiRequest(true);
    }
    
    // Pass to next error handler
    next(err);
  });
  
  return router;
}

/**
 * Create a secure read-only API router (GET requests only)
 */
export function createSecureReadOnlyApiRouter(
  options: {
    requireMFA?: boolean;
    csrfProtection?: boolean;
    inputValidation?: boolean;
    quantumProtection?: boolean;
    logRequests?: boolean;
  } = {}
): Router {
  const router = createSecureApiRouter(options);
  
  // Block non-GET requests
  router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      logSecurityEvent({
        category: SecurityEventCategory.API_SECURITY,
        severity: SecurityEventSeverity.WARNING,
        message: 'Non-GET request to read-only API',
        data: {
          path: req.path,
          method: req.method,
          ip: req.ip
        }
      });
      
      // Record blocked request
      recordApiRequest(true);
      
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'This API endpoint only supports GET requests'
      });
    }
    
    next();
  });
  
  return router;
}

/**
 * Create a public API router (minimal security)
 */
export function createPublicApiRouter(
  options: {
    inputValidation?: boolean;
    logRequests?: boolean;
  } = {}
): Router {
  // Set default options
  const config = {
    inputValidation: true,
    logRequests: true,
    ...options
  };
  
  // Create router
  const router = express.Router();
  
  // Add request logging middleware
  if (config.logRequests) {
    router.use((req: Request, res: Response, next: NextFunction) => {
      // Record API request
      recordApiRequest(false);
      
      // Continue to next middleware
      next();
    });
  }
  
  // Add input validation
  if (config.inputValidation) {
    router.use(validateInputs());
  }
  
  return router;
}

export default createSecureApiRouter;