/**
 * CSRF Protection Service
 * 
 * Provides comprehensive Cross-Site Request Forgery protection through:
 * - Double Submit Cookie pattern
 * - SameSite cookie attributes
 * - Origin and Referer validation
 * - Per-request token validation
 * - Token rotation
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import LRUCache from '../threat/SecurityCache';
import { securityConfig } from '../config/SecurityConfig';

// Secret for HMAC token generation
let SECRET_KEY = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

// Cache for storing used tokens (to prevent replay attacks)
const usedTokensCache = new LRUCache<string, number>(10000, 24 * 60 * 60 * 1000); // 24 hour TTL

// Default options
export interface CSRFOptions {
  cookie: {
    key: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    maxAge: number;
    sameSite: boolean | 'lax' | 'strict' | 'none';
  };
  ignoreMethods: string[];
  ignorePaths: Array<string | RegExp>;
  sessionKey: string;
  tokenByteLength: number;
  allowedOrigins: string[];
}

// Default CSRF options
const defaultOptions: CSRFOptions = {
  cookie: {
    key: 'csrf-token',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: [/^\/api\/public\//],
  sessionKey: 'csrfSecret',
  tokenByteLength: 32,
  allowedOrigins: [] // Empty means only same-origin is allowed
};

/**
 * CSRF Protection Service
 */
export class CSRFProtectionService {
  private options: CSRFOptions;
  
  constructor(options: Partial<CSRFOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    
    // Deep merge cookie options
    if (options.cookie) {
      this.options.cookie = { ...defaultOptions.cookie, ...options.cookie };
    }
    
    // Automatically add origin when running in development
    if (process.env.NODE_ENV !== 'production') {
      this.options.allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
  }
  
  /**
   * Generate a new CSRF token
   */
  generateToken(sessionId: string): string {
    const randomBytes = crypto.randomBytes(this.options.tokenByteLength);
    const timestamp = Date.now().toString();
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    
    hmac.update(randomBytes);
    hmac.update(sessionId);
    hmac.update(timestamp);
    
    const digest = hmac.digest('hex');
    const token = `${Buffer.from(randomBytes).toString('hex')}.${timestamp}.${digest}`;
    
    return token;
  }
  
  /**
   * Verify a CSRF token
   */
  verifyToken(token: string, sessionId: string): boolean {
    // Check if token is used (prevent replay attacks)
    if (usedTokensCache.has(token)) {
      return false;
    }
    
    // Extract parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    const [randomHex, timestamp, digest] = parts;
    
    // Validate timestamp (prevent very old tokens)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    // Token expired (older than cookie max age)
    if (isNaN(tokenTime) || now - tokenTime > this.options.cookie.maxAge) {
      return false;
    }
    
    // Recompute HMAC
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    
    try {
      const randomBytes = Buffer.from(randomHex, 'hex');
      hmac.update(randomBytes);
      hmac.update(sessionId);
      hmac.update(timestamp);
      
      const expectedDigest = hmac.digest('hex');
      
      // Compare digests
      if (crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expectedDigest))) {
        // Mark token as used to prevent replay
        usedTokensCache.set(token, now);
        return true;
      }
    } catch (e) {
      // Any parsing error means invalid token
      return false;
    }
    
