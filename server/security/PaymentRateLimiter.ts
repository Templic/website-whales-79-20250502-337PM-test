/**
 * Payment-Specific Rate Limiter
 * 
 * Implements PCI DSS requirements:
 * - 6.5.10 (Resource Exhaustion)
 * - 6.6 (Web Application Protection)
 */

import { Request } from 'express';
import { getClientIPFromRequest } from '../utils/security';
import { recordAuditEvent } from './secureAuditTrail';

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  limitType: string;
  remaining?: number;
}

/**
 * Rate limit configuration for different operation types
 */
const RATE_LIMITS = {
  // Authentication operations (lowest limits)
  'auth': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    blockDuration: 5 * 60 * 1000 // 5 minutes
  },
  
  // Payment operations (moderate limits)
  'payment': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    blockDuration: 3 * 60 * 1000 // 3 minutes
  },
  
  // Read operations (highest limits)
  'read': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    blockDuration: 1 * 60 * 1000 // 1 minute
  }
};

/**
 * Store for rate limit data
 * In a production system, this would use Redis or another distributed cache
 */
class RateLimitStore {
  private requestCounts: Map<string, { count: number, resetTime: number }> = new Map();
  private blockedKeys: Map<string, number> = new Map(); // Map of key to block expiration time
  
  /**
   * Increment the request count for a key
   */
  incrementCount(key: string, windowMs: number): number {
    const now = Date.now();
    
    // Check if the key exists and is within the current window
    if (this.requestCounts.has(key)) {
      const record = this.requestCounts.get(key);
      
      // If the window has expired, reset the count
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        // Increment the count within the current window
        record.count += 1;
      }
      
      return record.count;
    } else {
      // Create a new record for this key
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return 1;
    }
  }
  
  /**
   * Get the current count for a key
   */
  getCount(key: string): number {
    const now = Date.now();
    
    if (this.requestCounts.has(key)) {
      const record = this.requestCounts.get(key);
      
      // If the window has expired, the count is effectively 0
      if (now > record.resetTime) {
        return 0;
      }
      
      return record.count;
    }
    
    return 0;
  }
  
  /**
   * Get the time until the rate limit resets
   */
  getTimeUntilReset(key: string): number {
    const now = Date.now();
    
    if (this.requestCounts.has(key)) {
      const record = this.requestCounts.get(key);
      
      // If the window has expired, the reset time is now
      if (now > record.resetTime) {
        return 0;
      }
      
      return Math.max(0, record.resetTime - now);
    }
    
    return 0;
  }
  
  /**
   * Block a key for a specific duration
   */
  blockKey(key: string, durationMs: number): void {
    const now = Date.now();
    const expiration = now + durationMs;
    this.blockedKeys.set(key, expiration);
  }
  
  /**
   * Check if a key is blocked
   */
  isBlocked(key: string): boolean {
    const now = Date.now();
    
    if (this.blockedKeys.has(key)) {
      const expiration = this.blockedKeys.get(key);
      
      // If the block has expired, remove it
      if (now > expiration) {
        this.blockedKeys.delete(key);
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the time until a block expires
   */
  getTimeUntilUnblocked(key: string): number {
    const now = Date.now();
    
    if (this.blockedKeys.has(key)) {
      const expiration = this.blockedKeys.get(key);
      
      // If the block has expired, the time until unblocked is 0
      if (now > expiration) {
        this.blockedKeys.delete(key);
        return 0;
      }
      
      return Math.max(0, expiration - now);
    }
    
    return 0;
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    // Clean up request counts
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
    
    // Clean up blocked keys
    for (const [key, expiration] of this.blockedKeys.entries()) {
      if (now > expiration) {
        this.blockedKeys.delete(key);
      }
    }
  }
}

/**
 * Payment-specific rate limiter to prevent API abuse
 */
export class PaymentRateLimiter {
  private store: RateLimitStore;
  
  constructor() {
    this.store = new RateLimitStore();
    
    // Set up periodic cleanup to prevent memory leaks
    setInterval(() => {
      this.store.cleanup();
    }, 60 * 60 * 1000); // Cleanup every hour
  }
  
  /**
   * Check if a request is within rate limits
   */
  checkRateLimit(req: Request): RateLimitResult {
    try {
      // Generate appropriate keys based on the operation
      const keys = this.generateLimitKeys(req);
      const operationType = this.determineOperationType(req);
      const rateLimit = RATE_LIMITS[operationType] || RATE_LIMITS['payment'];
      
      // Check for blocks first
      for (const key of keys) {
        if (this.store.isBlocked(key)) {
          const retryAfter = Math.ceil(this.store.getTimeUntilUnblocked(key) / 1000);
          
          // Log the rate limit block
          this.logRateLimitEvent(req, key, operationType, 'blocked', retryAfter);
          
          return {
            allowed: false,
            retryAfter,
            limitType: 'blocked',
            remaining: 0
          };
        }
      }
      
      // Check all dimensions of rate limiting
      let maxCount = 0;
      let maxKey = '';
      
      for (const key of keys) {
        const count = this.store.incrementCount(key, rateLimit.windowMs);
        
        if (count > maxCount) {
          maxCount = count;
          maxKey = key;
        }
        
        // Check if the count exceeds the limit
        if (count > rateLimit.maxRequests) {
          // If this is a repeated violation, block the key
          if (count >= rateLimit.maxRequests * 2) {
            this.store.blockKey(key, rateLimit.blockDuration);
            
            // Log the rate limit block
            this.logRateLimitEvent(req, key, operationType, 'auto-blocked', 
                                  Math.ceil(rateLimit.blockDuration / 1000));
            
            return {
              allowed: false,
              retryAfter: Math.ceil(rateLimit.blockDuration / 1000),
              limitType: 'auto-blocked',
              remaining: 0
            };
          }
          
          const retryAfter = Math.ceil(this.store.getTimeUntilReset(key) / 1000);
          
          // Log the rate limit exceeded event
          this.logRateLimitEvent(req, key, operationType, 'exceeded', retryAfter);
          
          return {
            allowed: false,
            retryAfter,
            limitType: 'exceeded',
            remaining: 0
          };
        }
      }
      
      // All checks passed, the request is allowed
      const remaining = rateLimit.maxRequests - maxCount;
      
      return {
        allowed: true,
        retryAfter: 0,
        limitType: 'none',
        remaining
      };
    } catch (error) {
      // Log the error but allow the request (fail open for rate limiting errors)
      console.error('[PaymentRateLimiter] Error checking rate limit:', error);
      
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'RATE_LIMIT_ERROR',
        resource: `payment:${req.path}`,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          path: req.path
        }
      });
      
      // Allow the request in case of errors
      return {
        allowed: true,
        retryAfter: 0,
        limitType: 'error',
        remaining: 1
      };
    }
  }
  
  /**
   * Generate multiple rate limit keys for a request
   */
  private generateLimitKeys(req: Request): string[] {
    const userId = req.user?.id || 'anonymous';
    const endpoint = req.path;
    const ip = getClientIPFromRequest(req);
    const method = req.method;
    
    // Create multi-dimensional keys for different limiting dimensions
    return [
      `ip:${ip}`,
      `user:${userId}`,
      `endpoint:${endpoint}`,
      `method:${method}:${endpoint}`,
      `ip+endpoint:${ip}:${endpoint}`,
      `user+endpoint:${userId}:${endpoint}`
    ];
  }
  
  /**
   * Determine the operation type for a request
   */
  private determineOperationType(req: Request): string {
    const path = req.path.toLowerCase();
    const method = req.method.toUpperCase();
    
    // Authentication operations
    if (path.includes('/auth') || path.includes('/login') || path.includes('/register')) {
      return 'auth';
    }
    
    // Read operations
    if (method === 'GET') {
      return 'read';
    }
    
    // Default to payment operations
    return 'payment';
  }
  
  /**
   * Log a rate limit event
   */
  private logRateLimitEvent(req: Request, key: string, operationType: string, limitType: string, retryAfter: number): void {
    const userId = req.user?.id;
    const ip = getClientIPFromRequest(req);
    
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'RATE_LIMIT_EVENT',
      resource: `payment:${req.path}`,
      userId: userId as string,
      ipAddress: ip,
      result: limitType === 'none' ? 'success' : 'failure',
      severity: limitType === 'none' ? 'info' : 'warning',
      details: {
        key,
        operationType,
        limitType,
        retryAfter,
        method: req.method,
        path: req.path
      }
    });
  }
}

// Create and export a singleton instance
const paymentRateLimiter = new PaymentRateLimiter();
export default paymentRateLimiter;