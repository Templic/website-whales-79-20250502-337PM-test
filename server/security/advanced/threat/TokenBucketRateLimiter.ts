/**
 * Token Bucket Rate Limiter
 *
 * This module implements the token bucket algorithm for rate limiting.
 * It provides a flexible and efficient way to rate limit requests.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';

/**
 * Configuration for the token bucket rate limiter
 */
export interface TokenBucketRateLimiterConfig {
  /**
   * Maximum capacity of the bucket (maximum tokens)
   */
  capacity: number;
  
  /**
   * Number of tokens to refill per interval
   */
  refillRate: number;
  
  /**
   * Refill interval in milliseconds
   */
  refillInterval: number;
  
  /**
   * Whether to use request context for rate limiting decisions
   */
  contextAware?: boolean;
  
  /**
   * Name of the rate limiter (for logging)
   */
  name?: string;
}

/**
 * Token bucket algorithm implementation for rate limiting
 */
export class TokenBucketRateLimiter {
  private config: TokenBucketRateLimiterConfig;
  private buckets: Map<string, { tokens: number, lastRefill: number }> = new Map();
  private refillIntervalMs: number;
  private tokensPerMs: number;
  private cleanupInterval: NodeJS.Timeout;
  private requestCounts: Map<string, number> = new Map();
  public name: string;
  
  constructor(config: TokenBucketRateLimiterConfig) {
    this.config = {
      ...config,
      contextAware: config.contextAware || false,
      name: config.name || 'default'
    };
    
    this.name = this.config.name;
    
    // Calculate tokens per millisecond for continuous refill
    this.refillIntervalMs = this.config.refillInterval;
    this.tokensPerMs = this.config.refillRate / this.refillIntervalMs;
    
    // Set up periodic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // Every hour
    
    // Log initialization
    log(`Token bucket rate limiter "${this.name}" initialized with capacity=${this.config.capacity}, refillRate=${this.config.refillRate}, interval=${this.config.refillInterval}ms`, 'security');
  }
  
