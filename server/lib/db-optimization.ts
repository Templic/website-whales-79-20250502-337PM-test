/**
 * Database Query Optimization Utilities
 * 
 * Provides utilities for optimizing database queries and monitoring performance.
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

// Interface for query timing metrics
interface QueryMetrics {
  query: string;
  params: any[];
  duration: number;
  timestamp: Date;
}

// Store recent slow queries for analysis
const recentSlowQueries: QueryMetrics[] = [];
const MAX_SLOW_QUERIES = 100;
const SLOW_QUERY_THRESHOLD = 500; // ms

/**
 * Execute a query with timing metrics
 * 
 * @param queryString SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function timedQuery<T>(queryString: string, params: any[] = []): Promise<T> {
  const start = performance.now();
  let result;
  
  try {
    result = await db.execute(sql.raw(queryString, params));
  } catch (error) {
    logger.error(`Query error: ${error.message}`, { query: queryString, params });
    throw error;
  } finally {
    const duration = performance.now() - start;
    
    // Track slow queries for optimization
    if (duration > SLOW_QUERY_THRESHOLD) {
      logSlowQuery(queryString, params, duration);
    }
  }
  
  return result as T;
}

/**
 * Log a slow query for later analysis
 */
function logSlowQuery(query: string, params: any[], duration: number) {
  const metrics: QueryMetrics = {
    query,
    params,
    duration,
    timestamp: new Date(),
  };
  
  // Add to recent slow queries list, maintaining max size
  recentSlowQueries.push(metrics);
  if (recentSlowQueries.length > MAX_SLOW_QUERIES) {
    recentSlowQueries.shift();
  }
  
  // Log the slow query
  logger.warn(`Slow query detected (${duration.toFixed(2)}ms): ${query}`, {
    duration,
    params,
  });
}

/**
 * Get recent slow queries for analysis
 */
export function getSlowQueries(): QueryMetrics[] {
  return [...recentSlowQueries];
}

/**
 * Clear the slow query log
 */
export function clearSlowQueries(): void {
  recentSlowQueries.length = 0;
}

/**
 * Analyze query performance and suggest improvements
 * 
 * @param queryId Identifier for the query
 * @param query SQL query to analyze
 */
export async function analyzeQueryPerformance(queryId: string, query: string): Promise<{
  analysis: string;
  suggestedIndexes: string[];
}> {
  // Fetch query plan
  const explainQuery = `EXPLAIN ANALYZE ${query}`;
  
  try {
    const result = await db.execute(sql.raw(explainQuery));
    
    // Analyze execution plan
    const planLines = result.map((row: any) => row.QUERY_PLAN || row.query_plan || '');
    const planText = planLines.join('\n');
    
    // Check for common performance issues
    const analysis = analyzeQueryPlan(planText);
    
    // Suggest indexes
    const suggestedIndexes = suggestIndexes(planText, query);
    
    return {
      analysis,
      suggestedIndexes,
    };
  } catch (error) {
    logger.error(`Query analysis error: ${error.message}`, { queryId, query });
    return {
      analysis: `Error analyzing query: ${error.message}`,
      suggestedIndexes: [],
    };
  }
}

/**
 * Analyze a query plan for performance issues
 */
function analyzeQueryPlan(planText: string): string {
  const issues: string[] = [];
  
  // Look for common performance issues in the query plan
  if (planText.includes('Seq Scan') && !planText.includes('small table')) {
    issues.push('Sequential scan detected on a potentially large table. Consider adding an index.');
  }
  
  if (planText.includes('Nested Loop')) {
    issues.push('Nested loop join detected. Consider optimizing join conditions or adding indexes.');
  }
  
  if (planText.includes('Hash Join') && planText.includes('large table')) {
    issues.push('Hash join on large tables detected. Verify join conditions are optimized.');
  }
  
  if (planText.includes('Sort')) {
    issues.push('Sorting operation detected. Consider adding an index to avoid sorting.');
  }
  
  if (planText.includes('Bitmap Heap Scan')) {
    issues.push('Bitmap heap scan detected. This can be slow for large result sets.');
  }
  
  // Check execution time
  const timeMatch = planText.match(/Execution Time: (\d+\.\d+) ms/);
  if (timeMatch) {
    const executionTime = parseFloat(timeMatch[1]);
    if (executionTime > 100) {
      issues.push(`High execution time (${executionTime.toFixed(2)}ms). Query optimization recommended.`);
    }
  }
  
  return issues.length > 0 
    ? `Performance issues detected:\n- ${issues.join('\n- ')}` 
    : 'No significant performance issues detected.';
}

