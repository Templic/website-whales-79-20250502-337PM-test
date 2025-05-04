/**
 * Rate Limit Integration
 *
 * This module integrates rate limiting with CSRF protection.
 * It helps ensure that CSRF protection and rate limiting work together properly.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../../utils/logger';
import { getClientIp } from '../../../utils/ip-utils';

/**
 * CSRF verification entry
 */
interface CsrfVerificationEntry {
  /**
   * IP address
   */
  ip: string;
  
  /**
   * User ID (if authenticated)
   */
  userId?: string | number;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Request path
   */
  path: string;
  
  /**
   * HTTP method
   */
  method: string;
  
  /**
   * Request headers
   */
  headers: Record<string, string>;
  
  /**
   * Whether verification was successful
   */
  success: boolean;
}

/**
 * CSRF verification registry
 */
interface CsrfVerificationRegistry {
  /**
   * All verifications
   */
  verifications: CsrfVerificationEntry[];
  
  /**
   * Successful verifications
   */
  successful: Map<string, CsrfVerificationEntry[]>;
  
  /**
   * Failed verifications
   */
  failed: Map<string, CsrfVerificationEntry[]>;
  
  /**
   * Last cleanup time
   */
  lastCleanup: number;
}

/**
 * CSRF error entry
 */
interface CsrfErrorEntry {
  /**
   * IP address
   */
  ip: string;
  
  /**
   * User ID (if authenticated)
   */
  userId?: string | number;
  
  /**
   * Timestamp
   */
  timestamp: number;
  
  /**
   * Request path
   */
  path: string;
  
  /**
   * HTTP method
   */
  method: string;
  
  /**
   * Error type
   */
  errorType: string;
  
  /**
   * Request headers
   */
  headers: Record<string, string>;
}

/**
 * Registry of recent CSRF verifications
 */
const csrfRegistry: CsrfVerificationRegistry = {
  verifications: [],
  successful: new Map(),
  failed: new Map(),
  lastCleanup: Date.now()
};

/**
 * Recent CSRF errors
 */
const csrfErrors: CsrfErrorEntry[] = [];

/**
 * Recent rate limit exceptions granted
 */
const rateLimitExceptions: Map<string, number> = new Map();

/**
 * Record CSRF verification
 * 
 * @param req Express request
 */
export function recordCsrfVerification(req: Request): void {
  try {
    // Get IP and user ID
    const ip = getClientIp(req);
    const userId = req.session?.userId;
    
    // Create entry
    const entry: CsrfVerificationEntry = {
      ip,
      userId,
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      headers: Object.entries(req.headers)
        .reduce((obj, [key, value]) => {
          obj[key] = Array.isArray(value) ? value.join(', ') : String(value || '');
          return obj;
        }, {} as Record<string, string>),
      success: true
    };
    
    // Add to all verifications
    csrfRegistry.verifications.push(entry);
    
    // Add to successful verifications
    const ipKey = `ip:${ip}`;
    const ipVerifications = csrfRegistry.successful.get(ipKey) || [];
    ipVerifications.push(entry);
    csrfRegistry.successful.set(ipKey, ipVerifications);
    
    // Add to user verifications if authenticated
    if (userId) {
      const userKey = `user:${userId}`;
      const userVerifications = csrfRegistry.successful.get(userKey) || [];
      userVerifications.push(entry);
      csrfRegistry.successful.set(userKey, userVerifications);
    }
    
    // Cleanup old entries if needed
    cleanupCsrfRegistry();
    
    // Grant rate limit exception
    grantRateLimitException(ip, userId);
  } catch (error) {
    log(`Error recording CSRF verification: ${error}`, 'error');
  }
}

/**
 * Record CSRF error
 * 
 * @param req Express request
 * @param errorType Error type (optional, defaults to 'token_mismatch')
 */
export function recordCsrfError(req: Request, errorType: string = 'token_mismatch'): void {
  try {
    // Get IP and user ID
    const ip = getClientIp(req);
    const userId = req.session?.userId;
    
    // Create error entry
    const entry: CsrfErrorEntry = {
      ip,
      userId,
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      errorType,
      headers: Object.entries(req.headers)
        .reduce((obj, [key, value]) => {
          obj[key] = Array.isArray(value) ? value.join(', ') : String(value || '');
          return obj;
        }, {} as Record<string, string>)
    };
    
    // Add to errors
    csrfErrors.push(entry);
    
    // Add to failed verifications
    const ipKey = `ip:${ip}`;
    const ipVerifications = csrfRegistry.failed.get(ipKey) || [];
    
    ipVerifications.push({
      ...entry,
      success: false
    } as CsrfVerificationEntry);
    
    csrfRegistry.failed.set(ipKey, ipVerifications);
    
    // Add to user failed verifications if authenticated
    if (userId) {
      const userKey = `user:${userId}`;
      const userVerifications = csrfRegistry.failed.get(userKey) || [];
      
      userVerifications.push({
        ...entry,
        success: false
      } as CsrfVerificationEntry);
      
      csrfRegistry.failed.set(userKey, userVerifications);
    }
    
    // Trim errors if too many
    if (csrfErrors.length > 1000) {
      csrfErrors.splice(0, csrfErrors.length - 1000);
    }
    
    // Log error
    log(`CSRF error (${errorType}): ${req.method} ${req.path}`, 'security');
  } catch (error) {
    log(`Error recording CSRF error: ${error}`, 'error');
  }
}

