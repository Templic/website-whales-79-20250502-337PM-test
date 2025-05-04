/**
 * Token Bucket Rate Limiter
 *
 * This class implements the token bucket algorithm for rate limiting.
 * It supports context-aware limiting with dynamic bucket configurations
 * based on user roles, resource sensitivity, and system conditions.
 */

import { RateLimitContext } from './RateLimitContextBuilder';
import { RateLimitAnalytics } from './RateLimitAnalytics';

// Define bucket configuration
export interface RateLimitConfig {
  capacity: number;        // Maximum tokens in the bucket (max burst)
  refillRate: number;      // Tokens added per refill interval
  refillInterval: number;  // Interval between refills in milliseconds
}

// Define the result of a consume operation
export interface ConsumeResult {
  limited: boolean;        // Whether the request is rate limited
  remaining: number;       // Remaining tokens in the bucket
  resetTime: number;       // Time when the bucket will be fully refilled
  retryAfter: number;      // Milliseconds until the request can be attempted again
}

// Define a token bucket
interface TokenBucket {
  tokens: number;          // Current tokens in the bucket
  lastRefill: number;      // Timestamp of the last refill
  config: RateLimitConfig; // Configuration for this bucket
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private defaultConfig: RateLimitConfig;
  private customConfigs: Map<string, RateLimitConfig> = new Map();
  private violations: Map<string, number> = new Map();
  private contextAware: boolean;
  private analytics?: RateLimitAnalytics;
  
  constructor(config: {
    capacity: number,
    refillRate: number,
    refillInterval: number,
    contextAware?: boolean,
    analytics?: RateLimitAnalytics
  }) {
    this.defaultConfig = {
      capacity: config.capacity,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval
    };
    
    this.contextAware = config.contextAware ?? false;
    this.analytics = config.analytics;
  }
  
  /**
   * Consume tokens from a bucket
   * 
   * @param identifier The bucket identifier (e.g., IP, user ID)
   * @param cost The number of tokens to consume
   * @param context Optional context information for context-aware limiting
   * @param adaptiveMultiplier Optional multiplier applied to dynamic buckets
   * @returns Result of the consumption operation
   */
  public consume(
    identifier: string,
    cost: number = 1,
    context?: RateLimitContext,
    adaptiveMultiplier: number = 1.0
  ): ConsumeResult {
    // Default values for the result
    const defaultResult: ConsumeResult = {
      limited: false,
      remaining: 0,
      resetTime: Date.now() + this.defaultConfig.refillInterval,
      retryAfter: 0
    };
    
    try {
      // Get or create the bucket for this identifier
      const bucket = this.getOrCreateBucket(identifier);
      
      // Refill the bucket based on elapsed time
      this.refillBucket(bucket);
      
      // Apply adaptive rate limiting if a multiplier is provided
      const effectiveCapacity = 
        adaptiveMultiplier !== 1.0 
          ? Math.max(1, Math.round(bucket.config.capacity * adaptiveMultiplier)) 
          : bucket.config.capacity;
      
      // Check if there are enough tokens
      if (bucket.tokens < cost) {
        // Not enough tokens, rate limited
        this.recordViolation(identifier);
        
        // Calculate when the request can be retried
        const tokensNeeded = cost - bucket.tokens;
        const refillRate = bucket.config.refillRate / bucket.config.refillInterval;
        const retryAfter = Math.ceil(tokensNeeded / refillRate);
        
        return {
          limited: true,
          remaining: bucket.tokens,
          resetTime: bucket.lastRefill + bucket.config.refillInterval,
          retryAfter
        };
      }
      
      // Enough tokens, consume them
      bucket.tokens -= cost;
      
      return {
        limited: false,
        remaining: bucket.tokens,
        resetTime: bucket.lastRefill + bucket.config.refillInterval,
        retryAfter: 0
      };
    } catch (error) {
      console.error(`[RateLimit] Error consuming tokens for ${identifier}:`, error);
      return defaultResult;
    }
  }
  
  /**
   * Synchronous version of consume - doesn't support context-aware limiting
   * 
   * @param identifier The bucket identifier
   * @param cost The number of tokens to consume
   * @returns Whether the consumption was successful (not limited)
   */
  public consumeSync(identifier: string, cost: number = 1): boolean {
    try {
      // Get or create the bucket for this identifier
      const bucket = this.getOrCreateBucket(identifier);
      
      // Refill the bucket based on elapsed time
      this.refillBucket(bucket);
      
      // Check if there are enough tokens
      if (bucket.tokens < cost) {
        this.recordViolation(identifier);
        return false; // Not enough tokens, rate limited
      }
      
      // Enough tokens, consume them
      bucket.tokens -= cost;
      return true; // Consumption successful
    } catch (error) {
      console.error(`[RateLimit] Error in synchronous token consumption for ${identifier}:`, error);
      return true; // Allow the request on error (fail open)
    }
  }
  
