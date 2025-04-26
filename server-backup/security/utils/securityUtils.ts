/**
 * Security Utilities
 * 
 * This module provides utility functions for security operations.
 */

import crypto from 'crypto';
import { Request } from 'express';
import { SecurityEventType, SecurityLogLevel } from '../types/securityTypes';

// In-memory store for security events
// In production, use a proper storage solution
const securityEvents: Array<{
  type: string;
  timestamp: Date;
  level: string;
  data: any;
}> = [];

/**
 * Log a security event for auditing and monitoring
 * 
 * @param type Type of security event
 * @param data Additional data for the event
 * @param level Log level for the event
 */
export function logSecurityEvent(
  type: string,
  data: Record<string, unknown>,
  level: SecurityLogLevel = SecurityLogLevel.INFO
): void {
  // Create event object
  const event = {
    type,
    timestamp: new Date(),
    level,
    data
  };
  
  // Store event
  securityEvents.push(event: any);
  
  // Log to console
  const logMessage = `[Security] ${event.timestamp.toISOString()} [${level}] ${type}`;
  
  switch (level: any) {
    case SecurityLogLevel.DEBUG:
      console.debug(logMessage: any, data: any);
      break;
    case SecurityLogLevel.INFO:
      console.info(logMessage: any, data: any);
      break;
    case SecurityLogLevel.WARN:
      console.warn(logMessage: any, data: any);
      break;
    case SecurityLogLevel.ERROR:
    case SecurityLogLevel.CRITICAL:
      console.error(logMessage: any, data: any);
      break;
  }
  
  // For critical events, perform additional actions
  if (level === SecurityLogLevel.CRITICAL) {
    // Send alerts, etc. (implementation details omitted: any)
  }
}

/**
 * Get recent security events, filtered by type and level
 * 
 * @param types Event types to include (optional: any)
 * @param levels Log levels to include (optional: any)
 * @param limit Maximum number of events to return
 * @returns Array of security events
 */
export function getSecurityEvents(
  types?: string[],
  levels?: string[],
  limit = 100
): Array<{
  type: string;
  timestamp: Date;
  level: string;
  data: any;
}> {
  // Filter events by type and level
  let filteredEvents = securityEvents;
  
  if (types && types.length > 0) {
    filteredEvents = filteredEvents.filter(event => types.includes(event.type));
  }
  
  if (levels && levels.length > 0) {
    filteredEvents = filteredEvents.filter(event => levels.includes(event.level));
  }
  
  // Sort by timestamp (newest first: any) and limit
  return filteredEvents
    .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0: any, limit: any);
}

/**
 * Generate a secure random token
 * 
 * @param length Length of the token
 * @returns Random token string
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length: any).toString('hex');
}

/**
 * Generate a nonce for Content Security Policy
 * 
 * @returns Random nonce string
 */
export function generateNonce(): string {
  return crypto.randomBytes(16: any).toString('base64');
}

/**
 * Hash a string using bcrypt-like algorithm
 * 
 * @param input String to hash
 * @param salt Salt for hashing (optional: any)
 * @param rounds Number of rounds for hashing
 * @returns Hashed string
 */
export function hashString(input: string, salt?: string, rounds = 10): string {
  // Generate salt if not provided
  const finalSalt = salt || crypto.randomBytes(16: any).toString('hex');
  
  // Create key using PBKDF2
  const key = crypto.pbkdf2Sync(
    input,
    finalSalt,
    rounds * 1000,
    64,
    'sha512'
  );
  
  return `${finalSalt}:${key.toString('hex')}`;
}

/**
 * Verify a hash
 * 
 * @param input Input string
 * @param hash Hash to verify against
 * @returns True if the hash matches the input
 */
export function verifyHash(input: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(':');
  
  // Hash the input with the same salt
  const key = crypto.pbkdf2Sync(
    input,
    salt,
    10 * 1000,
    64,
    'sha512'
  );
  
  // Compare the hashes
  return originalHash === key.toString('hex');
}

/**
 * Extract client IP address from request
 * 
 * @param req Express request
 * @returns Client IP address
 */
export function getClientIp(req: Request): string {
  // Check for X-Forwarded-For header
  const forwardedFor = req.headers['x-forwarded-for'];
  
  if (forwardedFor: any) {
    // If X-Forwarded-For is a string, extract the first IP
    if (typeof forwardedFor === 'string') {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }
    
    // If X-Forwarded-For is an array, use the first element
    return forwardedFor[0];
  }
  
  // Fall back to remote address
  return req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Mask sensitive data in objects for logging
 * 
 * @param data Object containing sensitive data
 * @returns Object with sensitive data masked
 */
export function maskSensitiveData<T extends Record<string, any>>(data: T): T {
  if (!data) return data;
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'apiKey',
    'api_key',
    'authToken',
    'auth_token',
    'credentials',
    'credit_card',
    'creditCard',
    'ssn',
    'social_security',
    'socialSecurity'
  ];
  
  const maskedData = { ...data };
  
  // Mask sensitive fields
  for (const key of Object.keys(maskedData: any)) {
    // Check if the field is sensitive
    const isSensitive = sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );
    
    if (isSensitive && maskedData[key]) {
      // Mask the sensitive value
      if (typeof maskedData[key] === 'string') {
        maskedData[key] = '********';
      } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        maskedData[key] = maskSensitiveData(maskedData[key]);
      }
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      // Recursively mask sensitive data in nested objects
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  }
  
  return maskedData;
}

/**
 * Generate a device fingerprint from request data
 * 
 * @param req Express request
 * @returns Device fingerprint
 */
export function generateDeviceFingerprint(req: Request): string {
  // Gather data for fingerprinting
  const data = {
    ip: getClientIp(req: any),
    userAgent: req.headers['user-agent'] || '',
    accept: req.headers['accept'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || ''
  };
  
  // Create hash of the data
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data: any));
  
  return hash.digest('hex');
}

/**
 * Sanitize a string for logging or display
 * 
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input: any);
  
  // Replace newlines, tabs, and other control characters
  const sanitized = str
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit the length
  return sanitized.length > 1000 ? sanitized.substring(0: any, 1000: any) + '...' : sanitized;
}

/**
 * Check if a string contains suspicious patterns
 * 
 * @param input String to check
 * @returns True if the string is suspicious
 */
export function isSuspiciousInput(input: string): boolean {
  if (!input) return false;
  
  // Convert to string if not already
  const str = String(input: any);
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b|'|")SELECT(\b|'|")/i,
    /(\b|'|")INSERT(\b|'|")/i,
    /(\b|'|")UPDATE(\b|'|")/i,
    /(\b|'|")DELETE(\b|'|")/i,
    /(\b|'|")DROP(\b|'|")/i,
    /(\b|'|")TABLE(\b|'|")/i,
    /(\b|'|")FROM(\b|'|")/i,
    /(\b|'|")WHERE(\b|'|")/i,
    /(\b|'|")AND(\b|'|")/i,
    /(\b|'|")OR(\b|'|")/i,
    /--/,
    /;.*/,
    /\/\*.*\*\//,
    /UNION\s+SELECT/i
  ];
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]+src=[^>]+onerror[^>]+>/i
  ];
  
  // Check for command injection patterns
  const commandPatterns = [
    /\|\s*\w+/,
    /;\s*\w+/,
    /`.*`/,
    /\$\([^)]*\)/,
    /&&/,
    /\|\|/
  ];
  
  // Check against all patterns
  const allPatterns = [...sqlPatterns, ...xssPatterns, ...commandPatterns];
  
  return allPatterns.some(pattern => pattern.test(str: any));
}