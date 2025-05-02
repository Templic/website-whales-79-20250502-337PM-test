/**
 * Token Bucket Rate Limiter
 * 
 * Implements token bucket algorithm for efficient rate limiting:
 * - Allows for short bursts of traffic
 * - Provides smooth rate limiting with configurable rates
 * - Per-client (IP) bucket tracking
 */

import LRUCache from './SecurityCache';

// Bucket configuration type
interface TokenBucketConfig {
  tokensPerInterval: number;
  interval: number;          // in milliseconds
  burstCapacity: number;     // max tokens that can be stored
}

// Bucket state for a client
interface BucketState {
  tokens: number;
  lastRefill: number;
  customConfig?: TokenBucketConfig;
}

/**
 * Token Bucket Rate Limiter
 * 
 * The token bucket algorithm works by adding tokens to a bucket at a fixed rate.
 * Each request consumes a token. If there are no tokens, the request is rejected.
 * This allows for short bursts of traffic while maintaining a long-term rate limit.
 */
export class TokenBucketRateLimiter {
  private buckets: LRUCache<string, BucketState>;
  private defaultConfig: TokenBucketConfig;
  
  /**
   * Create a new token bucket rate limiter
   * 
   * @param config Default configuration for all buckets
   */
  constructor(config: TokenBucketConfig) {
    this.defaultConfig = config;
    this.buckets = new LRUCache<string, BucketState>(
      10000,                 // Up to 10k clients
      60 * 60 * 1000,        // 1 hour TTL
      5 * 60 * 1000          // Clean expired entries every 5 minutes
    );
  }
  
  /**
   * Set a custom configuration for a specific client
   * 
   * @param clientKey The client identifier (usually IP)
   * @param config The custom configuration
   */
  setCustomConfig(clientKey: string, config: TokenBucketConfig): void {
    const bucket = this.getBucket(clientKey);
    bucket.customConfig = config;
    
    // If the new burst capacity is higher, add tokens up to the new capacity
    const effectiveConfig = bucket.customConfig || this.defaultConfig;
    if (bucket.tokens < effectiveConfig.burstCapacity) {
      this.refillTokens(clientKey, bucket);
    }
  }
  
  /**
   * Remove custom configuration for a client
   * 
   * @param clientKey The client identifier (usually IP)
   */
  removeCustomConfig(clientKey: string): void {
    const bucket = this.getBucket(clientKey);
    delete bucket.customConfig;
    
    // Adjust tokens to not exceed default burst capacity
    if (bucket.tokens > this.defaultConfig.burstCapacity) {
      bucket.tokens = this.defaultConfig.burstCapacity;
    }
  }
  
  /**
   * Attempt to consume a token
   * 
   * @param clientKey The client identifier (usually IP)
   * @param tokens Number of tokens to consume (default: 1)
   * @returns True if successful, false if rate limit exceeded
   */
  consume(clientKey: string, tokens: number = 1): boolean {
    const bucket = this.getBucket(clientKey);
    
    // Refill tokens based on time elapsed
    this.refillTokens(clientKey, bucket);
    
    // Check if enough tokens are available
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the time (in ms) until the next token is available
   * 
   * @param clientKey The client identifier (usually IP)
   * @returns Time in milliseconds until next token
   */
  getTimeToNextToken(clientKey: string): number {
    const bucket = this.getBucket(clientKey);
    const config = bucket.customConfig || this.defaultConfig;
    
    // If there are tokens available, return 0
    if (bucket.tokens > 0) {
      return 0;
    }
    
    // Calculate time until next token
    const timePerToken = config.interval / config.tokensPerInterval;
    const elapsedTime = Date.now() - bucket.lastRefill;
    const timeToNextToken = timePerToken - (elapsedTime % timePerToken);
    
    return Math.max(0, timeToNextToken);
  }
  
  /**
   * Get the number of tokens available for a client
   * 
   * @param clientKey The client identifier (usually IP)
   * @returns Number of tokens available
   */
  getAvailableTokens(clientKey: string): number {
    const bucket = this.getBucket(clientKey);
    
    // Refill tokens based on time elapsed
    this.refillTokens(clientKey, bucket);
    
    return bucket.tokens;
  }
  
  /**
   * Clear rate limiting data for a client
   * 
   * @param clientKey The client identifier (usually IP)
   */
  reset(clientKey: string): void {
    this.buckets.delete(clientKey);
  }
  
  /**
   * Reset all rate limiting data
   */
  resetAll(): void {
    this.buckets.clear();
  }
  
  /**
   * Get all client keys currently being tracked
   * 
   * @returns Array of client keys
   */
  getActiveClients(): string[] {
    return this.buckets.keys();
  }
  
  /**
   * Get a bucket for a client, creating it if it doesn't exist
   */
  private getBucket(clientKey: string): BucketState {
    let bucket = this.buckets.get(clientKey);
    
    if (!bucket) {
      const config = this.defaultConfig;
      bucket = {
        tokens: config.burstCapacity,
        lastRefill: Date.now(),
      };
      this.buckets.set(clientKey, bucket);
    }
    
    return bucket;
  }
  
  /**
   * Refill tokens in a bucket based on time elapsed
   */
  private refillTokens(clientKey: string, bucket: BucketState): void {
    const now = Date.now();
    const config = bucket.customConfig || this.defaultConfig;
    const elapsedTime = now - bucket.lastRefill;
    
    // Skip if no time has elapsed
    if (elapsedTime <= 0) {
      return;
    }
    
    // Calculate tokens to add
    const tokensToAdd = Math.floor(
      (elapsedTime * config.tokensPerInterval) / config.interval
    );
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        bucket.tokens + tokensToAdd,
        config.burstCapacity
      );
      bucket.lastRefill = now;
      
      // Update the bucket in cache
      this.buckets.set(clientKey, bucket);
    }
  }
}