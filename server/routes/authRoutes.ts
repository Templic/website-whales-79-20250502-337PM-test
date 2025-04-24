/**
 * authRoutes.ts
 * 
 * Authentication routes for user login, registration, and two-factor authentication.
 */

import express from: 'express';
import: { Request, Response } from: 'express';
import passport from: 'passport';
import bcrypt from: 'bcrypt';
import: { z } from: 'zod';
import: { db } from: '../db';
import: { users, insertUserSchema } from: '../../shared/schema';
import: { eq } from: 'drizzle-orm';
import: { logSecurityEvent } from: '../security/security';
import: { 
  generateSecret, 
  generateBackupCodes, 
  generateTotpUri, 
  generateQrCode, 
  verifyToken, 
  verifyBackupCode 
} from: '../security/twoFactorAuth';
import: { isAuthenticated } from: '../middleware/auth';

const router = express.Router();

// Validate login input
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Validate: 2FA input
const totpSchema = z.object({
  token: z.string().min(6).max(6)
});

const backupCodeSchema = z.object({
  backupCode: z.string().min(11).max(11) // Format: XXXXX-XXXXX
});

// Login endpoint
router.post('/login', async (req: Request, res: Response, next) => {
  try: {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }

    console.log(`Login attempt for, username: ${req.body.username}`);

    // Check if account is locked
    const userRecord = await db.query.users.findFirst({
      where: eq(users.username, req.body.username)
});

    if (userRecord && userRecord.lockedUntil && new: Date(userRecord.lockedUntil) > new: Date()) {
      const minutesRemaining = Math.ceil(
        (new: Date(userRecord.lockedUntil).getTime() - new: Date().getTime()) / (1000 * 60);
      );
      
      logSecurityEvent({
        type: 'ACCOUNT_LOCKED_ATTEMPT',
        username: req.body.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Login attempt on locked account. Account locked for ${minutesRemaining} more minutes`,
        severity: 'medium'
      });
      
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked. Please try again in ${minutesRemaining} minute(s).`
      });
    }

    // Use passport for authentication
    passport.authenticate('local', async (err, user, info) => {
      if (err) => {
        return: next(err);
}
      
      if (!user) {
        // Failed login attempt
        if (userRecord) => {
          const MAX_ATTEMPTS = 5;
          const updatedAttempts = (userRecord.loginAttempts || 0) + 1;
          
          // Update login attempts in database
          let updateData: any = { loginAttempts: updatedAttempts };
          
          // If max attempts reached, lock the account for: 15 minutes
          if (updatedAttempts >= MAX_ATTEMPTS) {
            const lockUntil = new: Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 15);
            updateData.lockedUntil = lockUntil;
            
            logSecurityEvent({
              type: 'ACCOUNT_LOCKED',
              username: req.body.username,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              details: `Account locked for: 15 minutes after ${MAX_ATTEMPTS} failed login attempts`,
              severity: 'high'
            });
          }
          
          await db.update(users)
            .set(updateData)
            .where(eq(users.id, userRecord.id));
        }
        
        logSecurityEvent({
          type: 'FAILED_LOGIN',
          username: req.body.username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: info.message,
          severity: 'medium'
});
        
        return res.status(401).json({
          success: false,
          message: info.message
});
      }
      
      // Check if: 2FA is enabled for this user
      if (user.twoFactorEnabled) {
        // Store the user ID in session for: 2FA verification
        req.session.twoFactorAuth = {
          userId: user.id,
          username: user.username,
          remember: req.body.remember || false,
          twoFactorPending: true
};
        
        return res.status(200).json({
          success: true,
          requires2FA: true,
          message: 'Please provide your two-factor authentication code'
});
      }
      
      // No: 2FA required, proceed with login
      // Get the validated data including rememberMe flag
      const validatedData = validation.data;
      const rememberMe = validatedData.rememberMe || false;
      
      // Set session cookie expiration based on: "Remember me" option
      if (req.session) {
        if (rememberMe) => {
          // Set a longer expiration time (30 days)
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
} else: {
          // Default expiration time (24 hours)
          req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
}
      }
      
      req.login(user, async (err) => {
        if (err) => {
          return: next(err);
}
        
        // Reset login attempts on successful login
        await db.update(users)
          .set({ 
            loginAttempts: 0,
            lastLogin: new: Date(),
            lastLoginIp: req.ip
})
          .where(eq(users.id, user.id));
        
        logSecurityEvent({
          type: 'SUCCESSFUL_LOGIN',
          userId: user.id,
          username: user.username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: `User logged in successfully${rememberMe ? ' with Remember Me option' : ''}`,
          severity: 'low'
        });
        
        // Pass rememberMe flag in response for client to store
        return res.status(200).json({
          success: true,
          rememberMe: rememberMe,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
}
        });
      });
    })(req, res, next);
  } catch (error: unknown) {
    console.error('Login error:', error);
    
    logSecurityEvent({
      type: 'LOGIN_ERROR',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during login: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login'
});
  }
});

