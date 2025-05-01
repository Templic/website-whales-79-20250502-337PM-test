/**
 * Advanced Account Lockout Service
 * 
 * Provides comprehensive account lockout functionality to protect
 * against brute force attacks and unauthorized access attempts.
 * 
 * Features:
 * - Failed login attempt tracking
 * - Account lockout with configurable thresholds
 * - Progressive lockout severity
 * - Notification of account lockouts
 * - Audit logging of lockout events
 */

import { Request, Response, NextFunction } from 'express';
import { authSettings } from '../../../utils/auth-config';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Define types for better type safety
interface LockoutRecord {
  userId: string;
  attempts: number;
  lockUntil: number | null;
  lastAttempt: number;
  progressiveLockoutLevel: number;
}

// In-memory storage for failed login attempts - in production, use a database
const failedLoginAttempts: Map<string, LockoutRecord> = new Map();

/**
 * Calculate progressive lockout duration based on lockout level
 */
function calculateLockoutDuration(level: number): number {
  const baseDuration = authSettings.lockoutDuration;
  // Exponential increase in lockout duration for repeat offenders
  return baseDuration * Math.pow(2, level);
}

/**
 * Reset failed login attempts for a user
 */
export function resetFailedLoginAttempts(userId: string): void {
  failedLoginAttempts.delete(userId);
  
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.INFO,
    message: 'Login attempts reset',
    data: { userId }
  });
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(userId: string, req: Request): void {
  const now = Date.now();
  const record = failedLoginAttempts.get(userId) || {
    userId,
    attempts: 0,
    lockUntil: null,
    lastAttempt: now,
    progressiveLockoutLevel: 0
  };
  
  // Update the record
  record.attempts += 1;
  record.lastAttempt = now;
  
  // Check if we should lock the account
  if (record.attempts >= authSettings.maxLoginAttempts) {
    record.progressiveLockoutLevel += 1;
    record.lockUntil = now + calculateLockoutDuration(record.progressiveLockoutLevel);
    
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: 'Account locked due to too many failed login attempts',
      data: {
        userId,
        attempts: record.attempts,
        lockoutDurationMs: calculateLockoutDuration(record.progressiveLockoutLevel),
        unlockTime: new Date(record.lockUntil).toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  } else {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.LOW,
      message: 'Failed login attempt',
      data: {
        userId,
        attempts: record.attempts,
        remainingAttempts: authSettings.maxLoginAttempts - record.attempts,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  }
  
  // Save the updated record
  failedLoginAttempts.set(userId, record);
}

/**
 * Check if an account is locked
 */
export function isAccountLocked(userId: string): boolean {
  const record = failedLoginAttempts.get(userId);
  if (!record) return false;
  
  // Check if the account is locked and the lockout period hasn't expired
  if (record.lockUntil && record.lockUntil > Date.now()) {
    return true;
  }
  
  // If the lockout period has expired, reset the attempts but maintain the progressive level
  if (record.lockUntil && record.lockUntil <= Date.now()) {
    record.attempts = 0;
    record.lockUntil = null;
    failedLoginAttempts.set(userId, record);
    return false;
  }
  
  return false;
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime(userId: string): number {
  const record = failedLoginAttempts.get(userId);
  if (!record || !record.lockUntil) return 0;
  
  const remainingMs = Math.max(0, record.lockUntil - Date.now());
  return Math.ceil(remainingMs / 1000);
}

/**
 * Account lockout middleware
 */
export function accountLockoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only check on login attempts
  if (req.path !== '/api/login' && req.path !== '/api/auth/login' && req.method !== 'POST') {
    return next();
  }
  
  const userId = req.body.username || req.body.email || '';
  if (!userId) {
    return next();
  }
  
  // Check if the account is locked
  if (isAccountLocked(userId)) {
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.WARNING,
      message: 'Login attempt on locked account',
      data: {
        userId,
        remainingLockoutSeconds: getRemainingLockoutTime(userId),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
    
    // Return error with lockout information
    return res.status(403).json({
      error: 'Account locked',
      message: 'Too many failed login attempts. Please try again later.',
      remainingLockoutSeconds: getRemainingLockoutTime(userId)
    });
  }
  
  next();
}

/**
 * On successful login handler - reset failed attempts
 */
export function onSuccessfulLogin(userId: string): void {
  resetFailedLoginAttempts(userId);
}

/**
 * Manual account unlock function (for admin use)
 */
export function unlockAccount(userId: string, adminId: string): void {
  resetFailedLoginAttempts(userId);
  
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.INFO,
    message: 'Account manually unlocked by admin',
    data: {
      userId,
      adminId
    }
  });
}

/**
 * Get all currently locked accounts
 */
export function getLockedAccounts(): { userId: string, lockUntil: number, remainingSeconds: number }[] {
  const now = Date.now();
  const lockedAccounts: { userId: string, lockUntil: number, remainingSeconds: number }[] = [];
  
  failedLoginAttempts.forEach((record, userId) => {
    if (record.lockUntil && record.lockUntil > now) {
      lockedAccounts.push({
        userId,
        lockUntil: record.lockUntil,
        remainingSeconds: Math.ceil((record.lockUntil - now) / 1000)
      });
    }
  });
  
  return lockedAccounts;
}

export default {
  recordFailedLogin,
  isAccountLocked,
  resetFailedLoginAttempts,
  getRemainingLockoutTime,
  accountLockoutMiddleware,
  onSuccessfulLogin,
  unlockAccount,
  getLockedAccounts
};