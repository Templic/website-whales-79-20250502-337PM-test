/**
 * directLogin.ts
 * 
 * This file adds a direct login endpoint at /api/auth/login that matches the client expectations.
 * It works in parallel with the regular auth routes but provides backward compatibility
 * for clients expecting a direct /api/auth/login endpoint.
 */

import express from 'express';
import { Request, Response } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logSecurityEvent } from '../security/security';
import { SecurityEventCategory, SecurityEventSeverity } from '../security/advanced/SecurityFabric';

// Constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const router = express.Router();

// Validate login input
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
});

// Compatibility layer for clients expecting a direct /api/auth/login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validation.error.errors
      });
    }

    console.log(`Login attempt for username: ${req.body.username}`);

    // Check if account is locked
    const userRecord = await db.query.users.findFirst({
      where: eq(users.username, req.body.username)
    });

    if (userRecord && userRecord.lockedUntil) {
      const lockedUntil = new Date(userRecord.lockedUntil);
      if (lockedUntil > new Date()) {
        // Account is still locked
        const remainingTime = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        
        // Log this security event
        logSecurityEvent({
          type: 'LOGIN_ATTEMPT_LOCKED_ACCOUNT',
          details: 'Login attempted on locked account',
          severity: 'medium',
          userId: userRecord?.id,
          username: req.body.username,
          remaining_lockout_minutes: remainingTime,
          ip: req.ip
        });
        
        return res.status(401).json({
          success: false,
          message: `Account is locked. Try again in ${remainingTime} minute(s).`,
          lockoutRemaining: remainingTime
        });
      }
    }

    // Authenticate with passport
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({
          success: false,
          message: 'An error occurred during authentication'
        });
      }

      if (!user) {
        // Failed login attempt
        if (userRecord) {
          // Increment login attempts
          const updatedAttempts = (userRecord.loginAttempts || 0) + 1;
          
          // Update login attempts in database
          let updateData: any = { loginAttempts: updatedAttempts };
          
          // Lock account if max attempts reached
          if (updatedAttempts >= MAX_ATTEMPTS) {
            const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            updateData.lockedUntil = lockedUntil;
            
            // Log this security event
            logSecurityEvent({
              type: 'ACCOUNT_LOCKED',
              details: 'Account locked due to too many failed login attempts',
              severity: 'high',
              userId: userRecord.id,
              username: req.body.username,
              attempts: updatedAttempts,
              lockout_duration_minutes: LOCKOUT_DURATION_MS / 60000,
              ip: req.ip
            });
          }
          
          await db.update(users)
            .set(updateData)
            .where(eq(users.id, userRecord.id));
          
          // Return different message if account is now locked
          if (updatedAttempts >= MAX_ATTEMPTS) {
            return res.status(401).json({
              success: false,
              message: `Account locked for 15 minutes after ${MAX_ATTEMPTS} failed login attempts`,
              locked: true
            });
          }
        }
        
        // Log this security event
        logSecurityEvent({
          type: 'LOGIN_FAILURE',
          details: 'Failed login attempt',
          severity: 'medium',
          username: req.body.username,
          reason: info?.message || 'Invalid credentials',
          ip: req.ip
        });
        
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid username or password'
        });
      }

      // No 2FA required, proceed with login
      req.login(user, async (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({
            success: false,
            message: 'An error occurred during login'
          });
        }
        
        // Reset login attempts on successful login
        await db.update(users)
          .set({ 
            loginAttempts: 0,
            lastLogin: new Date(),
            lockedUntil: null
          })
          .where(eq(users.id, user.id));
        
        // Log this security event
        logSecurityEvent({
          type: 'LOGIN_SUCCESS',
          details: 'Successful login',
          severity: 'low',
          userId: user.id,
          username: user.username,
          method: '2FA', 
          ip: req.ip
        });
        
        // Success response
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });
    })(req, res);
  } catch (error) {
    console.error('Login error:', error);
    
    // Log this security event
    logSecurityEvent({
      type: 'LOGIN_ERROR',
      details: `An error occurred during login: ${(error as Error).message}`,
      severity: 'high',
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

export default router;