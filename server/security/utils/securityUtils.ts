/**
 * Security Utilities
 * 
 * This module provides utility functions for enhancing security
 * throughout the application.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';

/**
 * Generate a cryptographically secure random token
 * 
 * @param bytes - Number of random bytes (default: 32)
 * @param encoding - Encoding type (default: 'hex')
 * @returns Random token string
 */
export function generateSecureToken(
  bytes: number = 32,
  encoding: BufferEncoding = 'hex'
): string {
  return crypto.randomBytes(bytes).toString(encoding);
}

/**
 * Generate a time-limited token with built-in expiration
 * 
 * @param data - Data to include in the token
 * @param expiresInMs - Token expiration in milliseconds
 * @param secret - Secret key for signing
 * @returns Secure token containing data and expiration
 */
export function generateTimeLimitedToken<T extends Record<string, any>>(
  data: T,
  expiresInMs: number,
  secret: string
): string {
  // Create token payload
  const payload = {
    ...data,
    exp: Date.now() + expiresInMs,
    iat: Date.now(),
    jti: crypto.randomBytes(16).toString('hex')
  };
  
  // Stringify and encrypt payload
  const payloadStr = JSON.stringify(payload);
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(payloadStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine IV and encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Verify and decode a time-limited token
 * 
 * @param token - Token to verify
 * @param secret - Secret key for verification
 * @returns Decoded token data or null if invalid
 */
export function verifyTimeLimitedToken<T>(
  token: string,
  secret: string
): (T & { exp: number; iat: number; jti: string }) | null {
  try {
    // Split IV and encrypted data
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;
    
    // Decrypt payload
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(String(secret)).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse payload
    const payload = JSON.parse(decrypted) as T & { exp: number; iat: number; jti: string };
    
    // Check if token is expired
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 * 
 * @param input - User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#x60;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;');
}

/**
 * Security headers for HTTP responses
 */
export const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://analytics.example.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://img.example.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-src 'none'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

/**
 * Apply security headers to a response
 * 
 * @param res - Express response object
 */
export function applySecurityHeaders(res: Response): void {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
}

/**
 * Create a security context for a request
 * 
 * @param req - Express request object
 * @returns Security context with request metadata
 */
export function createRequestSecurityContext(req: Request) {
  return {
    timestamp: Date.now(),
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    query: req.query,
    authenticated: req.session?.userId ? true : false,
    userId: req.session?.userId,
    sessionId: req.session?.id
  };
}

/**
 * Common schema for password validation
 */
export const passwordSchema = z.string()
  .min(12, { message: 'Password must be at least 12 characters long' })
  .max(128, { message: 'Password must not exceed 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

/**
 * Estimate password strength
 * 
 * @param password - Password to evaluate
 * @returns Score from 0 (weak) to 100 (strong)
 */
export function estimatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Base score from length
  score += Math.min(20, password.length * 2);
  
  // Check for character types
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  
  // Check for variety
  const uniqueChars = new Set(password.split('')).size;
  score += Math.min(15, uniqueChars);
  
  // Check for patterns and repetitions
  if (/(.)\1\1/.test(password)) score -= 10; // Repeated characters
  if (/12345|qwerty|asdfg|zxcvb/i.test(password)) score -= 15; // Common sequences
  
  // Normalize score
  return Math.max(0, Math.min(100, score));
}

/**
 * Get feature-specific security requirements
 * 
 * @param feature - Feature name
 * @returns Security requirements for the feature
 */
export function getSecurityRequirements(feature: string) {
  const requirements: Record<string, any> = {
    'authentication': {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 5 },
      validation: { username: 'required', password: 'required' },
      securityLevel: 'high'
    },
    'payment': {
      rateLimit: { windowMs: 60 * 60 * 1000, max: 10 },
      validation: { amount: 'required', paymentMethod: 'required' },
      securityLevel: 'critical',
      requiresTLS: true
    },
    'api': {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
      validation: { apiKey: 'required' },
      securityLevel: 'medium'
    },
    'default': {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
      validation: {},
      securityLevel: 'standard'
    }
  };
  
  return requirements[feature] || requirements.default;
}