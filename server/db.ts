/**
 * Database connection manager
 */

import pg from 'pg';
const { Pool } = pg;
import { executeWithCircuitBreaker } from './resilience';

// Create PostgreSQL connection pool
export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Match max connections to environment resources - low for dev, higher for prod
  max: parseInt(process.env.PGMAXCONNECTIONS || '10'),
  // Idle timeout
  idleTimeoutMillis: 30000,
  // Connection timeout
  connectionTimeoutMillis: 5000
});

// Handle pool errors
pgPool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Check if the database connection is working
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Use circuit breaker for database connection check
    const result = await executeWithCircuitBreaker('database', async () => {
      const client = await pgPool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    });
    return result;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Initialize the database connection
 */
export async function initDatabaseConnection(): Promise<boolean> {
  console.log('Initializing database connection...');
  
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log('Database connection initialized successfully');
      return true;
    } else {
      console.error('Database connection failed during initialization');
      return false;
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  console.log('Closing database connection...');
  await pgPool.end();
  console.log('Database connection closed');
}

/**
 * Get database connection stats
 */
export function getDatabaseStats(): any {
  return {
    totalConnections: pgPool.totalCount,
    idleConnections: pgPool.idleCount,
    waitingClients: pgPool.waitingCount,
    maxConnections: parseInt(process.env.PGMAXCONNECTIONS || '10')
  };
}

export default {
  pgPool,
  initDatabaseConnection,
  closeDatabaseConnection,
  checkDatabaseConnection,
  getDatabaseStats
};