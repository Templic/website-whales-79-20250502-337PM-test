/**
 * Security Types
 * 
 * This module defines common types and interfaces used across security modules.
 * It helps ensure type consistency and prevents errors.
 */

import { Request, Response } from 'express';
import { Session } from 'express-session';

/**
 * Extended Session interface to include user-related properties
 */
declare module 'express-session' {
  interface Session {
    userId?: string;
    roles?: string[];
    isAdmin?: boolean;
    lastActivity?: number;
    csrfToken?: string;
    securityContext?: SecurityContext;
  }
}

/**
 * Security log levels
 */
export enum SecurityLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Security event types
 */
export type SecurityEventType =
  | 'AUTHENTICATION_SUCCESS'
  | 'AUTHENTICATION_FAILURE'
  | 'ACCESS_DENIED'
  | 'AUTHORIZATION_FAILURE'
  | 'SESSION_CREATED'
  | 'SESSION_DESTROYED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'API_VALIDATION_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VALIDATION_FAILURE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SECURITY_CONFIGURATION_CHANGED'
  | 'SECURITY_SCAN_REQUESTED'
  | 'AUTH_SCAN_REQUESTED'
  | 'SECURITY_LOGS_ACCESSED'
  | 'TEST_SECURITY_SCAN_REQUESTED'
  | 'PASSWORD_CHANGE_ATTEMPTED'
  | 'SERVER_SECURITY_ERROR'
  | 'API_ERROR_RESPONSE'
  | 'API_SLOW_RESPONSE'
  | 'API_REQUEST'
  | 'SECURITY_INITIALIZED';

/**
 * Security event interface
 */
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: Date;
  level: SecurityLogLevel;
  source: string;
  data: Record<string, any>;
}

/**
 * Security context for a request
 */
export interface SecurityContext {
  userId?: string;
  roles?: string[];
  ip: string;
  userAgent?: string;
  sessionId?: string;
  lastActivity: number;
  threatLevel: number;
  riskScore: number;
}

/**
 * Security metrics data
 */
export interface SecurityMetrics {
  apiRequests: number;
  failedLogins: number;
  successfulLogins: number;
  validationFailures: number;
  rateLimitExceeded: number;
  suspiciousActivities: number;
  timestamp: Date;
}

/**
 * Consolidated security metrics over time
 */
export interface ConsolidatedSecurityMetrics {
  daily: SecurityMetrics[];
  weekly: SecurityMetrics[];
  monthly: SecurityMetrics[];
  annual: SecurityMetrics[];
}

/**
 * Security component interface
 */
export interface SecurityComponent {
  name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Enhanced request with security context
 */
export interface SecureRequest extends Request {
  securityContext?: SecurityContext;
}

/**
 * Security posture levels
 */
export enum SecurityPosture {
  NORMAL = 'normal',
  ELEVATED = 'elevated',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Feature contribution for ML models
 */
export interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  zScore: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enableAdvancedProtection: boolean;
  scanMode?: 'standard' | 'deep' | 'maximum';
  threatIntelligence?: ThreatIntelligenceConfig;
  csrfProtection?: {
    enabled: boolean;
    tokenRotation: boolean;
    cookieOptions: {
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    }
  };
  rateLimit?: {
    standard: number;
    auth: number;
    admin: number;
  };
}

/**
 * Threat intelligence configuration
 */
export interface ThreatIntelligenceConfig {
  enabled: boolean;
  updateInterval: number;
  sources: string[];
  apiKeys?: Record<string, string>;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  enableSecurityHeaders: boolean;
  enableInputValidation: boolean;
  enableSecurityScans: boolean;
  enableDeepSecurityScanning?: boolean;
}

/**
 * Security validation error
 */
export interface SecurityValidationError {
  path: string;
  code: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: SecurityValidationError[];
}

/**
 * Helper function to create a security context from a request
 */
export function createSecurityContext(req: Request): SecurityContext {
  return {
    userId: req.session?.userId,
    roles: req.session?.roles || [],
    ip: req.ip || 'unknown',
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionID,
    lastActivity: Date.now(),
    threatLevel: 0,
    riskScore: 0
  };
}