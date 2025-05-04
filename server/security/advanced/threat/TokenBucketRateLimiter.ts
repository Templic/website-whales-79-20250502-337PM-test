/**
 * Token Bucket Rate Limiter
 *
 * This module implements the token bucket algorithm for rate limiting.
 * It tracks tokens per bucket and allows bursts of traffic while limiting average rate.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';

/**
 * Rate limiter result
 */
export interface RateLimitResult {
  /**
   * Whether the request is limited
   */
  limited: boolean;
  
  /**
   * Remaining tokens in the bucket
   */
  remaining: number;
  
  /**
   * Time to reset the bucket (ms since epoch)
   */
  resetTime: number;
  
  /**
   * Time until the request can be retried (ms)
   */
  retryAfter: number;
}

/**
 * Bucket data
 */
interface TokenBucket {
  /**
   * Current token count
   */
  tokens: number;
  
  /**
   * Last refill timestamp
   */
  lastRefill: number;
  
  /**
   * Total tokens consumed
   */
  consumed: number;
  
  /**
   * Total tokens refilled
   */
  refilled: number;
  
  /**
   * Current capacity
   */
  capacity: number;
  
  /**
   * Current refill rate
   */
  refillRate: number;
  
  /**
   * Current refill interval
   */
  refillInterval: number;
  
  /**
   * Total requests
   */
  totalRequests: number;
  
  /**
   * Total limited requests
   */
  totalLimited: number;
  
  /**
   * Last request timestamp
   */
  lastRequest: number;
  
  /**
   * Last limited timestamp
   */
  lastLimited: number;
  
  /**
   * Last tokens requested
   */
  lastTokens: number;
}

/**
 * Configuration for token bucket rate limiter
 */
export interface TokenBucketRateLimiterConfig {
  /**
   * Bucket capacity (maximum tokens)
   */
  capacity: number;
  
  /**
   * Refill rate (tokens per interval)
   */
  refillRate: number;
  
  /**
   * Refill interval (ms)
   */
  refillInterval: number;
  
  /**
   * Whether to use context-aware rate limiting
   */
  contextAware?: boolean;
  
  /**
   * Rate limiter name for logging
   */
  name?: string;
}

