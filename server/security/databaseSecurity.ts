/**
 * Database Security Module
 * 
 * Provides secure database access patterns and protection against SQL injection
 * by implementing parameterized queries, query sanitization, and monitoring.
 */

import { securityFabric } from './advanced/SecurityFabric';
import { securityBlockchain } from './advanced/blockchain/ImmutableSecurityLogs';
import { SecurityEventCategory, SecurityEventSeverity } from './advanced/blockchain/SecurityEventTypes';
import * as crypto from 'crypto';

/**
 * Query type enumeration
 */
export enum QueryType {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE = 'CREATE',
  DROP = 'DROP',
  ALTER = 'ALTER',
  TRUNCATE = 'TRUNCATE',
  OTHER = 'OTHER'
}

/**
 * Database query interface
 */
export interface DatabaseQuery {
  /**
   * Query ID
   */
  id: string;
  
  /**
   * Query type
   */
  type: QueryType;
  
  /**
   * SQL query text
   */
  sql: string;
  
  /**
   * Query parameters
   */
  params: any[];
  
  /**
   * Source location (file and line number)
   */
  source?: string;
  
  /**
   * Timestamp
   */
  timestamp: Date;
}

/**
 * Database security options
 */
export interface DatabaseSecurityOptions {
  /**
   * Enable query logging
   */
  enableQueryLogging?: boolean;
  
  /**
   * Enable query analysis
   */
  enableQueryAnalysis?: boolean;
  
  /**
   * Enable query blocking for dangerous operations
   */
  enableQueryBlocking?: boolean;
  
  /**
   * Maximum query length
   */
  maxQueryLength?: number;
  
  /**
   * Maximum parameter count
   */
  maxParamCount?: number;
  
  /**
   * List of allowed query types
   */
  allowedQueryTypes?: QueryType[];
  
  /**
   * Additional dangerous patterns to check
   */
  dangerousPatterns?: RegExp[];
}

/**
 * Database security class
 */
export class DatabaseSecurity {
  /**
   * Database security options
   */
  private options: DatabaseSecurityOptions;
  
  /**
   * Query history
   */
  private queryHistory: DatabaseQuery[] = [];
  
  /**
   * Maximum query history size
   */
  private readonly MAX_QUERY_HISTORY = 1000;
  
  /**
   * Default dangerous patterns
   */
  private readonly DEFAULT_DANGEROUS_PATTERNS = [
    /DROP\s+TABLE/i,
    /DROP\s+DATABASE/i,
    /TRUNCATE\s+TABLE/i,
    /DELETE\s+FROM\s+.+\s+(?:WHERE\s+1\s*=\s*1|WITHOUT\s+WHERE)/i,
    /sys\.fn_sqlvarbasetostr/i,
    /EXEC\s+xp_cmdshell/i,
    /sp_execute_external_script/i
  ];
  
  /**
   * Constructor
   */
  constructor(options: DatabaseSecurityOptions = {}) {
    // Set default options
    this.options = {
      enableQueryLogging: true,
      enableQueryAnalysis: true,
      enableQueryBlocking: true,
      maxQueryLength: 8192,
      maxParamCount: 100,
      allowedQueryTypes: [
        QueryType.SELECT,
        QueryType.INSERT,
        QueryType.UPDATE,
        QueryType.DELETE
      ],
      dangerousPatterns: [],
      ...options
    };
    
    // Add default dangerous patterns
    if (this.options.dangerousPatterns) {
      this.options.dangerousPatterns = [
        ...this.DEFAULT_DANGEROUS_PATTERNS,
        ...this.options.dangerousPatterns
      ];
    } else {
      this.options.dangerousPatterns = this.DEFAULT_DANGEROUS_PATTERNS;
    }
    
    // Register with security fabric
    securityFabric.registerComponent('databaseSecurity', this);
    
    console.log('[DATABASE-SECURITY] Database security module initialized');
  }
  