/**
 * Cleanup CSRF registry
 */
function cleanupCsrfRegistry(): void {
  try {
    const now = Date.now();
    
    // Skip if less than 10 minutes since last cleanup
    if (now - csrfRegistry.lastCleanup < 10 * 60 * 1000) {
      return;
    }
    
    // Update last cleanup
    csrfRegistry.lastCleanup = now;
    
    // Cleanup old entries (keep last 24 hours)
    const cutoff = now - 24 * 60 * 60 * 1000;
    
    // Cleanup all verifications
    csrfRegistry.verifications = csrfRegistry.verifications.filter(
      v => v.timestamp >= cutoff
    );
    
    // Cleanup successful verifications
    for (const [key, verifications] of csrfRegistry.successful.entries()) {
      const newVerifications = verifications.filter(v => v.timestamp >= cutoff);
      
      if (newVerifications.length === 0) {
        csrfRegistry.successful.delete(key);
      } else {
        csrfRegistry.successful.set(key, newVerifications);
      }
    }
    
    // Cleanup failed verifications
    for (const [key, verifications] of csrfRegistry.failed.entries()) {
      const newVerifications = verifications.filter(v => v.timestamp >= cutoff);
      
      if (newVerifications.length === 0) {
        csrfRegistry.failed.delete(key);
      } else {
        csrfRegistry.failed.set(key, newVerifications);
      }
    }
    
    // Cleanup old rate limit exceptions
    for (const [key, timestamp] of rateLimitExceptions.entries()) {
      if (timestamp < cutoff) {
        rateLimitExceptions.delete(key);
      }
    }
    
    // Cleanup old CSRF errors
    const oldErrorsLength = csrfErrors.length;
    const newErrors = csrfErrors.filter(e => e.timestamp >= cutoff);
    
    if (newErrors.length !== oldErrorsLength) {
      csrfErrors.splice(0, csrfErrors.length);
      csrfErrors.push(...newErrors);
    }
  } catch (error) {
    log(`Error cleaning up CSRF registry: ${error}`, 'error');
  }
}

/**
 * Grant rate limit exception
 * 
 * @param ip IP address
 * @param userId User ID (if available)
 */
function grantRateLimitException(ip: string, userId?: string | number): void {
  try {
    const now = Date.now();
    
    // Grant exception for IP
    rateLimitExceptions.set(`ip:${ip}`, now);
    
    // Grant exception for user if authenticated
    if (userId) {
      rateLimitExceptions.set(`user:${userId}`, now);
    }
  } catch (error) {
    log(`Error granting rate limit exception: ${error}`, 'error');
  }
}

/**
 * Check if rate limit exception granted
 * 
 * @param ip IP address
 * @param userId User ID (if available)
 * @returns Whether exception granted
 */
function hasRateLimitException(ip: string, userId?: string | number): boolean {
  try {
    const now = Date.now();
    const exceptionWindow = 10 * 60 * 1000; // 10 minutes
    
    // Check IP exception
    const ipException = rateLimitExceptions.get(`ip:${ip}`);
    
    if (ipException && now - ipException < exceptionWindow) {
      return true;
    }
    
    // Check user exception if authenticated
    if (userId) {
      const userException = rateLimitExceptions.get(`user:${userId}`);
      
      if (userException && now - userException < exceptionWindow) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log(`Error checking rate limit exception: ${error}`, 'error');
    
    // Fail open
    return true;
  }
}

/**
 * Initialize rate limiting and CSRF integration
 * 
 * @returns Express middleware
 */
export function initializeRateLimitingAndCsrf(): (req: Request, res: Response, next: NextFunction) => void {
  log('Initializing CSRF and rate limiting integration', 'security');
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if this is CSRF verification redirect
      const isVerificationRequired = req.path === '/csrf/verify' || req.query.csrf === 'verify';
      
      if (isVerificationRequired) {
        // Don't rate limit verification pages
        return next();
      }
      
      // Get client information
      const ip = getClientIp(req);
      const userId = req.session?.userId;
      
      // Check for manual exception
      if (hasRateLimitException(ip, userId)) {
        // Skip rate limiting
        return next();
      }
      
      // Otherwise, continue to next middleware (which will likely be rate limiting)
      next();
    } catch (error) {
      log(`Error in CSRF rate limit integration: ${error}`, 'error');
      
      // Fail open
      next();
    }
  };
}

/**
 * Get the rate limiting integration components
 * 
 * @returns CSRF and rate limiting integration components
 */
export function getRateLimitingComponents() {
  return {
    csrfRegistry,
    csrfErrors,
    rateLimitExceptions
  };
}