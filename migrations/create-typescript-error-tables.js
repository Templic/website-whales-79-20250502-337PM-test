/**
 * TypeScript Error Management System - Database Migration
 * 
 * This migration creates all the necessary tables for the enhanced TypeScript error management system.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Neon to use WebSockets for serverless environments
neonConfig.webSocketConstructor = ws;

// Get the database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a PostgreSQL pool
const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

async function runMigration() {
  console.log('Starting migration: Creating TypeScript error management tables');
  
  try {
    // Create the tables in order (considering dependencies)
    await createEnums();
    await createScansTable();
    await createErrorPatternsTable();
    await createErrorsTable();
    await createAnalysisTable();
    await createFixHistoryTable();
    await createFixesTable();
    await createSecurityAuditsTable();
    await createMetricsTable();
    
    console.log('Migration completed successfully: TypeScript error management tables created');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

async function createEnums() {
  console.log('Creating enum types...');
  
  // Create enum types
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_category') THEN
        CREATE TYPE error_category AS ENUM (
          'TYPE_MISMATCH', 'MISSING_TYPE', 'INVALID_IMPORT', 'SYNTAX_ERROR', 
          'MODULE_ERROR', 'DEPENDENCY_ERROR', 'COMPILER_CONFIG', 'LIBRARY_ERROR',
          'SECURITY_CONCERN', 'OTHER'
        );
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_severity') THEN
        CREATE TYPE error_severity AS ENUM (
          'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'
        );
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_status') THEN
        CREATE TYPE error_status AS ENUM (
          'NEW', 'ANALYZING', 'FIXING', 'FIXED', 'IGNORED', 'NEEDS_REVIEW', 'SECURITY_REVIEW'
        );
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status') THEN
        CREATE TYPE scan_status AS ENUM (
          'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
        );
      END IF;
    END
    $$;
  `);
  
  console.log('Enum types created');
}

async function createScansTable() {
  console.log('Creating typescript_scan_results table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS typescript_scan_results (
      id TEXT PRIMARY KEY,
      status scan_status NOT NULL DEFAULT 'PENDING',
      error_count INTEGER NOT NULL DEFAULT 0,
      fixed_count INTEGER NOT NULL DEFAULT 0,
      ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      security_scan_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      start_time TIMESTAMP NOT NULL DEFAULT NOW(),
      end_time TIMESTAMP,
      summary TEXT,
      initiated_by TEXT,
      project_root TEXT,
      target_files TEXT,
      execution_time_ms INTEGER,
      security_context JSONB,
      metadata JSONB
    );
  `);
  
  console.log('typescript_scan_results table created');
}

async function createErrorPatternsTable() {
  console.log('Creating error_patterns table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS error_patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      pattern_regex TEXT NOT NULL,
      common_files TEXT,
      frequency INTEGER NOT NULL DEFAULT 0,
      security_impact TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB
    );
  `);
  
  console.log('error_patterns table created');
}

async function createErrorsTable() {
  console.log('Creating typescript_errors table...');
  
  // Create the table first
  await pool.query(`
    CREATE TABLE IF NOT EXISTS typescript_errors (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL REFERENCES typescript_scan_results(id),
      code TEXT NOT NULL,
      message TEXT NOT NULL,
      file TEXT NOT NULL,
      line INTEGER NOT NULL,
      "column" INTEGER NOT NULL,
      severity error_severity NOT NULL,
      category error_category NOT NULL,
      status error_status NOT NULL DEFAULT 'NEW',
      "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
      fix_details JSONB,
      security_impact TEXT,
      depends_on TEXT[],
      context_hash TEXT,
      file_hash TEXT,
      pattern_id TEXT REFERENCES error_patterns(id)
    );
  `);
  
  // Create indexes separately - need to use double quotes for column names
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_typescript_errors_scan_id ON typescript_errors("scan_id");`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_typescript_errors_file ON typescript_errors("file");`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_typescript_errors_pattern_id ON typescript_errors("pattern_id");`);
  
  console.log('typescript_errors table created');
}

async function createAnalysisTable() {
  console.log('Creating error_analysis table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS error_analysis (
      id SERIAL PRIMARY KEY,
      error_id TEXT NOT NULL REFERENCES typescript_errors(id),
      analysis_type TEXT NOT NULL,
      analysis_result JSONB NOT NULL,
      confidence INTEGER NOT NULL,
      "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB
    );
  `);
  
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_error_analysis_error_id ON error_analysis("error_id");`);
  
  console.log('error_analysis table created');
}

async function createFixHistoryTable() {
  console.log('Creating error_fix_history table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS error_fix_history (
      id SERIAL PRIMARY KEY,
      error_id TEXT NOT NULL REFERENCES typescript_errors(id),
      fixed_by TEXT NOT NULL,
      fix_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      original_code TEXT NOT NULL,
      fixed_code TEXT NOT NULL,
      fix_method TEXT NOT NULL,
      successful BOOLEAN NOT NULL,
      security_approved BOOLEAN DEFAULT FALSE,
      reviewed_by TEXT,
      review_notes TEXT,
      audit_log_id TEXT
    );
  `);
  
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_error_fix_history_error_id ON error_fix_history("error_id");`);
  
  console.log('error_fix_history table created');
}

async function createFixesTable() {
  console.log('Creating error_fixes table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS error_fixes (
      id SERIAL PRIMARY KEY,
      pattern_id TEXT NOT NULL REFERENCES error_patterns(id),
      fix_template TEXT NOT NULL,
      description TEXT NOT NULL,
      ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
      confidence INTEGER NOT NULL DEFAULT 50,
      success_rate INTEGER DEFAULT 0,
      security_approved BOOLEAN DEFAULT FALSE,
      approved_by TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_error_fixes_pattern_id ON error_fixes("pattern_id");`);
  
  console.log('error_fixes table created');
}

async function createSecurityAuditsTable() {
  console.log('Creating scan_security_audits table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_security_audits (
      id SERIAL PRIMARY KEY,
      scan_id TEXT NOT NULL REFERENCES typescript_scan_results(id),
      security_incident_id TEXT,
      audit_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      findings JSONB,
      security_score INTEGER,
      vulnerabilities_found INTEGER DEFAULT 0,
      critical_issues INTEGER DEFAULT 0,
      reviewed_by TEXT,
      status TEXT NOT NULL,
      metadata JSONB
    );
  `);
  
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_scan_security_audits_scan_id ON scan_security_audits("scan_id");`);
  
  console.log('scan_security_audits table created');
}

async function createMetricsTable() {
  console.log('Creating typescript_error_metrics table...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS typescript_error_metrics (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP NOT NULL DEFAULT NOW(),
      total_errors INTEGER NOT NULL DEFAULT 0,
      critical_errors INTEGER NOT NULL DEFAULT 0,
      high_errors INTEGER NOT NULL DEFAULT 0,
      medium_errors INTEGER NOT NULL DEFAULT 0,
      low_errors INTEGER NOT NULL DEFAULT 0,
      fixed_errors INTEGER NOT NULL DEFAULT 0,
      ai_fix_success_rate INTEGER DEFAULT 0,
      most_common_category TEXT,
      most_error_prone_file TEXT,
      average_fix_time INTEGER,
      security_impact_score INTEGER,
      metadata JSONB
    );
  `);
  
  console.log('typescript_error_metrics table created');
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });