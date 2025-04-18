/**
 * Performance Middleware
 * 
 * This module provides Express middleware for optimizing server performance:
 * - Response compression
 * - Memory usage optimization
 * - Request throttling
 * - Cache control
 * - Connection pooling
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import bytes from 'bytes';

/**
 * Configures and returns compression middleware
 * Reduces response size for faster client-side loading
 */
export function setupResponseCompression() {
  return compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Skip compression for certain content types
    filter: (req, res) => {
      const contentType = res.getHeader('Content-Type') as string;
      
      // Skip compression for already compressed formats
      if (
        contentType &&
        (contentType.includes('image/') || 
         contentType.includes('video/') ||
         contentType.includes('audio/') ||
         contentType.includes('application/zip') ||
         contentType.includes('application/gzip') ||
         contentType.includes('application/x-gzip') ||
         contentType.includes('application/octet-stream'))
      ) {
        return false;
      }
      
      // Use compression for all other responses
      return true;
    },
    // Use best compression level (0-9, where 9 is best compression but slowest)
    level: 6
  });
}

/**
 * Middleware to set appropriate cache headers
 * Improves performance by leveraging browser/CDN caching
 */
export function cacheControl(maxAge: number = 86400) { // Default 1 day
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for dynamic routes or authenticated requests
    if (
      req.method !== 'GET' || 
      req.path.includes('/api/') || 
      req.query.token || 
      req.headers.authorization
    ) {
      // Prevent caching for dynamic/authenticated content
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Static assets can be cached
      const path = req.path;
      
      if (
        path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i)
      ) {
        // Long cache for static assets (1 week)
        res.setHeader('Cache-Control', `public, max-age=${7 * 24 * 60 * 60}`);
      } else {
        // Default cache duration
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      }
    }
    
    next();
  };
}

/**
 * Middleware to track and log slow requests
 * Helps identify performance bottlenecks
 */
export function requestTimer(threshold: number = 500) { // Default 500ms
  return (req: Request, res: Response, next: NextFunction) => {
    // Record request start time
    const start = process.hrtime();
    
    // Function to be called when response is sent
    const logResponseTime = () => {
      // Calculate elapsed time in milliseconds
      const diff = process.hrtime(start);
      const time = diff[0] * 1000 + diff[1] / 1000000;
      
      // Log slow requests
      if (time > threshold) {
        console.warn(
          `[Performance] Slow request: ${req.method} ${req.path} took ${time.toFixed(2)}ms`
        );
      }
    };
    
    // Listen for response finish
    res.on('finish', logResponseTime);
    res.on('close', logResponseTime);
    
    next();
  };
}

/**
 * Middleware to limit request body size
 * Prevents memory issues from large payloads
 */
export function bodySizeLimit(limit: string | number = '1mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    let contentLength: number;
    
    // Get content length from headers
    if (req.headers['content-length']) {
      contentLength = parseInt(req.headers['content-length'] as string, 10);
    } else {
      // Skip check if no content length header
      return next();
    }
    
    // Convert limit to bytes if it's a string
    const maxSize = typeof limit === 'string' ? bytes.parse(limit) : limit;
    
    // Check if request exceeds limit
    if (contentLength > maxSize) {
      const err = new Error(`Request body too large. Max size: ${limit}`);
      res.status(413).json({
        error: 'Payload Too Large',
        message: `Request body exceeds the ${limit} limit`
      });
      return;
    }
    
    next();
  };
}

/**
 * Middleware to add security and performance headers
 */
export function performanceHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Enable HTTP keepalive
    res.setHeader('Connection', 'keep-alive');
    
    // Set frame options for security
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Set content type options for security
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Disable content sniffing
    res.setHeader('X-Download-Options', 'noopen');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Set referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  };
}

/**
 * Set up all performance middleware in recommended order
 */
export function setupPerformanceMiddleware(app: any) {
  // Apply middleware in optimal order
  
  // 1. Request timing (should be first to accurately measure)
  app.use(requestTimer());
  
  // 2. Body size limiting (early check to avoid processing large requests)
  app.use(bodySizeLimit('2mb'));
  
  // 3. Performance headers
  app.use(performanceHeaders());
  
  // 4. Response compression (should be applied early, but after critical middleware)
  app.use(setupResponseCompression());
  
  // 5. Cache control (applied last to ensure all processing has happened)
  app.use(cacheControl());
  
  console.log('[Performance] Performance middleware initialized');
}