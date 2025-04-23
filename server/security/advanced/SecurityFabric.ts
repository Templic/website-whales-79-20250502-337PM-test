/**
 * Security Fabric
 * 
 * This module provides a centralized event bus for security events
 * that allows different security components to communicate with each other.
 */

import { EventEmitter } from 'events';
import { securityBlockchain } from './blockchain/ImmutableSecurityLogs';
import { SecurityEventSeverity, SecurityEventCategory } from './blockchain/SecurityEventTypes';

/**
 * Security fabric event types
 */
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'security:authentication:failure',
  AUTHENTICATION_SUCCESS = 'security:authentication:success',
  AUTHORIZATION_FAILURE = 'security:authorization:failure',
  AUTHORIZATION_SUCCESS = 'security:authorization:success',
  ANOMALY_DETECTED = 'security:anomaly:detected',
  ATTACK_DETECTED = 'security:attack:detected',
  ATTACK_MITIGATED = 'security:attack:mitigated',
  SCAN_STARTED = 'security:scan:started',
  SCAN_COMPLETED = 'security:scan:completed',
  SCAN_FINDING = 'security:scan:finding',
  CONFIGURATION_CHANGED = 'security:configuration:changed',
}

/**
 * Security fabric events
 */
export interface SecurityEvents {
  [SecurityEventType.AUTHENTICATION_FAILURE]: {
    userId?: string | number;
    username?: string;
    reason: string;
    sourceIp?: string;
    timestamp: Date;
  };
  [SecurityEventType.AUTHENTICATION_SUCCESS]: {
    userId: string | number;
    username: string;
    sourceIp?: string;
    timestamp: Date;
  };
  [SecurityEventType.AUTHORIZATION_FAILURE]: {
    userId?: string | number;
    username?: string;
    resource: string;
    action: string;
    reason: string;
    sourceIp?: string;
    timestamp: Date;
  };
  [SecurityEventType.AUTHORIZATION_SUCCESS]: {
    userId: string | number;
    username: string;
    resource: string;
    action: string;
    sourceIp?: string;
    timestamp: Date;
  };
  [SecurityEventType.ANOMALY_DETECTED]: {
    type: string;
    details: string;
    score: number;
    sourceIp?: string;
    path?: string;
    method?: string;
    timestamp: Date;
  };
  [SecurityEventType.ATTACK_DETECTED]: {
    type: string;
    details: string;
    severity: string;
    sourceIp?: string;
    path?: string;
    method?: string;
    timestamp: Date;
  };
  [SecurityEventType.ATTACK_MITIGATED]: {
    type: string;
    details: string;
    mitigation: string;
    sourceIp?: string;
    path?: string;
    method?: string;
    timestamp: Date;
  };
  [SecurityEventType.SCAN_STARTED]: {
    scanId: string;
    scanType: string;
    timestamp: Date;
  };
  [SecurityEventType.SCAN_COMPLETED]: {
    scanId: string;
    scanType: string;
    findings: number;
    duration: number;
    timestamp: Date;
  };
  [SecurityEventType.SCAN_FINDING]: {
    scanId: string;
    findingId: string;
    severity: string;
    title: string;
    description: string;
    location?: string;
    timestamp: Date;
  };
  [SecurityEventType.CONFIGURATION_CHANGED]: {
    setting: string;
    oldValue: any;
    newValue: any;
    changedBy?: string;
    timestamp: Date;
  };
  'security:maximum-security:enabled': {
    options: any;
    timestamp: Date;
  };
}

/**
 * Security fabric class
 */
class SecurityFabric {
  private emitter = new EventEmitter();
  private components: Map<string, any> = new Map();
  
  /**
   * Register a security component
   */
  public registerComponent(name: string, component: any): void {
    this.components.set(name, component);
    console.log(`[SECURITY-FABRIC] Registered component: ${name}`);
  }
  
  /**
   * Get a registered security component
   */
  public getComponent(name: string): any {
    return this.components.get(name);
  }
  
  /**
   * Register an event listener
   */
  public on<T extends keyof SecurityEvents>(
    event: T,
    listener: (data: SecurityEvents[T]) => void
  ): void {
    this.emitter.on(event, listener);
  }
  
  /**
   * Register a one-time event listener
   */
  public once<T extends keyof SecurityEvents>(
    event: T,
    listener: (data: SecurityEvents[T]) => void
  ): void {
    this.emitter.once(event, listener);
  }
  
  /**
   * Remove an event listener
   */
  public off<T extends keyof SecurityEvents>(
    event: T,
    listener: (data: SecurityEvents[T]) => void
  ): void {
    this.emitter.off(event, listener);
  }
  
  /**
   * Emit an event
   */
  public emit<T extends keyof SecurityEvents>(
    event: T,
    data: SecurityEvents[T]
  ): boolean {
    // Record events in the blockchain
    this.recordSecurityEvent(event, data);
    
    return this.emitter.emit(event, data);
  }
  
