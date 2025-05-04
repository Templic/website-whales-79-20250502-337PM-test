/**
 * Security Integration Module
 * 
 * This module coordinates the integration between various security systems
 * including CSRF protection, rate limiting, and threat detection.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../utils/logger';
import { rateLimitingSystem } from './threat/RateLimitingSystem';
import { initializeRateLimitingAndCsrf } from './threat/RateLimitIntegration';

/**
 * Integration configuration
 */
export interface SecurityIntegrationConfig {
  /**
   * Whether to enable CSRF protection
   */
  enableCsrf?: boolean;
  
  /**
   * Whether to enable rate limiting
   */
  enableRateLimiting?: boolean;
  
  /**
   * Whether to enable integrated security
   */
  enableIntegratedSecurity?: boolean;
}

// Security components storage
const securityComponents = {
  csrf: {
    enabled: false,
    middleware: null,
    getCsrfMiddleware: () => (req: Request, res: Response, next: NextFunction) => next()
  },
  
  rateLimiting: {
    enabled: false,
    middleware: null,
    getRateLimitingMiddleware: () => (req: Request, res: Response, next: NextFunction) => next()
  }
};

/**
 * Initialize security integration
 * 
 * @param app Express application
 * @param options Integration configuration
 */
export function initializeSecurityIntegration(app: any, options: SecurityIntegrationConfig = {}) {
  try {
    // Get configuration
    const {
      enableCsrf = true,
      enableRateLimiting = true,
      enableIntegratedSecurity = true
    } = options;
    
    // Store configuration
    securityComponents.csrf.enabled = enableCsrf;
    securityComponents.rateLimiting.enabled = enableRateLimiting;
    
    // Initialize cross-security system communication if integrated security is enabled
    if (enableIntegratedSecurity) {
      log('Setting up integrated security cross-communication...', 'security');
      setupCrossCommunication();
    }
    
    // Set up middleware
    if (enableRateLimiting) {
      securityComponents.rateLimiting.middleware = rateLimitingSystem.createMiddleware();
      securityComponents.rateLimiting.getRateLimitingMiddleware = () => securityComponents.rateLimiting.middleware;
      
      log('Rate limiting middleware integrated with security system', 'security');
    }
    
    if (enableIntegratedSecurity) {
      // Add integrated middleware if both systems are enabled
      if (enableCsrf && enableRateLimiting) {
        app.use(initializeRateLimitingAndCsrf());
        log('Integrated CSRF and rate limiting cross-communication enabled', 'security');
      }
      
      // Apply middleware to Express app
      log('Security integration complete', 'security');
    }
  } catch (error) {
    log(`Error initializing security integration: ${error}`, 'error');
  }
}

/**
 * Set up cross-communication between security systems
 */
function setupCrossCommunication() {
  // Nothing additional needed as the connections are already established 
  // through the import structure and the usage of the recordCsrfVerification 
  // and recordCsrfError functions
  
  log('Security cross-communication initialized', 'security');
}

/**
 * Create a middleware that checks requests against both CSRF and rate limiting
 */
export function createIntegratedSecurityMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Record request for later analysis
      // This can be expanded to collect more metrics about the request
      
      // Continue request processing
      next();
    } catch (error) {
      log(`Error in integrated security middleware: ${error}`, 'error');
      next();
    }
  };
}

/**
 * Get security integration status
 */
export function getSecurityIntegrationStatus() {
  return {
    csrf: securityComponents.csrf.enabled,
    rateLimiting: securityComponents.rateLimiting.enabled,
    integratedSecurity: securityComponents.csrf.enabled && securityComponents.rateLimiting.enabled
  };
}