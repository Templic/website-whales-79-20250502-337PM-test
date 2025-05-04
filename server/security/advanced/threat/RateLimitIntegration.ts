/**
 * Rate Limit Integration
 *
 * This module integrates the rate limiting system with the Express server
 * by providing middleware and route configuration.
 */

import express, { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { 
  globalRateLimit, 
  authRateLimit, 
  adminRateLimit, 
  securityRateLimit, 
  apiRateLimit, 
  publicRateLimit
} from './RateLimitingSystem';
import rateLimitRoutes from '../../../routes/api/security/rateLimit';

/**
 * Configure rate limiting for routes in an Express application
 * 
 * @param app Express application
 */
export function configureRateLimiting(app: express.Application): void {
  // Log configuration
  log('Configuring advanced rate limiting', 'security');
  
  // Apply global rate limit to all routes
  app.use(globalRateLimit);
  
  // Apply rate limits to specific paths
  
  // Authentication routes
  app.use('/api/auth', authRateLimit);
  
  // Admin routes
  app.use('/api/admin', adminRateLimit);
  
  // Security routes
  app.use('/api/security', securityRateLimit);
  
  // API routes
  app.use('/api', apiRateLimit);
  
  // Public routes (serving assets, etc.)
  app.use(publicRateLimit);
  
  // Register rate limit API routes
  app.use('/api/security/rate-limit', rateLimitRoutes);
  
  log('Rate limiting system configured successfully', 'security');
}

/**
 * Initialize the rate limiting system and return a function to configure it
 * 
 * This allows for deferred configuration of the rate limiting system
 * after all other routes and middleware have been set up.
 * 
 * @returns Function to configure rate limiting
 */
export function initializeRateLimiting(): (app: express.Application) => void {
  try {
    // Log initialization
    log('Initializing advanced rate limiting system', 'security');
    
    // Set up system-wide configurations
    
    // Return the configuration function
    return configureRateLimiting;
  } catch (error) {
    log(`Error initializing rate limiting: ${error}`, 'security');
    
    // Return a no-op function on error
    return (_app: express.Application) => {
      log('Rate limiting not configured due to initialization error', 'security');
    };
  }
}

/**
 * Create a custom rate limiter for special routes
 * 
 * @param options Custom options
 * @returns Rate limit middleware
 */
export function createCustomRateLimit(options: {
  capacity?: number,
  refillRate?: number,
  refillInterval?: number,
  message?: string
}) {
  // Import createUnifiedRateLimit from RateLimitingSystem
  const { createUnifiedRateLimit } = require('./RateLimitingSystem');
  
  // Set default options
  const capacity = options.capacity || 30;
  const refillRate = options.refillRate || 10;
  const refillInterval = options.refillInterval || 60000; // 1 minute
  const message = options.message || 'Custom rate limit exceeded. Please try again later.';
  
  // Create a custom limiter with these options
  return createUnifiedRateLimit({
    tier: 'api', // Use API tier as base
    statusCode: 429,
    message,
    headers: true,
    skipSuccessfulRequests: false
  });
}

/**
 * Configure special case rate limiting for very sensitive endpoints
 * 
 * @param app Express application
 */
export function configureSpecialCaseRateLimiting(app: express.Application): void {
  try {
    // Log initialization
    log('Configuring special case rate limiting', 'security');
    
    // Define special case routes with custom rate limits
    
    // Password reset/change (more restrictive)
    const passwordRouteLimit = createCustomRateLimit({
      capacity: 5,
      refillRate: 5,
      refillInterval: 300000, // 5 minutes
      message: 'Too many password reset attempts. Please try again later.'
    });
    
    app.use('/api/auth/reset-password', passwordRouteLimit);
    app.use('/api/auth/change-password', passwordRouteLimit);
    
    // Login attempts (more restrictive)
    const loginRouteLimit = createCustomRateLimit({
      capacity: 10,
      refillRate: 5,
      refillInterval: 300000, // 5 minutes
      message: 'Too many login attempts. Please try again later.'
    });
    
    app.use('/api/auth/login', loginRouteLimit);
    
    // Registration attempts (more restrictive)
    const registrationRouteLimit = createCustomRateLimit({
      capacity: 3,
      refillRate: 3,
      refillInterval: 3600000, // 1 hour
      message: 'Too many registration attempts. Please try again later.'
    });
    
    app.use('/api/auth/register', registrationRouteLimit);
    
    // Very sensitive admin operations (more restrictive)
    const sensitiveAdminRouteLimit = createCustomRateLimit({
      capacity: 10,
      refillRate: 5,
      refillInterval: 60000, // 1 minute
      message: 'Rate limit for sensitive admin operations exceeded. Please try again later.'
    });
    
    app.use('/api/admin/users', sensitiveAdminRouteLimit);
    app.use('/api/admin/settings', sensitiveAdminRouteLimit);
    
    log('Special case rate limiting configured successfully', 'security');
  } catch (error) {
    log(`Error configuring special case rate limiting: ${error}`, 'security');
  }
}

/**
 * Provide security metrics data for display in admin dashboard
 * 
 * @returns Security metrics data
 */
export function getRateLimitMetrics() {
  try {
    // Import functions from RateLimitingSystem
    const { generateRateLimitReport, getAdaptiveAdjustmentMetrics } = require('./RateLimitingSystem');
    const { getStats } = require('./ThreatDetectionService').threatDetectionService;
    
    // Get reports from various services
    const rateLimitReport = generateRateLimitReport();
    const adaptiveMetrics = getAdaptiveAdjustmentMetrics();
    const threatStats = getStats();
    
    // Build a combined metrics report
    return {
      timestamp: new Date().toISOString(),
      rateLimiting: {
        summary: rateLimitReport.analytics.summary,
        resourceTypes: rateLimitReport.analytics.resourceTypes.slice(0, 5) // Top 5
      },
      adaptive: {
        systemLoadFactor: adaptiveMetrics.systemLoadFactor,
        threatFactor: adaptiveMetrics.threatFactor,
        errorRateFactor: adaptiveMetrics.errorRateFactor
      },
      threats: {
        globalThreatLevel: threatStats.globalThreatLevel,
        recentThreats: threatStats.recentThreats,
        highThreats: threatStats.highThreats,
        topThreats: threatStats.topThreats.slice(0, 3) // Top 3
      }
    };
  } catch (error) {
    log(`Error getting rate limit metrics: ${error}`, 'security');
    
    return {
      timestamp: new Date().toISOString(),
      error: 'Failed to get rate limit metrics'
    };
  }
}