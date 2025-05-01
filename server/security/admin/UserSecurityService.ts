/**
 * User Security Service
 * 
 * Provides enhanced security functionality for user management in the Admin Portal.
 * This service allows administrators to manage security-related aspects of user accounts.
 * 
 * Features:
 * - MFA management
 * - Security status overview
 * - Security permission management
 * - Security role assignment
 * - User activity monitoring
 */

import { AuditAction, AuditCategory, getUserActivity, logAuditEvent } from '../advanced/audit/AuditLogService';
import { Request } from 'express';
import { 
  isMFAEnabled, 
  disableMFA, 
  getMFAUserData 
} from '../advanced/mfa/MultiFactorAuth';
import { 
  isAccountLocked, 
  unlockAccount, 
  getAccountLockInfo 
} from '../advanced/account/AccountLockoutService';
import { getRolePermissions, hasPermission } from '../advanced/rbac/EnhancedRoleManager';

// Mock user repository (in a real implementation, this would connect to the user database)
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
  lastLogin?: number;
  createdAt: number;
}

// For demo/testing purposes - in a real app, this would come from the database
const users: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    enabled: true,
    lastLogin: Date.now() - 3600000,
    createdAt: Date.now() - 30 * 24 * 3600000
  },
  {
    id: '2',
    username: 'user1',
    email: 'user1@example.com',
    role: 'USER',
    enabled: true,
    lastLogin: Date.now() - 86400000,
    createdAt: Date.now() - 15 * 24 * 3600000
  },
  {
    id: '3',
    username: 'user2',
    email: 'user2@example.com',
    role: 'USER',
    enabled: true,
    lastLogin: Date.now() - 7 * 86400000,
    createdAt: Date.now() - 10 * 24 * 3600000
  }
];

/**
 * Get users with security status
 */
export function getUsersWithSecurityStatus(): Array<{
  user: User;
  security: {
    mfaEnabled: boolean;
    accountLocked: boolean;
    sessionCount: number;
    suspiciousActivity: boolean;
    lastSecurityIncident?: number;
    securityScore: number;
  };
}> {
  return users.map(user => {
    // In a real implementation, these would be actual checks
    const mfaEnabled = isMFAEnabled(user.id);
    const accountLocked = isAccountLocked(user.id);
    const sessionCount = Math.floor(Math.random() * 3); // Simulated session count
    const suspiciousActivity = Math.random() < 0.2; // 20% chance of suspicious activity
    const lastSecurityIncident = suspiciousActivity ? 
      Date.now() - Math.floor(Math.random() * 7 * 86400000) : undefined;
    
    // Calculate a simple security score
    const securityScore = (mfaEnabled ? 40 : 0) + 
      (!accountLocked ? 20 : 0) + 
      (sessionCount < 2 ? 20 : 0) + 
      (!suspiciousActivity ? 20 : 0);
    
    return {
      user,
      security: {
        mfaEnabled,
        accountLocked,
        sessionCount,
        suspiciousActivity,
        lastSecurityIncident,
        securityScore
      }
    };
  });
}

/**
 * Get detailed security info for a specific user
 */
export function getUserSecurityDetails(userId: string): {
  userId: string;
  mfa: {
    enabled: boolean;
    verified: boolean;
    setupDate?: number;
    recoveryCodes?: {
      count: number;
      unused: number;
    };
  };
  accountStatus: {
    locked: boolean;
    failedLoginAttempts: number;
    lockReason?: string;
    lockTime?: number;
  };
  sessionInfo: {
    activeSessions: number;
    lastLoginTime?: number;
    lastLoginIP?: string;
    lastUserAgent?: string;
  };
  permissions: string[];
  securityIncidents: {
    total: number;
    recent: Array<{
      type: string;
      timestamp: number;
      description: string;
      severity: string;
    }>;
  };
  recentActivity: Array<{
    action: string;
    timestamp: number;
    resource: string;
    details?: any;
  }>;
} {
  // Get MFA status
  const mfaData = getMFAUserData(userId);
  const mfaEnabled = !!mfaData;
  const mfaVerified = mfaEnabled && (mfaData?.verified || false);
  const mfaSetupDate = mfaEnabled ? mfaData?.createdAt : undefined;
  
  // Get account lock status
  const lockInfo = getAccountLockInfo(userId);
  const accountLocked = isAccountLocked(userId);
  
  // Get permissions
  const user = users.find(u => u.id === userId);
  const role = user?.role || 'USER';
  const permissions = getRolePermissions(role);
  
  // Get recent activity (real implementation would use database queries)
  const recentAuditLogs = getUserActivity(userId, 10);
  
  // Security incidents (simulated)
  const incidentCount = Math.floor(Math.random() * 5);
  const incidents = [];
  
  for (let i = 0; i < incidentCount; i++) {
    incidents.push({
      type: ['Failed login', 'Suspicious IP', 'Session hijacking attempt', 'Password brute force'][Math.floor(Math.random() * 4)],
      timestamp: Date.now() - Math.floor(Math.random() * 30 * 86400000),
      description: 'Potential security incident detected',
      severity: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]
    });
  }
  
  // Sort incidents by timestamp (newest first)
  incidents.sort((a, b) => b.timestamp - a.timestamp);
  
  return {
    userId,
    mfa: {
      enabled: mfaEnabled,
      verified: mfaVerified,
      setupDate: mfaSetupDate,
      recoveryCodes: mfaEnabled ? {
        count: mfaData?.recoveryCodes?.length || 0,
        unused: mfaData?.recoveryCodes?.length || 0
      } : undefined
    },
    accountStatus: {
      locked: accountLocked,
      failedLoginAttempts: lockInfo?.failedAttempts || 0,
      lockReason: lockInfo?.reason,
      lockTime: lockInfo?.lockedAt
    },
    sessionInfo: {
      activeSessions: Math.floor(Math.random() * 3), // Simulated session count
      lastLoginTime: user?.lastLogin,
      lastLoginIP: '192.168.1.' + Math.floor(Math.random() * 254), // Simulated IP
      lastUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Simulated user agent
    },
    permissions,
    securityIncidents: {
      total: incidentCount,
      recent: incidents
    },
    recentActivity: recentAuditLogs.map(log => ({
      action: log.action,
      timestamp: log.timestamp,
      resource: log.resource,
      details: log.details
    }))
  };
}

