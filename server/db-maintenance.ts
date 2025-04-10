/**
 * Database Maintenance Module
 * 
 * Provides intelligent database maintenance operations
 * that only target tables that need maintenance.
 */

import { pgPool } from './db';
import { log } from './vite';
import { loadConfig } from './config';

interface TableStatus {
  tableName: string;
  liveRows: number;
  deadRows: number;
  deadRowsPercent: number;
  lastAutoVacuum: Date | null;
  lastAnalyzed: Date | null;
  estimatedRowCount: number;
  needsVacuum: boolean;
  needsAnalyze: boolean;
  needsReindex: boolean;
  fragmentation: number | null;
}

interface MaintenanceStats {
  tablesAnalyzed: number;
  tablesVacuumed: number;
  tablesReindexed: number;
  tablesSkipped: number;
  totalTables: number;
  startTime: Date;
  endTime: Date | null;
  elapsedMs: number | null;
  maintenanceMode: 'intelligent' | 'full' | 'minimal';
}

/**
 * Get detailed status of all tables in the database
 */
export async function getTableStatus(): Promise<TableStatus[]> {
  try {
    const result = await pgPool.query(`
      SELECT
        t.relname as table_name,
        s.n_live_tup as live_rows,
        s.n_dead_tup as dead_rows,
        CASE WHEN s.n_live_tup > 0 
          THEN ROUND((s.n_dead_tup::float / s.n_live_tup::float) * 100, 2)
          ELSE 0
        END as dead_rows_percent,
        s.last_autovacuum,
        s.last_analyze,
        s.n_tup_ins + s.n_tup_upd + s.n_tup_del as write_activity,
        pg_stat_get_live_tuples(t.oid) as estimated_row_count,
        CASE 
          WHEN s.n_dead_tup > 1000 OR (s.n_live_tup > 0 AND (s.n_dead_tup::float / s.n_live_tup::float) > 0.1)
          THEN true
          ELSE false
        END as needs_vacuum,
        CASE 
          WHEN s.last_analyze IS NULL OR 
              (s.last_analyze < NOW() - INTERVAL '3 days' AND s.n_tup_ins + s.n_tup_upd + s.n_tup_del > 1000)
          THEN true
          ELSE false
        END as needs_analyze,
        -- Detect index bloat/fragmentation (simplified heuristic)
        CASE
          WHEN i.fragmentation > 30 THEN true
          ELSE false
        END as needs_reindex,
        i.fragmentation
      FROM pg_class t
      JOIN pg_stat_user_tables s ON t.relname = s.relname
      LEFT JOIN (
        -- Subquery to estimate index fragmentation
        SELECT
          relname,
          CASE 
            WHEN (pg_stat_get_numscans(indexrelid) > 0 AND pg_relation_size(indexrelid) > 8192*100)
            THEN 
              ROUND(((pg_relation_size(indexrelid) - (pg_stat_get_live_tuples(indrelid) * 8))::float / 
                GREATEST(pg_relation_size(indexrelid), 1)::float) * 100)
            ELSE NULL
          END as fragmentation
        FROM pg_index i
        JOIN pg_class c ON i.indexrelid = c.oid
        WHERE i.indisprimary
      ) i ON t.relname = i.relname
      WHERE t.relkind = 'r' AND t.relname NOT LIKE 'pg_%' AND t.relname NOT LIKE 'sql_%'
      ORDER BY dead_rows_percent DESC, table_name ASC
    `);
    
    return result.rows.map(row => ({
      tableName: row.table_name,
      liveRows: parseInt(row.live_rows),
      deadRows: parseInt(row.dead_rows),
      deadRowsPercent: parseFloat(row.dead_rows_percent),
      lastAutoVacuum: row.last_autovacuum,
      lastAnalyzed: row.last_analyze,
      estimatedRowCount: parseInt(row.estimated_row_count),
      needsVacuum: row.needs_vacuum,
      needsAnalyze: row.needs_analyze,
      needsReindex: row.needs_reindex,
      fragmentation: row.fragmentation === null ? null : parseFloat(row.fragmentation)
    }));
  } catch (error) {
    console.error('Error getting table status:', error);
    return [];
  }
}

/**
 * Perform intelligent database maintenance
 * Only targets tables that need it based on their status
 */
