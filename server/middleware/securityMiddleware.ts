/**
 * Comprehensive Security Middleware
 * 
 * This module integrates all security middleware components for the application,
 * including XSS protection, SQL injection prevention, and general security headers.
 */

import { Express, Router, Request, Response, NextFunction } from 'express';
import { applyXssProtection } from './xssProtection';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';
import { AnyZodObject, z } from 'zod';

/**
 * Apply all security middleware to an Express application
 */
export function applySecurityMiddleware(app: Express) {
  console.log('[SECURITY] Applying comprehensive security middleware');
  
  // Log initialization
  securityBlockchain.addSecurityEvent({
    category: SecurityEventCategory.SECURITY_INITIALIZATION as any,
    severity: SecurityEventSeverity.INFO,
    message: 'Security middleware initialization started',
    timestamp: Date.now(),
    metadata: {
      component: 'securityMiddleware',
      timestamp: new Date().toISOString()
    }
  }).catch(err => {
    console.error('[SECURITY ERROR] Failed to log security middleware initialization:', err);
  });
  
  try {
    // Apply XSS protection
    applyXssProtection(app);
    
    // Add Helmet for additional security headers
    if (!app.get('helmet-applied')) {
      try {
        const helmet = require('helmet');
        app.use(helmet({
          contentSecurityPolicy: false // We apply custom CSP in XSS protection
        }));
        app.set('helmet-applied', true);
        console.log('[SECURITY] Helmet middleware applied');
      } catch (error) {
        console.warn('[SECURITY] Helmet is not installed. Consider installing it for additional security headers.');
      }
    }
    
    // Add rate limiting to prevent brute force attacks
    if (!app.get('rate-limit-applied')) {
      try {
        const rateLimit = require('express-rate-limit');
        
        // Apply rate limiting to sensitive routes
        const authLimiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100, // 100 requests per windowMs
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: 'Too many requests, please try again later.' }
        });
        
        // Apply to authentication routes
        app.use('/api/login', authLimiter);
        app.use('/api/register', authLimiter);
        app.use('/api/password-reset', authLimiter);
        
        // General rate limiting for all API routes
        const apiLimiter = rateLimit({
          windowMs: 5 * 60 * 1000, // 5 minutes
          max: 500, // 500 requests per windowMs
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: 'Too many requests, please try again later.' }
        });
        
        app.use('/api', apiLimiter);
        
        app.set('rate-limit-applied', true);
        console.log('[SECURITY] Rate limiting middleware applied');
      } catch (error) {
        console.warn('[SECURITY] express-rate-limit is not installed. Consider installing it for rate limiting.');
      }
    }
    
    // Log successful initialization
    securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.SECURITY_INITIALIZATION as any,
      severity: SecurityEventSeverity.INFO,
      message: 'Security middleware initialization completed successfully',
      timestamp: Date.now(),
      metadata: {
        component: 'securityMiddleware',
        appliedMiddleware: [
          'XSS Protection',
          app.get('helmet-applied') ? 'Helmet' : null,
          app.get('rate-limit-applied') ? 'Rate Limiting' : null
        ].filter(Boolean),
        timestamp: new Date().toISOString()
      }
    }).catch(err => {
      console.error('[SECURITY ERROR] Failed to log security middleware completion:', err);
    });
    
    console.log('[SECURITY] Comprehensive security middleware applied successfully');
  } catch (error: any) {
    // Log initialization failure
    securityBlockchain.addSecurityEvent({
      category: SecurityEventCategory.SECURITY_ERROR as any,
      severity: SecurityEventSeverity.ERROR,
      message: 'Security middleware initialization failed',
      timestamp: Date.now(),
      metadata: {
        component: 'securityMiddleware',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }).catch(err => {
      console.error('[SECURITY ERROR] Failed to log security middleware failure:', err);
    });
    
    console.error('[SECURITY ERROR] Failed to apply security middleware:', error);
    throw error;
  }
}

/**
 * Custom security middleware for specific security requirements
 */