/**
 * Suggest indexes based on query plan and query text
 */
function suggestIndexes(planText: string, query: string): string[] {
  const suggestedIndexes: string[] = [];
  
  // Extract table and column names from the query
  const tableMatch = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
  if (!tableMatch) return suggestedIndexes;
  
  const tableName = tableMatch[1];
  
  // Check WHERE clauses
  const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|$)/is);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    const columnMatches = whereClause.match(/([a-zA-Z0-9_]+)\s*(?:=|>|<|>=|<=|LIKE|IN)/g);
    
    if (columnMatches) {
      columnMatches.forEach(match => {
        const column = match.trim().split(/\s+/)[0];
        if (planText.includes('Seq Scan') && planText.includes(column)) {
          suggestedIndexes.push(`CREATE INDEX idx_${tableName}_${column} ON ${tableName} (${column});`);
        }
      });
    }
  }
  
  // Check ORDER BY clauses
  const orderMatch = query.match(/ORDER BY\s+(.+?)(?:LIMIT|$)/is);
  if (orderMatch) {
    const orderClause = orderMatch[1];
    const orderColumns = orderClause.split(',').map(col => col.trim().split(/\s+/)[0]);
    
    if (orderColumns.length > 0 && planText.includes('Sort')) {
      suggestedIndexes.push(
        `CREATE INDEX idx_${tableName}_${orderColumns.join('_')} ON ${tableName} (${orderColumns.join(', ')});`
      );
    }
  }
  
  // Check GROUP BY clauses
  const groupMatch = query.match(/GROUP BY\s+(.+?)(?:HAVING|ORDER BY|LIMIT|$)/is);
  if (groupMatch) {
    const groupClause = groupMatch[1];
    const groupColumns = groupClause.split(',').map(col => col.trim().split(/\s+/)[0]);
    
    if (groupColumns.length > 0 && planText.includes('HashAggregate')) {
      suggestedIndexes.push(
        `CREATE INDEX idx_${tableName}_${groupColumns.join('_')} ON ${tableName} (${groupColumns.join(', ')});`
      );
    }
  }
  
  return [...new Set(suggestedIndexes)]; // Remove duplicates
}

/**
 * Get database performance metrics
 */
export async function getDatabaseMetrics() {
  try {
    // Get table statistics
    const tableStats = await db.execute(sql.raw(`
      SELECT
        schemaname,
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_analyze
      FROM
        pg_stat_user_tables
      ORDER BY
        n_live_tup DESC
    `));
    
    // Get index statistics
    const indexStats = await db.execute(sql.raw(`
      SELECT
        indexrelname as index_name,
        relname as table_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM
        pg_stat_user_indexes
      ORDER BY
        idx_scan DESC
    `));
    
    // Get active connections
    const connections = await db.execute(sql.raw(`
      SELECT 
        count(*) as connection_count
      FROM 
        pg_stat_activity
      WHERE 
        state = 'active'
    `));
    
    return {
      tableStats,
      indexStats,
      connectionCount: connections[0]?.connection_count || 0,
      slowQueries: getSlowQueries().slice(0, 10), // Only return the 10 most recent slow queries
    };
  } catch (error) {
    logger.error(`Error fetching database metrics: ${error.message}`);
    throw error;
  }
}