  /**
   * Update the default configuration for this rate limiter
   * 
   * @param config The new configuration
   */
  public updateConfig(config: RateLimitConfig): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config
    };
    
    // Clear all existing buckets to apply the new configuration
    this.buckets.clear();
  }
  
  /**
   * Set a custom configuration for a specific identifier
   * 
   * @param identifier The identifier to customize
   * @param config The custom configuration
   */
  public setCustomConfig(identifier: string, config: RateLimitConfig): void {
    this.customConfigs.set(identifier, config);
    
    // Remove existing bucket to apply the new configuration
    this.buckets.delete(identifier);
  }
  
  /**
   * Remove a custom configuration for a specific identifier
   * 
   * @param identifier The identifier to reset to default configuration
   */
  public removeCustomConfig(identifier: string): void {
    this.customConfigs.delete(identifier);
    
    // Remove existing bucket to apply the default configuration
    this.buckets.delete(identifier);
  }
  
  /**
   * Get the current capacity of a bucket
   * 
   * @param identifier The bucket identifier
   * @returns The current capacity
   */
  public getCapacity(identifier: string): number {
    // Check if there's a custom configuration for this identifier
    const customConfig = this.customConfigs.get(identifier);
    if (customConfig) {
      return customConfig.capacity;
    }
    
    // Return the default capacity
    return this.defaultConfig.capacity;
  }
  
  /**
   * Get the remaining tokens in a bucket
   * 
   * @param identifier The bucket identifier
   * @returns The remaining tokens
   */
  public getRemaining(identifier: string): number {
    // Get the bucket for this identifier
    const bucket = this.buckets.get(identifier);
    if (!bucket) {
      // No bucket yet, return the default capacity
      return this.getCapacity(identifier);
    }
    
    // Refill the bucket to get the current token count
    this.refillBucket(bucket);
    
    return bucket.tokens;
  }
  
  /**
   * Reset a specific bucket
   * 
   * @param identifier The bucket identifier
   */
  public resetBucket(identifier: string): void {
    this.buckets.delete(identifier);
  }
  
  /**
   * Reset all buckets
   */
  public resetAllBuckets(): void {
    this.buckets.clear();
  }
  
  /**
   * Get or create a bucket for a specific identifier
   * 
   * @param identifier The bucket identifier
   * @returns The token bucket
   */
  private getOrCreateBucket(identifier: string): TokenBucket {
    // Check if the bucket already exists
    let bucket = this.buckets.get(identifier);
    
    if (!bucket) {
      // Get the appropriate configuration for this identifier
      const config = this.customConfigs.get(identifier) || this.defaultConfig;
      
      // Create a new bucket
      bucket = {
        tokens: config.capacity,
        lastRefill: Date.now(),
        config
      };
      
      // Store the bucket
      this.buckets.set(identifier, bucket);
    }
    
    return bucket;
  }
  
  /**
   * Refill a bucket based on elapsed time
   * 
   * @param bucket The token bucket to refill
   */
  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    
    if (elapsed >= bucket.config.refillInterval) {
      // Calculate the number of refill intervals that have passed
      const intervals = Math.floor(elapsed / bucket.config.refillInterval);
      
      // Add tokens based on the refill rate and intervals
      const tokensToAdd = intervals * bucket.config.refillRate;
      
      // Update the bucket
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.config.capacity);
      bucket.lastRefill = now - (elapsed % bucket.config.refillInterval);
    }
  }
  
  /**
   * Record a violation for a specific identifier
   * 
   * @param identifier The identifier that violated the rate limit
   */
  private recordViolation(identifier: string): void {
    // Increment the violation count
    const count = this.violations.get(identifier) || 0;
    this.violations.set(identifier, count + 1);
    
    // Use analytics if available
    if (this.analytics) {
      // The actual recording happens in the consuming middleware
      // because we need additional context information
    }
  }
  
  /**
   * Get statistical data about rate limiting
   * 
   * @returns Statistics about buckets and violations
   */
  public getStats(): any {
    // Calculate statistics
    const totalBuckets = this.buckets.size;
    const totalCustomConfigs = this.customConfigs.size;
    
    let limitedBuckets = 0;
    let totalTokens = 0;
    let minTokens = Infinity;
    let maxTokens = 0;
    
    // Process each bucket
    for (const [identifier, bucket] of this.buckets.entries()) {
      // Refill the bucket to get current state
      this.refillBucket(bucket);
      
      // Update statistics
      totalTokens += bucket.tokens;
      minTokens = Math.min(minTokens, bucket.tokens);
      maxTokens = Math.max(maxTokens, bucket.tokens);
      
      // Check if this bucket is effectively rate limited (cannot consume 1 token)
      if (bucket.tokens < 1) {
        limitedBuckets++;
      }
    }
    
    // Calculate averages
    const avgTokens = totalBuckets > 0 ? totalTokens / totalBuckets : 0;
    
    // Gather violation statistics
    let totalViolations = 0;
    let highViolators = 0;
    
    for (const [identifier, count] of this.violations.entries()) {
      totalViolations += count;
      if (count >= 10) {
        highViolators++;
      }
    }
    
    return {
      totalBuckets,
      limitedBuckets,
      avgTokens,
      minTokens: minTokens === Infinity ? 0 : minTokens,
      maxTokens,
      totalCustomConfigs,
      totalViolations,
      highViolators,
      defaultConfig: this.defaultConfig
    };
  }
}