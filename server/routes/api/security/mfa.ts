/**
 * MFA API Routes
 * 
 * This module provides API endpoints for multi-factor authentication
 * setup, verification, and management.
 */

import express from 'express';
import { mfaManager, MFAType, MFAVerificationStatus } from '../../../security/mfa/MultifactorAuthentication';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';
import { completeMFASetup } from '../../../auth/mfaIntegration';

// Create router
const router = express.Router();

/**
 * Get MFA status for the authenticated user
 * GET /api/security/mfa/status
 */
router.get('/status', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = (req.user as any).id;
  
  // In a real application, this would fetch the user's MFA status from the database
  
  res.json({
    enabled: true,
    methods: [MFAType.TOTP, MFAType.RECOVERY]
  });
});

/**
 * Generate TOTP setup
 * POST /api/security/mfa/totp/setup
 */
router.post('/totp/setup', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = (req.user as any).id;
  const username = (req.user as any).username || `user-${userId}`;
  
  try {
    // Generate TOTP secret and QR code
    const totpSetup = await mfaManager.generateTOTPSecret(userId, {
      issuer: 'SecureApp',
      label: username
    });
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `TOTP setup initiated for user ${userId}`,
      data: { userId, username }
    });
    
    res.json({
      secret: totpSetup.secret,
      qrCode: totpSetup.qrCode
    });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error setting up TOTP for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    res.status(500).json({ error: 'Failed to set up TOTP' });
  }
});

/**
 * Verify TOTP code during setup
 * POST /api/security/mfa/totp/verify
 */
router.post('/totp/verify', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = (req.user as any).id;
  const { token, secret } = req.body;
  
  if (!token || !secret) {
    return res.status(400).json({ error: 'Missing token or secret' });
  }
  
  try {
    // Verify the TOTP code
    const status = await mfaManager.verifyTOTP(userId, token, secret);
    
    if (status === MFAVerificationStatus.SUCCESS) {
      // TOTP verification successful, save the secret
      const success = await completeMFASetup(userId, MFAType.TOTP, secret);
      
      if (success) {
        // Generate recovery codes
        const recoveryCodes = mfaManager.generateRecoveryCodes();
        const hashedCodes = await mfaManager.hashRecoveryCodes(recoveryCodes);
        
        // Save recovery codes
        await completeMFASetup(userId, MFAType.RECOVERY, undefined, hashedCodes);
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.INFO,
          message: `TOTP verified and enabled for user ${userId}`,
          data: { userId }
        });
        
        // @ts-ignore - Response type issue
  return res.json({
          success: true,
          recoveryCodes
        });
      }
    }
    
    // Verification failed
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: `TOTP verification failed for user ${userId}`,
      data: { userId, status }
    });
    
    res.status(400).json({
      success: false,
      error: status === MFAVerificationStatus.THROTTLED
        ? 'Too many failed attempts. Please try again later.'
        : 'Invalid verification code. Please try again.'
    });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error verifying TOTP for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    res.status(500).json({ error: 'Failed to verify TOTP code' });
  }
});

/**
 * Generate recovery codes
 * POST /api/security/mfa/recovery/generate
 */
router.post('/recovery/generate', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = (req.user as any).id;
  
  try {
    // Generate recovery codes
    const recoveryCodes = mfaManager.generateRecoveryCodes();
    const hashedCodes = await mfaManager.hashRecoveryCodes(recoveryCodes);
    
    // Save recovery codes
    const success = await completeMFASetup(userId, MFAType.RECOVERY, undefined, hashedCodes);
    
    if (success) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Recovery codes generated for user ${userId}`,
        data: { userId, count: recoveryCodes.length }
      });
      
      // @ts-ignore - Response type issue
  return res.json({
        success: true,
        recoveryCodes
      });
    }
    
    res.status(500).json({ error: 'Failed to save recovery codes' });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error generating recovery codes for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    res.status(500).json({ error: 'Failed to generate recovery codes' });
  }
});

/**
 * Disable MFA
 * POST /api/security/mfa/disable
 */
router.post('/disable', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = (req.user as any).id;
  
  try {
    // In a real application, this would disable MFA for the user in the database
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: `MFA disabled for user ${userId}`,
      data: { userId }
    });
    
    res.json({ success: true });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error disabling MFA for user ${userId}`,
      data: { error: (error as Error).message, userId }
    });
    
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

export default router;