/**
 * CSRF Protection
 * 
 * Provides Cross-Site Request Forgery (CSRF) protection mechanisms
 * for the application. Helps prevent malicious sites from making requests
 * on behalf of authenticated users.
 * 
 * Features:
 * - CSRF token generation and validation
 * - Secure token management
 * - Support for exempt routes
 * - Integration with security middleware
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Configuration
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Token store
type TokenData = {
  token: string;
  expiresAt: number;
};

// In-memory token store (in production, use a distributed cache or database)
const tokenStore: Map<string, TokenData> = new Map();

/**
 * Generate a new CSRF token
 */
export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token cookie and return the token
 */
export function setTokenCookie(res: Response): string {
  const token = generateToken();
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  
  // Store token
  tokenStore.set(token, { token, expiresAt });
  
  // Set cookie
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY_MS
  });
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  // Check if token exists
  const tokenData = tokenStore.get(token);
  if (!tokenData) {
    return false;
  }
  
  // Check if token is expired
  if (tokenData.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  
  tokenStore.forEach((data, token) => {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  });
}

/**
 * CSRF token middleware - sets CSRF token
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only set token on GET requests
  if (req.method === 'GET') {
    // Get token from cookie
    const existingToken = req.cookies[CSRF_COOKIE_NAME];
    
    // If token exists and is valid, don't generate a new one
    if (existingToken && validateToken(existingToken)) {
      res.locals.csrfToken = existingToken;
    } else {
      // Generate and set new token
      const token = setTokenCookie(res);
      res.locals.csrfToken = token;
    }
  }
  
  next();
}

/**
 * Is the route exempt from CSRF protection?
 */
function isExemptRoute(req: Request, exemptRoutes: string[]): boolean {
  // If the route is in the exempt list
  return exemptRoutes.some(route => {
    // Exact match
    if (route === req.path) {
      return true;
    }
    
    // Wildcard match (e.g., /api/auth/*)
    if (route.endsWith('*')) {
      const prefix = route.substring(0, route.length - 1);
      return req.path.startsWith(prefix);
    }
    
    return false;
  });
}

/**
 * CSRF protection middleware - validates CSRF token
 */
export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  exemptRoutes: string[] = []
): void {
  // Skip validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip exempt routes
  if (isExemptRoute(req, exemptRoutes)) {
    return next();
  }
  
  // Get token from request headers
  const token = req.headers[CSRF_HEADER_NAME] as string | undefined;
  
  // If token is missing or invalid
  if (!validateToken(token)) {
    // Log the CSRF attempt
    logSecurityEvent({
      category: SecurityEventCategory.CSRF,
      severity: SecurityEventSeverity.HIGH,
      message: 'CSRF token validation failed',
      data: {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }
  
  next();
}

export default {
  generateToken,
  setTokenCookie,
  validateToken,
  csrfTokenMiddleware,
  csrfProtectionMiddleware
};