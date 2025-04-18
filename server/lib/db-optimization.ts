/**
 * Database Optimization Utilities
 * 
 * Provides functions for optimizing database operations, queries, and connections.
 * Includes tools for query optimization, connection pooling, and monitoring.
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Default database connection pool settings
const DEFAULT_POOL_CONFIG = {
  max: 20,           // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,  // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  maxUses: 7500,     // Close and replace a connection after this many uses
};

// Singleton database pool
let pool: Pool | null = null;

/**
 * Initialize or get the database connection pool
 * Ensures only one pool exists throughout the application
 * 
 * @param config Optional configuration to override defaults
 * @returns Database connection pool
 */
export function getDbPool(config = DEFAULT_POOL_CONFIG): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    try {
      pool = new Pool({
        connectionString: databaseUrl,
        ...config,
      });
      
      // Log connection events
      pool.on('connect', () => {
        console.log('[Database] New connection established');
      });
      
      pool.on('error', (error: Error) => {
        console.error('[Database] Error in connection pool:', error.message);
      });
      
      console.log('[Database] Connection pool initialized');
    } catch (error) {
      console.error('[Database] Failed to initialize connection pool:', error);
      throw error;
    }
  }
  
  return pool;
}

/**
 * Get a client from the connection pool with timeout
 * 
 * @param timeout Timeout in milliseconds
 * @returns Promise resolving to a database client
 */
