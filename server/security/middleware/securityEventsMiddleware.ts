/**
 * Security Events Middleware
 * 
 * This middleware integrates the batched security event system with Express.
 */

import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

import {
  securityEventService,
  SecurityEventType,
  SecurityEventSource,
  EventLoggingOptions
} from '../events/SecurityEventService';
import { EventPriority } from '../events/BatchedEventProcessor';

/**
 * Configuration for the security events middleware
 */
export interface SecurityEventsMiddlewareOptions {
  /**
   * Whether to log all requests
   */
  logAllRequests?: boolean;
  
  /**
   * Whether to log API requests
   */
  logApiRequests?: boolean;
  
  /**
   * Whether to log admin requests
   */
  logAdminRequests?: boolean;
  
  /**
   * Whether to log errors
   */
  logErrors?: boolean;
  
  /**
   * What priority to assign to regular requests
   */
  requestPriority?: EventPriority;
  
  /**
   * What priority to assign to API requests
   */
  apiRequestPriority?: EventPriority;
  
  /**
   * What priority to assign to admin requests
   */
  adminRequestPriority?: EventPriority;
  
  /**
   * What priority to assign to errors
   */
  errorPriority?: EventPriority;
  
  /**
   * Paths to exclude from logging
   */
  excludePaths?: string[];
  
  /**
   * Event logging options
   */
  loggingOptions?: EventLoggingOptions;
}

/**
 * Default middleware options
 */
const defaultOptions: SecurityEventsMiddlewareOptions = {
  logAllRequests: false,
  logApiRequests: true,
  logAdminRequests: true,
  logErrors: true,
  requestPriority: EventPriority.INFO,
  apiRequestPriority: EventPriority.INFO,
  adminRequestPriority: EventPriority.MEDIUM,
  errorPriority: EventPriority.HIGH,
  excludePaths: [
    '/health',
    '/favicon.ico',
    '/static',
    '/assets',
    '/_next',
    '/api/health'
  ],
  loggingOptions: {
    includeHeaders: false
  }
};

/**
 * Create middleware for logging security events
 * 
 * @param options Middleware options
 */
