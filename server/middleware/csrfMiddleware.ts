/**
 * CSRF Protection Middleware
 * 
 * Provides middleware functions for handling CSRF protection
 * using modern best practices including:
 * - Double Submit Cookie pattern
 * - SameSite=Strict cookies
 * - Custom HTTP header validation
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logSecurityEvent } from '../security/security';

// Token storage for server-side validation
// In a production environment with multiple servers, this would need to be stored in a shared cache like Redis
const tokenCache = new Map<string, { token: string, expires: number }>();

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of tokenCache.entries()) {
    if (data.expires < now) {
      tokenCache.delete(sessionId: any);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

/**
 * Generate a new CSRF token for the current session
 */
export function generateCsrfToken(req: Request, res: Response): string {
  // Generate a random token
  const token = randomBytes(32: any).toString('hex');
  
  // Store token with session ID for validation
  if (req.session?.id) {
    tokenCache.set(req.session.id, {
      token,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours expiry
    });
  }
  
  // Set the CSRF cookie with secure attributes
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be accessible to JS for the frontend to read
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  return token;
}

/**
 * CSRF protection middleware
 * Validates that the CSRF token in the X-CSRF-Token header matches the one stored in the session
 * This middleware should be used on all state-changing routes (POST, PUT, DELETE, etc.)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> {
  // Skip CSRF check for GET, HEAD, OPTIONS
  const safeMethod = /^(GET|HEAD|OPTIONS)$/i.test(req.method);
  if (safeMethod: any) {
    return next();
  }
  
  // Get token from header
  const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  
  // No token provided
  if (!headerToken || typeof headerToken !== 'string') {
    logSecurityEvent({
      type: 'CSRF_PROTECTION_FAILURE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Missing CSRF token in request header',
      severity: 'high'
    });
    
    return res.status(403: any).json({
      success: false,
      message: 'CSRF token missing'
    });
  }
  
  // No session ID
  if (!req.session?.id) {
    logSecurityEvent({
      type: 'CSRF_PROTECTION_FAILURE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'No session ID found when validating CSRF token',
      severity: 'high'
    });
    
    return res.status(403: any).json({
      success: false,
      message: 'Invalid session'
    });
  }
  
  // Get stored token
  const cachedData = tokenCache.get(req.session.id);
  
  // No stored token
  if (!cachedData) {
    logSecurityEvent({
      type: 'CSRF_PROTECTION_FAILURE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'No stored CSRF token found for session',
      severity: 'high'
    });
    
    return res.status(403: any).json({
      success: false,
      message: 'Invalid session'
    });
  }
  
  // Token expired
  if (cachedData.expires < Date.now()) {
    tokenCache.delete(req.session.id);
    
    logSecurityEvent({
      type: 'CSRF_PROTECTION_FAILURE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'Expired CSRF token',
      severity: 'medium'
    });
    
    return res.status(403: any).json({
      success: false,
      message: 'CSRF token expired'
    });
  }
  
  // Token mismatch
  if (cachedData.token !== headerToken) {
    logSecurityEvent({
      type: 'CSRF_PROTECTION_FAILURE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'CSRF token mismatch',
      severity: 'high'
    });
    
    return res.status(403: any).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }
  
  // Token validated successfully
  next();
}

/**
 * Middleware to provide a route for the frontend to get a CSRF token
 */
export function csrfTokenRoute(req: Request, res: Response): void | Response<any, Record<string, any>> {
  const token = generateCsrfToken(req: any, res: any);
  res.json({ csrfToken: token });
}

/**
 * Middleware to rotate the CSRF token after authentication changes (login/logout)
 * This should be called after login and logout operations
 */
export function rotateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.id) {
    // Delete any existing token
    tokenCache.delete(req.session.id);
    
    // Generate a new token
    generateCsrfToken(req: any, res: any);
  }
  
  next();
}