  /**
   * Create a parameterized query
   */
  public createParameterizedQuery(sql: string, params: any[] = [], source?: string): DatabaseQuery {
    // Determine query type
    const type = this.determineQueryType(sql);
    
    // Create query object
    const query: DatabaseQuery = {
      id: crypto.randomUUID(),
      type,
      sql,
      params,
      source,
      timestamp: new Date()
    };
    
    // Validate and analyze query
    if (this.options.enableQueryAnalysis) {
      this.analyzeQuery(query);
    }
    
    // Log query
    if (this.options.enableQueryLogging) {
      this.logQuery(query);
    }
    
    return query;
  }
  
  /**
   * Determine query type
   */
  private determineQueryType(sql: string): QueryType {
    const upperSql = sql.trim().toUpperCase();
    
    if (upperSql.startsWith('SELECT')) return QueryType.SELECT;
    if (upperSql.startsWith('INSERT')) return QueryType.INSERT;
    if (upperSql.startsWith('UPDATE')) return QueryType.UPDATE;
    if (upperSql.startsWith('DELETE')) return QueryType.DELETE;
    if (upperSql.startsWith('CREATE')) return QueryType.CREATE;
    if (upperSql.startsWith('DROP')) return QueryType.DROP;
    if (upperSql.startsWith('ALTER')) return QueryType.ALTER;
    if (upperSql.startsWith('TRUNCATE')) return QueryType.TRUNCATE;
    
    return QueryType.OTHER;
  }
  
