/**
 * ValidationFallbackHandler
 * 
 * This module provides fallback mechanisms for the validation system,
 * ensuring that the application can continue functioning even when
 * validation services experience issues or failures.
 */

import secureLogger from '../../utils/secureLogger';
import { ValidationErrorCategory, ValidationErrorSeverity } from '../error/ValidationErrorCategory';
import { securityConfig } from '../config/SecurityConfig';

// Configure component name for logging
const logComponent = 'ValidationFallbackHandler';

// Interface for fallback options
export interface FallbackOptions {
  // Whether to enable fallback mode
  enableFallback: boolean;
  
  // Maximum severity level that can be allowed through in fallback mode
  maxAllowedSeverity: ValidationErrorSeverity;
  
  // Categories to always block regardless of fallback mode
  alwaysBlockCategories: ValidationErrorCategory[];
  
  // Categories to always allow in fallback mode
  alwaysAllowCategories: ValidationErrorCategory[];
  
  // Whether to log detailed information in fallback mode
  detailedLogging: boolean;
  
  // Contact information for alerts
  alertContacts?: string[];
  
  // Recovery strategy: 'block' (safer) or 'allow' (more permissive)
  recoveryStrategy: 'block' | 'allow';
}

// Default fallback options
const defaultFallbackOptions: FallbackOptions = {
  enableFallback: true,
  maxAllowedSeverity: ValidationErrorSeverity.MEDIUM,
  alwaysBlockCategories: [
    ValidationErrorCategory.SECURITY_INJECTION,
    ValidationErrorCategory.SECURITY_XSS,
    ValidationErrorCategory.AI_THREAT_DETECTED
  ],
  alwaysAllowCategories: [
    ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
    ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR
  ],
  detailedLogging: true,
  recoveryStrategy: 'block'
};

// Singleton class for managing validation fallbacks
export class ValidationFallbackHandler {
  private options: FallbackOptions;
  private isInFallbackMode: boolean = false;
  private fallbackModeStartTime: Date | null = null;
  private failureCount: number = 0;
  private lastFailure: Date | null = null;
  private failureThreshold: number = 5;
  private recoveryCheckInterval: number = 60000; // 1 minute
  private recoveryCheckTimer: NodeJS.Timeout | null = null;
  
  constructor(options?: Partial<FallbackOptions>) {
    this.options = { ...defaultFallbackOptions, ...options };
    
    // Initialize recovery check if fallback is enabled
    if (this.options.enableFallback) {
      this.initializeRecoveryCheck();
    }
  }
  
  /**
   * Record a validation failure
   * @param error The error that occurred
   */
  public recordFailure(error: Error): void {
    this.failureCount++;
    this.lastFailure = new Date();
    
    secureLogger('warn', logComponent, 'Validation failure recorded', {
      metadata: {
        error: error.message,
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
        inFallbackMode: this.isInFallbackMode
      }
    });
    
    // Check if we should enter fallback mode
    if (!this.isInFallbackMode && this.failureCount >= this.failureThreshold && this.options.enableFallback) {
      this.enterFallbackMode();
    }
  }
  
  /**
   * Enter fallback mode
   */
  public enterFallbackMode(): void {
    if (this.isInFallbackMode) {
      return; // Already in fallback mode
    }
    
    this.isInFallbackMode = true;
    this.fallbackModeStartTime = new Date();
    
    secureLogger('error', logComponent, 'ENTERING VALIDATION FALLBACK MODE', {
      metadata: {
        reason: `Failure threshold exceeded (${this.failureCount} failures)`,
        fallbackModeStartTime: this.fallbackModeStartTime,
        fallbackOptions: this.options
      }
    });
    
    // Notify alert contacts
    this.sendAlerts('Validation system entered fallback mode');
    
    // Start attempting recovery if not already doing so
    this.initializeRecoveryCheck();
  }
  
  /**
   * Attempt to exit fallback mode
   */
  public attemptRecovery(): void {
    if (!this.isInFallbackMode) {
      return; // Not in fallback mode
    }
    
    // Reset failure count and exit fallback mode
    this.failureCount = 0;
    this.isInFallbackMode = false;
    
    secureLogger('info', logComponent, 'EXITING VALIDATION FALLBACK MODE', {
      metadata: {
        fallbackModeDuration: this.fallbackModeStartTime 
          ? `${Math.round((Date.now() - this.fallbackModeStartTime.getTime()) / 1000 / 60)} minutes` 
          : 'Unknown',
        recoveryStrategy: this.options.recoveryStrategy
      }
    });
    
    // Notify alert contacts
    this.sendAlerts('Validation system exited fallback mode');
    
    // Clear the recovery timer
    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
      this.recoveryCheckTimer = null;
    }
    
