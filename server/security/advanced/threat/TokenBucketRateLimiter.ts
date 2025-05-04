/**
 * Token Bucket Rate Limiter
 *
 * This class implements the token bucket algorithm for rate limiting.
 * It provides context-aware rate limiting with dynamic bucket sizes
 * and refill rates based on contextual information.
 */

import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { log } from '../../../utils/logger';

// Interface for configuration
export interface RateLimitConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number;
  contextAware?: boolean;
  analytics?: RateLimitAnalytics;
}

// Interface for a bucket
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
  refillInterval: number;
}

// Interface for consume result
interface ConsumeResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;
  private contextAware: boolean;
  private analytics?: RateLimitAnalytics;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      capacity: config.capacity,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval,
      contextAware: config.contextAware || false
    };
    
    this.contextAware = this.config.contextAware || false;
    this.analytics = config.analytics;
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Consume tokens from a bucket
   * 
   * @param key Bucket identifier
   * @param cost Number of tokens to consume
   * @param context Optional context for context-aware limiting
   * @param adaptiveMultiplier Optional multiplier for adaptive rate limiting
   * @returns Result of the consumption
   */
  public consume(
    key: string, 
    cost: number = 1, 
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): ConsumeResult {
    try {
      const now = Date.now();
      
      // Get or create bucket
      let bucket = this.getBucket(key);
      
      // Adjust bucket capacity and refill rate based on context if context-aware
      if (this.contextAware && context) {
        this.adjustBucketForContext(bucket, context, adaptiveMultiplier);
      }
      
      // Refill tokens based on time elapsed
      this.refill(bucket, now);
      
      // Check if enough tokens are available
      if (bucket.tokens < cost) {
        // Not enough tokens - rate limited
        const resetTime = this.getTimeToNextToken(bucket, cost, now);
        
        return {
          limited: true,
          remaining: bucket.tokens,
          resetTime: now + resetTime,
          retryAfter: resetTime
        };
      }
      
      // Consume tokens
      bucket.tokens -= cost;
      
      // Update the bucket in the map
      this.buckets.set(key, bucket);
      
      // Calculate time until next refill
      const timeToNextToken = this.getTimeToNextToken(bucket, 1, now);
      
      return {
        limited: false,
        remaining: bucket.tokens,
        resetTime: now + timeToNextToken,
        retryAfter: 0
      };
    } catch (error) {
      // Log the error
      log(`Error consuming tokens: ${error}`, 'security');
      
      // Fail open - allow the request but with zero remaining
      return {
        limited: false,
        remaining: 0,
        resetTime: Date.now() + this.config.refillInterval,
        retryAfter: 0
      };
    }
  }
  
  /**
   * Update configuration for this rate limiter
   * 
   * @param config New configuration
   */
  public updateConfig(config: Partial<RateLimitConfig>): void {
    // Update configuration
    this.config = {
      ...this.config,
      ...config
    };
    
    // Update context-aware flag
    this.contextAware = this.config.contextAware || false;
    
    // Log update
    log(`Rate limit configuration updated: capacity=${this.config.capacity}, refillRate=${this.config.refillRate}, interval=${this.config.refillInterval}ms`, 'security');
  }
  
  /**
   * Get current capacity for a bucket
   * 
   * @param key Bucket identifier
   * @returns Current capacity
   */
  public getCapacity(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? bucket.capacity : this.config.capacity;
  }
  
  /**
   * Get statistics about this rate limiter
   * 
   * @returns Statistics about this rate limiter
   */
  public getStats(): any {
    return {
      bucketCount: this.buckets.size,
      config: {
        capacity: this.config.capacity,
        refillRate: this.config.refillRate,
        refillInterval: this.config.refillInterval,
        contextAware: this.contextAware
      }
    };
  }
  
  /**
   * Clear a specific bucket
   * 
   * @param key Bucket identifier
   */
  public resetBucket(key: string): void {
    this.buckets.delete(key);
  }
  
  /**
   * Clean up old buckets
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Find buckets that haven't been used in a while
    for (const [key, bucket] of this.buckets.entries()) {
      // If the bucket is full, it hasn't been used in a while
      if (bucket.tokens === bucket.capacity) {
        // Check if it's been at least 24 hours since the last refill
        const timeSinceLastRefill = now - bucket.lastRefill;
        if (timeSinceLastRefill > 24 * 60 * 60 * 1000) {
          // Remove the bucket
          this.buckets.delete(key);
          cleanedCount++;
        }
      }
    }
    
    // Log cleanup
    if (cleanedCount > 0) {
      log(`Cleaned up ${cleanedCount} unused rate limit buckets`, 'security');
    }
  }
  
  /**
   * Get or create a bucket
   * 
   * @param key Bucket identifier
   * @returns Bucket
   */
  private getBucket(key: string): TokenBucket {
    // Try to get existing bucket
    const bucket = this.buckets.get(key);
    
    if (bucket) {
      return bucket;
    }
    
    // Create a new bucket
    const newBucket: TokenBucket = {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
      capacity: this.config.capacity,
      refillRate: this.config.refillRate,
      refillInterval: this.config.refillInterval
    };
    
    // Store the bucket
    this.buckets.set(key, newBucket);
    
    return newBucket;
  }
  
  /**
   * Refill tokens in a bucket
   * 
   * @param bucket The bucket to refill
   * @param now Current timestamp
   */
  private refill(bucket: TokenBucket, now: number): void {
    // Calculate elapsed time since last refill
    const elapsed = now - bucket.lastRefill;
    
    // Calculate number of tokens to add
    const tokensToAdd = Math.floor(elapsed / bucket.refillInterval * bucket.refillRate);
    
    // If no tokens to add, return
    if (tokensToAdd <= 0) {
      return;
    }
    
    // Add tokens, but don't exceed capacity
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    
    // Update last refill time, accounting for partial intervals
    const intervalsUsed = Math.floor(elapsed / bucket.refillInterval);
    bucket.lastRefill += intervalsUsed * bucket.refillInterval;
  }
  
  /**
   * Adjust bucket parameters based on context
   * 
   * @param bucket The bucket to adjust
   * @param context The context to use for adjustment
   * @param adaptiveMultiplier Adaptive multiplier
   */
  private adjustBucketForContext(
    bucket: TokenBucket, 
    context: RateLimitContext,
    adaptiveMultiplier: number
  ): void {
    // Start with the configured capacity
    let adjustedCapacity = this.config.capacity;
    
    // Apply the adaptive multiplier
    adjustedCapacity = Math.max(1, Math.round(adjustedCapacity * adaptiveMultiplier));
    
    // Ensure we don't wildly change the capacity
    // Limit changes to +/- 50% of the original capacity
    const minCapacity = Math.floor(this.config.capacity * 0.5);
    const maxCapacity = Math.ceil(this.config.capacity * 1.5);
    
    // Clamp to the allowed range
    bucket.capacity = Math.max(minCapacity, Math.min(maxCapacity, adjustedCapacity));
    
    // Similarly adjust the refill rate
    let adjustedRefillRate = this.config.refillRate;
    
    // Apply the adaptive multiplier
    adjustedRefillRate = Math.max(1, Math.round(adjustedRefillRate * adaptiveMultiplier));
    
    // Ensure we don't wildly change the refill rate
    const minRefillRate = Math.floor(this.config.refillRate * 0.5);
    const maxRefillRate = Math.ceil(this.config.refillRate * 1.5);
    
    // Clamp to the allowed range
    bucket.refillRate = Math.max(minRefillRate, Math.min(maxRefillRate, adjustedRefillRate));
  }
  
  /**
   * Calculate time until the bucket will have the specified number of tokens
   * 
   * @param bucket The bucket
   * @param tokens Number of tokens needed
   * @param now Current timestamp
   * @returns Time in milliseconds until tokens will be available
   */
  private getTimeToNextToken(bucket: TokenBucket, tokens: number, now: number): number {
    // If we already have enough tokens, return 0
    if (bucket.tokens >= tokens) {
      return 0;
    }
    
    // Calculate how many tokens we need
    const tokensNeeded = tokens - bucket.tokens;
    
    // Calculate elapsed time since last refill
    const elapsed = now - bucket.lastRefill;
    
    // Calculate partially refilled tokens (that aren't yet accounted for in bucket.tokens)
    const partialRefill = Math.floor(elapsed / bucket.refillInterval * bucket.refillRate);
    
    // If we have enough with partial refill, calculate exact time
    if (bucket.tokens + partialRefill >= tokens) {
      // Calculate how many tokens we still need after partial refill
      const stillNeeded = tokens - (bucket.tokens + partialRefill);
      
      // Calculate exact time needed for those tokens
      return Math.ceil(stillNeeded * (bucket.refillInterval / bucket.refillRate));
    }
    
    // Calculate time for the remaining tokens needed
    const intervalsNeeded = Math.ceil(tokensNeeded / bucket.refillRate);
    
    // Calculate time until we have enough tokens
    return Math.max(0, intervalsNeeded * bucket.refillInterval - elapsed);
  }
}