export async function getDbClient(timeout = 5000): Promise<PoolClient> {
  const dbPool = getDbPool();
  
  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<PoolClient>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database connection timed out after ${timeout}ms`));
      }, timeout);
    });
    
    // Get a client from the pool
    const clientPromise = dbPool.connect();
    
    // Race the client acquisition against the timeout
    return await Promise.race([clientPromise, timeoutPromise]);
  } catch (error) {
    console.error('[Database] Failed to acquire client:', error);
    throw error;
  }
}

/**
 * Execute a query with built-in error handling and performance logging
 * 
 * @param query SQL query string
 * @param params Query parameters
 * @param options Optional query options
 * @returns Promise resolving to query result
 */
export async function executeQuery<T extends Record<string, unknown>>(
  query: string,
  params: any[] = [],
  options: { timeout?: number; label?: string } = {}
): Promise<QueryResult<T>> {
  const { timeout = 5000, label = 'query' } = options;
  const start = process.hrtime();
  let client: PoolClient | null = null;
  
  try {
    // Get a client from the pool
    client = await getDbClient(timeout);
    
    // Execute the query
    const result = await client.query<T>(query, params);
    
    // Calculate and log execution time
    const diff = process.hrtime(start);
    const duration = diff[0] * 1000 + diff[1] / 1000000;
    
    if (duration > 500) {
      console.warn(`[Database] Slow ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    // Calculate execution time even on error
    const diff = process.hrtime(start);
    const duration = diff[0] * 1000 + diff[1] / 1000000;
    
    console.error(
      `[Database] Error in ${label} (${duration.toFixed(2)}ms):`,
      error instanceof Error ? error.message : 'Unknown error',
      'Query:',
      query.slice(0, 200) + (query.length > 200 ? '...' : '')
    );
    
    throw error;
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

/**
 * Execute a parameterized query with named parameters
 * 
 * @param query SQL query with named parameters (:paramName)
 * @param params Object with parameter values
 * @param options Optional query options
 * @returns Promise resolving to query result
 */
export async function executeNamedQuery<T extends Record<string, unknown>>(
  query: string,
  params: Record<string, any> = {},
  options: { timeout?: number; label?: string } = {}
): Promise<QueryResult<T>> {
  // Convert named parameters to positional parameters
  const paramNames = Object.keys(params);
  const positionalParams: any[] = [];
  
  let processedQuery = query;
  let paramIndex = 1;
  
  // Replace each named parameter with a positional parameter
  paramNames.forEach(name => {
    const regex = new RegExp(`:${name}\\b`, 'g');
    processedQuery = processedQuery.replace(regex, `$${paramIndex}`);
    positionalParams.push(params[name]);
    paramIndex++;
  });
  
  // Execute the query with positional parameters
  return executeQuery<T>(
    processedQuery,
    positionalParams,
    options
  );
}

/**
 * Build a dynamic query with optional clauses
 * Helps prevent SQL injection by properly parameterizing dynamic conditions
 */
export function buildDynamicQuery(
  baseQuery: string,
  conditions: Record<string, any> = {},
  options: {
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    groupBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): { query: string; params: any[] } {
  const params: any[] = [];
  const whereClauses: string[] = [];
  
  // Build WHERE clauses from conditions
  Object.entries(conditions).forEach(([key, value], index) => {
    if (value !== undefined && value !== null) {
      const paramIndex = params.length + 1;
      
      // Handle different types of conditions
      if (Array.isArray(value)) {
        // Array values for IN operations
        whereClauses.push(`${key} IN (${value.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
        params.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Object values for complex operations
        if ('like' in value) {
          whereClauses.push(`${key} ILIKE $${paramIndex}`);
          params.push(`%${value.like}%`);
        } else if ('gt' in value) {
          whereClauses.push(`${key} > $${paramIndex}`);
          params.push(value.gt);
        } else if ('lt' in value) {
          whereClauses.push(`${key} < $${paramIndex}`);
          params.push(value.lt);
        } else if ('gte' in value) {
          whereClauses.push(`${key} >= $${paramIndex}`);
          params.push(value.gte);
        } else if ('lte' in value) {
          whereClauses.push(`${key} <= $${paramIndex}`);
          params.push(value.lte);
        } else if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
          whereClauses.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(value.between[0], value.between[1]);
        }
      } else {
        // Simple equality condition
        whereClauses.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
    }
  });
  
  // Construct WHERE clause
  let whereClause = '';
  if (whereClauses.length > 0) {
    whereClause = ` WHERE ${whereClauses.join(' AND ')}`;
  }
  
  // Add ORDER BY if specified
  let orderClause = '';
  if (options.orderBy) {
    const direction = options.orderDirection || 'ASC';
    // Validate order column to prevent SQL injection
    if (/^[a-zA-Z0-9_\.]+$/.test(options.orderBy)) {
      orderClause = ` ORDER BY ${options.orderBy} ${direction}`;
    }
  }
  
  // Add GROUP BY if specified
  let groupClause = '';
  if (options.groupBy) {
    // Validate group column to prevent SQL injection
    if (/^[a-zA-Z0-9_\.]+$/.test(options.groupBy)) {
      groupClause = ` GROUP BY ${options.groupBy}`;
    }
  }
  
  // Add LIMIT and OFFSET if specified
  let limitOffsetClause = '';
  if (options.limit !== undefined) {
    limitOffsetClause = ` LIMIT ${options.limit}`;
    
    if (options.offset !== undefined) {
      limitOffsetClause += ` OFFSET ${options.offset}`;
    }
  }
  
  // Construct the final query
  const query = `${baseQuery}${whereClause}${groupClause}${orderClause}${limitOffsetClause}`;
  
  return { query, params };
}

/**
 * Perform database maintenance operations
 * Should be run periodically to optimize performance
 */
export async function performDatabaseMaintenance(): Promise<void> {
  console.log('[Database] Starting maintenance operations');
  const start = process.hrtime();
  
  try {
    // Get list of tables
    const tablesResult = await executeQuery<{ tablename: string }>(
      `SELECT tablename FROM pg_tables 
       WHERE schemaname = 'public' 
       ORDER BY tablename`,
      [],
      { label: 'maintenance-tables' }
    );
    
    // Skip if no tables found
    if (!tablesResult.rows || tablesResult.rows.length === 0) {
      console.log('[Database] No tables found for maintenance');
      return;
    }
    
    const tables = tablesResult.rows.map(row => row.tablename);
    const maintenanceTasks: Promise<void>[] = [];
    
    // Perform maintenance on each table
    for (const table of tables) {
      maintenanceTasks.push(
        (async () => {
          try {
            // VACUUM the table (reclaim storage)
            await executeQuery(
              `VACUUM ANALYZE ${table}`,
              [],
              { label: `vacuum-${table}`, timeout: 30000 }
            );
            console.log(`[Database] Vacuumed table: ${table}`);
            
            // Analyze the table (update statistics)
            await executeQuery(
              `ANALYZE ${table}`,
              [],
              { label: `analyze-${table}`, timeout: 15000 }
            );
            console.log(`[Database] Analyzed table: ${table}`);
          } catch (error) {
            console.error(`[Database] Maintenance error on table ${table}:`, error);
          }
        })()
      );
    }
    
    // Wait for all maintenance tasks to complete
    await Promise.all(maintenanceTasks);
    
    // Calculate time taken
    const diff = process.hrtime(start);
    const duration = diff[0] * 1000 + diff[1] / 1000000;
    
    console.log(`[Database] Maintenance completed in ${duration.toFixed(2)}ms`);
  } catch (error) {
    console.error('[Database] Maintenance error:', error);
    throw error;
  }
}

/**
 * Explain and analyze a query for performance tuning
 * 
 * @param query SQL query to analyze
 * @param params Query parameters
 * @returns Promise resolving to the query execution plan
 */
export async function explainQuery(
  query: string,
  params: any[] = []
): Promise<string> {
  try {
    const result = await executeQuery<{ "QUERY PLAN": string }>(
      `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT TEXT) ${query}`,
      params,
      { label: 'explain-analyze', timeout: 30000 }
    );
    
    // Format the execution plan
    return result.rows.map(row => row["QUERY PLAN"]).join('\n');
  } catch (error) {
    console.error('[Database] Error explaining query:', error);
    throw error;
  }
}