/**
 * Security Event Types
 * 
 * This module defines the types used for security events.
 */

/**
 * Severity levels for security events
 */
export enum SecurityEventSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Categories for security events
 */
export enum SecurityEventCategory {
  // System events
  SYSTEM = 'system',
  
  // Authentication events
  AUTHENTICATION = 'authentication',
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  
  // Authorization events
  AUTHORIZATION = 'authorization',
  ACCESS_ATTEMPT = 'access_attempt',
  ACCESS_DENIED = 'access_denied',
  ACCESS_GRANTED = 'access_granted',
  PERMISSION_CHANGE = 'permission_change',
  
  // Data events
  DATA = 'data',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  DATA_EXPORT = 'data_export',
  
  // Attack events
  ATTACK_ATTEMPT = 'attack_attempt',
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  DOS = 'dos',
  BRUTE_FORCE = 'brute_force',
  
  // Validation events
  VALIDATION = 'validation',
  INPUT_VALIDATION = 'input_validation',
  
  // Rate limiting events
  RATE_LIMIT = 'rate_limit',
  
  // Admin events
  ADMIN = 'admin',
  ADMIN_ACTION = 'admin_action',
  SETTINGS_CHANGE = 'settings_change',
  
  // User events
  USER = 'user',
  USER_CREATION = 'user_creation',
  USER_MODIFICATION = 'user_modification',
  USER_DELETION = 'user_deletion',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // Session events
  SESSION = 'session',
  SESSION_CREATION = 'session_creation',
  SESSION_EXPIRATION = 'session_expiration',
  SESSION_INVALIDATION = 'session_invalidation',
  
  // API events
  API = 'api',
  API_REQUEST = 'api_request',
  API_ERROR = 'api_error',
  
  // Security scan events
  SECURITY_SCAN = 'security_scan',
  VULNERABILITY_FOUND = 'vulnerability_found',
  
  // Anomaly detection events
  ANOMALY = 'anomaly',
  UNUSUAL_BEHAVIOR = 'unusual_behavior',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  
  // Blockchain events
  BLOCKCHAIN = 'blockchain',
  CHAIN_VALIDATION = 'chain_validation',
  BLOCK_CREATION = 'block_creation',
  BLOCK_VALIDATION = 'block_validation',
  
  // Crypto events
  CRYPTO = 'crypto',
  KEY_GENERATION = 'key_generation',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption',
  SIGNATURE = 'signature',
  SIGNATURE_VERIFICATION = 'signature_verification',
  
  // Unknown events
  UNKNOWN = 'unknown'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  /**
   * Severity of the event
   */
  severity: SecurityEventSeverity;
  
  /**
   * Category of the event
   */
  category: SecurityEventCategory;
  
  /**
   * Message describing the event
   */
  message: string;
  
  /**
   * IP address of the request
   */
  ipAddress?: string;
  
  /**
   * Timestamp of the event
   */
  timestamp?: number;
  
  /**
   * User ID associated with the event
   */
  userId?: string;
  
  /**
   * Session ID associated with the event
   */
  sessionId?: string;
  
  /**
   * Additional metadata for the event
   */
  metadata?: Record<string, any>;
}

/**
 * Security event with blockchain data
 */
export interface SecurityEventWithBlockchainData extends SecurityEvent {
  /**
   * ID of the event
   */
  id: string;
  
  /**
   * Hash of the event
   */
  hash: string;
  
  /**
   * ID of the block containing the event
   */
  blockId: string;
  
  /**
   * Index of the event in the block
   */
  index: number;
}

/**
 * Security event filter
 */
export interface SecurityEventFilter {
  /**
   * Severity levels to include
   */
  severities?: SecurityEventSeverity[];
  
  /**
   * Categories to include
   */
  categories?: SecurityEventCategory[];
  
  /**
   * Start timestamp
   */
  startTimestamp?: number;
  
  /**
   * End timestamp
   */
  endTimestamp?: number;
  
  /**
   * User IDs to include
   */
  userIds?: string[];
  
  /**
   * IP addresses to include
   */
  ipAddresses?: string[];
  
  /**
   * Text search query
   */
  query?: string;
  
  /**
   * Maximum number of results to return
   */
  limit?: number;
}