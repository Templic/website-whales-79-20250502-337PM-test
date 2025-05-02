/**
 * Security Middleware
 * 
 * This module provides Express middleware functions for security features,
 * using lazy loading to optimize performance.
 */

import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

import { securityManager, SecurityMode } from '../SecurityManager';
import { SecurityComponentName } from '../SecurityComponentRegistry';

/**
 * Initialize security middleware with the specified mode
 */
export async function initializeSecurity(
  mode: SecurityMode = SecurityMode.STANDARD,
  options: {
    defer?: boolean;
    timeout?: number;
  } = {}
): Promise<void> {
  return securityManager.initialize(mode, options);
}

/**
 * Main security middleware that applies all active security protections
 */
export function securityMiddleware() {
  return securityManager.createSecurityMiddleware();
}

/**
 * Create middleware that applies CSRF protection
 */
export function csrfProtection() {
  return securityManager.ensureComponentMiddleware(SecurityComponentName.PROTECTION_CSRFGUARD);
}

/**
 * Create middleware that applies XSS protection
 */
export function xssProtection() {
  return securityManager.ensureComponentMiddleware(SecurityComponentName.PROTECTION_XSSGUARD);
}

/**
 * Create middleware that applies SQL injection protection
 */
export function sqlInjectionProtection() {
  return securityManager.ensureComponentMiddleware(SecurityComponentName.PROTECTION_INJECTION_GUARD);
}

/**
 * Create middleware that applies rate limiting
 */
export function rateLimiting(
  options: {
    windowMs?: number;
    maxRequests?: number;
    message?: string;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure component is loaded
      const rateLimiter = await securityManager.getComponent(SecurityComponentName.PROTECTION_RATE_LIMITER);
      
      // Configure rate limiter if options are provided
      if (Object.keys(options).length > 0) {
        rateLimiter.configure(options);
      }
      
      // Apply rate limiting
      await rateLimiter.check(req, res);
      next();
    } catch (error) {
      // If it's a rate limit error, return 429
      if ((error as any)?.code === 'RATE_LIMIT_EXCEEDED') {
        return res.status(429).json({
          error: 'Too many requests',
          message: options.message || 'Rate limit exceeded. Please try again later.'
        });
      }
      
      console.error(chalk.red('[securityMiddleware] Rate limiting error:'), error);
      next(error);
    }
  };
}

/**
 * Create middleware that applies brute force protection
 */
export function bruteForceProtection(
  options: {
    store?: string;
    freeRetries?: number;
    minWait?: number;
    maxWait?: number;
    lifetime?: number;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure component is loaded
      const bruteForce = await securityManager.getComponent(SecurityComponentName.PROTECTION_BRUTE_FORCE);
      
      // Configure brute force protection if options are provided
      if (Object.keys(options).length > 0) {
        bruteForce.configure(options);
      }
      
      // Apply brute force protection
      await bruteForce.prevent(req, res, next);
    } catch (error) {
      console.error(chalk.red('[securityMiddleware] Brute force protection error:'), error);
      next(error);
    }
  };
}

/**
 * Create middleware that ensures API requests are validated
 */
export function apiValidation() {
  return securityManager.ensureComponentMiddleware(SecurityComponentName.API_VALIDATOR);
}

/**
 * Create middleware that applies threat detection (non-blocking)
 */
export function threatDetection() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure component is loaded
      const threatDetector = await securityManager.getComponent(SecurityComponentName.DETECTION_THREAT_DETECTOR);
      
      // Start threat detection in background (non-blocking)
      threatDetector.detect(req).catch(err => {
        console.error(chalk.red('[securityMiddleware] Threat detection error:'), err);
      });
      
      next();
    } catch (error) {
      console.error(chalk.red('[securityMiddleware] Threat detection initialization error:'), error);
      next(); // Continue even if threat detection fails
    }
  };
}

/**
 * Create middleware that enables blockchain logging
 */
