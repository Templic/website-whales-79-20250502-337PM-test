/**
 * @file SecurityTelemetryCorrelator.ts
 * @description Correlates security telemetry and events from different sources for a holistic security overview
 */

import { v4 as uuidv4 } from 'uuid';
import { SecurityEvent } from '../blockchain/SecurityEvent';
import { SecurityEventTypes } from '../blockchain/SecurityEventTypes';
import { SecurityFabric } from '../SecurityFabric';
import { Logger } from '../../../utils/Logger';

/**
 * Security Telemetry Correlator
 * 
 * This class correlates security events from different sources and components
 * to provide a holistic view of the security posture and identify complex
 * patterns that might indicate sophisticated attacks or issues.
 */
export class SecurityTelemetryCorrelator {
  private initialized: boolean = false;
  private correlatorId: string = '';
  private eventBuffer: SecurityEvent[] = [];
  private maxBufferSize: number = 1000;
  private correlationRules: CorrelationRule[] = [];
  private alertHandlers: AlertHandler[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    this.correlatorId = uuidv4();
    this.initializeDefaultRules();
  }
  
  /**
   * Initialize the correlator
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    console.log('[SECURITY-TELEMETRY] Initializing security telemetry correlator');
    
    // Start processing loop
    this.processingInterval = setInterval(() => {
      this.processEventBuffer();
    }, 10000);
    
    // Log initialization
    SecurityFabric.logEvent({
      type: SecurityEventTypes.SECURITY_INITIALIZATION,
      message: 'Security telemetry correlator initialized',
      source: 'SecurityTelemetryCorrelator',
      severity: 'low',
      attributes: {
        correlatorId: this.correlatorId,
        timestamp: new Date().toISOString(),
        ruleCount: this.correlationRules.length
      }
    });
    
    this.initialized = true;
    console.log(`[SECURITY-TELEMETRY] Security telemetry correlator initialized with ID ${this.correlatorId}`);
  }
  
  /**
   * Initialize default correlation rules
   */
  private initializeDefaultRules(): void {
    // Authentication-related rules
    this.addCorrelationRule({
      id: 'AUTH_BRUTE_FORCE',
      name: 'Authentication Brute Force Detection',
      description: 'Detects multiple failed authentication attempts within a short timeframe',
      eventTypes: [SecurityEventTypes.USER_LOGIN_FAILURE],
      condition: (events) => {
        // Group by source IP and user ID
        const groupedEvents = this.groupEvents(events, (event) => 
          `${event.ipAddress || 'unknown'}_${event.userId || 'unknown'}`
        );
        
        // Check each group for threshold breach
        const alerts = [];
        for (const [key, groupEvents] of Object.entries(groupedEvents)) {
          if (groupEvents.length >= 5) {
            const [ip, user] = key.split('_');
            alerts.push({
              ruleId: 'AUTH_BRUTE_FORCE',
              severity: 'high',
              message: `Potential brute force attack detected: ${groupEvents.length} failed login attempts`,
              context: {
                ipAddress: ip,
                userId: user === 'unknown' ? undefined : user,
                attemptCount: groupEvents.length,
                timeWindow: 'last 5 minutes',
                events: groupEvents.map(e => e.id)
              }
            });
          }
        }
        
        return alerts;
      },
      timeWindow: 5 * 60 * 1000 // 5 minutes
    });
    
    // Session anomaly detection
    this.addCorrelationRule({
      id: 'SESSION_HIJACK_ATTEMPT',
      name: 'Session Hijacking Detection',
      description: 'Detects potential session hijacking attempts through IP and user agent changes',
      eventTypes: [
        SecurityEventTypes.SESSION_CREATED,
        SecurityEventTypes.DATA_ACCESS,
        SecurityEventTypes.SENSITIVE_DATA_ACCESS
      ],
      condition: (events) => {
        // Group events by session ID
        const groupedEvents = this.groupEvents(events, (event) => event.sessionId || 'unknown');
        
        const alerts = [];
        for (const [sessionId, sessionEvents] of Object.entries(groupedEvents)) {
          if (sessionId === 'unknown' || sessionEvents.length < 2) continue;
          
          // Check for IP address or user agent changes within the same session
          const ipAddresses = new Set(sessionEvents.map(e => e.ipAddress).filter(Boolean));
          const userAgents = new Set(sessionEvents.map(e => e.userAgent).filter(Boolean));
          
          if (ipAddresses.size > 1 || userAgents.size > 1) {
            alerts.push({
              ruleId: 'SESSION_HIJACK_ATTEMPT',
              severity: 'high',
              message: 'Potential session hijacking detected: IP address or user agent changed during session',
              context: {
                sessionId,
                ipAddresses: Array.from(ipAddresses),
                userAgents: Array.from(userAgents),
                events: sessionEvents.map(e => e.id)
              }
            });
          }
        }
        
        return alerts;
      },
      timeWindow: 30 * 60 * 1000 // 30 minutes
    });
    
    // Data exfiltration detection
    this.addCorrelationRule({
      id: 'DATA_EXFILTRATION',
      name: 'Data Exfiltration Detection',
      description: 'Detects potential data exfiltration through high volume of data access events',
      eventTypes: [
        SecurityEventTypes.DATA_ACCESS, 
        SecurityEventTypes.SENSITIVE_DATA_ACCESS,
        SecurityEventTypes.DATA_MODIFICATION
      ],
      condition: (events) => {
        // Group by user ID
        const groupedEvents = this.groupEvents(events, (event) => event.userId || 'unknown');
        
        const alerts = [];
        for (const [userId, userEvents] of Object.entries(groupedEvents)) {
          if (userId === 'unknown') continue;
          
          // Count data access operations
          const dataAccessCount = userEvents.filter(e => 
            e.type === SecurityEventTypes.DATA_ACCESS || 
            e.type === SecurityEventTypes.SENSITIVE_DATA_ACCESS
          ).length;
          
          // Count unique resources accessed
          const uniqueResources = new Set(
            userEvents.map(e => e.attributes?.resourceId).filter(Boolean)
          ).size;
          
          // Alert if thresholds are breached
          if (dataAccessCount > 50 || uniqueResources > 20) {
            alerts.push({
              ruleId: 'DATA_EXFILTRATION',
              severity: 'high',
              message: 'Potential data exfiltration detected: High volume of data access operations',
              context: {
                userId,
                dataAccessCount,
                uniqueResourcesCount: uniqueResources,
                timeWindow: '15 minutes',
                events: userEvents.map(e => e.id)
              }
            });
          }
        }
        
        return alerts;
      },
      timeWindow: 15 * 60 * 1000 // 15 minutes
    });
    
    // Attack chain detection
    this.addCorrelationRule({
      id: 'ATTACK_CHAIN',
      name: 'Attack Chain Detection',
      description: 'Detects potential attack chains involving multiple security events',
      eventTypes: [
        SecurityEventTypes.USER_LOGIN_FAILURE,
        SecurityEventTypes.USER_LOGIN_SUCCESS,
        SecurityEventTypes.ACCESS_DENIED,
        SecurityEventTypes.XSS_ATTEMPT_DETECTED,
        SecurityEventTypes.SQL_INJECTION_ATTEMPT,
        SecurityEventTypes.COMMAND_INJECTION_ATTEMPT,
        SecurityEventTypes.DATA_ACCESS,
        SecurityEventTypes.SENSITIVE_DATA_ACCESS,
        SecurityEventTypes.DATA_MODIFICATION,
        SecurityEventTypes.DATA_DELETION
      ],
      condition: (events) => {
        // Group by IP address
        const groupedEvents = this.groupEvents(events, (event) => event.ipAddress || 'unknown');
        
        const alerts = [];
        for (const [ip, ipEvents] of Object.entries(groupedEvents)) {
          if (ip === 'unknown') continue;
          
          // Look for patterns of escalating activity
          const hasFailedAuth = ipEvents.some(e => e.type === SecurityEventTypes.USER_LOGIN_FAILURE);
          const hasSuccessAuth = ipEvents.some(e => e.type === SecurityEventTypes.USER_LOGIN_SUCCESS);
          const hasInjectionAttempt = ipEvents.some(e => 
            e.type === SecurityEventTypes.XSS_ATTEMPT_DETECTED ||
            e.type === SecurityEventTypes.SQL_INJECTION_ATTEMPT ||
            e.type === SecurityEventTypes.COMMAND_INJECTION_ATTEMPT
          );
          const hasDataAccess = ipEvents.some(e => 
            e.type === SecurityEventTypes.DATA_ACCESS ||
            e.type === SecurityEventTypes.SENSITIVE_DATA_ACCESS
          );
          const hasDataModification = ipEvents.some(e => 
            e.type === SecurityEventTypes.DATA_MODIFICATION ||
            e.type === SecurityEventTypes.DATA_DELETION
          );
          
          // Alert on suspicious combinations of activities
          let attackScore = 0;
          if (hasFailedAuth) attackScore += 1;
          if (hasFailedAuth && hasSuccessAuth) attackScore += 2;
          if (hasInjectionAttempt) attackScore += 3;
          if (hasInjectionAttempt && hasDataAccess) attackScore += 2;
          if (hasDataModification) attackScore += 2;
          
          if (attackScore >= 5) {
            alerts.push({
              ruleId: 'ATTACK_CHAIN',
              severity: 'critical',
              message: 'Potential attack chain detected: Multiple security events indicating attack progression',
              context: {
                ipAddress: ip,
                attackScore,
                hasFailedAuth,
                hasSuccessAuth,
                hasInjectionAttempt,
                hasDataAccess,
                hasDataModification,
                timeWindow: '30 minutes',
                events: ipEvents.map(e => e.id)
              }
            });
          }
        }
        
        return alerts;
      },
      timeWindow: 30 * 60 * 1000 // 30 minutes
    });
    
    // Security control evasion detection
    this.addCorrelationRule({
      id: 'CONTROL_EVASION',
      name: 'Security Control Evasion Detection',
      description: 'Detects patterns that might indicate attempts to evade security controls',
      eventTypes: [
        SecurityEventTypes.SESSION_CREATED,
        SecurityEventTypes.ACCESS_DENIED,
        SecurityEventTypes.DATA_ACCESS,
        SecurityEventTypes.SENSITIVE_DATA_ACCESS,
        SecurityEventTypes.API_SCHEMA_VALIDATION_FAILURE,
        SecurityEventTypes.API_RATE_LIMIT_EXCEEDED
      ],
      condition: (events) => {
        // Group by user ID and IP
        const byUserEvents = this.groupEvents(events, (event) => event.userId || 'unknown');
        const byIpEvents = this.groupEvents(events, (event) => event.ipAddress || 'unknown');
        
        const alerts = [];
        
        // Check for distributed access patterns (same user, different IPs)
        for (const [userId, userEvents] of Object.entries(byUserEvents)) {
          if (userId === 'unknown') continue;
          
          const uniqueIPs = new Set(userEvents.map(e => e.ipAddress).filter(Boolean));
          if (uniqueIPs.size >= 3) {
            alerts.push({
              ruleId: 'CONTROL_EVASION',
              severity: 'medium',
              message: 'Potential security control evasion: Same user accessing from multiple IPs',
              context: {
                userId,
                ipCount: uniqueIPs.size,
                ipAddresses: Array.from(uniqueIPs),
                timeWindow: '15 minutes',
                events: userEvents.map(e => e.id)
              }
            });
          }
        }
        
        // Check for validation failures followed by successful access
        for (const [ip, ipEvents] of Object.entries(byIpEvents)) {
          if (ip === 'unknown') continue;
          
          // Order events by timestamp
          const orderedEvents = [...ipEvents].sort((a, b) => 
            (a.timestamp || 0) - (b.timestamp || 0)
          );
          
          // Look for patterns of validation failures followed by successful access
          let hasValidationFailures = false;
          let hasSuccessfulAccessAfterFailures = false;
          
          for (const event of orderedEvents) {
            if (event.type === SecurityEventTypes.API_SCHEMA_VALIDATION_FAILURE) {
              hasValidationFailures = true;
            } else if (hasValidationFailures && 
                      (event.type === SecurityEventTypes.DATA_ACCESS ||
                       event.type === SecurityEventTypes.SENSITIVE_DATA_ACCESS)) {
              hasSuccessfulAccessAfterFailures = true;
              break;
            }
          }
          
          if (hasValidationFailures && hasSuccessfulAccessAfterFailures) {
            alerts.push({
              ruleId: 'CONTROL_EVASION',
              severity: 'high',
              message: 'Potential security control evasion: Validation failures followed by successful access',
              context: {
                ipAddress: ip,
                timeWindow: '15 minutes',
                events: orderedEvents.map(e => e.id)
              }
            });
          }
        }
        
        return alerts;
      },
      timeWindow: 15 * 60 * 1000 // 15 minutes
    });
  }
  