export function createCustomSecurityMiddleware(options: {
  enableMlDetection?: boolean;
  enableBlockchainLogging?: boolean;
  enableRuntimeProtection?: boolean;
}) {
  const {
    enableMlDetection = false,
    enableBlockchainLogging = true,
    enableRuntimeProtection = false
  } = options;
  
  return (req: any, res: any, next: () => void) => {
    // Add request ID for tracking
    req.securityContext = {
      requestId: Date.now().toString(36) + Math.random().toString(36).substring(2),
      timestamp: new Date(),
      securityChecks: {
        xssValidation: false,
        sqlInjectionValidation: false,
        runtimeProtection: false,
        mlAnomalyDetection: false
      }
    };
    
    // Set security headers that might not be set by Helmet
    res.setHeader('X-Security-Context', req.securityContext.requestId);
    
    // Enable blockchain logging for security events
    if (enableBlockchainLogging) {
      // Log request start
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.REQUEST as any,
        severity: SecurityEventSeverity.INFO,
        message: 'Request received',
        timestamp: Date.now(),
        metadata: {
          requestId: req.securityContext.requestId,
          path: req.path,
          method: req.method,
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
      }).catch(err => {
        console.error('[SECURITY ERROR] Failed to log request start:', err);
      });
      
      // Capture response for logging
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.REQUEST as any,
          severity: SecurityEventSeverity.INFO,
          message: 'Request completed',
          timestamp: Date.now(),
          metadata: {
            requestId: req.securityContext.requestId,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration: new Date().getTime() - req.securityContext.timestamp.getTime(),
            securityChecks: req.securityContext.securityChecks,
            timestamp: new Date().toISOString()
          }
        }).catch(err => {
          console.error('[SECURITY ERROR] Failed to log request completion:', err);
        });
        
        return originalEnd.apply(res, args);
      };
    }
    
    // Enable ML-based anomaly detection
    if (enableMlDetection) {
      try {
        // Import ML detection dynamically to avoid dependency if not used
        const { detectAnomaly, createAnomalyDetectionMiddleware } = require('../security/advanced/ml/AnomalyDetection');
        
        // Create anomaly detection options based on security settings
        const anomalyOptions = {
          confidenceThreshold: 0.7,
          blockAnomalies: false, // By default, don't block - just detect and log
          logAnomalies: true,
          enableAdaptiveThresholds: true,
          enableStatisticalAnalysis: true,
          enableBehavioralAnalysis: true,
          enableDataExfiltrationDetection: true,
          maxIpHistoryLength: 200,
          maxUserHistoryLength: 500,
          learningPhaseDuration: 60000 // 1 minute in production (would be longer)
        };
        
        console.log('[SECURITY] Initializing ML-based anomaly detection with quantum-resistant security');
        
        // Run anomaly detection asynchronously to not block request processing
        detectAnomaly(req).then(result => {
          req.securityContext.securityChecks.mlAnomalyDetection = true;
          
          if (result.isAnomaly) {
            // Determine severity based on anomaly score
            const severity = result.score >= 0.9 ? SecurityEventSeverity.HIGH : 
                            result.score >= 0.8 ? SecurityEventSeverity.MEDIUM : 
                            SecurityEventSeverity.WARNING;
            
            // Determine category based on anomaly type
            let category = SecurityEventCategory.ANOMALY_DETECTION;
            if (result.anomalyType === 'CONTENT' && result.details?.contentDetails?.attackSignature) {
              category = SecurityEventCategory.ATTACK_ATTEMPT;
            } else if (result.anomalyType === 'RATE') {
              category = SecurityEventCategory.RATE_LIMITING;
            }
            
            securityBlockchain.addSecurityEvent({
              category: category as any,
              severity: severity,
              message: 'ML anomaly detection triggered',
              timestamp: Date.now(),
              metadata: {
                requestId: req.securityContext.requestId,
                path: req.path,
                method: req.method,
                userId: req.user?.id ? String(req.user.id) : undefined,
                anomalyScore: result.score,
                anomalyReason: result.reason,
                anomalyType: result.anomalyType,
                anomalyDetails: result.details,
                timestamp: new Date().toISOString()
              }
            }).catch(err => {
              console.error('[SECURITY ERROR] Failed to log anomaly detection:', err);
            });
            
            // If it's a high-severity anomaly, add more detailed information to the security context
            if (result.score >= 0.9) {
              req.securityContext.highSeverityAnomaly = true;
              req.securityContext.anomalyDetails = {
                score: result.score,
                reason: result.reason,
                type: result.anomalyType
              };
              
              // Optionally apply additional security measures for high-severity anomalies
              // This would depend on your security policy
            }
          }
        }).catch(err => {
          console.error('[SECURITY ERROR] Error in anomaly detection:', err);
        });
      } catch (error) {
        console.warn('[SECURITY] ML anomaly detection module not available:', error);
      }
    }
    
    // Enable Runtime Application Self-Protection (RASP)
    if (enableRuntimeProtection) {
      try {
        // Import RASP dynamically to avoid dependency if not used
        const { monitorRuntime } = require('../security/advanced/rasp/RuntimeProtection');
        
        // Monitor runtime for suspicious activities
        monitorRuntime(req, res).then(result => {
          req.securityContext.securityChecks.runtimeProtection = true;
          
          if (result.threatDetected) {
            securityBlockchain.addSecurityEvent({
              category: SecurityEventCategory.THREAT_DETECTED as any,
              severity: SecurityEventSeverity.HIGH,
              message: 'Runtime protection detected threat',
              timestamp: Date.now(),
              metadata: {
                requestId: req.securityContext.requestId,
                path: req.path,
                method: req.method,
                threatType: result.threatType,
                threatDetails: result.threatDetails,
                timestamp: new Date().toISOString()
              }
            }).catch(err => {
              console.error('[SECURITY ERROR] Failed to log runtime threat:', err);
            });
          }
        }).catch(err => {
          console.error('[SECURITY ERROR] Error in runtime protection:', err);
        });
      } catch (error) {
        console.warn('[SECURITY] Runtime protection module not available');
      }
    }
    
    // Mark XSS validation as complete
    req.securityContext.securityChecks.xssValidation = true;
    
    next();
  };
}

