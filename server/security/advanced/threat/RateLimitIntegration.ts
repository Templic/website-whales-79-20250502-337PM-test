/**
 * Rate Limit Integration
 *
 * This module provides the integration between the rate limiting system and the rest of the application.
 * It initializes the rate limiting components, connects to middleware, and registers API routes.
 */

import { Express, Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { recordAuditEvent } from '../../secureAuditTrail';
import { 
  rateLimiters,
  createUnifiedRateLimit,
  authRateLimit,
  adminRateLimit,
  securityRateLimit,
  apiRateLimit,
  publicRateLimit 
} from './RateLimitingSystem';
import { rateLimitAnalytics } from './RateLimitingSystem';
import { threatDetectionService } from './ThreatDetectionService';

/**
 * Initialize the rate limiting system
 */
export function initializeRateLimiting(): void {
  try {
    log('Initializing rate limiting system...', 'security');
    
    // Set up periodic cleanup tasks
    setupPeriodicTasks();
    
    // Record the initialization in the audit trail
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_INIT',
      resource: 'rate-limiting',
      result: 'success',
      severity: 'info',
      details: {
        message: 'Rate limiting system initialized successfully'
      }
    });
    
    log('Rate limiting system initialized successfully', 'security');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to initialize rate limiting system: ${errorMessage}`, 'security');
  }
}

/**
 * Apply rate limiting middleware to Express application routes
 * 
 * @param app Express application
 */
export function applyRateLimiting(app: Express): void {
  try {
    log('Applying rate limiting middleware...', 'security');
    
    // Apply global rate limiting to all routes
    app.use(createUnifiedRateLimit({ tier: 'global' }));
    
    // Apply tier-specific rate limiting to route groups
    app.use('/api/auth', authRateLimit);
    app.use('/api/admin', adminRateLimit);
    app.use('/api/security', securityRateLimit);
    app.use('/api', apiRateLimit);
    
    // Route for API endpoints related to rate limiting management
    const rateLimitRouter = require('../../../routes/api/security/rateLimit').default;
    app.use('/api/security/rate-limit', rateLimitRouter);
    
    log('Rate limiting middleware applied successfully', 'security');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to apply rate limiting middleware: ${errorMessage}`, 'security');
  }
}

/**
 * Set up periodic tasks for the rate limiting system
 */
function setupPeriodicTasks(): void {
  // Periodically store rate limit violations (every 5 minutes)
  setInterval(() => {
    try {
      rateLimitAnalytics.storeViolations();
    } catch (error) {
      log(`Error storing rate limit violations: ${error}`, 'security');
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  // Periodically clear old suspicious IPs (every hour)
  setInterval(() => {
    try {
      threatDetectionService.clearOldSuspiciousIps();
    } catch (error) {
      log(`Error clearing old suspicious IPs: ${error}`, 'security');
    }
  }, 60 * 60 * 1000); // 1 hour
}

/**
 * Function to check if a request should be blocked by rate limiting
 * Useful for integrating with other security components
 * 
 * @param req The Express request
 * @param identifier The user or IP identifier
 * @returns True if the request should be rate limited
 */
export function shouldRateLimit(req: Request, identifier: string): boolean {
  try {
    // Check if the global limiter would rate limit this request
    return !rateLimiters.global.consumeSync(identifier, 1);
  } catch (error) {
    // In case of error, don't block the request
    log(`Error checking rate limit: ${error}`, 'security');
    return false;
  }
}

/**
 * Record a rate limit attempt (for use by other components)
 * 
 * @param req The Express request
 * @param identifier The user or IP identifier
 * @param wasBlocked Whether the request was blocked
 */
export function recordRateLimitAttempt(req: Request, identifier: string, wasBlocked: boolean): void {
  try {
    if (wasBlocked) {
      // Record the violation on the threat detection service
      // This will increase the threat score for subsequent requests
      threatDetectionService.recordViolation(identifier);
    }
  } catch (error) {
    log(`Error recording rate limit attempt: ${error}`, 'security');
  }
}

// Export components for use by other modules
export { 
  rateLimiters, 
  rateLimitAnalytics, 
  threatDetectionService 
};