/**
 * Token Bucket Rate Limiter
 *
 * This module implements a token bucket algorithm for rate limiting.
 * It provides a continuous rate limiting mechanism with burst capacity.
 */

import { log } from '../../../utils/logger';
import { RateLimitContext } from './RateLimitContextBuilder';

/**
 * Token bucket configuration
 */
export interface TokenBucketRateLimiterConfig {
  /**
   * Maximum capacity of tokens in the bucket
   */
  capacity: number;
  
  /**
   * Number of tokens to refill periodically
   */
  refillRate: number;
  
  /**
   * Interval between refills (ms)
   */
  refillInterval: number;
  
  /**
   * Whether to use context-aware rate limiting
   */
  contextAware?: boolean;
  
  /**
   * Name for this limiter
   */
  name?: string;
}

/**
 * Bucket state
 */
interface BucketState {
  /**
   * Available tokens
   */
  tokens: number;
  
  /**
   * Last refill timestamp
   */
  lastRefill: number;
  
  /**
   * Last usage timestamp
   */
  lastUsage: number;
  
  /**
   * Capacity of the bucket
   */
  capacity: number;
}

/**
 * Consumption result
 */
interface ConsumptionResult {
  /**
   * Whether the request is limited
   */
  limited: boolean;
  
  /**
   * Remaining tokens
   */
  remaining: number;
  
  /**
   * Time until retry (ms)
   */
  retryAfter: number;
  
  /**
   * Time until bucket reset (ms)
   */
  resetTime: number;
}

