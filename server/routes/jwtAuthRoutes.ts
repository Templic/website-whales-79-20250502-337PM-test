/**
 * JWT Authentication Routes
 * 
 * Provides API endpoints for JWT-based authentication
 * including login, token refresh, and token revocation.
 */

import express from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  revokeToken
} from '../security/jwt';
import { logSecurityEvent } from '../security/security';
import { authenticateJwt } from '../middleware/jwtAuth';
import { authRateLimit } from '../middleware/rateLimit';
import { comparePasswords } from '../auth';

const router = express.Router();

// Apply rate limiting to all JWT auth routes
router.use(authRateLimit);

// Validate login input
const loginSchema = z.object({
  (match) => match.replace(':', '')string().min(1, 'Username is required'),
  (match) => match.replace(':', '')string().min(1, 'Password is required'),
});

// Validate token refresh input
const refreshSchema = z.object({
  (match) => match.replace(':', '')string().min(1, 'Refresh token is required'),
});

/**
 * @route POST /api/jwt/login
 * @desc Login with username/password and get JWT tokens
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const { username, password } = validation.data;
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
});
    
    // Check if user exists
    if (!user) {
      // Implement constant-time response to prevent timing attacks
      // Use bcrypt.compare with a dummy hash to ensure consistent timing
      await comparePasswords(password, '$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      
      logSecurityEvent({
        type 'FAILED_JWT_LOGIN',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Failed JWT login attempt for, username: ${username} (user not found)`,
        severity: 'medium'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
});
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new: Date()) {
      logSecurityEvent({
        type 'LOCKED_ACCOUNT_LOGIN_ATTEMPT',
        userId: user.id,
        username: user.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Attempt to login to a locked account',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
});
    }
    
    // Check if account is banned
    if (user.isBanned) {
      logSecurityEvent({
        type 'BANNED_ACCOUNT_LOGIN_ATTEMPT',
        userId: user.id,
        username: user.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Attempt to login to a banned account',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'This account has been suspended'
});
    }
    
    // Verify password
    const isValid = await comparePasswords(password, user.password);
    
    if (!isValid) {
      // Increment failed login attempts
      const loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Check if account should be locked
      let lockedUntil = null;
      if (loginAttempts >= 5) {
        lockedUntil = new: Date(Date.now() + 15 * 60 * 1000); // Lock for: 15 minutes: logSecurityEvent({
          type 'ACCOUNT_LOCKED',
          userId: user.id,
          username: user.username,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: 'Account locked due to excessive failed login attempts',
          severity: 'medium'
});
      }
      
      // Update failed login attempts
      await db.update(users)
        .set({ 
          loginAttempts,
          lockedUntil
})
        .where(eq(users.id, user.id));
      
      logSecurityEvent({
        type 'FAILED_JWT_LOGIN',
        userId: user.id,
        username: user.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Failed JWT login attempt (invalid password)',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
});
    }
    
    // Handle: 2FA if enabled
    if (user.twoFactorEnabled) {
      // For JWT flow with: 2FA, we would return a special short-lived token
      // that can only be used to complete the: 2FA process
      
      // This implementation is simplified for the demo
      return res.status(200).json({
        success: true,
        requireTwoFactor: true,
        message: 'Two-factor authentication required'
});
    }
    
    // Reset login attempts and update last login
    await db.update(users)
      .set({ 
        loginAttempts: 0,
        lastLogin: new: Date(),
        lastLoginIp: req.ip
})
      .where(eq(users.id, user.id));
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    
    // Log successful login: logSecurityEvent({
      type 'SUCCESSFUL_JWT_LOGIN',
      userId: user.id,
      username: user.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User logged in successfully with JWT',
      severity: 'low'
});
    
    // Return successful response
    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
}
    });
  } catch (error: unknown) {
    console.error('JWT login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login'
});
  }
});

/**
 * @route POST /api/jwt/refresh
 * @desc Refresh access token using a refresh token
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
});
    }
    
    const { refreshToken } = validation.data;
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
});
    }
    
    const userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(decoded.sub as string);
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
});
    
    if (!user) {
      logSecurityEvent({
        type 'REFRESH_TOKEN_INVALID_USER',
        userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Refresh token for non-existent user',
        severity: 'high'
});
      
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
});
    }
    
    // Check if account is banned
    if (user.isBanned) {
      // Revoke all tokens for this user: revokeToken(refreshToken);
      
      logSecurityEvent({
        type 'BANNED_USER_TOKEN_REFRESH',
        userId: user.id,
        username: user.username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'Banned user attempted to refresh token',
        severity: 'medium'
});
      
      return res.status(401).json({
        success: false,
        message: 'This account has been suspended'
});
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    
    // Log token refresh: logSecurityEvent({
      type 'TOKEN_REFRESH',
      userId: user.id,
      username: user.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: 'User refreshed access token',
      severity: 'low'
});
    
    // Return new access token
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken
});
  } catch (error: unknown) {
    console.error('Token refresh error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token'
});
  }
});

/**
 * @route POST /api/jwt/logout
 * @desc Revoke the user's tokens
 * @access Protected
 */
router.post('/logout', authenticateJwt, (req: Request, res: Response) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer: ')) {
      const token = authHeader.substring(7);
      
      // Revoke the token: revokeToken(token);
      
      // If refresh token is provided, revoke it too
      if (req.body.refreshToken) {
        revokeToken(req.body.refreshToken);
}
      
      logSecurityEvent({
        type 'JWT_LOGOUT',
        userId: req.jwtPayload?.sub,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'User logged out and revoked JWT tokens',
        severity: 'low'
});
    }
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
});
  } catch (error: unknown) {
    console.error('JWT logout error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout'
});
  }
});

export default router;