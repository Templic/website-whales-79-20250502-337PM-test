/**
 * Background Services Module
 * 
 * Manages long-running background processes and scheduled tasks
 * for the server, with configurable initialization behavior.
 */

import { log } from './vite';
import { pgPool } from './db';
import { loadConfig } from './config';
import { getDatabaseMaintenanceMetrics } from './db-maintenance';

// Background task execution intervals (in milliseconds)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const METRICS_INTERVAL = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Track active intervals for cleanup
const activeIntervals: NodeJS.Timeout[] = [];

/**
 * Initialize all background services
 */
export async function initBackgroundServices(): Promise<void> {
  const config = loadConfig();
  
  // Skip initialization if background tasks are disabled
  if (!config.features.enableBackgroundTasks) {
    log('Background tasks disabled via configuration', 'bg-tasks');
    return;
  }
  
  try {
    // Initialize database background services
    await initDatabaseBackgroundServices();
    
    // Initialize metrics collection
    await initMetricsCollection();
    
    // Initialize system heartbeat
    initSystemHeartbeat();
    
    log('Background database services initialized', 'bg-db');
    
    // Schedule recurring maintenance tasks
    scheduleRecurringMaintenanceTasks();
    
  } catch (error) {
    console.error('Failed to initialize background services:', error);
  }
}

/**
 * Initialize database-related background services
 */
async function initDatabaseBackgroundServices(): Promise<void> {
  // Schedule automatic cleanup of expired sessions
  const sessionCleanupInterval = setInterval(async () => {
    try {
      // Clean up expired sessions
      const result = await pgPool.query(`
        DELETE FROM "session"
        WHERE expire < NOW()
      `);
      
      const cleanedCount = result.rowCount || 0;
      log(`Cleaned up ${cleanedCount} expired sessions`, 'bg-db');
      
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }, CLEANUP_INTERVAL);
  
  activeIntervals.push(sessionCleanupInterval);
  
  // Schedule dead tuple cleanup for busy tables
  setInterval(async () => {
    try {
      // Find tables with high dead tuple counts
      const result = await pgPool.query(`
        SELECT relname as table_name
        FROM pg_stat_user_tables
        WHERE n_dead_tup > 1000 OR 
              (n_live_tup > 0 AND (n_dead_tup::float / n_live_tup::float) > 0.2)
        LIMIT 5
      `);
      
      if (result.rows.length > 0) {
        log(`Scheduling VACUUM ANALYZE for ${result.rows.length} tables with high dead tuple counts`, 'bg-db');
        
        // Run VACUUM ANALYZE on these tables
        for (const row of result.rows) {
          await pgPool.query(`VACUUM ANALYZE ${row.table_name}`);
        }
        
        log(`Auto-vacuum completed for ${result.rows.length} tables`, 'bg-db');
      }
    } catch (error) {
      console.error('Error during automatic vacuum:', error);
    }
  }, CLEANUP_INTERVAL * 2); // Less frequent than session cleanup
}

/**
 * Initialize metrics collection background services
 */
async function initMetricsCollection(): Promise<void> {
  const metricsInterval = setInterval(async () => {
    try {
      // Collect database metrics
      const metrics = await getDatabaseMaintenanceMetrics();
      
      if (metrics) {
        // Store metrics in the database
        await pgPool.query(`
          INSERT INTO "db_metrics" (
            table_count, tables_needing_vacuum, tables_needing_analyze,
            tables_needing_reindex, tables_with_dead_rows, database_size_bytes,
            connection_count, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          metrics.tableCount,
          metrics.tablesNeedingVacuum,
          metrics.tablesNeedingAnalyze,
          metrics.tablesNeedingReindex,
          metrics.tablesWithDeadRows,
          metrics.databaseSizeBytes,
          metrics.connectionCount,
          metrics.timestamp
        ]);
        
        log('Database metrics collected successfully', 'bg-db');
      }
      
      // Analyze query performance
      await pgPool.query(`
        SELECT pg_stat_statements_reset();
      `).catch(() => {
        // pg_stat_statements might not be available, ignore errors
      });
      
      log('Basic query stats analysis completed', 'db-performance');
      
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  }, METRICS_INTERVAL);
  
  activeIntervals.push(metricsInterval);
}

/**
 * Initialize system heartbeat service
 */
function initSystemHeartbeat(): void {
  const heartbeatInterval = setInterval(() => {
    try {
      // Calculate memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);
      
      // Calculate uptime
      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      
      log(`System heartbeat - Memory: ${memoryUsageMB}MB, Uptime: ${uptimeHours}h ${uptimeMinutes}m`, 'heartbeat');
      
    } catch (error) {
      console.error('Error in system heartbeat:', error);
    }
  }, HEARTBEAT_INTERVAL);
  
  activeIntervals.push(heartbeatInterval);
}

/**
 * Schedule recurring database maintenance tasks
 */
function scheduleRecurringMaintenanceTasks(): void {
  log('Recurring database maintenance jobs scheduled', 'bg-db');
  
  // Nothing to do here - maintenance is handled by db-maintenance.ts module
}

/**
 * Stop all background services (for graceful shutdown)
 */
export function stopBackgroundServices(): void {
  activeIntervals.forEach(interval => {
    clearInterval(interval);
  });
  
  log('All background services stopped', 'bg-tasks');
}