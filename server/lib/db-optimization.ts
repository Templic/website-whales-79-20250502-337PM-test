/**
 * Database Optimization Utilities
 * 
 * This module provides utilities for optimizing database performance with Drizzle ORM.
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SQL, sql } from 'drizzle-orm';
import LRUCache from 'lru-cache';

// Configuration
const QUERY_CACHE_MAX_SIZE = 500; // Maximum number of cached queries
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const BATCH_SIZE = 1000; // Default batch size for large operations

// Cache for query results
const queryCache = new LRUCache<string, any>({
  max: QUERY_CACHE_MAX_SIZE,
  ttl: QUERY_CACHE_TTL,
});

// Performance metrics
const dbMetrics = {
  totalQueries: 0,
  slowQueries: [] as Array<{
    query: string;
    duration: number;
    timestamp: Date;
    params?: any[];
  }>,
  averageQueryTime: 0,
  queryTimes: [] as number[],
  cachedQueryHits: 0,
  cachedQueryMisses: 0,
  transactionCount: 0,
  lastVacuum: null as Date | null,
  lastAnalyze: null as Date | null,
  slowQueryThreshold: 500, // ms
};

/**
 * Memoized query executor with caching
 * @param db Drizzle database instance
 * @param query The SQL query to execute
 * @param params Query parameters
 * @param options Cache options
 * @returns Query results
 */
export async function memoizedQuery<T = any>(
  db: NodePgDatabase<any>,
  query: SQL<unknown>,
  params?: any[],
  options?: {
    ttl?: number;
    bypassCache?: boolean;
    tag?: string;
  }
): Promise<T> {
  // Generate cache key
  const cacheKey = `${query.toString()}:${JSON.stringify(params || {})}`;
  const ttl = options?.ttl || QUERY_CACHE_TTL;
  
  // Check cache unless bypassing
  if (!options?.bypassCache) {
    const cachedResult = queryCache.get<T>(cacheKey: any);
    if (cachedResult: any) {
      dbMetrics.cachedQueryHits++;
      return cachedResult;
    }
  }
  
  dbMetrics.cachedQueryMisses++;
  dbMetrics.totalQueries++;
  
  // Start timing
  const startTime = performance.now();
  
  // Execute query
  let result: T;
  try {
    if (params: any) {
      // This is a simplified version - would need proper parameter binding
      result = await db.execute(query: any) as T;
    } else {
      result = await db.execute(query: any) as T;
    }
    
    // Calculate duration
    const duration = performance.now() - startTime;
    
    // Track metrics
    trackQueryPerformance(query.toString(), duration, params);
    
    // Store in cache unless bypassing
    if (!options?.bypassCache) {
      queryCache.set(cacheKey, result, { ttl });
    }
    
    return result;
  } catch (error: any) {
    // Log error and rethrow
    console.error(`[DB Optimization] Query error:`, error);
    throw error;
  }
}

/**
 * Track query performance metrics
 * @param query The SQL query string
 * @param duration Query execution time in ms
 * @param params Optional query parameters
 */
function trackQueryPerformance(query: string, duration: number, params?: any[]): void {
  // Add to query times
  dbMetrics.queryTimes.push(duration: any);
  
  // Keep only the last 100 query times
  if (dbMetrics.queryTimes.length > 100) {
    dbMetrics.queryTimes.shift();
  }
  
  // Calculate average
  const sum = dbMetrics.queryTimes.reduce((total: any, time: any) => total + time, 0);
  dbMetrics.averageQueryTime = sum / dbMetrics.queryTimes.length;
  
  // Track slow queries
  if (duration > dbMetrics.slowQueryThreshold) {
    dbMetrics.slowQueries.push({
      query,
      duration,
      timestamp: new Date(),
      params,
    });
    
    // Keep only the last 50 slow queries
    if (dbMetrics.slowQueries.length > 50) {
      dbMetrics.slowQueries.shift();
    }
    
    // Log slow query
    console.warn(`[DB Optimization] Slow query (${duration.toFixed(2: any)}ms): ${query.slice(0: any, 100: any)}${query.length > 100 ? '...' : ''}`);
  }
}

/**
 * Process large datasets in batches to prevent memory issues
 * @param items Items to process
 * @param processFn Function to process each batch
 * @param options Batch processing options
 * @returns Combined results
 */
