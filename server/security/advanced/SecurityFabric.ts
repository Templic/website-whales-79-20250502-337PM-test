/**
 * Security Fabric
 * 
 * This module provides a centralized configuration and management interface
 * for all security features in the application. It integrates all security
 * components and maintains security-wide configuration.
 * 
 * Features:
 * - Security levels configuration
 * - Event categorization
 * - Severity levels
 * - Security feature management and tracking
 */

// Define security event categories
export enum SecurityEventCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  ATTACK_ATTEMPT = 'attack_attempt',
  RATE_LIMITING = 'rate_limiting',
  API_SECURITY = 'api_security',
  MIDDLEWARE = 'middleware',
  CSRF = 'csrf',
  IP_WHITELIST = 'ip_whitelist',
  QUANTUM_ENCRYPTION = 'quantum_encryption',
  DATA_ENCRYPTION = 'data_encryption',
  RUNTIME_PROTECTION = 'runtime_protection',
  ANOMALY_DETECTION = 'anomaly_detection',
  USER_ACTION = 'user_action',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_EVENT = 'system_event',
  THREAT_DETECTED = 'threat_detected',
  SECURITY_INITIALIZATION = 'security_initialization',
  SECURITY_ERROR = 'security_error',
  REQUEST = 'request',
  AUDIT = 'audit'
}

// Define severity levels for security events
export enum SecurityEventSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  WARNING = 'warning',
  ERROR = 'error'
}

// Interface for security events
export interface SecurityEvent {
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Interface for security feature flags and configuration
export interface SecurityFeatures {
  quantumResistance: boolean;
  mlAnomalyDetection: boolean;
  blockchainLogging: boolean;
  mfa: boolean;
  csrf: boolean;
  inputValidation: boolean;
  apiSecurity: boolean;
  realTimeMonitoring: boolean;
  bruteForceProtection: boolean;
  rateLimiting: boolean;
  deepScanning: boolean;
}

// Security modes - from basic to maximum
export enum SecurityMode {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

// Security feature configurations by mode
const securityModeFeatures: Record<SecurityMode, SecurityFeatures> = {
  [SecurityMode.BASIC]: {
    quantumResistance: false,
    mlAnomalyDetection: false,
    blockchainLogging: false,
    mfa: false,
    csrf: true,
    inputValidation: true,
    apiSecurity: true,
    realTimeMonitoring: false,
    bruteForceProtection: true,
    rateLimiting: true,
    deepScanning: false
  },
  [SecurityMode.STANDARD]: {
    quantumResistance: false,
    mlAnomalyDetection: false,
    blockchainLogging: true,
    mfa: false,
    csrf: true,
    inputValidation: true,
    apiSecurity: true,
    realTimeMonitoring: true,
    bruteForceProtection: true,
    rateLimiting: true,
    deepScanning: false
  },
  [SecurityMode.ENHANCED]: {
    quantumResistance: true,
    mlAnomalyDetection: false,
    blockchainLogging: true,
    mfa: true,
    csrf: true,
    inputValidation: true,
    apiSecurity: true,
    realTimeMonitoring: true,
    bruteForceProtection: true,
    rateLimiting: true,
    deepScanning: false
  },
  [SecurityMode.HIGH]: {
    quantumResistance: true,
    mlAnomalyDetection: true,
    blockchainLogging: true,
    mfa: true,
    csrf: true,
    inputValidation: true,
    apiSecurity: true,
    realTimeMonitoring: true,
    bruteForceProtection: true,
    rateLimiting: true,
    deepScanning: false
  },
  [SecurityMode.MAXIMUM]: {
    quantumResistance: true,
    mlAnomalyDetection: true,
    blockchainLogging: true,
    mfa: true,
    csrf: true,
    inputValidation: true,
    apiSecurity: true,
    realTimeMonitoring: true,
    bruteForceProtection: true,
    rateLimiting: true,
    deepScanning: true
  }
};

// Security Fabric class
export class SecurityFabric {
  private mode: SecurityMode;
  private features: SecurityFeatures;
  private static instance: SecurityFabric;

  private constructor(mode: SecurityMode = SecurityMode.STANDARD) {
    this.mode = mode;
    this.features = { ...securityModeFeatures[mode] };
    
    // Announce the security fabric initialization
    console.log(`[SECURITY] Security fabric initialized in ${mode} mode`);
  }

  // Get the singleton instance
  public static getInstance(mode?: SecurityMode): SecurityFabric {
    if (!SecurityFabric.instance) {
      SecurityFabric.instance = new SecurityFabric(mode);
    } else if (mode && SecurityFabric.instance.mode !== mode) {
      SecurityFabric.instance.setMode(mode);
    }
    return SecurityFabric.instance;
  }

  // Set security mode
  public setMode(mode: SecurityMode): void {
    this.mode = mode;
    this.features = { ...securityModeFeatures[mode] };
    
    console.log(`[SECURITY] Security mode set to ${mode}`);
    
    // Log the mode change
    this.logSecurityEvent({
      category: SecurityEventCategory.SECURITY_INITIALIZATION,
      severity: SecurityEventSeverity.INFO,
      message: `${mode} security mode activated`,
      timestamp: Date.now(),
      metadata: {
        features: this.features
      }
    });
  }

  // Get current security mode
  public getMode(): SecurityMode {
    return this.mode;
  }

  // Get current feature configuration
  public getFeatures(): SecurityFeatures {
    return { ...this.features };
  }

  // Enable or disable a specific feature
  public setFeature(featureName: keyof SecurityFeatures, enabled: boolean): void {
    if (featureName in this.features) {
      this.features[featureName] = enabled;
      
      // Log the feature change
      this.logSecurityEvent({
        category: SecurityEventCategory.SECURITY_INITIALIZATION,
        severity: SecurityEventSeverity.INFO,
        message: `Security feature updated: ${featureName} ${enabled ? 'enabled' : 'disabled'}`,
        timestamp: Date.now(),
        metadata: {
          feature: featureName,
          enabled
        }
      });
    }
  }

  // Check if a feature is enabled
  public isFeatureEnabled(featureName: keyof SecurityFeatures): boolean {
    return this.features[featureName] === true;
  }

  // Log a security event
  private logSecurityEvent(event: SecurityEvent): void {
    // In a real implementation, this would interact with a logging system
    console.log(`[INFO] [Security:${event.category}] ${event.message}`, event.metadata || {});
  }
}

// Create and export the default security fabric instance
export const securityFabric = SecurityFabric.getInstance(SecurityMode.MAXIMUM);

// Export a convenience function for logging security events
export function logSecurityEvent(event: SecurityEvent): void {
  // In a real implementation, this would interact with a logging system
  console.log(`[INFO] [SECURITY-EVENT] ${event.category} ${JSON.stringify({
    eventId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    type: event.category,
    source: 'security_logger',
    severity: event.severity,
    ...(event.metadata || {})
  })}`);
}

export default {
  SecurityEventCategory,
  SecurityEventSeverity,
  SecurityMode,
  SecurityFabric,
  securityFabric,
  logSecurityEvent
};