  /**
   * Add a security event to the correlation buffer
   */
  public addEvent(event: SecurityEvent): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Add event to buffer
    this.eventBuffer.push(event);
    
    // Trim buffer if it exceeds max size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
    }
  }
  
  /**
   * Process the event buffer to identify correlated security events
   */
  private processEventBuffer(): void {
    if (this.eventBuffer.length === 0) {
      return;
    }
    
    try {
      console.log(`[SECURITY-TELEMETRY] Processing ${this.eventBuffer.length} events for correlation`);
      
      // Apply each correlation rule
      for (const rule of this.correlationRules) {
        // Filter events based on rule criteria
        const relevantEvents = this.eventBuffer.filter(event => 
          rule.eventTypes.includes(event.type) && 
          (event.timestamp || 0) > Date.now() - rule.timeWindow
        );
        
        if (relevantEvents.length === 0) {
          continue;
        }
        
        // Apply rule condition to detect correlations
        try {
          const alerts = rule.condition(relevantEvents);
          
          if (alerts && alerts.length > 0) {
            // Process and log alerts
            for (const alert of alerts) {
              this.handleAlert({
                ...alert,
                timestamp: Date.now(),
                correlatorId: this.correlatorId
              });
            }
          }
        } catch (ruleError) {
          console.error(`[SECURITY-TELEMETRY] Error applying rule ${rule.id}:`, ruleError);
        }
      }
      
      // Clean up old events
      const oldestAllowedTime = Date.now() - Math.max(
        ...this.correlationRules.map(rule => rule.timeWindow)
      );
      this.eventBuffer = this.eventBuffer.filter(
        event => (event.timestamp || 0) >= oldestAllowedTime
      );
    } catch (error) {
      console.error('[SECURITY-TELEMETRY] Error processing event buffer:', error);
    }
  }
  
  /**
   * Group events by a key function
   */
  private groupEvents<T extends SecurityEvent>(
    events: T[], 
    keyFn: (event: T) => string
  ): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    
    for (const event of events) {
      const key = keyFn(event);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    }
    
    return groups;
  }
  
  /**
   * Handle a security alert
   */
  private handleAlert(alert: SecurityAlert): void {
    // Log the alert as a security event
    SecurityFabric.logEvent({
      type: SecurityEventTypes.CORRELATION_ALERT,
      message: alert.message,
      source: 'SecurityTelemetryCorrelator',
      severity: alert.severity as any,
      attributes: {
        correlatorId: this.correlatorId,
        ruleId: alert.ruleId,
        timestamp: new Date(alert.timestamp).toISOString(),
        context: alert.context
      },
      relatedEvents: alert.context.events
    });
    
    // Log the alert
    Logger.warn(`[SECURITY-TELEMETRY] Alert: ${alert.message}`, {
      ruleId: alert.ruleId,
      severity: alert.severity,
      context: alert.context
    });
    
    // Notify all alert handlers
    for (const handler of this.alertHandlers) {
      try {
        handler(alert);
      } catch (error) {
        console.error(`[SECURITY-TELEMETRY] Error in alert handler:`, error);
      }
    }
  }
  
  /**
   * Add a correlation rule
   */
  public addCorrelationRule(rule: CorrelationRule): void {
    // Validate the rule
    if (!rule.id || !rule.name || !rule.condition || !rule.eventTypes || rule.eventTypes.length === 0) {
      throw new Error('Invalid correlation rule: missing required properties');
    }
    
    // Check if rule with same ID already exists
    const existingIndex = this.correlationRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      // Replace existing rule
      this.correlationRules[existingIndex] = rule;
    } else {
      // Add new rule
      this.correlationRules.push(rule);
    }
    
    console.log(`[SECURITY-TELEMETRY] Added correlation rule: ${rule.id}`);
  }
  
  /**
   * Remove a correlation rule
   */
  public removeCorrelationRule(ruleId: string): boolean {
    const initialLength = this.correlationRules.length;
    this.correlationRules = this.correlationRules.filter(rule => rule.id !== ruleId);
    return this.correlationRules.length < initialLength;
  }
  
  /**
   * Add an alert handler
   */
  public addAlertHandler(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }
  
  /**
   * Get all correlation rules
   */
  public getCorrelationRules(): CorrelationRule[] {
    return [...this.correlationRules];
  }
  
  /**
   * Get correlator stats
   */
  public getStats(): any {
    return {
      correlatorId: this.correlatorId,
      initialized: this.initialized,
      bufferSize: this.eventBuffer.length,
      ruleCount: this.correlationRules.length,
      handlerCount: this.alertHandlers.length
    };
  }
  
  /**
   * Shut down the correlator
   */
  public shutdown(): void {
    if (!this.initialized) {
      return;
    }
    
    // Stop processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Process any remaining events
    this.processEventBuffer();
    
    // Log shutdown
    SecurityFabric.logEvent({
      type: SecurityEventTypes.SECURITY_SHUTDOWN,
      message: 'Security telemetry correlator shutdown',
      source: 'SecurityTelemetryCorrelator',
      severity: 'low',
      attributes: {
        correlatorId: this.correlatorId,
        timestamp: new Date().toISOString()
      }
    });
    
    this.initialized = false;
    console.log('[SECURITY-TELEMETRY] Security telemetry correlator shutdown completed');
  }
}

/**
 * Correlation rule interface
 */
export interface CorrelationRule {
  id: string;
  name: string;
  description?: string;
  eventTypes: SecurityEventTypes[];
  condition: (events: SecurityEvent[]) => SecurityAlert[];
  timeWindow: number; // milliseconds
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: any;
  timestamp?: number;
  correlatorId?: string;
}

/**
 * Alert handler function type
 */
export type AlertHandler = (alert: SecurityAlert) => void;

// Export singleton instance
export const securityTelemetryCorrelator = new SecurityTelemetryCorrelator();