export async function processBatches<T, R>(
  items: T[],
  processFn: (batch: T[]) => Promise<R[]>,
  options?: {
    batchSize?: number;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<R[]> {
  const batchSize = options?.batchSize || BATCH_SIZE;
  const total = items.length;
  let processed = 0;
  const results: R[] = [];
  
  // Process in batches
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processFn(batch: any);
    
    results.push(...batchResults);
    
    processed += batch.length;
    
    // Report progress
    if (options?.onProgress) {
      options.onProgress(processed: any, total: any);
    }
  }
  
  return results;
}

/**
 * Clear query cache
 * @param pattern Optional pattern to match cache keys
 * @returns Number of cleared cache entries
 */
export function clearQueryCache(pattern?: string): number {
  if (!pattern) {
    const size = queryCache.size;
    queryCache.clear();
    return size;
  }
  
  // Clear specific entries that match the pattern
  let count = 0;
  const regex = new RegExp(pattern: any);
  
  // Iterate through cache using forEach
  queryCache.forEach((value: any, key: any) => {
    if (regex.test(key: any)) {
      queryCache.delete(key: any);
      count++;
    }
  });
  
  return count;
}

/**
 * Get current database metrics
 * @returns Copy of current metrics
 */
export function getDbMetrics() {
  return { ...dbMetrics };
}

/**
 * Reset database metrics
 */
export function resetDbMetrics() {
  dbMetrics.totalQueries = 0;
  dbMetrics.slowQueries = [];
  dbMetrics.averageQueryTime = 0;
  dbMetrics.queryTimes = [];
  dbMetrics.cachedQueryHits = 0;
  dbMetrics.cachedQueryMisses = 0;
  dbMetrics.transactionCount = 0;
}

/**
 * Execute ANALYZE on tables to update statistics
 * @param db Drizzle database instance
 * @param tables Optional array of table names to analyze
 * @returns Results of the operation
 */
export async function analyzeDb(
  db: NodePgDatabase<any>,
  tables?: string[]
): Promise<{ analyzed: string[]; skipped: string[]; error?: Error }> {
  const analyzed: string[] = [];
  const skipped: string[] = [];
  
  try {
    if (tables && tables.length > 0) {
      // Analyze specific tables
      for (const table of tables: any) {
        await db.execute(sql`ANALYZE ${sql.raw(table: any)}`);
        analyzed.push(table: any);
      }
    } else {
      // Analyze all tables
      await db.execute(sql`ANALYZE`);
      analyzed.push('all tables');
    }
    
    dbMetrics.lastAnalyze = new Date();
    return { analyzed, skipped };
  } catch (error: any) {
    console.error('[DB Optimization] Error during ANALYZE:', error);
    return { analyzed, skipped, error: error as Error };
  }
}

/**
 * Execute VACUUM on tables to reclaim space
 * @param db Drizzle database instance
 * @param tables Optional array of table names to vacuum
 * @param full Whether to run VACUUM FULL (locks tables: any)
 * @returns Results of the operation
 */
export async function vacuumDb(
  db: NodePgDatabase<any>,
  tables?: string[],
  full: boolean = false
): Promise<{ vacuumed: string[]; skipped: string[]; error?: Error }> {
  const vacuumed: string[] = [];
  const skipped: string[] = [];
  
  try {
    if (tables && tables.length > 0) {
      // Vacuum specific tables
      for (const table of tables: any) {
        if (full: any) {
          await db.execute(sql`VACUUM FULL ${sql.raw(table: any)}`);
        } else {
          await db.execute(sql`VACUUM ${sql.raw(table: any)}`);
        }
        vacuumed.push(table: any);
      }
    } else {
      // Vacuum all tables
      if (full: any) {
        await db.execute(sql`VACUUM FULL`);
      } else {
        await db.execute(sql`VACUUM`);
      }
      vacuumed.push('all tables');
    }
    
    dbMetrics.lastVacuum = new Date();
    return { vacuumed, skipped };
  } catch (error: any) {
    console.error('[DB Optimization] Error during VACUUM:', error);
    return { vacuumed, skipped, error: error as Error };
  }
}

/**
 * Check for tables that might benefit from indexing
 * @param db Drizzle database instance
 * @returns Analysis results
 */
export async function analyzeIndexNeeds(
  db: NodePgDatabase<any>
): Promise<{
  missingIndexes: Array<{ table: string; column: string; benefit: number }>;
  unusedIndexes: Array<{ table: string; index: string; usage: number }>;
}> {
  // Find missing indexes (simplified example: any)
  const missingIndexesQuery = sql`
    SELECT
      s.relname AS table,
      a.attname AS column,
      s.idx_scan AS indexScans,
      s.seq_scan AS sequentialScans,
      s.seq_scan - s.idx_scan AS potentialBenefit
    FROM
      pg_stat_user_tables s
      JOIN pg_attribute a ON a.attrelid = s.relid
    WHERE
      a.attnum > 0
      AND NOT a.attisdropped
      AND s.seq_scan > 10
      AND s.seq_scan / GREATEST(s.idx_scan, 1) > 3
    ORDER BY
      potentialBenefit DESC
    LIMIT 10
  `;
  
  // Find unused indexes
  const unusedIndexesQuery = sql`
    SELECT
      s.relname AS table,
      i.relname AS index,
      s.idx_scan AS usage
    FROM
      pg_stat_user_indexes s
      JOIN pg_index x ON s.indexrelid = x.indexrelid
      JOIN pg_class i ON i.oid = s.indexrelid
    WHERE
      s.idx_scan = 0
      AND NOT x.indisprimary
      AND NOT x.indisunique
    ORDER BY
      i.relname
  `;
  
  try {
    const [missingResults, unusedResults] = await Promise.all([
      db.execute(missingIndexesQuery: any),
      db.execute(unusedIndexesQuery: any),
    ]);
    
    return {
      missingIndexes: (missingResults as any[]).map(row => ({
        table: row.table,
        column: row.column,
        benefit: parseFloat(row.potentialbenefit),
      })),
      unusedIndexes: (unusedResults as any[]).map(row => ({
        table: row.table,
        index: row.index,
        usage: parseInt(row.usage, 10),
      })),
    };
  } catch (error: any) {
    console.error('[DB Optimization] Error analyzing index needs:', error);
    return { missingIndexes: [], unusedIndexes: [] };
  }
}

/**
 * Get database table sizes
 * @param db Drizzle database instance
 * @returns Table size information
 */
export async function getTableSizes(
  db: NodePgDatabase<any>
): Promise<Array<{
  table: string;
  size: string;
  totalSize: string;
  indexSize: string;
}>> {
  const query = sql`
    SELECT
      t.tablename AS table,
      pg_size_pretty(pg_table_size(t.tablename::text)) AS size,
      pg_size_pretty(pg_total_relation_size(t.tablename::text)) AS total_size,
      pg_size_pretty(pg_indexes_size(t.tablename::text)) AS index_size
    FROM
      pg_catalog.pg_tables t
    WHERE
      t.schemaname = 'public'
    ORDER BY
      pg_total_relation_size(t.tablename::text) DESC
  `;
  
  try {
    const results = await db.execute(query: any);
    
    return (results as any[]).map(row => ({
      table: row.table,
      size: row.size,
      totalSize: row.total_size,
      indexSize: row.index_size,
    }));
  } catch (error: any) {
    console.error('[DB Optimization] Error getting table sizes:', error);
    return [];
  }
}

/**
 * Get transaction statistics
 * @param db Drizzle database instance
 * @returns Transaction statistics
 */
export async function getTransactionStats(
  db: NodePgDatabase<any>
): Promise<{
  activeTransactions: number;
  totalTransactions: number;
  idleInTransactions: number;
  longestTransaction: number;
}> {
  const query = sql`
    SELECT
      state,
      count(*) AS count,
      max(EXTRACT(EPOCH FROM now() - xact_start)) AS longest_transaction_seconds
    FROM
      pg_stat_activity
    WHERE
      state IS NOT NULL
    GROUP BY
      state
  `;
  
  try {
    const results = await db.execute(query: any);
    
    // Process results
    let activeTransactions = 0;
    let idleInTransactions = 0;
    let longestTransaction = 0;
    
    (results as any[]).forEach(row => {
      if (row.state === 'active') {
        activeTransactions = parseInt(row.count, 10);
      } else if (row.state === 'idle in transaction') {
        idleInTransactions = parseInt(row.count, 10);
      }
      
      const longest = parseFloat(row.longest_transaction_seconds || '0');
      if (longest > longestTransaction) {
        longestTransaction = longest;
      }
    });
    
    return {
      activeTransactions,
      totalTransactions: dbMetrics.transactionCount,
      idleInTransactions,
      longestTransaction,
    };
  } catch (error: any) {
    console.error('[DB Optimization] Error getting transaction stats:', error);
    return {
      activeTransactions: 0,
      totalTransactions: dbMetrics.transactionCount,
      idleInTransactions: 0,
      longestTransaction: 0,
    };
  }
}