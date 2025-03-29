import express from 'express';
import { pool } from '../db';
import { log } from '../vite';
import { triggerDatabaseMaintenance } from '../db-optimize';

const router = express.Router();

// GET /api/admin/db-monitor/status - Get database status information
router.get('/status', async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    const session = req.session as any;
    if (!session?.user?.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }

    const client = await pool.connect();
    try {
      // Get database size
      const sizeResult = await client.query("SELECT pg_database_size(current_database()) as size");
      const databaseSize = sizeResult.rows[0].size;

      // Get pool statistics
      const poolStats = {
        total: pool.totalCount,
        active: pool.activeCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
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

      res.json({
        status: 'connected',
        time: new Date().toISOString(),
        database_size: {
          size: formatBytes(databaseSize),
          size_bytes: databaseSize
        },
        pool_stats: poolStats,
        table_stats: tableStats.rows,
        index_stats: indexStats.rows
      });

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
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
    const session = req.session as any;
    if (!session?.user?.role || session.user.role !== 'super_admin') {
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

export default router;