/**
 * Token bucket algorithm rate limiter
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: Required<TokenBucketRateLimiterConfig>;
  private lastCleanup: number = Date.now();
  private cleanupInterval: number = 3600000; // 1 hour
  
  constructor(config: TokenBucketRateLimiterConfig) {
    // Set default config
    this.config = {
      capacity: config.capacity,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval,
      contextAware: config.contextAware ?? false,
      name: config.name || 'rate-limiter'
    };
    
    log(`Initialized token bucket rate limiter (${this.config.name}) with capacity=${this.config.capacity}, refillRate=${this.config.refillRate}, refillInterval=${this.config.refillInterval}ms`, 'security');
  }
  
  /**
   * Consume tokens from a bucket
   * 
   * @param key Bucket key
   * @param tokens Tokens to consume
   * @param context Optional context
   * @param multiplier Optional capacity multiplier
   * @returns Rate limit result
   */
  public consume(key: string, tokens = 1, context?: RateLimitContext, multiplier = 1.0): RateLimitResult {
    try {
      // Get current time
      const now = Date.now();
      
      // Clean up if needed
      if (now - this.lastCleanup > this.cleanupInterval) {
        this.cleanup();
        this.lastCleanup = now;
      }
      
      // Get or create bucket
      const bucket = this.getOrCreateBucket(key);
      
      // Update bucket stats
      bucket.totalRequests++;
      bucket.lastRequest = now;
      bucket.lastTokens = tokens;
      
      // Refill bucket
      this.refillBucket(bucket, now);
      
      // Apply multiplier to capacity (context-aware rate limiting)
      const effectiveCapacity = this.getEffectiveCapacity(bucket, context, multiplier);
      
      // Check if enough tokens
      if (bucket.tokens < tokens) {
        // Calculate retry after
        const tokensNeeded = tokens - bucket.tokens;
        const intervalsNeeded = Math.ceil(tokensNeeded / bucket.refillRate);
        const retryAfter = intervalsNeeded * bucket.refillInterval;
        
        // Calculate reset time
        const resetTime = now + (bucket.capacity - bucket.tokens) * (bucket.refillInterval / bucket.refillRate);
        
        // Update stats
        bucket.totalLimited++;
        bucket.lastLimited = now;
        
        // Return limited result
        return {
          limited: true,
          remaining: bucket.tokens,
          resetTime,
          retryAfter
        };
      }
      
      // Consume tokens
      bucket.tokens -= tokens;
      bucket.consumed += tokens;
      
      // Calculate reset time
      const resetTime = now + (effectiveCapacity - bucket.tokens) * (bucket.refillInterval / bucket.refillRate);
      
      // Return success result
      return {
        limited: false,
        remaining: bucket.tokens,
        resetTime,
        retryAfter: 0
      };
    } catch (error) {
      // Log error
      log(`Error consuming tokens: ${error}`, 'security');
      
      // Fail open
      return {
        limited: false,
        remaining: 1,
        resetTime: Date.now() + 1000,
        retryAfter: 0
      };
    }
  }
  
  /**
   * Get bucket capacity
   * 
   * @param key Bucket key
   * @param context Rate limit context
   * @param multiplier Capacity multiplier
   * @returns Effective capacity
   */
  public getCapacity(key: string, context?: RateLimitContext, multiplier = 1.0): number {
    try {
      const bucket = this.getOrCreateBucket(key);
      return this.getEffectiveCapacity(bucket, context, multiplier);
    } catch (error) {
      log(`Error getting capacity: ${error}`, 'security');
      
      return this.config.capacity;
    }
  }
  
  /**
   * Get remaining tokens in a bucket
   * 
   * @param key Bucket key
   * @returns Remaining tokens
   */
  public getRemaining(key: string): number {
    try {
      const bucket = this.buckets.get(key);
      
      if (!bucket) {
        return this.config.capacity;
      }
      
      // Refill bucket
      this.refillBucket(bucket, Date.now());
      
      return bucket.tokens;
    } catch (error) {
      log(`Error getting remaining tokens: ${error}`, 'security');
      
      return this.config.capacity;
    }
  }
  
  /**
   * Get or create a bucket
   * 
   * @param key Bucket key
   * @returns Bucket
   */
  private getOrCreateBucket(key: string): TokenBucket {
    // Check if bucket exists
    let bucket = this.buckets.get(key);
    
    // Create new bucket if not exists
    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        lastRefill: Date.now(),
        consumed: 0,
        refilled: 0,
        capacity: this.config.capacity,
        refillRate: this.config.refillRate,
        refillInterval: this.config.refillInterval,
        totalRequests: 0,
        totalLimited: 0,
        lastRequest: 0,
        lastLimited: 0,
        lastTokens: 0
      };
      
      this.buckets.set(key, bucket);
    }
    
    return bucket;
  }
  
  /**
   * Refill a bucket
   * 
   * @param bucket Bucket to refill
   * @param now Current timestamp
   */
  private refillBucket(bucket: TokenBucket, now: number): void {
    // Calculate time since last refill
    const timeSinceRefill = now - bucket.lastRefill;
    
    // Skip if no time has passed
    if (timeSinceRefill <= 0) {
      return;
    }
    
    // Calculate tokens to add
    const intervalsElapsed = timeSinceRefill / bucket.refillInterval;
    const tokensToAdd = Math.floor(intervalsElapsed * bucket.refillRate);
    
    // Skip if no tokens to add
    if (tokensToAdd <= 0) {
      return;
    }
    
    // Add tokens up to capacity
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.refilled += tokensToAdd;
    
    // Update last refill
    bucket.lastRefill = now - (timeSinceRefill % bucket.refillInterval);
  }
  
  /**
   * Get effective capacity for a bucket
   * 
   * @param bucket Bucket
   * @param context Context
   * @param multiplier Multiplier
   * @returns Effective capacity
   */
  private getEffectiveCapacity(bucket: TokenBucket, context?: RateLimitContext, multiplier = 1.0): number {
    // Apply multiplier
    let effectiveCapacity = bucket.capacity * multiplier;
    
    // Apply context adjustments
    if (this.config.contextAware && context) {
      // Adjust for authentication status
      if (context.authenticated) {
        effectiveCapacity *= 1.2; // Authenticated users get more capacity
      }
      
      // Adjust for blacklisted IPs
      if (context.isBlacklisted) {
        effectiveCapacity *= 0.1; // Blacklisted IPs get much less capacity
      }
      
      // Adjust for threat level
      if (context.threatLevel > 0) {
        effectiveCapacity *= (1 - context.threatLevel * 0.8); // Higher threat level = less capacity
      }
    }
    
    // Ensure capacity is at least 1
    return Math.max(1, Math.floor(effectiveCapacity));
  }
  
  /**
   * Clean up old buckets
   */
  private cleanup(): void {
    try {
      const now = Date.now();
      const expiry = 24 * 60 * 60 * 1000; // 24 hours
      
      let count = 0;
      
      // Check each bucket
      for (const [key, bucket] of this.buckets.entries()) {
        // Remove if last request was more than 24 hours ago
        if (now - bucket.lastRequest > expiry) {
          this.buckets.delete(key);
          count++;
        }
      }
      
      // Log cleanup
      if (count > 0) {
        log(`Cleaned up ${count} token buckets from ${this.config.name} rate limiter`, 'security');
      }
    } catch (error) {
      log(`Error cleaning up token buckets: ${error}`, 'security');
    }
  }
  
  /**
   * Reset a bucket
   * 
   * @param key Bucket key
   */
  public reset(key: string): void {
    try {
      // Check if bucket exists
      const bucket = this.buckets.get(key);
      
      if (bucket) {
        // Reset tokens
        bucket.tokens = bucket.capacity;
        bucket.lastRefill = Date.now();
        
        log(`Reset token bucket for key ${key} in ${this.config.name} rate limiter`, 'security');
      }
    } catch (error) {
      log(`Error resetting token bucket: ${error}`, 'security');
    }
  }
  
  /**
   * Reset all buckets
   */
  public resetAll(): void {
    try {
      // Reset each bucket
      for (const [key, bucket] of this.buckets.entries()) {
        bucket.tokens = bucket.capacity;
        bucket.lastRefill = Date.now();
      }
      
      log(`Reset all token buckets in ${this.config.name} rate limiter`, 'security');
    } catch (error) {
      log(`Error resetting all token buckets: ${error}`, 'security');
    }
  }
  
  /**
   * Remove a bucket
   * 
   * @param key Bucket key
   */
  public remove(key: string): void {
    try {
      // Remove bucket
      this.buckets.delete(key);
      
      log(`Removed token bucket for key ${key} from ${this.config.name} rate limiter`, 'security');
    } catch (error) {
      log(`Error removing token bucket: ${error}`, 'security');
    }
  }
  
  /**
   * Get bucket stats
   * 
   * @param key Bucket key
   * @returns Bucket stats or null if not found
   */
  public getStats(key: string): any {
    try {
      // Get bucket
      const bucket = this.buckets.get(key);
      
      if (!bucket) {
        return null;
      }
      
      // Calculate reset time
      const now = Date.now();
      this.refillBucket(bucket, now);
      const resetTime = now + (bucket.capacity - bucket.tokens) * (bucket.refillInterval / bucket.refillRate);
      
      // Return stats
      return {
        capacity: bucket.capacity,
        tokens: bucket.tokens,
        consumed: bucket.consumed,
        refilled: bucket.refilled,
        totalRequests: bucket.totalRequests,
        totalLimited: bucket.totalLimited,
        lastRequest: bucket.lastRequest ? new Date(bucket.lastRequest).toISOString() : null,
        lastLimited: bucket.lastLimited ? new Date(bucket.lastLimited).toISOString() : null,
        resetTime: new Date(resetTime).toISOString(),
        limitRate: bucket.totalRequests > 0 ? (bucket.totalLimited / bucket.totalRequests) : 0
      };
    } catch (error) {
      log(`Error getting bucket stats: ${error}`, 'security');
      
      return null;
    }
  }
  
  /**
   * Get overview of all buckets
   * 
   * @returns Overview of buckets
   */
  public getOverview(): any {
    try {
      // Get current time
      const now = Date.now();
      
      // Count active buckets
      let activeBuckets = 0;
      let limitedRequests = 0;
      let totalRequests = 0;
      
      // Check each bucket
      for (const bucket of this.buckets.values()) {
        // Add to counts
        totalRequests += bucket.totalRequests;
        limitedRequests += bucket.totalLimited;
        
        // Count active buckets (used in last hour)
        if (now - bucket.lastRequest < 3600000) {
          activeBuckets++;
        }
      }
      
      // Return overview
      return {
        name: this.config.name,
        buckets: this.buckets.size,
        activeBuckets,
        totalRequests,
        limitedRequests,
        limitRate: totalRequests > 0 ? (limitedRequests / totalRequests) : 0,
        defaultCapacity: this.config.capacity,
        defaultRefillRate: this.config.refillRate,
        defaultRefillInterval: this.config.refillInterval,
        contextAware: this.config.contextAware
      };
    } catch (error) {
      log(`Error getting bucket overview: ${error}`, 'security');
      
      return {
        name: this.config.name,
        error: 'Failed to get overview'
      };
    }
  }
}