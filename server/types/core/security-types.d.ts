/**
 * Security Type Definitions
 * 
 * This file defines security-related types used throughout the application.
 * These types provide structure for security features like authentication,
 * authorization, and audit logging.
 */

/**
 * Security log entry for tracking security-related events
 */
export interface SecurityLogEntry {
  id?: string;
  timestamp: number;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string | number;
  action: string;
  outcome: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Security event types for categorizing security logs
 */
export type SecurityEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'account_change'
  | 'configuration_change'
  | 'rate_limit'
  | 'intrusion_attempt'
  | 'suspicious_activity'
  | 'security_control'
  | 'other';

/**
 * Security severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Authenticated user session data
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: number;
  isTwoFactorEnabled?: boolean;
  sessionExpiry: number;
  metadata?: Record<string, any>;
}

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute';
  constraints?: Record<string, any>;
}

/**
 * Role definition with associated permissions
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[] | Permission[];
  isSystem?: boolean;
}

/**
 * Security configuration for features and controls
 */
export interface SecurityConfig {
  // Authentication settings
  auth: {
    allowedAuthMethods: ('password' | 'oauth' | 'mfa' | 'sso')[];
    sessionDuration: number;
    jwtSecret?: string;
    jwtExpiresIn: string;
    requireStrongPasswords: boolean;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    passwordHistoryLimit: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableMfa: boolean;
  };
  
  // Rate limiting settings
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipPaths?: string[];
    skipMethods?: string[];
    keyGenerator?: 'ip' | 'userId' | 'custom';
  };
  
  // CSRF protection
  csrf: {
    enabled: boolean;
    tokenKey: string;
    cookie: {
      key: string;
      path: string;
      sameSite: boolean | 'lax' | 'strict' | 'none';
      secure: boolean;
      httpOnly: boolean;
    };
  };
  
  // Content security settings
  contentSecurity: {
    enabled: boolean;
    directives?: Record<string, string[]>;
    reportOnly: boolean;
  };
  
  // Audit logging
  auditLog: {
    enabled: boolean;
    logLevel: 'none' | 'minimal' | 'standard' | 'verbose';
    logStorage: 'database' | 'file' | 'external';
    retentionDays: number;
  };
  
  // Other security settings
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowCredentials: boolean;
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  
  sanitization: {
    enabled: boolean;
    sanitizeRequestBody: boolean;
    sanitizeHeaders: boolean;
    sanitizeParams: boolean;
    sanitizeRequestQuery: boolean;
  };
}

/**
 * Token structure for authentication
 */
export interface AuthToken {
  token: string;
  type: 'access' | 'refresh' | 'reset' | 'verification';
  issuedAt: number;
  expiresAt: number;
  userId: string;
  scopes?: string[];
  metadata?: Record<string, any>;
}

/**
 * Two-factor authentication data
 */
export interface TwoFactorAuth {
  userId: string;
  secret: string;
  verified: boolean;
  method: 'totp' | 'sms' | 'email';
  backupCodes?: string[];
  lastUsed?: number;
}

/**
 * Security challenge for additional verification
 */
export interface SecurityChallenge {
  id: string;
  userId: string;
  type: 'captcha' | 'knowledge_question' | 'device_confirmation' | 'time_delay';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  data?: Record<string, any>;
}

/**
 * Security alert notification
 */
export interface SecurityAlert {
  id: string;
  userId?: string;
  timestamp: number;
  severity: SecuritySeverity;
  title: string;
  message: string;
  sourceEvent?: string;
  actionRequired: boolean;
  actionLink?: string;
  read: boolean;
  resolved: boolean;
  metadata?: Record<string, any>;
}

/**
 * IP blocking rule
 */
export interface IpBlockRule {
  id: string;
  ipAddress: string;
  reason: string;
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  createdBy?: string;
  notes?: string;
}

/**
 * Security report summary
 */
export interface SecurityReport {
  generatedAt: number;
  period: 'day' | 'week' | 'month';
  authFailures: number;
  authSuccesses: number;
  suspiciousActivities: number;
  blockedIpAddresses: number;
  totalSecurityEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  topIpAddresses: Array<{ip: string; count: number}>;
  topResources: Array<{resource: string; count: number}>;
}

/**
 * Authentication attempt record
 */
export interface AuthAttempt {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: number;
  success: boolean;
  failureReason?: string;
  method: 'password' | 'oauth' | 'mfa' | 'sso';
  metadata?: Record<string, any>;
}

/**
 * Type guards
 */

export function isAuthenticatedUser(obj: unknown): obj is AuthenticatedUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    'roles' in obj &&
    'permissions' in obj &&
    'isActive' in obj
  );
}

export function isSecurityLogEntry(obj: unknown): obj is SecurityLogEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'timestamp' in obj &&
    'eventType' in obj &&
    'severity' in obj &&
    'action' in obj &&
    'outcome' in obj
  );
}

export function isAuthToken(obj: unknown): obj is AuthToken {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'token' in obj &&
    'type' in obj &&
    'issuedAt' in obj &&
    'expiresAt' in obj &&
    'userId' in obj
  );
}