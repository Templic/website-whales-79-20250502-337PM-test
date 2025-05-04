/**
 * Rate Limiting System Interface
 * 
 * Defines the contract for rate limiting implementations to ensure
 * compatibility with the unified API validation system.
 */
import { Request } from 'express';

export interface RateLimitResult {
  allowed: boolean;
  message: string;
  retryAfter?: number;
}

export interface RateLimitOptions {
  type?: string;
  ip?: string;
  userId?: string;
  path?: string;
  method?: string;
}

/**
 * Interface for rate limiting systems
 */
export interface RateLimitingSystem {
  /**
   * Check if a request is allowed under rate limiting rules
   */
  check(req: Request, options?: RateLimitOptions): Promise<RateLimitResult>;
  
  /**
   * Alternative check method name used in some implementations
   */
  checkRate?(req: Request, type?: string): Promise<RateLimitResult>;
  
  /**
   * Register a new rate limit category
   */
  register?(type: string, config: any): void;
  
  /**
   * Reset all rate limits (typically used in testing)
   */
  reset?(): void;
}