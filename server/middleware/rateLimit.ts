/**
 * Rate limiting middleware
 * 
 * Configures different rate limits for various API endpoints
 * based on their sensitivity and expected usage patterns.
 */

import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { logSecurityEvent } from '../security/security';
import { Request, Response, NextFunction } from 'express';

// Define the options type for rate limit handlers
interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
}

// Type for our custom handler
type CustomRateLimitHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction, 
  options: RateLimitOptions
) => void;

// Configuration type with our custom handler
interface CustomRateLimitConfig extends Omit<Options, 'handler'> {
  windowMs: number;
  max: number;
  message: string;
  handler: CustomRateLimitHandler;
}

// Different rate limit configurations
const rateLimitConfigs: Record<string, CustomRateLimitConfig> = {
  // Default API rate limit (100 requests per 15 minutes)
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    handler: (req: Request, res: Response, next: NextFunction, options: RateLimitOptions) => {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: `Default rate limit exceeded: ${options.max} requests in ${options.windowMs}ms`,
        severity: 'medium'
      });
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
      });
    }
  },
  
  // Authentication rate limit (30 requests per 15 minutes)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
    handler: (req: Request, res: Response, next: NextFunction, options: RateLimitOptions) => {
      logSecurityEvent({
        type: 'AUTH_RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: `Authentication rate limit exceeded: ${options.max} requests in ${options.windowMs}ms`,
        severity: 'high'
      });
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
      });
    }
  },
  
  // Security operations rate limit (10 requests per 15 minutes)
  security: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many security operations, please try again after 15 minutes',
    handler: (req: Request, res: Response, next: NextFunction, options: RateLimitOptions) => {
      logSecurityEvent({
        type: 'SECURITY_RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: `Security operation rate limit exceeded: ${options.max} requests in ${options.windowMs}ms`,
        severity: 'high'
      });
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
      });
    }
  },
  
  // Admin operations rate limit (50 requests per 15 minutes)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many admin operations, please try again after 15 minutes',
    handler: (req: Request, res: Response, next: NextFunction, options: RateLimitOptions) => {
      logSecurityEvent({
        type: 'ADMIN_RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: `Admin operation rate limit exceeded: ${options.max} requests in ${options.windowMs}ms`,
        severity: 'high'
      });
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
      });
    }
  },
  
  // Public API rate limit (200 requests per 15 minutes)
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again after 15 minutes',
    handler: (req: Request, res: Response, next: NextFunction, options: RateLimitOptions) => {
      logSecurityEvent({
        type: 'PUBLIC_RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        details: `Public API rate limit exceeded: ${options.max} requests in ${options.windowMs}ms`,
        severity: 'low'
      });
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000 / 60) // minutes
      });
    }
  }
};

// Helper function to create a rate limiter from our config
const createLimiter = (config: CustomRateLimitConfig): RateLimitRequestHandler => {
  // Extract handler from our custom config
  const { handler, ...restConfig } = config;
  
  // Create compatible handler for express-rate-limit
  const compatibleHandler = (req: Request, res: Response, next: NextFunction, options: Options) => {
    // Convert standard options to our custom format
    const customOptions: RateLimitOptions = {
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: typeof options.max === 'number' ? options.max : 100,
      message: options.message?.toString() || 'Too many requests',
      statusCode: options.statusCode || 429
    };
    
    // Call our custom handler
    handler(req, res, next, customOptions);
  };
  
  // Return rate limiter with compatible handler
  return rateLimit({
    ...restConfig,
    handler: compatibleHandler
  });
};

// Create rate limiters
export const defaultLimiter = createLimiter(rateLimitConfigs.default);
export const authLimiter = createLimiter(rateLimitConfigs.auth);
export const securityLimiter = createLimiter(rateLimitConfigs.security);
export const adminLimiter = createLimiter(rateLimitConfigs.admin);
export const publicLimiter = createLimiter(rateLimitConfigs.public);

// Helper function to get limiter by name
export const getLimiter = (name: 'default' | 'auth' | 'security' | 'admin' | 'public') => {
  switch (name) {
    case 'auth':
      return authLimiter;
    case 'security':
      return securityLimiter;
    case 'admin':
      return adminLimiter;
    case 'public':
      return publicLimiter;
    default:
      return defaultLimiter;
  }
};