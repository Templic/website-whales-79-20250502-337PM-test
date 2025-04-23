/**
 * API Routes Protector
 * 
 * This module provides comprehensive protection for API routes by applying various
 * security middleware to API endpoints, including quantum-resistant cryptography protection.
 * 
 * Key features:
 * - Runtime Application Self-Protection (RASP)
 * - API security checks (parameter validation, injection prevention)
 * - Input sanitization and validation
 * - Quantum-resistant cryptography for sensitive routes
 * - Machine learning-based anomaly detection
 * - Rate limiting and abuse prevention
 * - Request/response integrity verification
 * - Immutable audit logging via blockchain
 */

import type { Express, RequestHandler } from 'express';
import { createQuantumResistantMiddleware } from './advanced/quantum/QuantumResistantMiddleware';
import { raspManager } from './advanced/rasp';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import { securityPolicyEnforcer } from './apiSecurityPolicyEnforcer';
import rateLimit from 'express-rate-limit';
import { createInputValidationMiddleware } from './inputValidation';

/**
 * API Protection options
 */
export interface ApiProtectionOptions {
  /**
   * Enable RASP protection
   */
  enableRASP?: boolean;
  
  /**
   * Enable API security checks
   */
  enableApiSecurity?: boolean;
  
  /**
   * Enable default input validation
   */
  enableDefaultValidation?: boolean;
  
  /**
   * Enable sensitive procedures (more thorough but slower security checks)
   */
  enableSensitiveProcedures?: boolean;
  
  /**
   * Enable quantum-resistant cryptography for sensitive routes
   */
  enableQuantumResistance?: boolean;
  
  /**
   * Enable rate limiting to prevent abuse
   */
  enableRateLimiting?: boolean;
  
  /**
   * Enable blockchain-based audit logging
   */
  enableBlockchainAudit?: boolean;
  
  /**
   * Paths to exclude from protection
   */
  excludePaths?: string[];
  
  /**
   * Additional middlewares to apply
   */
  additionalMiddlewares?: RequestHandler[];
  
  /**
   * Rate limit options (requests per window)
   */
  rateLimit?: {
    windowMs: number;
    max: number;
    message?: string;
  };
}

/**
 * Protect API routes with security middleware
 */
