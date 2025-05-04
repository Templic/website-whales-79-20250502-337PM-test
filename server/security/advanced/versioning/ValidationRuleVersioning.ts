/**
 * Validation Rule Versioning System
 * 
 * This module provides versioning capabilities for validation rules,
 * allowing for tracking, evolution, and backward compatibility of validation rules.
 */

import secureLogger from '../../utils/secureLogger';
import { ValidationErrorCategory } from '../error/ValidationErrorCategory';
import { z } from 'zod';

// Configure component name for logging
const logComponent = 'ValidationRuleVersioning';

// Rule version interface
export interface RuleVersion<T = any> {
  version: number;
  createdAt: Date;
  schema: z.ZodType<T>;
  description: string;
  author?: string;
  isDeprecated?: boolean;
  deprecatedAt?: Date;
  replacedByVersion?: number;
  notes?: string;
  tags?: string[];
  changeLog?: string;
  breaking?: boolean;
}

// Versioned rule interface
export interface VersionedRule<T = any> {
  ruleId: string;
  name: string;
  description: string;
  target: 'body' | 'query' | 'params' | 'headers' | 'file';
  category?: ValidationErrorCategory;
  versions: RuleVersion<T>[];
  currentVersion: number;
  created: Date;
  lastUpdated: Date;
  tags?: string[];
  isActive: boolean;
}

// Migration strategy
export type MigrationStrategy = 'strict' | 'permissive' | 'transform';

// Migration options
export interface MigrationOptions {
  strategy: MigrationStrategy;
  transformFn?: (data: any, fromVersion: number, toVersion: number) => any;
  fallbackToOldestCompatible?: boolean;
}

// Versioned rule store
export class ValidationRuleVersioningStore {
  private rules: Map<string, VersionedRule> = new Map();
  
  constructor() {
    secureLogger('info', logComponent, 'Validation rule versioning system initialized');
  }
  
  /**
   * Register a new versioned rule
   */
  public registerRule<T>(
    ruleId: string,
    name: string,
    description: string,
    target: 'body' | 'query' | 'params' | 'headers' | 'file',
    initialSchema: z.ZodType<T>,
    options?: {
      category?: ValidationErrorCategory;
      tags?: string[];
      author?: string;
      notes?: string;
    }
  ): VersionedRule<T> {
    if (this.rules.has(ruleId)) {
      throw new Error(`Rule with ID ${ruleId} is already registered`);
    }
    
    const now = new Date();
    
    const initialVersion: RuleVersion<T> = {
      version: 1,
      createdAt: now,
      schema: initialSchema,
      description: `Initial version of ${name}`,
      author: options?.author,
      isDeprecated: false,
      tags: options?.tags,
      notes: options?.notes,
      breaking: false
    };
    
    const rule: VersionedRule<T> = {
      ruleId,
      name,
      description,
      target,
      category: options?.category,
      versions: [initialVersion],
      currentVersion: 1,
      created: now,
      lastUpdated: now,
      tags: options?.tags,
      isActive: true
    };
    
    this.rules.set(ruleId, rule);
    
    secureLogger('info', logComponent, `Registered new rule: ${ruleId} (v1)`, {
      metadata: {
        ruleName: name,
        target,
        tags: options?.tags
      }
    });
    
    return rule;
  }
  
