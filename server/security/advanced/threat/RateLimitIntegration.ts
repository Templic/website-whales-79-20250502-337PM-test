/**
 * Rate Limit Integration Module
 * 
 * This module provides integration between the rate limiting system and other
 * security components, particularly CSRF protection, to facilitate shared state
 * and coordinated responses to potential security threats.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { rateLimitingSystem } from './RateLimitingSystem';
import { config } from '../../../config';

/**
 * Configuration options for rate limiting integration
 */
export interface RateLimitIntegrationOptions {
  /**
   * Whether to enable CSRF integration
   */
  enableCsrfIntegration?: boolean;
  
  /**
   * The base penalty rate for CSRF failures
   */
  csrfFailurePenalty?: number;
  
  /**
   * The base reward rate for successful CSRF verifications
   */
  csrfSuccessReward?: number;
}

/**
 * Default integration options
 */
const defaultOptions: RateLimitIntegrationOptions = {
  enableCsrfIntegration: true,
  csrfFailurePenalty: 5, // Each failure costs 5 tokens
  csrfSuccessReward: 1   // Each success adds 1 token (to gradually restore trust)
};

// Initialize with default options
let options = { ...defaultOptions };

/**
 * Configure rate limit integration 
 */
export function configureRateLimitIntegration(customOptions: RateLimitIntegrationOptions) {
  options = { ...defaultOptions, ...customOptions };
  log('Rate limit integration configured with custom options', 'security');
}

/**
 * Initialize rate limiting and CSRF integration
 * 
 * @returns Middleware that handles the integration
 */
export function initializeRateLimitingAndCsrf() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Additional preprocessing logic can be added here
      // This middleware runs before both CSRF and rate limiting middleware
      next();
    } catch (error) {
      log(`Error in rate limiting and CSRF integration: ${error}`, 'security');
      next();
    }
  };
}

/**
 * Record a successful CSRF token verification
 * 
 * This helps build trust for the client, potentially increasing their rate limits.
 * 
 * @param req Express request
 */
export function recordCsrfVerification(req: Request) {
  if (!options.enableCsrfIntegration) return;
  
  try {
    const clientIp = getClientIp(req);
    const userId = req.session?.userId;
    
    // Record success with the rate limiting system
    // This gradually increases trust and potentially rate limits for verified users
    rateLimitingSystem.recordSuccessfulSecurityCheck({
      clientIp,
      userId: userId?.toString(),
      securityComponent: 'csrf',
      checkType: 'token-verification',
      successValue: options.csrfSuccessReward || 1
    });
    
    // Record telemetry (optional)
    if (config.features.enableExtraLogging) {
      log(`CSRF verification success recorded for IP: ${clientIp}`, 'security');
    }
  } catch (error) {
    log(`Error recording CSRF verification: ${error}`, 'security');
  }
}

/**
 * Record a CSRF token verification failure
 * 
 * This records failed CSRF checks, helping the rate limiter identify potential attacks.
 * 
 * @param req Express request
 * @param errorType Type of CSRF error
 */
export function recordCsrfError(req: Request, errorType: string) {
  if (!options.enableCsrfIntegration) return;
  
  try {
    const clientIp = getClientIp(req);
    const userId = req.session?.userId;
    const path = req.path;
    
    // Record failure with the rate limiting system
    // This potentially reduces rate limits for clients with CSRF errors
    rateLimitingSystem.recordFailedSecurityCheck({
      clientIp,
      userId: userId?.toString(),
      securityComponent: 'csrf',
      checkType: 'token-verification',
      failureType: errorType,
      path,
      failureValue: options.csrfFailurePenalty || 5
    });
    
    // Log the failure for monitoring purposes
    log(`CSRF verification failure recorded for IP: ${clientIp}, URL: ${req.url}, Type: ${errorType}`, 'security');
  } catch (error) {
    log(`Error recording CSRF error: ${error}`, 'security');
  }
}

/**
 * Get the client IP address
 */
function getClientIp(req: Request): string {
  // First try the X-Forwarded-For header (common for proxied requests)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can be a comma-separated list; take the first one
    const ips = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0] 
      : xForwardedFor.split(',')[0].trim();
    return ips;
  }
  
  // Fall back to other headers if X-Forwarded-For isn't present
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  
  // Finally, use the remote address from the request
  return req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Evaluate integrated security threats
 * 
 * This function analyzes multiple security systems to determine if a request
 * represents a significant threat that requires action beyond normal rate limiting.
 * 
 * @param req Express request
 * @returns Threat level assessment
 */
export function evaluateIntegratedThreat(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const userId = req.session?.userId;
    const path = req.path;
    
    // Retrieve security metrics from various components
    // For now, we'll just check rate limiting and CSRF components
    
    // Get the client's current token deficit (if any)
    const currentTokenDeficit = rateLimitingSystem.getTokenDeficit({
      clientIp,
      userId: userId?.toString(), 
      path
    });
    
    // Higher deficit means more suspicious activity
    const threatLevel = {
      score: currentTokenDeficit > 50 ? 'high' : 
             currentTokenDeficit > 20 ? 'medium' : 
             currentTokenDeficit > 5 ? 'low' : 'none',
      tokenDeficit: currentTokenDeficit,
      path,
      ip: clientIp
    };
    
    return threatLevel;
  } catch (error) {
    log(`Error evaluating integrated threat: ${error}`, 'security');
    return { score: 'error', message: 'Error evaluating threat' };
  }
}