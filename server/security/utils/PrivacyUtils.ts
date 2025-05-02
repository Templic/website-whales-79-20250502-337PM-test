/**
 * Privacy Utilities Module
 * 
 * Provides data masking, obfuscation, encryption, and auto-retention capabilities
 * for privacy-sensitive data in the application.
 */

import crypto from 'crypto';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

// Singleton instance
let privacyUtilsInstance: PrivacyUtils | null = null;

/**
 * Get the singleton PrivacyUtils instance
 */
export function getPrivacyUtils(): PrivacyUtils {
  if (!privacyUtilsInstance) {
    privacyUtilsInstance = new PrivacyUtils();
  }
  
  return privacyUtilsInstance;
}

/**
 * PrivacyUtils class that manages privacy-related operations
 */
export class PrivacyUtils {
  private initialized: boolean = false;
  private keyConfig: any = {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
    currentKeyId: 1,
    keys: {
      // This would be loaded from a secure source or environment variables in production
      1: {
        key: crypto.randomBytes(32).toString('hex'),
        iv: crypto.randomBytes(16).toString('hex'),
        createdAt: new Date()
      }
    }
  };
  
  // Configuration
  private config = {
    enableDataRetention: true,
    dataRetentionPeriods: {
      'security_logs': 365, // days
      'security_events': 180,
      'user_sessions': 30,
      'audit_logs': 730
    },
    maskingRules: {
      email: (value: string) => {
        const [name, domain] = value.split('@');
        return `${name.substring(0, 2)}***@${domain}`;
      },
      phone: (value: string) => {
        return value.replace(/\d(?=\d{4})/g, '*');
      },
      credit_card: (value: string) => {
        return value.replace(/\d(?=\d{4})/g, '*');
      },
      address: (value: string) => {
        return value.split(' ').map((part, i) => i === 0 ? part : '***').join(' ');
      },
      name: (value: string) => {
        return value.split(' ').map(part => `${part[0]}***`).join(' ');
      },
      ip: (value: string) => {
        return value.replace(/\d+(\.\d+)$/g, '***$1');
      }
    },
    encryptionEnabled: true,
    securityLogsEnabled: true,
    anonymizationEnabled: true
  };
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the privacy utilities
   */
  async initialize(): Promise<void> {
    try {
      // Attempt to load privacy configuration from database
      const configLoaded = await this.loadConfigurationFromDatabase();
      
      if (!configLoaded) {
        console.warn('[PrivacyUtils] Could not load configuration from database, using defaults');
      }
      
      // Initialize encryption keys if not already set
      if (!this.keyConfig.keys[this.keyConfig.currentKeyId]) {
        console.log('[PrivacyUtils] Generating new encryption keys');
        this.keyConfig.keys[this.keyConfig.currentKeyId] = {
          key: crypto.randomBytes(32).toString('hex'),
          iv: crypto.randomBytes(16).toString('hex'),
          createdAt: new Date()
        };
      }
      
      // Set up automated data retention if enabled
      if (this.config.enableDataRetention) {
        this.setupDataRetention();
      }
      
      this.initialized = true;
      console.log('[PrivacyUtils] Initialized successfully');
    } catch (error) {
      console.error('[PrivacyUtils] Initialization error:', error);
      this.initialized = true; // Still mark as initialized to avoid blocking operations
    }
  }
  
