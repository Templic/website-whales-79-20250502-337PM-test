/**
 * Token Bucket Rate Limiter
 *
 * This class implements a token bucket algorithm for rate limiting.
 * It supports adaptive capacity, context-aware costs, and analytics.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';

// Bucket data structure
interface Bucket {
  tokens: number;
  lastRefill: number;
}

// Configuration options
export interface RateLimitConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number; // in ms
  contextAware?: boolean;
  analytics?: any;
  name?: string;
}

// Result of a consumption attempt
export interface ConsumeResult {
  limited: boolean;
  remaining: number;
  retryAfter: number;
  resetTime: number;
}

export class TokenBucketRateLimiter {
  private config: RateLimitConfig;
  private buckets: Map<string, Bucket> = new Map();
  private lastCleanup: number = Date.now();
  public name: string;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      capacity: config.capacity,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval,
      contextAware: config.contextAware || false
    };
    
    this.name = config.name || 'default';
    
    // Set up cleanup interval
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Cleanup every hour
  }
  
  /**
   * Consume tokens from a bucket
   * 
   * @param key Bucket identifier
   * @param cost Cost in tokens
   * @param context Context for adaptive rate limiting
   * @param adaptiveMultiplier Multiplier for adaptive rate limiting
   * @returns Result of consumption
   */
  public consume(
    key: string, 
    cost: number = 1, 
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): ConsumeResult {
    try {
      // Get current time
      const now = Date.now();
      
      // Get or create bucket
      let bucket = this.buckets.get(key);
      if (!bucket) {
        // New bucket starts with full capacity
        bucket = {
          tokens: this.getCapacity(key, context, adaptiveMultiplier),
          lastRefill: now
        };
        this.buckets.set(key, bucket);
      }
      
      // Calculate time since last refill
      const timeSinceRefill = now - bucket.lastRefill;
      
      // Calculate tokens to add
      if (timeSinceRefill > 0) {
        // Calculate adaptive refill rate
        const refillRate = this.config.refillRate * adaptiveMultiplier;
        
        // Calculate adaptive capacity
        const capacity = this.getCapacity(key, context, adaptiveMultiplier);
        
        // Calculate number of tokens to add
        const tokensToAdd = (timeSinceRefill / this.config.refillInterval) * refillRate;
        
        // Add tokens (up to capacity)
        bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
        
        // Update last refill time
        bucket.lastRefill = now;
      }
      
      // Check if we have enough tokens
      if (bucket.tokens < cost) {
        // Calculate time to next token
        const timeToNextToken = this.getTimeToNextToken(bucket, cost, adaptiveMultiplier);
        
        // Calculate reset time
        const resetTime = now + timeToNextToken;
        
        // Return result
        return {
          limited: true,
          remaining: bucket.tokens,
          retryAfter: timeToNextToken,
          resetTime
        };
      }
      
      // Consume tokens
      bucket.tokens -= cost;
      
      // Return success
      return {
        limited: false,
        remaining: bucket.tokens,
        retryAfter: 0,
        resetTime: now + 
          ((this.config.capacity - bucket.tokens) / this.config.refillRate) * 
          this.config.refillInterval
      };
    } catch (error) {
      log(`Error consuming tokens: ${error}`, 'security');
      
      // Fail open (allow request)
      return {
        limited: false,
        remaining: 1,
        retryAfter: 0,
        resetTime: Date.now()
      };
    }
  }
  
  /**
   * Get capacity for a bucket
   * 
   * @param key Bucket identifier
   * @param context Context for adaptive rate limiting
   * @param adaptiveMultiplier Multiplier for adaptive rate limiting
   * @returns Capacity
   */
  public getCapacity(
    key: string, 
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): number {
    // Base capacity
    let capacity = this.config.capacity;
    
    // Adjust for context if context-aware and context is provided
    if (this.config.contextAware && context) {
      // Adjust for user role (higher privilege = higher capacity)
      if (context.roleWeight) {
        // Privilege boost (lower weight = higher privilege = higher capacity)
        capacity *= Math.max(0.1, Math.min(2.0, 2.0 - context.roleWeight * 0.5));
      }
      
      // Adjust for resource sensitivity (higher sensitivity = lower capacity)
      if (context.resourceSensitivity > 1.0) {
        capacity /= Math.max(1.0, Math.min(4.0, context.resourceSensitivity));
      }
      
      // Good bots get a capacity boost
      if (context.isGoodBot) {
        capacity *= 2.0;
      }
      
      // Bad bots get severely restricted
      if (context.isBadBot) {
        capacity *= 0.2;
      }
      
      // Blacklisted IPs get minimally restricted
      if (context.isBlacklisted) {
        capacity = Math.min(1, capacity * 0.01);
      }
    }
    
    // Apply adaptive multiplier
    capacity *= adaptiveMultiplier;
    
    // Ensure some minimum capacity
    return Math.max(1, Math.round(capacity));
  }
  
  /**
   * Reset a bucket
   * 
   * @param key Bucket identifier
   */
  public resetBucket(key: string): void {
    // Delete bucket (will be recreated with full capacity on next consume)
    this.buckets.delete(key);
    
    log(`Rate limit bucket reset: ${key}`, 'security');
  }
  
  /**
   * Get statistics about buckets
   * 
   * @returns Statistics
   */
  public getStats(): any {
    // Calculate average tokens
    let totalTokens = 0;
    let bucketCount = 0;
    
    for (const [, bucket] of this.buckets) {
      totalTokens += bucket.tokens;
      bucketCount++;
    }
    
    const averageTokens = bucketCount > 0 ? totalTokens / bucketCount : 0;
    
    // Get limited bucket count
    let limitedBuckets = 0;
    
    for (const [, bucket] of this.buckets) {
      if (bucket.tokens < 1) {
        limitedBuckets++;
      }
    }
    
    // Return stats
    return {
      totalBuckets: bucketCount,
      limitedBuckets,
      averageTokens,
      baseCapacity: this.config.capacity,
      refillRate: this.config.refillRate,
      refillInterval: this.config.refillInterval,
      baseTimeToRefill: this.config.capacity / this.config.refillRate * this.config.refillInterval,
      contextAware: this.config.contextAware
    };
  }
  
  /**
   * Get time to next token
   * 
   * @param bucket Bucket
   * @param cost Cost in tokens
   * @param adaptiveMultiplier Multiplier for adaptive rate limiting
   * @returns Time in milliseconds
   */
  private getTimeToNextToken(bucket: Bucket, cost: number, adaptiveMultiplier: number): number {
    // Calculate how many tokens we need
    const tokensNeeded = cost - bucket.tokens;
    
    // Calculate time per token
    const timePerToken = this.config.refillInterval / (this.config.refillRate * adaptiveMultiplier);
    
    // Calculate time needed
    return Math.ceil(tokensNeeded * timePerToken);
  }
  
  /**
   * Clean up unused buckets
   */
  private cleanup(): void {
    try {
      // Get current time
      const now = Date.now();
      
      // Calculate cutoff time (buckets inactive for 1 hour)
      const cutoff = now - (60 * 60 * 1000);
      
      // Count before
      const countBefore = this.buckets.size;
      
      // Clean up old buckets
      for (const [key, bucket] of this.buckets.entries()) {
        if (bucket.lastRefill < cutoff) {
          this.buckets.delete(key);
        }
      }
      
      // Count after
      const countAfter = this.buckets.size;
      
      // Log if we cleaned up a significant number of buckets
      if (countBefore - countAfter > 10) {
        log(`Rate limit bucket cleanup: ${countBefore - countAfter} buckets removed`, 'security');
      }
      
      // Update last cleanup time
      this.lastCleanup = now;
    } catch (error) {
      log(`Error cleaning up buckets: ${error}`, 'security');
    }
  }
}