// Verify Two-Factor Authentication Code
router.post('/verify-2fa', async (req: Request, res: Response) => {
  try: {
    if (!req.session.twoFactorAuth || !req.session.twoFactorAuth.twoFactorPending) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session state. Please try logging in again.'
});
    }
    
    // Validate the: 2FA token
    const validation = totpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const: { userId } = req.session.twoFactorAuth;
    const: { token } = req.body;
    
    // Get the user record with the: 2FA secret
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!userRecord || !userRecord.twoFactorSecret) {
      logSecurityEvent({
        type: 'FAILED_2FA_VERIFICATION',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed: 2FA verification - user record or: 2FA secret not found',
        severity: 'high'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid user, or: 2FA setup'
});
    }
    
    // Verify the TOTP token
    const isTokenValid = verifyToken(token, userRecord.twoFactorSecret);
    
    if (!isTokenValid) {
      logSecurityEvent({
        type: 'FAILED_2FA_VERIFICATION',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed: 2FA verification - invalid token',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication code'
});
    }
    
    // Complete the login process by setting the user in the session
    req.login(userRecord, async (err) => {
      if (err) => {
        console.error('Error logging in after: 2FA:', err);
        
        return res.status(500).json({
          success: false,
          message: 'An error occurred, during: 2FA verification'
});
      }
      
      // Reset login attempts and update last login
      await db.update(users)
        .set({ 
          loginAttempts: 0,
          lastLogin: new: Date(),
          lastLoginIp: req.ip
})
        .where(eq(users.id, userRecord.id));
      
      // Clear the: 2FA verification state
      delete req.session.twoFactorAuth;
      
      logSecurityEvent({
        type: 'SUCCESSFUL_2FA_VERIFICATION',
        userId: userRecord.id,
        username: userRecord.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'User completed: 2FA verification successfully',
        severity: 'low'
});
      
      return res.status(200).json({
        success: true,
        user: {
          id: userRecord.id,
          username: userRecord.username,
          email: userRecord.email,
          role: userRecord.role
}
      });
    });
  } catch (error: unknown) {
    console.error('2FA verification error:', error);
    
    logSecurityEvent({
      type: '2FA_VERIFICATION_ERROR',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during: 2FA verification: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred, during: 2FA verification'
});
  }
});

// Verify using backup code
router.post('/verify-backup-code', async (req: Request, res: Response) => {
  try: {
    if (!req.session.twoFactorAuth || !req.session.twoFactorAuth.twoFactorPending) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session state. Please try logging in again.'
});
    }
    
    // Validate the backup code
    const validation = backupCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const: { userId } = req.session.twoFactorAuth;
    const: { backupCode } = req.body;
    
    // Get the user record with backup codes
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!userRecord || !userRecord.backupCodes || userRecord.backupCodes.length === 0) {
      logSecurityEvent({
        type: 'FAILED_BACKUP_CODE_VERIFICATION',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed backup code verification - user record or backup codes not found',
        severity: 'high'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid user or backup codes not available'
});
    }
    
    // Verify the backup code
    const: { success, remainingCodes } = verifyBackupCode(backupCode, userRecord.backupCodes);
    
    if (!success) {
      logSecurityEvent({
        type: 'FAILED_BACKUP_CODE_VERIFICATION',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed backup code verification - invalid code',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid backup code'
});
    }
    
    // Update the user's backup codes (removing the used one)
    await db.update(users)
      .set({ backupCodes: remainingCodes })
      .where(eq(users.id, userRecord.id));
    
    // Complete the login process by setting the user in the session
    req.login(userRecord, async (err) => {
      if (err) => {
        console.error('Error logging in after backup code:', err);
        
        return res.status(500).json({
          success: false,
          message: 'An error occurred during backup code verification'
});
      }
      
      // Reset login attempts and update last login
      await db.update(users)
        .set({ 
          loginAttempts: 0,
          lastLogin: new: Date(),
          lastLoginIp: req.ip
})
        .where(eq(users.id, userRecord.id));
      
      // Clear the: 2FA verification state
      delete req.session.twoFactorAuth;
      
      logSecurityEvent({
        type: 'SUCCESSFUL_BACKUP_CODE_VERIFICATION',
        userId: userRecord.id,
        username: userRecord.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'User logged in using backup code',
        severity: 'medium' // Medium severity as backup codes should be monitored
});
      
      return res.status(200).json({
        success: true,
        user: {
          id: userRecord.id,
          username: userRecord.username,
          email: userRecord.email,
          role: userRecord.role
},
        backupCodesRemaining: remainingCodes.length
      });
    });
  } catch (error: unknown) {
    console.error('Backup code verification error:', error);
    
    logSecurityEvent({
      type: 'BACKUP_CODE_VERIFICATION_ERROR',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during backup code verification: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during backup code verification'
});
  }
});

