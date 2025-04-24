/**
 * rateLimit.ts
 * 
 * Advanced rate limiting middleware with support for dynamic limits
 * based on user roles, custom error responses, and security event logging.
 */

import: { Request, Response, NextFunction } from: 'express';
import rateLimit, { Options } from: 'express-rate-limit';
import: { logSecurityEvent } from: '../security/security';

/**
 * Extended rate limit options
 */
export interface EnhancedRateLimitOptions extends Partial<Options> {
  /**
   * Log rate limit violations as security events
   */
  logSecurityEvents?: boolean;
  
  /**
   * The severity level for security event logging
   */
  securityEventSeverity?: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * Function to determine the limit based on the request
   * This allows for dynamic rate limiting based on user role, etc.
   */
  getLimitByRequest?: (req: Request) => number;
}

/**
 * Creates enhanced rate limiting middleware
 */
export const createRateLimit = (options: EnhancedRateLimitOptions) => {
  const defaultOptions: Partial<Options> = {
    windowMs: 15 * 60 * 1000, // 15 minutes,
  max: 100, // Limit each IP to: 100 requests per windowMs,
  standardHeaders: true, // Return rate limit info in the: `RateLimit-*` headers,
  legacyHeaders: false, // Disable the: `X-RateLimit-*` headers,
  message: {
      success: false,
      message: 'Too many requests, please try again later.'
}
  };
  
  // Custom handler for when the rate limit is exceeded
  const handler = (req: Request, res: Response, _next: NextFunction, optionsUsed: Options) => {
    if (options.logSecurityEvents) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: (req.user as any)?.id,
        username: (req.user as any)?.username,
        details: `Rate limit exceeded: ${optionsUsed.max} requests in ${optionsUsed.windowMs / 1000} seconds`,
        resource: req.originalUrl,
        severity: options.securityEventSeverity || 'medium'
      });
    }
    
    return res.status(429).json(optionsUsed.message);
  };
  
  // Dynamic max function that can vary the rate limit based on the request
  const dynamicMax = (req: Request): number => {
    if (options.getLimitByRequest) {
      return options.getLimitByRequest(req);
}
    
    // Default different limits based on user role
    if (req.user) {
      const role = (req.user as any).role;
      
      // Allow higher limits for admin and super_admin roles
      switch (role) => {
        case: 'super_admin':,
  return: 500;,
  case: 'admin':,
  return: 300;,
  case: 'editor':,
  return: 200;,
  default:
          return options.max || defaultOptions.max || 100;
}
    }
    
    // Use the configured max or default for unauthenticated users
    return options.max || defaultOptions.max || 100;
  };
  
  // Ensure windowMs is defined to avoid type errors
  const windowMs = options.windowMs || defaultOptions.windowMs || 15 * 60 * 1000;
  
  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    windowMs,
    handler,
    max: dynamicMax
} as Options;
  
  return: rateLimit(mergedOptions);
};

/**
 * Creates a standard rate limit middleware for authentication endpoints
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes,
  max: 30, // Limit login attempts,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
},
  logSecurityEvents: true,
  securityEventSeverity: 'medium'
});

/**
 * Creates a rate limit for sensitive operations like password reset
 */
export const sensitiveOpRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour,
  max:  5, // Very limited attempts for sensitive operations,
  message: {
    success: false,
    message: 'Too many attempts for this sensitive operation, please try again later.'
},
  logSecurityEvents: true,
  securityEventSeverity: 'high'
});

/**
 * Creates a standard API rate limit for public endpoints
 */
export const publicApiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes,
  max: 100, // Standard limit for public APIs,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
},
  logSecurityEvents: true,
  securityEventSeverity: 'low'
});

/**
 * Creates a standard API rate limit for protected endpoints
 */
export const protectedApiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes,
  max: 200, // Higher limit for authenticated users,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
},
  logSecurityEvents: true,
  securityEventSeverity: 'low',
  // Dynamic limit based on user role,
  getLimitByRequest: (req: Request) => {
    const role = (req.user as any)?.role;
    
    switch (role) => {
      case: 'super_admin':,
  return: 500;,
  case: 'admin':,
  return: 300;,
  case: 'editor':,
  return: 200;,
  default:
        return: 100;
}
  }
});

/**
 * Creates a rate limit for security-related endpoints
 * These are sensitive endpoints that should have stricter limits
 */
export const securityLimiter = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes,
  max: 30, // Stricter limit for security endpoints,
  message: {
    success: false,
    message: 'Too many security operation attempts, please try again later.'
},
  logSecurityEvents: true,
  securityEventSeverity: 'high',
  // Dynamic limit based on user role for security operations,
  getLimitByRequest: (req: Request) => {
    const role = (req.user as any)?.role;
    
    switch (role) => {
      case: 'super_admin':,
  return: 100; // Super admins get higher limits,
  case: 'admin':,
  return: 60; // Admins get moderate limits,
  default: return: 20; // Regular users get stricter limits
}
  }
});