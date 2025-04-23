/**
 * Security System Integration
 * 
 * This module serves as the main entry point for the security system,
 * integrating both standard and advanced security features.
 */

import express from 'express';
import { initializeAdvancedSecurity, getSecurityStatus, secureRoute, secureAdminRoute, secureSecurityRoute } from './advanced/AdvancedSecuritySystem';
import { SecurityConfig } from './advanced/config/SecurityConfig';

/**
 * Security system current state
 */
let securityInitialized = false;

/**
 * Initialize the security system
 */
export async function initializeSecurity(app: express.Application, options: {
  /**
   * Whether to initialize advanced security features
   */
  advanced?: boolean;

  /**
   * Security mode ('standard', 'enhanced', 'maximum')
   */
  mode?: 'standard' | 'enhanced' | 'maximum';

  /**
   * Advanced security configuration
   */
  advancedConfig?: SecurityConfig;
} = {}): Promise<void> {
  // Default options
  const mergedOptions = {
    advanced: true,
    mode: 'maximum' as const,
    ...options
  };

  console.log(`[Security] Initializing security system in ${mergedOptions.mode} mode...`);

  try {
    // Initialize advanced security if requested and available
    if (mergedOptions.advanced) {
      await initializeAdvancedSecurity(app, mergedOptions.advancedConfig);
    }

    // Mark as initialized
    securityInitialized = true;

    console.log('[Security] Security system initialized successfully');
  } catch (error) {
    console.error('[Security] Failed to initialize security system:', error);
    throw error;
  }
}

/**
 * Get the current status of the security system
 */
export function getStatus(): {
  initialized: boolean;
  status: Record<string, any>;
} {
  return {
    initialized: securityInitialized,
    status: securityInitialized ? getSecurityStatus() : { error: 'Security system not initialized' }
  };
}

/**
 * Check if the security system is initialized
 */
export function isInitialized(): boolean {
  return securityInitialized;
}

/**
 * Export security utilities
 */
export {
  secureRoute,
  secureAdminRoute,
  secureSecurityRoute
};

/**
 * Export standard security middleware
 */
export { default as standardSecurityMiddleware } from './middleware/standardSecurityMiddleware';

/**
 * Export rate limiting middleware
 */
export { 
  authRateLimit,
  sensitiveOpRateLimit,
  publicApiRateLimit,
  protectedApiRateLimit,
  securityLimiter
} from './middleware/rateLimit';

/**
 * Export input validation middleware
 */
export {
  validateBody,
  validateQuery,
  validateParams
} from './middleware/validation';

/**
 * Export JWT authentication middleware
 */
export {
  authenticateJwt,
  authorizeJwtRole
} from './middleware/jwtAuth';

/**
 * Export API security middleware
 */
export {
  verifyApiAuthentication,
  verifyApiAuthorization,
  validateApiRequest,
  enforceApiRateLimit
} from './middleware/apiSecurity';

/**
 * Export JWT utilities
 */
export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeToken,
  isTokenRevoked,
  extractTokenFromHeader
} from './jwt';