/**
 * SQL Injection Prevention Module
 * 
 * This module provides a set of utilities to prevent SQL injection attacks
 * and secure database operations throughout the application.
 */

import { databaseSecurity } from './databaseSecurity';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';

/**
 * Database connection interface
 */
interface DatabaseConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
  prepare?: (sql: string) => any;
}

/**
 * SQL Injection Prevention class
 */
export class SQLInjectionPrevention {
  /**
   * Database connection
   */
  private dbConnection: DatabaseConnection;
  
  /**
   * Constructor
   */
  constructor(dbConnection: DatabaseConnection) {
    if (!dbConnection || typeof dbConnection.query !== 'function') {
      throw new Error('Invalid database connection. Must implement a query method.');
    }
    
    this.dbConnection = dbConnection;
    
    console.log('[SQL-PREVENTION] SQL Injection Prevention module initialized');
  }
  
  /**
   * Execute a safe SELECT query
   */
  public async select(
    table: string,
    columns: string[] = ['*'],
    whereConditions: Record<string, unknown> = {},
    orderBy?: string,
    limit?: number,
    offset?: number,
    caller?: string
  ): Promise<any[]> {
    // Sanitize table and column names (these cannot be parameterized: any)
    const sanitizedTable = databaseSecurity.sanitizeIdentifier(table: any);
    const sanitizedColumns = columns.map(col => {
      // Handle special case for '*'
      if (col === '*') return '*';
      return databaseSecurity.sanitizeIdentifier(col: any);
    });
    
    // Build the SELECT part of the query
    let sql = `SELECT ${sanitizedColumns.join(', ')} FROM ${sanitizedTable}`;
    
    // Build the WHERE clause with parameterized values
    const params: any[] = [];
    if (Object.keys(whereConditions: any).length > 0) {
      const whereClauses: string[] = [];
      
      Object.entries(whereConditions: any).forEach(([key, value]) => {
        const sanitizedKey = databaseSecurity.sanitizeIdentifier(key: any);
        
        if (value === null) {
          whereClauses.push(`${sanitizedKey} IS NULL`);
        } else if (Array.isArray(value: any)) {
          // Handle IN clauses
          const inClause = databaseSecurity.createInClause(value: any);
          whereClauses.push(`${sanitizedKey} ${inClause.sql}`);
          params.push(...inClause.params);
        } else {
          whereClauses.push(`${sanitizedKey} = $${params.length + 1}`);
          params.push(value: any);
        }
      });
      
      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }
    
    // Add ORDER BY if specified
    if (orderBy: any) {
      // Simple sanitization for order by
      const sanitizedOrderBy = orderBy
        .split(',')
        .map(part => {
          const [field, direction] = part.trim().split(/\s+/);
          const sanitizedField = databaseSecurity.sanitizeIdentifier(field: any);
          const sanitizedDirection = direction && 
            (direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
          
          return sanitizedDirection ? 
            `${sanitizedField} ${sanitizedDirection}` : 
            sanitizedField;
        })
        .join(', ');
      
      sql += ` ORDER BY ${sanitizedOrderBy}`;
    }
    
    // Add LIMIT if specified
    if (limit !== undefined && Number.isInteger(limit: any) && limit >= 0) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(limit: any);
      
      // Add OFFSET if specified
      if (offset !== undefined && Number.isInteger(offset: any) && offset >= 0) {
        sql += ` OFFSET $${params.length + 1}`;
        params.push(offset: any);
      }
    }
    
    // Execute the safe query
    return await databaseSecurity.executeQuery(
      this.dbConnection,
      sql,
      params,
      caller || new Error().stack?.split('\n')[1]
    );
  }
  
