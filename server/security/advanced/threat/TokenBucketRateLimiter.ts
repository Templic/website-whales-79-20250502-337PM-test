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
 * - Context-aware rate limiting decisions
 * - Dynamic cost calculation based on request properties
 * - Violation tracking and analytics
 */

export interface RateLimitConfig {
  tokensPerInterval: number;  // Number of tokens added per interval
  interval: number;           // Interval in milliseconds
  burstCapacity?: number;     // Maximum tokens the bucket can hold (defaults to tokensPerInterval)
  
  // Enhanced configuration options
  costCalculator?: (context: RequestContext) => number; // Dynamic request cost
  keyGenerator?: (context: RequestContext) => string;   // Custom key generation
  errorHandler?: (context: RequestContext) => void;     // Handle exceeded limits
  bypassFunction?: (context: RequestContext) => boolean; // Bypass criteria
}

export interface RequestContext {
  ip: string;                 // Client IP address
  userId?: string;            // User ID if authenticated
  userRole?: string;          // User role if available
  path: string;               // Request path
  method: string;             // HTTP method (GET, POST, etc.)
  headers: Record<string, string>; // Request headers
  securityRisk?: number;      // 0-1 risk score from security system
  systemLoad?: number;        // 0-1 current system load
  resourceType?: string;      // Categorization of requested resource
  customData?: Record<string, any>; // Any additional context data
}

interface TokenBucket {
  tokens: number;             // Current token count
  lastRefilled: number;       // Timestamp of last refill
  config: RateLimitConfig;    // Configuration for this bucket
}

interface ViolationData {
  count: number;              // Number of violations
  firstViolation: number;     // Timestamp of first violation
  lastViolation: number;      // Timestamp of most recent violation
  paths: Set<string>;         // Paths that triggered violations
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private defaultConfig: RateLimitConfig;
  private customConfigs: Map<string, RateLimitConfig> = new Map();
  private violations: Map<string, ViolationData> = new Map();

  /**
   * Create a new rate limiter
   * 
   * @param config Default rate limiting configuration
   */
  constructor(config: RateLimitConfig) {
    this.defaultConfig = {
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
      burstCapacity: config.burstCapacity || config.tokensPerInterval,
      costCalculator: config.costCalculator,
      keyGenerator: config.keyGenerator,
      errorHandler: config.errorHandler,
      bypassFunction: config.bypassFunction
    };
  }
  
  /**
   * Get a copy of the current configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.defaultConfig };
  }
  
  /**
   * Update the default configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...config,
      burstCapacity: config.burstCapacity || config.tokensPerInterval || this.defaultConfig.burstCapacity
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
  
  /**
   * Check limit with full context awareness
   * 
   * @param context Request context with IP, user info, path, etc.
   * @returns true if within limits, false if exceeded
   */
  consumeWithContext(context: RequestContext): boolean {
    // Check if this request should bypass rate limiting
    if (this.shouldBypass(context)) {
      return true;
    }
    
    // Generate appropriate key from context
    const key = this.getKeyFromContext(context);
    
    // Calculate cost based on context
    const cost = this.calculateCost(context);
    
    // Try to consume tokens
    const result = this.consume(key, cost);
    
    // Track violation if limit was exceeded
    if (!result) {
      this.trackViolation(key, context);
      
      // If there's an error handler, call it
      const config = this.getConfigForKey(key);
      if (config.errorHandler) {
        try {
          config.errorHandler(context);
        } catch (error) {
          console.error(`Error in rate limit error handler for ${key}:`, error);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Generate key from request context using configured logic
   */
  getKeyFromContext(context: RequestContext): string {
    // Use custom key generator if configured
    if (this.defaultConfig.keyGenerator) {
      return this.defaultConfig.keyGenerator(context);
    }
    
    // Default tiered key generation based on available context
    if (context.userId) {
      // Authenticated user - track by user ID and path type
      return `user:${context.userId}:${context.resourceType || 'default'}`;
    }
    
    if (context.path) {
      // Unauthenticated but with path - track by IP and path
      return `ip:${context.ip}:${context.path}`;
    }
    
    // Just track by IP as fallback
    return `ip:${context.ip}`;
  }
  
  /**
   * Calculate request cost based on context
   */
  private calculateCost(context: RequestContext): number {
    // Use custom cost calculator if configured
    if (this.defaultConfig.costCalculator) {
      return this.defaultConfig.costCalculator(context);
    }
    
    // Default cost calculation based on context
    let cost = 1.0;
    
    // Higher cost for known security risks
    if (context.securityRisk && context.securityRisk > 0) {
      cost *= (1 + context.securityRisk);
    }
    
    // Higher cost under system load
    if (context.systemLoad && context.systemLoad > 0.7) {
      cost *= (1 + (context.systemLoad - 0.7) * 2);
    }
    
    // Higher cost for write operations
    if (context.method === 'POST' || context.method === 'PUT' || context.method === 'DELETE') {
      cost *= 1.5;
    }
    
    // Higher cost for admin/security resources
    if (context.resourceType === 'admin' || context.resourceType === 'security') {
      cost *= 2.0;
    }
    
    return cost;
  }
  
  /**
   * Check if request should bypass rate limiting
   */
  private shouldBypass(context: RequestContext): boolean {
    // Use custom bypass function if configured
    if (this.defaultConfig.bypassFunction) {
      return this.defaultConfig.bypassFunction(context);
    }
    
    // Default bypass logic
    
    // Bypass for internal monitoring paths
    if (context.path === '/health' || context.path === '/status') {
      return true;
    }
    
    // Bypass for admin users
    if (context.userRole === 'admin' || context.userRole === 'security_admin') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Track rate limit violation for analysis
   */
  private trackViolation(key: string, context: RequestContext): void {
    const now = Date.now();
    let data = this.violations.get(key);
    
    if (!data) {
      data = {
        count: 0,
        firstViolation: now,
        lastViolation: now,
        paths: new Set()
      };
      this.violations.set(key, data);
    }
    
    // Update violation data
    data.count++;
    data.lastViolation = now;
    if (context.path) {
      data.paths.add(context.path);
    }
  }
  
  /**
   * Get statistics about rate limit violations
   */
  getViolationStats(): Record<string, {
    count: number;
    firstViolation: number;
    lastViolation: number;
    paths: string[];
  }> {
    const stats: Record<string, any> = {};
    
    this.violations.forEach((data, key) => {
      stats[key] = {
        count: data.count,
        firstViolation: data.firstViolation,
        lastViolation: data.lastViolation,
        paths: [...data.paths]
      };
    });
    
    return stats;
  }
  
  /**
   * Reset violation tracking
   */
  resetViolationStats(): void {
    this.violations.clear();
  }
}