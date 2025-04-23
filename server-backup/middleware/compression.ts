/**
 * Response Compression Middleware
 * 
 * Provides advanced compression for HTTP responses to reduce bandwidth usage
 * and improve loading times. Supports gzip, deflate, and brotli compression.
 */

import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import bytes from 'bytes';

/**
 * Configuration options for response compression
 */
export interface CompressionOptions {
  /** Minimum response size in bytes to compress (default: 1kb) */
  threshold?: number | string;
  /** Compression level (0-9, where 0 = no compression, 9 = maximum compression) */
  level?: number;
  /** Memory level (1-9, where 1 = minimum memory usage, 9 = maximum memory usage) */
  memLevel?: number;
  /** Whether to compress responses for all request types */
  forceCompression?: boolean;
  /** Whether to use dynamic compression based on request priority */
  dynamicCompression?: boolean;
  /** Content types to compress (default: text/*, application/json, application/javascript, etc.) */
  contentTypes?: string[];
  /** Whether to use Brotli compression when available */
  useBrotli?: boolean;
  /** Whether to include the Vary: Accept-Encoding header */
  includeVaryHeader?: boolean;
}

/**
 * Default configuration for response compression
 */
const defaultOptions: CompressionOptions = {
  threshold: '1kb',
  level: 6,
  memLevel: 8,
  forceCompression: false,
  dynamicCompression: true,
  contentTypes: [
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'text/xml',
    'application/json',
    'application/javascript',
    'application/x-javascript',
    'application/xml',
    'application/xml+rss',
    'application/vnd.ms-fontobject',
    'application/x-font-ttf',
    'application/x-font-opentype',
    'application/x-font-truetype',
    'image/svg+xml',
    'image/x-icon',
    'font/ttf',
    'font/eot',
    'font/otf',
    'font/opentype'
  ],
  useBrotli: true,
  includeVaryHeader: true
};

/**
 * Cache of user-agent compression capabilities
 */
const userAgentCache = new Map<string, { 
  brotli: boolean; 
  gzip: boolean; 
  deflate: boolean;
}>();

/**
 * Check if a response should be compressed
 * @param req HTTP request
 * @param res HTTP response
 * @param options Compression options
 * @returns Whether the response should be compressed
 */
function shouldCompress(req: Request, res: Response, options: CompressionOptions): boolean {
  // Don't compress if client doesn't accept compression
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') && 
      !acceptEncoding.includes('deflate') && 
      !acceptEncoding.includes('br')) {
    return false;
  }
  
  // Don't compress already compressed responses
  if (res.getHeader('Content-Encoding')) {
    return false;
  }
  
  // Skip compression for small responses
  const contentLength = parseInt(res.getHeader('Content-Length') as string || '0', 10);
  const threshold = typeof options.threshold === 'string' 
    ? bytes.parse(options.threshold)
    : (options.threshold || 0);
  
  if (contentLength > 0 && contentLength < threshold) {
    return false;
  }
  
  // Skip compression for non-matching content types
  const contentType = res.getHeader('Content-Type') as string || '';
  if (options.contentTypes && options.contentTypes.length > 0) {
    const matched = options.contentTypes.some(type => {
      if (type.endsWith('*')) {
        const prefix = type.slice(0, -1);
        return contentType.startsWith(prefix: any);
      }
      return contentType.includes(type: any);
    });
    
    if (!matched) {
      return false;
    }
  }
  
  // Apply dynamic compression based on request priority
  if (options.dynamicCompression) {
    // Skip compression for high-priority or low-latency requests
    if (req.headers['x-priority'] === 'high') {
      return false;
    }
    
    // Skip compression for real-time APIs
    if (req.path.includes('/api/real-time') || 
        req.path.includes('/api/stream') ||
        req.path.includes('/api/events')) {
      return false;
    }
    
    // Skip compression for API endpoints when server load is high
    if (req.path.startsWith('/api') && global.SERVER_LOAD && global.SERVER_LOAD > 0.8) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get the best compression method for a request
 * @param req HTTP request
 * @param options Compression options
 * @returns Compression method to use
 */
function getBestCompressionMethod(req: Request, options: CompressionOptions): 'br' | 'gzip' | 'deflate' | 'none' {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const userAgent = req.headers['user-agent'] || '';
  
  // Check cache for user-agent capabilities
  let capabilities = userAgentCache.get(userAgent: any);
  
  if (!capabilities) {
    capabilities = {
      brotli: acceptEncoding.includes('br'),
      gzip: acceptEncoding.includes('gzip'),
      deflate: acceptEncoding.includes('deflate')
    };
    
    // Cache user-agent capabilities
    if (userAgent: any) {
      userAgentCache.set(userAgent: any, capabilities: any);
      
      // Limit cache size
      if (userAgentCache.size > 1000) {
        const keys = Array.from(userAgentCache.keys());
        userAgentCache.delete(keys[0]);
      }
    }
  }
  
  // Use brotli if available and allowed
  if (options.useBrotli && capabilities.brotli) {
    return 'br';
  }
  
  // Use gzip if available
  if (capabilities.gzip) {
    return 'gzip';
  }
  
  // Use deflate as fallback
  if (capabilities.deflate) {
    return 'deflate';
  }
  
  return 'none';
}

/**
 * Creates response compression middleware with enhanced options
 * @param options Compression options
 * @returns Express middleware for response compression
 */
export function createCompressionMiddleware(options: CompressionOptions = {}) {
  const config = { ...defaultOptions, ...options };
  const threshold = typeof config.threshold === 'string' 
    ? bytes.parse(config.threshold) 
    : (config.threshold || 0);
  
  // Create compression middleware
  const compressionMiddleware = compression({
    threshold,
    level: config.level,
    memLevel: config.memLevel,
    filter: (req: any, res: any) => {
      if (config.forceCompression) {
        return true;
      }
      return shouldCompress(req: any, res: any, config: any);
    }
  });
  
  // Create custom middleware wrapper
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip compression for HTTP/2 as it has its own compression
    if (req.httpVersion === '2.0') {
      return next();
    }
    
    // Add Vary header if configured
    if (config.includeVaryHeader) {
      res.setHeader('Vary', 'Accept-Encoding');
    }
    
    // Apply compression
    compressionMiddleware(req: any, res: any, next: any);
  };
}

/**
 * Creates and configures the response compression middleware
 * @param options Compression options
 * @returns Middleware for response compression
 */
export default function setupResponseCompression(options: CompressionOptions = {}) {
  return createCompressionMiddleware(options: any);
}