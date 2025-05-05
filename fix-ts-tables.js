/**
 * Fix TypeScript Error Management Tables
 * 
 * This script fixes the database schema by:
 * 1. Dropping the existing typescript_errors table (which has invalid foreign keys)
 * 2. Re-creating all three tables in the correct order with proper foreign key constraints
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixTables() {
  const client = await pool.connect();
  
  try {
    // Create transaction
    await client.query('BEGIN');
    
    console.log('Fixing TypeScript error management tables...');
    
    // Drop existing tables if they exist
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS typescript_error_fixes CASCADE;
      DROP TABLE IF EXISTS error_fix_history CASCADE;
      DROP TABLE IF EXISTS error_analysis CASCADE;
      DROP TABLE IF EXISTS typescript_errors CASCADE;
      DROP TABLE IF EXISTS typescript_scan_results CASCADE;
    `);
    
    console.log('Tables dropped successfully');
    
    // Create enums if they don't exist
    console.log('Creating enums...');
    const createEnums = `
      DO $$ BEGIN
        -- Error status enum
        CREATE TYPE typescript_error_status AS ENUM (
          'NEW', 'FIXING', 'FIXED', 'IGNORED', 'PENDING'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        -- Error severity enum
        CREATE TYPE typescript_error_severity AS ENUM (
          'ERROR', 'WARNING', 'SUGGESTION', 'INFO'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        -- Error category enum
        CREATE TYPE typescript_error_category AS ENUM (
          'TYPE_MISMATCH', 'MISSING_PROPERTY', 'UNDEFINED_VARIABLE', 
          'IMPORT_ERROR', 'SYNTAX_ERROR', 'CONFIG_ERROR', 
          'LIBRARY_ERROR', 'REACT_ERROR', 'OTHER'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        -- Scan status enum
        CREATE TYPE typescript_scan_status AS ENUM (
          'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PENDING'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await client.query(createEnums);
    console.log('Enums created successfully');
    
    // Create tables in the correct order for foreign key constraints
    console.log('Creating tables...');
    
    // 1. Create scan results table first (parent table)
    const createScanTable = `
      CREATE TABLE typescript_scan_results (
        id TEXT PRIMARY KEY,
        status typescript_scan_status NOT NULL DEFAULT 'PENDING',
        error_count INTEGER NOT NULL DEFAULT 0,
        fixed_count INTEGER NOT NULL DEFAULT 0,
        ai_enabled BOOLEAN NOT NULL DEFAULT false,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        summary TEXT
      );
    `;
    
    await client.query(createScanTable);
    console.log('Scan results table created');
    
    // 2. Create errors table (references scan table)
    const createErrorsTable = `
      CREATE TABLE typescript_errors (
        id TEXT PRIMARY KEY,
        scan_id TEXT NOT NULL REFERENCES typescript_scan_results(id),
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        file TEXT NOT NULL,
        line INTEGER NOT NULL,
        column INTEGER NOT NULL,
        severity typescript_error_severity NOT NULL,
        category typescript_error_category NOT NULL,
        status typescript_error_status NOT NULL DEFAULT 'NEW',
        timestamp TIMESTAMP NOT NULL,
        fix_details JSONB
      );
    `;
    
    await client.query(createErrorsTable);
    console.log('Errors table created');
    
    // 3. Create fixes table (references errors table)
    const createFixesTable = `
      CREATE TABLE typescript_error_fixes (
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
    console.log('Fixes table created');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('All tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixTables()
  .then(() => {
    console.log('Database fix complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to fix database:', error);
    process.exit(1);
  });