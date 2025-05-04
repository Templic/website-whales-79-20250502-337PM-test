/**
 * Validation System Integration Test
 * 
 * This module provides automated tests for the validation system,
 * including the error categorization, fallback mechanisms, and notification systems.
 */

import { z } from 'zod';
import { ValidationErrorCategory, ValidationErrorSeverity, enhanceValidationError } from '../error/ValidationErrorCategory';
import { validationFallbackHandler } from '../fallback/ValidationFallbackHandler';
import { validationAlertSystem, AlertType } from '../notification/ValidationAlertSystem';
import { validationRuleVersioning } from '../versioning/ValidationRuleVersioning';
import secureLogger from '../../utils/secureLogger';

// Configure component name for logging
const logComponent = 'ValidationSystemTest';

/**
 * Run a comprehensive test of the validation system
 */
export async function runValidationSystemTest(): Promise<{
  success: boolean;
  results: {
    errorCategorization: boolean;
    fallbackMechanism: boolean;
    notificationSystem: boolean;
    ruleVersioning: boolean;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const results = {
    errorCategorization: false,
    fallbackMechanism: false,
    notificationSystem: false,
    ruleVersioning: false
  };
  
  secureLogger('info', logComponent, 'Starting validation system integration test');
  
  try {
    // Test error categorization
    results.errorCategorization = testErrorCategorization();
    
    // Test fallback mechanism
    results.fallbackMechanism = testFallbackMechanism();
    
    // Test notification system
    results.notificationSystem = testNotificationSystem();
    
    // Test rule versioning
    results.ruleVersioning = testRuleVersioning();
    
    // Calculate overall success
    const success = Object.values(results).every(result => result);
    
    secureLogger('info', logComponent, `Validation system test completed`, {
      metadata: {
        success,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
    return {
      success,
      results,
      errors
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Unexpected error: ${errorMessage}`);
    
    secureLogger('error', logComponent, 'Validation system test failed with unexpected error', {
      metadata: {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    return {
      success: false,
      results,
      errors
    };
  }
  
  /**
   * Test error categorization functionality
   */
  function testErrorCategorization(): boolean {
    try {
      secureLogger('info', logComponent, 'Testing error categorization system');
      
      // Test schema validation error categorization
      const schemaError = {
        code: 'invalid_type',
        message: 'Expected string, received number'
      };
      
      const enhancedSchemaError = enhanceValidationError(schemaError);
      
      if (enhancedSchemaError.type !== ValidationErrorCategory.SCHEMA_TYPE_ERROR) {
        errors.push(`Expected schema error to be categorized as SCHEMA_TYPE_ERROR, got ${enhancedSchemaError.type}`);
        return false;
      }
      
      if (enhancedSchemaError.severity !== ValidationErrorSeverity.MEDIUM) {
        errors.push(`Expected schema error severity to be MEDIUM, got ${enhancedSchemaError.severity}`);
        return false;
      }
      
      // Test security error categorization
      const securityError = {
        code: 'sql_injection',
        message: 'Potential SQL injection detected'
      };
      
      const enhancedSecurityError = enhanceValidationError(securityError);
      
      if (enhancedSecurityError.type !== ValidationErrorCategory.SECURITY_INJECTION) {
        errors.push(`Expected security error to be categorized as SECURITY_INJECTION, got ${enhancedSecurityError.type}`);
        return false;
      }
      
      if (enhancedSecurityError.severity !== ValidationErrorSeverity.CRITICAL) {
        errors.push(`Expected security error severity to be CRITICAL, got ${enhancedSecurityError.severity}`);
        return false;
      }
      
      // Test pattern-based categorization
      const patternError = {
        code: 'unknown',
        message: 'Cross-site scripting vulnerability detected in input'
      };
      
      const enhancedPatternError = enhanceValidationError(patternError);
      
      if (enhancedPatternError.type !== ValidationErrorCategory.SECURITY_XSS) {
        errors.push(`Expected pattern error to be categorized as SECURITY_XSS, got ${enhancedPatternError.type}`);
        return false;
      }
      
      secureLogger('info', logComponent, 'Error categorization system test passed');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Error in categorization test: ${errorMessage}`);
      
      secureLogger('error', logComponent, 'Error categorization test failed', {
        metadata: {
          error: errorMessage
        }
      });
      
      return false;
    }
  }
  
  /**
   * Test fallback mechanism functionality
   */
  function testFallbackMechanism(): boolean {
    try {
      secureLogger('info', logComponent, 'Testing fallback mechanism');
      
      // Reset fallback state
      validationFallbackHandler.updateOptions({
        enableFallback: true,
        maxAllowedSeverity: ValidationErrorSeverity.MEDIUM,
        alwaysBlockCategories: [
          ValidationErrorCategory.SECURITY_INJECTION,
          ValidationErrorCategory.SECURITY_XSS
        ],
        alwaysAllowCategories: [
          ValidationErrorCategory.SCHEMA_FORMAT_ERROR
        ]
      });
      
      // Check initial state
      if (validationFallbackHandler.isInFallbackState()) {
        errors.push('Fallback handler should not be in fallback mode initially');
        return false;
      }
      
      // Simulate failures to trigger fallback mode
      for (let i = 0; i < 6; i++) {
        validationFallbackHandler.recordFailure(new Error(`Test error ${i + 1}`));
      }
      
      // Check if fallback mode was entered
      if (!validationFallbackHandler.isInFallbackState()) {
        errors.push('Fallback handler should be in fallback mode after 6 failures');
        return false;
      }
      
      // Test blocking rules
      const shouldBlock = validationFallbackHandler.shouldAllowRequest(
        ValidationErrorCategory.SECURITY_INJECTION,
        ValidationErrorSeverity.HIGH
      );
      
      if (shouldBlock) {
        errors.push('Fallback handler should block SECURITY_INJECTION category');
        return false;
      }
      
      // Test allowing rules
      const shouldAllow = validationFallbackHandler.shouldAllowRequest(
        ValidationErrorCategory.SCHEMA_FORMAT_ERROR,
        ValidationErrorSeverity.HIGH
      );
      
      if (!shouldAllow) {
        errors.push('Fallback handler should allow SCHEMA_FORMAT_ERROR category');
        return false;
      }
      
      // Test severity rules
      const shouldAllowMedium = validationFallbackHandler.shouldAllowRequest(
        ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
        ValidationErrorSeverity.MEDIUM
      );
      
      if (!shouldAllowMedium) {
        errors.push('Fallback handler should allow MEDIUM severity errors');
        return false;
      }
      
      const shouldBlockHigh = validationFallbackHandler.shouldAllowRequest(
        ValidationErrorCategory.SCHEMA_CONSTRAINT_ERROR,
        ValidationErrorSeverity.HIGH
      );
      
      if (shouldBlockHigh) {
        errors.push('Fallback handler should block HIGH severity errors');
        return false;
      }
      
      // Attempt recovery
      validationFallbackHandler.attemptRecovery();
      
      // Check if exited fallback mode
      if (validationFallbackHandler.isInFallbackState()) {
        errors.push('Fallback handler should have exited fallback mode after recovery');
        return false;
      }
      
      secureLogger('info', logComponent, 'Fallback mechanism test passed');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Error in fallback test: ${errorMessage}`);
      
      secureLogger('error', logComponent, 'Fallback mechanism test failed', {
        metadata: {
          error: errorMessage
        }
      });
      
      return false;
    }
  }
  
  /**
   * Test notification system functionality
   */
  function testNotificationSystem(): boolean {
    try {
      secureLogger('info', logComponent, 'Testing notification system');
      
      // Configure alert system for testing
      validationAlertSystem.updateConfig({
        enabled: true,
        alertThrottling: {
          enabled: false,
          maxAlertsPerMinute: 1000,
          groupSimilarAlerts: false,
          silenceDuration: 0
        }
      });
      
      // Get initial alert count
      const initialStatus = validationAlertSystem.getStatus();
      const initialAlertCount = initialStatus.totalAlerts;
      
      // Send test alerts
      const alertId1 = validationAlertSystem.sendAlert(
        AlertType.VALIDATION_FAILURE,
        'Test validation failure',
        { test: true },
        ValidationErrorCategory.SCHEMA_TYPE_ERROR,
        ValidationErrorSeverity.MEDIUM
      );
      
      const alertId2 = validationAlertSystem.sendAlert(
        AlertType.SECURITY_THREAT,
        'Test security threat',
        { test: true },
        ValidationErrorCategory.SECURITY_XSS,
        ValidationErrorSeverity.CRITICAL
      );
      
      if (!alertId1 || !alertId2) {
        errors.push('Failed to send test alerts');
        return false;
      }
      
      // Check if alerts were recorded
      const newStatus = validationAlertSystem.getStatus();
      
      if (newStatus.totalAlerts !== initialAlertCount + 2) {
        errors.push(`Expected ${initialAlertCount + 2} alerts, got ${newStatus.totalAlerts}`);
        return false;
      }
      
      // Check active alerts
      const activeAlerts = validationAlertSystem.getActiveAlerts();
      
      if (activeAlerts.length !== newStatus.activeAlerts) {
        errors.push(`Status reports ${newStatus.activeAlerts} active alerts, but getActiveAlerts() returned ${activeAlerts.length}`);
        return false;
      }
      
      // Resolve an alert
      const resolved = validationAlertSystem.resolveAlert(alertId1 as string, 'test-user', 'Test resolution');
      
      if (!resolved) {
        errors.push(`Failed to resolve alert ${alertId1}`);
        return false;
      }
      
      // Check alert by ID
      const alert = validationAlertSystem.getAlert(alertId1 as string);
      
      if (!alert) {
        errors.push(`Failed to get alert by ID ${alertId1}`);
        return false;
      }
      
      if (!alert.resolved) {
        errors.push(`Alert ${alertId1} should be marked as resolved`);
        return false;
      }
      
      secureLogger('info', logComponent, 'Notification system test passed');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Error in notification test: ${errorMessage}`);
      
      secureLogger('error', logComponent, 'Notification system test failed', {
        metadata: {
          error: errorMessage
        }
      });
      
      return false;
    }
  }
  
  /**
   * Test rule versioning functionality
   */
  function testRuleVersioning(): boolean {
    try {
      secureLogger('info', logComponent, 'Testing rule versioning system');
      
      // Define test schemas
      const userSchemaV1 = z.object({
        username: z.string().min(3).max(20),
        email: z.string().email(),
        age: z.number().min(18).optional()
      });
      
      const userSchemaV2 = z.object({
        username: z.string().min(3).max(20),
        email: z.string().email(),
        age: z.number().min(18).optional(),
        preferences: z.object({
          theme: z.enum(['light', 'dark']).optional(),
          notifications: z.boolean().optional()
        }).optional()
      });
      
      // Register a new rule
      const rule = validationRuleVersioning.registerRule(
        'test-user-rule',
        'User Validation Rule',
        'Validates user information',
        'body',
        userSchemaV1,
        {
          category: ValidationErrorCategory.SCHEMA_TYPE_ERROR,
          tags: ['user', 'validation'],
          author: 'Test System'
        }
      );
      
      if (rule.currentVersion !== 1) {
        errors.push(`Expected initial rule version to be 1, got ${rule.currentVersion}`);
        return false;
      }
      
      // Add a new version
      const versionEntry = validationRuleVersioning.addRuleVersion(
        'test-user-rule',
        userSchemaV2,
        {
          description: 'Added preferences object',
          author: 'Test System',
          notes: 'Non-breaking change - added optional preferences',
          breaking: false,
          changeLog: 'Added optional preferences object with theme and notifications settings',
          deprecatePrevious: false
        }
      );
      
      if (versionEntry.version !== 2) {
        errors.push(`Expected new version to be 2, got ${versionEntry.version}`);
        return false;
      }
      
      // Test retrieving rule by ID
      const retrievedRule = validationRuleVersioning.getRule('test-user-rule');
      
      if (!retrievedRule) {
        errors.push('Failed to retrieve rule by ID');
        return false;
      }
      
      if (retrievedRule.currentVersion !== 2) {
        errors.push(`Expected current version to be 2, got ${retrievedRule.currentVersion}`);
        return false;
      }
      
      // Test validating against a specific version
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        age: 25
      };
      
      const validationResult = validationRuleVersioning.validate(
        'test-user-rule',
        validData,
        1 // Version 1
      );
      
      if (!validationResult.success) {
        errors.push(`Validation against version 1 failed: ${validationResult.error}`);
        return false;
      }
      
      // Test validating with new schema features
      const validDataV2 = {
        username: 'testuser',
        email: 'test@example.com',
        age: 25,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      
      const validationResultV2 = validationRuleVersioning.validate(
        'test-user-rule',
        validDataV2,
        2 // Version 2
      );
      
      if (!validationResultV2.success) {
        errors.push(`Validation against version 2 failed: ${validationResultV2.error}`);
        return false;
      }
      
      // Test migration between versions
      const migrationResult = validationRuleVersioning.validateWithMigration(
        'test-user-rule',
        validData, // V1 data
        1, // From version 1
        2, // To version 2
        {
          strategy: 'permissive'
        }
      );
      
      if (!migrationResult.success) {
        errors.push(`Migration from version 1 to 2 failed: ${migrationResult.error}`);
        return false;
      }
      
      // Test version comparison
      const comparison = validationRuleVersioning.compareRuleVersions(
        'test-user-rule',
        1,
        2
      );
      
      if (comparison.hasBreakingChanges) {
        errors.push('Version comparison incorrectly indicated breaking changes');
        return false;
      }
      
      if (comparison.differences.length === 0) {
        errors.push('Version comparison should have found differences');
        return false;
      }
      
      secureLogger('info', logComponent, 'Rule versioning test passed');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Error in rule versioning test: ${errorMessage}`);
      
      secureLogger('error', logComponent, 'Rule versioning test failed', {
        metadata: {
          error: errorMessage
        }
      });
      
      return false;
    }
  }
}

// Export additional test functions for individual components
export function testErrorCategorizationOnly(): boolean {
  try {
    return testErrorCategorization();
  } catch (error) {
    secureLogger('error', logComponent, 'Error categorization test failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return false;
  }
  
  function testErrorCategorization(): boolean {
    // Schema error test
    const schemaError = {
      code: 'invalid_type',
      message: 'Expected string, received number'
    };
    
    const enhancedSchemaError = enhanceValidationError(schemaError);
    
    if (enhancedSchemaError.type !== ValidationErrorCategory.SCHEMA_TYPE_ERROR) {
      return false;
    }
    
    // Security error test
    const securityError = {
      code: 'sql_injection',
      message: 'Potential SQL injection detected'
    };
    
    const enhancedSecurityError = enhanceValidationError(securityError);
    
    if (enhancedSecurityError.type !== ValidationErrorCategory.SECURITY_INJECTION) {
      return false;
    }
    
    return true;
  }
}

export function testFallbackMechanismOnly(): boolean {
  try {
    // Reset fallback state
    validationFallbackHandler.updateOptions({
      enableFallback: true,
      maxAllowedSeverity: ValidationErrorSeverity.MEDIUM
    });
    
    // Check initial state
    if (validationFallbackHandler.isInFallbackState()) {
      return false;
    }
    
    // Simulate failures to trigger fallback mode
    for (let i = 0; i < 6; i++) {
      validationFallbackHandler.recordFailure(new Error(`Test error ${i + 1}`));
    }
    
    // Check if fallback mode was entered
    if (!validationFallbackHandler.isInFallbackState()) {
      return false;
    }
    
    // Attempt recovery
    validationFallbackHandler.attemptRecovery();
    
    // Check if exited fallback mode
    return !validationFallbackHandler.isInFallbackState();
  } catch (error) {
    secureLogger('error', logComponent, 'Fallback mechanism test failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return false;
  }
}

export function testNotificationSystemOnly(): boolean {
  try {
    // Configure alert system for testing
    validationAlertSystem.updateConfig({
      enabled: true,
      alertThrottling: {
        enabled: false,
        maxAlertsPerMinute: 1000,
        groupSimilarAlerts: false,
        silenceDuration: 0
      }
    });
    
    // Send test alert
    const alertId = validationAlertSystem.sendAlert(
      AlertType.VALIDATION_FAILURE,
      'Test validation failure',
      { test: true }
    );
    
    if (!alertId) {
      return false;
    }
    
    // Resolve the alert
    return validationAlertSystem.resolveAlert(alertId, 'test-user', 'Test resolution');
  } catch (error) {
    secureLogger('error', logComponent, 'Notification system test failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return false;
  }
}

export function testRuleVersioningOnly(): boolean {
  try {
    // Define test schema
    const testSchema = z.object({
      name: z.string().min(2)
    });
    
    // Generate a unique rule ID to avoid conflicts
    const ruleId = `test-rule-${Date.now()}`;
    
    // Register a new rule
    const rule = validationRuleVersioning.registerRule(
      ruleId,
      'Test Rule',
      'Test description',
      'body',
      testSchema
    );
    
    // Verify rule was registered
    const retrievedRule = validationRuleVersioning.getRule(ruleId);
    
    return !!retrievedRule && retrievedRule.currentVersion === 1;
  } catch (error) {
    secureLogger('error', logComponent, 'Rule versioning test failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return false;
  }
}