/**
 * Create TypeScript Error Management Tables using Drizzle
 * 
 * This script creates the necessary database tables for TypeScript error management
 * using the Drizzle ORM schema definitions.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './shared/schema-typescript-errors.js';

// Get PostgreSQL connection parameters from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

async function createTables() {
  console.log('Creating TypeScript error management tables using Drizzle...');
  
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Create a Drizzle instance with the connection and schema
    const db = drizzle(pool, { schema });
    
    // Push the schema to the database
    console.log('Pushing schema to database...');
    
    // This is a simplified approach - in production, you would use migrations
    // For our test purposes, we'll directly create the tables
    await pool.query(`
      -- Create enums
      DO $$ BEGIN
        CREATE TYPE typescript_error_status AS ENUM (
          'NEW', 'FIXING', 'FIXED', 'IGNORED', 'PENDING'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE typescript_error_severity AS ENUM (
          'ERROR', 'WARNING', 'SUGGESTION', 'INFO'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE typescript_error_category AS ENUM (
          'TYPE_MISMATCH', 'MISSING_PROPERTY', 'UNDEFINED_VARIABLE', 
          'IMPORT_ERROR', 'SYNTAX_ERROR', 'CONFIG_ERROR', 
          'LIBRARY_ERROR', 'REACT_ERROR', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE typescript_scan_status AS ENUM (
          'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PENDING'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('Enums created');
    
    // Create tables in the correct order for foreign key constraints
    await pool.query(`
      -- Create scan results table
      CREATE TABLE IF NOT EXISTS typescript_scan_results (
        id TEXT PRIMARY KEY,
        status typescript_scan_status NOT NULL DEFAULT 'PENDING',
        error_count INTEGER NOT NULL DEFAULT 0,
        fixed_count INTEGER NOT NULL DEFAULT 0,
        ai_enabled BOOLEAN NOT NULL DEFAULT false,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        summary TEXT
      );
      
      -- Create errors table
      CREATE TABLE IF NOT EXISTS typescript_errors (
        id TEXT PRIMARY KEY,
        scan_id TEXT NOT NULL REFERENCES typescript_scan_results(id),
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        file TEXT NOT NULL,
        line INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        severity typescript_error_severity NOT NULL,
        category typescript_error_category NOT NULL,
        status typescript_error_status NOT NULL DEFAULT 'NEW',
        timestamp TIMESTAMP NOT NULL,
        fix_details JSONB
      );
      
      -- Create error fixes table
      CREATE TABLE IF NOT EXISTS typescript_error_fixes (
        id TEXT PRIMARY KEY,
        error_id TEXT NOT NULL REFERENCES typescript_errors(id),
        fix_version INTEGER NOT NULL,
        fixed_code TEXT NOT NULL,
        explanation TEXT,
        applied BOOLEAN NOT NULL DEFAULT false,
        confidence TEXT NOT NULL,
        ai_generated BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Tables created successfully');
    
    console.log('Database setup complete');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('All tables created successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to setup database:', error);
    process.exit(1);
  });