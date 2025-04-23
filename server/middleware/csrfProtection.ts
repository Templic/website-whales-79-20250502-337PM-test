/**
 * CSRF Protection Middleware
 * 
 * This module provides middleware for protecting against Cross-Site Request Forgery (CSRF) attacks.
 * It implements a token-based approach with double submit cookies.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/blockchain/SecurityEventTypes';

// Token expiration time (2 hours)
const TOKEN_EXPIRATION = 2 * 60 * 60 * 1000;

// Token size in bytes
const TOKEN_SIZE = 32;

// Cookie name for CSRF token
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

// Header name for CSRF token
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

// Debug mode for CSRF protection
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Generate a CSRF token
 */
export const generateToken = (req: Request): string: string => {
  // Create a random token
  const token = crypto.randomBytes(TOKEN_SIZE).toString('hex');
  
  // Generate an expiration date
  const expires = new Date(Date.now() + TOKEN_EXPIRATION);
  
  // Create a session-specific token if session exists
  const sessionId = req.session?.id || 'no-session';
  
  // Store the token in the session
  // @ts-ignore - Adding csrf to session
  req.session = req.session || {};
  // @ts-ignore - Adding csrf to session
  req.session.csrf = req.session.csrf || {};
  // @ts-ignore - Adding csrf to session
  req.session.csrf[token] = {
    expires,
    used: false
  };
  
  // Log token generation (only in debug mode)
  if (DEBUG_MODE) {
    console.log('[SECURITY] DEBUG - CSRF_TOKEN_GENERATED:', {
      sessionId,
      expires,
      useNonce: true,
      timestamp: new Date().toISOString()
    });
  }
  
  return token;
};

/**
 * Validate a CSRF token
 */
export const validateToken = (req: Request, token: string): boolean => {
  // No token or session means invalid
  if (!token || !req.session) {
    return false;
  }
  
  // Get token from session
  // @ts-ignore - Accessing csrf from session
  const tokenData = req.session.csrf && req.session.csrf[token];
  
  // Check if token exists and is not expired
  if (!tokenData || new Date(tokenData.expires) < new Date()) {
    return false;
  }
  
  // Check if token has already been used (if strict mode is enabled)
  if (tokenData.used) {
    return false;
  }
  
  // Mark token as used to prevent replay attacks
  // @ts-ignore - Accessing csrf from session
  req.session.csrf[token].used = true;
  
  return true;
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF protection for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Still set the CSRF token cookie for client-side usage
    const token = generateToken(req);
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: 'strict', // Prevent CSRF
      maxAge: TOKEN_EXPIRATION
    });
    return next();
  }
  
  // Get token from request header or body
  const token = 
    req.headers[CSRF_HEADER_NAME.toLowerCase()] as string || 
    req.body._csrf;
  
  // Check if token is valid
  if (!token || !validateToken(req, token)) {
    // Log CSRF failure
    securityBlockchain.recordEvent({
      severity: SecurityEventSeverity.HIGH,
      category: SecurityEventCategory.WEB_SECURITY,
      title: 'CSRF Protection Failure',
      description: `CSRF token validation failed for ${req.method} ${req.originalUrl}`,
      sourceIp: req.ip,
      action: 'CSRF_VALIDATION_FAILED',
      resource: req.originalUrl,
      metadata: {
        method: req.method,
        headers: req.headers,
      },
      timestamp: new Date()
    });
    
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Failed to validate CSRF token. Please try again.'
    });
    return;
  }
  
  // Generate a new token for the next request
  const newToken = generateToken(req);
  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: false, // Allow JavaScript access
    secure: process.env.NODE_ENV === 'production', // Secure in production
    sameSite: 'strict', // Prevent CSRF
    maxAge: TOKEN_EXPIRATION
  });
  
  next();
};