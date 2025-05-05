/**
 * Security Event Types
 * 
 * This module defines all security event types used throughout the application
 * for consistent event categorization and tracking.
 */

// All security event types in the application
export enum SecurityEventTypes {
  // Authentication events
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFICATION_SUCCESS = 'mfa_verification_success',
  MFA_VERIFICATION_FAILURE = 'mfa_verification_failure',
  
  // Authorization events
  AUTHORIZATION_SUCCESS = 'authorization_success',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  
  // Data events
  DATA_ACCESS = 'data_access',
  DATA_CREATED = 'data_created',
  DATA_UPDATED = 'data_updated',
  DATA_DELETED = 'data_deleted',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  DATA_MODIFIED = 'data_modified',
  
  // Security vulnerability events
  SECURITY_VULNERABILITY_DETECTED = 'security_vulnerability_detected',
  SECURITY_SCAN_STARTED = 'security_scan_started',
  SECURITY_SCAN_COMPLETED = 'security_scan_completed',
  SECURITY_SCAN_FAILED = 'security_scan_failed',
  
  // System events
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  
  // Configuration events
  CONFIGURATION_UPDATED = 'configuration_updated',
  CONFIGURATION_RESET = 'configuration_reset',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_WARNING = 'rate_limit_warning',
  
  // API events
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  API_ERROR = 'api_error',
  
  // User events
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOCKED = 'user_locked',
  USER_UNLOCKED = 'user_unlocked',
  USER_PASSWORD_CHANGED = 'user_password_changed',
  USER_PASSWORD_RESET = 'user_password_reset',
  
  // Session events
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  SESSION_TERMINATED = 'session_terminated',
  
  // Compliance events
  COMPLIANCE_CHECK_STARTED = 'compliance_check_started',
  COMPLIANCE_CHECK_COMPLETED = 'compliance_check_completed',
  COMPLIANCE_VIOLATION = 'compliance_violation'
}

export default SecurityEventTypes;