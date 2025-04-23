/**
 * Drizzle ORM Security Integration
 * 
 * This module provides security enhancements for Drizzle ORM to prevent
 * SQL injection vulnerabilities when using this specific ORM.
 */

import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import { sqlMonitor } from './sqlMonitor';

/**
 * Drizzle database interface
 */
interface DrizzleDB {
  execute: (query: any) => Promise<any>;
  query: (query: any) => Promise<any>;
  // Other Drizzle methods as needed
}

/**
 * Drizzle security options
 */
interface DrizzleSecurityOptions {
  /**
   * Enable query logging
   */
  enableLogging?: boolean;
  
  /**
   * Enable query validation
   */
  enableValidation?: boolean;
  
  /**
   * Strict mode (reject unsafe operations)
   */
  strictMode?: boolean;
}

/**
 * Secure Drizzle ORM class
 */
export class SecureDrizzle {
  private db: DrizzleDB;
  private options: DrizzleSecurityOptions;
  
  constructor(db: DrizzleDB, options: DrizzleSecurityOptions = {}) {
    this.db = db;
    this.options = {
      enableLogging: true,
      enableValidation: true,
      strictMode: true,
      ...options
    };
    
    console.log('[DRIZZLE-SECURITY] Secure Drizzle wrapper initialized');
  }
  
  /**
   * Execute a Drizzle query safely
   */
  async execute<T = any>(query: any): Promise<T> {
    try {
      // Check for SQL injection risks in the query if validation is enabled
      if (this.options.enableValidation) {
        this.validateQuery(query);
      }
      
      // Log the query if logging is enabled
      if (this.options.enableLogging) {
        this.logQuery(query);
      }
      
      // Execute the query
      return await this.db.execute(query);
    } catch (error: any) {
      // Log the error
      this.logError(error, query);
      throw error;
    }
  }
  
  /**
   * Run a Drizzle query safely
   */
  async query<T = any>(query: any): Promise<T> {
    try {
      // Check for SQL injection risks in the query if validation is enabled
      if (this.options.enableValidation) {
        this.validateQuery(query);
      }
      
      // Log the query if logging is enabled
      if (this.options.enableLogging) {
        this.logQuery(query);
      }
      
      // Execute the query
      return await this.db.query(query);
    } catch (error: any) {
      // Log the error
      this.logError(error, query);
      throw error;
    }
  }
  
  /**
   * Validate a Drizzle query for security issues
   */
  private validateQuery(query: any): void {
    // If the query is a string (raw SQL), check it with SQL monitor
    if (typeof query === 'string') {
      const isSafe = sqlMonitor.checkQuery(query, [], new Error().stack?.split('\n')[2]);
      
      if (!isSafe && this.options.strictMode) {
        throw new Error('[DRIZZLE-SECURITY] Raw SQL query rejected due to security concerns');
      }
      return;
    }
    
    // If the query is a Drizzle query object, check for unsafe patterns
    if (query && typeof query === 'object') {
      // Check if this is using raw SQL
      if (query.sql && typeof query.sql === 'string') {
        const isSafe = sqlMonitor.checkQuery(query.sql, query.params || [], new Error().stack?.split('\n')[2]);
        
        if (!isSafe && this.options.strictMode) {
          throw new Error('[DRIZZLE-SECURITY] Raw SQL in Drizzle query rejected due to security concerns');
        }
      }
      
      // Check for DELETE without WHERE (dangerous)
      if (query.type === 'delete' && (!query.where || Object.keys(query.where).length === 0)) {
        if (this.options.strictMode) {
          throw new Error('[DRIZZLE-SECURITY] DELETE without WHERE clause rejected for safety');
        } else {
          console.warn('[DRIZZLE-SECURITY] WARNING: DELETE without WHERE clause detected');
        }
      }
      
      // Check for UPDATE without WHERE (dangerous)
      if (query.type === 'update' && (!query.where || Object.keys(query.where).length === 0)) {
        if (this.options.strictMode) {
          throw new Error('[DRIZZLE-SECURITY] UPDATE without WHERE clause rejected for safety');
        } else {
          console.warn('[DRIZZLE-SECURITY] WARNING: UPDATE without WHERE clause detected');
        }
      }
    }
  }
  
  /**
   * Log a Drizzle query
   */
  private logQuery(query: any): void {
    let queryInfo: any = {};
    
    // Extract useful information from the query object
    if (typeof query === 'string') {
      queryInfo = { sql: query };
    } else if (query && typeof query === 'object') {
      if (query.sql) {
        queryInfo.sql = query.sql;
      }
      if (query.params) {
        queryInfo.params = query.params;
      }
      if (query.type) {
        queryInfo.type = query.type;
      }
      if (query.table) {
        queryInfo.table = query.table;
      }
      if (query.where) {
        queryInfo.where = query.where;
      }
    }
    
    // Log the query info to the console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[DRIZZLE-SECURITY] Query:', JSON.stringify(queryInfo, null, 2));
    }
  }
  
  /**
   * Log a Drizzle query error
   */
  private logError(error: Error, query: any): void {
    console.error('[DRIZZLE-SECURITY] Query error:', error);
    
    // Log to blockchain
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.ERROR,
      category: SecurityEventCategory.DATABASE_ERROR as any,
      message: `Drizzle query error: ${error.message}`,
      metadata: {
        error: error.message,
        query: typeof query === 'string' ? query : JSON.stringify(query)
      },
      timestamp: new Date()
    }).catch(logError: string: string => {
      console.error('[DRIZZLE-SECURITY] Error logging to blockchain:', logError);
    });
  }
  
  /**
   * Get the underlying Drizzle database instance
   */
  getDB(): DrizzleDB {
    console.warn('[DRIZZLE-SECURITY] WARNING: Accessing raw database connection bypasses security measures');
    return this.db;
  }
}

