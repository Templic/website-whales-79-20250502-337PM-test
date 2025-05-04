/**
 * Security Configuration
 * 
 * This module provides configuration for the security features of the application,
 * including AI-powered security analysis, validation thresholds, and performance settings.
 */

import secureLogger from '../../utils/secureLogger';

// Define the security features interface
export interface SecurityFeatures {
  // Basic security features
  csrfProtection: boolean;
  rateLimiting: boolean;
  inputValidation: boolean;
  xssProtection: boolean;
  sqlInjectionProtection: boolean;
  
  // Advanced security features
  aiSecurityAnalysis: boolean;
  fallbackValidation: boolean;
  aiValidationThreshold: number;
  performancePriority: boolean;
  secureLogging: boolean;
  
  // Authentication features
  mfa: boolean;
  passwordPolicies: boolean;
  sessionTimeout: number; // minutes
  
  // Monitoring features
  auditLogging: boolean;
  threatDetection: boolean;
}

// Default settings
const defaultFeatures: SecurityFeatures = {
  // Basic security features
  csrfProtection: true,
  rateLimiting: true,
  inputValidation: true,
  xssProtection: true,
  sqlInjectionProtection: true,
  
  // Advanced security features
  aiSecurityAnalysis: process.env.OPENAI_API_KEY ? true : false, // Enable if API key is present
  fallbackValidation: true,
  aiValidationThreshold: 0.7, // 0-1 scale, higher is more strict
  performancePriority: false,
  secureLogging: true,
  
  // Authentication features
  mfa: false, // Disabled by default
  passwordPolicies: true,
  sessionTimeout: 60, // 60 minutes
  
  // Monitoring features
  auditLogging: true,
  threatDetection: true
};

// Type definition for change listeners
type SecurityConfigChangeListener = (features: SecurityFeatures) => void;

// Singleton configuration class
class SecurityConfig {
  private features: SecurityFeatures;
  private changeListeners: SecurityConfigChangeListener[] = [];
  
  constructor() {
    this.features = { ...defaultFeatures };
    this.loadEnvironmentOverrides();
  }
  
  /**
   * Load overrides from environment variables
   */
  private loadEnvironmentOverrides() {
    // Basic security features
    if (process.env.SECURITY_CSRF_PROTECTION) {
      this.features.csrfProtection = process.env.SECURITY_CSRF_PROTECTION === 'true';
    }
    
    if (process.env.SECURITY_RATE_LIMITING) {
      this.features.rateLimiting = process.env.SECURITY_RATE_LIMITING === 'true';
    }
    
    // Advanced security features
    if (process.env.SECURITY_AI_ANALYSIS) {
      this.features.aiSecurityAnalysis = process.env.SECURITY_AI_ANALYSIS === 'true';
    }
    
    if (process.env.SECURITY_FALLBACK_VALIDATION) {
      this.features.fallbackValidation = process.env.SECURITY_FALLBACK_VALIDATION === 'true';
    }
    
    if (process.env.SECURITY_AI_THRESHOLD) {
      const threshold = parseFloat(process.env.SECURITY_AI_THRESHOLD);
      if (!isNaN(threshold) && threshold >= 0 && threshold <= 1) {
        this.features.aiValidationThreshold = threshold;
      }
    }
    
    if (process.env.SECURITY_PERFORMANCE_PRIORITY) {
      this.features.performancePriority = process.env.SECURITY_PERFORMANCE_PRIORITY === 'true';
    }
    
    // Authentication features
    if (process.env.SECURITY_MFA) {
      this.features.mfa = process.env.SECURITY_MFA === 'true';
    }
    
    if (process.env.SECURITY_SESSION_TIMEOUT) {
      const timeout = parseInt(process.env.SECURITY_SESSION_TIMEOUT, 10);
      if (!isNaN(timeout) && timeout > 0) {
        this.features.sessionTimeout = timeout;
      }
    }
  }
  
  /**
   * Get all security features
   */
  public getSecurityFeatures(): SecurityFeatures {
    return { ...this.features };
  }
  
  /**
   * Update security features
   */
  public updateSecurityFeatures(updates: Partial<SecurityFeatures>): SecurityFeatures {
    this.features = {
      ...this.features,
      ...updates
    };
    
    // Notify listeners about the changes
    this.notifyChangeListeners();
    
    return this.getSecurityFeatures();
  }
  
  /**
   * Enable a specific security feature
   */
  public enableFeature(feature: keyof SecurityFeatures): void {
    if (typeof this.features[feature] === 'boolean') {
      // Use type assertion with unknown as intermediate step to satisfy TypeScript
      this.features[feature] = true as unknown as typeof this.features[typeof feature];
      this.notifyChangeListeners();
    }
  }
  
  /**
   * Disable a specific security feature
   */
  public disableFeature(feature: keyof SecurityFeatures): void {
    if (typeof this.features[feature] === 'boolean') {
      // Use type assertion with unknown as intermediate step to satisfy TypeScript
      this.features[feature] = false as unknown as typeof this.features[typeof feature];
      this.notifyChangeListeners();
    }
  }
  
  /**
   * Check if a specific security feature is enabled
   */
  public isFeatureEnabled(feature: keyof SecurityFeatures): boolean {
    return typeof this.features[feature] === 'boolean' ? !!this.features[feature] : false;
  }
  
  /**
   * Add a change listener to be notified when security features are updated
   */
  public addChangeListener(listener: SecurityConfigChangeListener): void {
    this.changeListeners.push(listener);
  }
  
  /**
   * Remove a change listener
   */
  public removeChangeListener(listener: SecurityConfigChangeListener): void {
    const index = this.changeListeners.indexOf(listener);
    if (index !== -1) {
      this.changeListeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of changes to security features
   * This is called internally after any updates to the features
   */
  private notifyChangeListeners(): void {
    const features = this.getSecurityFeatures();
    for (const listener of this.changeListeners) {
      try {
        listener(features);
      } catch (error) {
        secureLogger('error', 'SecurityConfig', 'Error in security config change listener', {
          metadata: {
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  }
}

// Export a singleton instance
export const securityConfig = new SecurityConfig();