export function blockchainLogging() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure component is loaded
      await securityManager.getComponent(SecurityComponentName.ADVANCED_BLOCKCHAIN_LOGGER);
      
      // Store original res.end to intercept it
      const originalEnd = res.end;
      
      // Override res.end to capture response before sending
      res.end = function(chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
        try {
          // Get blockchain logger
          const blockchainLogger = securityManager.getComponentSync(SecurityComponentName.ADVANCED_BLOCKCHAIN_LOGGER);
          
          if (blockchainLogger) {
            // Log to blockchain (non-blocking)
            blockchainLogger.logApiCall(req, res, chunk).catch(err => {
              console.error(chalk.red('[securityMiddleware] Blockchain logging error:'), err);
            });
          }
        } catch (error) {
          console.error(chalk.red('[securityMiddleware] Blockchain logging error:'), error);
        }
        
        // Call original end method
        return originalEnd.call(this, chunk, encoding, cb);
      } as typeof res.end;
      
      next();
    } catch (error) {
      console.error(chalk.red('[securityMiddleware] Blockchain logging initialization error:'), error);
      next(); // Continue even if blockchain logging fails
    }
  };
}

/**
 * Create middleware that applies quantum resistance to sensitive routes
 */
export function quantumResistance() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure component is loaded
      const quantumResistance = await securityManager.getComponent(SecurityComponentName.ADVANCED_QUANTUM_RESISTANCE);
      
      // Apply quantum resistance
      await quantumResistance.protect(req, res);
      next();
    } catch (error) {
      console.error(chalk.red('[securityMiddleware] Quantum resistance error:'), error);
      next(); // Continue even if quantum resistance fails
    }
  };
}

/**
 * Create middleware for applying security settings to specific routes
 */
export function applySecuritySettings(
  settings: {
    csrfProtection?: boolean;
    xssProtection?: boolean;
    sqlInjectionProtection?: boolean;
    rateLimiting?: boolean | {
      windowMs?: number;
      maxRequests?: number;
      message?: string;
    };
    bruteForceProtection?: boolean | {
      store?: string;
      freeRetries?: number;
      minWait?: number;
      maxWait?: number;
      lifetime?: number;
    };
    apiValidation?: boolean;
    threatDetection?: boolean;
    blockchainLogging?: boolean;
    quantumResistance?: boolean;
  } = {}
) {
  const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];
  
  // Add requested security middlewares
  if (settings.csrfProtection) {
    middlewares.push(csrfProtection());
  }
  
  if (settings.xssProtection) {
    middlewares.push(xssProtection());
  }
  
  if (settings.sqlInjectionProtection) {
    middlewares.push(sqlInjectionProtection());
  }
  
  if (settings.rateLimiting) {
    middlewares.push(rateLimiting(
      typeof settings.rateLimiting === 'object' ? settings.rateLimiting : {}
    ));
  }
  
  if (settings.bruteForceProtection) {
    middlewares.push(bruteForceProtection(
      typeof settings.bruteForceProtection === 'object' ? settings.bruteForceProtection : {}
    ));
  }
  
  if (settings.apiValidation) {
    middlewares.push(apiValidation());
  }
  
  if (settings.threatDetection) {
    middlewares.push(threatDetection());
  }
  
  if (settings.blockchainLogging) {
    middlewares.push(blockchainLogging());
  }
  
  if (settings.quantumResistance) {
    middlewares.push(quantumResistance());
  }
  
  // Return middleware that applies all the selected protections
  return (req: Request, res: Response, next: NextFunction) => {
    // Execute middlewares in sequence
    const executeMiddleware = (index: number) => {
      if (index >= middlewares.length) {
        return next();
      }
      
      middlewares[index](req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };
    
    executeMiddleware(0);
  };
}

/**
 * Create middleware for maximum security (applies all protections)
 */
export function maximumSecurity() {
  return applySecuritySettings({
    csrfProtection: true,
    xssProtection: true,
    sqlInjectionProtection: true,
    rateLimiting: true,
    bruteForceProtection: true,
    apiValidation: true,
    threatDetection: true,
    blockchainLogging: true,
    quantumResistance: true
  });
}

// Export the security manager for direct access
export { securityManager };