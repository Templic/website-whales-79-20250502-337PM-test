/**
 * MFA Integration with Authentication Flow
 * 
 * This module integrates the MFA system with the user authentication flow,
 * managing MFA verification during login and account management.
 */

import { Request, Response, NextFunction } from 'express';
import { mfaManager, MFAType, MFAVerificationStatus } from '../security/mfa/MultifactorAuthentication';
import { logSecurityEvent } from '../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';
import { storage } from '../storage';

/**
 * MFA verification states during authentication
 */
enum MFAState {
  NOT_REQUIRED = 'not_required',    // MFA is not enabled for this user
  REQUIRED = 'required',            // MFA is required, but not yet verified
  VERIFIED = 'verified',            // MFA has been successfully verified
  FAILED = 'failed',                // MFA verification failed
  RECOVERY = 'recovery'             // User is using recovery method
}

/**
 * MFA verification metadata attached to session during authentication
 */
interface MFAVerificationMetadata {
  state: MFAState;
  userId: number | string;
  method?: MFAType;
  verifiedAt?: Date;
  attempts?: number;
  cooldownUntil?: Date;
  recoveryUsed?: boolean;
}

/**
 * Extend Express session to include MFA data
 */
declare module 'express-session' {
  interface SessionData {
    mfa?: MFAVerificationMetadata;
  }
}

/**
 * Check if MFA is required for a user
 */
export async function isMFARequired(userId: number | string): Promise<boolean> {
  try {
    // In a real application, this would check the database to see if MFA is enabled
    // For now, we'll assume MFA is required for all users with IDs > 10 (for example)
    return true; // Require MFA for all users in this example
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error checking MFA requirement for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    // Default to requiring MFA if we can't check (fail secure)
    return true;
  }
}

/**
 * Get the MFA methods enabled for a user
 */
export async function getUserMFAMethods(userId: number | string): Promise<MFAType[]> {
  try {
    // In a real application, this would fetch the user's enabled MFA methods from the database
    // For now, we'll return dummy data
    return [MFAType.TOTP, MFAType.RECOVERY]; // Example: user has TOTP and recovery codes enabled
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error fetching MFA methods for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    // Return empty array if we can't fetch the methods
    return [];
  }
}

/**
 * Initialize MFA verification for a user during login
 */
export function initializeMFAVerification(req: Request, userId: number | string): void {
  // Set the MFA state in the session
  req.session.mfa = {
    state: MFAState.REQUIRED,
    userId,
    attempts: 0
  };
  
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.INFO,
    message: `MFA verification initialized for user ${userId}`,
    data: { userId, sessionId: req.sessionID }
  });
}

/**
 * Middleware to ensure MFA is verified before accessing protected routes
 */
export function requireMFAVerification(redirectUrl: string = '/auth/mfa') {
  return (req: Request, res: Response, next: NextFunction) => {
    // If user is not authenticated, the normal authentication middleware will handle redirection
    if (!req.isAuthenticated()) {
      return next();
    }
    
    // Check if MFA is verified
    const mfaData = req.session.mfa;
    
    if (!mfaData || mfaData.state !== MFAState.VERIFIED) {
      // Redirect to MFA verification page
      return res.redirect(redirectUrl);
    }
    
    // MFA is verified, continue
    next();
  };
}

/**
 * Generate challenge for MFA verification
 */