  /**
   * Add a new version to an existing rule
   */
  public addRuleVersion<T>(
    ruleId: string,
    newSchema: z.ZodType<T>,
    options: {
      description: string;
      author?: string;
      notes?: string;
      breaking?: boolean;
      changeLog?: string;
      deprecatePrevious?: boolean;
    }
  ): RuleVersion<T> {
    const rule = this.rules.get(ruleId) as VersionedRule<T>;
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    const now = new Date();
    const newVersion = rule.versions.length + 1;
    
    // Deprecate previous version if requested
    if (options.deprecatePrevious) {
      const previousVersion = rule.versions.find(v => v.version === rule.currentVersion);
      if (previousVersion) {
        previousVersion.isDeprecated = true;
        previousVersion.deprecatedAt = now;
        previousVersion.replacedByVersion = newVersion;
      }
    }
    
    const versionEntry: RuleVersion<T> = {
      version: newVersion,
      createdAt: now,
      schema: newSchema,
      description: options.description,
      author: options.author,
      notes: options.notes,
      breaking: options.breaking || false,
      changeLog: options.changeLog,
      tags: rule.tags
    };
    
    rule.versions.push(versionEntry);
    rule.lastUpdated = now;
    rule.currentVersion = newVersion;
    
    secureLogger('info', logComponent, `Added version ${newVersion} to rule: ${ruleId}`, {
      metadata: {
        ruleName: rule.name,
        isBreaking: options.breaking,
        deprecatedPrevious: options.deprecatePrevious,
        changeLog: options.changeLog
      }
    });
    
    return versionEntry;
  }
  
  /**
   * Get a specific rule
   */
  public getRule(ruleId: string): VersionedRule | undefined {
    return this.rules.get(ruleId);
  }
  
  /**
   * Get all rules
   */
  public getAllRules(): VersionedRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Get a specific version of a rule
   */
  public getRuleVersion<T>(ruleId: string, version: number): RuleVersion<T> | undefined {
    const rule = this.rules.get(ruleId) as VersionedRule<T>;
    if (!rule) {
      return undefined;
    }
    
    return rule.versions.find(v => v.version === version) as RuleVersion<T>;
  }
  
  /**
   * Get the latest version of a rule
   */
  public getLatestRuleVersion<T>(ruleId: string): RuleVersion<T> | undefined {
    const rule = this.rules.get(ruleId) as VersionedRule<T>;
    if (!rule) {
      return undefined;
    }
    
    return rule.versions.find(v => v.version === rule.currentVersion) as RuleVersion<T>;
  }
  
  /**
   * Validate data against a specific rule version
   */
  public validate<T>(
    ruleId: string, 
    data: any, 
    version?: number
  ): {
    success: boolean;
    data?: T;
    error?: z.ZodError;
    ruleVersion: number;
  } {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // Determine which version to use
    const versionToUse = version || rule.currentVersion;
    const ruleVersion = rule.versions.find(v => v.version === versionToUse);
    
    if (!ruleVersion) {
      throw new Error(`Version ${versionToUse} of rule ${ruleId} not found`);
    }
    
    try {
      const result = ruleVersion.schema.parse(data);
      
      return {
        success: true,
        data: result,
        ruleVersion: ruleVersion.version
      };
    } catch (error) {
      return {
        success: false,
        error: error as z.ZodError,
        ruleVersion: ruleVersion.version
      };
    }
  }
  