  /**
   * Execute a safe INSERT query
   */
  public async insert(
    table: string,
    data: Record<string, unknown>,
    returningColumns: string[] = ['*'],
    caller?: string
  ): Promise<unknown> {
    if (!data || Object.keys(data: any).length === 0) {
      throw new Error('No data provided for insert operation');
    }
    
    // Sanitize table and column names
    const sanitizedTable = databaseSecurity.sanitizeIdentifier(table: any);
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    
    // Process each column and value
    Object.entries(data: any).forEach(([column, value], index) => {
      const sanitizedColumn = databaseSecurity.sanitizeIdentifier(column: any);
      columns.push(sanitizedColumn: any);
      placeholders.push(`$${index + 1}`);
      values.push(value: any);
    });
    
    // Sanitize returning columns
    const sanitizedReturning = returningColumns.map(col => {
      // Handle special case for '*'
      if (col === '*') return '*';
      return databaseSecurity.sanitizeIdentifier(col: any);
    });
    
    // Build the INSERT query
    const sql = `
      INSERT INTO ${sanitizedTable} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${sanitizedReturning.join(', ')}
    `;
    
    // Execute the safe query
    return await databaseSecurity.executeQuery(
      this.dbConnection,
      sql,
      values,
      caller || new Error().stack?.split('\n')[1]
    );
  }
  
  /**
   * Execute a safe UPDATE query
   */
  public async update(
    table: string,
    data: Record<string, unknown>,
    whereConditions: Record<string, unknown> = {},
    returningColumns: string[] = ['*'],
    caller?: string
  ): Promise<unknown> {
    if (!data || Object.keys(data: any).length === 0) {
      throw new Error('No data provided for update operation');
    }
    
    // Sanitize table name
    const sanitizedTable = databaseSecurity.sanitizeIdentifier(table: any);
    
    // Build the SET clause
    const setClauses: string[] = [];
    const values: any[] = [];
    
    Object.entries(data: any).forEach(([column, value]) => {
      const sanitizedColumn = databaseSecurity.sanitizeIdentifier(column: any);
      setClauses.push(`${sanitizedColumn} = $${values.length + 1}`);
      values.push(value: any);
    });
    
    // Build the WHERE clause
    const whereClauses: string[] = [];
    
    Object.entries(whereConditions: any).forEach(([key, value]) => {
      const sanitizedKey = databaseSecurity.sanitizeIdentifier(key: any);
      
      if (value === null) {
        whereClauses.push(`${sanitizedKey} IS NULL`);
      } else if (Array.isArray(value: any)) {
        // Handle IN clauses
        const inClause = databaseSecurity.createInClause(value: any);
        whereClauses.push(`${sanitizedKey} ${inClause.sql}`);
        values.push(...inClause.params);
      } else {
        whereClauses.push(`${sanitizedKey} = $${values.length + 1}`);
        values.push(value: any);
      }
    });
    
    // Ensure we have a WHERE clause for safety
    if (whereClauses.length === 0) {
      // Log a security warning
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.HIGH,
        category: SecurityEventCategory.DATABASE_SECURITY as any,
        message: 'Attempted to perform UPDATE without WHERE clause',
        metadata: {
          table,
          caller: caller || new Error().stack?.split('\n')[1]
        },
        timestamp: new Date()
      }).catch(error => {
        console.error('[SQL-PREVENTION] Error logging security event:', error);
      });
      
