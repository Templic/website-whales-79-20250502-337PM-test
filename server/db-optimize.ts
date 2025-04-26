import { pgPool, db } from './db';
import path from 'path';
import fs from 'fs';
import { log } from './vite';

// Import PgBoss type properly
import type { default as PgBossType } from 'pg-boss';

// Create log directory lazily only when needed
let logStream: fs.WriteStream | null = null;

// Function to lazily setup logging
function setupLogging() {
  if (process.env.NODE_ENV === 'production' && !logStream) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'db-queries.log');
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
  }
  return logStream;
}

// Setup monitors lazily to avoid slowing down startup
async function setupMonitoring() {
  // Dynamically import pg-monitor only when needed
  const { default: pgMonitor } = await import('pg-monitor');
  
  // Configure pg-monitor for basic logging
  pgMonitor.attach({});
  pgMonitor.setTheme('matrix'); // or 'dark', 'bright', etc.
  
  // Set pg-monitor log destination to file in production
  if (process.env.NODE_ENV === 'production') {
    const stream = setupLogging();
    if (stream) {
      pgMonitor.setLog((msg, info) => {
        // Log query performance metrics to file
        const logEntry = `[${new Date().toISOString()}] ${info.event}: ${msg}\n`;
        stream.write(logEntry);
      });
    }
  }
}

// Initialize task queue for background optimization
let boss: unknown; // Using 'any' temporarily to avoid type issues

