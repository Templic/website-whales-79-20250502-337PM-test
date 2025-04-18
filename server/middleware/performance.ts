/**
 * Performance Middleware Module
 * 
 * A collection of middleware functions to optimize API performance,
 * including caching, compression, and response time metrics.
 */

import { Request, Response, NextFunction } from 'express';
import { MemoryStore } from 'express-session';
import bytes from 'bytes';
import compression from 'compression';

// Simple in-memory cache store
const cacheStore = new Map<string, { data: any; timestamp: number }>();

/**
 * Cache middleware factory function
 * 
 * Creates middleware that caches responses for GET requests
 * and serves them from cache when available and valid.
 * 
 * @param ttl Time to live in milliseconds (default: 5 minutes)
 * @returns Express middleware function
 */
export function cache(ttl = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create a cache key from the URL and any query parameters
    const cacheKey = `${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(cacheKey);
    
    // If we have a valid cached response, send it
    if (cachedResponse) {
      const age = Date.now() - cachedResponse.timestamp;
      
      if (age < ttl) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `max-age=${Math.floor(ttl / 1000)}`);
        return res.json(cachedResponse.data);
      }
      
      // Cache expired, remove it
      cacheStore.delete(cacheKey);
    }
    
    // Store the original res.json function
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(body: any) {
      if (res.statusCode === 200) {
        cacheStore.set(cacheKey, {
          data: body,
          timestamp: Date.now()
        });
        res.setHeader('X-Cache', 'MISS');
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
}

/**
 * Optimized compression middleware
 * 
 * Only compresses responses above a certain size threshold
 * and for specific content types to optimize performance.
 */
export function optimizedCompression() {
  return compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    
    // Don't compress responses that are already compressed
    filter: (req, res) => {
      if (res.getHeader('Content-Type')) {
        const contentType = res.getHeader('Content-Type').toString();
        
        // Skip compression for image, audio, and video files
        if (contentType.includes('image/') || 
            contentType.includes('audio/') || 
            contentType.includes('video/') ||
            contentType.includes('application/pdf')) {
          return false;
        }
      }
      
      // Use standard compression filter for everything else
      return compression.filter(req, res);
    },
    
    // Use best compression level for text-based files
    level: 6
  });
}

/**
 * Response time metrics middleware
 * 
 * Measures and logs response times for API requests
 */
export function responseTime(options: { logSlowRequests?: boolean, threshold?: number } = {}) {
  const { logSlowRequests = true, threshold = 1000 } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    
    // Once the response is finished, calculate and log the time
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const ms = (seconds * 1000) + (nanoseconds / 1000000);
      
      // Add response time header
      res.setHeader('X-Response-Time', `${ms.toFixed(2)}ms`);
      
      // Log slow requests for debugging and optimization
      if (logSlowRequests && ms > threshold) {
        console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${ms.toFixed(2)}ms`);
      }
    });
    
    next();
  };
}

/**
 * Payload size limiter middleware
 * 
 * Limits request body size for different routes
 * to prevent abuse and optimize performance
 * 
 * @param maxSize Maximum allowed size (e.g., '1mb', '500kb')
 */
export function payloadSizeLimit(maxSize: string) {
  const maxBytes = bytes.parse(maxSize);
  
  return (req: Request, res: Response, next: NextFunction) => {
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk;
      
      // Check if body size exceeds the limit
      if (Buffer.byteLength(data) > maxBytes) {
        const error = new Error(`Request body size exceeds the limit of ${maxSize}`);
        res.status(413).json({ 
          error: 'Payload Too Large', 
          message: `Request body size exceeds the limit of ${maxSize}` 
        });
        
        // Abort the request
        req.destroy();
      }
    });
    
    next();
  };
}

/**
 * Memory cache purge function
 * 
 * Clears the cache for specific routes or all routes
 * 
 * @param routes Optional array of routes to clear from cache
 */
export function clearCache(routes?: string[]) {
  if (!routes || routes.length === 0) {
    cacheStore.clear();
    return;
  }
  
  routes.forEach(route => {
    const keys = Array.from(cacheStore.keys());
    keys.forEach(key => {
      if (key.startsWith(route)) {
        cacheStore.delete(key);
      }
    });
  });
}