export async function performIntelligentMaintenance(mode: 'intelligent' | 'full' | 'minimal' = 'intelligent'): Promise<MaintenanceStats> {
  const stats: MaintenanceStats = {
    tablesAnalyzed: 0,
    tablesVacuumed: 0,
    tablesReindexed: 0,
    tablesSkipped: 0,
    totalTables: 0,
    startTime: new Date(),
    endTime: null,
    elapsedMs: null,
    maintenanceMode: mode
  };
  
  try {
    // Get table status
    const tableStatus = await getTableStatus();
    stats.totalTables = tableStatus.length;
    
    // Determine which tables need maintenance based on mode
    for (const table of tableStatus) {
      const shouldVacuum = mode === 'full' || 
                          (mode === 'intelligent' && table.needsVacuum) ||
                          (mode === 'minimal' && table.deadRowsPercent > 30);
                          
      const shouldAnalyze = mode === 'full' || 
                           (mode === 'intelligent' && table.needsAnalyze) ||
                           (mode === 'minimal' && table.deadRowsPercent > 30);
                           
      const shouldReindex = mode === 'full' || 
                          (mode === 'intelligent' && table.needsReindex) ||
                          (mode === 'minimal' && table.fragmentation !== null && table.fragmentation > 50);
      
      // Skip if no maintenance needed
      if (!shouldVacuum && !shouldAnalyze && !shouldReindex) {
        stats.tablesSkipped++;
        continue;
      }
      
      // Perform vacuum if needed
      if (shouldVacuum) {
        try {
          log(`Vacuuming table ${table.tableName}`, 'db-maintenance');
          await pgPool.query(`VACUUM ${table.tableName}`);
          stats.tablesVacuumed++;
        } catch (err) {
          console.error(`Error vacuuming table ${table.tableName}:`, err);
        }
      }
      
      // Perform analyze if needed
      if (shouldAnalyze) {
        try {
          log(`Analyzing table ${table.tableName}`, 'db-maintenance');
          await pgPool.query(`ANALYZE ${table.tableName}`);
          stats.tablesAnalyzed++;
        } catch (err) {
          console.error(`Error analyzing table ${table.tableName}:`, err);
        }
      }
      
      // Perform reindex if needed
      if (shouldReindex) {
        try {
          log(`Reindexing table ${table.tableName}`, 'db-maintenance');
          await pgPool.query(`REINDEX TABLE ${table.tableName}`);
          stats.tablesReindexed++;
        } catch (err) {
          console.error(`Error reindexing table ${table.tableName}:`, err);
        }
      }
    }
    
    // Update stats
    stats.endTime = new Date();
    stats.elapsedMs = stats.endTime.getTime() - stats.startTime.getTime();
    
    // Log summary
    log(`Maintenance summary: ${stats.tablesVacuumed} vacuumed, ${stats.tablesAnalyzed} analyzed, ${stats.tablesReindexed} reindexed, ${stats.tablesSkipped} skipped out of ${stats.totalTables} total`, 'db-maintenance');
    
    return stats;
  } catch (error) {
    console.error('Error during intelligent maintenance:', error);
    
    // Update stats even on error
    stats.endTime = new Date();
    stats.elapsedMs = stats.endTime.getTime() - stats.startTime.getTime();
    
    return stats;
  }
}

/**
 * Schedule intelligent maintenance based on configuration
 */
export async function scheduleIntelligentMaintenance() {
  const config = loadConfig();
  
  // Skip scheduling if database optimization is disabled
  if (!config.features.enableDatabaseOptimization) {
    return;
  }
  
  // Determine maintenance mode from config
  let maintenanceMode: 'intelligent' | 'full' | 'minimal' = 'intelligent';
  
  if (config.startupPriority === 'maintenance') {
    maintenanceMode = 'full';
  } else if (config.startupPriority === 'speed') {
    maintenanceMode = 'minimal';
  }
  
  // Schedule initial maintenance with delay
  setTimeout(async () => {
    try {
      log(`Starting ${maintenanceMode} database maintenance`, 'db-maintenance');
      const stats = await performIntelligentMaintenance(maintenanceMode);
      log(`Database maintenance completed in ${stats.elapsedMs}ms`, 'db-maintenance');
    } catch (err) {
      console.error('Error running scheduled maintenance:', err);
    }
  }, config.deferDatabaseMaintenance ? config.maintenanceDelay : 1000);
  
  // Schedule recurring maintenance (once a day at 3 AM)
  const millisecondsUntil3AM = getMillisecondsUntil3AM();
  setTimeout(() => {
    setInterval(async () => {
      try {
        log('Running daily maintenance', 'db-maintenance');
        await performIntelligentMaintenance('intelligent');
      } catch (err) {
        console.error('Error running daily maintenance:', err);
      }
    }, 24 * 60 * 60 * 1000); // Once per day
  }, millisecondsUntil3AM);
}

/**
 * Calculate milliseconds until 3 AM for scheduling
 */
function getMillisecondsUntil3AM(): number {
  const now = new Date();
  const target = new Date();
  
  // Set target time to 3 AM
  target.setHours(3, 0, 0, 0);
  
  // If it's already past 3 AM, set target to 3 AM tomorrow
  if (now.getTime() > target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

/**
 * Get database maintenance metrics for monitoring
 */
export async function getDatabaseMaintenanceMetrics() {
  try {
    const tableStatus = await getTableStatus();
    
    const needsVacuum = tableStatus.filter(t => t.needsVacuum).length;
    const needsAnalyze = tableStatus.filter(t => t.needsAnalyze).length;
    const needsReindex = tableStatus.filter(t => t.needsReindex).length;
    
    const totalTables = tableStatus.length;
    const tablesWithDeadRows = tableStatus.filter(t => t.deadRows > 0).length;
    
    // Get additional database statistics
    const dbSizeResult = await pgPool.query(`
      SELECT pg_database_size(current_database()) as size_bytes
    `);
    
    const connectionResult = await pgPool.query(`
      SELECT count(*) as connection_count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    
    return {
      tableCount: totalTables,
      tablesNeedingVacuum: needsVacuum,
      tablesNeedingAnalyze: needsAnalyze, 
      tablesNeedingReindex: needsReindex,
      tablesWithDeadRows,
      databaseSizeBytes: parseInt(dbSizeResult.rows[0].size_bytes),
      connectionCount: parseInt(connectionResult.rows[0].connection_count),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting database metrics:', error);
    return null;
  }
}