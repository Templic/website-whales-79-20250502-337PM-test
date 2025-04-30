/**
 * Theme Database Connection
 * 
 * This module sets up the database connection for theme persistence.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSockets for Neon serverless
neonConfig.webSocketConstructor = ws;

// Initialize the connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle DB instance
export const db = drizzle(pool, { schema });