/**
 * MFA API Routes
 * 
 * This module provides API routes for managing multi-factor authentication,
 * including setup, verification, and authentication endpoints.
 */

import express from 'express';
import { mfaManager, MFAType, MFAVerificationStatus } from '../../../security/mfa/MultifactorAuthentication';
import { logSecurityEvent } from '../../../security/advanced/SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../../../security/advanced/SecurityFabric';

// Create an Express router for MFA routes
const router = express.Router();

/**
 * Get MFA status for a user
 * GET /api/security/mfa/status/:userId
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // In a real application, this would fetch the user's MFA settings from the database
    // For this demo, we'll return dummy data
    
    const mfaStatus = {
      enabled: false,
      methods: []
    };
    
    res.json(mfaStatus);
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error fetching MFA status for user ${req.params.userId}`,
      data: { error: (error as Error).message, userId: req.params.userId }
    });
    
    res.status(500).json({ message: 'Failed to fetch MFA status' });
  }
});

/**
 * Set up TOTP authentication
 * POST /api/security/mfa/totp/setup
 */
router.post('/totp/setup', async (req, res) => {
  try {
    const { userId, username } = req.body;
    
    // Generate TOTP secret and QR code
    const totpData = await mfaManager.generateTOTPSecret(userId, {
      issuer: 'SecureApp',
      label: username || `user-${userId}`
    });
    
    // In a real application, you would save the encrypted secret to the database
    // For this demo, we'll just return the data
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `TOTP setup initiated for user ${userId}`,
      data: { userId, username }
    });
    
    res.json({
      secret: totpData.secret,
      qrCode: totpData.qrCode
    });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during TOTP setup for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to set up TOTP' });
  }
});

/**
 * Verify TOTP setup
 * POST /api/security/mfa/totp/verify
 */
router.post('/totp/verify', async (req, res) => {
  try {
    const { userId, token, secret } = req.body;
    
    // Verify the TOTP code
    const status = await mfaManager.verifyTOTP(userId, token, secret);
    
    if (status === MFAVerificationStatus.SUCCESS) {
      // In a real application, you would update the user's MFA settings in the database
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `TOTP verification successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `TOTP verification failed for user ${userId}`,
        data: { userId, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid verification code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during TOTP verification for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to verify TOTP code' });
  }
});

/**
 * Authenticate using TOTP
 * POST /api/security/mfa/totp/authenticate
 */
router.post('/totp/authenticate', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // In a real application, you would fetch the user's TOTP secret from the database
    // For this demo, we'll use a dummy secret
    const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
    
    // Verify the TOTP code
    const status = await mfaManager.verifyTOTP(userId, token, secret);
    
    if (status === MFAVerificationStatus.SUCCESS) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `TOTP authentication successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `TOTP authentication failed for user ${userId}`,
        data: { userId, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid authentication code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during TOTP authentication for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to authenticate with TOTP' });
  }
});

/**
 * Set up email verification
 * POST /api/security/mfa/email/setup
 */
router.post('/email/setup', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    // Generate and send email verification code
    const code = await mfaManager.generateEmailCode(userId, email);
    
    // In a real application, you would send this code via email and save it to the database
    // For this demo, we'll just log it (this would be insecure in a real app)
    console.log(`[FOR TESTING ONLY] Email verification code for user ${userId}: ${code}`);
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `Email verification setup initiated for user ${userId}`,
      data: { userId, email }
    });
    
    // Store the verification code and expiration time (e.g., 10 minutes from now)
    // In a real application, you would store this in a database with the userId
    const expiration = new Date(Date.now() + 10 * 60 * 1000);
    
    res.json({ success: true });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during email verification setup for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId, email: req.body.email }
    });
    
    res.status(500).json({ message: 'Failed to set up email verification' });
  }
});

/**
 * Verify email verification setup
 * POST /api/security/mfa/email/verify
 */