  /**
   * Record a security event in the blockchain
   */
  private recordSecurityEvent<T extends keyof SecurityEvents>(
    event: T,
    data: SecurityEvents[T]
  ): void {
    // Convert event type to security event category
    let category = SecurityEventCategory.GENERAL;
    let severity = SecurityEventSeverity.INFO;
    
    if (event.includes('authentication')) {
      category = SecurityEventCategory.AUTHENTICATION;
    } else if (event.includes('authorization')) {
      category = SecurityEventCategory.AUTHORIZATION;
    } else if (event.includes('anomaly')) {
      category = SecurityEventCategory.ANOMALY_DETECTION;
    } else if (event.includes('attack')) {
      category = SecurityEventCategory.API_SECURITY;
    } else if (event.includes('scan')) {
      category = SecurityEventCategory.GENERAL;
    } else if (event.includes('configuration')) {
      category = SecurityEventCategory.GENERAL;
    } else if (event.includes('maximum-security')) {
      category = SecurityEventCategory.GENERAL;
    }
    
    // Convert event data to severity
    if (event === SecurityEventType.AUTHENTICATION_FAILURE || 
        event === SecurityEventType.AUTHORIZATION_FAILURE) {
      severity = SecurityEventSeverity.MEDIUM;
    } else if (event === SecurityEventType.ATTACK_DETECTED) {
      // @ts-ignore - Dynamic access
      if (data.severity === 'critical') {
        severity = SecurityEventSeverity.CRITICAL;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'high') {
        severity = SecurityEventSeverity.HIGH;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'medium') {
        severity = SecurityEventSeverity.MEDIUM;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'low') {
        severity = SecurityEventSeverity.LOW;
      }
    } else if (event === SecurityEventType.SCAN_FINDING) {
      // @ts-ignore - Dynamic access
      if (data.severity === 'critical') {
        severity = SecurityEventSeverity.CRITICAL;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'high') {
        severity = SecurityEventSeverity.HIGH;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'medium') {
        severity = SecurityEventSeverity.MEDIUM;
      // @ts-ignore - Dynamic access
      } else if (data.severity === 'low') {
        severity = SecurityEventSeverity.LOW;
      }
    } else if (event === SecurityEventType.ANOMALY_DETECTED) {
      // @ts-ignore - Dynamic access
      if (data.score > 0.8) {
        severity = SecurityEventSeverity.HIGH;
      // @ts-ignore - Dynamic access
      } else if (data.score > 0.5) {
        severity = SecurityEventSeverity.MEDIUM;
      } else {
        severity = SecurityEventSeverity.LOW;
      }
    }
    
    // Generate a title and description for the event
    let title = 'Security Event';
    let description = 'A security event occurred';
    
    if (event === SecurityEventType.AUTHENTICATION_FAILURE) {
      title = 'Authentication Failure';
      // @ts-ignore - Dynamic access
      description = `Authentication failed for user ${data.username || 'unknown'}: ${data.reason}`;
    } else if (event === SecurityEventType.AUTHENTICATION_SUCCESS) {
      title = 'Authentication Success';
      // @ts-ignore - Dynamic access
      description = `User ${data.username} authenticated successfully`;
    } else if (event === SecurityEventType.AUTHORIZATION_FAILURE) {
      title = 'Authorization Failure';
      // @ts-ignore - Dynamic access
      description = `User ${data.username || 'unknown'} was denied access to ${data.resource}: ${data.reason}`;
    } else if (event === SecurityEventType.AUTHORIZATION_SUCCESS) {
      title = 'Authorization Success';
      // @ts-ignore - Dynamic access
      description = `User ${data.username} was granted access to ${data.resource}`;
    } else if (event === SecurityEventType.ANOMALY_DETECTED) {
      title = 'Anomaly Detected';
      // @ts-ignore - Dynamic access
      description = `Anomaly detected: ${data.details}`;
    } else if (event === SecurityEventType.ATTACK_DETECTED) {
      title = 'Attack Detected';
      // @ts-ignore - Dynamic access
      description = `Attack detected: ${data.details}`;
    } else if (event === SecurityEventType.ATTACK_MITIGATED) {
      title = 'Attack Mitigated';
      // @ts-ignore - Dynamic access
      description = `Attack mitigated: ${data.details}`;
    } else if (event === SecurityEventType.SCAN_STARTED) {
      title = 'Security Scan Started';
      // @ts-ignore - Dynamic access
      description = `Security scan ${data.scanId} of type ${data.scanType} started`;
    } else if (event === SecurityEventType.SCAN_COMPLETED) {
      title = 'Security Scan Completed';
      // @ts-ignore - Dynamic access
      description = `Security scan ${data.scanId} of type ${data.scanType} completed with ${data.findings} findings`;
    } else if (event === SecurityEventType.SCAN_FINDING) {
      title = 'Security Scan Finding';
      // @ts-ignore - Dynamic access
      description = `Security scan ${data.scanId} found: ${data.title}`;
    } else if (event === SecurityEventType.CONFIGURATION_CHANGED) {
      title = 'Security Configuration Changed';
      // @ts-ignore - Dynamic access
      description = `Security setting ${data.setting} changed from ${data.oldValue} to ${data.newValue}`;
    } else if (event === 'security:maximum-security:enabled') {
      title = 'Maximum Security Mode Enabled';
      description = 'Maximum security mode has been enabled for the application';
    }
    
    // Record the event
    securityBlockchain.recordEvent({
      severity,
      category,
      title,
      description,
      metadata: { event, data }
    });
  }
}

// Export singleton instance
export const securityFabric = new SecurityFabric();