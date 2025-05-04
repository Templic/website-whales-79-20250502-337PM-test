/**
 * Advanced Rate Limiting System
 * 
 * Central integration module for the context-aware rate limiting system.
 * This module initializes all components and exports the unified system.
 */

import { TokenBucketRateLimiter } from './TokenBucketRateLimiter';
import { AdaptiveRateLimiter } from './AdaptiveRateLimiter';
import { RateLimitAnalytics } from './RateLimitAnalytics';
import { createUnifiedRateLimit } from '../../../middleware/unifiedRateLimit';

// Initialize all rate limiters
const rateLimiters = {
  // Global limiter - applies to all requests
  global: new TokenBucketRateLimiter({
    tokensPerInterval: 1000, // 1000 requests per minute globally
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 2000      // Allow bursts up to 2000 requests
  }),
  
  // Auth endpoints - login, register, password reset
  auth: new TokenBucketRateLimiter({
    tokensPerInterval: 10,   // 10 requests per minute for auth
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 20,       // Allow bursts up to 20 requests
    errorHandler: (context) => {
      console.warn(`[RateLimit] Auth rate limit exceeded for ${context.ip} on ${context.path}`);
    }
  }),
  
  // Admin endpoints
  admin: new TokenBucketRateLimiter({
    tokensPerInterval: 100,  // 100 requests per minute for admin
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 200       // Allow bursts up to 200 requests
  }),
  
  // Security operations
  security: new TokenBucketRateLimiter({
    tokensPerInterval: 60,   // 60 requests per minute for security
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 120       // Allow bursts up to 120 requests
  }),
  
  // Standard API endpoints
  api: new TokenBucketRateLimiter({
    tokensPerInterval: 300,  // 300 requests per minute for API
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 500,      // Allow bursts up to 500 requests
    costCalculator: (context) => {
      // Higher cost for write operations
      return context.method === 'GET' ? 1 : 2;
    }
  }),
  
  // Public endpoints
  public: new TokenBucketRateLimiter({
    tokensPerInterval: 500,  // 500 requests per minute for public
    interval: 60 * 1000,     // 1 minute
    burstCapacity: 1000      // Allow bursts up to 1000 requests
  })
};

// Initialize the adaptive rate limiter
const adaptiveRateLimiter = new AdaptiveRateLimiter(rateLimiters, {
  adjustmentInterval: 30 * 1000, // Adjust every 30 seconds
  maxRestrictionFactor: 5.0,     // Maximum 5x restriction (down to 20% of normal)
  minimumTokensPercent: 0.1,     // Never go below 10% of normal limits
  loadThresholds: { start: 0.7, max: 0.9 },
  memoryThresholds: { start: 0.8, max: 0.95 },
  threatThresholds: { start: 50, max: 80 },
  verbose: false
});

// Initialize analytics
const rateLimitAnalytics = new RateLimitAnalytics(rateLimiters);

// Schedule periodic collection of violations
const ANALYTICS_COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  try {
    rateLimitAnalytics.collectViolations();
    
    // Check for potential attackers
    const potentialAttackers = rateLimitAnalytics.identifyPotentialAttackers();
    if (potentialAttackers.length > 0) {
      console.warn(`[RateLimit] Identified ${potentialAttackers.length} potential attackers`);
      
      // Log the top 3 potential attackers
      potentialAttackers.slice(0, 3).forEach(attacker => {
        console.warn(`[RateLimit] Potential attacker: ${attacker.ipOrUser}, violations: ${attacker.violationCount}, threat score: ${attacker.threatScore}`);
      });
    }
  } catch (error) {
    console.error('[RateLimit] Error collecting analytics:', error);
  }
}, ANALYTICS_COLLECTION_INTERVAL);

// Export a function to manually collect violations (e.g., for shutdown)
export function collectRateLimitViolations(): void {
  rateLimitAnalytics.collectViolations();
}

// Export the middleware factory functions
export { createUnifiedRateLimit } from '../../../middleware/unifiedRateLimit';

// Export pre-configured middleware for common scenarios
export const {
  authRateLimit,
  adminRateLimit,
  securityRateLimit,
  apiRateLimit,
  publicRateLimit
} = require('../../../middleware/unifiedRateLimit');

// Export the rate limiters for direct access
export { rateLimiters, adaptiveRateLimiter, rateLimitAnalytics };

// Export a function to generate a report
export function generateRateLimitReport(startTime?: number, endTime?: number) {
  return rateLimitAnalytics.generateReport(startTime, endTime);
}

// Export a function to get the current adaptive adjustment metrics
export function getAdaptiveAdjustmentMetrics() {
  return adaptiveRateLimiter.getAdjustmentMetrics();
}

// Initialize immediately and log
console.log('[RateLimit] Advanced Rate Limiting System initialized');
console.log('[RateLimit] Middleware and analytics ready');
console.log('[RateLimit] Adaptive adjustments active');

// Export a cleanup function for graceful shutdown
export function cleanupRateLimiting() {
  // Collect final violations
  rateLimitAnalytics.collectViolations();
  
  // Stop adaptive adjustment
  adaptiveRateLimiter.dispose();
  
  console.log('[RateLimit] Rate limiting system shutdown cleanly');
}