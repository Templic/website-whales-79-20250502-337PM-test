/**
 * Security utilities for enhanced protection and monitoring
 */

import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Security event types
export type SecurityEventType = 'WARNING' | 'ERROR' | 'ALERT' | 'INFO' | 'AUTH' | 'ACCESS';

// Security severity levels
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

// Security event structure
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp?: string;
  details: string;
  severity: SecuritySeverity;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  userId?: number | string;
  metadata?: any;
}

// In-memory log buffer (recent events)
const recentSecurityEvents: SecurityEvent[] = [];
const MAX_BUFFER_SIZE = 1000; // Maximum events to keep in memory

// Log directory - default to logs directory
const LOG_DIR = process.env.SECURITY_LOG_DIR || './logs';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create security log directory:', error);
  }
}

/**
 * Log a security event to file and memory
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // Add timestamp if not provided
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }
  
  // Add to in-memory buffer
  recentSecurityEvents.push(event);
  
  // Trim buffer if needed
  if (recentSecurityEvents.length > MAX_BUFFER_SIZE) {
    recentSecurityEvents.shift();
  }
  
  // Log to console for high/critical events
  if (event.severity === 'high' || event.severity === 'critical') {
    console.error(`SECURITY ${event.type} [${event.severity}]: ${event.details}`);
  }
  
  // Format log entry
  const logEntry = JSON.stringify({
    ...event,
    timestamp: event.timestamp
  });
  
  // Write to daily log file
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const logFile = path.join(LOG_DIR, `security-${today}.log`);
  
  fs.appendFile(logFile, logEntry + '\n', (err) => {
    if (err) {
      console.error('Failed to write security log:', err);
    }
  });
}

/**
 * Get recent security events from memory
 */
export function getRecentSecurityEvents(options: {
  limit?: number;
  severity?: SecuritySeverity;
  type?: SecurityEventType;
  userId?: number | string;
} = {}): SecurityEvent[] {
  const { limit = 100, severity, type, userId } = options;
  
  // Filter events based on options
  let events = [...recentSecurityEvents];
  
  if (severity) {
    events = events.filter(e => e.severity === severity);
  }
  
  if (type) {
    events = events.filter(e => e.type === type);
  }
  
  if (userId !== undefined) {
    events = events.filter(e => e.userId === userId);
  }
  
  // Sort by most recent first
  events.sort((a, b) => {
    return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
  });
  
  // Limit results
  return events.slice(0, limit);
}

/**
 * Security middleware to detect and block common attack patterns
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = (req as any).user?.id;
  
  // Check for suspicious query parameters
  const suspiciousParams = ['__proto__', 'constructor', 'prototype'];
  
  for (const param of suspiciousParams) {
    if (param in req.query) {
      logSecurityEvent({
        type: 'WARNING',
        details: `Suspicious query parameter detected: ${param}`,
        severity: 'medium',
        path: req.path,
        method: req.method,
        ip,
        userAgent,
        userId
      });
      
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid query parameters'
      });
    }
  }
  
  // Check for SQL injection patterns in query parameters
  const sqlInjectionPatterns = [
    /(\%27)|(')|(--)|(%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(')|(--)|(%23)|(#))/i,
    /\w*((\%27)|(')|(--)|(#)|(\%3B)|(;))/i,
    /((\%27)|(')|(--)|(#))[^\n]*/i,
    /exec(\s|\+)+(s|x)p/i,
    /UNION(\s|\+)+SELECT/i
  ];
  
  const queryString = req.url.split('?')[1] || '';
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(queryString)) {
      logSecurityEvent({
        type: 'ALERT',
        details: 'Possible SQL injection attempt detected in query parameters',
        severity: 'high',
        path: req.path,
        method: req.method,
        ip,
        userAgent,
        userId
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request detected'
      });
    }
  }
  
  // Continue to next middleware
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
}

export default {
  logSecurityEvent,
  getRecentSecurityEvents,
  securityMiddleware,
  securityHeaders
};