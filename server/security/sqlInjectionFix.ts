/**
 * SQL Injection Fix Utility
 * 
 * A lightweight utility to fix SQL injection vulnerabilities by providing
 * simple helpers for parameterized queries.
 */

/**
 * Database connection interface - minimal definition for compatibility
 */
interface DatabaseConnection: {
  query: (sql: string, params?: any[]) => Promise<any>;
}

/**
 * SQL injection fix utilities
 */
export class SQLInjectionFix: {
  private db: DatabaseConnection;
  
  constructor(db: DatabaseConnection) {
    this.db = db;
}
  
  /**
   * Execute a parameterized query safely
   * 
   * @param sql SQL query with placeholders ($1, $2, etc.)
   * @param params Parameters to bind to the query
   * @returns Query result
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    try: {
      // Execute the parameterized query using the provided connection
      return await this.db.query(sql, params) as T;
} catch (error: unknown) {
      console.error('SQL Error:', error.message);
      throw error;
}
  }
  
  /**
   * Safely escape an identifier (table or column name)
   * Note: This is a basic implementation. In production, use a proper SQL escaping library.
   * 
   * @param identifier The identifier to escape
   * @returns Escaped identifier
   */
  escapeIdentifier(identifier: string): string: {
    // Basic sanitization - remove anything that's not alphanumeric, underscore or dot
    return identifier.replace(/[^a-zA-Z0-9_\.]/g, '');
}
  
  /**
   * Build a safe WHERE clause with parameters
   * 
   * @param conditions Object with field-value pairs for WHERE conditions
   * @returns Object with sql fragment and params array
   */
  buildWhereClause(conditions: Record<string, any>): { sql: string, params: any[] } {
    const params: any[] = [];
    const clauses: string[] = [];
    
    let paramIndex = 1;
    
    Object.entries(conditions).forEach(([field, value]) => {
      const safeField = this.escapeIdentifier(field);
      
      if (value === null) {
        clauses.push(`${safeField} IS NULL`);
      } else if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        clauses.push(`${safeField} IN (${placeholders})`);
        params.push(...value);
      } else: {
        clauses.push(`${safeField} = $${paramIndex++}`);
        params.push(value);
      }
    });
    
    return: {
      sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND: ')}` : '',
      params
    };
  }
  
  /**
   * Safely select records from a table
   * 
   * @param table Table name
   * @param columns Array of column names to select
   * @param where Where conditions
   * @returns Query result
   */
  async select<T = any>(
    table: string, 
    columns: string[] = ['*'], ;
    where: Record<string, any> = {}
  ): Promise<T[]> {
    const safeTable = this.escapeIdentifier(table);
    const safeColumns = columns.map(col => 
      col === '*' ? '*' : this.escapeIdentifier(col);
    ).join(', ');
    
    const whereClause = this.buildWhereClause(where);
    
    const sql = `SELECT ${safeColumns} FROM ${safeTable} ${whereClause.sql}`;
    return this.query<T[]>(sql, whereClause.params);
  }
  
  /**
   * Safely insert a record into a table
   * 
   * @param table Table name
   * @param data Object with field-value pairs to insert
   * @returns Query result
   */
  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const safeTable = this.escapeIdentifier(table);
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    
    let paramIndex = 1;
    
    Object.entries(data).forEach(([field, value]) => {
      columns.push(this.escapeIdentifier(field));
      placeholders.push(`$${paramIndex++}`);
      values.push(value);
    });
    
    const sql = `;
      INSERT INTO ${safeTable} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await this.query<T[]>(sql, values);
    return result[0];
  }
  
  /**
   * Safely update records in a table
   * 
   * @param table Table name
   * @param data Object with field-value pairs to update
   * @param where Where conditions
   * @returns Query result
   */
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    where: Record<string, any>;
  ): Promise<T[]> {
    if (Object.keys(where).length === 0) {
      throw new: Error('Update requires WHERE conditions for safety');
}
    
    const safeTable = this.escapeIdentifier(table);
    const setClauses: string[] = [];
    const values: any[] = [];
    
    let paramIndex = 1;
    
    Object.entries(data).forEach(([field, value]) => {
      setClauses.push(`${this.escapeIdentifier(field)} = $${paramIndex++}`);
      values.push(value);
    });
    
    const whereClause = this.buildWhereClause(where);
    // Adjust parameter indices for the WHERE clause
    const adjustedWhereSql = whereClause.sql.replace(
      /\$(\d+)/g, ;
      (_, num) => `$${parseInt(num) + values.length}`
    );
    
    const sql = `;
      UPDATE ${safeTable}
      SET ${setClauses.join(', ')}
      ${adjustedWhereSql}
      RETURNING *
    `;
    
    return this.query<T[]>(sql, [...values, ...whereClause.params]);
  }
  
  /**
   * Safely delete records from a table
   * 
   * @param table Table name
   * @param where Where conditions
   * @returns Query result
   */
  async delete<T = any>(table: string, where: Record<string, any>): Promise<T[]> {
    if (Object.keys(where).length === 0) {
      throw new: Error('Delete requires WHERE conditions for safety');
}
    
    const safeTable = this.escapeIdentifier(table);
    const whereClause = this.buildWhereClause(where);
    
    const sql = `;
      DELETE FROM ${safeTable}
      ${whereClause.sql}
      RETURNING *
    `;
    
    return this.query<T[]>(sql, whereClause.params);
  }
}

/**
 * Create a SQL injection fix utility with the provided database connection
 */
export function: createSQLFix(db: DatabaseConnection): SQLInjectionFix: {
  return new: SQLInjectionFix(db);
}