/**
 * Token bucket rate limiter
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, BucketState> = new Map();
  private config: TokenBucketRateLimiterConfig;
  private readonly name: string;
  
  constructor(config: TokenBucketRateLimiterConfig) {
    this.config = config;
    this.name = config.name || 'rate-limiter';
    
    log(`Token bucket rate limiter initialized (${this.name})`, 'security');
  }
  
  /**
   * Consume tokens from a bucket
   * 
   * @param key Bucket key
   * @param tokens Tokens to consume
   * @param context Rate limit context
   * @param adaptiveMultiplier Adaptive multiplier
   * @returns Consumption result
   */
  public consume(
    key: string,
    tokens: number = 1,
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): ConsumptionResult {
    try {
      // Get time
      const now = Date.now();
      
      // Get bucket
      let bucket = this.buckets.get(key);
      
      // Create bucket if not exists
      if (!bucket) {
        const effectiveCapacity = this.getCapacity(key, context, adaptiveMultiplier);
        
        bucket = {
          tokens: effectiveCapacity,
          lastRefill: now,
          lastUsage: 0,
          capacity: effectiveCapacity
        };
        
        this.buckets.set(key, bucket);
      }
      
      // Refill tokens if needed
      this.refillTokens(bucket, now);
      
      // Update capacity if changed
      if (this.config.contextAware && context) {
        const newCapacity = this.getCapacity(key, context, adaptiveMultiplier);
        
        if (newCapacity !== bucket.capacity) {
          // Adjust tokens proportionally
          const ratio = newCapacity / bucket.capacity;
          bucket.tokens = Math.min(newCapacity, bucket.tokens * ratio);
          bucket.capacity = newCapacity;
        }
      }
      
      // Check if enough tokens
      if (bucket.tokens < tokens) {
        // Not enough tokens
        const tokensNeeded = tokens - bucket.tokens;
        const refillsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
        const retryAfter = refillsNeeded * this.config.refillInterval;
        const resetTime = now + retryAfter;
        
        return {
          limited: true,
          remaining: bucket.tokens,
          retryAfter,
          resetTime
        };
      }
      
      // Consume tokens
      bucket.tokens -= tokens;
      bucket.lastUsage = now;
      
      // Calculate time to next token
      const timeToNextToken = this.getTimeToNextToken(bucket, now);
      
      return {
        limited: false,
        remaining: bucket.tokens,
        retryAfter: 0,
        resetTime: now + timeToNextToken
      };
    } catch (error) {
      log(`Error consuming tokens: ${error}`, 'error');
      
      // Fail open - don't limit on errors
      return {
        limited: false,
        remaining: 1,
        retryAfter: 0,
        resetTime: Date.now() + this.config.refillInterval
      };
    }
  }
  
  /**
   * Get capacity based on context
   * 
   * @param key Bucket key
   * @param context Rate limit context
   * @param adaptiveMultiplier Adaptive multiplier
   * @returns Effective capacity
   */
  public getCapacity(
    key: string,
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): number {
    // Start with base capacity
    let capacity = this.config.capacity;
    
    // Apply adaptive multiplier
    capacity = Math.floor(capacity * adaptiveMultiplier);
    
    // Apply context-specific capacity adjustments
    if (this.config.contextAware && context) {
      // Adjust for authentication status
      if (context.authenticated) {
        capacity = Math.floor(capacity * 1.5); // 50% higher capacity for authenticated users
      }
      
      // Adjust for role (admin gets higher capacity)
      if (context.role === 'admin' || context.roleWeight <= 2) {
        capacity = Math.floor(capacity * 2); // 2x capacity for admins
      }
      
      // Adjust for threat level
      if (context.threatLevel > 0) {
        // Higher threat level = lower capacity
        capacity = Math.max(1, Math.floor(capacity * (1 - context.threatLevel)));
      }
      
      // Adjust for blacklisted IPs
      if (context.isBlacklisted) {
        capacity = Math.max(1, Math.floor(capacity * 0.1)); // 90% reduction
      }
      
      // Adjust for whitelisted IPs
      if (context.isWhitelisted) {
        capacity = Math.floor(capacity * 2); // 2x capacity for whitelisted IPs
      }
    }
    
    // Ensure minimum capacity
    return Math.max(1, capacity);
  }
  
  /**
   * Refill tokens
   * 
   * @param bucket Bucket state
   * @param now Current time
   */
  private refillTokens(bucket: BucketState, now: number): void {
    // Skip if no refill needed
    if (bucket.tokens >= bucket.capacity || now - bucket.lastRefill < this.config.refillInterval) {
      return;
    }
    
    // Calculate time since last refill
    const timeSinceRefill = now - bucket.lastRefill;
    
    // Calculate number of refills
    const refills = Math.floor(timeSinceRefill / this.config.refillInterval);
    
    // Skip if no refills
    if (refills <= 0) {
      return;
    }
    
    // Calculate new tokens
    const newTokens = Math.min(
      bucket.capacity,
      bucket.tokens + (refills * this.config.refillRate)
    );
    
    // Update bucket
    bucket.tokens = newTokens;
    bucket.lastRefill += refills * this.config.refillInterval;
  }
  
  /**
   * Get time to next token
   * 
   * @param bucket Bucket state
   * @param now Current time
   * @returns Time to next token (ms)
   */
  private getTimeToNextToken(bucket: BucketState, now: number): number {
    // If bucket is full, no more tokens
    if (bucket.tokens >= bucket.capacity) {
      return Number.MAX_SAFE_INTEGER;
    }
    
    // Calculate time since last refill
    const timeSinceRefill = now - bucket.lastRefill;
    
    // Calculate time until next refill
    const timeToNextRefill = Math.max(0, this.config.refillInterval - timeSinceRefill);
    
    return timeToNextRefill;
  }
  
  /**
   * Reset a bucket
   * 
   * @param key Bucket key
   */
  public reset(key: string): void {
    try {
      const bucket = this.buckets.get(key);
      
      if (bucket) {
        // Reset tokens
        bucket.tokens = bucket.capacity;
        bucket.lastRefill = Date.now();
        
        log(`Reset rate limit bucket for ${key}`, 'security');
      }
    } catch (error) {
      log(`Error resetting bucket: ${error}`, 'error');
    }
  }
  
  /**
   * Get all buckets
   * 
   * @returns All buckets
   */
  public getAllBuckets(): Map<string, BucketState> {
    return new Map(this.buckets);
  }
  
  /**
   * Get bucket
   * 
   * @param key Bucket key
   * @returns Bucket state or undefined
   */
  public getBucket(key: string): BucketState | undefined {
    return this.buckets.get(key);
  }
  
  /**
   * Clear old buckets
   * 
   * @param maxAge Maximum age of buckets (ms)
   * @returns Number of buckets removed
   */
  public clearOldBuckets(maxAge: number = 24 * 60 * 60 * 1000): number {
    try {
      const now = Date.now();
      let count = 0;
      
      // Find old buckets
      for (const [key, bucket] of this.buckets.entries()) {
        if (now - bucket.lastUsage > maxAge) {
          this.buckets.delete(key);
          count++;
        }
      }
      
      if (count > 0) {
        log(`Cleared ${count} old rate limit buckets`, 'info');
      }
      
      return count;
    } catch (error) {
      log(`Error clearing old buckets: ${error}`, 'error');
      return 0;
    }
  }
  
  /**
   * Get available tokens for a bucket
   * This is useful for checking how close a client is to being rate limited
   * 
   * @param key Bucket key
   * @returns Available tokens or capacity if bucket doesn't exist
   */
  public getAvailableTokens(key: string): number {
    try {
      // Get time
      const now = Date.now();
      
      // Get bucket
      let bucket = this.buckets.get(key);
      
      // If bucket doesn't exist, return full capacity
      if (!bucket) {
        return this.config.capacity;
      }
      
      // Refill tokens if needed
      this.refillTokens(bucket, now);
      
      return bucket.tokens;
    } catch (error) {
      log(`Error getting available tokens: ${error}`, 'error');
      return this.config.capacity;
    }
  }
  
  /**
   * Add tokens to a bucket
   * This is useful for rewarding good behavior
   * 
   * @param key Bucket key
   * @param tokens Tokens to add
   * @returns New token count
   */
  public addTokens(key: string, tokens: number = 1): number {
    try {
      // Get time
      const now = Date.now();
      
      // Get bucket
      let bucket = this.buckets.get(key);
      
      // Create bucket if not exists
      if (!bucket) {
        bucket = {
          tokens: this.config.capacity,
          lastRefill: now,
          lastUsage: 0,
          capacity: this.config.capacity
        };
        
        this.buckets.set(key, bucket);
      }
      
      // Refill tokens if needed
      this.refillTokens(bucket, now);
      
      // Add tokens to bucket (up to capacity)
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokens);
      
      return bucket.tokens;
    } catch (error) {
      log(`Error adding tokens: ${error}`, 'error');
      return 0;
    }
  }
  
  /**
   * Consume tokens without context and adaptivity
   * This is a simplified version of the consume method
   * 
   * @param key Bucket key
   * @param tokens Tokens to consume
   * @returns Whether tokens were consumed successfully
   */
  public consumeTokens(key: string, tokens: number = 1): boolean {
    try {
      // Get time
      const now = Date.now();
      
      // Get bucket
      let bucket = this.buckets.get(key);
      
      // Create bucket if not exists
      if (!bucket) {
        bucket = {
          tokens: this.config.capacity,
          lastRefill: now,
          lastUsage: 0,
          capacity: this.config.capacity
        };
        
        this.buckets.set(key, bucket);
      }
      
      // Refill tokens if needed
      this.refillTokens(bucket, now);
      
      // Check if enough tokens
      if (bucket.tokens < tokens) {
        return false;
      }
      
      // Consume tokens
      bucket.tokens -= tokens;
      bucket.lastUsage = now;
      
      return true;
    } catch (error) {
      log(`Error consuming tokens: ${error}`, 'error');
      return false;
    }
  }
}