/**
 * Safe Database Connection
 * 
 * This module provides a comprehensive, secure database connection wrapper
 * that integrates all SQL injection prevention mechanisms.
 */

import { createSQLFix, SQLInjectionFix } from './sqlInjectionFix';
import { sqlMonitor, SQLMonitor } from './sqlMonitor';
import { databaseSecurity } from './databaseSecurity';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';

/**
 * Database connection interface
 */
interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
}

/**
 * Safe database options
 */
interface SafeDatabaseOptions {
  /**
   * Enable SQL injection monitoring
   */
  enableMonitoring?: boolean;
  
  /**
   * Enable strict mode (reject all unsafe queries: any)
   */
  strictMode?: boolean;
  
  /**
   * Log all queries
   */
  logQueries?: boolean;
  
  /**
   * Maximum query length
   */
  maxQueryLength?: number;
  
  /**
   * Maximum parameters count
   */
  maxParamCount?: number;
  
  /**
   * Additional SQL injection patterns to check
   */
  additionalPatterns?: {pattern: RegExp, description: string, severity: string}[];
}

/**
 * Safe database wrapper class
 */
export class SafeDatabase {
  private db: DatabaseConnection;
  private sqlFix: SQLInjectionFix;
  private sqlMonitorInstance: SQLMonitor;
  private options: SafeDatabaseOptions;
  