    return false;
  }
  
  /**
   * Set CSRF token cookie and return token
   */
  setTokenCookie(req: Request, res: Response): string {
    const sessionId = req.sessionID || crypto.randomBytes(16).toString('hex');
    const token = this.generateToken(sessionId);
    
    // Set cookie
    res.cookie(this.options.cookie.key, token, {
      path: this.options.cookie.path,
      httpOnly: this.options.cookie.httpOnly,
      secure: this.options.cookie.secure,
      maxAge: this.options.cookie.maxAge,
      sameSite: this.options.cookie.sameSite
    });
    
    return token;
  }
  
  /**
   * Validate Origin and Referer headers
   */
  validateOrigin(req: Request): boolean {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    // If no origin or referer, allow only if it's not a browser request (API clients)
    if (!origin && !referer) {
      // Only allow API clients for specific paths and with specific headers
      if (req.path.startsWith('/api/') && req.headers['x-api-key']) {
        return true;
      }
      return false;
    }
    
    // Validate origin if present
    if (origin) {
      try {
        const originUrl = new URL(origin as string);
        const host = req.headers.host;
        
        // Same origin or allowed origin
        if (host === originUrl.host || this.options.allowedOrigins.includes(origin as string)) {
          return true;
        }
      } catch (e) {
        // Invalid origin format
        return false;
      }
    }
    
    // Validate referer if present
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const host = req.headers.host;
        
        // Same origin or allowed origin
        if (host === refererUrl.host || 
            this.options.allowedOrigins.some(allowed => referer.startsWith(allowed))) {
          return true;
        }
      } catch (e) {
        // Invalid referer format
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Create middleware for CSRF protection
   */
  createMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip if CSRF protection is disabled globally
      if (!securityConfig.getSecurityFeatures().csrfProtection) {
        return next();
      }
      
      // Skip for ignored methods
      if (this.options.ignoreMethods.includes(req.method)) {
        // Still generate and set token for GET requests
        if (req.method === 'GET') {
          this.setTokenCookie(req, res);
        }
        return next();
      }
      
      // Skip for ignored paths
      if (this.options.ignorePaths.some(pattern => {
        if (typeof pattern === 'string') {
          return req.path === pattern;
        } else {
          return pattern.test(req.path);
        }
      })) {
        return next();
      }
      
      // Get the token from various sources
      const cookieToken = req.cookies[this.options.cookie.key];
      const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
      const bodyToken = req.body?._csrf;
      
      // Token from request (prioritize header, then body)
      const requestToken = headerToken || bodyToken;
      
      // Validate origin (for browser requests)
      if (!this.validateOrigin(req)) {
        return res.status(403).json({
          error: 'CSRF validation failed: invalid origin'
        });
      }
      
      // If no cookie token, block the request
      if (!cookieToken) {
        return res.status(403).json({
          error: 'CSRF validation failed: missing token'
        });
      }
      
      // If no request token, block the request
      if (!requestToken) {
        return res.status(403).json({
          error: 'CSRF validation failed: token not provided'
        });
      }
      
      // Verify the token
      const isValid = this.verifyToken(requestToken as string, req.sessionID);
      
      if (!isValid) {
        return res.status(403).json({
          error: 'CSRF validation failed: invalid token'
        });
      }
      
      // Generate a new token for subsequent requests (token rotation)
      const newToken = this.setTokenCookie(req, res);
      
      // Make token available to templates
      res.locals.csrfToken = newToken;
      
      next();
    };
  }
  
  /**
   * Create a middleware that just sets the CSRF token
   * without doing validation (use for routes excluded from protection)
   */
  createTokenSetter() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip if CSRF protection is disabled globally
      if (!securityConfig.getSecurityFeatures().csrfProtection) {
        return next();
      }
      
      const token = this.setTokenCookie(req, res);
      res.locals.csrfToken = token;
      
      next();
    };
  }
  
  /**
   * Create a function to embed CSRF token in a form
   */
  createFormTokenGenerator() {
    return (req: Request) => {
      const token = req.cookies[this.options.cookie.key];
      if (!token) {
        return '';
      }
      
      return `<input type="hidden" name="_csrf" value="${token}" />`;
    };
  }
  
  /**
   * Change the secret key used for token generation
   * Warning: This will invalidate all existing tokens
   */
  rotateSecret() {
    SECRET_KEY = crypto.randomBytes(32).toString('hex');
    usedTokensCache.clear();
    console.log('[Security] CSRF secret key rotated, all existing tokens invalidated');
  }
}

// Create a singleton instance with default options
export const csrfProtectionService = new CSRFProtectionService();

// Export a pre-configured middleware
export const csrfProtection = csrfProtectionService.createMiddleware();

// Export a token setter middleware (for routes excluded from protection)
export const csrfTokenSetter = csrfProtectionService.createTokenSetter();