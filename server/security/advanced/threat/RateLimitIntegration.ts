/**
 * Rate Limiting System Integration
 *
 * This module handles the integration of our context-aware rate limiting system
 * with the main application. It initializes all necessary components and provides
 * methods for applying rate limiting to different parts of the application.
 */

import { Application } from 'express';
import { 
  rateLimiters,
  adaptiveRateLimiter,
  rateLimitAnalytics,
  collectRateLimitViolations,
  createUnifiedRateLimit,
  authRateLimit,
  adminRateLimit,
  securityRateLimit,
  apiRateLimit,
  publicRateLimit
} from './RateLimitingSystem';

import router from '../../../routes/api/security/rateLimit';

/**
 * Initializes the rate limiting system
 */
export function initializeRateLimiting(): void {
  console.log('[RateLimit] Initializing rate limiting system...');
  
  // The RateLimitingSystem.ts file handles the instantiation of all components
  
  console.log('[RateLimit] Rate limiting system initialized successfully');
}

/**
 * Applies rate limiting to Express application routes
 * 
 * @param app The Express application
 */
export function applyRateLimiting(app: Application): void {
  console.log('[RateLimit] Applying rate limiting to application routes...');
  
  // Apply global rate limiting to all routes
  app.use(createUnifiedRateLimit({
    tier: 'global',
    blockingEnabled: true,
    logViolations: true
  }));
  
  // Apply rate limiting to specific routes based on their sensitivity
  app.use('/api/auth', authRateLimit);
  app.use('/api/admin', adminRateLimit);
  app.use('/api/security', securityRateLimit);
  app.use('/api', apiRateLimit);
  
  // Register rate limit API endpoint for monitoring
  app.use('/api/security/rate-limit', securityRateLimit, router);
  
  console.log('[RateLimit] Rate limiting applied to application routes');
}

/**
 * Handles application shutdown, collecting final analytics
 */
export function shutdownRateLimiting(): void {
  // Collect final analytics before shutdown
  collectRateLimitViolations();
}

/**
 * Provides access to the rate limiting components
 */
export {
  rateLimiters,
  adaptiveRateLimiter,
  rateLimitAnalytics,
  createUnifiedRateLimit,
  authRateLimit,
  adminRateLimit,
  securityRateLimit,
  apiRateLimit,
  publicRateLimit
};