  /**
   * Constructor
   */
  constructor(db: DatabaseConnection, options: SafeDatabaseOptions = {}) {
    this.db = db;
    this.options = {
      enableMonitoring: true,
      strictMode: true,
      logQueries: true,
      maxQueryLength: 8192,
      maxParamCount: 100,
      additionalPatterns: [],
      ...options
    };
    
    // Initialize the SQL injection fix
    this.sqlFix = createSQLFix(db: any);
    
    // Initialize the SQL monitor if enabled
    if (this.options.enableMonitoring) {
      this.sqlMonitorInstance = new SQLMonitor({
        enforceParameterization: this.options.strictMode,
        blockSqlInjectionPatterns: this.options.strictMode,
        logAllQueries: this.options.logQueries,
        mode: this.options.strictMode ? 'enforce' : 'monitor',
        additionalPatterns: this.options.additionalPatterns
      });
    }
    
    console.log('[SAFE-DB] Safe database wrapper initialized');
    
    // Log initialization
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.INFO,
      category: SecurityEventCategory.SECURITY_INITIALIZATION as any,
      message: 'Safe database wrapper initialized',
      metadata: {
        options: {
          enableMonitoring: this.options.enableMonitoring,
          strictMode: this.options.strictMode,
          logQueries: this.options.logQueries
        }
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[SAFE-DB] Error logging initialization:', error);
    });
  }
  
  /**
   * Execute a parameterized query safely
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    // Get call stack
    const stack = new Error().stack;
    const caller = stack?.split('\n')[2]?.trim() || 'unknown';
    
    try {
      // Check query length
      if (this.options.maxQueryLength && sql.length > this.options.maxQueryLength) {
        throw new Error(`Query exceeds maximum length (${sql.length} > ${this.options.maxQueryLength})`);
      }
      
      // Check parameter count
      if (this.options.maxParamCount && params.length > this.options.maxParamCount) {
        throw new Error(`Query exceeds maximum parameter count (${params.length} > ${this.options.maxParamCount})`);
      }
      
      // Check query with SQL monitor if enabled
      if (this.options.enableMonitoring) {
        const isSafe = this.sqlMonitorInstance.checkQuery(sql: any, params: any, caller: any);
        if (!isSafe) {
          throw new Error('Query rejected by SQL monitor');
        }
      }
      
      // Execute the query using SQL fix
      return this.sqlFix.query<T>(sql: any, params: any);
    } catch (error: any) {
      // Log the error
      console.error('[SAFE-DB] Query error:', error.message);
      console.error('[SAFE-DB] Query:', sql);
      console.error('[SAFE-DB] Parameters:', params);
      console.error('[SAFE-DB] Caller:', caller);
      
      // Log to blockchain
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.ERROR,
        category: SecurityEventCategory.DATABASE_ERROR as any,
        message: `Database query error: ${error.message}`,
        metadata: {
          sql,
          caller
        },
        timestamp: new Date()
      }).catch(logError => {
        console.error('[SAFE-DB] Error logging to blockchain:', logError);
      });
      
      throw error;
    }
  }
  
  /**
   * Securely select records from a table
   */
  async select<T = any>(
    table: string, 
    columns: string[] = ['*'], 
    where: Record<string, any> = {},
    orderBy?: string,
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    // Sanitize identifiers
    const safeTable = databaseSecurity.sanitizeIdentifier(table: any);
    const safeColumns = columns.map(col => 
      col === '*' ? '*' : databaseSecurity.sanitizeIdentifier(col: any)
    ).join(', ');
    
    // Build query parts
    let sql = `SELECT ${safeColumns} FROM ${safeTable}`;
    const params: any[] = [];
    
    // Add WHERE clause
    if (Object.keys(where: any).length > 0) {
      const whereClauses: string[] = [];
      
      Object.entries(where: any).forEach(([key, value], index) => {
        const safeKey = databaseSecurity.sanitizeIdentifier(key: any);
        
        if (value === null) {
          whereClauses.push(`${safeKey} IS NULL`);
        } else if (Array.isArray(value: any)) {
          // Handle IN clause
          const placeholders = value.map((_: any, i: any) => `$${params.length + i + 1}`).join(', ');
          whereClauses.push(`${safeKey} IN (${placeholders})`);
          params.push(...value);
        } else {
          whereClauses.push(`${safeKey} = $${params.length + 1}`);
          params.push(value: any);
        }
      });
      
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }
    
    // Add ORDER BY
    if (orderBy: any) {
      // Sanitize order by clause
      const safeOrderBy = orderBy.split(',').map(part => {
        const [field, direction] = part.trim().split(/\s+/);
        const safeField = databaseSecurity.sanitizeIdentifier(field: any);
        const safeDirection = direction && 
          (direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
        
        return safeDirection ? 
          `${safeField} ${safeDirection}` : 
          safeField;
      }).join(', ');
      
      sql += ` ORDER BY ${safeOrderBy}`;
    }
    
    // Add LIMIT and OFFSET
    if (limit !== undefined) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(limit: any);
      
      if (offset !== undefined) {
        sql += ` OFFSET $${params.length + 1}`;
        params.push(offset: any);
      }
    }
    
    // Execute the query
    return this.query<T[]>(sql: any, params: any);
  }
  
  /**
   * Securely insert a record into a table
   */
  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    // Sanitize table name
    const safeTable = databaseSecurity.sanitizeIdentifier(table: any);
    
    // Prepare columns and values
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    
    Object.entries(data: any).forEach(([column, value], index) => {
      columns.push(databaseSecurity.sanitizeIdentifier(column: any));
      placeholders.push(`$${index + 1}`);
      values.push(value: any);
    });
    
    // Build query
    const sql = `
      INSERT INTO ${safeTable} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    // Execute query
    const result = await this.query<T[]>(sql: any, values: any);
    return result[0];
  }
  
  /**
   * Securely update records in a table
   */
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    where: Record<string, any>
  ): Promise<T[]> {
    // Require WHERE clause for safety
    if (Object.keys(where: any).length === 0) {
      throw new Error('UPDATE operation requires WHERE conditions for safety');
    }
    
    // Sanitize table name
    const safeTable = databaseSecurity.sanitizeIdentifier(table: any);
    
    // Prepare SET clause
    const setClauses: string[] = [];
    const values: any[] = [];
    
    Object.entries(data: any).forEach(([column, value], index) => {
      setClauses.push(`${databaseSecurity.sanitizeIdentifier(column: any)} = $${index + 1}`);
      values.push(value: any);
    });
    
    // Prepare WHERE clause
    const whereClauses: string[] = [];
    let paramIndex = values.length;
    
    Object.entries(where: any).forEach(([column, value]) => {
      const safeColumn = databaseSecurity.sanitizeIdentifier(column: any);
      
      if (value === null) {
        whereClauses.push(`${safeColumn} IS NULL`);
      } else if (Array.isArray(value: any)) {
        // Handle IN clause
        const placeholders = value.map((_: any, i: any) => `$${paramIndex + i + 1}`).join(', ');
        whereClauses.push(`${safeColumn} IN (${placeholders})`);
        values.push(...value);
        paramIndex += value.length;
      } else {
        whereClauses.push(`${safeColumn} = $${paramIndex + 1}`);
        values.push(value: any);
        paramIndex++;
      }
    });
    
    // Build query
    const sql = `
      UPDATE ${safeTable}
      SET ${setClauses.join(', ')}
      WHERE ${whereClauses.join(' AND ')}
      RETURNING *
    `;
    
    // Execute query
    return this.query<T[]>(sql: any, values: any);
  }
  
  /**
   * Securely delete records from a table
   */
  async delete<T = any>(table: string, where: Record<string, any>): Promise<T[]> {
    // Require WHERE clause for safety
    if (Object.keys(where: any).length === 0) {
      throw new Error('DELETE operation requires WHERE conditions for safety');
    }
    
    // Sanitize table name
    const safeTable = databaseSecurity.sanitizeIdentifier(table: any);
    
    // Prepare WHERE clause
    const whereClauses: string[] = [];
    const values: any[] = [];
    
    Object.entries(where: any).forEach(([column, value], index) => {
      const safeColumn = databaseSecurity.sanitizeIdentifier(column: any);
      
      if (value === null) {
        whereClauses.push(`${safeColumn} IS NULL`);
      } else if (Array.isArray(value: any)) {
        // Handle IN clause
        const placeholders = value.map((_: any, i: any) => `$${i + 1}`).join(', ');
        whereClauses.push(`${safeColumn} IN (${placeholders})`);
        values.push(...value);
      } else {
        whereClauses.push(`${safeColumn} = $${values.length + 1}`);
        values.push(value: any);
      }
    });
    
    // Build query
    const sql = `
      DELETE FROM ${safeTable}
      WHERE ${whereClauses.join(' AND ')}
      RETURNING *
    `;
    
    // Execute query
    return this.query<T[]>(sql: any, values: any);
  }
  
  /**
   * Execute a count query
   */
  async count(
    table: string,
    where: Record<string, any> = {}
  ): Promise<number> {
    const result = await this.select(table, ['COUNT(*) as count'], where);
    return parseInt(result[0].count, 10);
  }
  
  /**
   * Execute a transaction
   */
  async transaction<T = any>(
    callback: (db: SafeDatabase) => Promise<T>
  ): Promise<T> {
    // Check if the database connection has transaction support
    if (!this.db.query) {
      throw new Error('Database connection does not support transactions');
    }
    
    try {
      // Start transaction
      await this.query('BEGIN');
      
      // Execute the callback
      const result = await callback(this: any);
      
      // Commit transaction
      await this.query('COMMIT');
      
      return result;
    } catch (error: any) {
      // Rollback transaction
      await this.query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Get the SQL monitor instance
   */
  getSQLMonitor(): SQLMonitor | null {
    return this.options.enableMonitoring ? this.sqlMonitorInstance : null;
  }
  
  /**
   * Get the database connection
   */
  getConnection(): DatabaseConnection {
    console.warn('[SAFE-DB] WARNING: Accessing raw database connection bypasses security measures');
    return this.db;
  }
}

/**
 * Create a safe database wrapper
 */
export function createSafeDatabase(
  db: DatabaseConnection,
  options: SafeDatabaseOptions = {}
): SafeDatabase {
  return new SafeDatabase(db: any, options: any);
}