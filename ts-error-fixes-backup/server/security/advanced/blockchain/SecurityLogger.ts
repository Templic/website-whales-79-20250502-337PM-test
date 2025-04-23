/**
 * Security Logger Interface
 * 
 * This module provides interfaces and implementations for the security logging system
 * that integrates with the blockchain-based immutable logging infrastructure.
 */

// Placeholder for actual blockchain logging
// In a real implementation, this would import from the blockchain module
function recordSecurityEvent(event): void {
  console.log(`[BLOCKCHAIN-SECURITY] ${event.level || 'INFO'} - ${event.message || event.type}`, 
               event.details || {});
}

/**
 * Security event severity levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Security event types
 */
export enum SecurityEventType {
  CRYPTO_OPERATION_SUCCESS = 'CRYPTO_OPERATION_SUCCESS',
  CRYPTO_OPERATION_FAILURE = 'CRYPTO_OPERATION_FAILURE',
  KEY_MANAGEMENT = 'KEY_MANAGEMENT',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  API_SECURITY = 'API_SECURITY',
  API_ANOMALY = 'API_ANOMALY',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  SIGNATURE_VERIFICATION = 'SIGNATURE_VERIFICATION',
  SHARE_VERIFICATION = 'SHARE_VERIFICATION',
  FORWARD_SECURE = 'FORWARD_SECURE',
  ZERO_KNOWLEDGE = 'ZERO_KNOWLEDGE'
}

/**
 * Interface for security logging
 */
export interface ISecurityLogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  critical(message: string, metadata?: Record<string, any>): void;
}

/**
 * Immutable Security Logger
 * 
 * This class provides a structured logging interface that integrates with
 * the blockchain-based immutable logging system.
 */
export class ImmutableSecurityLogger implements ISecurityLogger {
  private readonly component: string;
  
  /**
   * Create a new immutable security logger
   * 
   * @param component The component name to include in all log entries
   */
  constructor(component: string) {
    this.component = component;
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, metadata: Record<string, any> = {}): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  /**
   * Log an informational message
   */
  public info(message: string, metadata: Record<string, any> = {}): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, metadata: Record<string, any> = {}): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  /**
   * Log an error message
   */
  public error(message: string, metadata: Record<string, any> = {}): void {
    this.log(LogLevel.ERROR, message, metadata);
  }
  
  /**
   * Log a critical message
   */
  public critical(message: string, metadata: Record<string, any> = {}): void {
    this.log(LogLevel.CRITICAL, message, metadata);
  }
  
  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, metadata: Record<string, any>): void {
    const timestamp = Date.now();
    
    // Ensure metadata has a timestamp
    if (!metadata.timestamp) {
      metadata.timestamp = timestamp;
    }
    
    // Add component to metadata
    metadata.component = this.component;
    
    // Determine the security event type based on the metadata
    const eventType = this.determineEventType(metadata);
    
    // Record the security event to the blockchain
    recordSecurityEvent({
      timestamp,
      level,
      message,
      component: this.component,
      type: eventType,
      details: metadata
    });
    
    // Also log to console for debugging (can be disabled in production)
    console.log(`[${level}] [${this.component}] ${message}`, metadata);
  }
  
  /**
   * Determine the security event type based on metadata
   */
  private determineEventType(metadata: Record<string, any>): SecurityEventType {
    // If the metadata explicitly includes an event type, use that
    if (metadata.eventType && Object.values(SecurityEventType).includes(metadata.eventType)) {
      return metadata.eventType as SecurityEventType;
    }
    
    // Otherwise, try to infer the type from the metadata
    if (metadata.operation === 'ENCRYPTION' || metadata.operation === 'DECRYPTION' || 
        metadata.operation === 'SIGNATURE' || metadata.operation === 'KEY_GENERATION') {
      return metadata.error ? 
        SecurityEventType.CRYPTO_OPERATION_FAILURE : 
        SecurityEventType.CRYPTO_OPERATION_SUCCESS;
    }
    
    if (metadata.anomalyScore !== undefined) {
      return SecurityEventType.ANOMALY_DETECTED;
    }
    
    if (metadata.isValid !== undefined && metadata.signature !== undefined) {
      return SecurityEventType.SIGNATURE_VERIFICATION;
    }
    
    if (metadata.isValid !== undefined && metadata.share !== undefined) {
      return SecurityEventType.SHARE_VERIFICATION;
    }
    
    if (metadata.period !== undefined) {
      return SecurityEventType.FORWARD_SECURE;
    }
    
    if (metadata.range !== undefined) {
      return SecurityEventType.ZERO_KNOWLEDGE;
    }
    
    // Default to API security for unclassified events
    return SecurityEventType.API_SECURITY;
  }
}