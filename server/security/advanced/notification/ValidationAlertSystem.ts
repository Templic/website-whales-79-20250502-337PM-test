/**
 * Validation Alert System
 * 
 * This module provides a notification system for validation errors and security events,
 * enabling real-time alerts and monitoring of the validation system's health.
 */

import secureLogger from '../../utils/secureLogger';
import { ValidationErrorCategory, ValidationErrorSeverity } from '../error/ValidationErrorCategory';
import { securityConfig } from '../config/SecurityConfig';

// Configure component name for logging
const logComponent = 'ValidationAlertSystem';

// Alert levels
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Alert types
export enum AlertType {
  VALIDATION_FAILURE = 'validation_failure',
  SYSTEM_ERROR = 'system_error',
  SECURITY_THREAT = 'security_threat',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  FALLBACK_MODE = 'fallback_mode',
  PERFORMANCE_DEGRADATION = 'performance_degradation'
}

// Alert interface
export interface ValidationAlert {
  id: string;
  timestamp: Date;
  level: AlertLevel;
  type: AlertType;
  message: string;
  source: string;
  details?: Record<string, any>;
  errorCategory?: ValidationErrorCategory;
  errorSeverity?: ValidationErrorSeverity;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
}

// Alert destination interface
export interface AlertDestination {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'console' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
  alertTypes: AlertType[];
  minLevel: AlertLevel;
}

// Alert rate limiting
interface AlertRateLimit {
  type: AlertType;
  count: number;
  firstOccurrence: Date;
  lastSent: Date;
}

// Alert system configuration
export interface AlertSystemConfig {
  enabled: boolean;
  destinations: AlertDestination[];
  alertThrottling: {
    enabled: boolean;
    maxAlertsPerMinute: number;
    groupSimilarAlerts: boolean;
    silenceDuration: number; // milliseconds
  };
  retentionDays: number;
}

// Default configuration
const defaultAlertConfig: AlertSystemConfig = {
  enabled: true,
  destinations: [
    {
      name: 'Console',
      type: 'console',
      enabled: true,
      config: {},
      alertTypes: Object.values(AlertType),
      minLevel: AlertLevel.INFO
    }
  ],
  alertThrottling: {
    enabled: true,
    maxAlertsPerMinute: 10,
    groupSimilarAlerts: true,
    silenceDuration: 5 * 60 * 1000 // 5 minutes
  },
  retentionDays: 30
};

// Map error severity to alert level
function mapSeverityToAlertLevel(severity: ValidationErrorSeverity): AlertLevel {
  switch (severity) {
    case ValidationErrorSeverity.CRITICAL:
      return AlertLevel.CRITICAL;
    case ValidationErrorSeverity.HIGH:
      return AlertLevel.ERROR;
    case ValidationErrorSeverity.MEDIUM:
      return AlertLevel.WARNING;
    case ValidationErrorSeverity.LOW:
    default:
      return AlertLevel.INFO;
  }
}

// Singleton class for managing validation alerts
export class ValidationAlertSystem {
  private config: AlertSystemConfig;
  private alerts: ValidationAlert[] = [];
  private rateLimits: Map<string, AlertRateLimit> = new Map();
  private alertCounter: number = 0;
  
  constructor(config?: Partial<AlertSystemConfig>) {
    this.config = { ...defaultAlertConfig, ...(config || {}) };
    this.cleanupAlertsInterval();
  }
  
  /**
   * Generate a new alert and send it to configured destinations
   */
  public sendAlert(
    type: AlertType,
    message: string,
    details?: Record<string, any>,
    errorCategory?: ValidationErrorCategory,
    errorSeverity?: ValidationErrorSeverity
  ): string | null {
    if (!this.config.enabled) {
      return null;
    }
    
    // Determine alert level
    let level = AlertLevel.INFO;
    if (errorSeverity) {
      level = mapSeverityToAlertLevel(errorSeverity);
    } else if (type === AlertType.SECURITY_THREAT) {
      level = AlertLevel.CRITICAL;
    } else if (type === AlertType.SYSTEM_ERROR || type === AlertType.FALLBACK_MODE) {
      level = AlertLevel.ERROR;
    } else if (type === AlertType.THRESHOLD_EXCEEDED) {
      level = AlertLevel.WARNING;
    }
    
    // Check rate limiting
    if (this.config.alertThrottling.enabled) {
      const alertKey = `${type}:${level}:${errorCategory || ''}`;
      if (this.isRateLimited(alertKey)) {
        secureLogger('info', logComponent, `Alert throttled: ${message}`, {
          metadata: {
            type,
            level,
            errorCategory
          }
        });
        return null;
      }
    }
    
    // Create the alert
    const alertId = this.generateAlertId();
    const alert: ValidationAlert = {
      id: alertId,
      timestamp: new Date(),
      level,
      type,
      message,
      source: 'validation-system',
      details,
      errorCategory,
      errorSeverity,
      resolved: false
    };
    
    // Save the alert
    this.alerts.push(alert);
    
    // Send to destinations
    this.dispatchAlert(alert);
    
    return alertId;
  }
  
