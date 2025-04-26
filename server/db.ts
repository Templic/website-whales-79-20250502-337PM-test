import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { text, timestamp, pgTable } from 'drizzle-orm/pg-core';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets for serverless environments
neonConfig.webSocketConstructor = ws;

// Connection retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// This preflight function helps diagnose connectivity issues
async function checkDatabaseConnectivityPreFlight() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    return false;
  }
  
  try {
    console.log("Creating temporary pool for connectivity check...");
    const testPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });
    
    console.log("Attempting to connect to database...");
    const client = await testPool.connect();
    console.log("Successfully connected to database for preflight check");
    
    try {
      await client.query('SELECT 1');
      console.log("Successfully executed test query");
      return true;
    } finally {
      client.release();
      await testPool.end();
    }
  } catch (error) {
    console.error("Database preflight connectivity check failed:", error);
    return false;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Pool configuration with connection timeout and connection max lifetime
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,                         // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,        // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000,   // Return an error after 5 seconds if connection not established
});

export const db = drizzle(pool, { schema });

// Global state to track if connection is down
let isConnectionDown = false;
let reconnectAttempts = 0;

// Enhanced error handler for the pool
pool.on('error', async (err: any) => {
  console.error('Database pool error:', err);
  
  // Handle specific Postgres error codes
  if (err.code === '57P01') { // Admin shutdown or connection timeout
    console.warn('Database connection terminated. This is usually temporary.');
    isConnectionDown = true;
    reconnectAttempts = 0;
    await attemptReconnect();
  } else if (err.code === '08006' || err.code === '08001' || err.code === '08004') { // Connection failure errors
    console.warn('Database connection failure. Will attempt to reconnect.');
    isConnectionDown = true;
    reconnectAttempts = 0;
    await attemptReconnect();
  } else {
    // Don't exit on error in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(-1);
    }
  }
});

// Function to attempt reconnection with backoff
async function attemptReconnect() {
  if (reconnectAttempts >= MAX_RETRIES) {
    console.error(`Failed to reconnect to database after ${MAX_RETRIES} attempts`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(-1);
    }
    return;
  }
  
  reconnectAttempts++;
  const delay = RETRY_DELAY_MS * Math.pow(1.5, reconnectAttempts - 1); // Exponential backoff
  
  console.log(`Attempting to reconnect to database in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RETRIES})`);
  
  setTimeout(async () => {
    try {
      const client = await pool.connect();
      console.log('Successfully reconnected to PostgreSQL database');
      client.release();
      isConnectionDown = false;
      reconnectAttempts = 0;
    } catch (err: any) {
      console.error('Failed to reconnect:', err);
      await attemptReconnect();
    }
  }, delay);
}

// Database initialization with retry logic
export const initializeDatabase = async () => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database');
      client.release();
      return true;
    } catch (err: any) {
      retries++;
      console.error(`Failed to connect to PostgreSQL (attempt ${retries}/${MAX_RETRIES}):`, err);
      
      if (retries >= MAX_RETRIES) {
        console.error('Maximum connection retries reached');
        throw err;
      }
      
      // Wait before retrying
      const delay = RETRY_DELAY_MS * Math.pow(1.5, retries - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Function to check database connectivity
export const checkDatabaseConnectivity = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    try {
      // Run a simple query to test if database is really working
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Database connectivity check failed:', err);
    return false;
  }
};

// Function to get connection statistics
export const getDatabaseStats = async (): Promise<{ 
  totalConnections: number; 
  idleConnections: number;
  waitingConnections: number;
  status: 'healthy' | 'degraded' | 'down';
}> => {
  try {
    // Default state if we can't query pool
    const stats = {
      totalConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      status: 'down' as 'healthy' | 'degraded' | 'down'
    };
    
    // Try to get real stats
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT count(*) as total_connections 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      // Get pool stats
      const poolStats = pool.totalCount;
      const idleCount = pool.idleCount;
      const waitingCount = pool.waitingCount;
      
      stats.totalConnections = poolStats;
      stats.idleConnections = idleCount;
      stats.waitingConnections = waitingCount;
      
      if (waitingCount > 10) {
        stats.status = 'degraded';
      } else {
        stats.status = 'healthy';
      }
      
      return stats;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Failed to get database stats:', err);
    return {
      totalConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      status: 'down' as 'healthy' | 'degraded' | 'down'
    };
  }
};

// Export pool to be able to end it when the server closes
export const pgPool = pool;

// This is a legacy table, using contactMessages from schema.ts instead
/*export const contactFormEntries = pgTable('contact_form_entries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});*/
