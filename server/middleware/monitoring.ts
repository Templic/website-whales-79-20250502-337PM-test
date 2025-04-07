/**
 * Monitoring middleware for request timing and metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import monitoring from '../monitoring';

/**
 * Middleware to record request timing and API metrics
 */
export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for static assets, non-API routes, or frontend routes that will be proxied
  if (
    req.path.includes('/public/') || 
    req.path.includes('.') || 
    req.path === '/favicon.ico' ||
    isFrontendRoute(req.path)
  ) {
    return next();
  }
  
  // Record start time
  const startTime = process.hrtime();
  
  // Store original end method
  const originalEnd = res.end;
  
  // Override end method to calculate duration and record metrics
  // @ts-ignore TypeScript has issues with the express Response.end overloading
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): Response {
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
    
    // Set timing header for debugging - only for API routes to avoid proxy issues
    if (req.path.startsWith('/api')) {
      try {
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.warn('Could not set timing header:', err.message);
        } else {
          console.warn('Could not set timing header:', err);
        }
      }
    }
    
    // Call original end method
    // @ts-ignore TypeScript has issues with the method overloading
    return originalEnd.apply(res, [chunk, encoding, callback]);
  };
  
  next();
}

/**
 * Helper to determine if a route is a frontend route that will be proxied
 */
function isFrontendRoute(path: string): boolean {
  const frontendRoutes = [
    '/',
    '/about',
    '/new-music',
    '/archived-music',
    '/tour',
    '/engage',
    '/newsletter',
    '/blog',
    '/collaboration',
    '/contact',
    '/static'
  ];
  
  return frontendRoutes.some(route => 
    path === route || 
    (route !== '/' && path.startsWith(route + '/'))
  );
}

/**
 * Middleware to add uptime and server info to responses
 */
export function serverInfoMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip for frontend routes that will be proxied
  if (isFrontendRoute(req.path)) {
    return next();
  }

  // Add headers with server info, only if headers haven't been sent yet
  try {
    if (!res.headersSent) {
      res.setHeader('X-Server-Uptime', process.uptime().toFixed(0));
      res.setHeader('X-Node-Version', process.version);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('Could not set server info headers:', err.message);
    } else {
      console.warn('Could not set server info headers:', err);
    }
  }
  
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