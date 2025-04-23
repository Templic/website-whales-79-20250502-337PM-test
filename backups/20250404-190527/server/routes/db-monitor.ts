import express from 'express';
import { pool } from '../db';
import { log } from '../vite';
import { triggerDatabaseMaintenance } from '../db-optimize';

const router = express.Router();

// Utility function to format bytes as human-readable
const formatSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// GET /api/admin/db-monitor/status - Get database status information
router.get('/status', async (req$2 res) => {
  try {
    // We'll rely on the middleware auth check in routes.ts instead of checking here
    // This endpoint should only be accessible to authenticated admin users

    const client = await pool.connect();
    try {
      // Get database size
      const sizeResult = await client.query("SELECT pg_database_size(current_database()) as size");
      const databaseSize = sizeResult.rows[0].size;

      // Get pool statistics using pg_stat_activity
      const activeConnectionsResult = await client.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active' AND pid <> pg_backend_pid()
      `);
      
      const idleConnectionsResult = await client.query(`
        SELECT count(*) as idle_connections 
        FROM pg_stat_activity 
        WHERE state = 'idle' AND pid <> pg_backend_pid()
      `);
      
      const totalConnectionsResult = await client.query(`
        SELECT count(*) as total_connections 
        FROM pg_stat_activity 
        WHERE pid <> pg_backend_pid()
      `);
      
      const poolStats = {
        total: parseInt(totalConnectionsResult.rows[0].total_connections),
        active: parseInt(activeConnectionsResult.rows[0].active_connections),
        idle: parseInt(idleConnectionsResult.rows[0].idle_connections),
        waiting: 0 // Not directly available from pg_stat_activity
      };

      // Get table statistics
      const tableStats = await client.query(`
        SELECT 
          relname as table_name,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(C.oid)) as total_size,
          pg_size_pretty(pg_table_size(C.oid)) as table_size,
          pg_size_pretty(pg_indexes_size(C.oid)) as index_size
        FROM pg_class C
        LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
        WHERE nspname NOT IN ('pg_catalog', 'information_schema')
        AND C.relkind = 'r'
        ORDER BY pg_total_relation_size(C.oid) DESC
      `);

      // Get index statistics
      const indexStats = await client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as scan_count,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `);

      // Using the module-level formatSize function
      
      res.json({
        status: 'connected',
        time: new Date().toISOString(),
        database_size: {
          size: formatSize(databaseSize),
          size_bytes: databaseSize
        },
        pool_stats: poolStats,
        table_stats: tableStats.rows,
        index_stats: indexStats.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database monitor status error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve database status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/db-monitor/maintenance/:task - Trigger maintenance task
router.post('/maintenance/:task', async (req$2 res) => {
  try {
    // Super admin check can happen here since this is more restrictive than the middleware check
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized. Super admin access required.' });
    }

    const { task } = req.params;

    if (!['vacuum', 'reindex', 'analyze'].includes(task)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid task. Must be one of: vacuum, reindex, analyze' 
      });
    }

    const jobId = await triggerDatabaseMaintenance(task as 'vacuum' | 'reindex' | 'analyze');

    log(`Database maintenance task '${task}' scheduled with job ID: ${jobId}`, 'db-monitor');

    res.json({
      status: 'scheduled',
      taskType: task,
      jobId: jobId
    });
  } catch (error) {
    console.error('Maintenance task error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to schedule maintenance task',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/db-monitor/query-stats - Get statistics on database queries
router.get('/query-stats', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Check if pg_stat_statements extension is available
      const extCheck = await client.query(`
        SELECT count(*) as count FROM pg_extension WHERE extname = 'pg_stat_statements'
      `);
      
      const extensionInstalled = parseInt(extCheck.rows[0].count) > 0;
      
      if (!extensionInstalled) {
        return res.json({
          status: 'extension_not_available',
          message: 'The pg_stat_statements extension is not installed on this database.',
          query_stats: []
        });
      }
      
      // Query the pg_stat_statements view for query statistics
      const statsResult = await client.query(`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          min_exec_time as min_time,
          max_exec_time as max_time,
          mean_exec_time as mean_time,
          stddev_exec_time as stddev_time,
          rows
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
        ORDER BY total_exec_time DESC
        LIMIT 100
      `);
      
      res.json({
        status: 'success',
        query_stats: statsResult.rows
      });
    } catch (error) {
      // Handle specific errors related to the extension not being available
      console.error('Query stats error:', error);
      
      if (error instanceof Error && error.message && error.message.includes('pg_stat_statements')) {
        res.json({
          status: 'extension_error',
          message: 'Error accessing pg_stat_statements. The extension may not be properly configured.',
          query_stats: []
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to retrieve query statistics',
          error: error instanceof Error ? error.message : 'Unknown error',
          query_stats: []
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'connection_error',
      message: 'Failed to connect to the database',
      error: error instanceof Error ? error.message : 'Unknown error',
      query_stats: []
    });
  }
});

export default router;