/**
 * Monitoring middleware for request timing and metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import monitoring from '../monitoring';

/**
 * Middleware to record request timing and API metrics
 */
export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for static assets or non-API routes if desired
  if (req.path.includes('/public/') || req.path.includes('.') || req.path === '/favicon.ico') {
    return next();
  }
  
  // Record start time
  const startTime = process.hrtime();
  
  // Store original end method
  const originalEnd = res.end;
  
  // Override end method to calculate duration and record metrics
  res.end = function(chunk?: any, encoding?: string, callback?: () => void): Response {
    // Calculate duration in milliseconds
    const hrTime = process.hrtime(startTime);
    const durationMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    // Record API metrics
    monitoring.recordApiRequest({
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: durationMs,
      userId: (req as any).user?.id
    });
    
    // Set timing header for debugging
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    
    // Call original end method
    return originalEnd.apply(res, [chunk, encoding, callback]);
  };
  
  next();
}

/**
 * Middleware to add uptime and server info to responses
 */
export function serverInfoMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add headers with server info
  res.setHeader('X-Server-Uptime', process.uptime().toFixed(0));
  res.setHeader('X-Node-Version', process.version);
  
  // Continue
  next();
}

/**
 * Middleware to expose system metrics endpoints
 */
export function metricsMiddleware(options: {
  path?: string;
  requireAdmin?: boolean;
} = {}) {
  const {
    path = '/api/metrics',
    requireAdmin = true
  } = options;
  
  return function(req: Request, res: Response, next: NextFunction) {
    // Check if this is a metrics request
    if (req.path === path) {
      // Check if admin access is required
      if (requireAdmin) {
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Admin role required'
          });
        }
      }
      
      // Return system metrics
      monitoring.getSystemMetrics()
        .then(metrics => {
          res.json(metrics);
        })
        .catch(err => {
          console.error('Error getting system metrics:', err);
          res.status(500).json({
            error: 'Failed to get system metrics',
            message: err.message
          });
        });
      
      return;
    }
    
    // If not a metrics request, continue to next middleware
    next();
  };
}

export default {
  requestTimingMiddleware,
  serverInfoMiddleware,
  metricsMiddleware
};