export async function initDatabaseOptimization() {
  try {
    // Start the monitoring asynchronously - doesn't block initialization
    setupMonitoring().catch(err => {
      console.warn('Failed to set up database monitoring:', err);
    });
    
    // Lazy load PgBoss only when needed
    const { default: PgBossConstructor } = await import('pg-boss');
    
    // Initialize PgBoss for background job processing
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Configure connection pool with optimal settings for startup
    boss = new PgBossConstructor({
      connectionString: process.env.DATABASE_URL,
      max: 3, // Limit connections during startup
      deleteAfterDays: 7 // Only keep completed jobs for 7 days
    });
    
    await boss.start();
    
    // Register maintenance tasks in the background with a delay
    // to avoid blocking the application startup
    setTimeout(async () => {
      try {
        await setupMaintenanceTasks();
      } catch (err) {
        console.error('Error during delayed maintenance setup:', err);
      }
    }, 3000); // 3 second delay
    
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
        // VACUUM ANALYZE is a PostgreSQL system command for maintenance
        // This is a fixed command string with no variable parts, so it's safe from SQL injection
        // We're explicitly not using user input or variable interpolation here
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
        // First get the current database name using a safe system function
        const dbNameResult = await pgPool.query('SELECT current_database()');
        const dbName = dbNameResult.rows[0].current_database;
        
        // Reindex tables one by one to avoid locks
        // Using parameterized query for schema name
        const tablesResult = await pgPool.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = $1
        `, ['public']);
        
        // Function to validate tablename to prevent SQL injection
        function isValidTableName(name: string): boolean {
          // Only allow alphanumeric characters, underscores and hyphens
          const tableNamePattern = /^[a-zA-Z0-9_-]+$/;
          return tableNamePattern.test(name);
        }

        for (const row of tablesResult.rows) {
          if (!isValidTableName(row.tablename)) {
            log(`Skipping invalid table name: ${row.tablename}`, 'db-maintenance');
            continue;
          }
          
          // PostgreSQL doesn't support parametrization for table/schema identifiers
          // So we need to validate the tablename and then use it directly with proper quoting
          // This is specifically for the REINDEX command which doesn't accept parameters for identifiers
          
          // Double check tablename meets the strict validation rules before executing
          if (isValidTableName(row.tablename)) {
            // Safe to use with proper double-quoting for PostgreSQL identifiers
            const reindexQuery = `REINDEX TABLE "${row.tablename}"`;
            
            // Analyze the query using our SQL injection prevention
            const analysisResult = sqlInjectionPrevention.analyzeQuery(reindexQuery);
            
            if (analysisResult.isSafe) {
              await pgPool.query(reindexQuery);
              log(`Reindexed table ${row.tablename}`, 'db-maintenance');
            } else {
              log(`Skipping potentially unsafe reindex operation for table: ${row.tablename}`, 'security');
            }
          } else {
            log(`Skipping invalid table name: ${row.tablename}`, 'db-maintenance');
          }
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
        // Check if pg_stat_statements extension exists with parameterized query
        const checkExtension = await pgPool.query(`
          SELECT exists(
            SELECT 1 FROM pg_extension WHERE extname = $1
          );
        `, ['pg_stat_statements']);
        
        if (checkExtension.rows[0].exists) {
          // If extension exists, analyze slow queries with a safe limit parameter
          const queryLimit = 10; // Hardcoded limit for security
          const result = await pgPool.query(`
            SELECT query, calls, total_time, mean_time, rows
            FROM pg_stat_statements
            ORDER BY mean_time DESC
            LIMIT $1;
          `, [queryLimit]);
          
          log('Slow query analysis completed', 'db-performance');
          return { success: true, slowQueries: result.rows };
        } else {
          // Otherwise, return basic query stats with a safe limit parameter
          const queryLimit = 10; // Hardcoded limit for security
          const result = await pgPool.query(`
            SELECT relname as table_name, 
                  seq_scan, 
                  seq_tup_read,
                  idx_scan, 
                  idx_tup_fetch
            FROM pg_stat_user_tables
            ORDER BY seq_scan DESC
            LIMIT $1;
          `, [queryLimit]);
          
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

// Import SQLInjectionPrevention module
import { sqlInjectionPrevention } from './security/advanced/database/SQLInjectionPrevention';

// Maximum number of retry attempts for database queries
const MAX_RETRY_ATTEMPTS = 3;
// Base delay in milliseconds before retrying (will be multiplied by attempt number)
const BASE_RETRY_DELAY = 300;

// Utility function to execute query with detailed performance metrics, SQL injection protection, and robust error handling
export async function executeOptimizedQuery(query: string, params?: unknown[], retryCount = 0) {
  const start = Date.now();
  try {
    // Analyze the query for potential SQL injection
    const analysisResult = sqlInjectionPrevention.analyzeQuery(query, params || []);
    
    // If the query is potentially dangerous, block it
    if (!analysisResult.isSafe) {
      const errorMessage = `Potentially dangerous query blocked: ${analysisResult.detectedPatterns.map(p => p.pattern.name).join(', ')}`;
      log(errorMessage, 'security');
      console.error(errorMessage);
      throw new Error('Query blocked due to security concerns');
    }
    
    // Execute the query if it's safe
    const result = await pgPool.query(query, params);
    const duration = Date.now() - start;
    
    // Log performance details only if query takes more than 100ms
    if (duration > 100) {
      // Truncate query for logging to avoid exposing sensitive details
      log(`Slow query (${duration}ms): ${query.substring(0, 100)}...`, 'db-performance');
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Check if this is a connection error that we should retry
    const isConnectionError = error.code === '57P01' || // admin shutdown
                            error.code === '08006' || // connection terminated
                            error.code === '08001' || // connection refused
                            error.code === '08004' || // rejected connection
                            error.code === 'ECONNRESET' || // connection reset by peer
                            error.code === 'ETIMEDOUT' || // connection timeout
                            error.message?.includes('Connection terminated');
    
    if (isConnectionError && retryCount < MAX_RETRY_ATTEMPTS) {
      // Calculate exponential backoff delay
      const retryDelay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
      
      log(`Database connection error (${error.code}), retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`, 'db-connection');
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Retry the query with incremented retry count
      return executeOptimizedQuery(query, params, retryCount + 1);
    }
    
    // Log all errors
    console.error(`Query error after ${duration}ms:`, error);
    
    // Rethrow the error if we've exhausted retries or it's not a connection error
    throw error;
  }
}

// Connection pooling optimization
export async function getConnectionPoolStats(retryCount = 0) {
  try {
    // Use the optimized query function to leverage SQL injection prevention and retry logic
    const result = await executeOptimizedQuery(`
      SELECT count(*) as total,
             count(*) FILTER (WHERE state = $1) as active,
             count(*) FILTER (WHERE state = $2) as idle,
             count(*) FILTER (WHERE state = $3) as idle_in_transaction,
             count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND pid <> pg_backend_pid();
    `, ['active', 'idle', 'idle in transaction']);
    
    const stats = result.rows[0] || {};
    
    // Safely parse integer values with validation
    function safeParseInt(value, defaultValue: number = 0): number {
      if (value === undefined || value === null) return defaultValue;
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return {
      total: safeParseInt(stats.total),
      active: safeParseInt(stats.active),
      idle: safeParseInt(stats.idle),
      waiting: safeParseInt(stats.waiting),
    };
  } catch (error) {
    console.error('Failed to get connection pool stats:', error);
    
    // Return default values instead of error to prevent frontend from crashing
    return {
      total: 0,
      active: 0,
      idle: 0,
      waiting: 0,
      error: error instanceof Error ? error.message : String(error)
    };
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