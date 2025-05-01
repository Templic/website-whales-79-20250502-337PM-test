/**
 * Token Bucket Rate Limiter
 * 
 * Implements a token bucket algorithm for efficient rate limiting:
 * - Each "bucket" has a maximum capacity (burst capacity)
 * - Tokens are added to the bucket at a fixed rate over time
 * - When a request is made, tokens are consumed from the bucket
 * - If the bucket has enough tokens, the request is allowed
 * - If not, the request is denied (rate limit exceeded)
 * 
 * This approach allows for:
 * - Handling burst traffic (with the burst capacity)
 * - Smooth rate limiting over time
 * - Low memory overhead
 */

export interface RateLimitConfig {
  tokensPerInterval: number;  // Number of tokens added per interval
  interval: number;           // Interval in milliseconds
  burstCapacity: number;      // Maximum tokens that can be accumulated (burst capacity)
}

export interface RateLimitState {
  tokens: number;             // Current number of tokens in the bucket
  lastRefill: number;         // Timestamp of last token refill
}

/**
 * TokenBucketRateLimiter provides rate limiting based on the token bucket algorithm
 */
export class TokenBucketRateLimiter {
  private buckets = new Map<string, RateLimitState>();
  private defaultConfig: RateLimitConfig;
  private customConfigs = new Map<string, RateLimitConfig>();
  
  /**
   * Create a new TokenBucketRateLimiter
   * @param defaultConfig Default configuration for rate limiting
   */
  constructor(defaultConfig: RateLimitConfig = {
    tokensPerInterval: 60,    // 60 requests per minute
    interval: 60000,          // 1 minute in milliseconds
    burstCapacity: 120        // Allow bursts up to 120 requests
  }) {
    this.defaultConfig = defaultConfig;
  }
  
  /**
   * Set a custom rate limit configuration for a specific key
   * @param key The rate limit key (e.g., IP address, user ID, etc.)
   * @param config The rate limit configuration
   */
  setCustomConfig(key: string, config: RateLimitConfig): void {
    this.customConfigs.set(key, config);
  }
  
  /**
   * Remove a custom rate limit configuration
   * @param key The rate limit key
   */
  removeCustomConfig(key: string): void {
    this.customConfigs.delete(key);
  }
  
  /**
   * Get the configuration for a key
   * @param key The rate limit key
   * @returns The configuration for the key or the default configuration
   */
  getConfig(key: string): RateLimitConfig {
    return this.customConfigs.get(key) || this.defaultConfig;
  }
  
  /**
   * Try to consume tokens for the given key
   * @param key The rate limit key (e.g., IP address, user ID, etc.)
   * @param tokens Number of tokens to consume (default: 1)
   * @returns true if successful, false if rate limit exceeded
   */
  consume(key: string, tokens: number = 1): boolean {
    const config = this.customConfigs.get(key) || this.defaultConfig;
    let state = this.buckets.get(key);
    
    const now = Date.now();
    
    if (!state) {
      // Create new bucket with full tokens minus consumed
      state = {
        tokens: config.burstCapacity - tokens,
        lastRefill: now
      };
      this.buckets.set(key, state);
      return true;
    }
    
    // Refill tokens based on time elapsed
    const elapsedMs = now - state.lastRefill;
    const tokensToAdd = (elapsedMs / config.interval) * config.tokensPerInterval;
    
    if (tokensToAdd > 0) {
      state.tokens = Math.min(config.burstCapacity, state.tokens + tokensToAdd);
      state.lastRefill = now;
    }
    
    // Check if enough tokens are available
    if (state.tokens >= tokens) {
      state.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  /**
   * Reset the rate limit for a key
   * @param key The rate limit key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }
  
  /**
   * Get the current number of tokens in the bucket
   * @param key The rate limit key
   * @returns The current number of tokens or undefined if key doesn't exist
   */
  getTokens(key: string): number | undefined {
    const state = this.buckets.get(key);
    
    if (!state) {
      return undefined;
    }
    
    // Calculate current tokens with refill
    const config = this.customConfigs.get(key) || this.defaultConfig;
    const now = Date.now();
    const elapsedMs = now - state.lastRefill;
    const tokensToAdd = (elapsedMs / config.interval) * config.tokensPerInterval;
    
    if (tokensToAdd > 0) {
      return Math.min(config.burstCapacity, state.tokens + tokensToAdd);
    }
    
    return state.tokens;
  }
  
  /**
   * Get the time in milliseconds until the next token is available
   * @param key The rate limit key
   * @returns Time in milliseconds until next token or 0 if tokens are available
   */
  getTimeToNextToken(key: string): number {
    const state = this.buckets.get(key);
    
    if (!state) {
      return 0;
    }
    
    const config = this.customConfigs.get(key) || this.defaultConfig;
    
    // If tokens are available, return 0
    if (state.tokens >= 1) {
      return 0;
    }
    
    // Calculate time until next token
    const tokensNeeded = 1 - state.tokens;
    const timePerToken = config.interval / config.tokensPerInterval;
    const timeNeeded = tokensNeeded * timePerToken;
    
    const now = Date.now();
    const elapsedMs = now - state.lastRefill;
    const timeToNextToken = Math.max(0, timeNeeded - elapsedMs);
    
    return timeToNextToken;
  }
  
  /**
   * Clean up old buckets that haven't been used recently
   * @param maxAge Maximum age in milliseconds before cleaning up
   * @returns Number of buckets cleaned up
   */
  cleanup(maxAge: number = 3600000): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, state] of this.buckets.entries()) {
      if (now - state.lastRefill > maxAge) {
        this.buckets.delete(key);
        count++;
      }
    }
    
    return count;
  }
}