/**
 * MFA Middleware
 * 
 * This middleware enforces Multi-Factor Authentication requirements
 * on routes that require enhanced security.
 * 
 * It works by:
 * 1. Checking if MFA is enabled for the route
 * 2. Verifying if the user has MFA enabled
 * 3. Checking if the current session has completed MFA verification
 * 4. Redirecting to MFA verification if needed
 */

import { Request, Response, NextFunction } from 'express';
import { totpService } from '../security/advanced/auth/TOTPService';
import { db } from '../db';
import { userMfaSettings } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { securityConfig } from '../security/advanced/config/SecurityConfig';

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    mfaVerified?: boolean;
    mfaVerifiedAt?: string;
  }
}

/**
 * Config for MFA middleware
 */
interface MFAConfig {
  // Routes that require MFA authentication
  protectedRoutes: Array<{
    path: string | RegExp;
    methods?: string[]; // If not specified, applies to all methods
  }>;
  
  // Custom redirect URL (default: /auth/mfa/verify)
  verifyUrl?: string;
  
  // Whether to enforce MFA for all users in certain roles
  enforceForRoles?: string[];
  
  // Option to bypass MFA for trusted devices
  allowTrustedDevices?: boolean;
  
  // How long (in milliseconds) an MFA session is valid
  mfaSessionDuration?: number;
}

// Default config
const defaultConfig: MFAConfig = {
  protectedRoutes: [
    { path: /^\/admin\/.*$/ },
    { path: '/api/user/settings', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/security/settings' }
  ],
  verifyUrl: '/auth/mfa/verify',
  enforceForRoles: ['admin', 'super_admin'],
  allowTrustedDevices: true,
  mfaSessionDuration: 8 * 60 * 60 * 1000 // 8 hours
};

/**
 * Creates the MFA middleware with configuration
 */
export function createMFAMiddleware(config?: Partial<MFAConfig>) {
  const mfaConfig: MFAConfig = { ...defaultConfig, ...config };
  
  return async function mfaMiddleware(req: Request, res: Response, next: NextFunction) {
    // Skip if MFA is disabled globally
    if (!securityConfig.getSecurityFeatures().mfa) {
      return next();
    }
    
    // Skip if not a protected route
    if (!isProtectedRoute(req, mfaConfig)) {
      return next();
    }
    
    // Skip if no user is logged in
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Check if the user has MFA enabled, or if it's required for their role
    const isMFARequired = await checkMFARequired(userId, req.user.role, mfaConfig);
    
    if (!isMFARequired) {
      return next();
    }
    
    // Check if the current session has completed MFA
    const hasMFAVerified = await checkMFAVerified(req, userId, mfaConfig);
    
    if (hasMFAVerified) {
      return next();
    }
    
    // For API routes, return 403 with specific error
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({
        error: 'MFA_REQUIRED',
        message: 'Multi-factor authentication required for this action',
        verifyUrl: mfaConfig.verifyUrl
      });
    }
    
    // For web routes, redirect to the MFA verification page
    return res.redirect(`${mfaConfig.verifyUrl}?returnTo=${encodeURIComponent(req.originalUrl)}`);
  };
}

/**
 * Check if the current route is protected by MFA
 */
function isProtectedRoute(req: Request, config: MFAConfig): boolean {
  const { path, method } = req;
  
  return config.protectedRoutes.some(route => {
    const pathMatches = typeof route.path === 'string' 
      ? path === route.path
      : route.path.test(path);
    
    // If methods are specified, check if the current method is included
    const methodMatches = !route.methods || route.methods.includes(method);
    
    return pathMatches && methodMatches;
  });
}

/**
 * Check if MFA is required for the user
 */
async function checkMFARequired(userId: string | number, userRole: string, config: MFAConfig): Promise<boolean> {
  // Check if user is in a role that requires MFA
  if (config.enforceForRoles && config.enforceForRoles.includes(userRole)) {
    return true;
  }
  
  // Check if user has MFA enabled
  const [mfaSettings] = await db
    .select()
    .from(userMfaSettings)
    .where(eq(userMfaSettings.userId, String(userId)));
  
  return mfaSettings?.enabled || false;
}

/**
 * Check if the current session has completed MFA verification
 */
async function checkMFAVerified(req: Request, userId: string | number, config: MFAConfig): Promise<boolean> {
  // Check MFA session in request
  if (req.session && 'mfaVerified' in req.session && 'mfaVerifiedAt' in req.session) {
    const now = Date.now();
    const verifiedAt = new Date(req.session.mfaVerifiedAt as string).getTime();
    
    // Check if the MFA session is still valid
    if (now - verifiedAt < (config.mfaSessionDuration || 28800000)) { // Use default of 8 hours if undefined
      return true;
    }
  }
  
  // Check for trusted device cookie
  if (config.allowTrustedDevices && req.cookies?.mfaTrustedDevice) {
    const deviceId = req.cookies.mfaTrustedDevice;
    const isVerified = await totpService.isDeviceVerified(String(userId), deviceId);
    
    if (isVerified) {
      // Update MFA session
      if (req.session) {
        (req.session as any).mfaVerified = true;
        (req.session as any).mfaVerifiedAt = new Date().toISOString();
      }
      return true;
    }
  }
  
  return false;
}

// Export the middleware with default config
export const mfaMiddleware = createMFAMiddleware();
export const MFAMiddleware = mfaMiddleware;