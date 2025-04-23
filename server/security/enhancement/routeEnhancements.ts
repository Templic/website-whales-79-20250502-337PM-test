/**
 * Route Security Enhancements
 * 
 * This module provides functions to enhance route security by applying input validation,
 * rate limiting, and other security measures to existing routes.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validate, validateRequest } from '../middleware/apiValidation';
import { 
  standardRateLimiter, 
  authRateLimiter, 
  adminRateLimiter, 
  paymentRateLimiter 
} from '../middleware/rateLimiters';
import { securityHeadersMiddleware } from '../middleware/securityHeadersMiddleware';
import { 
  securityScanQuerySchema, 
  authScanQuerySchema, 
  securityLogsQuerySchema,
  testSecurityScanQuerySchema
} from '../validation/securityValidationSchemas';
import { 
  newsletterIdSchema, 
  getNewsletterSchema, 
  newsletterQuerySchema,
  updateNewsletterSchema
} from '../validation/newsletterValidationSchemas';
import {
  orderIdSchema,
  getOrderSchema,
  userOrdersQuerySchema,
  applyCouponSchema
} from '../validation/orderValidationSchemas';
import { logSecurityEvent } from '../utils/securityUtils';

/**
 * Apply security enhancements to security-related routes
 * 
 * @param router Express router
 */
export function enhanceSecurityRoutes(router: Router): void {
  // GET /api/security/scan
  router.get('/api/security/scan', 
    standardRateLimiter(),
    validate(securityScanQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Log the security scan event
      logSecurityEvent('SECURITY_SCAN_REQUESTED', {
        ip: req.ip,
        user: req.session?.userId || 'anonymous',
        queryParams: req.query,
        timestamp: new Date()
      });
      
      next();
    }
  );
  
  // GET /api/security/auth-scan
  router.get('/api/security/auth-scan', 
    authRateLimiter(), // Stricter rate limiting for auth endpoints
    validate(authScanQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Log the auth scan event
      logSecurityEvent('AUTH_SCAN_REQUESTED', {
        ip: req.ip,
        user: req.session?.userId || 'anonymous',
        queryParams: req.query,
        timestamp: new Date()
      });
      
      next();
    }
  );
  
  // GET /api/test/security/logs
  router.get('/api/test/security/logs', 
    adminRateLimiter(), // Admin-level rate limiting
    validate(securityLogsQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Require admin authentication
      if (!req.session?.userId || !(req.session as any).isAdmin) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Admin access required'
        });
      }
      
      // Log the security logs access event
      logSecurityEvent('SECURITY_LOGS_ACCESSED', {
        ip: req.ip,
        user: req.session?.userId,
        queryParams: req.query,
        timestamp: new Date()
      });
      
      next();
    }
  );
  
  // GET /api/test/security/scan
  router.get('/api/test/security/scan', 
    adminRateLimiter(),
    validate(testSecurityScanQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Require authenticated user
      if (!req.session?.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Authentication required'
        });
      }
      
      // Log the test security scan event
      logSecurityEvent('TEST_SECURITY_SCAN_REQUESTED', {
        ip: req.ip,
        user: req.session?.userId,
        queryParams: req.query,
        timestamp: new Date()
      });
      
      next();
    }
  );
}

/**
 * Apply security enhancements to newsletter-related routes
 * 
 * @param router Express router
 */
export function enhanceNewsletterRoutes(router: Router): void {
  // GET /api/newsletters/:id
  router.get('/api/newsletters/:id',
    standardRateLimiter(),
    validate(getNewsletterSchema, 'params'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  );
  
  // PATCH /api/newsletters/:id
  router.patch('/api/newsletters/:id',
    adminRateLimiter(),
    validateRequest({
      params: newsletterIdSchema,
      body: updateNewsletterSchema
    }),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Require authenticated user
      if (!req.session?.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Authentication required'
        });
      }
      
      next();
    }
  );
  
  // GET /api/newsletters
  router.get('/api/newsletters',
    standardRateLimiter(),
    validate(newsletterQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  );
}

/**
 * Apply security enhancements to order and cart routes
 * 
 * @param router Express router
 */
export function enhanceOrderRoutes(router: Router): void {
  // GET /orders/:orderId
  router.get('/orders/:orderId',
    standardRateLimiter(),
    validate(getOrderSchema, 'params'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Require authenticated user
      if (!req.session?.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Authentication required'
        });
      }
      
      next();
    }
  );
  
  // GET /user/orders
  router.get('/user/orders',
    standardRateLimiter(),
    validate(userOrdersQuerySchema, 'query'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      // Require authenticated user
      if (!req.session?.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: Authentication required'
        });
      }
      
      next();
    }
  );
  
  // POST /cart/coupon
  router.post('/cart/coupon',
    standardRateLimiter(),
    validate(applyCouponSchema, 'body'),
    securityHeadersMiddleware,
    (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  );
}

/**
 * Apply global security middleware to all routes
 * 
 * @param app Express application
 */
export function applyGlobalSecurityMiddleware(app: any): void {
  // Apply security headers to all responses
  app.use(securityHeadersMiddleware);
  
  // Log all requests for security monitoring
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip logging for static assets
    if (req.path.startsWith('/static/') || 
        req.path.startsWith('/assets/') || 
        req.path.endsWith('.ico') ||
        req.path.endsWith('.png') ||
        req.path.endsWith('.jpg') ||
        req.path.endsWith('.css') ||
        req.path.endsWith('.js')) {
      return next();
    }
    
    // Log request details
    const requestInfo = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      timestamp: new Date()
    };
    
    // Log to debug level to avoid flooding logs
    if (process.env.NODE_ENV === 'production') {
      // In production, only log non-GET requests at info level
      if (req.method !== 'GET') {
        logSecurityEvent('API_REQUEST', requestInfo);
      }
    } else {
      // In development, log all requests at debug level
      console.debug(`${req.method} ${req.path} from ${req.ip}`);
    }
    
    next();
  });
}