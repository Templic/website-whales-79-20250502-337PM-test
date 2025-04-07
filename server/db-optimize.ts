/**
 * Database optimization utilities
 */

import { pgPool } from './db';

/**
 * Initialize database optimization system
 */
export async function initDatabaseOptimization(): Promise<boolean> {
  console.log('Initializing database optimization...');
  
  // Run initial vacuum analyze to ensure good performance
  try {
    const client = await pgPool.connect();
    try {
      console.log('Running initial VACUUM ANALYZE...');
      await client.query('VACUUM ANALYZE');
      console.log('Initial VACUUM ANALYZE completed successfully');
    } finally {
      client.release();
    }
    
    console.log('Database optimization initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database optimization:', error);
    throw error;
  }
}

/**
 * Optimize a specific database table
 */
export async function optimizeTable(tableName: string): Promise<void> {
  console.log(`Optimizing table: ${tableName}...`);
  
  try {
    const client = await pgPool.connect();
    try {
      // Run VACUUM ANALYZE on the specified table
      await client.query(`VACUUM ANALYZE ${tableName}`);
      console.log(`Optimization of table ${tableName} completed`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Failed to optimize table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Analyze database for optimization opportunities
 */
export async function analyzeDatabase(): Promise<any> {
  console.log('Analyzing database for optimization opportunities...');
  
  try {
    const client = await pgPool.connect();
    try {
      // Find unused indexes
      const unusedIndexesQuery = `
        SELECT
          schemaname || '.' || relname as table_name,
          indexrelname as index_name,
          idx_scan as index_scans,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          pg_relation_size(indexrelid) as index_size_bytes
        FROM
          pg_stat_user_indexes
        JOIN
          pg_index USING (indexrelid)
        WHERE
          idx_scan = 0
          AND indisunique IS FALSE
        ORDER BY
          pg_relation_size(indexrelid) DESC
      `;
      
      const unusedIndexesResult = await client.query(unusedIndexesQuery);
      
      // Find missing indexes (tables with high seq scans)
      const missingIndexesQuery = `
        SELECT
          schemaname || '.' || relname as table_name,
          seq_scan as sequential_scans,
          seq_tup_read as sequential_tuples_read,
          idx_scan as index_scans,
          n_live_tup as estimated_tuples,
          pg_size_pretty(pg_relation_size(relid)) as table_size
        FROM
          pg_stat_user_tables
        WHERE
          seq_scan > 0
        ORDER BY
          seq_tup_read DESC
        LIMIT 10
      `;
      
      const missingIndexesResult = await client.query(missingIndexesQuery);
      
      // Find tables that need vacuuming
      const needsVacuumQuery = `
        SELECT
          schemaname || '.' || relname as table_name,
          n_dead_tup as dead_tuples,
          n_live_tup as live_tuples,
          n_dead_tup::float / GREATEST(n_live_tup, 1) * 100 as dead_ratio,
          last_vacuum,
          last_autovacuum
        FROM
          pg_stat_user_tables
        WHERE
          n_dead_tup > 0
        ORDER BY
          n_dead_tup::float / GREATEST(n_live_tup, 1) DESC
        LIMIT 10
      `;
      
      const needsVacuumResult = await client.query(needsVacuumQuery);
      
      // Return the analysis results
      return {
        timestamp: new Date().toISOString(),
        analysis: {
          unusedIndexes: unusedIndexesResult.rows,
          potentialMissingIndexes: missingIndexesResult.rows,
          tablesNeedingVacuum: needsVacuumResult.rows
        }
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to analyze database:', error);
    throw error;
  }
}

/**
 * Get table statistics
 */
export async function getTableStats(tableName?: string): Promise<any> {
  console.log('Getting table statistics...');
  
  try {
    const client = await pgPool.connect();
    try {
      let query = `
        SELECT
          schemaname || '.' || relname as table_name,
          pg_size_pretty(pg_relation_size(relid)) as table_size,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          seq_scan as sequential_scans,
          idx_scan as index_scans,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM
          pg_stat_user_tables
      `;
      
      // If a specific table is requested, filter for it
      if (tableName) {
        query += ` WHERE relname = $1`;
        
        const result = await client.query(query, [tableName]);
        return result.rows;
      } else {
        // Order by size for all tables
        query += ` ORDER BY pg_relation_size(relid) DESC`;
        
        const result = await client.query(query);
        return result.rows;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to get table statistics:', error);
    throw error;
  }
}

export default {
  initDatabaseOptimization,
  optimizeTable,
  analyzeDatabase,
  getTableStats
};