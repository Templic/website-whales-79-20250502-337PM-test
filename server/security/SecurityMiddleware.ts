/**
 * Security Middleware Integration
 * 
 * This file integrates all the advanced security components into
 * a unified middleware system that can be easily applied to Express routes.
 * 
 * Features:
 * - Centralized security middleware configuration
 * - Layered security approach
 * - Customizable security levels per route
 * - Comprehensive logging and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { accountLockoutMiddleware } from './advanced/account/AccountLockoutService';
import { ipWhitelistMiddleware } from './advanced/network/IPWhitelistService';
import { logSecurityEvent } from './advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from './advanced/audit/AuditLogService';
import { ValidationEngine } from './advanced/apiValidation/ValidationEngine';
import { csrfProtectionMiddleware } from './advanced/csrf/CSRFProtection';
import { hasRole, isAuthenticated } from '../utils/auth-utils';
import { UserRole } from '../utils/auth-config';

// Define security levels for different parts of the application
export enum SecurityLevel {
  PUBLIC = 'public',     // Open to all users, minimum security
  BASIC = 'basic',       // Standard security for authenticated users
  ELEVATED = 'elevated', // Higher security for sensitive operations
  ADMIN = 'admin',       // Admin-only access with strong security
  MAXIMUM = 'maximum'    // Maximum security for critical operations
}

// Define security features to apply based on security level
interface SecurityFeatures {
  requireAuth: boolean;
  requireRole?: UserRole;
  csrfProtection: boolean;
  ipWhitelist: boolean;
  apiValidation: boolean;
  rateLimit: boolean;
  adminOnly?: boolean;
}

// Map security levels to features
const securityLevelFeatures: Record<SecurityLevel, SecurityFeatures> = {
  [SecurityLevel.PUBLIC]: {
    requireAuth: false,
    csrfProtection: false,
    ipWhitelist: false,
    apiValidation: true,
    rateLimit: true
  },
  [SecurityLevel.BASIC]: {
    requireAuth: true,
    csrfProtection: true,
    ipWhitelist: false,
    apiValidation: true,
    rateLimit: true
  },
  [SecurityLevel.ELEVATED]: {
    requireAuth: true,
    requireRole: UserRole.USER,
    csrfProtection: true,
    ipWhitelist: true,
    apiValidation: true,
    rateLimit: true
  },
  [SecurityLevel.ADMIN]: {
    requireAuth: true,
    requireRole: UserRole.ADMIN,
    csrfProtection: true,
    ipWhitelist: true,
    apiValidation: true,
    rateLimit: true,
    adminOnly: true
  },
  [SecurityLevel.MAXIMUM]: {
    requireAuth: true,
    requireRole: UserRole.SUPER_ADMIN,
    csrfProtection: true,
    ipWhitelist: true,
    apiValidation: true,
    rateLimit: true,
    adminOnly: true
  }
};

/**
 * Create security middleware based on security level
 */
export function createSecurityMiddleware(level: SecurityLevel = SecurityLevel.BASIC) {
  const features = securityLevelFeatures[level];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Log security middleware initialization
    logSecurityEvent({
      category: SecurityEventCategory.MIDDLEWARE,
      severity: SecurityEventSeverity.LOW,
      message: 'Security middleware applied',
      data: {
        level,
        path: req.path,
        method: req.method,
        ip: req.ip
      }
    });
    
    // Apply security features based on the level
    const middlewares: ((req: Request, res: Response, next: NextFunction) => void)[] = [];
    
    // Authentication check
    if (features.requireAuth) {
      middlewares.push(isAuthenticated);
    }
    
    // Role check
    if (features.requireRole) {
      middlewares.push(hasRole(features.requireRole));
    }
    
    // IP whitelist
    if (features.ipWhitelist) {
      middlewares.push(ipWhitelistMiddleware({
        adminOnly: features.adminOnly
      }));
    }
    
    // CSRF protection
    if (features.csrfProtection) {
      middlewares.push(csrfProtectionMiddleware);
    }
    
    // Account lockout (always applied for login routes)
    middlewares.push(accountLockoutMiddleware);
    
    // API validation is applied at the route level through registration
    // Rate limiting is applied globally through the rate limiting middleware
    
    // Apply the middlewares in sequence
    applyMiddlewareStack(middlewares, req, res, next);
  };
}

/**
 * Apply middleware stack sequentially
 */
function applyMiddlewareStack(
  middlewares: ((req: Request, res: Response, next: NextFunction) => void)[],
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If no middlewares left, continue to the next handler
  if (middlewares.length === 0) {
    return next();
  }
  
  // Take the first middleware
  const middleware = middlewares[0];
  const remainingMiddlewares = middlewares.slice(1);
  
  // Apply the middleware
  middleware(req, res, (err) => {
    // If there's an error, pass it to the next handler
    if (err) {
      return next(err);
    }
    
    // Continue with the next middleware in the stack
    applyMiddlewareStack(remainingMiddlewares, req, res, next);
  });
}

/**
 * Create security middleware for admin routes
 */
export const adminSecurityMiddleware = createSecurityMiddleware(SecurityLevel.ADMIN);

/**
 * Create security middleware for API routes
 */
export const apiSecurityMiddleware = createSecurityMiddleware(SecurityLevel.ELEVATED);

/**
 * Create security middleware for public routes
 */
export const publicSecurityMiddleware = createSecurityMiddleware(SecurityLevel.PUBLIC);

/**
 * Create security middleware for maximum security routes
 */
export const maximumSecurityMiddleware = createSecurityMiddleware(SecurityLevel.MAXIMUM);

export default {
  createSecurityMiddleware,
  adminSecurityMiddleware,
  apiSecurityMiddleware,
  publicSecurityMiddleware,
  maximumSecurityMiddleware,
  SecurityLevel
};