/**
 * Create a secure Drizzle ORM wrapper
 */
export function secureDrizzle(
  db: DrizzleDB,
  options: DrizzleSecurityOptions = {}
): SecureDrizzle {
  return new SecureDrizzle(db, options);
}

/**
 * Patch Drizzle models for better security
 */
export function patchDrizzleModel(model: any): any {
  // Make a copy of the original methods
  const originalFindFirst = model.findFirst;
  const originalFindMany = model.findMany;
  const originalUpdate = model.update;
  const originalDelete = model.delete;
  
  // Patch the findFirst method to add security logging
  if (originalFindFirst) {
    model.findFirst = async function(...args: any: any[]): Promise<any> {
      try {
        return await originalFindFirst.apply(this, args);
      } catch (error: any) {
        // Log the error
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.ERROR,
          category: SecurityEventCategory.DATABASE_ERROR as any,
          message: `Drizzle findFirst error: ${error.message}`,
          metadata: {
            error: error.message,
            args: JSON.stringify(args)
          },
          timestamp: new Date()
        }).catch(logError: string: string => {
          console.error('[DRIZZLE-SECURITY] Error logging to blockchain:', logError);
        });
        
        throw error;
      }
    };
  }
  
  // Patch the findMany method to add security logging
  if (originalFindMany) {
    model.findMany = async function(...args: any: any[]): Promise<any> {
      try {
        return await originalFindMany.apply(this, args);
      } catch (error: any) {
        // Log the error
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.ERROR,
          category: SecurityEventCategory.DATABASE_ERROR as any,
          message: `Drizzle findMany error: ${error.message}`,
          metadata: {
            error: error.message,
            args: JSON.stringify(args)
          },
          timestamp: new Date()
        }).catch(logError: string: string => {
          console.error('[DRIZZLE-SECURITY] Error logging to blockchain:', logError);
        });
        
        throw error;
      }
    };
  }
  
  // Patch the update method to add safety checks and security logging
  if (originalUpdate) {
    model.update = async function(...args: any: any[]): Promise<any> {
      try {
        // Check for WHERE clause
        if (args.length > 0 && args[0] && (!args[0].where || Object.keys(args[0].where).length === 0)) {
          console.warn('[DRIZZLE-SECURITY] WARNING: UPDATE without WHERE clause detected');
          // Can throw an error here if strict mode is desired
        }
        
        return await originalUpdate.apply(this, args);
      } catch (error: any) {
        // Log the error
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.ERROR,
          category: SecurityEventCategory.DATABASE_ERROR as any,
          message: `Drizzle update error: ${error.message}`,
          metadata: {
            error: error.message,
            args: JSON.stringify(args)
          },
          timestamp: new Date()
        }).catch(logError: string: string => {
          console.error('[DRIZZLE-SECURITY] Error logging to blockchain:', logError);
        });
        
        throw error;
      }
    };
  }
  
  // Patch the delete method to add safety checks and security logging
  if (originalDelete) {
    model.delete = async function(...args: any: any[]): Promise<any> {
      try {
        // Check for WHERE clause
        if (args.length > 0 && args[0] && (!args[0].where || Object.keys(args[0].where).length === 0)) {
          console.warn('[DRIZZLE-SECURITY] WARNING: DELETE without WHERE clause detected');
          // Can throw an error here if strict mode is desired
        }
        
        return await originalDelete.apply(this, args);
      } catch (error: any) {
        // Log the error
        securityBlockchain.addSecurityEvent({
          severity: SecurityEventSeverity.ERROR,
          category: SecurityEventCategory.DATABASE_ERROR as any,
          message: `Drizzle delete error: ${error.message}`,
          metadata: {
            error: error.message,
            args: JSON.stringify(args)
          },
          timestamp: new Date()
        }).catch(logError: string: string => {
          console.error('[DRIZZLE-SECURITY] Error logging to blockchain:', logError);
        });
        
        throw error;
      }
    };
  }
  
  return model;
}

/**
 * Usage examples:
 * 
 * // Create a secure Drizzle instance
 * import { db } from './db'; // Your Drizzle DB instance
 * import { secureDrizzle } from './security/drizzleSecurity';
 * 
 * const secureDB = secureDrizzle(db);
 * 
 * // Execute queries using the secure wrapper
 * const users = await secureDB.query(db.select().from(usersTable));
 * 
 * // Or patch individual models for security
 * import { patchDrizzleModel } from './security/drizzleSecurity';
 * import { users } from './db/schema';
 * 
 * const secureUsers = patchDrizzleModel(users);
 * 
 * // Now use the secure model
 * const user = await secureUsers.findFirst({
 *   where: { id: userId }
 * });
 */