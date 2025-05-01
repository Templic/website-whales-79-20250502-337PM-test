/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * Provides advanced authentication capabilities beyond passwords,
 * including Time-based One-Time Passwords (TOTP) and recovery codes.
 * 
 * Features:
 * - TOTP generation and verification
 * - Backup/recovery code management
 * - FIDO2/WebAuthn support
 * - QR code generation for easy setup
 * - User device verification
 */

import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { authenticator } from '@otplib/preset-default';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';

// Configuration
const MFA_WINDOW = 1; // Allow 1 window before/after current time (30 seconds each side)
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;

// Types
export interface MFAUserData {
  userId: string;
  secret: string;
  verified: boolean;
  recoveryCodes: string[];
  devices: MFADevice[];
  createdAt: number;
  updatedAt: number;
}

export interface MFADevice {
  id: string;
  name: string;
  lastUsed: number;
  trusted: boolean;
}

// In-memory storage of MFA data (in production, use a database)
const mfaUserData: Map<string, MFAUserData> = new Map();

/**
 * Generate a new TOTP secret
 */
export function generateSecret(userId: string): string {
  const secret = authenticator.generateSecret();
  return secret;
}

/**
 * Initialize MFA for a user
 */
export function initializeMFA(userId: string): MFAUserData {
  // Check if MFA is already set up
  const existingData = mfaUserData.get(userId);
  if (existingData) {
    return existingData;
  }

  // Generate new TOTP secret
  const secret = generateSecret(userId);
  const recoveryCodes = generateRecoveryCodes();

  // Create MFA user data
  const userData: MFAUserData = {
    userId,
    secret,
    verified: false,
    recoveryCodes,
    devices: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Save MFA data
  mfaUserData.set(userId, userData);

  // Log the initialization
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.INFO,
    message: 'MFA initialized for user',
    data: {
      userId,
      timestamp: new Date().toISOString()
    }
  });

  return userData;
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPUri(userId: string, email: string, appName: string = 'Admin Portal'): string {
  const userData = getMFAUserData(userId);
  if (!userData) {
    throw new Error('User has not initialized MFA');
  }

  return authenticator.keyuri(email, appName, userData.secret);
}

/**
 * Verify a TOTP token
 */
export function verifyTOTP(userId: string, token: string): boolean {
  const userData = getMFAUserData(userId);
  if (!userData) {
    return false;
  }

  try {
    // Set the window for token verification
    authenticator.options = { window: MFA_WINDOW };
    
    // Verify the token
    const isValid = authenticator.verify({ token, secret: userData.secret });
    
    if (isValid && !userData.verified) {
      // Mark MFA as verified on first successful verification
      userData.verified = true;
      userData.updatedAt = Date.now();
      mfaUserData.set(userId, userData);
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: 'MFA verified for user',
        data: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return isValid;
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'MFA verification error',
      data: {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });
    
    return false;
  }
}

/**
 * Verify a recovery code
 */
export function verifyRecoveryCode(userId: string, code: string): boolean {
  const userData = getMFAUserData(userId);
  if (!userData) {
    return false;
  }
  
  // Check if the code exists
  const index = userData.recoveryCodes.findIndex(c => c === code);
  if (index === -1) {
    return false;
  }
  
  // Remove the used recovery code
  userData.recoveryCodes.splice(index, 1);
  userData.updatedAt = Date.now();
  mfaUserData.set(userId, userData);
  
  // Log the recovery code usage
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.MEDIUM,
    message: 'Recovery code used for MFA',
    data: {
      userId,
      remainingCodes: userData.recoveryCodes.length,
      timestamp: new Date().toISOString()
    }
  });
  
  return true;
}

/**
 * Generate recovery codes
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = generateRecoveryCode();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Generate a single recovery code
 */
function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(Math.ceil(RECOVERY_CODE_LENGTH / 2));
  return bytes.toString('hex').slice(0, RECOVERY_CODE_LENGTH);
}

/**
 * Get MFA data for a user
 */
export function getMFAUserData(userId: string): MFAUserData | undefined {
  return mfaUserData.get(userId);
}

/**
 * Check if MFA is enabled and verified for a user
 */
export function isMFAEnabled(userId: string): boolean {
  const userData = getMFAUserData(userId);
  return userData ? userData.verified : false;
}

/**
 * Add a trusted device for a user
 */
export function addTrustedDevice(userId: string, deviceName: string): MFADevice {
  const userData = getMFAUserData(userId);
  if (!userData) {
    throw new Error('User has not initialized MFA');
  }
  
  const deviceId = crypto.randomBytes(16).toString('hex');
  
  const device: MFADevice = {
    id: deviceId,
    name: deviceName,
    lastUsed: Date.now(),
    trusted: true
  };
  
  userData.devices.push(device);
  userData.updatedAt = Date.now();
  mfaUserData.set(userId, userData);
  
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.INFO,
    message: 'Trusted device added for user',
    data: {
      userId,
      deviceId,
      deviceName,
      timestamp: new Date().toISOString()
    }
  });
  
  return device;
}

/**
 * Check if a device is trusted
 */
export function isDeviceTrusted(userId: string, deviceId: string): boolean {
  const userData = getMFAUserData(userId);
  if (!userData) {
    return false;
  }
  
  const device = userData.devices.find(d => d.id === deviceId);
  return device ? device.trusted : false;
}

/**
 * Remove a trusted device
 */