  /**
   * Validate data with version migration
   */
  public validateWithMigration<T>(
    ruleId: string,
    data: any,
    fromVersion: number,
    toVersion?: number,
    options?: Partial<MigrationOptions>
  ): {
    success: boolean;
    data?: T;
    error?: z.ZodError;
    migratedFrom: number;
    migratedTo: number;
    migrationPerformed: boolean;
  } {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    const effectiveToVersion = toVersion || rule.currentVersion;
    
    // Check if migration is needed
    if (fromVersion === effectiveToVersion) {
      // No migration needed, just validate
      const result = this.validate<T>(ruleId, data, fromVersion);
      return {
        ...result,
        migratedFrom: fromVersion,
        migratedTo: fromVersion,
        migrationPerformed: false
      };
    }
    
    // Configure migration options
    const migrationOptions: MigrationOptions = {
      strategy: 'strict',
      fallbackToOldestCompatible: false,
      ...options
    };
    
    // Perform migration based on strategy
    let migratedData = data;
    
    if (migrationOptions.strategy === 'transform' && migrationOptions.transformFn) {
      try {
        migratedData = migrationOptions.transformFn(data, fromVersion, effectiveToVersion);
      } catch (error) {
        secureLogger('error', logComponent, `Migration transform function failed for rule ${ruleId}`, {
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            fromVersion,
            toVersion: effectiveToVersion
          }
        });
        
        // Fall back to permissive if configured
        if (migrationOptions.fallbackToOldestCompatible) {
          migrationOptions.strategy = 'permissive';
        } else {
          throw new Error(`Migration transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Try to validate with target version
    const validationResult = this.validate<T>(ruleId, migratedData, effectiveToVersion);
    
    if (validationResult.success || migrationOptions.strategy !== 'permissive') {
      return {
        ...validationResult,
        migratedFrom: fromVersion,
        migratedTo: effectiveToVersion,
        migrationPerformed: true
      };
    }
    
    // If permissive and there was an error, try previous versions
    if (migrationOptions.strategy === 'permissive' && migrationOptions.fallbackToOldestCompatible) {
      // Try versions in reverse order, from most recent to oldest
      const sortedVersions = rule.versions
        .filter(v => v.version < effectiveToVersion && v.version >= fromVersion)
        .sort((a, b) => b.version - a.version);
      
      for (const version of sortedVersions) {
        const fallbackResult = this.validate<T>(ruleId, migratedData, version.version);
        if (fallbackResult.success) {
          secureLogger('warn', logComponent, `Validation succeeded with fallback to version ${version.version}`, {
            metadata: {
              ruleId,
              originalVersion: fromVersion,
              targetVersion: effectiveToVersion,
              fallbackVersion: version.version
            }
          });
          
          return {
            ...fallbackResult,
            migratedFrom: fromVersion,
            migratedTo: version.version,
            migrationPerformed: true
          };
        }
      }
    }
    
    // No compatible version found
    return {
      success: false,
      error: validationResult.error,
      migratedFrom: fromVersion,
      migratedTo: effectiveToVersion,
      migrationPerformed: true
    };
  }
  
  /**
   * Deprecate a specific version of a rule
   */
  public deprecateRuleVersion(
    ruleId: string,
    version: number,
    replacedByVersion?: number,
    notes?: string
  ): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }
    
    const ruleVersion = rule.versions.find(v => v.version === version);
    if (!ruleVersion) {
      return false;
    }
    
    ruleVersion.isDeprecated = true;
    ruleVersion.deprecatedAt = new Date();
    
    if (replacedByVersion) {
      ruleVersion.replacedByVersion = replacedByVersion;
    }
    
    if (notes) {
      ruleVersion.notes = notes;
    }
    
    rule.lastUpdated = new Date();
    
    secureLogger('info', logComponent, `Deprecated version ${version} of rule: ${ruleId}`, {
      metadata: {
        ruleName: rule.name,
        replacedByVersion,
        notes
      }
    });
    
    return true;
  }
  
  /**
   * Get version history for a rule
   */
  public getRuleVersionHistory(ruleId: string): {
    version: number;
    createdAt: Date;
    description: string;
    isDeprecated: boolean;
    deprecatedAt?: Date;
    breaking?: boolean;
    author?: string;
    changeLog?: string;
  }[] {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return [];
    }
    
    return rule.versions.map(v => ({
      version: v.version,
      createdAt: v.createdAt,
      description: v.description,
      isDeprecated: v.isDeprecated || false,
      deprecatedAt: v.deprecatedAt,
      breaking: v.breaking,
      author: v.author,
      changeLog: v.changeLog
    }));
  }
  
  /**
   * Set the current version for a rule
   */
  public setCurrentVersion(ruleId: string, version: number): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }
    
    const ruleVersion = rule.versions.find(v => v.version === version);
    if (!ruleVersion) {
      return false;
    }
    
    rule.currentVersion = version;
    rule.lastUpdated = new Date();
    
    secureLogger('info', logComponent, `Set current version of rule ${ruleId} to ${version}`, {
      metadata: {
        ruleName: rule.name,
        previousVersion: rule.currentVersion,
        newVersion: version
      }
    });
    
    return true;
  }
  
  /**
   * Activate or deactivate a rule
   */
  public setRuleActive(ruleId: string, active: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }
    
    rule.isActive = active;
    rule.lastUpdated = new Date();
    
    secureLogger('info', logComponent, `Set rule ${ruleId} ${active ? 'active' : 'inactive'}`, {
      metadata: {
        ruleName: rule.name
      }
    });
    
    return true;
  }
  
  /**
   * Compare two rule versions and list differences
   */
  public compareRuleVersions(
    ruleId: string,
    version1: number,
    version2: number
  ): {
    differences: string[];
    hasBreakingChanges: boolean;
  } {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    const ruleVersion1 = rule.versions.find(v => v.version === version1);
    const ruleVersion2 = rule.versions.find(v => v.version === version2);
    
    if (!ruleVersion1 || !ruleVersion2) {
      throw new Error(`One or both versions (${version1}, ${version2}) not found for rule ${ruleId}`);
    }
    
    const differences: string[] = [];
    let hasBreakingChanges = false;
    
    // Compare creation dates
    differences.push(`Version ${version1} created on ${ruleVersion1.createdAt.toISOString()}`);
    differences.push(`Version ${version2} created on ${ruleVersion2.createdAt.toISOString()}`);
    
    // Compare descriptions
    if (ruleVersion1.description !== ruleVersion2.description) {
      differences.push(`Description changed from "${ruleVersion1.description}" to "${ruleVersion2.description}"`);
    }
    
    // Check breaking changes flag
    if (ruleVersion1.breaking || ruleVersion2.breaking) {
      hasBreakingChanges = true;
      differences.push(`Contains breaking changes`);
    }
    
    // Add change log if available
    if (version1 < version2 && ruleVersion2.changeLog) {
      differences.push(`Changelog for version ${version2}: ${ruleVersion2.changeLog}`);
    } else if (version2 < version1 && ruleVersion1.changeLog) {
      differences.push(`Changelog for version ${version1}: ${ruleVersion1.changeLog}`);
    }
    
    return {
      differences,
      hasBreakingChanges
    };
  }
  
  /**
   * Generate a migration path between two versions
   */
  public generateMigrationPath(
    ruleId: string,
    fromVersion: number,
    toVersion: number
  ): {
    steps: { from: number; to: number; breaking: boolean }[];
    hasBreakingChanges: boolean;
  } {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
    
    // Ensure both versions exist
    const versions = rule.versions.map(v => v.version);
    if (!versions.includes(fromVersion) || !versions.includes(toVersion)) {
      throw new Error(`One or both versions (${fromVersion}, ${toVersion}) not found for rule ${ruleId}`);
    }
    
    // If same version, no migration needed
    if (fromVersion === toVersion) {
      return {
        steps: [],
        hasBreakingChanges: false
      };
    }
    
    const steps: { from: number; to: number; breaking: boolean }[] = [];
    let hasBreakingChanges = false;
    
    // Determine direction
    const isUpgrade = fromVersion < toVersion;
    
    if (isUpgrade) {
      // Upgrading: go through each version in sequence
      for (let i = fromVersion; i < toVersion; i++) {
        const currentVersion = rule.versions.find(v => v.version === i);
        const nextVersion = rule.versions.find(v => v.version === i + 1);
        
        if (currentVersion && nextVersion) {
          const isBreaking = nextVersion.breaking || false;
          steps.push({
            from: i,
            to: i + 1,
            breaking: isBreaking
          });
          
          if (isBreaking) {
            hasBreakingChanges = true;
          }
        }
      }
    } else {
      // Downgrading: go backward through versions
      for (let i = fromVersion; i > toVersion; i--) {
        const currentVersion = rule.versions.find(v => v.version === i);
        const prevVersion = rule.versions.find(v => v.version === i - 1);
        
        if (currentVersion && prevVersion) {
          const isBreaking = currentVersion.breaking || false;
          steps.push({
            from: i,
            to: i - 1,
            breaking: isBreaking
          });
          
          if (isBreaking) {
            hasBreakingChanges = true;
          }
        }
      }
    }
    
    return {
      steps,
      hasBreakingChanges
    };
  }
}

// Export singleton instance
export const validationRuleVersioning = new ValidationRuleVersioningStore();