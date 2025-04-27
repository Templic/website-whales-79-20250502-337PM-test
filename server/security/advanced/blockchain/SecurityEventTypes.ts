/**
 * @file SecurityEventTypes.ts
 * @description Comprehensive enumeration of all security event types in the system
 */

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARN = 'warn',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Security event categories
 */
export enum SecurityEventCategory {
  GENERAL = 'general',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  API_SECURITY = 'api_security',
  WEB_SECURITY = 'web_security',
  CRYPTOGRAPHY = 'cryptography',
  DATABASE_SECURITY = 'database_security',
  FILE_SECURITY = 'file_security',
  SYSTEM = 'system',
  NETWORK = 'network',
  APPLICATION = 'application',
  CONTAINER = 'container',
  CLOUD = 'cloud',
  SECURITY_SCAN = 'security_scan',
  API = 'api',
  ATTACK = 'attack',
  ANOMALY = 'anomaly',
  THREAT_INTEL = 'threat_intel',
  FILE = 'file',
  PROTECTION = 'protection',
  CORRELATION = 'correlation',
  AUDIT = 'audit',
  ADMIN = 'admin',
  ERROR = 'error',
  QUANTUM = 'quantum',
  BLOCKCHAIN = 'blockchain'
}

/**
 * Comprehensive enumeration of all security event types in the system
 */
export enum SecurityEventTypes {
  // -------------------------------------------------------------------
  // System Events
  // -------------------------------------------------------------------
  SECURITY_INITIALIZATION = 'security_initialization',
  SECURITY_SHUTDOWN = 'security_shutdown',
  SECURITY_CONFIG_CHANGE = 'security_config_change',
  SECURITY_MODULE_LOAD = 'security_module_load',
  SECURITY_MODULE_UNLOAD = 'security_module_unload',
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  AUTH_SUCCESS = 'auth_success',
  
  // -------------------------------------------------------------------
  // Authentication Events
  // -------------------------------------------------------------------
  USER_LOGIN_ATTEMPT = 'user_login_attempt',
  USER_LOGIN_SUCCESS = 'user_login_success',
  USER_LOGIN_FAILURE = 'user_login_failure',
  USER_LOGOUT = 'user_logout',
  USER_SESSION_EXPIRED = 'user_session_expired',
  USER_PASSWORD_CHANGED = 'user_password_changed',
  USER_PASSWORD_RESET_REQUESTED = 'user_password_reset_requested',
  USER_PASSWORD_RESET_COMPLETED = 'user_password_reset_completed',
  USER_ACCOUNT_LOCKED = 'user_account_locked',
  USER_ACCOUNT_UNLOCKED = 'user_account_unlocked',
  
  // Multi-factor authentication events
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_CHALLENGE_ISSUED = 'mfa_challenge_issued',
  MFA_CHALLENGE_SUCCEEDED = 'mfa_challenge_succeeded',
  MFA_CHALLENGE_FAILED = 'mfa_challenge_failed',
  
  // OAuth and external authentication
  OAUTH_LOGIN_ATTEMPT = 'oauth_login_attempt',
  OAUTH_LOGIN_SUCCESS = 'oauth_login_success',
  OAUTH_LOGIN_FAILURE = 'oauth_login_failure',
  OAUTH_TOKEN_REFRESH = 'oauth_token_refresh',
  
  // -------------------------------------------------------------------
  // Session Events
  // -------------------------------------------------------------------
  SESSION_CREATED = 'session_created',
  SESSION_TERMINATED = 'session_terminated',
  SESSION_EXPIRED = 'session_expired',
  SESSION_VALIDATION_FAILURE = 'session_validation_failure',
  
  // -------------------------------------------------------------------
  // Authorization Events
  // -------------------------------------------------------------------
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_ADDED = 'permission_added',
  PERMISSION_REMOVED = 'permission_removed',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  
  // -------------------------------------------------------------------
  // Data Access Events
  // -------------------------------------------------------------------
  DATA_ACCESS = 'data_access',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  DATA_EXPORT = 'data_export',
  
  // -------------------------------------------------------------------
  // API Events
  // -------------------------------------------------------------------
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  API_SCHEMA_VALIDATION_FAILURE = 'api_schema_validation_failure',
  API_RATE_LIMIT_EXCEEDED = 'api_rate_limit_exceeded',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  
  // -------------------------------------------------------------------
  // Attack Detection Events
  // -------------------------------------------------------------------
  XSS_ATTEMPT_DETECTED = 'xss_attempt_detected',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  COMMAND_INJECTION_ATTEMPT = 'command_injection_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  CSRF_ATTEMPT_DETECTED = 'csrf_attempt_detected',
  OPEN_REDIRECT_ATTEMPT = 'open_redirect_attempt',
  