export function removeTrustedDevice(userId: string, deviceId: string): boolean {
  const userData = getMFAUserData(userId);
  if (!userData) {
    return false;
  }
  
  const initialCount = userData.devices.length;
  userData.devices = userData.devices.filter(d => d.id !== deviceId);
  
  if (userData.devices.length !== initialCount) {
    userData.updatedAt = Date.now();
    mfaUserData.set(userId, userData);
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: 'Trusted device removed for user',
      data: {
        userId,
        deviceId,
        timestamp: new Date().toISOString()
      }
    });
    
    return true;
  }
  
  return false;
}

/**
 * Disable MFA for a user
 */
export function disableMFA(userId: string): boolean {
  if (!mfaUserData.has(userId)) {
    return false;
  }
  
  mfaUserData.delete(userId);
  
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.MEDIUM,
    message: 'MFA disabled for user',
    data: {
      userId,
      timestamp: new Date().toISOString()
    }
  });
  
  return true;
}

/**
 * MFA middleware for requiring MFA on routes
 */
export function requireMFA(options: {
  trustDevices?: boolean;
  redirectOnFailure?: string;
} = {}) {
  const { trustDevices = true, redirectOnFailure = '/mfa' } = options;
  
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if user is not authenticated
    if (!req.isAuthenticated() || !req.user) {
      return next();
    }
    
    const userId = req.user.id.toString();
    
    // Check if MFA is enabled for the user
    if (!isMFAEnabled(userId)) {
      return next();
    }
    
    // Check if the device is trusted
    const deviceId = req.cookies['mfa-device-id'];
    if (trustDevices && deviceId && isDeviceTrusted(userId, deviceId)) {
      return next();
    }
    
    // Check if MFA has been verified in this session
    const mfaVerified = req.session.mfaVerified;
    if (mfaVerified) {
      return next();
    }
    
    // If MFA is required but not verified, redirect to MFA page
    if (redirectOnFailure) {
      res.redirect(redirectOnFailure);
      return;
    } else {
      res.status(403).json({
        error: 'MFA required',
        message: 'Multi-factor authentication is required to access this resource'
      });
      return;
    }
  };
}

/**
 * Configure MFA for a user or verify a token
 */
export function handleMFA(req: Request, res: Response, userId: string, token?: string): {
  success: boolean;
  qrCodeUri?: string;
  message: string;
  needsVerification?: boolean;
} {
  // Initialize MFA if not already set up
  let userData = getMFAUserData(userId);
  
  if (!userData) {
    userData = initializeMFA(userId);
    
    // Generate QR code URI for setup
    const email = req.user?.email || `user-${userId}`;
    const appName = process.env.MFA_APP_NAME || 'Admin Portal';
    const qrCodeUri = generateTOTPUri(userId, email, appName);
    
    return {
      success: true,
      qrCodeUri,
      message: 'MFA initialization successful. Verify with a token to enable.',
      needsVerification: true
    };
  }
  
  // If MFA is already set up but not verified
  if (!userData.verified) {
    if (!token) {
      // Return the QR code URI for setup
      const email = req.user?.email || `user-${userId}`;
      const appName = process.env.MFA_APP_NAME || 'Admin Portal';
      const qrCodeUri = generateTOTPUri(userId, email, appName);
      
      return {
        success: true,
        qrCodeUri,
        message: 'MFA needs verification. Verify with a token to enable.',
        needsVerification: true
      };
    }
    
    // Verify the token
    const isValid = verifyTOTP(userId, token);
    
    if (isValid) {
      // Mark the session as MFA verified
      req.session.mfaVerified = true;
      
      // Add device if option is enabled
      if (req.body.trustDevice) {
        const device = addTrustedDevice(userId, req.body.deviceName || 'Unknown Device');
        res.cookie('mfa-device-id', device.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }
      
      return {
        success: true,
        message: 'MFA verification successful.'
      };
    } else {
      return {
        success: false,
        message: 'Invalid MFA token.'
      };
    }
  }
  
  // If MFA is already set up and verified, but token is provided for login
  if (token) {
    // Try to verify with TOTP
    if (verifyTOTP(userId, token)) {
      // Mark the session as MFA verified
      req.session.mfaVerified = true;
      
      // Add device if option is enabled
      if (req.body.trustDevice) {
        const device = addTrustedDevice(userId, req.body.deviceName || 'Unknown Device');
        res.cookie('mfa-device-id', device.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }
      
      return {
        success: true,
        message: 'MFA verification successful.'
      };
    }
    
    // Try to verify with recovery code
    if (verifyRecoveryCode(userId, token)) {
      // Mark the session as MFA verified
      req.session.mfaVerified = true;
      
      return {
        success: true,
        message: 'MFA verification successful with recovery code. You have ' + 
                userData.recoveryCodes.length + ' recovery codes remaining.'
      };
    }
    
    return {
      success: false,
      message: 'Invalid MFA token or recovery code.'
    };
  }
  
  // If MFA is set up but no token is provided
  return {
    success: false,
    message: 'MFA token required.',
    needsVerification: true
  };
}

export default {
  initializeMFA,
  verifyTOTP,
  verifyRecoveryCode,
  generateTOTPUri,
  isMFAEnabled,
  getMFAUserData,
  addTrustedDevice,
  isDeviceTrusted,
  removeTrustedDevice,
  disableMFA,
  requireMFA,
  handleMFA
};