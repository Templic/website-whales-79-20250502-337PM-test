/**
 * Runtime Application Self-Protection (RASP: any) Middleware
 * 
 * This middleware integrates RASP capabilities into Express applications,
 * monitoring requests at runtime to detect and prevent attacks.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  raspManager, 
  createRASPMiddleware, 
  RASPProtectionLevel,
  RASPProtectionCategory
} from '../security/advanced/rasp/RASPManager';
import { securityBlockchain } from '../security/advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from '../security/advanced/blockchain/ImmutableSecurityLogs';

/**
 * Default RASP middleware with maximum protection
 */
export const raspMiddleware = createRASPMiddleware({
  protectionLevel: RASPProtectionLevel.PREVENTION,
  blockRequests: true,
  logEvents: true,
  enableCategories: [
    RASPProtectionCategory.INPUT_VALIDATION,
    RASPProtectionCategory.COMMAND_INJECTION,
    RASPProtectionCategory.PATH_TRAVERSAL,
    RASPProtectionCategory.API_SECURITY,
    RASPProtectionCategory.MALICIOUS_PAYLOAD
  ]
});

/**
 * RASP middleware in monitoring mode (doesn't block requests)
 */
export const raspMonitoringMiddleware = createRASPMiddleware({
  protectionLevel: RASPProtectionLevel.MONITORING,
  blockRequests: false,
  logEvents: true,
  enableCategories: [
    RASPProtectionCategory.INPUT_VALIDATION,
    RASPProtectionCategory.COMMAND_INJECTION,
    RASPProtectionCategory.PATH_TRAVERSAL,
    RASPProtectionCategory.API_SECURITY,
    RASPProtectionCategory.MALICIOUS_PAYLOAD
  ]
});

/**
 * RASP middleware in detection mode (logs attacks but doesn't block)
 */
export const raspDetectionMiddleware = createRASPMiddleware({
  protectionLevel: RASPProtectionLevel.DETECTION,
  blockRequests: false,
  logEvents: true,
  enableCategories: [
    RASPProtectionCategory.INPUT_VALIDATION,
    RASPProtectionCategory.COMMAND_INJECTION,
    RASPProtectionCategory.PATH_TRAVERSAL,
    RASPProtectionCategory.API_SECURITY,
    RASPProtectionCategory.MALICIOUS_PAYLOAD,
    RASPProtectionCategory.AUTHENTICATION,
    RASPProtectionCategory.MEMORY_PROTECTION
  ]
});

/**
 * Middleware to log request information
 */
export const requestLoggingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Create an audit log entry for the request
    await securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.API,
      message: `API request: ${req.method} ${req.originalUrl}`,
      user: (req.user as any)?.id || 'anonymous',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      metadata: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer || req.headers.referrer
      }
    });
    
    // Continue processing
    next();
  } catch (error: unknown) {
    console.error('Error in request logging middleware:', error);
    next();
  }
};

/**
 * Middleware to monitor for suspicious activity
 */
export const suspiciousActivityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for suspiciously large requests
    const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
    if (contentLength > 10 * 1024 * 1024) { // 10 MB
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.MEDIUM,
        category: SecurityEventCategory.ATTACK_ATTEMPT,
        message: 'Suspiciously large request detected',
        user: (req.user as any)?.id || 'anonymous',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        metadata: {
          contentLength,
          method: req.method,
          url: req.originalUrl
        }
      }).catch(error => {
        console.error('Error logging suspicious activity:', error);
      });
    }
    
    // Continue processing
    next();
  } catch (error: unknown) {
    console.error('Error in suspicious activity middleware:', error);
    next();
  }
};

/**
 * Combined RASP middleware with logging and monitoring
 */
export const secureRequestMiddleware = [
  requestLoggingMiddleware,
  suspiciousActivityMiddleware,
  raspMiddleware
];