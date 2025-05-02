/**
 * MFA Routes
 * 
 * API endpoints for managing Multi-Factor Authentication
 */

import express from 'express';
import { totpService } from '../security/advanced/auth/TOTPService';
import { z } from 'zod';
import { securityConfig } from '../security/advanced/config/SecurityConfig';

// Create router
const router = express.Router();

// Middleware to enforce authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Check if MFA is enabled globally
router.use((req, res, next) => {
  if (!securityConfig.getSecurityFeatures().mfa) {
    return res.status(404).json({ error: 'MFA is not enabled' });
  }
  next();
});

// Generate MFA setup for a user
router.post('/setup', requireAuth, async (req, res) => {
  try {
    const { username } = req.user;
    const { secret, uri, qrCodeUrl } = await totpService.generateSecret(req.user.id, username);
    
    res.json({
      secret,
      uri,
      qrCodeUrl
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

// Verify token and enable MFA
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(6).max(8)
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    
    const { token } = result.data;
    const isValid = await totpService.verifyToken(req.user.id, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Enable MFA for the user
    await totpService.enableMFA(req.user.id);
    
    // Set session as verified with MFA
    req.session.mfaVerified = true;
    req.session.mfaVerifiedAt = new Date().toISOString();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying MFA token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Verify with backup code
router.post('/verify-backup', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      code: z.string().min(10).max(15) // Format: xxxx-xxxx-xxxx
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid backup code format' });
    }
    
    const { code } = result.data;
    const isValid = await totpService.verifyBackupCode(req.user.id, code);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid backup code' });
    }
    
    // Set session as verified with MFA
    req.session.mfaVerified = true;
    req.session.mfaVerifiedAt = new Date().toISOString();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error verifying backup code:', error);
    res.status(500).json({ error: 'Failed to verify backup code' });
  }
});

// Register trusted device
router.post('/trust-device', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      deviceName: z.string().min(1).max(50)
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid device name' });
    }
    
    // Verify that MFA is already verified in this session
    if (!req.session.mfaVerified) {
      return res.status(403).json({ error: 'MFA verification required first' });
    }
    
    const { deviceName } = result.data;
    const deviceId = await totpService.registerVerifiedDevice(
      req.user.id,
      deviceName,
      req.headers['user-agent'],
      req.ip
    );
    
    // Set cookie for the trusted device
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
    };
    
    res.cookie('mfaTrustedDevice', deviceId, cookieOptions);
    
    res.json({ success: true, deviceId });
  } catch (error) {
    console.error('Error registering trusted device:', error);
    res.status(500).json({ error: 'Failed to register trusted device' });
  }
});

// Get list of trusted devices
router.get('/trusted-devices', requireAuth, async (req, res) => {
  try {
    const status = await totpService.getMFAStatus(req.user.id);
    
    // Get specific MFA settings to retrieve device list
    const settings = await totpService.getUserSettings(req.user.id);
    
    if (!settings || !settings.verifiedDevices) {
      return res.json({ devices: [] });
    }
    
    // Don't return sensitive info like IP addresses to client
    const devices = settings.verifiedDevices.map(device => ({
      id: device.id,
      name: device.name,
      lastUsed: device.lastUsed
    }));
    
    res.json({ devices });
  } catch (error) {
    console.error('Error getting trusted devices:', error);
    res.status(500).json({ error: 'Failed to get trusted devices' });
  }
});

// Remove trusted device
router.delete('/trusted-devices/:deviceId', requireAuth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Only allow removing own devices
    const success = await totpService.removeVerifiedDevice(req.user.id, deviceId);
    
    if (!success) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // If removing the current device, clear the cookie
    if (req.cookies.mfaTrustedDevice === deviceId) {
      res.clearCookie('mfaTrustedDevice');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing trusted device:', error);
    res.status(500).json({ error: 'Failed to remove trusted device' });
  }
});

// Disable MFA
router.post('/disable', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(6).max(8),
      confirmDisable: z.boolean().refine(val => val === true, {
        message: 'You must confirm disabling MFA'
      })
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.format() });
    }
    
    const { token } = result.data;
    
    // Verify token before disabling
    const isValid = await totpService.verifyToken(req.user.id, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Disable MFA
    await totpService.disableMFA(req.user.id);
    
    // Clear MFA session
    req.session.mfaVerified = false;
    delete req.session.mfaVerifiedAt;
    
    // Clear trusted device
    res.clearCookie('mfaTrustedDevice');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// Get user's MFA status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await totpService.getMFAStatus(req.user.id);
    res.json(status);
  } catch (error) {
    console.error('Error getting MFA status:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

// Regenerate backup codes
router.post('/regenerate-backup-codes', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(6).max(8),
    });
    
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    const { token } = result.data;
    
    // Verify token before regenerating backup codes
    const isValid = await totpService.verifyToken(req.user.id, token);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Regenerate backup codes
    const backupCodes = await totpService.regenerateBackupCodes(req.user.id);
    
    res.json({ success: true, backupCodes });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: 'Failed to regenerate backup codes' });
  }
});

export default router;