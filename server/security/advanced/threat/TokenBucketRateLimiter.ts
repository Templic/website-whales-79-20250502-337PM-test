/**
 * Token Bucket Rate Limiter
 * 
 * Implements rate limiting using a token bucket algorithm:
 * - Each bucket has a maximum capacity
 * - Tokens are added at a fixed rate
 * - Each request consumes a token
 * - Requests are rejected when the bucket is empty
 * 
 * This implementation supports:
 * - Individual rate limits per IP/user
 * - Burst capacity (allowing occasional bursts of traffic)
 * - Custom rate limit configurations for different paths
 */

interface RateLimitConfig {
  tokensPerInterval: number;  // Number of tokens added per interval
  interval: number;           // Interval in milliseconds
  burstCapacity?: number;     // Maximum tokens the bucket can hold (defaults to tokensPerInterval)
}

interface TokenBucket {
  tokens: number;             // Current token count
  lastRefilled: number;       // Timestamp of last refill
  config: RateLimitConfig;    // Configuration for this bucket
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private defaultConfig: RateLimitConfig;
  private customConfigs: Map<string, RateLimitConfig> = new Map();

  /**
   * Create a new rate limiter
   * 
   * @param config Default rate limiting configuration
   */
  constructor(config: RateLimitConfig) {
    this.defaultConfig = {
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
      burstCapacity: config.burstCapacity || config.tokensPerInterval
    };
  }

  /**
   * Set a custom rate limit configuration for a specific key (IP, user, etc.)
   * 
   * @param key The key to set a custom config for
   * @param config The custom rate limit configuration
   */
  setCustomConfig(key: string, config: RateLimitConfig): void {
    // Ensure burst capacity is set
    const fullConfig = {
      ...config,
      burstCapacity: config.burstCapacity || config.tokensPerInterval
    };
    
    this.customConfigs.set(key, fullConfig);
    
    // If bucket already exists, update its config
    const bucket = this.buckets.get(key);
    if (bucket) {
      bucket.config = fullConfig;
      
      // Ensure tokens don't exceed the new burst capacity
      if (bucket.tokens > fullConfig.burstCapacity!) {
        bucket.tokens = fullConfig.burstCapacity!;
      }
    }
  }

  /**
   * Get the configuration for a key
   * 
   * @param key The key to get configuration for
   * @returns The rate limit configuration
   */
  private getConfigForKey(key: string): RateLimitConfig {
    return this.customConfigs.get(key) || this.defaultConfig;
  }

  /**
   * Get or create a bucket for a key
   * 
   * @param key The key (IP, user, etc.)
   * @returns The token bucket
   */
  private getBucket(key: string): TokenBucket {
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      const config = this.getConfigForKey(key);
      bucket = {
        tokens: config.burstCapacity!,  // Start with a full bucket
        lastRefilled: Date.now(),
        config
      };
      this.buckets.set(key, bucket);
    }
    
    return bucket;
  }

  /**
   * Refill tokens in a bucket based on elapsed time
   * 
   * @param bucket The token bucket to refill
   */
  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefilled;
    
    if (elapsed < 0) {
      // Clock was adjusted backward, reset lastRefilled
      bucket.lastRefilled = now;
      return;
    }
    
    // Calculate number of tokens to add
    const tokensToAdd = (elapsed / bucket.config.interval) * bucket.config.tokensPerInterval;
    
    if (tokensToAdd >= 1) {
      // Add tokens and update last refill time
      bucket.tokens = Math.min(bucket.config.burstCapacity!, bucket.tokens + tokensToAdd);
      bucket.lastRefilled = now;
    }
  }

  /**
   * Try to consume a token
   * 
   * @param key The key (IP, user, etc.)
   * @param cost Number of tokens to consume (default: 1)
   * @returns true if token was consumed, false if rate limit exceeded
   */
  consume(key: string, cost: number = 1): boolean {
    const bucket = this.getBucket(key);
    
    // Refill tokens based on elapsed time
    this.refillBucket(bucket);
    
    // Check if enough tokens are available
    if (bucket.tokens >= cost) {
      // Consume tokens
      bucket.tokens -= cost;
      return true;
    }
    
    // Rate limit exceeded
    return false;
  }

  /**
   * Get the time until next token is available (in milliseconds)
   * 
   * @param key The key (IP, user, etc.)
   * @returns Time in milliseconds until next token
   */
  getTimeToNextToken(key: string): number {
    const bucket = this.getBucket(key);
    
    // If tokens are available, return 0
    if (bucket.tokens >= 1) {
      return 0;
    }
    
    // Calculate time to next token
    const tokensNeeded = 1 - bucket.tokens;
    const refillRate = bucket.config.tokensPerInterval / bucket.config.interval;
    const timeToNextToken = tokensNeeded / refillRate;
    
    return Math.ceil(timeToNextToken);
  }

  /**
   * Get the number of tokens available for a key
   * 
   * @param key The key (IP, user, etc.)
   * @returns Number of available tokens
   */
  getAvailableTokens(key: string): number {
    const bucket = this.getBucket(key);
    this.refillBucket(bucket);
    return bucket.tokens;
  }

  /**
   * Reset rate limit for a key
   * 
   * @param key The key to reset
   */
  reset(key: string): void {
    const bucket = this.getBucket(key);
    bucket.tokens = bucket.config.burstCapacity!;
    bucket.lastRefilled = Date.now();
  }

  /**
   * Clear all rate limits
   */
  resetAll(): void {
    this.buckets.clear();
  }
}