/**
 * Security Initializer
 * 
 * This module initializes all security components and applies
 * security middleware to the Express application.
 */

import { Application, Router } from 'express';
import { applyGlobalSecurityMiddleware, enhanceSecurityRoutes, enhanceNewsletterRoutes, enhanceOrderRoutes } from './enhancement/routeEnhancements';
import { logSecurityEvent } from './utils/securityUtils';
import { SecurityLogLevel } from './types/securityTypes';
import { cleanupRateLimiters } from './middleware/rateLimiters';

/**
 * Interface for security configuration
 */
export interface SecurityInitializerOptions {
  enableAPIValidation?: boolean;
  enableRateLimiting?: boolean;
  enableSecurityHeaders?: boolean;
  enableCSRFProtection?: boolean;
  enableAdvancedAnalytics?: boolean;
  enableRuntimeProtection?: boolean;
  enableAnomalyDetection?: boolean;
  maxScanDepth?: 'normal' | 'deep' | 'maximum';
}

/**
 * Default security configuration
 */
const defaultOptions: SecurityInitializerOptions = {
  enableAPIValidation: true,
  enableRateLimiting: true,
  enableSecurityHeaders: true,
  enableCSRFProtection: true,
  enableAdvancedAnalytics: false,
  enableRuntimeProtection: false,
  enableAnomalyDetection: false,
  maxScanDepth: 'normal'
};

/**
 * Initialize security components and apply security middleware
 * 
 * @param app Express application
 * @param options Security configuration options
 */
export function initializeSecurity(app: Application, options: SecurityInitializerOptions = {}) {
  // Merge provided options with defaults
  const securityOptions = { ...defaultOptions, ...options };
  
  // Log security initialization
  logSecurityEvent('SECURITY_INITIALIZED', {
    options: securityOptions,
    timestamp: new Date()
  }, SecurityLogLevel.INFO);
  
  // Apply global security middleware
  applyGlobalSecurityMiddleware(app: any);
  
  // Set up API routes
  const apiRouter = Router();
  app.use('/api', apiRouter);
  
  // Set up shop routes
  const shopRouter = Router();
  app.use('/api/shop', shopRouter);
  
  // Enhance security routes
  enhanceSecurityRoutes(apiRouter: any);
  
  // Enhance newsletter routes
  enhanceNewsletterRoutes(apiRouter: any);
  
  // Enhance order routes
  enhanceOrderRoutes(shopRouter: any);
  
  // Set up periodic cleanup for rate limiters
  setupPeriodicCleanup();
  
  // Log successful initialization
  console.log('[Security] Security system initialized successfully');
}

/**
 * Set up periodic cleanup tasks
 */
function setupPeriodicCleanup() {
  // Clean up rate limiters every 15 minutes
  setInterval(() => {
    cleanupRateLimiters();
  }, 15 * 60 * 1000);
}

/**
 * Shutdown security components
 */
export function shutdownSecurity() {
  // Perform any cleanup needed when shutting down the application
  
  // Log security shutdown
  logSecurityEvent('SECURITY_SHUTDOWN', {
    timestamp: new Date()
  }, SecurityLogLevel.INFO);
  
  console.log('[Security] Security system shutdown completed');
}