router.post('/email/verify', async (req, res) => {
  try {
    const { userId, token, email } = req.body;
    
    // In a real application, you would fetch the stored code and expiration from the database
    // For this demo, we'll use a dummy code
    const expectedCode = '123456';
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Verify the code
    const status = mfaManager.verifyCode(
      userId,
      token,
      expectedCode,
      MFAType.EMAIL,
      expiration
    );
    
    if (status === MFAVerificationStatus.SUCCESS) {
      // In a real application, you would update the user's MFA settings in the database
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Email verification successful for user ${userId}`,
        data: { userId, email }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `Email verification failed for user ${userId}`,
        data: { userId, email, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.EXPIRED
          ? 'Verification code has expired. Please request a new code.'
          : status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid verification code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during email verification for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId, email: req.body.email }
    });
    
    res.status(500).json({ message: 'Failed to verify email code' });
  }
});

/**
 * Authenticate using email verification
 * POST /api/security/mfa/email/authenticate
 */
router.post('/email/authenticate', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // In a real application, you would fetch the stored code and expiration from the database
    // For this demo, we'll use a dummy code
    const expectedCode = '123456';
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Verify the code
    const status = mfaManager.verifyCode(
      userId,
      token,
      expectedCode,
      MFAType.EMAIL,
      expiration
    );
    
    if (status === MFAVerificationStatus.SUCCESS) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Email authentication successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `Email authentication failed for user ${userId}`,
        data: { userId, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.EXPIRED
          ? 'Verification code has expired. Please request a new code.'
          : status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid authentication code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during email authentication for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to authenticate with email' });
  }
});

/**
 * Set up SMS verification
 * POST /api/security/mfa/sms/setup
 */
router.post('/sms/setup', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    
    // Generate and send SMS verification code
    const code = await mfaManager.generateSMSCode(userId, phoneNumber);
    
    // In a real application, you would send this code via SMS and save it to the database
    // For this demo, we'll just log it (this would be insecure in a real app)
    console.log(`[FOR TESTING ONLY] SMS verification code for user ${userId}: ${code}`);
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `SMS verification setup initiated for user ${userId}`,
      data: { userId, phoneNumber }
    });
    
    // Store the verification code and expiration time (e.g., 10 minutes from now)
    // In a real application, you would store this in a database with the userId
    const expiration = new Date(Date.now() + 10 * 60 * 1000);
    
    res.json({ success: true });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during SMS verification setup for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId, phoneNumber: req.body.phoneNumber }
    });
    
    res.status(500).json({ message: 'Failed to set up SMS verification' });
  }
});

/**
 * Verify SMS verification setup
 * POST /api/security/mfa/sms/verify
 */
router.post('/sms/verify', async (req, res) => {
  try {
    const { userId, token, phoneNumber } = req.body;
    
    // In a real application, you would fetch the stored code and expiration from the database
    // For this demo, we'll use a dummy code
    const expectedCode = '123456';
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Verify the code
    const status = mfaManager.verifyCode(
      userId,
      token,
      expectedCode,
      MFAType.SMS,
      expiration
    );
    
    if (status === MFAVerificationStatus.SUCCESS) {
      // In a real application, you would update the user's MFA settings in the database
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `SMS verification successful for user ${userId}`,
        data: { userId, phoneNumber }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `SMS verification failed for user ${userId}`,
        data: { userId, phoneNumber, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.EXPIRED
          ? 'Verification code has expired. Please request a new code.'
          : status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid verification code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during SMS verification for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId, phoneNumber: req.body.phoneNumber }
    });
    
    res.status(500).json({ message: 'Failed to verify SMS code' });
  }
});

/**
 * Authenticate using SMS verification
 * POST /api/security/mfa/sms/authenticate
 */
router.post('/sms/authenticate', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // In a real application, you would fetch the stored code and expiration from the database
    // For this demo, we'll use a dummy code
    const expectedCode = '123456';
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    // Verify the code
    const status = mfaManager.verifyCode(
      userId,
      token,
      expectedCode,
      MFAType.SMS,
      expiration
    );
    
    if (status === MFAVerificationStatus.SUCCESS) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `SMS authentication successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `SMS authentication failed for user ${userId}`,
        data: { userId, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.EXPIRED
          ? 'Verification code has expired. Please request a new code.'
          : status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid authentication code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during SMS authentication for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to authenticate with SMS' });
  }
});

/**
 * Generate recovery codes
 * POST /api/security/mfa/recovery/generate
 */
router.post('/recovery/generate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Generate recovery codes
    const recoveryCodes = mfaManager.generateRecoveryCodes(10);
    
    // In a real application, you would hash these codes and save them to the database
    // For this demo, we'll just return them
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.INFO,
      message: `Recovery codes generated for user ${userId}`,
      data: { userId, count: recoveryCodes.length }
    });
    
    res.json({ recoveryCodes });
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error generating recovery codes for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to generate recovery codes' });
  }
});

/**
 * Authenticate using recovery code
 * POST /api/security/mfa/recovery/authenticate
 */
router.post('/recovery/authenticate', async (req, res) => {
  try {
    const { userId, recoveryCode } = req.body;
    
    // In a real application, you would fetch the user's hashed recovery codes from the database
    // For this demo, we'll generate some hashed codes for testing
    const testCodes = mfaManager.generateRecoveryCodes(10);
    const hashedCodes = await mfaManager.hashRecoveryCodes(testCodes);
    
    // For testing, we're allowing a hardcoded code to work
    if (recoveryCode === 'AAAA-BBBB-CCCC-DDDD') {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Recovery code authentication successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
      return;
    }
    
    // Verify the recovery code
    const status = await mfaManager.verifyRecoveryCode(
      userId,
      recoveryCode,
      hashedCodes
    );
    
    if (status === MFAVerificationStatus.SUCCESS) {
      // In a real application, you would mark this recovery code as used
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Recovery code authentication successful for user ${userId}`,
        data: { userId }
      });
      
      res.json({ success: true });
    } else {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.WARNING,
        message: `Recovery code authentication failed for user ${userId}`,
        data: { userId, status }
      });
      
      res.status(400).json({ 
        success: false, 
        message: status === MFAVerificationStatus.THROTTLED
          ? 'Too many failed attempts. Please try again later.'
          : 'Invalid recovery code. Please try again.'
      });
    }
  } catch (error) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.ERROR,
      message: `Error during recovery code authentication for user ${req.body.userId}`,
      data: { error: (error as Error).message, userId: req.body.userId }
    });
    
    res.status(500).json({ message: 'Failed to authenticate with recovery code' });
  }
});

export default router;