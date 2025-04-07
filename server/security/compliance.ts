/**
 * Compliance framework for security and privacy requirements
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { logSecurityEvent } from './security';

// Session extended properties interface
interface ExtendedSession {
  user?: any;
  created?: number;
  lastActivity?: number;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    deviceId?: string;
  };
  securityInfo?: {
    mfaVerified?: boolean;
    ipVerified?: boolean;
    riskScore?: number;
  };
}

// Define compliance rules and requirements
const COMPLIANCE_SETTINGS = {
  auditLogging: {
    enabled: true,
    sensitiveRoutes: ['/api/auth', '/api/admin', '/api/user']
  },
  sessionManagement: {
    maxDuration: 24 * 60 * 60 * 1000, // 24 hours
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    checkInterval: 5 * 60 * 1000 // 5 minutes
  },
  requestLimits: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    maxUploadSize: 50 * 1024 * 1024 // 50MB
  },
  dataHandling: {
    sanitizeOutput: true,
    maskSensitiveData: true,
    sensitiveFields: ['password', 'apiKey', 'token', 'secret', 'ssn', 'creditCard']
  }
};

// Log directory for compliance auditing
const COMPLIANCE_LOG_DIR = process.env.COMPLIANCE_LOG_DIR || './logs/compliance';

// Ensure compliance log directory exists
if (!fs.existsSync(COMPLIANCE_LOG_DIR)) {
  try {
    fs.mkdirSync(COMPLIANCE_LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create compliance log directory:', error);
  }
}

/**
 * Initialize compliance framework
 */
export function initializeCompliance(): void {
  console.log('Initializing compliance framework...');
  
  // Setup interval for session activity and verification checks
  setInterval(enforceSessionPolicies, COMPLIANCE_SETTINGS.sessionManagement.checkInterval);
  
  console.log('Compliance framework initialized');
}

/**
 * Middleware for audit logging of API requests
 */
export function auditLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip for non-API or health check routes
  if (!req.path.startsWith('/api') || req.path.includes('/health')) {
    return next();
  }
  
  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const ip = req.ip || 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Get original response methods to intercept
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Log request details - avoid logging sensitive content
  const sensitiveRoute = COMPLIANCE_SETTINGS.auditLogging.sensitiveRoutes.some(
    route => req.path.startsWith(route)
  );
  
  const requestDetails = {
    method: req.method,
    path: req.path,
    query: sanitizeData(req.query),
    // Only log request body for non-sensitive routes to avoid logging credentials
    body: sensitiveRoute ? '[REDACTED]' : sanitizeData(req.body),
    headers: sanitizeRequestHeaders(req.headers)
  };
  
  // Create audit entry
  const auditEntry = {
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    ip,
    userAgent,
    request: requestDetails,
    response: {
      statusCode: 0,
      headers: {},
      timing: 0
    }
  };
  
  // Intercept response to capture status code and timing
  res.send = function(body: any): Response {
    completeAuditEntry(res, body);
    return originalSend.apply(res, [body]);
  };
  
  res.json = function(body: any): Response {
    completeAuditEntry(res, body);
    return originalJson.apply(res, [body]);
  };
  
  res.end = function(chunk?: any): Response {
    completeAuditEntry(res, chunk);
    return originalEnd.apply(res, [chunk]);
  };
  
  // Function to complete the audit entry with response data
  function completeAuditEntry(res: Response, body: any): void {
    if ((res as any).__auditLogCompleted) return;
    (res as any).__auditLogCompleted = true;
    
    auditEntry.response.statusCode = res.statusCode;
    auditEntry.response.timing = Date.now() - startTime;
    
    // Get response headers (non-sensitive)
    auditEntry.response.headers = { ...res.getHeaders() };
    
    // Log audit entry to file
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(COMPLIANCE_LOG_DIR, `audit-${today}.log`);
    
    fs.appendFile(logFile, JSON.stringify(auditEntry) + '\n', (err) => {
      if (err) {
        console.error('Failed to write audit log:', err);
      }
    });
    
    // Also log high-risk events (4xx/5xx errors)
    if (res.statusCode >= 400) {
      logSecurityEvent({
        type: 'ACCESS',
        details: `HTTP ${res.statusCode} on ${req.method} ${req.path}`,
        severity: res.statusCode >= 500 ? 'high' : 'medium',
        path: req.path,
        method: req.method,
        ip,
        userAgent,
        userId,
        metadata: {
          statusCode: res.statusCode,
          responseTime: auditEntry.response.timing,
          requestId: auditEntry.requestId
        }
      });
    }
  }
  
  next();
}

/**
 * Enforce session management compliance requirements
 */
function enforceSessionPolicies(): void {
  // This would typically use the session store to find and cleanup sessions
  // For now, we'll just log that this happened
  console.log('Session compliance policy enforcement executed');
  
  // In a real implementation, it would iterate through active sessions and:
  // 1. Check for expired total duration sessions
  // 2. Check for inactive sessions
  // 3. Apply additional verification requirements for sensitive operations
}

/**
 * Mask sensitive data in objects
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (!COMPLIANCE_SETTINGS.dataHandling.maskSensitiveData) {
    return data;
  }
  
  // Clone to avoid modifying original
  const result = Array.isArray(data) ? [...data] : { ...data };
  
  // Recursively sanitize
  Object.keys(result).forEach(key => {
    // Check if this is a sensitive field
    if (COMPLIANCE_SETTINGS.dataHandling.sensitiveFields.includes(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      // Recursively sanitize nested objects
      result[key] = sanitizeData(result[key]);
    }
  });
  
  return result;
}

/**
 * Sanitize request headers for logging (remove sensitive info)
 */
function sanitizeRequestHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Remove common sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-csrf-token',
    'x-api-key'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Middleware to ensure session compliance
 */
export function sessionComplianceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip for non-API routes or health checks
  if (!req.path.startsWith('/api') || req.path.includes('/health')) {
    return next();
  }
  
  // Check and update session information if we have a session
  if (req.session) {
    // Cast to extended session type
    const session = req.session as unknown as ExtendedSession;
    const now = Date.now();
    
    // Initialize session properties if this is a new session
    if (!session.created) {
      session.created = now;
      session.lastActivity = now;
      session.deviceInfo = {
        userAgent: req.headers['user-agent'] || 'unknown',
        ip: req.ip || 'unknown'
      };
    }
    
    // Check session expiration based on absolute time
    const sessionAge = now - (session.created || 0);
    if (sessionAge > COMPLIANCE_SETTINGS.sessionManagement.maxDuration) {
      // Session has been active too long, destroy it
      req.session.destroy((err) => {
        if (err) {
          console.error('Failed to destroy expired session:', err);
        }
      });
      
      return res.status(401).json({
        error: 'Session expired',
        message: 'Your session has expired due to maximum duration. Please login again.'
      });
    }
    
    // Check session inactivity
    const inactiveTime = now - (session.lastActivity || 0);
    if (inactiveTime > COMPLIANCE_SETTINGS.sessionManagement.inactivityTimeout) {
      // Session inactive for too long
      req.session.destroy((err) => {
        if (err) {
          console.error('Failed to destroy inactive session:', err);
        }
      });
      
      return res.status(401).json({
        error: 'Session expired',
        message: 'Your session has expired due to inactivity. Please login again.'
      });
    }
    
    // Update last activity time
    session.lastActivity = now;
  }
  
  next();
}

export default {
  initializeCompliance,
  auditLoggingMiddleware,
  sessionComplianceMiddleware
};