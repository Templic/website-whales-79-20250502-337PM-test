/**
 * Database Security Integration
 * 
 * This module provides an easy-to-use integration layer for applying
 * SQL injection prevention techniques to existing database code.
 */

import { createSQLFix } from './sqlInjectionFix';

/**
 * Database connection interface
 */
interface DatabaseConnection {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}

/**
 * Secure database proxy
 * 
 * This class wraps a database connection with security measures.
 */
export class SecureDatabase {
  private db: DatabaseConnection;
  private sqlFix: unknown;
  
  constructor(db: DatabaseConnection) {
    this.db = db;
    this.sqlFix = createSQLFix(db);
  }
  
  /**
   * Execute a secure parameterized query
   * 
   * @param sql SQL query with placeholders ($1, $2, etc.)
   * @param params Parameters to bind to the query
   * @returns Query result
   */
  async query<T = any>(sql: string, params: unknown[] = []): Promise<T> {
    const result = await this.sqlFix.query(sql, params);
    return result as T;
  }
  
  /**
   * Securely select records from a table
   * 
   * @param table Table name
   * @param columns Array of column names to select
   * @param where Where conditions
   * @returns Query result
   */
  async select<T = any>(
    table: string, 
    columns: string[] = ['*'], 
    where: Record<string, unknown> = {}
  ): Promise<T[]> {
    const result = await this.sqlFix.select(table, columns, where);
    return result as T[];
  }
  
  /**
   * Securely insert a record into a table
   * 
   * @param table Table name
   * @param data Object with field-value pairs to insert
   * @returns Query result
   */
  async insert<T = any>(table: string, data: Record<string, unknown>): Promise<T> {
    const result = await this.sqlFix.insert(table, data);
    return result as T;
  }
  
  /**
   * Securely update records in a table
   * 
   * @param table Table name
   * @param data Object with field-value pairs to update
   * @param where Where conditions
   * @returns Query result
   */
  async update<T = any>(
    table: string, 
    data: Record<string, unknown>, 
    where: Record<string, unknown>
  ): Promise<T[]> {
    const result = await this.sqlFix.update(table, data, where);
    return result as T[];
  }
  
  /**
   * Securely delete records from a table
   * 
   * @param table Table name
   * @param where Where conditions
   * @returns Query result
   */
  async delete<T = any>(table: string, where: Record<string, unknown>): Promise<T[]> {
    const result = await this.sqlFix.delete(table, where);
    return result as T[];
  }
  
  /**
   * Get direct access to the underlying database connection
   * WARNING: Use with caution, as this bypasses security measures
   */
  getConnection(): DatabaseConnection {
    console.warn('[SECURITY WARNING] Accessing raw database connection bypasses security measures');
    return this.db;
  }
}

/**
 * Create a secure database wrapper for the provided connection
 */
export function createSecureDatabase(db: DatabaseConnection): SecureDatabase {
  return new SecureDatabase(db);
}

/**
 * Patch an existing database module to use secure queries
 * 
 * WARNING: This approach is more invasive and should be used with caution.
 * It's better to use the SecureDatabase wrapper if possible.
 */
export function patchDatabaseModule(db: unknown): void {
  const originalQuery = db.query;
  const sqlFix = createSQLFix(db);
  
  // Replace the query method with a secure version
  db.query = async function(sql: string, params: unknown[] = []): Promise<unknown> {
    // Check if this is a potentially unsafe query
    const hasDynamicContent = typeof sql === 'string' && 
      (sql.includes('${') || sql.includes('+') || sql.includes('concat'));
    
    if (hasDynamicContent) {
      console.warn('[SECURITY WARNING] Potentially unsafe query detected, consider using parameterized queries');
    }
    
    // Use the SQL fix utility for the query
    return sqlFix.query(sql, params);
  };
  
  // Add convenience methods
  db.selectSecure = async function<T = any>(
    table: string, 
    columns: string[] = ['*'], 
    where: Record<string, unknown> = {}
  ): Promise<T[]> {
    const result = await sqlFix.select(table, columns, where);
    return result as T[];
  };
  
  db.insertSecure = async function<T = any>(
    table: string, 
    data: Record<string, unknown>
  ): Promise<T> {
    const result = await sqlFix.insert(table, data);
    return result as T;
  };
  
  db.updateSecure = async function<T = any>(
    table: string, 
    data: Record<string, unknown>, 
    where: Record<string, unknown>
  ): Promise<T[]> {
    const result = await sqlFix.update(table, data, where);
    return result as T[];
  };
  
  db.deleteSecure = async function<T = any>(
    table: string, 
    where: Record<string, unknown>
  ): Promise<T[]> {
    const result = await sqlFix.delete(table, where);
    return result as T[];
  };
  
  console.log('[DATABASE-SECURITY] Database module patched with secure query methods');
}

/**
 * Examples of using the database security integration
 */
/*
// Example 1: Creating a secure database wrapper
import { createSecureDatabase } from './security/dbSecurityIntegration';
import { pool } from './database';

const db = createSecureDatabase(pool);

// Execute a secure query
const users = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);

// Use convenience methods
const activeUsers = await db.select('users', ['id', 'username'], { active: true });
const newUser = await db.insert('users', { username: 'john', email: 'john@example.com' });
const updatedUsers = await db.update('users', { active: false }, { last_login_at: null });
const deletedUsers = await db.delete('users', { deactivated_at: { '<': new Date() } });

// Example 2: Patching an existing database module
import { patchDatabaseModule } from './security/dbSecurityIntegration';
import * as db from './database';

patchDatabaseModule(db);

// Original methods continue to work but are now secure
const users = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);

// New convenience methods are available
const activeUsers = await db.selectSecure('users', ['id', 'username'], { active: true });
*/