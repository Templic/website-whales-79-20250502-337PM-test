/**
 * Security Utility Functions
 * 
 * This module provides various utility functions for security-related operations
 * including response security headers, security logging, and token generation.
 */

import { Response, Request } from 'express';
import { randomBytes, createHash } from 'crypto';
import { Session } from 'express-session';
import { SecurityEventType, SecurityEvent, SecurityLogLevel } from '../types/securityTypes';

// Create a simple logger if the actual logger is not available
const logger = {
  debug: (message: string, meta?: any) => console.debug(message, meta),
  info: (message: string, meta?: any) => console.info(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  error: (message: string, meta?: any) => console.error(message, meta)
};

/**
 * Apply security headers to HTTP responses
 * 
 * @param res Express response object
 */
export function applySecurityHeaders(res: Response): void {
  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://analytics.example.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://img.example.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // HTTP Strict Transport Security (HSTS)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
}

/**
 * Generate a secure random token
 * 
 * @param byteLength Number of random bytes to generate
 * @returns Hex string of the token
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate a secure hash for the given data
 * 
 * @param data Data to hash
 * @param algorithm Hash algorithm to use
 * @returns Hex string of the hash
 */
export function secureHash(data: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex');
}

/**
 * Sanitize a string for safe output
 * 
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Log a security event
 * 
 * @param type Type of security event
 * @param data Additional event data
 * @param level Log level for the event
 */
export function logSecurityEvent(
  type: SecurityEventType, 
  data: Record<string, any>,
  level: SecurityLogLevel = SecurityLogLevel.INFO
): void {
  const event: SecurityEvent = {
    type,
    timestamp: new Date(),
    level,
    source: 'security-utils',
    data
  };
  
  // Log to the appropriate logger level
  switch (level) {
    case SecurityLogLevel.DEBUG:
      logger.debug(`Security event: ${type}`, { securityEvent: event });
      break;
    case SecurityLogLevel.INFO:
      logger.info(`Security event: ${type}`, { securityEvent: event });
      break;
    case SecurityLogLevel.WARN:
      logger.warn(`Security event: ${type}`, { securityEvent: event });
      break;
    case SecurityLogLevel.ERROR:
    case SecurityLogLevel.CRITICAL:
      logger.error(`Security event: ${type}`, { securityEvent: event });
      break;
  }
  
  // In a production environment, consider also sending to:
  // - Security information and event management (SIEM) system
  // - Blockchain-based immutable security log
  // - Anomaly detection system
}

/**
 * Check if a request is from an authenticated user
 * 
 * @param req Express request object
 * @returns Boolean indicating if user is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!(req.session && req.session.userId);
}

/**
 * Check if a user has a specific role
 * 
 * @param req Express request object
 * @param role Role to check for
 * @returns Boolean indicating if user has the role
 */
export function hasRole(req: Request, role: string): boolean {
  if (!req.session) {
    return false;
  }
  
  const userRoles = (req.session as any).roles || [];
  return userRoles.includes(role);
}

/**
 * Get the user ID from the session
 * 
 * @param session Express session
 * @returns User ID or null if not authenticated
 */
export function getUserIdFromSession(session: Session): string | null {
  if (!session) {
    return null;
  }
  
  return (session as any).userId || null;
}

/**
 * Mask sensitive data for logging
 * 
 * @param data Object containing data to mask
 * @param sensitiveFields Fields to mask
 * @returns Object with masked sensitive fields
 */
export function maskSensitiveData<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'credit_card']
): T {
  const maskedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in maskedData) {
      // Mask with asterisks, preserving length
      const value = String(maskedData[field]);
      maskedData[field] = '*'.repeat(Math.min(value.length, 8)) + 
        (value.length > 8 ? `[${value.length - 8} more]` : '');
    }
  }
  
  return maskedData;
}

/**
 * Generate a nonce for use in CSP
 * 
 * @returns Random nonce value
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Get client IP address from request
 * 
 * @param req Express request
 * @returns IP address string
 */
export function getClientIp(req: Request): string {
  // Check for proxy headers first
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can be a comma-separated list of IPs
    // The leftmost is the original client
    const ips = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0]
      : xForwardedFor.split(',')[0];
    
    return ips.trim();
  }
  
  // If no proxy headers, use the remote address
  return req.ip || 'unknown';
}

/**
 * Validate password strength
 * 
 * @param password Password to validate
 * @returns Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }
  
  // Complexity checks
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one uppercase letter');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one lowercase letter');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one number');
  }
  
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one special character');
  }
  
  // Advanced checks
  if (password.length >= 12) {
    score += 1;
  }
  
  if (password.length >= 16) {
    score += 1;
  }
  
  // Common password check (simplified for example)
  const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('Password is too common');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback
  };
}