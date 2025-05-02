/**
 * Security Configuration Service
 * 
 * Provides centralized configuration for all security features:
 * - Feature toggles (enabling/disabling security features)
 * - Security levels (low, medium, high, custom)
 * - Custom security settings
 * - Configuration persistence
 */

import fs from 'fs';
import path from 'path';
import { db } from '../../../db';
import { securitySettings } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

// Security features that can be enabled/disabled
export interface SecurityFeatures {
  // Core security
  threatDetection: boolean;        // Detect and block threats
  realTimeMonitoring: boolean;     // Collect security metrics
  ipReputation: boolean;           // Use IP reputation data
  
  // Additional protections
  csrfProtection: boolean;         // CSRF tokens
  xssProtection: boolean;          // XSS filtering
  sqlInjectionProtection: boolean; // SQL injection protection
  rateLimiting: boolean;           // Rate limiting
  
  // Authentication security
  twoFactorAuth: boolean;          // 2FA for admin accounts
  passwordPolicies: boolean;       // Password strength requirements
  bruteForceProtection: boolean;   // Protection against brute force attacks
  
  // Advanced features
  zeroKnowledgeProofs: boolean;    // Zero-knowledge authentication
  aiThreatDetection: boolean;      // AI-powered threat detection
}

// Security level options
export type SecurityLevel = 'low' | 'medium' | 'high' | 'custom';

// Type for security configuration listeners
type ConfigChangeListener = (features: SecurityFeatures, level: SecurityLevel) => void;

/**
 * Security configuration service
 */
class SecurityConfig {
  private features: SecurityFeatures;
  private level: SecurityLevel;
  private configPath: string;
  private defaultConfigPath: string;
  private listeners: ConfigChangeListener[] = [];
  
  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'security-config.json');
    this.defaultConfigPath = path.join(process.cwd(), 'config', 'security-config.default.json');
    
    // Set default configuration
    this.features = this.getDefaultFeatures('medium');
    this.level = 'medium';
    
    // Load configuration
    this.loadConfig();
  }
  
  /**
   * Get the current security features configuration
   */
  getSecurityFeatures(): SecurityFeatures {
    return { ...this.features };
  }
  
  /**
   * Get the current security level
   */
  getSecurityLevel(): SecurityLevel {
    return this.level;
  }
  
  /**
   * Set security level
   * 
   * @param level The security level
   * @returns Promise resolving to whether the operation was successful
   */
  async setSecurityLevel(level: SecurityLevel): Promise<boolean> {
    // If setting to custom, maintain current features
    if (level === 'custom') {
      this.level = 'custom';
    } else {
      // Otherwise apply the features for this level
      this.features = this.getDefaultFeatures(level);
      this.level = level;
    }
    
    // Save configuration to database
    try {
      await this.saveConfig();
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error(`Error setting security level to ${level}:`, error);
      return false;
    }
  }
  
  /**
   * Update security features
   * 
   * @param features The features to update
   * @returns Promise resolving to whether the operation was successful
   */
  async updateSecurityFeatures(features: Partial<SecurityFeatures>): Promise<boolean> {
    // Update features
    this.features = {
      ...this.features,
      ...features
    };
    
    // Set level to custom when manually updating features
    this.level = 'custom';
    
    // Save configuration to database
    try {
      await this.saveConfig();
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error(`Error updating security features:`, error);
      return false;
    }
  }
  
  /**
   * Add a listener for configuration changes
   * 
   * @param listener The listener function
   */
  addChangeListener(listener: ConfigChangeListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a configuration change listener
   * 
   * @param listener The listener function to remove
   */
  removeChangeListener(listener: ConfigChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Load security configuration from database
   */
  private async loadConfig(): Promise<void> {
    try {
      // First try to load from database
      const settings = await db.select().from(securitySettings).limit(1);
      
      if (settings.length > 0) {
        const setting = settings[0];
        
        if (setting.value && typeof setting.value === 'string') {
          const config = JSON.parse(setting.value);
          
          if (config.features) {
            this.features = config.features;
          }
          
          if (config.level) {
            this.level = config.level;
          }
          
          console.log(`Loaded security configuration from database (level: ${this.level})`);
          return;
        }
      }
      
      // If not in database, try to load from file
      if (fs.existsSync(this.configPath)) {
        const configJson = fs.readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configJson);
        
        if (config.features) {
          this.features = config.features;
        }
        
        if (config.level) {
          this.level = config.level;
        }
        
        console.log(`Loaded security configuration from file (level: ${this.level})`);
        
        // Save to database for future
        await this.saveConfig();
      } else {
        // If not in file, create default configuration
        console.log(`Creating default security configuration (level: ${this.level})`);
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Error loading security configuration:', error);
      
      // Fallback to defaults
      this.features = this.getDefaultFeatures('medium');
      this.level = 'medium';
    }
  }
  
  /**
   * Save security configuration to database and file
   */
  private async saveConfig(): Promise<void> {
    const config = {
      features: this.features,
      level: this.level
    };
    
    // Save to database
    try {
      const settings = await db.select().from(securitySettings).limit(1);
      
      if (settings.length > 0) {
        // Update existing setting
        await db.update(securitySettings)
          .set({
            value: JSON.stringify(config),
            updatedAt: new Date()
          })
          .where(eq(securitySettings.key, 'security_config'));
      } else {
        // Create new setting
        await db.insert(securitySettings)
          .values({
            key: 'security_config',
            value: JSON.stringify(config),
            description: 'Security configuration settings',
            category: 'security',
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    } catch (error) {
      console.error('Error saving security configuration to database:', error);
    }
    
    // Also save to file
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write to file
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving security configuration to file:', error);
    }
  }
  
  /**
   * Get default features for a security level
   * 
   * @param level The security level
   */
  private getDefaultFeatures(level: SecurityLevel): SecurityFeatures {
    switch (level) {
      case 'low':
        return {
          threatDetection: true,
          realTimeMonitoring: true,
          ipReputation: false,
          csrfProtection: true,
          xssProtection: true,
          sqlInjectionProtection: true,
          rateLimiting: true,
          twoFactorAuth: false,
          passwordPolicies: true,
          bruteForceProtection: true,
          zeroKnowledgeProofs: false,
          aiThreatDetection: false
        };
        
      case 'medium':
        return {
          threatDetection: true,
          realTimeMonitoring: true,
          ipReputation: true,
          csrfProtection: true,
          xssProtection: true,
          sqlInjectionProtection: true,
          rateLimiting: true,
          twoFactorAuth: true,
          passwordPolicies: true,
          bruteForceProtection: true,
          zeroKnowledgeProofs: false,
          aiThreatDetection: false
        };
        
      case 'high':
        return {
          threatDetection: true,
          realTimeMonitoring: true,
          ipReputation: true,
          csrfProtection: true,
          xssProtection: true,
          sqlInjectionProtection: true,
          rateLimiting: true,
          twoFactorAuth: true,
          passwordPolicies: true,
          bruteForceProtection: true,
          zeroKnowledgeProofs: true,
          aiThreatDetection: true
        };
        
      case 'custom':
      default:
        // Return current features
        return { ...this.features };
    }
  }
  
  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    // Make a copy of features to prevent modification
    const featuresCopy = { ...this.features };
    
    // Notify all listeners
    for (const listener of this.listeners) {
      try {
        listener(featuresCopy, this.level);
      } catch (error) {
        console.error('Error in security configuration listener:', error);
      }
    }
  }
}

// Create and export singleton instance
export const securityConfig = new SecurityConfig();