/**
 * Reset MFA for a user
 */
export function resetUserMFA(userId: string, adminId: string, req?: Request): {
  success: boolean;
  userId: string;
  mfaStatus: {
    enabled: boolean;
    wasReset: boolean;
  };
} {
  try {
    // Check if MFA was enabled
    const wasMFAEnabled = isMFAEnabled(userId);
    
    // Disable MFA
    disableMFA(userId);
    
    // Log the action
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.USER_MANAGEMENT,
      'user_mfa',
      {
        action: 'reset',
        targetUserId: userId,
        previousState: {
          mfaEnabled: wasMFAEnabled
        }
      },
      req,
      userId,
      adminId
    );
    
    return {
      success: true,
      userId,
      mfaStatus: {
        enabled: false,
        wasReset: wasMFAEnabled
      }
    };
  } catch (error) {
    console.error('Error resetting user MFA:', error);
    throw error;
  }
}

/**
 * Unlock a user's account
 */
export function unlockUserAccount(userId: string, adminId: string, req?: Request): {
  success: boolean;
  userId: string;
  accountStatus: {
    locked: boolean;
    wasUnlocked: boolean;
  };
} {
  try {
    // Check if account was locked
    const wasLocked = isAccountLocked(userId);
    
    if (wasLocked) {
      // Unlock the account
      unlockAccount(userId);
      
      // Log the action
      logAuditEvent(
        AuditAction.SECURITY_CONFIG_CHANGED,
        AuditCategory.USER_MANAGEMENT,
        'user_account',
        {
          action: 'unlock',
          targetUserId: userId
        },
        req,
        userId,
        adminId
      );
    }
    
    return {
      success: true,
      userId,
      accountStatus: {
        locked: false,
        wasUnlocked: wasLocked
      }
    };
  } catch (error) {
    console.error('Error unlocking user account:', error);
    throw error;
  }
}

/**
 * Enforce MFA for a user
 */
export function enforceMFA(userId: string, enforce: boolean, adminId: string, req?: Request): {
  success: boolean;
  userId: string;
  enforceMFA: boolean;
} {
  try {
    // In a real implementation, this would update a flag in the user record
    // For now, we'll just simulate the action
    
    // Log the action
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.USER_MANAGEMENT,
      'user_mfa_policy',
      {
        action: enforce ? 'enforce' : 'unenforce',
        targetUserId: userId
      },
      req,
      userId,
      adminId
    );
    
    return {
      success: true,
      userId,
      enforceMFA: enforce
    };
  } catch (error) {
    console.error('Error enforcing MFA for user:', error);
    throw error;
  }
}

/**
 * Terminate all active sessions for a user
 */
export function terminateUserSessions(userId: string, adminId: string, req?: Request): {
  success: boolean;
  userId: string;
  sessionInfo: {
    terminatedCount: number;
  };
} {
  try {
    // In a real implementation, this would invalidate sessions in the database
    // For now, we'll just simulate the action
    const terminatedCount = Math.floor(Math.random() * 3) + 1;
    
    // Log the action
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.USER_MANAGEMENT,
      'user_sessions',
      {
        action: 'terminate',
        targetUserId: userId,
        sessionCount: terminatedCount
      },
      req,
      userId,
      adminId
    );
    
    return {
      success: true,
      userId,
      sessionInfo: {
        terminatedCount
      }
    };
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    throw error;
  }
}

export default {
  getUsersWithSecurityStatus,
  getUserSecurityDetails,
  resetUserMFA,
  unlockUserAccount,
  enforceMFA,
  terminateUserSessions
};