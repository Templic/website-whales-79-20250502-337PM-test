import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Add error handler for the pool
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit on error in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database');
    client.release();
    return true;
  } catch (err: unknown) {
    console.error('Failed to connect to PostgreSQL:', err);
    throw err;
  }
};

// Export pool to be able to end it when the server closes
export const pgPool = pool;
import { sql } from 'drizzle-orm';
import { text, timestamp, pgTable } from 'drizzle-orm/pg-core';

// This is a legacy table, using contactMessages from schema.ts instead
/*export const contactFormEntries = pgTable('contact_form_entries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});*/
