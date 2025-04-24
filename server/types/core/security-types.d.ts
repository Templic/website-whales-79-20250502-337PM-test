/**
 * Security-Related Type Definitions
 * 
 * This file defines security-related interfaces and types used throughout the application.
 */

import { SecurityError } from './error-types';

/**
 * Security event data structure
 */
interface SecurityEvent {
  /** Type of security event */
  type: string;
  
  /** Security event message */
  message: string;
  
  /** Timestamp when the event occurred */
  timestamp: number;
  
  /** Severity of the security event */
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  /** Additional contextual data for the event */
  data?: Record<string, unknown>;
  
  /** Source IP address */
  sourceIp?: string;
  
  /** Associated user ID */
  userId?: string;
  
  /** Unique request identifier */
  requestId?: string;
  
  /** Security scan that detected the event */
  detector?: string;
  
  /** Hash of the event for verification */
  eventHash?: string;
}

/**
 * Immutable security log store
 */
interface ImmutableSecurityLogs {
  /** Add a security event to the logs */
  addSecurityEvent(event: SecurityEvent): void;
  
  /** Get all security events */
  getEvents(): SecurityEvent[];
  
  /** Get events by specific type */
  getEventsByType(type: string): SecurityEvent[];
  
  /** Get events by severity level */
  getEventsBySeverity(severity: string): SecurityEvent[];
  
  /** Get events within a time range */
  getEventsInTimeRange(start: number, end: number): SecurityEvent[];
  
  /** Clear all events (admin only) */
  clear(): void;
  
  /** Export events in specified format */
  export(format?: 'json' | 'csv'): string;
  
  /** Get the current number of events */
  getSize(): number;
  
  /** Verify integrity of the log chain */
  verifyIntegrity(): boolean;
  
  /** Get events related to a specific user */
  getEventsByUser(userId: string): SecurityEvent[];
  
  /** Search events by keyword */
  searchEvents(keyword: string): SecurityEvent[];
}

/**
 * Security configuration options
 */
interface SecurityConfig {
  /** Whether deep scanning is enabled */
  deepScanningEnabled: boolean;
  
  /** Security log retention period in days */
  logRetentionDays: number;
  
  /** Whether to use quantum-resistant algorithms */
  useQuantumResistantAlgorithms: boolean;
  
  /** Rate limiting settings */
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    timeWindowMs: number;
  };
  
  /** CSRF protection settings */
  csrfProtection: {
    enabled: boolean;
    cookieName: string;
    headerName: string;
  };
  
  /** Content Security Policy settings */
  contentSecurityPolicy: {
    enabled: boolean;
    policy: Record<string, string>;
  };
}

/**
 * Feature flags related to security
 */
interface FeatureFlags {
  /** Whether security scans are enabled */
  enableSecurityScans: boolean;
  
  /** Whether to enable blockchain logging */
  enableBlockchainLogging: boolean;
  
  /** Whether to enable ML-based anomaly detection */
  enableMlAnomalyDetection: boolean;
}

/**
 * Token data structure
 */
interface Token {
  /** The token value */
  value: string;
  
  /** When the token expires */
  expiresAt: number;
  
  /** Type of token */
  type: 'access' | 'refresh' | 'csrf' | 'api';
  
  /** Associated user ID */
  userId?: string;
  
  /** Token scope or permissions */
  scope?: string[];
  
  /** Token issuer */
  issuer?: string;
}

/**
 * Encryption options
 */
interface EncryptionOptions {
  /** Encryption algorithm to use */
  algorithm: string;
  
  /** Key size in bits */
  keySize: number;
  
  /** Initialization vector */
  iv?: Buffer;
  
  /** Iteration count for key derivation */
  iterations?: number;
  
  /** Output encoding format */
  outputEncoding?: 'hex' | 'base64';
}

/**
 * Hash algorithm options
 */
interface HashOptions {
  /** Hash algorithm to use */
  algorithm: string;
  
  /** Salt value */
  salt?: Buffer | string;
  
  /** Key length in bytes */
  keyLength?: number;
  
  /** Iteration count */
  iterations?: number;
}

/**
 * Security scan result
 */
interface SecurityScanResult {
  /** Scan ID */
  scanId: string;
  
  /** Timestamp when scan started */
  startTime: number;
  
  /** Timestamp when scan completed */
  endTime: number;
  
  /** Scan status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  /** Detected vulnerabilities */
  vulnerabilities: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    remediation?: string;
  }>;
  
  /** Number of files scanned */
  filesScanned: number;
  
  /** Scan type */
  scanType: 'quick' | 'standard' | 'deep';
}

// Export types for use in other files
export {
  SecurityEvent,
  ImmutableSecurityLogs,
  SecurityConfig,
  FeatureFlags,
  Token,
  EncryptionOptions,
  HashOptions,
  SecurityScanResult
};