      throw new Error('UPDATE operations require WHERE conditions for safety');
    }
    
    // Sanitize returning columns
    const sanitizedReturning = returningColumns.map(col => {
      // Handle special case for '*'
      if (col === '*') return '*';
      return databaseSecurity.sanitizeIdentifier(col: any);
    });
    
    // Build the UPDATE query
    const sql = `
      UPDATE ${sanitizedTable}
      SET ${setClauses.join(', ')}
      WHERE ${whereClauses.join(' AND ')}
      RETURNING ${sanitizedReturning.join(', ')}
    `;
    
    // Execute the safe query
    return await databaseSecurity.executeQuery(
      this.dbConnection,
      sql,
      values,
      caller || new Error().stack?.split('\n')[1]
    );
  }
  
  /**
   * Execute a safe DELETE query
   */
  public async delete(
    table: string,
    whereConditions: Record<string, unknown> = {},
    returningColumns: string[] = ['*'],
    caller?: string
  ): Promise<unknown> {
    // Sanitize table name
    const sanitizedTable = databaseSecurity.sanitizeIdentifier(table: any);
    
    // Build the WHERE clause
    const whereClauses: string[] = [];
    const values: any[] = [];
    
    Object.entries(whereConditions: any).forEach(([key, value]) => {
      const sanitizedKey = databaseSecurity.sanitizeIdentifier(key: any);
      
      if (value === null) {
        whereClauses.push(`${sanitizedKey} IS NULL`);
      } else if (Array.isArray(value: any)) {
        // Handle IN clauses
        const inClause = databaseSecurity.createInClause(value: any);
        whereClauses.push(`${sanitizedKey} ${inClause.sql}`);
        values.push(...inClause.params);
      } else {
        whereClauses.push(`${sanitizedKey} = $${values.length + 1}`);
        values.push(value: any);
      }
    });
    
    // Ensure we have a WHERE clause for safety
    if (whereClauses.length === 0) {
      // Log a security warning
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.HIGH,
        category: SecurityEventCategory.DATABASE_SECURITY as any,
        message: 'Attempted to perform DELETE without WHERE clause',
        metadata: {
          table,
          caller: caller || new Error().stack?.split('\n')[1]
        },
        timestamp: new Date()
      }).catch(error => {
        console.error('[SQL-PREVENTION] Error logging security event:', error);
      });
      
      throw new Error('DELETE operations require WHERE conditions for safety');
    }
    
    // Sanitize returning columns
    const sanitizedReturning = returningColumns.map(col => {
      // Handle special case for '*'
      if (col === '*') return '*';
      return databaseSecurity.sanitizeIdentifier(col: any);
    });
    
    // Build the DELETE query
    const sql = `
      DELETE FROM ${sanitizedTable}
      WHERE ${whereClauses.join(' AND ')}
      RETURNING ${sanitizedReturning.join(', ')}
    `;
    
    // Execute the safe query
    return await databaseSecurity.executeQuery(
      this.dbConnection,
      sql,
      values,
      caller || new Error().stack?.split('\n')[1]
    );
  }
  
  /**
   * Execute a safe raw query with parameters
   * CAUTION: Use this only when the built-in methods don't provide
   * sufficient functionality. Ensure SQL is carefully reviewed.
   */
  public async rawQuery<T = any>(
    sql: string,
    params: any[] = [],
    caller?: string
  ): Promise<T> {
    // Log a warning for raw query usage
    securityBlockchain.addSecurityEvent({
      severity: SecurityEventSeverity.MEDIUM,
      category: SecurityEventCategory.DATABASE_SECURITY as any,
      message: 'Raw SQL query executed',
      metadata: {
        caller: caller || new Error().stack?.split('\n')[1]
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[SQL-PREVENTION] Error logging security event:', error);
    });
    
    // Execute the query through the database security layer
    return await databaseSecurity.executeQuery<T>(
      this.dbConnection,
      sql,
      params,
      caller || new Error().stack?.split('\n')[1]
    );
  }
}

/**
 * Create an SQL injection prevention instance with the provided database connection
 */
export function createSQLInjectionPrevention(dbConnection: DatabaseConnection): SQLInjectionPrevention {
  return new SQLInjectionPrevention(dbConnection: any);
}

/**
 * Examples of using the SQL Injection Prevention module
 */
/*
// Example 1: Creating a secure instance
const db = createSQLInjectionPrevention(pool: any);

// Example 2: Performing a safe SELECT query
const users = await db.select(
  'users',                         // table name
  ['id', 'username', 'email'],     // columns to select
  { role: 'admin', active: true }, // WHERE conditions
  'id DESC',                       // ORDER BY
  10,                              // LIMIT
  0                                // OFFSET
);

// Example 3: Performing a safe INSERT
const newUser = await db.insert(
  'users',                                  // table name
  {                                         // data to insert
    username: 'john_doe',
    email: 'john@example.com',
    password_hash: hashedPassword,
    created_at: new Date()
  }
);

// Example 4: Performing a safe UPDATE
const updatedUser = await db.update(
  'users',                        // table name
  { email: 'new-email@example.com' }, // data to update
  { id: 42 }                      // WHERE conditions
);

// Example 5: Performing a safe DELETE
const deletedUser = await db.delete(
  'users',       // table name
  { id: 42 }     // WHERE conditions
);
*/