    this.fallbackModeStartTime = null;
  }
  
  /**
   * Check if we're currently in fallback mode
   */
  public isInFallbackState(): boolean {
    return this.isInFallbackMode;
  }
  
  /**
   * Determine if a request should be allowed through based on fallback rules
   * @param errorCategory Category of the validation error
   * @param errorSeverity Severity of the validation error
   */
  public shouldAllowRequest(
    errorCategory: ValidationErrorCategory, 
    errorSeverity: ValidationErrorSeverity
  ): boolean {
    // If not in fallback mode, always block requests with errors
    if (!this.isInFallbackMode) {
      return false;
    }
    
    // Check if this category is in the always-block list
    if (this.options.alwaysBlockCategories.includes(errorCategory)) {
      return false;
    }
    
    // Check if this category is in the always-allow list
    if (this.options.alwaysAllowCategories.includes(errorCategory)) {
      return true;
    }
    
    // Apply severity-based rules
    const severityAllowed = this.getSeverityValue(errorSeverity) <= 
                           this.getSeverityValue(this.options.maxAllowedSeverity);
    
    // Log decision in fallback mode
    if (this.options.detailedLogging) {
      secureLogger('info', logComponent, `Fallback mode: Request ${severityAllowed ? 'allowed' : 'blocked'}`, {
        metadata: {
          errorCategory,
          errorSeverity,
          maxAllowedSeverity: this.options.maxAllowedSeverity,
          reason: severityAllowed ? 
            `Severity ${errorSeverity} is allowed (max: ${this.options.maxAllowedSeverity})` : 
            `Severity ${errorSeverity} exceeds allowed maximum (${this.options.maxAllowedSeverity})`
        }
      });
    }
    
    return severityAllowed;
  }
  
  /**
   * Update fallback options
   * @param options New options to apply
   */
  public updateOptions(options: Partial<FallbackOptions>): void {
    this.options = { ...this.options, ...options };
    
    secureLogger('info', logComponent, 'Fallback options updated', {
      metadata: {
        updatedOptions: options,
        newOptions: this.options
      }
    });
    
    // Initialize recovery check if becoming enabled
    if (options.enableFallback && !this.recoveryCheckTimer) {
      this.initializeRecoveryCheck();
    }
  }
  
  /**
   * Get fallback status information
   */
  public getStatus(): {
    inFallbackMode: boolean;
    fallbackModeStartTime: Date | null;
    failureCount: number;
    lastFailure: Date | null;
    fallbackOptions: FallbackOptions;
  } {
    return {
      inFallbackMode: this.isInFallbackMode,
      fallbackModeStartTime: this.fallbackModeStartTime,
      failureCount: this.failureCount,
      lastFailure: this.lastFailure,
      fallbackOptions: { ...this.options }
    };
  }
  
  /**
   * Initialize the recovery check interval
   */
  private initializeRecoveryCheck(): void {
    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
    }
    
    this.recoveryCheckTimer = setInterval(() => {
      // Check if enough time has passed since the last failure
      const recoveryThresholdMs = 5 * 60 * 1000; // 5 minutes
      
      if (this.isInFallbackMode && this.lastFailure) {
        const timeSinceLastFailure = Date.now() - this.lastFailure.getTime();
        
        if (timeSinceLastFailure > recoveryThresholdMs) {
          secureLogger('info', logComponent, 'Attempting recovery from fallback mode', {
            metadata: {
              timeSinceLastFailure: `${Math.round(timeSinceLastFailure / 1000 / 60)} minutes`,
              recoveryThreshold: `${recoveryThresholdMs / 1000 / 60} minutes`
            }
          });
          
          // Try to exit fallback mode
          this.attemptRecovery();
        }
      }
    }, this.recoveryCheckInterval);
  }
  
  /**
   * Convert severity enum to numeric value for comparison
   */
  private getSeverityValue(severity: ValidationErrorSeverity): number {
    switch (severity) {
      case ValidationErrorSeverity.LOW:
        return 1;
      case ValidationErrorSeverity.MEDIUM:
        return 2;
      case ValidationErrorSeverity.HIGH:
        return 3;
      case ValidationErrorSeverity.CRITICAL:
        return 4;
      default:
        return 0;
    }
  }
  
  /**
   * Send alerts to configured contacts
   */
  private sendAlerts(message: string): void {
    if (!this.options.alertContacts || this.options.alertContacts.length === 0) {
      return;
    }
    
    secureLogger('info', logComponent, `Sending alerts to ${this.options.alertContacts.length} contacts`, {
      metadata: {
        message,
        alertContacts: this.options.alertContacts
      }
    });
    
    // In a real implementation, this would send emails, SMS, or other notifications
    // This is a placeholder for the actual notification mechanism
    this.options.alertContacts.forEach(contact => {
      secureLogger('info', logComponent, `Alert sent to ${contact}: ${message}`);
    });
  }
}

// Export singleton instance
export const validationFallbackHandler = new ValidationFallbackHandler();

// Initial configuration from security config
if (securityConfig.isFeatureEnabled('fallbackValidation')) {
  validationFallbackHandler.updateOptions({
    enableFallback: true,
    recoveryStrategy: securityConfig.isFeatureEnabled('performancePriority') ? 'allow' : 'block'
  });
} else {
  validationFallbackHandler.updateOptions({ enableFallback: false });
}