import express from 'express';
import { pgPool } from '../db';
import { getConnectionPoolStats, triggerDatabaseMaintenance } from '../db-optimize';
import { log } from '../vite';

const router = express.Router();

// GET /api/admin/db-monitor/status - Get database status information
router.get('/status', async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    const session = req.session as any;
    if (!session?.user?.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }

    // Initialize variables with default empty values
    let dbSizeData = { size: '0 bytes', size_bytes: 0 };
    let tableStatsData = [];
    let indexStatsData = [];
    let poolStats = { total: 0, active: 0, idle: 0, waiting: 0 };
    
    try {
      // Get database size
      const dbSizeQuery = await pgPool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes;
      `);
      
      if (dbSizeQuery.rows && dbSizeQuery.rows.length > 0) {
        dbSizeData = dbSizeQuery.rows[0];
      }
    } catch (error) {
      console.error('Error getting database size:', error);
      // Continue with default values
    }
    
    try {
      // Get table statistics
      const tableStatsQuery = await pgPool.query(`
        SELECT 
          relname as table_name,
          n_live_tup as row_count,
          pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
          pg_size_pretty(pg_table_size(c.oid)) as table_size,
          pg_size_pretty(pg_indexes_size(c.oid)) as index_size
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE 
          c.relkind = 'r' AND
          n.nspname NOT IN ('pg_catalog', 'information_schema') AND
          n.nspname !~ '^pg_toast'
        ORDER BY pg_total_relation_size(c.oid) DESC;
      `);
      
      if (tableStatsQuery.rows) {
        tableStatsData = tableStatsQuery.rows;
      }
    } catch (error) {
      console.error('Error getting table statistics:', error);
      // Continue with default values
    }
    
    try {
      // Get index statistics
      const indexStatsQuery = await pgPool.query(`
        SELECT
          i.relname as index_name,
          t.relname as table_name,
          s.idx_scan as scan_count,
          s.idx_tup_read as tuples_read,
          s.idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(i.oid)) as index_size
        FROM pg_stat_user_indexes s
        JOIN pg_class i ON i.oid = s.indexrelid
        JOIN pg_class t ON t.oid = s.relid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY s.idx_scan DESC, pg_relation_size(i.oid) DESC;
      `);
      
      if (indexStatsQuery.rows) {
        indexStatsData = indexStatsQuery.rows;
      }
    } catch (error) {
      console.error('Error getting index statistics:', error);
      // Continue with default values
    }
    
    try {
      // Get connection pool stats
      poolStats = await getConnectionPoolStats();
    } catch (error) {
      console.error('Error getting connection pool stats:', error);
      // Continue with default values
    }
    
    res.json({
      status: 'connected',
      time: new Date().toISOString(),
      database_size: dbSizeData,
      pool_stats: poolStats,
      table_stats: tableStatsData,
      index_stats: indexStatsData
    });
  } catch (error) {
    console.error('Database monitor status error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve database status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/db-monitor/query-stats - Get query performance statistics
router.get('/query-stats', async (req, res) => {
  try {
    // Check if user is authenticated and has admin role
    const session = req.session as any;
    if (!session?.user?.role || !['admin', 'super_admin'].includes(session.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
    }

    let queryStats = [];
    let statsStatus = 'unavailable';
    
    try {
      // Check if pg_stat_statements extension is available
      const extensionCheck = await pgPool.query(`
        SELECT COUNT(*) as count FROM pg_extension WHERE extname = 'pg_stat_statements';
      `);
      
      if (parseInt(extensionCheck.rows[0].count) === 0) {
        return res.json({
          status: 'unavailable',
          message: 'pg_stat_statements extension is not enabled',
          query_stats: []
        });
      }
      
      // Extension is available, try to query it
      try {
        // Get query statistics from pg_stat_statements
        const queryStatsResult = await pgPool.query(`
          SELECT 
            query,
            calls,
            total_time,
            min_time,
            max_time,
            mean_time,
            stddev_time,
            rows
          FROM pg_stat_statements
          WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          ORDER BY mean_time DESC
          LIMIT 20;
        `);
        
        queryStats = queryStatsResult.rows || [];
        statsStatus = 'available';
      } catch (queryError) {
        console.error('Error querying pg_stat_statements:', queryError);
        // Return empty result but indicate the extension might be available
        return res.json({
          status: 'error',
          message: 'Error querying pg_stat_statements',
          query_stats: []
        });
      }
    } catch (extensionError) {
      console.error('Error checking for pg_stat_statements extension:', extensionError);
      // Return empty result with unavailable status
      return res.json({
        status: 'unavailable',
        message: 'Unable to determine if pg_stat_statements is available',
        query_stats: []
      });
    }
    
    res.json({
      status: statsStatus,
      query_stats: queryStats
    });
  } catch (error) {
    console.error('Query stats error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve query statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
      query_stats: []
    });
  }
});

// POST /api/admin/db-monitor/maintenance/:task - Trigger maintenance task
router.post('/maintenance/:task', async (req, res) => {
  try {
    // Check if user is authenticated and has super_admin role
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
    
    // Trigger the maintenance task
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