  /**
   * Load configuration from database
   */
  private async loadConfigurationFromDatabase(): Promise<boolean> {
    try {
      // Check if the security_config table exists
      const configTableExists = await this.checkSecurityConfigTableExists();
      
      if (!configTableExists) {
        console.warn('[PrivacyUtils] security_config table does not exist');
        return false;
      }
      
      // Load privacy configuration
      const result = await db.execute(sql`
        SELECT * FROM security_config 
        WHERE config_type = 'privacy'
        ORDER BY updated_at DESC
        LIMIT 1
      `);
      
      if (result && result.length > 0) {
        const dbConfig = result[0];
        
        if (dbConfig.config_data) {
          const configData = JSON.parse(dbConfig.config_data);
          
          // Merge with default config
          this.config = {
            ...this.config,
            ...configData
          };
          
          console.log('[PrivacyUtils] Loaded configuration from database');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[PrivacyUtils] Error loading configuration:', error);
      return false;
    }
  }
  
  /**
   * Check if security_config table exists
   */
  private async checkSecurityConfigTableExists(): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
            AND table_name = 'security_config'
        );
      `);
      
      return result.length > 0 && result[0].exists === true;
    } catch (error) {
      console.error('[PrivacyUtils] Error checking if security_config table exists:', error);
      return false;
    }
  }
  
  /**
   * Set up automated data retention
   */
  private setupDataRetention(): void {
    // Schedule periodic cleanup of old data
    const retentionInterval = 24 * 60 * 60 * 1000; // Once per day
    
    setInterval(() => {
      Object.entries(this.config.dataRetentionPeriods).forEach(([table, days]) => {
        this.applyRetentionPolicy(table, days);
      });
    }, retentionInterval);
    
    console.log('[PrivacyUtils] Data retention scheduled');
  }
  
  /**
   * Apply retention policy to a table
   */
  private async applyRetentionPolicy(table: string, days: number): Promise<void> {
    try {
      // Check if table exists
      const tableExists = await this.checkTableExists(table);
      
      if (!tableExists) {
        console.warn(`[PrivacyUtils] Table ${table} does not exist for retention policy`);
        return;
      }
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      // Delete records older than cutoff date
      await db.execute(sql`
        DELETE FROM ${sql.identifier(table)}
        WHERE created_at < ${cutoffDate.toISOString()}
      `);
      
      console.log(`[PrivacyUtils] Applied retention policy to ${table}, removed data older than ${days} days`);
    } catch (error) {
      console.error(`[PrivacyUtils] Error applying retention policy to ${table}:`, error);
    }
  }
  
  /**
   * Check if a table exists
   */
  private async checkTableExists(table: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
            AND table_name = ${table}
        );
      `);
      
