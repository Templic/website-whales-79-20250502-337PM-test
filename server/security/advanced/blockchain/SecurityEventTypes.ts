/**
 * Security Event Types
 * 
 * This module defines the types and categories for security events
 * that can be recorded in the blockchain.
 */

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  /**
   * Informational events that do not indicate a security issue
   */
  INFO = 'info',
  
  /**
   * Low severity events that may indicate a minor security issue
   */
  LOW = 'low',
  
  /**
   * Medium severity events that indicate a moderate security issue
   */
  MEDIUM = 'medium',
  
  /**
   * High severity events that indicate a significant security issue
   */
  HIGH = 'high',
  
  /**
   * Critical severity events that indicate a severe security issue
   */
  CRITICAL = 'critical'
}

/**
 * Security event categories
 */
export enum SecurityEventCategory {
  /**
   * General security events
   */
  GENERAL = 'general',
  
  /**
   * Authentication-related security events
   */
  AUTHENTICATION = 'authentication',
  
  /**
   * Authorization-related security events
   */
  AUTHORIZATION = 'authorization',
  
  /**
   * Data security events
   */
  DATA_SECURITY = 'data_security',
  
  /**
   * API security events
   */
  API_SECURITY = 'api_security',
  
  /**
   * Web security events
   */
  WEB_SECURITY = 'web_security',
  
  /**
   * Database security events
   */
  DATABASE_SECURITY = 'database_security',
  
  /**
   * Network security events
   */
  NETWORK_SECURITY = 'network_security',
  
  /**
   * System-level security events
   */
  SYSTEM = 'system',
  
  /**
   * Anomaly detection events
   */
  ANOMALY_DETECTION = 'anomaly_detection',
  
  /**
   * Compliance-related security events
   */
  COMPLIANCE = 'compliance',
  
  /**
   * Audit-related security events
   */
  AUDIT = 'audit',
  
  /**
   * Cryptography-related security events
   */
  CRYPTOGRAPHY = 'cryptography',
  
  /**
   * Security scanning events
   */
  SECURITY_SCAN = 'security_scan'
}

/**
 * Security event structure
 */
export interface SecurityEvent {
  /**
   * Event severity
   */
  severity: SecurityEventSeverity;
  
  /**
   * Event category
   */
  category: SecurityEventCategory;
  
  /**
   * Event title
   */
  title: string;
  
  /**
   * Event description
   */
  description: string;
  
  /**
   * Source IP address
   */
  sourceIp?: string;
  
  /**
   * User ID associated with the event
   */
  userId?: string | number;
  
  /**
   * Username associated with the event
   */
  username?: string;
  
  /**
   * Resource associated with the event
   */
  resource?: string;
  
  /**
   * Action associated with the event
   */
  action?: string;
  
  /**
   * Additional metadata for the event
   */
  metadata?: any;
  
  /**
   * Timestamp of the event
   */
  timestamp?: Date;
}