export function protectApiRoutes(app: Express, options: ApiProtectionOptions = {}): void {
  const {
    enableRASP = true,
    enableApiSecurity = true,
    enableDefaultValidation = true,
    enableSensitiveProcedures = false,
    enableQuantumResistance = false,
    enableRateLimiting = true,
    enableBlockchainAudit = true,
    excludePaths = [
      '/api/health',
      '/api/public',
      '/api/webhooks',
      '/api/external-callbacks',
      '/api/stripe-webhook'
    ],
    additionalMiddlewares = [],
    rateLimit: rateLimitOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    }
  } = options;
  
  // Log protection options
  console.log('[API-PROTECTION] Protecting API routes with options:', {
    enableRASP,
    enableApiSecurity,
    enableDefaultValidation,
    enableSensitiveProcedures,
    enableQuantumResistance,
    enableRateLimiting,
    enableBlockchainAudit,
    excludePaths: excludePaths.join(', '),
    additionalMiddlewares: additionalMiddlewares.length
  });
  
  // Middleware for audit logging
  const auditMiddleware = async (req: any, res: any, next: any) => {
    const requestStartTime = Date.now();
    const originalUrl = req.originalUrl || req.url;
    const method = req.method;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Capture the original end method to hook into response
    const originalEnd = res.end;
    
    // Override the end method
    res.end = function(chunk: any, encoding: any) {
      // Get response time
      const responseTime = Date.now() - requestStartTime;
      
      // Restore the original end method
      res.end = originalEnd;
      
      // Call the original end method
      res.end(chunk, encoding);
      
      // Log the request to blockchain if enabled
      if (enableBlockchainAudit) {
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.API,
          severity: SecurityEventSeverity.INFO,
          message: `API Request: ${method} ${originalUrl}`,
          timestamp: Date.now(),
          metadata: {
            method,
            path: originalUrl,
            statusCode: res.statusCode,
            responseTime,
            ip,
            userAgent,
            timestamp: new Date().toISOString()
          }
        }).catch(error => {
          console.error('Error logging API request:', error);
        });
      }
    };
    
    next();
  };
  
  // Apply middleware to all API routes except excluded paths
  app.use('/api', (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Continue to next middleware
    next();
  });
  
  // Apply audit logging middleware to all API routes
  app.use('/api', auditMiddleware);
  
  // Apply rate limiting if enabled
  if (enableRateLimiting) {
    app.use('/api', rateLimit({
      windowMs: rateLimitOptions.windowMs,
      max: rateLimitOptions.max,
      message: rateLimitOptions.message,
      standardHeaders: true,
      legacyHeaders: false,
    }));
    console.log('[API-PROTECTION] Rate limiting enabled');
  }
  
  // Apply RASP protection if enabled
  if (enableRASP) {
    // Apply RASP protection middleware
    app.use('/api', (req, res, next) => {
      // Skip excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      try {
        // Apply RASP protections
        const raspResult = raspManager.protectRequest(req);
        
        if (raspResult.block) {
          // Log blocked request
          securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.API,
            severity: SecurityEventSeverity.WARNING,
            message: `Blocked malicious request: ${raspResult.reason}`,
            timestamp: Date.now(),
            metadata: {
              reason: raspResult.reason,
              path: req.path,
              method: req.method,
              ip: req.ip || req.connection.remoteAddress
            }
          }).catch(console.error);
          
          return res.status(403).json({
            error: 'Access Denied',
            message: 'This request has been blocked for security reasons.'
          });
        }
        
        next();
      } catch (error) {
        // Continue in case of RASP error to avoid blocking legitimate requests
        console.error('RASP error:', error);
        next();
      }
    });
    
    console.log('[API-PROTECTION] RASP protection enabled');
  }
  
  // Apply API security checks if enabled
  if (enableApiSecurity) {
    // Apply security policy enforcer middleware
    app.use('/api', (req, res, next) => {
      // Skip excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      try {
        const securityResult = securityPolicyEnforcer.checkRequest(req);
        
        if (securityResult.block) {
          // Log blocked request
          securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.API,
            severity: SecurityEventSeverity.WARNING,
            message: `Security policy violation: ${securityResult.reason}`,
            timestamp: Date.now(),
            metadata: {
              reason: securityResult.reason,
              path: req.path,
              method: req.method,
              ip: req.ip || req.connection.remoteAddress
            }
          }).catch(console.error);
          
          return res.status(403).json({
            error: 'Security Violation',
            message: 'This request violates security policies.'
          });
        }
        
        next();
      } catch (error) {
        // Log the error but allow the request to continue
        console.error('API security check error:', error);
        next();
      }
    });
    
    console.log('[API-PROTECTION] API security checks enabled');
  }
  
  // Apply default input validation if enabled
  if (enableDefaultValidation) {
    // Apply input validation middleware to all API routes except excluded paths
    app.use('/api', (req, res, next) => {
      // Skip excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      try {
        // Apply appropriate validation based on endpoint
        const validationMiddleware = createInputValidationMiddleware({
          thorough: enableSensitiveProcedures
        });
        
        // Call the validation middleware
        validationMiddleware(req, res, next);
      } catch (error) {
        // Log the error but allow the request to continue
        console.error('Input validation error:', error);
        next();
      }
    });
    
    console.log('[API-PROTECTION] Default input validation enabled');
  }
  
  // Apply quantum-resistant cryptography middleware if enabled
  if (enableQuantumResistance) {
    // Create and apply quantum-resistant middleware
    const quantumMiddleware = createQuantumResistantMiddleware({
      protectedPaths: [
        '/api/user',
        '/api/auth',
        '/api/security',
        '/api/payment',
        '/api/admin'
      ],
      exemptPaths: excludePaths,
      encryptResponses: true,
      verifyRequestSignatures: true,
      bypassInDevelopment: process.env.NODE_ENV === 'development'
    });
    
    // Apply the middleware
    app.use('/api', quantumMiddleware);
    
    // Add endpoint to provide the server's quantum-resistant public key
    app.get('/api/security/quantum-key', (req, res, next) => {
      try {
        import('./advanced/quantum/QuantumResistantMiddleware')
          .then(module => {
            const middleware = module.createPublicKeyEndpointMiddleware();
            middleware(req, res, next);
          })
          .catch(error => {
            console.error('Error loading quantum middleware:', error);
            res.status(500).json({
              error: 'Internal Server Error',
              message: 'Failed to provide quantum key'
            });
          });
      } catch (error) {
        console.error('Error in quantum key endpoint:', error);
        next(error);
      }
    });
    
    console.log('[API-PROTECTION] Quantum-resistant protection enabled');
  }
  
  // Apply sensitive procedures if enabled
  if (enableSensitiveProcedures) {
    // Apply sensitive procedures middleware
    app.use('/api', (req, res, next) => {
      // Skip excluded paths
      if (excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }
      
      // Add additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Implement content security policy
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
      
      // Implement additional security checks for sensitive endpoints
      if (req.path.includes('/api/admin') || req.path.includes('/api/security') || req.path.includes('/api/payment')) {
        // Log sensitive endpoint access
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.API,
          severity: SecurityEventSeverity.INFO,
          message: `Sensitive endpoint access: ${req.path}`,
          timestamp: Date.now(),
          metadata: {
            path: req.path,
            method: req.method,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        }).catch(console.error);
      }
      
      next();
    });
    
    console.log('[API-PROTECTION] Sensitive procedures enabled');
  }
  
  // Apply additional middlewares
  if (additionalMiddlewares.length > 0) {
    app.use('/api', additionalMiddlewares);
    console.log(`[API-PROTECTION] Applied ${additionalMiddlewares.length} additional middlewares`);
  }
  
  console.log('[API-PROTECTION] API routes protection setup complete');
}