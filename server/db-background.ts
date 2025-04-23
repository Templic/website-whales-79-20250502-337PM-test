import { pgPool } from './db';
import { log } from './vite';
import PgBoss from 'pg-boss';
import path from 'path';
import fs from 'fs';

// Initialize background job processor
let boss: PgBoss | null = null;

// Setup database logging
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'db-background.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Helper to log both to console and file
function logBackground(message: string, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  logStream.write(logEntry);
  if (level === 'error') {
    console.error(`[bg-db] ${message}`);
  } else {
    log(message, 'bg-db');
  }
}

export async function initBackgroundServices() {
  try {
    // Initialize PgBoss with the connection string
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL
    });
    
    // Handle startup events
    boss.on('error', error => {
      logBackground(`PgBoss error: ${error.message}`, 'error');
    });
    
    boss.on('maintenance', notice => {
      logBackground(`PgBoss maintenance: ${notice.message}`);
    });
    
    // Start the job processor
    await boss.start();
    logBackground('Background database services initialized');
    
    // Register workers for various tasks
    await registerWorkers();
    
    // Schedule regular jobs
    await scheduleRecurringJobs();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database background services:', error);
    return false;
  }
}

async function registerWorkers() {
  if (!boss) return;
  
  // Cleanup old sessions
  await boss.work('cleanup-sessions', async () => {
    try {
      // Use parameterized query with SQL template literal for safety
      const result = await pgPool.query(`
        DELETE FROM "session"
        WHERE expire < $1
      `, [new Date()]);
      
      logBackground(`Cleaned up ${result.rowCount} expired sessions`);
      return { success: true, cleanedCount: result.rowCount };
    } catch (error) {
      logBackground(`Session cleanup failed: ${(error as Error).message}`, 'error');
      return { success: false, error: (error as Error).message };
    }
  });
  
  // Database statistics collection
  await boss.work('collect-db-stats', async () => {
    try {
      // Get database size
      const sizeResult = await pgPool.query(`
        SELECT 
          pg_database_size(current_database()) as db_size_bytes,
          current_database() as db_name
      `);
      
      // Get table counts
      const tableCounts = await pgPool.query(`
        SELECT 
          schemaname,
          relname as table_name,
          n_live_tup as row_count
        FROM pg_stat_user_tables
      `);
      
      // Insert the statistics into our metrics table
      // First ensure the table exists
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS db_metrics (
          id SERIAL PRIMARY KEY,
          collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          db_size_bytes BIGINT,
          metrics JSONB
        )
      `);
      
      // Store current metrics
      await pgPool.query(`
        INSERT INTO db_metrics (db_size_bytes, metrics)
        VALUES ($1, $2)
      `, [
        sizeResult.rows[0].db_size_bytes,
        JSON.stringify({
          tables: tableCounts.rows,
          timestamp: new Date().toISOString()
        })
      ]);
      
      // Cleanup old metrics (keep only last 30 days)
      // Use parameterized query for safety
      await pgPool.query(`
        DELETE FROM db_metrics
        WHERE collected_at < NOW() - INTERVAL $1
      `, ['30 days']);
      
      logBackground('Database metrics collected successfully');
      return { success: true };
    } catch (error) {
      logBackground(`Database metrics collection failed: ${(error as Error).message}`, 'error');
      return { success: false, error: (error as Error).message };
    }
  });
  
  // Auto-vacuum analyzer for large tables
  await boss.work('auto-vacuum-analyze', async (job) => {
    try {
      const tables = job.data?.tables || [];
      const results = [];
      
      for (const table of tables) {
        // Validate table name - only allow alphanumeric and underscore
        if (!/^[a-zA-Z0-9_]+$/.test(table)) {
          logBackground(`Invalid table name format: ${table}`, 'error');
          results.push({ table, status: 'error', message: 'Invalid table name format' });
          continue;
        }
        
        logBackground(`Running VACUUM ANALYZE on table ${table}`);
        // Using identifier escaping with double quotes provides some protection, 
        // but adding regex validation above as additional security
        await pgPool.query(`VACUUM ANALYZE "${table}"`);
        results.push({ table, status: 'success' });
      }
      
      logBackground(`Auto-vacuum completed for ${tables.length} tables`);
      return { success: true, results };
    } catch (error) {
      logBackground(`Auto-vacuum failed: ${(error as Error).message}`, 'error');
      return { success: false, error: (error as Error).message };
    }
  });
}

async function scheduleRecurringJobs() {
  if (!boss) return;
  
  try {
    // Create queues first
    await boss.createQueue('cleanup-sessions');
    await boss.createQueue('collect-db-stats');
    await boss.createQueue('identify-large-tables');
    await boss.createQueue('auto-vacuum-analyze');
    
    // Send initial messages to ensure queues exist
    await boss.send('cleanup-sessions', {});
    await boss.send('collect-db-stats', {});
    await boss.send('identify-large-tables', {});
    
    // Schedule session cleanup (daily)
    await boss.schedule('cleanup-sessions', '0 2 * * *'); // Every day at 2am
    
    // Schedule database metrics collection (hourly)
    await boss.schedule('collect-db-stats', '5 * * * *'); // 5 minutes past every hour
    
    // Schedule auto-vacuum for large tables (weekly)
    await boss.schedule('identify-large-tables', '0 1 * * 0'); // Every Sunday at 1am
  } catch (error) {
    console.error('Error scheduling recurring jobs:', error);
  }
  
  // Register worker to identify large tables that need vacuuming
  await boss?.work('identify-large-tables', async () => {
    try {
      // Find tables with high dead tuple counts
      const result = await pgPool.query(`
        SELECT 
          relname as table_name,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          (n_dead_tup::float / GREATEST(n_live_tup, 1) * 100)::numeric(10,2) as dead_tuple_pct
        FROM pg_stat_user_tables
        WHERE (n_dead_tup::float / GREATEST(n_live_tup, 1) * 100) > 10
        ORDER BY dead_tuple_pct DESC
      `);
      
      if (result.rows.length > 0) {
        // Schedule vacuum for identified tables
        const tables = result.rows.map(row => row.table_name);
        
        logBackground(`Scheduling VACUUM ANALYZE for ${tables.length} tables with high dead tuple counts`);
        await boss?.send('auto-vacuum-analyze', { tables });
      } else {
        logBackground('No tables require vacuuming at this time');
      }
      
      return { success: true, tablesIdentified: result.rows.length };
    } catch (error) {
      logBackground(`Large table identification failed: ${(error as Error).message}`, 'error');
      return { success: false, error: (error as Error).message };
    }
  });
  
  logBackground('Recurring database maintenance jobs scheduled');
}

// Utility to manually trigger a specific job
export async function triggerBackgroundJob(jobName: string, data?: any) {
  if (!boss) {
    throw new Error('Background services not initialized');
  }
  
  return await boss.send(jobName, data || {});
}

// Get the status of a specific job
export async function getJobStatus(jobId: string) {
  if (!boss) {
    throw new Error('Background services not initialized');
  }
  
  // PgBoss 7.x expects different parameters than what TS types indicate
  // @ts-ignore - Type definitions don't match actual implementation
  return await boss.getJobById(jobId);
}

// Graceful shutdown
export async function shutdownBackgroundServices() {
  if (boss) {
    await boss.stop();
    logBackground('Background database services stopped');
  }
  
  // Close the log stream
  logStream.end();
}