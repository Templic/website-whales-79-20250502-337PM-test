import { pgPool, db } from './db';
import pgMonitor from 'pg-monitor';
import PgBoss from 'pg-boss';
import path from 'path';
import fs from 'fs';
import { log } from './vite';

// Configure pg-monitor for basic logging
pgMonitor.attach({});
pgMonitor.setTheme('matrix'); // or 'dark', 'bright', etc.

// Set pg-monitor log destination to file in production
if (process.env.NODE_ENV === 'production') {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'db-queries.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  pgMonitor.setLog((msg, info) => {
    // Log query performance metrics to file
    const logEntry = `[${new Date().toISOString()}] ${info.event}: ${msg}\n`;
    logStream.write(logEntry);
  });
}

// Initialize task queue for background optimization
let boss: PgBoss;

export async function initDatabaseOptimization() {
  try {
    // Initialize PgBoss for background job processing
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL
    });
    await boss.start();
    
    // Register maintenance tasks
    await setupMaintenanceTasks();
    
    log('Database optimization initialized', 'db-optimize');
    return true;
  } catch (error) {
    console.error('Failed to initialize database optimization:', error);
    return false;
  }
}

async function setupMaintenanceTasks() {
  try {
    // Create queues first
    await boss.createQueue('vacuum-analyze');
    await boss.createQueue('reindex-database');
    await boss.createQueue('analyze-slow-queries');
    
    // Send initial messages to ensure queues exist
    await boss.send('vacuum-analyze', {});
    await boss.send('reindex-database', {});
    await boss.send('analyze-slow-queries', {});
    
    // Schedule regular VACUUM
    await boss.schedule('vacuum-analyze', '0 3 * * *'); // Every day at 3am
    await boss.work('vacuum-analyze', async () => {
      try {
        await pgPool.query('VACUUM ANALYZE');
        log('VACUUM ANALYZE completed successfully', 'db-maintenance');
        return { success: true };
      } catch (error) {
        console.error('VACUUM ANALYZE failed:', error);
        return { success: false, error };
      }
    });
    
    // Schedule regular index optimization
    await boss.schedule('reindex-database', '0 4 * * 0'); // Every Sunday at 4am
    await boss.work('reindex-database', async () => {
      try {
        // First get the current database name
        const dbNameResult = await pgPool.query('SELECT current_database()');
        const dbName = dbNameResult.rows[0].current_database;
        
        // Reindex tables one by one to avoid locks
        const tablesResult = await pgPool.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
        `);
        
        for (const row of tablesResult.rows) {
          await pgPool.query(`REINDEX TABLE "${row.tablename}"`);
          log(`Reindexed table ${row.tablename}`, 'db-maintenance');
        }
        
        log('Database reindexing completed', 'db-maintenance');
        return { success: true, tablesReindexed: tablesResult.rows.length };
      } catch (error) {
        console.error('Database reindexing failed:', error);
        return { success: false, error };
      }
    });
    
    // Register query analysis task
    await boss.work('analyze-slow-queries', async () => {
      try {
        // Check if pg_stat_statements extension exists
        const checkExtension = await pgPool.query(`
          SELECT exists(
            SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
          );
        `);
        
        if (checkExtension.rows[0].exists) {
          // If extension exists, analyze slow queries
          const result = await pgPool.query(`
            SELECT query, calls, total_time, mean_time, rows
            FROM pg_stat_statements
            ORDER BY mean_time DESC
            LIMIT 10;
          `);
          
          log('Slow query analysis completed', 'db-performance');
          return { success: true, slowQueries: result.rows };
        } else {
          // Otherwise, return basic query stats
          const result = await pgPool.query(`
            SELECT relname as table_name, 
                  seq_scan, 
                  seq_tup_read,
                  idx_scan, 
                  idx_tup_fetch
            FROM pg_stat_user_tables
            ORDER BY seq_scan DESC
            LIMIT 10;
          `);
          
          // Log basic query stats
          log('Basic query stats analysis completed', 'db-performance');
          return { success: true, basicQueryStats: result.rows };
        }
      } catch (error) {
        console.error('Slow query analysis failed:', error);
        return { success: false, error };
      }
    });
  } catch (error) {
    console.error('Error setting up maintenance tasks:', error);
  }
}

// Utility function to execute query with detailed performance metrics
export async function executeOptimizedQuery(query: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pgPool.query(query, params);
    const duration = Date.now() - start;
    
    // Log performance details only if query takes more than 100ms
    if (duration > 100) {
      log(`Slow query (${duration}ms): ${query.substring(0, 100)}...`, 'db-performance');
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query error after ${duration}ms:`, error);
    throw error;
  }
}

// Connection pooling optimization
export async function getConnectionPoolStats() {
  try {
    // @ts-ignore - Accessing internal pool properties for monitoring
    const totalCount = pgPool.totalCount;
    // @ts-ignore
    const idleCount = pgPool.idleCount;
    // @ts-ignore
    const waitingCount = pgPool.waitingCount;
    
    return {
      total: totalCount || 'unknown',
      active: (totalCount - idleCount) || 'unknown',
      idle: idleCount || 'unknown',
      waiting: waitingCount || 'unknown',
    };
  } catch (error) {
    console.error('Failed to get connection pool stats:', error);
    return { error: 'Unable to retrieve pool statistics' };
  }
}

// API to trigger manual optimization tasks
export async function triggerDatabaseMaintenance(task: 'vacuum' | 'reindex' | 'analyze') {
  try {
    switch (task) {
      case 'vacuum':
        return boss.send('vacuum-analyze', {});
      case 'reindex':
        return boss.send('reindex-database', {});
      case 'analyze':
        return boss.send('analyze-slow-queries', {});
      default:
        throw new Error(`Unknown maintenance task: ${task}`);
    }
  } catch (error) {
    console.error(`Failed to trigger ${task} task:`, error);
    throw error;
  }
}