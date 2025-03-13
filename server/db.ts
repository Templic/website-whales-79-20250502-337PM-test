import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Add error handler for the pool (adapted for Neon)
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});


//The initializeDatabase function is no longer needed with Neon, as it handles connection management internally.
//export const initializeDatabase = async () => {
//  try {
//    const client = await pool.connect();
//    console.log('Successfully connected to PostgreSQL database');
//    client.release();
//    return true;
//  } catch (err) {
//    console.error('Failed to connect to PostgreSQL:', err);
//    throw err;
//  }
//};

// Export pool to be able to end it when the server closes
export const pgPool = pool;