/**
 * Security Configuration Service
 * 
 * Provides functionality for administrators to configure security settings
 * through the Admin Portal. This service interacts with the Security Fabric
 * to manage security modes and features.
 * 
 * Features:
 * - Security mode configuration
 * - Feature-level configuration
 * - Configuration validation
 * - Configuration history
 */

import { SecurityMode, SecurityFeatures, securityFabric } from '../advanced/SecurityFabric';
import { AuditAction, AuditCategory, logAuditEvent } from '../advanced/audit/AuditLogService';
import { Request } from 'express';

// Configuration history entry
interface ConfigHistoryEntry {
  id: string;
  timestamp: number;
  userId: string;
  previousMode: SecurityMode;
  newMode: SecurityMode;
  changedFeatures?: Partial<Record<keyof SecurityFeatures, boolean>>;
}

// Configuration history (in a real implementation, would be stored in a database)
const configHistory: ConfigHistoryEntry[] = [];

/**
 * Set the security mode
 */
export function setSecurityMode(
  mode: SecurityMode,
  userId: string,
  req?: Request
): { success: boolean; mode: SecurityMode; features: SecurityFeatures } {
  try {
    // Save the previous mode for the history
    const previousMode = securityFabric.getMode();
    
    // Set the new mode
    securityFabric.setMode(mode);
    
    // Get the new configuration
    const features = securityFabric.getFeatures();
    
    // Record the configuration change in history
    const historyEntry: ConfigHistoryEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      userId,
      previousMode,
      newMode: mode
    };
    
    configHistory.unshift(historyEntry);
    if (configHistory.length > 100) {
      configHistory.pop(); // Keep only the latest 100 entries
    }
    
    // Log the change
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.SECURITY,
      'security_mode',
      {
        previousMode,
        newMode: mode
      },
      req,
      undefined,
      userId
    );
    
    return {
      success: true,
      mode,
      features
    };
  } catch (error) {
    console.error('Error setting security mode:', error);
    throw error;
  }
}

/**
 * Set a specific security feature
 */
export function setSecurityFeature(
  featureName: keyof SecurityFeatures,
  enabled: boolean,
  userId: string,
  req?: Request
): { success: boolean; features: SecurityFeatures } {
  try {
    // Save the current state for the history
    const previousMode = securityFabric.getMode();
    const previousFeatures = { ...securityFabric.getFeatures() };
    
    // Update the feature
    securityFabric.setFeature(featureName, enabled);
    
    // Get the updated features
    const features = securityFabric.getFeatures();
    
    // Record the configuration change in history
    const historyEntry: ConfigHistoryEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      userId,
      previousMode,
      newMode: previousMode, // Mode doesn't change when setting a feature
      changedFeatures: {
        [featureName]: enabled
      }
    };
    
    configHistory.unshift(historyEntry);
    if (configHistory.length > 100) {
      configHistory.pop(); // Keep only the latest 100 entries
    }
    
    // Log the change
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.SECURITY,
      'security_feature',
      {
        featureName,
        enabled,
        previousValue: previousFeatures[featureName]
      },
      req,
      undefined,
      userId
    );
    
    return {
      success: true,
      features
    };
  } catch (error) {
    console.error('Error setting security feature:', error);
    throw error;
  }
}

/**
 * Get the current security configuration
 */
export function getSecurityConfiguration(): {
  mode: SecurityMode;
  features: SecurityFeatures;
} {
  return {
    mode: securityFabric.getMode(),
    features: securityFabric.getFeatures()
  };
}

/**
 * Get configuration history
 */
export function getConfigurationHistory(
  limit: number = 10
): ConfigHistoryEntry[] {
  return configHistory.slice(0, limit);
}

/**
 * Reset security configuration to defaults
 */
export function resetSecurityConfiguration(
  userId: string,
  req?: Request
): { success: boolean; mode: SecurityMode; features: SecurityFeatures } {
  try {
    // Save the previous mode for the history
    const previousMode = securityFabric.getMode();
    
    // Reset to STANDARD mode
    securityFabric.setMode(SecurityMode.STANDARD);
    
    // Get the new configuration
    const mode = securityFabric.getMode();
    const features = securityFabric.getFeatures();
    
    // Record the configuration change in history
    const historyEntry: ConfigHistoryEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      userId,
      previousMode,
      newMode: mode
    };
    
    configHistory.unshift(historyEntry);
    if (configHistory.length > 100) {
      configHistory.pop(); // Keep only the latest 100 entries
    }
    
    // Log the change
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.SECURITY,
      'security_reset',
      {
        previousMode,
        resetToMode: mode
      },
      req,
      undefined,
      userId
    );
    
    return {
      success: true,
      mode,
      features
    };
  } catch (error) {
    console.error('Error resetting security configuration:', error);
    throw error;
  }
}

/**
 * Apply recommended security configuration based on system size and usage
 */
export function applyRecommendedConfiguration(
  systemSize: 'small' | 'medium' | 'large',
  sensitiveData: boolean,
  regulatory: boolean,
  userId: string,
  req?: Request
): { success: boolean; mode: SecurityMode; features: SecurityFeatures } {
  try {
    // Save the previous mode for the history
    const previousMode = securityFabric.getMode();
    
    // Determine recommended mode based on inputs
    let recommendedMode: SecurityMode;
    
    if (sensitiveData && regulatory) {
      // Highly sensitive data with regulatory requirements
      recommendedMode = SecurityMode.MAXIMUM;
    } else if (sensitiveData) {
      // Sensitive data without specific regulatory requirements
      recommendedMode = SecurityMode.HIGH;
    } else if (systemSize === 'large') {
      // Large system without sensitive data
      recommendedMode = SecurityMode.ENHANCED;
    } else {
      // Small/medium system without sensitive data
      recommendedMode = SecurityMode.STANDARD;
    }
    
    // Apply the recommended mode
    securityFabric.setMode(recommendedMode);
    
    // Get the new configuration
    const mode = securityFabric.getMode();
    const features = securityFabric.getFeatures();
    
    // Record the configuration change in history
    const historyEntry: ConfigHistoryEntry = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      userId,
      previousMode,
      newMode: mode
    };
    
    configHistory.unshift(historyEntry);
    if (configHistory.length > 100) {
      configHistory.pop(); // Keep only the latest 100 entries
    }
    
    // Log the change
    logAuditEvent(
      AuditAction.SECURITY_CONFIG_CHANGED,
      AuditCategory.SECURITY,
      'security_recommended',
      {
        previousMode,
        newMode: mode,
        recommendationFactors: {
          systemSize,
          sensitiveData,
          regulatory
        }
      },
      req,
      undefined,
      userId
    );
    
    return {
      success: true,
      mode,
      features
    };
  } catch (error) {
    console.error('Error applying recommended security configuration:', error);
    throw error;
  }
}

export default {
  setSecurityMode,
  setSecurityFeature,
  getSecurityConfiguration,
  getConfigurationHistory,
  resetSecurityConfiguration,
  applyRecommendedConfiguration
};