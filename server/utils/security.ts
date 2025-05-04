/**
 * Security Utilities
 * 
 * A collection of utility functions for security operations.
 */

import { Request } from 'express';

/**
 * Get the client IP address from the request, handling proxy servers
 * This is needed for PCI DSS Requirement 10.3.1 (Audit trail must include IP addresses)
 */
export function getClientIPFromRequest(req: Request): string {
  // Check for X-Forwarded-For header (used by many proxies)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs in a comma-separated list
    // The first one is the original client IP
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
      return xForwardedFor[0].split(',')[0].trim();
    }
  }
  
  // Check for X-Real-IP header (used by Nginx)
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    if (typeof xRealIp === 'string') {
      return xRealIp;
    } else if (Array.isArray(xRealIp) && xRealIp.length > 0) {
      return xRealIp[0];
    }
  }
  
  // Fall back to the remote address from the connection
  const remoteAddress = req.socket.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }
  
  // If all else fails, use a placeholder
  return 'unknown';
}

/**
 * Redact sensitive information from logs and error messages
 * Implements PCI DSS Requirement 3.4 (Render PAN unreadable anywhere it is stored)
 */
export function redactSensitiveInfo(input: string): string {
  if (!input) return input;
  
  // Redact potential credit card numbers (using common patterns)
  let redacted = input.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED CARD NUMBER]');
  
  // Redact potential CVV/CVC codes (3-4 digits that might be labeled as such)
  redacted = redacted.replace(/\b(cvv|cvc|security code|securitycode|card code|cardcode)(\s*):?(\s*)[0-9]{3,4}\b/gi, '$1$2$3[REDACTED]');
  
  // Redact potential API keys and secrets
  redacted = redacted.replace(/\b(api[_-]?key|secret|password|token)(\s*):?(\s*)[A-Za-z0-9_\-]{20,}/gi, '$1$2$3[REDACTED]');
  
  // Redact email addresses for privacy
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED EMAIL]');
  
  // Redact potential SSN/Tax IDs
  redacted = redacted.replace(/\b[0-9]{3}[-]?[0-9]{2}[-]?[0-9]{4}\b/g, '[REDACTED SSN]');
  
  return redacted;
}

/**
 * Sanitize HTML or potential XSS content from user input
 * Implements PCI DSS Requirement 6.5.7 (Prevent XSS)
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return input;
  
  // Replace potential HTML/script tags
  let sanitized = input.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Replace potential script events
  sanitized = sanitized.replace(/on\w+=/g, 'disabled=');
  
  // Replace potential JavaScript URIs
  sanitized = sanitized.replace(/javascript:/g, 'invalid:');
  
  return sanitized;
}

/**
 * Generate a secure random token for CSRF or other security purposes
 * Implements PCI DSS Requirement 6.5.9 (Cross-site request forgery)
 */
export function generateSecureToken(length: number = 32): string {
  // In a Node.js environment, use the crypto module for secure random values
  try {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    // Fallback to a less secure but still reasonable method
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Create a Uint8Array for randomness
    const randomValues = new Uint8Array(length);
    
    // In a browser environment, use the Web Crypto API
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomValues);
    } else {
      // Last resort fallback (not cryptographically secure)
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * chars.length);
      }
    }
    
    // Convert random values to a string
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
    
    return result;
  }
}

/**
 * Perform timing-safe string comparison to prevent timing attacks
 * Important for comparing security tokens, CSRF tokens, etc.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Always compare all characters to prevent timing attacks
    let result = 0;
    const max = Math.max(a.length, b.length);
    
    for (let i = 0; i < max; i++) {
      result |= (i < a.length ? a.charCodeAt(i) : 0) ^ (i < b.length ? b.charCodeAt(i) : 0);
    }
    
    return result === 0;
  }
  
  // For equal length strings, compare each character
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}