      return result.length > 0 && result[0].exists === true;
    } catch (error) {
      console.error(`[PrivacyUtils] Error checking if ${table} table exists:`, error);
      return false;
    }
  }
  
  /**
   * Get health status for monitoring
   */
  getHealth() {
    return {
      status: 'healthy',
      initialized: this.initialized,
      keyRotation: {
        currentKeyId: this.keyConfig.currentKeyId,
        rotationPeriodDays: this.keyConfig.keyRotationDays,
        keysAvailable: Object.keys(this.keyConfig.keys).length
      },
      dataRetention: {
        enabled: this.config.enableDataRetention,
        tablesManaged: Object.keys(this.config.dataRetentionPeriods).length
      },
      encryptionEnabled: this.config.encryptionEnabled,
      anonymizationEnabled: this.config.anonymizationEnabled
    };
  }
  
  /**
   * Get configuration settings
   */
  getConfiguration() {
    // Return non-sensitive configuration (don't include actual keys)
    return {
      enableDataRetention: this.config.enableDataRetention,
      dataRetentionPeriods: { ...this.config.dataRetentionPeriods },
      encryptionEnabled: this.config.encryptionEnabled,
      securityLogsEnabled: this.config.securityLogsEnabled,
      anonymizationEnabled: this.config.anonymizationEnabled,
      keyRotation: {
        algorithm: this.keyConfig.algorithm,
        keyRotationDays: this.keyConfig.keyRotationDays,
        currentKeyId: this.keyConfig.currentKeyId
      }
    };
  }
  
  /**
   * Update configuration settings
   */
  async updateConfiguration(settings: Record<string, any>): Promise<boolean> {
    try {
      // Apply valid setting updates
      if (typeof settings.enableDataRetention === 'boolean') {
        this.config.enableDataRetention = settings.enableDataRetention;
        
        // Setup or disable data retention
        if (settings.enableDataRetention && !this.config.enableDataRetention) {
          this.setupDataRetention();
        }
      }
      
      if (settings.dataRetentionPeriods && typeof settings.dataRetentionPeriods === 'object') {
        this.config.dataRetentionPeriods = {
          ...this.config.dataRetentionPeriods,
          ...settings.dataRetentionPeriods
        };
      }
      
      if (typeof settings.encryptionEnabled === 'boolean') {
        this.config.encryptionEnabled = settings.encryptionEnabled;
      }
      
      if (typeof settings.securityLogsEnabled === 'boolean') {
        this.config.securityLogsEnabled = settings.securityLogsEnabled;
      }
      
      if (typeof settings.anonymizationEnabled === 'boolean') {
        this.config.anonymizationEnabled = settings.anonymizationEnabled;
      }
      
      // Update key rotation if provided
      if (settings.keyRotation && typeof settings.keyRotation === 'object') {
        if (typeof settings.keyRotation.keyRotationDays === 'number') {
          this.keyConfig.keyRotationDays = settings.keyRotation.keyRotationDays;
        }
        
        // Force key rotation if requested
        if (settings.keyRotation.forceRotation === true) {
          this.rotateEncryptionKey();
        }
      }
      
      // Save updated configuration to database if possible
      await this.saveConfigurationToDatabase();
      
      return true;
    } catch (error) {
      console.error('[PrivacyUtils] Error updating configuration:', error);
      return false;
    }
  }
  
  /**
   * Save configuration to database
   */
  private async saveConfigurationToDatabase(): Promise<boolean> {
    try {
      // Check if the security_config table exists
      const configTableExists = await this.checkSecurityConfigTableExists();
      
      if (!configTableExists) {
        console.warn('[PrivacyUtils] security_config table does not exist, cannot save configuration');
        return false;
      }
      
      // Prepare config data, excluding sensitive information
      const configData = {
        enableDataRetention: this.config.enableDataRetention,
        dataRetentionPeriods: this.config.dataRetentionPeriods,
        encryptionEnabled: this.config.encryptionEnabled,
        securityLogsEnabled: this.config.securityLogsEnabled,
        anonymizationEnabled: this.config.anonymizationEnabled,
        keyRotation: {
          algorithm: this.keyConfig.algorithm,
          keyRotationDays: this.keyConfig.keyRotationDays
        }
      };
      
      // Insert new configuration
      await db.execute(sql`
        INSERT INTO security_config (config_type, config_data, created_at, updated_at)
        VALUES ('privacy', ${JSON.stringify(configData)}, NOW(), NOW())
      `);
      
      return true;
    } catch (error) {
      console.error('[PrivacyUtils] Error saving configuration to database:', error);
      return false;
    }
  }
  
  /**
   * Rotate encryption key
   */
  private rotateEncryptionKey(): void {
    // Generate a new key
    const newKeyId = this.keyConfig.currentKeyId + 1;
    
    this.keyConfig.keys[newKeyId] = {
      key: crypto.randomBytes(32).toString('hex'),
      iv: crypto.randomBytes(16).toString('hex'),
      createdAt: new Date()
    };
    
    // Update current key ID
    this.keyConfig.currentKeyId = newKeyId;
    
    console.log(`[PrivacyUtils] Rotated encryption key to key ID ${newKeyId}`);
  }
  
  /**
   * Get metrics for monitoring
   */
  getMetrics(since?: Date) {
    // In a real implementation, this would return metrics from a time series database
    // For now, return sample metrics for dashboard display
    return {
      dataVolume: {
        encryptedDataMB: 768.5,
        anonymizedRecords: 124536,
        retentionCleanups: 12,
        deletedRecordCount: 43567
      },
      operations: {
        maskingOperations: 987654,
        encryptionOperations: 45678,
        decryptionOperations: 23456,
        keyRotations: 3
      },
      performance: {
        avgMaskingTimeMs: 0.8,
        avgEncryptionTimeMs: 3.2,
        avgDecryptionTimeMs: 2.7
      },
      keyUsage: [
        { keyId: 1, usageCount: 23456, status: 'archived' },
        { keyId: 2, usageCount: 56789, status: 'archived' },
        { keyId: 3, usageCount: 987654, status: 'active' }
      ]
    };
  }
  
  /**
   * Mask/anonymize sensitive data based on field type
   */
  maskSensitiveData(value: any, type: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    if (this.config.maskingRules[type]) {
      return this.config.maskingRules[type](value);
    }
    
    // Default masking if type not found
    if (value.length > 4) {
      return value.substring(0, 2) + '***' + value.substring(value.length - 2);
    }
    
    return '****';
  }
  
  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    if (!this.config.encryptionEnabled) {
      return data;
    }
    
    try {
      const keyInfo = this.keyConfig.keys[this.keyConfig.currentKeyId];
      const key = Buffer.from(keyInfo.key, 'hex');
      const iv = Buffer.from(keyInfo.iv, 'hex');
      
      const cipher = crypto.createCipheriv(this.keyConfig.algorithm, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(data, 'utf8')),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      // Format: keyId:iv:authTag:encrypted
      return [
        this.keyConfig.currentKeyId.toString(),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex')
      ].join(':');
    } catch (error) {
      console.error('[PrivacyUtils] Encryption error:', error);
      return data; // Return original on error
    }
  }
  
  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    if (!this.config.encryptionEnabled || !encryptedData.includes(':')) {
      return encryptedData;
    }
    
    try {
      const [keyId, ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
      
      const keyInfo = this.keyConfig.keys[parseInt(keyId, 10)];
      if (!keyInfo) {
        throw new Error(`Key ID ${keyId} not found`);
      }
      
      const key = Buffer.from(keyInfo.key, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.keyConfig.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('[PrivacyUtils] Decryption error:', error);
      return encryptedData; // Return original on error
    }
  }
}