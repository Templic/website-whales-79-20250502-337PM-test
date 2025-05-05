/**
 * Create TypeScript Error Management Tables
 * 
 * This script will directly create the necessary tables for TypeScript error management
 * if they don't already exist in the database.
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    // Create transaction
    await client.query('BEGIN');
    
    console.log('Creating TypeScript error management tables...');
    
    // Create enums if they don't exist
    const createEnums = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_category') THEN
          CREATE TYPE error_category AS ENUM (
            'type_mismatch', 'missing_type', 'import_error', 'null_reference',
            'interface_mismatch', 'generic_constraint', 'declaration_error', 'syntax_error', 'other'
          );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_severity') THEN
          CREATE TYPE error_severity AS ENUM ('critical', 'high', 'medium', 'low');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_status') THEN
          CREATE TYPE error_status AS ENUM ('pending', 'fixed', 'ignored');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fix_method') THEN
          CREATE TYPE fix_method AS ENUM ('automatic', 'ai', 'pattern', 'manual');
        END IF;
      END
      $$;
    `;
    
    await client.query(createEnums);
    console.log('Enums created successfully');
    
    // Create typescript_scan_results table
    const createScanTable = `
      CREATE TABLE IF NOT EXISTS typescript_scan_results (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        error_count INTEGER NOT NULL DEFAULT 0,
        fixed_count INTEGER NOT NULL DEFAULT 0,
        ai_enabled BOOLEAN NOT NULL DEFAULT false,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        summary JSONB
      );
    `;
    
    await client.query(createScanTable);
    console.log('Scan results table created successfully');
    
    // Create typescript_errors table
    const createErrorsTable = `
      CREATE TABLE IF NOT EXISTS typescript_errors (
        id TEXT PRIMARY KEY,
        scan_id TEXT NOT NULL REFERENCES typescript_scan_results(id),
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        file TEXT NOT NULL,
        line INTEGER NOT NULL,
        "column" INTEGER NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NEW',
        timestamp TIMESTAMP NOT NULL,
        fix_details JSONB
      );
    `;
    
    await client.query(createErrorsTable);
    console.log('Errors table created successfully');
    
    // Create error_fixes table
    const createFixesTable = `
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
    `;
    
    await client.query(createFixesTable);
    console.log('Fixes table created successfully');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('All tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to setup database:', error);
    process.exit(1);
  });