  /**
   * Analyze a query for security issues
   */
  private analyzeQuery(query: DatabaseQuery): void {
    // Check query length
    if (this.options.maxQueryLength && query.sql.length > this.options.maxQueryLength) {
      this.handleSecurityViolation(
        query,
        'Query exceeds maximum length',
        SecurityEventSeverity.MEDIUM
      );
    }
    
    // Check parameter count
    if (this.options.maxParamCount && query.params.length > this.options.maxParamCount) {
      this.handleSecurityViolation(
        query,
        'Query exceeds maximum parameter count',
        SecurityEventSeverity.MEDIUM
      );
    }
    
    // Check if query type is allowed
    if (
      this.options.allowedQueryTypes &&
      !this.options.allowedQueryTypes.includes(query.type)
    ) {
      this.handleSecurityViolation(
        query,
        `Query type ${query.type} is not allowed`,
        SecurityEventSeverity.HIGH
      );
    }
    
    // Check for dangerous patterns
    if (this.options.dangerousPatterns) {
      for (const pattern of this.options.dangerousPatterns) {
        if (pattern.test(query.sql)) {
          this.handleSecurityViolation(
            query,
            `Query contains dangerous pattern: ${pattern}`,
            SecurityEventSeverity.HIGH
          );
          break;
        }
      }
    }
    
    // Check for SQL injection patterns in string parameters
    for (const param of query.params) {
      if (typeof param === 'string') {
        const sqlInjectionPatterns = [
          /'\s*OR\s*['"]/i,
          /'\s*OR\s*(\d+|true)\s*--/i,
          /'\s*;\s*[A-Z]/i,
          /'\s*UNION\s+ALL\s+SELECT/i,
          /'\s*DROP\s+TABLE/i
        ];
        
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(param)) {
            this.handleSecurityViolation(
              query,
              `Parameter contains potential SQL injection pattern: ${pattern}`,
              SecurityEventSeverity.HIGH
            );
            break;
          }
        }
      }
    }
  }
  
  /**
   * Handle security violation
   */
  private handleSecurityViolation(
    query: DatabaseQuery,
    reason: string,
    severity: SecurityEventSeverity
  ): void {
    // Log security event
    securityBlockchain.addSecurityEvent({
      severity,
      category: SecurityEventCategory.DATABASE_SECURITY as any,
      message: `Database security violation: ${reason}`,
      metadata: {
        queryId: query.id,
        queryType: query.type,
        source: query.source
      },
      timestamp: new Date()
    }).catch(error => {
      console.error('[DATABASE-SECURITY] Error logging security event:', error);
    });
    
    // Emit security event
    securityFabric.emit('security:database:violation', {
      queryId: query.id,
      queryType: query.type,
      reason,
      severity,
      timestamp: new Date()
    });
    
    // Block query if enabled
    if (this.options.enableQueryBlocking && severity === SecurityEventSeverity.HIGH) {
      throw new Error(`[DATABASE-SECURITY] Blocked query execution: ${reason}`);
    }
    
    // Log warning
    console.warn(`[DATABASE-SECURITY] Security violation: ${reason}`);
  }
  
  /**
   * Log a query
   */
  private logQuery(query: DatabaseQuery): void {
    // Add to query history
    this.queryHistory.unshift(query);
    
    // Trim history if needed
    if (this.queryHistory.length > this.MAX_QUERY_HISTORY) {
      this.queryHistory = this.queryHistory.slice(0, this.MAX_QUERY_HISTORY);
    }
    
    // Emit query event
    securityFabric.emit('security:database:query', {
      queryId: query.id,
      queryType: query.type,
      source: query.source,
      timestamp: new Date()
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[DATABASE-SECURITY] Query: ${query.sql}`,
        'Params:',
        query.params
      );
    }
  }
  
  /**
   * Execute a query securely
   */
  public async executeQuery<T>(
    db: any,
    sql: string,
    params: any[] = [],
    source?: string
  ): Promise<T> {
    // Create parameterized query
    const query = this.createParameterizedQuery(sql, params, source);
    
    try {
      // Execute query using the provided database connection
      const startTime = Date.now();
      const result = await db.query(query.sql, query.params);
      const endTime = Date.now();
      
      // Emit query completion event
      securityFabric.emit('security:database:query:complete', {
        queryId: query.id,
        queryType: query.type,
        source: query.source,
        duration: endTime - startTime,
        timestamp: new Date()
      });
      
      return result as T;
    } catch (error: any) {
      // Emit query error event
      securityFabric.emit('security:database:query:error', {
        queryId: query.id,
        queryType: query.type,
        source: query.source,
        error: error.message,
        timestamp: new Date()
      });
      
      // Log error
      securityBlockchain.addSecurityEvent({
        severity: SecurityEventSeverity.MEDIUM,
        category: SecurityEventCategory.DATABASE_ERROR as any,
        message: `Database query error: ${error.message}`,
        metadata: {
          queryId: query.id,
          queryType: query.type,
          source: query.source,
          sql: query.sql,
          error: error.message
        },
        timestamp: new Date()
      }).catch(logError => {
        console.error('[DATABASE-SECURITY] Error logging security event:', logError);
      });
      
      throw error;
    }
  }
  
  /**
   * Get query history
   */
  public getQueryHistory(): DatabaseQuery[] {
    return [...this.queryHistory];
  }
  
  /**
   * Clear query history
   */
  public clearQueryHistory(): void {
    this.queryHistory = [];
  }
  
  /**
   * Sanitize SQL identifier
   */
  public sanitizeIdentifier(identifier: string): string {
    // Remove potential SQL injection characters
    return identifier.replace(/[^a-zA-Z0-9_]/g, '');
  }
  
  /**
   * Create a prepared statement
   */
  public createPreparedStatement(
    db: any,
    sql: string,
    params: any[] = [],
    source?: string
  ): any {
    // Create parameterized query
    const query = this.createParameterizedQuery(sql, params, source);
    
    // Create prepared statement using the provided database connection
    return db.prepare(query.sql);
  }
  
  /**
   * Create IN clause with parameters
   */
  public createInClause(values: any[]): { sql: string; params: any[] } {
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    return {
      sql: `IN (${placeholders})`,
      params: values
    };
  }
}

/**
 * Global database security instance
 */
export const databaseSecurity = new DatabaseSecurity();