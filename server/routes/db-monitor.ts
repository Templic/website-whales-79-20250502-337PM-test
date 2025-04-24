import express from 'express';
import { pool } from '../db';
import { log } from '../vite';
import { triggerDatabaseMaintenance } from '../db-optimize';

class MonitoringError extends Error {
    constructor(message: string, options?: { cause?: any }) {
        super(message);
        this.name = 'MonitoringError';
        if (options && options.cause) {
            this.cause = options.cause;
        }
    }
}

const router = express.Router();

// Utility function to format bytes as human-readable
const formatSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// GET /api/admin/db-monitor/status - Get database status information
router.get('/status', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Use parameterized queries with sql template literals
      // Using parameterized query with SQL template literal for consistency and security
      // This is a system function call with no user input, but using parameterized query format for consistency
      const sizeResult = await client.query('SELECT pg_database_size($1) as size', ['current_database()']);
      const databaseSize = sizeResult.rows[0]?.size || 0;

      const activeConnectionsResult = await client.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = $1 AND pid <> pg_backend_pid()
      `, ['active']);

      const idleConnectionsResult = await client.query(`
        SELECT count(*) as idle_connections 
        FROM pg_stat_activity 
        WHERE state = $1 AND pid <> pg_backend_pid()
      `, ['idle']);

      // Use parameterized query for consistency and security
      const totalConnectionsResult = await client.query(`
        SELECT count(*) as total_connections 
        FROM pg_stat_activity 
        WHERE pid <> $1
      `, [client.processID]);

      const poolStats = {
        total: parseInt(totalConnectionsResult.rows[0].total_connections),
        active: parseInt(activeConnectionsResult.rows[0].active_connections),
        idle: parseInt(idleConnectionsResult.rows[0].idle_connections),
        waiting: 0 
      };

      // These queries access system catalog tables which only accept specific parameters
      // We're using parameterized queries where applicable and static queries for system catalog access
      const tableStats = await client.query(`
        SELECT 
          relname as table_name,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(C.oid)) as total_size,
          pg_size_pretty(pg_table_size(C.oid)) as table_size,
          pg_size_pretty(pg_indexes_size(C.oid)) as index_size
        FROM pg_class C
        LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
        WHERE nspname NOT IN ($1, $2)
        AND C.relkind = $3
        ORDER BY pg_total_relation_size(C.oid) DESC
      `, ['pg_catalog', 'information_schema', 'r']);

      // Using a parameterized query with a limit for safety
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
        LIMIT $1
      `, [500]);

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
router.post('/maintenance/:task', async (req, res) => {
  try {
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
      // Check if pg_stat_statements extension is installed
      const extCheck = await client.query(`
        SELECT count(*) as count FROM pg_extension WHERE extname = $1
      `, ['pg_stat_statements']);

      const extensionInstalled = parseInt(extCheck.rows[0]?.count || '0') > 0;

      if (!extensionInstalled) {
        // @ts-ignore - Response type issue
  return res.json({
          status: 'extension_not_available',
          message: 'The pg_stat_statements extension is not installed on this database.',
          query_stats: []
        });
      }

      // Get query stats using parameterized query for the limit
      // The subquery for current_database() is safe as it's a system function
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
        LIMIT $1
      `, [100]);

      res.json({
        status: 'success',
        query_stats: statsResult.rows
      });
    } catch (error) {
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