  /**
   * Get or create a bucket for a key
   * 
   * @param key Bucket key
   * @returns Bucket object
   */
  private getBucket(key: string): { tokens: number, lastRefill: number } {
    // Get existing bucket or create a new one
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: this.config.capacity,
        lastRefill: Date.now()
      };
      this.buckets.set(key, bucket);
    }
    
    return bucket;
  }
  
  /**
   * Refill a bucket based on elapsed time
   * 
   * @param bucket Bucket to refill
   * @returns Updated bucket
   */
  private refillBucket(bucket: { tokens: number, lastRefill: number }): { tokens: number, lastRefill: number } {
    // Calculate elapsed time since last refill
    const now = Date.now();
    const elapsedMs = now - bucket.lastRefill;
    
    if (elapsedMs > 0) {
      // Calculate tokens to add based on elapsed time
      const tokensToAdd = elapsedMs * this.tokensPerMs;
      
      // Add tokens (up to capacity)
      bucket.tokens = Math.min(this.config.capacity, bucket.tokens + tokensToAdd);
      
      // Update last refill time
      bucket.lastRefill = now;
    }
    
    return bucket;
  }
  
  /**
   * Try to consume tokens from a bucket
   * 
   * @param key Bucket key
   * @param tokens Number of tokens to consume
   * @param context Rate limit context
   * @param adaptiveMultiplier Adaptive multiplier
   * @returns Result object with limited flag, remaining tokens, retry time
   */
  public consume(
    key: string, 
    tokens: number = 1, 
    context?: RateLimitContext, 
    adaptiveMultiplier: number = 1.0
  ): { 
    limited: boolean; 
    remaining: number; 
    retryAfter: number;
    resetTime: number;
  } {
    try {
      // Apply adaptive multiplier to tokens if applicable
      const adjustedTokens = tokens / (this.config.contextAware && adaptiveMultiplier ? adaptiveMultiplier : 1.0);
      
      // Get the bucket
      const bucket = this.getBucket(key);
      
      // Refill the bucket
      this.refillBucket(bucket);
      
      // Check if there are enough tokens
      if (bucket.tokens >= adjustedTokens) {
        // Consume tokens
        bucket.tokens -= adjustedTokens;
        
        // Track request count
        this.incrementRequestCount(key);
        
        // Return success result
        return {
          limited: false,
          remaining: Math.floor(bucket.tokens),
          retryAfter: 0,
          resetTime: this.calculateResetTime(bucket.tokens, this.config.capacity)
        };
      } else {
        // Calculate retry-after time
        const tokensNeeded = adjustedTokens - bucket.tokens;
        const retryAfterMs = (tokensNeeded / this.tokensPerMs) + 100; // Add 100ms buffer
        
        // Return rate limited result
        return {
          limited: true,
          remaining: 0,
          retryAfter: Math.ceil(retryAfterMs),
          resetTime: this.calculateResetTime(bucket.tokens, this.config.capacity)
        };
      }
    } catch (error) {
      log(`Error consuming tokens: ${error}`, 'security');
      
      // If error, fail open (don't block requests)
      return {
        limited: false,
        remaining: 0,
        retryAfter: 0,
        resetTime: Date.now() + this.refillIntervalMs
      };
    }
  }
  
  /**
   * Calculate time until bucket is fully reset/refilled
   * 
   * @param currentTokens Current tokens in bucket
   * @param capacity Bucket capacity
   * @returns Time in ms until reset
   */
  private calculateResetTime(currentTokens: number, capacity: number): number {
    const tokensToRefill = capacity - currentTokens;
    const timeToRefill = tokensToRefill / this.tokensPerMs;
    
    return Date.now() + Math.ceil(timeToRefill);
  }
  
  /**
   * Reset a specific bucket (used for administrative purposes)
   * 
   * @param key Bucket key
   */
  public resetBucket(key: string): void {
    try {
      // Set tokens to capacity
      const bucket = this.getBucket(key);
      bucket.tokens = this.config.capacity;
      bucket.lastRefill = Date.now();
      
      log(`Rate limit bucket "${key}" has been reset`, 'security');
    } catch (error) {
      log(`Error resetting bucket: ${error}`, 'security');
    }
  }
  
  /**
   * Reset all buckets (used for administrative purposes)
   */
  public resetAllBuckets(): void {
    try {
      // Clear all buckets
      this.buckets.clear();
      
      log(`All rate limit buckets have been reset`, 'security');
    } catch (error) {
      log(`Error resetting all buckets: ${error}`, 'security');
    }
  }
  
  /**
   * Get the number of active buckets
   * 
   * @returns The count of active buckets
   */
  public getBucketCount(): number {
    return this.buckets.size;
  }
  
  /**
   * Get statistics for this rate limiter
   * 
   * @returns Stats object
   */
  public getStats(): any {
    try {
      // Calculate average tokens remaining
      let totalTokens = 0;
      let count = 0;
      
      for (const [, bucket] of this.buckets) {
        this.refillBucket(bucket);
        totalTokens += bucket.tokens;
        count++;
      }
      
      const averageTokens = count > 0 ? totalTokens / count : this.config.capacity;
      
      // Get the top 10 limited buckets
      const limitedBuckets = Array.from(this.buckets.entries())
        .map(([key, bucket]) => ({
          key,
          tokens: bucket.tokens,
          requestCount: this.requestCounts.get(key) || 0
        }))
        .sort((a, b) => a.tokens - b.tokens)
        .slice(0, 10);
      
      // Return stats object
      return {
        name: this.name,
        capacity: this.config.capacity,
        refillRate: this.config.refillRate,
        refillInterval: this.config.refillInterval,
        bucketCount: this.buckets.size,
        averageTokensRemaining: averageTokens,
        percentCapacityAvailable: (averageTokens / this.config.capacity) * 100,
        limitedBuckets
      };
    } catch (error) {
      log(`Error getting rate limiter stats: ${error}`, 'security');
      
      return {
        name: this.name,
        error: 'Failed to get stats'
      };
    }
  }
  
  /**
   * Get remaining capacity for a key
   * 
   * @param key Bucket key
   * @param context Rate limit context (optional)
   * @param adaptiveMultiplier Adaptive multiplier (optional)
   * @returns Capacity value
   */
  public getCapacity(key: string, context?: RateLimitContext, adaptiveMultiplier: number = 1.0): number {
    // Apply adaptive multiplier to capacity if applicable
    const adjustedCapacity = this.config.contextAware && adaptiveMultiplier
      ? this.config.capacity * adaptiveMultiplier
      : this.config.capacity;
    
    return Math.ceil(adjustedCapacity);
  }
  
  /**
   * Increment request count for a key
   * 
   * @param key Bucket key
   */
  private incrementRequestCount(key: string): void {
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);
  }
  
  /**
   * Clean up old/unused buckets to prevent memory leaks
   */
  private cleanup(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Calculate cutoff time (buckets inactive for 24 hours)
      const cutoff = now - 24 * 60 * 60 * 1000;
      
      // Keys to remove
      const keysToRemove: string[] = [];
      
      // Find buckets that haven't been used in 24 hours
      for (const [key, bucket] of this.buckets.entries()) {
        if (bucket.lastRefill < cutoff && bucket.tokens >= this.config.capacity) {
          keysToRemove.push(key);
        }
      }
      
      // Remove unused buckets
      for (const key of keysToRemove) {
        this.buckets.delete(key);
        this.requestCounts.delete(key);
      }
      
      // Log cleanup if any buckets were removed
      if (keysToRemove.length > 0) {
        log(`Cleaned up ${keysToRemove.length} unused rate limit buckets for "${this.name}"`, 'security');
      }
    } catch (error) {
      log(`Error cleaning up rate limit buckets: ${error}`, 'security');
    }
  }
  
  /**
   * Dispose of the rate limiter and clean up resources
   */
  public dispose(): void {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
    this.requestCounts.clear();
  }
}