  // -------------------------------------------------------------------
  // Anomaly Detection Events
  // -------------------------------------------------------------------
  ANOMALY_DETECTED = 'anomaly_detected',
  BEHAVIORAL_ANOMALY = 'behavioral_anomaly',
  STATISTICAL_ANOMALY = 'statistical_anomaly',
  RATE_ANOMALY = 'rate_anomaly',
  CONTENT_ANOMALY = 'content_anomaly',
  
  // -------------------------------------------------------------------
  // Threat Intelligence Events
  // -------------------------------------------------------------------
  THREAT_INTEL_MATCH = 'threat_intel_match',
  KNOWN_BAD_IP_DETECTED = 'known_bad_ip_detected',
  KNOWN_BAD_USER_AGENT = 'known_bad_user_agent',
  KNOWN_ATTACK_PATTERN = 'known_attack_pattern',
  
  // -------------------------------------------------------------------
  // File Events
  // -------------------------------------------------------------------
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  FILE_DELETION = 'file_deletion',
  FILE_MALWARE_DETECTED = 'file_malware_detected',
  FILE_TYPE_MISMATCH = 'file_type_mismatch',
  
  // -------------------------------------------------------------------
  // System Protection Events
  // -------------------------------------------------------------------
  RUNTIME_PROTECTION_TRIGGERED = 'runtime_protection_triggered',
  MEMORY_PROTECTION_VIOLATION = 'memory_protection_violation',
  CODE_INJECTION_ATTEMPT = 'code_injection_attempt',
  SANDBOX_ESCAPE_ATTEMPT = 'sandbox_escape_attempt',
  
  // -------------------------------------------------------------------
  // Correlation and Analysis Events
  // -------------------------------------------------------------------
  CORRELATION_ALERT = 'correlation_alert',
  THREAT_HUNTING_MATCH = 'threat_hunting_match',
  SECURITY_INVESTIGATION_CREATED = 'security_investigation_created',
  SECURITY_INVESTIGATION_UPDATED = 'security_investigation_updated',
  SECURITY_INVESTIGATION_CLOSED = 'security_investigation_closed',
  
  // -------------------------------------------------------------------
  // Audit Events
  // -------------------------------------------------------------------
  AUDIT_LOG_ACCESSED = 'audit_log_accessed',
  AUDIT_EXPORT_GENERATED = 'audit_export_generated',
  COMPLIANCE_REPORT_GENERATED = 'compliance_report_generated',
  
  // -------------------------------------------------------------------
  // Admin and Configuration Events
  // -------------------------------------------------------------------
  SECURITY_POLICY_CREATED = 'security_policy_created',
  SECURITY_POLICY_UPDATED = 'security_policy_updated',
  SECURITY_POLICY_DELETED = 'security_policy_deleted',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_CONFIGURATION_CHANGED = 'system_configuration_changed',
  
  // -------------------------------------------------------------------
  // Advanced Cryptography Events
  // -------------------------------------------------------------------
  ENCRYPTION_KEY_ROTATION = 'encryption_key_rotation',
  HOMOMORPHIC_ENCRYPTION_OPERATION = 'homomorphic_encryption_operation',
  ZERO_KNOWLEDGE_PROOF_GENERATED = 'zero_knowledge_proof_generated',
  ZERO_KNOWLEDGE_PROOF_VERIFIED = 'zero_knowledge_proof_verified',
  
  // -------------------------------------------------------------------
  // Error and Exception Events
  // -------------------------------------------------------------------
  SECURITY_ERROR = 'security_error',
  SECURITY_EXCEPTION = 'security_exception',
  SECURITY_WARNING = 'security_warning',
  
  // -------------------------------------------------------------------
  // Quantum Resistant Security Events
  // -------------------------------------------------------------------
  QUANTUM_RESISTANT_KEY_GENERATED = 'quantum_resistant_key_generated',
  QUANTUM_RESISTANT_SIGNATURE_GENERATED = 'quantum_resistant_signature_generated',
  QUANTUM_RESISTANT_SIGNATURE_VERIFIED = 'quantum_resistant_signature_verified',
  
  // -------------------------------------------------------------------
  // Blockchain and Immutable Events
  // -------------------------------------------------------------------
  BLOCKCHAIN_RECORD_CREATED = 'blockchain_record_created',
  BLOCKCHAIN_RECORD_VERIFIED = 'blockchain_record_verified',
  BLOCKCHAIN_INTEGRITY_CHECK = 'blockchain_integrity_check',
  SECURITY_EVENT_NOTARIZED = 'security_event_notarized'
}