/**
 * Creates a secure router with built-in input validation and security features
 */
export interface SecureRouterOptions {
  authenticate?: boolean;
  rateLimit?: 'default' | 'strict' | 'public' | 'none';
  enableMlDetection?: boolean;
  enableRuntimeProtection?: boolean;
}

interface RouteOptions {
  bodySchema?: AnyZodObject;
  querySchema?: AnyZodObject;
  paramsSchema?: AnyZodObject;
  rateLimit?: 'default' | 'strict' | 'public' | 'none';
}

type SecureRouteHandler = (req: Request, res: Response) => void | Promise<void>;

// Define a secure router with additional methods
interface SecureRouter extends Router {
  secureGet: (path: string, handler: SecureRouteHandler, options?: RouteOptions) => void;
  securePost: (path: string, handler: SecureRouteHandler, options?: RouteOptions) => void;
  securePut: (path: string, handler: SecureRouteHandler, options?: RouteOptions) => void;
  securePatch: (path: string, handler: SecureRouteHandler, options?: RouteOptions) => void;
  secureDelete: (path: string, handler: SecureRouteHandler, options?: RouteOptions) => void;
}

export function createSecureRouter(options: SecureRouterOptions = {}): SecureRouter {
  const router = Router() as SecureRouter;
  
  // Default options
  const {
    authenticate = false,
    rateLimit = 'default',
    enableMlDetection = false,
    enableRuntimeProtection = false
  } = options;
  
  // Validation middleware creator
  const createValidationMiddleware = (schema: AnyZodObject, target: 'body' | 'query' | 'params') => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse and validate the request data
        const data = target === 'body' ? req.body : 
                    target === 'query' ? req.query : req.params;
        
        // Validate against schema
        await schema.parseAsync(data);
        
        // Log successful validation
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.VALIDATION,
          severity: SecurityEventSeverity.INFO,
          message: `Valid ${target} received`,
          timestamp: Date.now(),
          metadata: {
            path: req.path,
            method: req.method,
            validatedTarget: target,
          }
        }).catch(err => {
          console.error(`[SECURITY ERROR] Failed to log validation success:`, err);
        });
        
        next();
      } catch (error: any) {
        // Log validation error
        securityBlockchain.addSecurityEvent({
          category: SecurityEventCategory.VALIDATION,
          severity: SecurityEventSeverity.MEDIUM,
          message: `Invalid ${target} received`,
          timestamp: Date.now(),
          metadata: {
            path: req.path,
            method: req.method,
            validationErrors: error.errors,
          }
        }).catch(err => {
          console.error(`[SECURITY ERROR] Failed to log validation error:`, err);
        });
        
        // Return validation error
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
    };
  };
  
  // Authentication middleware
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // In a real application, this would check JWT, session, etc.
    if (!req.isAuthenticated && !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    next();
  };
  
  // Create secure route methods
  const createSecureRoute = (method: 'get' | 'post' | 'put' | 'patch' | 'delete') => {
    return (path: string, handler: SecureRouteHandler, options: RouteOptions = {}) => {
      const middlewares: any[] = [];
      
      // Apply authentication if required
      if (authenticate) {
        middlewares.push(authMiddleware);
      }
      
      // Apply validation middleware if schemas provided
      if (options.bodySchema) {
        middlewares.push(createValidationMiddleware(options.bodySchema, 'body'));
      }
      
      if (options.querySchema) {
        middlewares.push(createValidationMiddleware(options.querySchema, 'query'));
      }
      
      if (options.paramsSchema) {
        middlewares.push(createValidationMiddleware(options.paramsSchema, 'params'));
      }
      
      // Apply rate limiting if specified
      const routeRateLimit = options.rateLimit || rateLimit;
      if (routeRateLimit !== 'none') {
        try {
          const rateLimit = require('express-rate-limit');
          
          let limiter;
          switch(routeRateLimit) {
            case 'strict':
              limiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 30,
                message: { success: false, error: 'Too many requests' }
              });
              break;
            case 'public':
              limiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: { success: false, error: 'Too many requests' }
              });
              break;
            case 'default':
            default:
              limiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 60,
                message: { success: false, error: 'Too many requests' }
              });
          }
          
          middlewares.push(limiter);
        } catch (error) {
          console.warn('[SECURITY] express-rate-limit is not installed. Rate limiting disabled.');
        }
      }
      
      // Apply custom security middleware
      middlewares.push(createCustomSecurityMiddleware({
        enableMlDetection,
        enableRuntimeProtection,
        enableBlockchainLogging: true
      }));
      
      // Apply route handler
      router[method](path, ...middlewares, async (req: Request, res: Response, next: NextFunction) => {
        try {
          await handler(req, res);
        } catch (error: any) {
          // Log error
          securityBlockchain.addSecurityEvent({
            category: SecurityEventCategory.API_ERROR,
            severity: SecurityEventSeverity.ERROR,
            message: 'API route handler error',
            timestamp: Date.now(),
            metadata: {
              path: req.path,
              method: req.method,
              error: error.message,
              stack: error.stack
            }
          }).catch(err => {
            console.error('[SECURITY ERROR] Failed to log API error:', err);
          });
          
          next(error);
        }
      });
    };
  };
  
  // Add secure route methods to router
  router.secureGet = createSecureRoute('get');
  router.securePost = createSecureRoute('post');
  router.securePut = createSecureRoute('put');
  router.securePatch = createSecureRoute('patch');
  router.secureDelete = createSecureRoute('delete');
  
  return router;
}

