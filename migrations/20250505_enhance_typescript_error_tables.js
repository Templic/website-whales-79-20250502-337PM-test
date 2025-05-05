/**
 * TypeScript Error Management System - Enhanced Migration for Phase 2
 * 
 * This migration enhances existing tables for improved error analysis
 * and security integration in Phase 2 of the TypeScript error management system.
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
  console.log('Starting migration: Enhancing TypeScript error management tables for Phase 2');
  
  try {
    // Enhance existing tables in order
    await enhanceTypescriptScanResults();
    await enhanceTypescriptErrors();
    await enhanceErrorAnalysis();
    await enhanceErrorFixHistory();
    await enhanceErrorPatterns();
    await enhanceErrorFixes();
    await createSecurityAuditsTable();
    await createMetricsTable();
    
    console.log('Migration completed successfully: TypeScript error management tables enhanced for Phase 2');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

async function enhanceTypescriptScanResults() {
  console.log('Enhancing typescript_scan_results table...');
  
  // Add security-related columns to typescript_scan_results
  await pool.query(`
    ALTER TABLE typescript_scan_results 
    ADD COLUMN IF NOT EXISTS security_scan_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS initiated_by TEXT,
    ADD COLUMN IF NOT EXISTS project_root TEXT,
    ADD COLUMN IF NOT EXISTS target_files TEXT,
    ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER,
    ADD COLUMN IF NOT EXISTS security_context JSONB,
    ADD COLUMN IF NOT EXISTS metadata JSONB;
  `);
  
  console.log('typescript_scan_results table enhanced');
}

async function enhanceTypescriptErrors() {
  console.log('Enhancing typescript_errors table...');
  
  // Add security and analysis fields to typescript_errors
  await pool.query(`
    ALTER TABLE typescript_errors 
    ADD COLUMN IF NOT EXISTS security_impact TEXT,
    ADD COLUMN IF NOT EXISTS depends_on TEXT[],
    ADD COLUMN IF NOT EXISTS context_hash TEXT,
    ADD COLUMN IF NOT EXISTS file_hash TEXT,
    ADD COLUMN IF NOT EXISTS fix_details JSONB;
  `);
  
  console.log('typescript_errors table enhanced');
}

async function enhanceErrorAnalysis() {
  console.log('Enhancing error_analysis table...');
  
  // Add confidence and metadata fields to error_analysis
  await pool.query(`
    ALTER TABLE error_analysis 
    ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS metadata JSONB;
  `);
  
  console.log('error_analysis table enhanced');
}

async function enhanceErrorFixHistory() {
  console.log('Enhancing error_fix_history table...');
  
  // Add security review fields to error_fix_history
  await pool.query(`
    ALTER TABLE error_fix_history 
    ADD COLUMN IF NOT EXISTS security_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS audit_log_id TEXT;
  `);
  
  console.log('error_fix_history table enhanced');
}

async function enhanceErrorPatterns() {
  console.log('Enhancing error_patterns table...');
  
  // Add security impact and metadata to error_patterns
  await pool.query(`
    ALTER TABLE error_patterns 
    ADD COLUMN IF NOT EXISTS security_impact TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB,
    ADD COLUMN IF NOT EXISTS common_files TEXT;
  `);
  
  console.log('error_patterns table enhanced');
}

async function enhanceErrorFixes() {
  console.log('Enhancing error_fixes table...');
  
  // Add security approval fields to error_fixes
  await pool.query(`
    ALTER TABLE error_fixes 
    ADD COLUMN IF NOT EXISTS security_approved BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_by TEXT;
  `);
  
  console.log('error_fixes table enhanced');
}

async function createSecurityAuditsTable() {
  console.log('Creating scan_security_audits table if not exists...');
  
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
  
  // Create index for scan_id
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_scan_security_audits_scan_id ON scan_security_audits("scan_id");
  `);
  
  console.log('scan_security_audits table created or verified');
}

async function createMetricsTable() {
  console.log('Creating typescript_error_metrics table if not exists...');
  
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
  
  console.log('typescript_error_metrics table created or verified');
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