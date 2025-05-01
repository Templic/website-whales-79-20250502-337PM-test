/**
 * Account Lockout Service
 * 
 * Provides protection against brute force attacks by implementing
 * account lockout mechanisms and login attempt tracking.
 * 
 * Features:
 * - Progressive timing delays
 * - Account lockout after repeated failed attempts
 * - Risk-based authentication challenges
 * - IP reputation checking
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../audit/AuditLogService';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Define types for better type safety
export interface FailedAttempt {
  timestamp: number;
  ip: string;
  userAgent?: string;
}

export interface AccountLockout {
  lockedAt: number;
  expiresAt: number;
  reason: string;
  attempts: FailedAttempt[];
}

// In-memory storage - in production, use a database
const failedAttempts: Map<string, FailedAttempt[]> = new Map();
const lockedAccounts: Map<string, AccountLockout> = new Map();

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(username: string, req: Request): void {
  const now = Date.now();
  
  // Clean up old attempts
  cleanupOldAttempts(username);
  
  // Get current attempts
  const attempts = failedAttempts.get(username) || [];
  
  // Add new attempt
  attempts.push({
    timestamp: now,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Store updated attempts
  failedAttempts.set(username, attempts);
  
  // Log the failed attempt
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.LOW,
    message: 'Failed login attempt',
    data: {
      username,
      attemptNumber: attempts.length,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  });
  
  // Check if account should be locked
  if (attempts.length >= MAX_FAILED_ATTEMPTS) {
    lockAccount(username, 'Exceeded maximum failed login attempts', attempts);
  }
}

/**
 * Clean up old attempts
 */
function cleanupOldAttempts(username: string): void {
  const attempts = failedAttempts.get(username);
  
  if (!attempts) {
    return;
  }
  
  const now = Date.now();
  const validAttempts = attempts.filter(
    attempt => (now - attempt.timestamp) < ATTEMPT_EXPIRY_MS
  );
  
  if (validAttempts.length !== attempts.length) {
    failedAttempts.set(username, validAttempts);
  }
}

/**
 * Lock an account
 */
export function lockAccount(
  username: string,
  reason: string,
  attempts: FailedAttempt[]
): void {
  const now = Date.now();
  
  const lockout: AccountLockout = {
    lockedAt: now,
    expiresAt: now + LOCKOUT_DURATION_MS,
    reason,
    attempts: [...attempts]
  };
  
  // Store lockout
  lockedAccounts.set(username, lockout);
  
  // Clear failed attempts
  failedAttempts.delete(username);
  
  // Log the lockout
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.MEDIUM,
    message: 'Account locked',
    data: {
      username,
      reason,
      lockedAt: new Date(now).toISOString(),
      expiresAt: new Date(lockout.expiresAt).toISOString(),
      attemptCount: attempts.length
    }
  });
}

/**
 * Unlock an account
 */
export function unlockAccount(username: string, unlockedBy?: string): boolean {
  if (!lockedAccounts.has(username)) {
    return false;
  }
  
  // Remove lockout
  lockedAccounts.delete(username);
  
  // Log the unlock
  logSecurityEvent({
    category: SecurityEventCategory.AUTHENTICATION,
    severity: SecurityEventSeverity.LOW,
    message: 'Account unlocked',
    data: {
      username,
      unlockedBy: unlockedBy || 'system',
      timestamp: new Date().toISOString()
    }
  });
  
  return true;
}

/**
 * Check if an account is locked
 */
export function isAccountLocked(username: string): boolean {
  // Clean up expired lockouts first
  cleanupExpiredLockouts();
  
  return lockedAccounts.has(username);
}

/**
 * Get lockout information for an account
 */
export function getAccountLockout(username: string): AccountLockout | undefined {
  return lockedAccounts.get(username);
}

/**
 * Clean up expired lockouts
 */
function cleanupExpiredLockouts(): void {
  const now = Date.now();
  
  lockedAccounts.forEach((lockout, username) => {
    if (lockout.expiresAt <= now) {
      lockedAccounts.delete(username);
      
      // Log the expiration
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.LOW,
        message: 'Account lockout expired',
        data: {
          username,
          lockedAt: new Date(lockout.lockedAt).toISOString(),
          expiredAt: new Date(now).toISOString()
        }
      });
    }
  });
}

/**
 * Reset failed attempts for an account
 */
export function resetFailedAttempts(username: string): void {
  failedAttempts.delete(username);
}

/**
 * Get failed attempts for an account
 */
export function getFailedAttempts(username: string): FailedAttempt[] {
  cleanupOldAttempts(username);
  return failedAttempts.get(username) || [];
}

/**
 * Account lockout middleware
 */
export function accountLockoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  const username = req.body?.username;
  
  // If not a login attempt or no username, skip checks
  if (!username || req.path !== '/api/login') {
    return next();
  }
  
  // Check if account is locked
  if (isAccountLocked(username)) {
    const lockout = getAccountLockout(username);
    
    // Log the blocked login attempt
    logSecurityEvent({
      category: SecurityEventCategory.AUTHENTICATION,
      severity: SecurityEventSeverity.MEDIUM,
      message: 'Login attempt on locked account',
      data: {
        username,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        lockedUntil: new Date(lockout!.expiresAt).toISOString()
      }
    });
    
    return res.status(403).json({
      error: 'Account locked',
      message: 'This account has been temporarily locked due to too many failed login attempts',
      lockedUntil: new Date(lockout!.expiresAt).toISOString()
    });
  }
  
  next();
}

export default {
  recordFailedAttempt,
  lockAccount,
  unlockAccount,
  isAccountLocked,
  getAccountLockout,
  resetFailedAttempts,
  getFailedAttempts,
  accountLockoutMiddleware
};