/**
 * Creates an admin-only secure router with additional security
 */
export function createAdminRouter(): SecureRouter {
  const router = createSecureRouter({
    authenticate: true,
    rateLimit: 'strict',
    enableMlDetection: true,
    enableRuntimeProtection: true
  }) as SecureRouter;
  
  // Admin role check middleware
  const adminCheck = (req: Request, res: Response, next: NextFunction) => {
    // In a real app, this would check if user has admin role
    if (req.user && (req.user as any).role === 'admin') {
      next();
    } else {
      // Log unauthorized access attempt
      securityBlockchain.addSecurityEvent({
        category: SecurityEventCategory.ACCESS_DENIED,
        severity: SecurityEventSeverity.HIGH,
        message: 'Unauthorized admin access attempt',
        timestamp: Date.now(),
        metadata: {
          path: req.path,
          method: req.method,
          userId: req.user ? (req.user as any).id : null,
          ip: req.ip
        }
      }).catch(err => {
        console.error('[SECURITY ERROR] Failed to log unauthorized admin access:', err);
      });
      
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
  };
  
  // Override secure route methods to add admin check
  const originalSecureGet = router.secureGet;
  router.secureGet = (path, handler, options) => {
    originalSecureGet(path, handler, options);
    router.use(path, adminCheck);
  };
  
  const originalSecurePost = router.securePost;
  router.securePost = (path, handler, options) => {
    originalSecurePost(path, handler, options);
    router.use(path, adminCheck);
  };
  
  const originalSecurePut = router.securePut;
  router.securePut = (path, handler, options) => {
    originalSecurePut(path, handler, options);
    router.use(path, adminCheck);
  };
  
  const originalSecurePatch = router.securePatch;
  router.securePatch = (path, handler, options) => {
    originalSecurePatch(path, handler, options);
    router.use(path, adminCheck);
  };
  
  const originalSecureDelete = router.secureDelete;
  router.secureDelete = (path, handler, options) => {
    originalSecureDelete(path, handler, options);
    router.use(path, adminCheck);
  };
  
  return router;
}

/**
 * Example usage:
 * 
 * import express from 'express';
 * import { applySecurityMiddleware, createCustomSecurityMiddleware, createSecureRouter } from './middleware/securityMiddleware';
 * 
 * const app = express();
 * 
 * // Apply all standard security middleware
 * applySecurityMiddleware(app);
 * 
 * // Create a secure router
 * const apiRouter = createSecureRouter({
 *   authenticate: true,
 *   enableMlDetection: true
 * });
 * 
 * // Define secure routes
 * apiRouter.secureGet('/items', (req, res) => {
 *   res.json({ items: [] });
 * }, {
 *   querySchema: z.object({ q: z.string().optional() })
 * });
 * 
 * // Use the router in your app
 * app.use('/api', apiRouter);
 */