  /**
   * Mark an alert as resolved
   */
  public resolveAlert(alertId: string, resolvedBy: string, resolutionNote?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNote = resolutionNote;
    
    secureLogger('info', logComponent, `Alert resolved: ${alertId}`, {
      metadata: {
        alertId,
        resolvedBy,
        resolutionNote
      }
    });
    
    return true;
  }
  
  /**
   * Get all active (unresolved) alerts
   */
  public getActiveAlerts(): ValidationAlert[] {
    return this.alerts.filter(a => !a.resolved);
  }
  
  /**
   * Get alert by ID
   */
  public getAlert(alertId: string): ValidationAlert | undefined {
    return this.alerts.find(a => a.id === alertId);
  }
  
  /**
   * Get alerts by type
   */
  public getAlertsByType(type: AlertType, includeResolved = false): ValidationAlert[] {
    return this.alerts.filter(a => a.type === type && (includeResolved || !a.resolved));
  }
  
  /**
   * Update alert system configuration
   */
  public updateConfig(config: Partial<AlertSystemConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      destinations: config.destinations || this.config.destinations,
      alertThrottling: {
        ...this.config.alertThrottling,
        ...(config.alertThrottling || {})
      }
    };
    
    secureLogger('info', logComponent, 'Alert system configuration updated', {
      metadata: {
        updatedConfig: config
      }
    });
  }
  
  /**
   * Add a new alert destination
   */
  public addDestination(destination: AlertDestination): void {
    // Check if destination with same name already exists
    const existingIndex = this.config.destinations.findIndex(d => d.name === destination.name);
    if (existingIndex >= 0) {
      this.config.destinations[existingIndex] = destination;
    } else {
      this.config.destinations.push(destination);
    }
    
    secureLogger('info', logComponent, `Alert destination added: ${destination.name}`, {
      metadata: {
        destination
      }
    });
  }
  
  /**
   * Remove an alert destination
   */
  public removeDestination(name: string): boolean {
    const initialLength = this.config.destinations.length;
    this.config.destinations = this.config.destinations.filter(d => d.name !== name);
    
    const removed = initialLength > this.config.destinations.length;
    if (removed) {
      secureLogger('info', logComponent, `Alert destination removed: ${name}`);
    }
    
    return removed;
  }
  
  /**
   * Get alert system status and statistics
   */
  public getStatus(): {
    enabled: boolean;
    totalAlerts: number;
    activeAlerts: number;
    alertsByLevel: Record<AlertLevel, number>;
    alertsByType: Record<AlertType, number>;
    destinations: { name: string; type: string; enabled: boolean }[];
  } {
    const alertsByLevel: Record<AlertLevel, number> = {
      [AlertLevel.INFO]: 0,
      [AlertLevel.WARNING]: 0,
      [AlertLevel.ERROR]: 0,
      [AlertLevel.CRITICAL]: 0
    };
    
    const alertsByType: Record<AlertType, number> = {
      [AlertType.VALIDATION_FAILURE]: 0,
      [AlertType.SYSTEM_ERROR]: 0,
      [AlertType.SECURITY_THREAT]: 0,
      [AlertType.THRESHOLD_EXCEEDED]: 0,
      [AlertType.FALLBACK_MODE]: 0,
      [AlertType.PERFORMANCE_DEGRADATION]: 0
    };
    
    // Count alerts by level and type
    this.alerts.forEach(alert => {
      alertsByLevel[alert.level]++;
      alertsByType[alert.type]++;
    });
    
    return {
      enabled: this.config.enabled,
      totalAlerts: this.alerts.length,
      activeAlerts: this.alerts.filter(a => !a.resolved).length,
      alertsByLevel,
      alertsByType,
      destinations: this.config.destinations.map(d => ({
        name: d.name,
        type: d.type,
        enabled: d.enabled
      }))
    };
  }
  
  /**
   * Generate a unique alert ID
   */
  private generateAlertId(): string {
    const timestamp = Date.now();
    const counter = ++this.alertCounter;
    return `alert-${timestamp}-${counter}`;
  }
  
  /**
   * Check if an alert is rate limited
   */
  private isRateLimited(alertKey: string): boolean {
    const now = new Date();
    const limit = this.rateLimits.get(alertKey);
    
    if (!limit) {
      // First occurrence of this alert
      this.rateLimits.set(alertKey, {
        type: alertKey.split(':')[0] as AlertType,
        count: 1,
        firstOccurrence: now,
        lastSent: now
      });
      return false;
    }
    
    // Check time since last alert
    const timeSinceLastSent = now.getTime() - limit.lastSent.getTime();
    if (timeSinceLastSent < this.config.alertThrottling.silenceDuration) {
      // Increment counter but don't send
      limit.count++;
      return true;
    }
    
    // Check rate limit
    const minutesSinceFirst = (now.getTime() - limit.firstOccurrence.getTime()) / (60 * 1000);
    const rate = limit.count / Math.max(1, minutesSinceFirst);
    
    if (rate > this.config.alertThrottling.maxAlertsPerMinute) {
      // Update count but don't send
      limit.count++;
      return true;
    }
    
    // Update rate limit info and allow the alert
    limit.count++;
    limit.lastSent = now;
    
    // Reset the window if it's been more than 5 minutes
    if (minutesSinceFirst > 5) {
      limit.count = 1;
      limit.firstOccurrence = now;
    }
    
    return false;
  }
  
  /**
   * Dispatch an alert to all configured destinations
   */
  private dispatchAlert(alert: ValidationAlert): void {
    secureLogger('info', logComponent, `Alert generated: ${alert.message}`, {
      metadata: {
        alertId: alert.id,
        level: alert.level,
        type: alert.type
      }
    });
    
    for (const destination of this.config.destinations) {
      // Skip disabled destinations or level/type mismatches
      if (
        !destination.enabled ||
        !destination.alertTypes.includes(alert.type) ||
        this.getAlertLevelValue(alert.level) < this.getAlertLevelValue(destination.minLevel)
      ) {
        continue;
      }
      
      try {
        this.sendToDestination(destination, alert);
      } catch (error) {
        secureLogger('error', logComponent, `Failed to send alert to ${destination.name}`, {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            destination: destination.name,
            alertId: alert.id
          }
        });
      }
    }
  }
  
  /**
   * Send an alert to a specific destination
   */
  private sendToDestination(destination: AlertDestination, alert: ValidationAlert): void {
    switch (destination.type) {
      case 'console':
        // Log to console based on level
        console.log(`[${alert.level.toUpperCase()}] ${alert.message}`);
        if (alert.details) {
          console.log('Details:', alert.details);
        }
        break;
        
      case 'email':
        // In a real implementation, this would send an email
        secureLogger('info', logComponent, `Would send email alert to ${destination.config.recipient}`, {
          metadata: {
            alertId: alert.id,
            subject: `[${alert.level.toUpperCase()}] Validation Alert: ${alert.type}`,
            recipient: destination.config.recipient
          }
        });
        break;
        
      case 'slack':
        // In a real implementation, this would post to Slack
        secureLogger('info', logComponent, `Would send Slack alert to ${destination.config.channel}`, {
          metadata: {
            alertId: alert.id,
            channel: destination.config.channel
          }
        });
        break;
        
      case 'webhook':
        // In a real implementation, this would send a webhook
        secureLogger('info', logComponent, `Would send webhook alert to ${destination.config.url}`, {
          metadata: {
            alertId: alert.id,
            url: destination.config.url
          }
        });
        break;
        
      case 'sms':
        // In a real implementation, this would send an SMS
        secureLogger('info', logComponent, `Would send SMS alert to ${destination.config.phoneNumber}`, {
          metadata: {
            alertId: alert.id,
            phoneNumber: destination.config.phoneNumber
          }
        });
        break;
    }
  }
  
  /**
   * Convert alert level to numeric value for comparison
   */
  private getAlertLevelValue(level: AlertLevel): number {
    switch (level) {
      case AlertLevel.CRITICAL:
        return 4;
      case AlertLevel.ERROR:
        return 3;
      case AlertLevel.WARNING:
        return 2;
      case AlertLevel.INFO:
      default:
        return 1;
    }
  }
  
  /**
   * Set up periodic cleanup of old alerts
   */
  private cleanupAlertsInterval(): void {
    setInterval(() => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      const initialCount = this.alerts.length;
      this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffDate);
      
      const removedCount = initialCount - this.alerts.length;
      if (removedCount > 0) {
        secureLogger('info', logComponent, `Cleaned up ${removedCount} old alerts`, {
          metadata: {
            retentionDays: this.config.retentionDays,
            cutoffDate,
            remainingAlerts: this.alerts.length
          }
        });
      }
    }, 24 * 60 * 60 * 1000); // Run once per day
  }
}

// Export singleton instance
export const validationAlertSystem = new ValidationAlertSystem();

// Initialize from security config
validationAlertSystem.updateConfig({
  enabled: securityConfig.isFeatureEnabled('secureLogging')
});