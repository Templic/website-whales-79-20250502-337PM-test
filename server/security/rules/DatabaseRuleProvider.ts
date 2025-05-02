/**
 * Database Rule Provider
 * 
 * This module provides functionality to retrieve security rules
 * from a database.
 */

import { sql } from 'drizzle-orm';
import chalk from 'chalk';

import { db } from '../../db';
import {
  Rule,
  RuleDependency,
  RuleProvider,
  RuleStatus,
  RuleType
} from './RuleCache';

/**
 * Database Rule Provider
 * 
 * Retrieves security rules from a database
 */
export class DatabaseRuleProvider implements RuleProvider {
  private initialized: boolean = false;
  
  /**
   * Create a new database rule provider
   */
  constructor() {
    this.initialize().catch(err => {
      console.error(chalk.red('[DatabaseRuleProvider] Initialization error:'), err);
    });
  }
  
  /**
   * Initialize the provider
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      console.log(chalk.blue('[DatabaseRuleProvider] Initializing...'));
      
      // Check if database tables exist
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Security rules tables do not exist. ' +
          'Rules will be unavailable until tables are created.'
        ));
      }
      
      this.initialized = true;
      console.log(chalk.green('[DatabaseRuleProvider] Initialized successfully'));
    } catch (error) {
      console.error(chalk.red('[DatabaseRuleProvider] Initialization failed:'), error);
      throw error;
    }
  }
  
  /**
   * Check if required tables exist
   * 
   * @returns Promise resolving to true if tables exist
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      // Check for security_rules table
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'security_rules'
        );
      `);
      
      if (result.length === 0 || !result[0].exists) {
        return false;
      }
      
      // Check for rule_dependencies table
      const depsResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'rule_dependencies'
        );
      `);
      
      return depsResult.length > 0 && depsResult[0].exists;
    } catch (error) {
      console.error(chalk.red('[DatabaseRuleProvider] Error checking tables:'), error);
      return false;
    }
  }
  
  /**
   * Get a rule by ID
   * 
   * @param id Rule ID
   * @returns Promise resolving to the rule or null if not found
   */
  async getRuleById(id: string): Promise<Rule | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Query the database for the rule
      const result = await db.execute(sql`
        SELECT * FROM security_rules WHERE id = ${id};
      `);
      
      if (result.length === 0) {
        return null;
      }
      
      // Convert database result to Rule
      return this.dbToRule(result[0]);
    } catch (error) {
      console.error(chalk.red(`[DatabaseRuleProvider] Error fetching rule ${id}:`), error);
      
      // If it's a "relation doesn't exist" error, handle it gracefully
      if (error.code === '42P01') {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Security rules table does not exist. ' +
          'This is expected if the schema has not been applied yet.'
        ));
        return null;
      }
      
      throw error;
    }
  }
  
  /**
   * Get rules by type
   * 
   * @param type Rule type
   * @returns Promise resolving to an array of rules
   */
  async getRulesByType(type: RuleType): Promise<Rule[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Query the database for rules of the given type
      const result = await db.execute(sql`
        SELECT * FROM security_rules WHERE type = ${type};
      `);
      
      // Convert database results to Rules
      return result.map(row => this.dbToRule(row));
    } catch (error) {
      console.error(chalk.red(`[DatabaseRuleProvider] Error fetching rules of type ${type}:`), error);
      
      // If it's a "relation doesn't exist" error, handle it gracefully
      if (error.code === '42P01') {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Security rules table does not exist. ' +
          'This is expected if the schema has not been applied yet.'
        ));
        return [];
      }
      
      throw error;
    }
  }
  
  /**
   * Get all rules
   * 
   * @returns Promise resolving to an array of all rules
   */
  async getAllRules(): Promise<Rule[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Query the database for all rules
      const result = await db.execute(sql`
        SELECT * FROM security_rules;
      `);
      
      // Convert database results to Rules
      return result.map(row => this.dbToRule(row));
    } catch (error) {
      console.error(chalk.red('[DatabaseRuleProvider] Error fetching all rules:'), error);
      
      // If it's a "relation doesn't exist" error, handle it gracefully
      if (error.code === '42P01') {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Security rules table does not exist. ' +
          'This is expected if the schema has not been applied yet.'
        ));
        return [];
      }
      
      throw error;
    }
  }
  
  /**
   * Get rule dependencies
   * 
   * @param ruleId Rule ID
   * @returns Promise resolving to an array of rule dependencies
   */
  async getRuleDependencies(ruleId: string): Promise<RuleDependency[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Query the database for rule dependencies
      const result = await db.execute(sql`
        SELECT * FROM rule_dependencies WHERE rule_id = ${ruleId};
      `);
      
      // Convert database results to RuleDependencies
      return result.map(row => ({
        ruleId: row.rule_id,
        dependsOnRuleId: row.depends_on_rule_id,
        type: row.dependency_type
      }));
    } catch (error) {
      console.error(chalk.red(`[DatabaseRuleProvider] Error fetching dependencies for rule ${ruleId}:`), error);
      
      // If it's a "relation doesn't exist" error, handle it gracefully
      if (error.code === '42P01') {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Rule dependencies table does not exist. ' +
          'This is expected if the schema has not been applied yet.'
        ));
        return [];
      }
      
      throw error;
    }
  }
  
  /**
   * Get rules updated since a given date
   * 
   * @param date Date to check against
   * @returns Promise resolving to an array of updated rules
   */
  async getRulesUpdatedSince(date: Date): Promise<Rule[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Query the database for rules updated since the given date
      const result = await db.execute(sql`
        SELECT * FROM security_rules WHERE updated_at > ${date};
      `);
      
      // Convert database results to Rules
      return result.map(row => this.dbToRule(row));
    } catch (error) {
      console.error(chalk.red(`[DatabaseRuleProvider] Error fetching rules updated since ${date}:`), error);
      
      // If it's a "relation doesn't exist" error, handle it gracefully
      if (error.code === '42P01') {
        console.warn(chalk.yellow(
          '[DatabaseRuleProvider] Security rules table does not exist. ' +
          'This is expected if the schema has not been applied yet.'
        ));
        return [];
      }
      
      throw error;
    }
  }
  
  /**
   * Convert a database row to a Rule
   * 
   * @param row Database row
   * @returns Rule
   * @private
   */
  private dbToRule(row: any): Rule {
    return {
      id: row.id,
      type: row.type as RuleType,
      name: row.name,
      description: row.description,
      pattern: row.pattern,
      status: row.status as RuleStatus,
      priority: row.priority,
      conditions: typeof row.conditions === 'string' 
        ? JSON.parse(row.conditions) 
        : (row.conditions || {}),
      actions: typeof row.actions === 'string' 
        ? JSON.parse(row.actions) 
        : (row.actions || {}),
      metadata: typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : (row.metadata || {}),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      version: row.version || 1
    };
  }
}

// Create singleton instance
export const databaseRuleProvider = new DatabaseRuleProvider();

// Export default for convenience
export default databaseRuleProvider;