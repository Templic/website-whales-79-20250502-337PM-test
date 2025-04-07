/**
 * Database monitoring and maintenance routes
 */

import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { pgPool, checkDatabaseConnection } from '../db';

const router = express.Router();

// Only allow admin role to access these routes
const adminOnly = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: this endpoint requires admin privileges'
    });
  }
  next();
};

/**
 * Simple database connection check - public endpoint
 */
router.get('/check', asyncHandler(async (req: Request, res: Response) => {
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Database connection successful',
        pool: {
          totalConnections: pgPool.totalCount,
          idleConnections: pgPool.idleCount,
          waitingClients: pgPool.waitingCount
        }
      });
    } else {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed'
      });
    }
  } catch (error) {
    console.error('Database check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Database check error',
      error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
}));

/**
 * Get database health and statistics
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const client = await pgPool.connect();
    try {
      // Get PostgreSQL version
      const versionResult = await client.query('SELECT version()');
      
      // Get database size
      const dbSizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `);
      
      // Get connection stats
      const connectionResult = await client.query(`
        SELECT count(*) as active_connections,
               (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `);
      
      // Get table stats
      const tableStatsResult = await client.query(`
        SELECT relname as table_name,
               pg_size_pretty(pg_total_relation_size(relid)) as total_size,
               pg_size_pretty(pg_relation_size(relid)) as table_size,
               pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
               pg_total_relation_size(relid) as total_size_bytes
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 10
      `);
      
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: versionResult.rows[0].version,
        database: {
          name: process.env.PGDATABASE || 'default',
          size: dbSizeResult.rows[0].size,
          size_bytes: parseInt(dbSizeResult.rows[0].size_bytes),
          connections: {
            active: parseInt(connectionResult.rows[0].active_connections),
            idle: parseInt(connectionResult.rows[0].idle_connections),
            total: pgPool.totalCount,
            max: parseInt(process.env.PGMAXCONNECTIONS || '20')
          }
        },
        tables: tableStatsResult.rows,
        pool: {
          totalCount: pgPool.totalCount,
          idleCount: pgPool.idleCount,
          waitingCount: pgPool.waitingCount
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
}));

/**
 * Run database maintenance operations - admin only endpoint
 */
router.post('/maintenance', asyncHandler(async (req: Request, res: Response) => {
  // Check if user has admin role
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied: this endpoint requires admin privileges'
    });
  }
  
  const { operations } = req.body;
  
  // Validate operations array
  if (!operations || !Array.isArray(operations)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request: operations array is required'
    });
  }
  
  // Validate each operation is a known type
  const validOperations = ['vacuum', 'analyze', 'reindex'];
  const invalidOps = operations.filter(op => !validOperations.includes(op));
  
  if (invalidOps.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid operations: ${invalidOps.join(', ')}. Allowed operations: ${validOperations.join(', ')}`
    });
  }
  
  try {
    const client = await pgPool.connect();
    const results = [];
    
    try {
      // Run each requested operation
      for (const operation of operations) {
        const startTime = Date.now();
        let result;
        
        switch (operation) {
          case 'vacuum':
            result = await client.query('VACUUM VERBOSE');
            break;
          case 'analyze':
            result = await client.query('ANALYZE VERBOSE');
            break;
          case 'reindex':
            // Note: This can lock tables, use with caution
            result = await client.query('REINDEX DATABASE CONCURRENTLY current_database()');
            break;
        }
        
        results.push({
          operation,
          duration_ms: Date.now() - startTime,
          success: true
        });
      }
      
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Database maintenance operations completed successfully',
        results
      });
    } catch (error) {
      console.error('Database maintenance error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Database maintenance failed',
        error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message,
        results
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : (error as Error).message
    });
  }
}));

export default router;