export function createSecurityEventsMiddleware(
  options: SecurityEventsMiddlewareOptions = {}
) {
  // Merge options with defaults
  const config = {
    ...defaultOptions,
    ...options,
    excludePaths: [
      ...(defaultOptions.excludePaths || []),
      ...(options.excludePaths || [])
    ],
    loggingOptions: {
      ...defaultOptions.loggingOptions,
      ...options.loggingOptions
    }
  };
  
  console.log(chalk.blue('[SecurityEventsMiddleware] Creating middleware with options:'), {
    logApiRequests: config.logApiRequests,
    logAdminRequests: config.logAdminRequests,
    logErrors: config.logErrors
  });
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    const path = req.originalUrl || req.url;
    
    if (config.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      return next();
    }
    
    // Determine if this is an API or admin request
    const isApiRequest = path.startsWith('/api');
    const isAdminRequest = path.includes('/admin') || path.includes('/dashboard');
    
    // Should we log this request?
    const shouldLog = (
      config.logAllRequests ||
      (isApiRequest && config.logApiRequests) ||
      (isAdminRequest && config.logAdminRequests)
    );
    
    if (!shouldLog) {
      return next();
    }
    
    // Determine event type and priority
    let eventType = SecurityEventType.API_REQUEST;
    let priority = config.requestPriority;
    
    if (isAdminRequest) {
      eventType = SecurityEventType.ACCESS_ADMIN_ACTION;
      priority = config.adminRequestPriority;
    } else if (isApiRequest) {
      eventType = SecurityEventType.API_REQUEST;
      priority = config.apiRequestPriority;
    }
    
    // Log the request
    const source = isApiRequest ? SecurityEventSource.API : SecurityEventSource.WEB;
    
    // Create a correlation ID for this request if it doesn't have one
    const correlationId = req.headers['x-correlation-id'] as string || undefined;
    
    // Extra details to log
    const details: Record<string, any> = {
      route: path,
      method: req.method
    };
    
    // Add session ID if available
    if (req.session?.id) {
      details.sessionId = req.session.id;
    }
    
    // Add user ID if available
    if (req.user?.id) {
      details.userId = req.user.id;
    }
    
    // Add query parameters if present (sanitized)
    if (Object.keys(req.query).length > 0) {
      const sanitizedQuery = { ...req.query };
      
      // Remove sensitive fields
      delete sanitizedQuery.password;
      delete sanitizedQuery.token;
      delete sanitizedQuery.accessToken;
      delete sanitizedQuery.refreshToken;
      
      details.query = sanitizedQuery;
    }
    
    // Log the event
    securityEventService.logFromRequest(eventType, req, details, {
      priority,
      correlationId,
      ...config.loggingOptions
    });
    
    // Set start time for response time tracking
    const startTime = Date.now();
    
    // Capture response
    const originalEnd = res.end;
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override end method to log response
    res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): any {
      if (config.logErrors && res.statusCode >= 400) {
        // Log error response
        const errorDetails = {
          statusCode: res.statusCode,
          responseTime: Date.now() - startTime,
          route: path,
          method: req.method
        };
        
        // Determine event type based on status code
        let errorType = SecurityEventType.API_ERROR;
        
        if (res.statusCode === 401) {
          errorType = SecurityEventType.ACCESS_UNAUTHORIZED;
        } else if (res.statusCode === 403) {
          errorType = SecurityEventType.ACCESS_PERMISSION_DENIED;
        } else if (res.statusCode === 429) {
          errorType = SecurityEventType.API_RATE_LIMIT;
        }
        
        securityEventService.logFromRequest(errorType, req, errorDetails, {
          priority: config.errorPriority,
          correlationId,
          ...config.loggingOptions
        });
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding, callback);
    } as typeof res.end;
    
    // Override json method to log response
    res.json = function(body: any): Response {
      if (config.logErrors && res.statusCode >= 400 && body?.error) {
        // Additional error details from JSON response
        const errorDetails = {
          statusCode: res.statusCode,
          responseTime: Date.now() - startTime,
          error: body.error,
          message: body.message,
          route: path,
          method: req.method
        };
        
        securityEventService.logFromRequest(SecurityEventType.API_ERROR, req, errorDetails, {
          priority: config.errorPriority,
          correlationId,
          ...config.loggingOptions
        });
      }
      
      // Call original json method
      return originalJson.call(this, body);
    } as typeof res.json;
    
    // Continue to next middleware
    next();
  };
}

/**
 * Middleware to log all requests
 */
export const logAllRequestsMiddleware = createSecurityEventsMiddleware({
  logAllRequests: true
});

/**
 * Middleware to log API requests
 */
export const logApiRequestsMiddleware = createSecurityEventsMiddleware({
  logApiRequests: true,
  logAllRequests: false
});

/**
 * Middleware to log admin requests
 */
export const logAdminRequestsMiddleware = createSecurityEventsMiddleware({
  logAdminRequests: true,
  logAllRequests: false,
  logApiRequests: false
});

/**
 * Flush security events when the application is shutting down
 */
export async function flushSecurityEvents(): Promise<void> {
  console.log(chalk.blue('[SecurityEventsMiddleware] Flushing security events...'));
  
  try {
    const result = await securityEventService.flush();
    console.log(chalk.green(
      `[SecurityEventsMiddleware] Flushed security events. Processed: ${result.processed}, Failed: ${result.failed}`
    ));
  } catch (error) {
    console.error(chalk.red('[SecurityEventsMiddleware] Error flushing security events:'), error);
  }
}

// Register shutdown handler
process.on('SIGTERM', async () => {
  await flushSecurityEvents();
});

process.on('SIGINT', async () => {
  await flushSecurityEvents();
});

// Export default middleware
export default createSecurityEventsMiddleware;