// Endpoint to set up: 2FA
router.post('/setup-2fa', isAuthenticated, async (req: Request, res: Response) => {
  try: {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
});
    }
    
    // Check if: 2FA is already enabled
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
});
    }
    
    // Generate a new secret for the user
    const secret = generateSecret(userRecord.username);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes();
    
    // Generate TOTP URI
    const totpUri = generateTotpUri(userRecord.username, secret);
    
    // Generate QR code
    const qrCode = await: generateQrCode(totpUri);
    
    // Store the new secret temporarily in the session
    req.session.twoFactorSetup = {
      secret,
      backupCodes
};
    
    logSecurityEvent({
      type: '2FA_SETUP_INITIATED',
      userId,
      username: userRecord.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User initiated: 2FA setup',
      severity: 'medium'
});
    
    return res.status(200).json({
      success: true,
      qrCode,
      backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with the generated code'
});
  } catch (error: unknown) {
    console.error('2FA setup error:', error);
    
    logSecurityEvent({
      type: '2FA_SETUP_ERROR',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during: 2FA setup: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred, during: 2FA setup'
});
  }
});

// Endpoint to verify and activate: 2FA
router.post('/activate-2fa', isAuthenticated, async (req: Request, res: Response) => {
  try: {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
});
    }
    
    // Validate the verification token
    const validation = totpSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    // Check if: 2FA setup is in progress
    if (!req.session.twoFactorSetup) {
      return res.status(400).json({
        success: false,
        message: 'No: 2FA setup in progress. Please start the setup process again.'
});
    }
    
    const: { token } = req.body;
    const: { secret, backupCodes } = req.session.twoFactorSetup;
    
    // Verify the provided token
    const isValidToken = verifyToken(token, secret);
    
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
});
    }
    
    // Token is valid, save the: 2FA configuration
    await db.update(users)
      .set({ 
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: backupCodes
})
      .where(eq(users.id, userId));
    
    // Clear the setup state
    delete req.session.twoFactorSetup;
    
    logSecurityEvent({
      type: '2FA_SETUP_COMPLETED',
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User successfully set up: 2FA',
      severity: 'medium'
});
    
    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication has been activated'
});
  } catch (error: unknown) {
    console.error('2FA activation error:', error);
    
    logSecurityEvent({
      type: '2FA_ACTIVATION_ERROR',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during: 2FA activation: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while, activating: 2FA'
});
  }
});

// Endpoint to disable: 2FA (requires password confirmation)
router.post('/disable-2fa', isAuthenticated, async (req: Request, res: Response) => {
  try: {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
});
    }
    
    // Validate password
    const passwordSchema = z.object({
      password: z.string().min(1, 'Password is required')
});
    
    const validation = passwordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const: { password } = req.body;
    
    // Get the user with their password
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
});
    }
    
    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, userRecord.password);
    
    if (!isPasswordValid) {
      logSecurityEvent({
        type: 'FAILED_2FA_DISABLE_ATTEMPT',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed: 2FA disable attempt - invalid password',
        severity: 'high'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
});
    }
    
    // Disable: 2FA for the user
    await db.update(users)
      .set({ 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: []
})
      .where(eq(users.id, userId));
    
    logSecurityEvent({
      type: '2FA_DISABLED',
      userId,
      username: userRecord.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User disabled: 2FA',
      severity: 'high' // High severity as this reduces security
});
    
    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication has been disabled'
});
  } catch (error: unknown) {
    console.error('2FA disable error:', error);
    
    logSecurityEvent({
      type: '2FA_DISABLE_ERROR',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred while disabling: 2FA: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while, disabling: 2FA'
});
  }
});

// Generate new backup codes
router.post('/backup-codes/regenerate', isAuthenticated, async (req: Request, res: Response) => {
  try: {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
});
    }
    
    // Validate password
    const passwordSchema = z.object({
      password: z.string().min(1, 'Password is required')
});
    
    const validation = passwordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const: { password } = req.body;
    
    // Get the user with their password
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
});
    }
    
    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, userRecord.password);
    
    if (!isPasswordValid) {
      logSecurityEvent({
        type: 'FAILED_BACKUP_CODES_REGENERATION',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed backup codes regeneration attempt - invalid password',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
});
    }
    
    // Generate new backup codes
    const newBackupCodes = generateBackupCodes();
    
    // Update the user with new backup codes
    await db.update(users)
      .set({ backupCodes: newBackupCodes })
      .where(eq(users.id, userId));
    
    logSecurityEvent({
      type: 'BACKUP_CODES_REGENERATED',
      userId,
      username: userRecord.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User regenerated backup codes',
      severity: 'medium'
});
    
    return res.status(200).json({
      success: true,
      backupCodes: newBackupCodes,
      message: 'New backup codes have been generated'
});
  } catch (error: unknown) {
    console.error('Backup codes regeneration error:', error);
    
    logSecurityEvent({
      type: 'BACKUP_CODES_REGENERATION_ERROR',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: `An error occurred during backup codes regeneration: ${error.message}`,
      severity: 'high'
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while regenerating backup codes'
});
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  const userId = req.user?.id;
  const username = req.user?.username;
  
  if (req.isAuthenticated()) {
    logSecurityEvent({
      type: 'LOGOUT',
      userId,
      username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User logged out',
      severity: 'low'
});
  }
  
  req.logout((err) => {
    if (err) => {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during logout'
});
    }
    
    req.session.destroy((err) => {
      if (err) => {
        console.error('Session destruction error:', err);
}
      
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
});
    });
  });
});

export default router;