export async function generateMFAChallenge(
  req: Request,
  res: Response,
  method: MFAType
): Promise<boolean> {
  const userId = req.session.mfa?.userId;
  
  if (!userId) {
    return false;
  }
  
  try {
    switch (method) {
      case MFAType.EMAIL:
        const user = await storage.getUser(userId);
        if (!user || !user.email) {
          throw new Error('User email not found');
        }
        
        // Generate and send email verification code
        const emailCode = await mfaManager.generateEmailCode(userId, user.email);
        
        // In a real application, this code would be sent via email
        // For testing, we'll store it in the session temporarily (insecure, just for demo)
        req.session.emailCode = emailCode;
        
        req.session.mfa = {
          ...req.session.mfa,
          method: MFAType.EMAIL
        };
        
        return true;
        
      case MFAType.SMS:
        const userForSMS = await storage.getUser(userId);
        if (!userForSMS || !userForSMS.phoneNumber) {
          throw new Error('User phone number not found');
        }
        
        // Generate and send SMS verification code
        const smsCode = await mfaManager.generateSMSCode(userId, userForSMS.phoneNumber);
        
        // In a real application, this code would be sent via SMS
        // For testing, we'll store it in the session temporarily (insecure, just for demo)
        req.session.smsCode = smsCode;
        
        req.session.mfa = {
          ...req.session.mfa,
          method: MFAType.SMS
        };
        
        return true;
        
      case MFAType.TOTP:
        // TOTP doesn't need server-side challenge generation
        req.session.mfa = {
          ...req.session.mfa,
          method: MFAType.TOTP
        };
        
        return true;
        
      case MFAType.RECOVERY:
        // Recovery doesn't need server-side challenge generation
        req.session.mfa = {
          ...req.session.mfa,
          method: MFAType.RECOVERY,
          state: MFAState.RECOVERY
        };
        
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error generating MFA challenge for user ${userId} with method ${method}`,
      data: { error: (error as Error).message, userId, method }
    });
    
    return false;
  }
}

/**
 * Verify MFA response
 */
export async function verifyMFAResponse(
  req: Request,
  res: Response,
  response: string
): Promise<boolean> {
  const mfaData = req.session.mfa;
  
  if (!mfaData || !mfaData.userId || !mfaData.method) {
    return false;
  }
  
  const userId = mfaData.userId;
  const method = mfaData.method;
  
  // Check cooldown
  if (mfaData.cooldownUntil && new Date() < mfaData.cooldownUntil) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: `MFA verification attempt during cooldown period for user ${userId}`,
      data: { userId, method, sessionId: req.sessionID }
    });
    
    return false;
  }
  
  try {
    let verificationResult = false;
    
    switch (method) {
      case MFAType.EMAIL:
        // Verify email code (using session-stored code for demo)
        if (req.session.emailCode === response) {
          verificationResult = true;
          delete req.session.emailCode;
        }
        break;
        
      case MFAType.SMS:
        // Verify SMS code (using session-stored code for demo)
        if (req.session.smsCode === response) {
          verificationResult = true;
          delete req.session.smsCode;
        }
        break;
        
      case MFAType.TOTP:
        // In a real application, this would retrieve the user's TOTP secret from the database
        // For testing, we'll use a dummy secret
        const totpSecret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
        const status = await mfaManager.verifyTOTP(userId, response, totpSecret);
        verificationResult = (status === MFAVerificationStatus.SUCCESS);
        break;
        
      case MFAType.RECOVERY:
        // In a real application, this would verify against saved recovery codes
        // For testing, we'll accept a special recovery code
        verificationResult = (response === 'AAAA-BBBB-CCCC-DDDD');
        break;
      
      default:
        verificationResult = false;
    }
    
    if (verificationResult) {
      // Update MFA state to verified
      req.session.mfa = {
        ...mfaData,
        state: MFAState.VERIFIED,
        verifiedAt: new Date(),
        attempts: 0
      };
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `MFA verification successful for user ${userId} using ${method}`,
        data: { userId, method, sessionId: req.sessionID }
      });
      
      return true;
    } else {
      // Increment failed attempts
      const attempts = (mfaData.attempts || 0) + 1;
      
      // Apply cooldown after 3 failed attempts
      let cooldownUntil = undefined;
      if (attempts >= 3) {
        cooldownUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minute cooldown
      }
      
      // Update MFA state
      req.session.mfa = {
        ...mfaData,
        state: MFAState.FAILED,
        attempts,
        cooldownUntil
      };
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `MFA verification failed for user ${userId} using ${method}`,
        data: { userId, method, attempts, sessionId: req.sessionID }
      });
      
      return false;
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during MFA verification for user ${userId} with method ${method}`,
      data: { error: (error as Error).message, userId, method }
    });
    
    return false;
  }
}

/**
 * Complete MFA setup for a user
 */
export async function completeMFASetup(
  userId: number | string,
  method: MFAType,
  secret?: string,
  recoveryCodes?: string[]
): Promise<boolean> {
  try {
    // In a real application, this would store the MFA configuration in the database
    // For this example, we'll just log the setup completion
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `MFA setup completed for user ${userId} using ${method}`,
      data: { userId, method, hasRecoveryCodes: !!recoveryCodes }
    });
    
    return true;
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error completing MFA setup for user ${userId} with method ${method}`,
      data: { error: (error as Error).message, userId, method }
    });
    
    return false;
  }
}

/**
 * Middleware to enforce MFA setup for users who don't have it enabled
 */
export function requireMFASetup(setupUrl: string = '/auth/setup-mfa') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    
    const user = req.user as any;
    if (!user || !user.id) {
      return next();
    }
    
    try {
      // Check if MFA is required but not set up
      const required = await isMFARequired(user.id);
      const methods = await getUserMFAMethods(user.id);
      
      if (required && methods.length === 0) {
        // User needs to set up MFA
        return res.redirect(setupUrl);
      }
      
      // MFA is either not required or already set up
      next();
    } catch (error) {
      // Log error but allow request to proceed to avoid blocking users
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Error checking MFA setup requirement for user ${user.id}`,
        data: { error: (error as Error).message, userId: user.id }
      });
      
      next();
    }
  };
}