/**
 * CSRF Protection Middleware
 * 
 * This module provides robust CSRF protection for the application.
 * It implements synchronized token pattern and per-request token rotation.
 */

import { Request, Response, NextFunction } from 'express';
import { generateSecureToken, logSecurityEvent } from '../utils/securityUtils';
import { SecurityLogLevel } from '../types/securityTypes';
import crypto from 'crypto';

// In-memory token store (use Redis in production)
const tokenStore: Record<string, {
  token: string;
  issued: Date;
  expires: Date;
}> = {};

// Configuration options
const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = 'csrf_token';
const CSRF_FIELD = '_csrf';
const TOKEN_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

/**
 * Clean up expired tokens periodically
 */
function cleanupExpiredTokens() {
  const now = new Date();
  
  Object.keys(tokenStore).forEach(key => {
    if (tokenStore[key].expires < now) {
      delete tokenStore[key];
    }
  });
}

// Set up periodic cleanup
setInterval(cleanupExpiredTokens, 15 * 60 * 1000); // every 15 minutes

/**
 * Generate a new CSRF token
 * 
 * @param req Express request
 * @returns The generated token
 */
function generateCsrfToken(req: Request): string {
  // Generate a new token using secure random bytes
  const token = generateSecureToken(32);
  
  // Store the token with expiry
  const sessionId = req.sessionID || req.cookies?.sid || crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_EXPIRY);
  
  tokenStore[sessionId] = {
    token,
    issued: now,
    expires
  };
  
  // Log token generation
  logSecurityEvent('CSRF_TOKEN_GENERATED', {
    sessionId,
    expires,
    timestamp: now
  }, SecurityLogLevel.DEBUG);
  
  return token;
}

/**
 * Verify a CSRF token
 * 
 * @param req Express request
 * @param token CSRF token to verify
 * @returns Whether the token is valid
 */
function verifyCsrfToken(req: Request, token: string): boolean {
  if (!token) return false;
  
  const sessionId = req.sessionID || req.cookies?.sid;
  if (!sessionId) return false;
  
  const storedData = tokenStore[sessionId];
  if (!storedData) return false;
  
  // Check if token has expired
  if (storedData.expires < new Date()) {
    delete tokenStore[sessionId];
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedData.token)
  );
}

/**
 * Middleware to protect routes from CSRF attacks
 * 
 * @returns Express middleware
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF protection for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate and attach a new token for the next request
      const token = generateCsrfToken(req);
      
      // Set token in cookie for non-API routes
      if (!req.path.startsWith('/api/')) {
        res.cookie(CSRF_COOKIE, token, COOKIE_OPTIONS);
      }
      
      // Expose token to the view
      if (req.session) {
        req.session.csrfToken = token;
      }
      
      // Attach token to response locals for template rendering
      res.locals.csrfToken = token;
      
      return next();
    }
    
    // For POST, PUT, DELETE, PATCH requests, validate the token
    let token: string | undefined;
    
    // Check for token in headers, body, and query
    if (req.headers[CSRF_HEADER.toLowerCase()]) {
      token = req.headers[CSRF_HEADER.toLowerCase()] as string;
    } else if (req.body && req.body[CSRF_FIELD]) {
      token = req.body[CSRF_FIELD] as string;
    } else if (req.query && req.query[CSRF_FIELD]) {
      token = req.query[CSRF_FIELD] as string;
    } else if (req.cookies && req.cookies[CSRF_COOKIE]) {
      token = req.cookies[CSRF_COOKIE];
    }
    
    if (!token) {
      // Token not found
      logSecurityEvent('CSRF_VALIDATION_FAILURE', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'Missing CSRF token',
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token missing or invalid'
      });
    }
    
    // Verify the token
    if (!verifyCsrfToken(req, token)) {
      // Token invalid
      logSecurityEvent('CSRF_VALIDATION_FAILURE', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'Invalid CSRF token',
        timestamp: new Date()
      }, SecurityLogLevel.WARN);
      
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token missing or invalid'
      });
    }
    
    // Token is valid, rotate it for enhanced security
    const newToken = generateCsrfToken(req);
    
    // Set the new token in cookie
    res.cookie(CSRF_COOKIE, newToken, COOKIE_OPTIONS);
    
    // Update token in session
    if (req.session) {
      req.session.csrfToken = newToken;
    }
    
    // Attach token to response locals
    res.locals.csrfToken = newToken;
    
    // Log token rotation
    logSecurityEvent('CSRF_TOKEN_ROTATED', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date()
    }, SecurityLogLevel.DEBUG);
    
    next();
  };
}

/**
 * Function to get the CSRF token for a request
 * 
 * @param req Express request
 * @returns The CSRF token or undefined if not found
 */
export function getCsrfToken(req: Request): string | undefined {
  if (req.session?.csrfToken) {
    return req.session.csrfToken;
  } else if (req.cookies && req.cookies[CSRF_COOKIE]) {
    return req.cookies[CSRF_COOKIE];
  }
  return undefined;
}

/**
 * Helper function for API routes to set CSRF token in response header
 * 
 * @param req Express request
 * @param res Express response
 */
export function setCsrfTokenHeader(req: Request, res: Response): void {
  const token = getCsrfToken(req) || generateCsrfToken(req);
  res.setHeader(CSRF_HEADER, token);
}

/**
 * Add CSRF token to an object (for use with template rendering)
 * 
 * @param req Express request
 * @param data Data object to add token to
 * @returns The same object with token added
 */
export function addCsrfToken<T extends Record<string, any>>(req: Request, data: T): T & { csrfToken: string } {
  const token = getCsrfToken(req) || generateCsrfToken(req);
  return {
    ...data,
    csrfToken: token
  };
}