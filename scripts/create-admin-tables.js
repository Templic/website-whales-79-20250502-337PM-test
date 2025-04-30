/**
 * Admin Utilities Tables Creation Script
 * 
 * Creates database tables for admin utilities:
 * 1. Data audit logs
 * 2. Data repair tasks
 * 3. Import/export jobs
 * 4. Batch operations
 * 5. Schema migrations
 * 6. Data auto fixes
 */
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a PostgreSQL client
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createEnums() {
  console.log('Creating enum types for admin utilities...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      DO $$ 
      BEGIN
        -- Audit action enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
          CREATE TYPE audit_action AS ENUM (
            'create', 'update', 'delete', 'view', 'export', 'import', 'repair', 
            'batch_operation', 'schema_change'
          );
        END IF;
        
        -- Repair status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repair_status') THEN
          CREATE TYPE repair_status AS ENUM (
            'pending', 'in_progress', 'completed', 'failed', 'reverted'
          );
        END IF;
        
        -- Data format enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_format') THEN
          CREATE TYPE data_format AS ENUM (
            'json', 'csv', 'xml', 'excel', 'sql'
          );
        END IF;
      END $$;
    `);
    console.log('Created enum types successfully');
  } catch (error) {
    console.error('Error creating enum types:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDataAuditLogsTable() {
  console.log('Creating data_audit_logs table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        action audit_action NOT NULL,
        table_affected TEXT NOT NULL,
        record_id TEXT NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        details TEXT,
        metadata JSONB
      );
    `);
    console.log('Created data_audit_logs table successfully');
  } catch (error) {
    console.error('Error creating data_audit_logs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDataRepairTasksTable() {
  console.log('Creating data_repair_tasks table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_repair_tasks (
        id SERIAL PRIMARY KEY,
        table_affected TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        issue_description TEXT NOT NULL,
        record_ids TEXT[],
        status repair_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES users(id),
        assigned_to VARCHAR(255) REFERENCES users(id),
        priority INTEGER NOT NULL DEFAULT 1,
        solution TEXT,
        repair_script TEXT,
        is_automated BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        metadata JSONB
      );
    `);
    console.log('Created data_repair_tasks table successfully');
  } catch (error) {
    console.error('Error creating data_repair_tasks table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDataImportExportJobsTable() {
  console.log('Creating data_import_export_jobs table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_import_export_jobs (
        id SERIAL PRIMARY KEY,
        job_type TEXT NOT NULL CHECK (job_type IN ('import', 'export')),
        table_affected TEXT NOT NULL,
        format data_format NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        file_path TEXT,
        record_count INTEGER,
        validation_errors JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES users(id),
        completed_at TIMESTAMP,
        config JSONB,
        filters JSONB,
        metadata JSONB
      );
    `);
    console.log('Created data_import_export_jobs table successfully');
  } catch (error) {
    console.error('Error creating data_import_export_jobs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createBatchOperationsTable() {
  console.log('Creating batch_operations table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_operations (
        id SERIAL PRIMARY KEY,
        operation_type TEXT NOT NULL CHECK (operation_type IN ('update', 'delete', 'create')),
        table_affected TEXT NOT NULL,
        record_ids TEXT[],
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'reverted')),
        changes JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES users(id),
        completed_at TIMESTAMP,
        transaction_id TEXT,
        is_rollbackable BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB
      );
    `);
    console.log('Created batch_operations table successfully');
  } catch (error) {
    console.error('Error creating batch_operations table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createSchemaMigrationsTable() {
  console.log('Creating schema_migrations table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'applied', 'failed')),
        forward_script TEXT NOT NULL,
        rollback_script TEXT,
        applied_at TIMESTAMP,
        applied_by VARCHAR(255) REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES users(id),
        version TEXT NOT NULL,
        checksum TEXT,
        dependencies TEXT[],
        metadata JSONB
      );
    `);
    console.log('Created schema_migrations table successfully');
  } catch (error) {
    console.error('Error creating schema_migrations table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDataAutoFixesTable() {
  console.log('Creating data_auto_fixes table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_auto_fixes (
        id SERIAL PRIMARY KEY,
        issue_pattern TEXT NOT NULL,
        fix_name TEXT NOT NULL,
        description TEXT NOT NULL,
        fix_script TEXT NOT NULL,
        table_affected TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        success_count INTEGER NOT NULL DEFAULT 0,
        fail_count INTEGER NOT NULL DEFAULT 0,
        last_run TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        created_by VARCHAR(255) REFERENCES users(id),
        trigger_condition JSONB,
        metadata JSONB
      );
    `);
    console.log('Created data_auto_fixes table successfully');
  } catch (error) {
    console.error('Error creating data_auto_fixes table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createIndexes() {
  console.log('Creating indexes for admin utility tables...');
  const client = await pool.connect();
  
  try {
    // Data audit logs indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_audit_logs_user_id ON data_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_data_audit_logs_action ON data_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_data_audit_logs_table_affected ON data_audit_logs(table_affected);
      CREATE INDEX IF NOT EXISTS idx_data_audit_logs_timestamp ON data_audit_logs(timestamp);
    `);
    
    // Data repair tasks indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_repair_tasks_status ON data_repair_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_data_repair_tasks_table_affected ON data_repair_tasks(table_affected);
      CREATE INDEX IF NOT EXISTS idx_data_repair_tasks_priority ON data_repair_tasks(priority);
    `);
    
    // Data import/export jobs indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_import_export_jobs_status ON data_import_export_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_data_import_export_jobs_job_type ON data_import_export_jobs(job_type);
      CREATE INDEX IF NOT EXISTS idx_data_import_export_jobs_created_at ON data_import_export_jobs(created_at);
    `);
    
    // Batch operations indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_batch_operations_status ON batch_operations(status);
      CREATE INDEX IF NOT EXISTS idx_batch_operations_operation_type ON batch_operations(operation_type);
      CREATE INDEX IF NOT EXISTS idx_batch_operations_table_affected ON batch_operations(table_affected);
    `);
    
    // Schema migrations indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations(status);
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
    `);
    
    // Data auto fixes indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_data_auto_fixes_is_active ON data_auto_fixes(is_active);
      CREATE INDEX IF NOT EXISTS idx_data_auto_fixes_table_affected ON data_auto_fixes(table_affected);
    `);
    
    console.log('Created indexes successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Starting admin utilities tables creation...');
    
    // Create enum types
    await createEnums();
    
    // Create tables
    await createDataAuditLogsTable();
    await createDataRepairTasksTable();
    await createDataImportExportJobsTable();
    await createBatchOperationsTable();
    await createSchemaMigrationsTable();
    await createDataAutoFixesTable();
    
    // Create indexes
    await createIndexes();
    
    console.log('Admin utilities tables creation completed successfully!');
    
    // Close the pool
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Error in admin utilities tables creation:', error);
    
    // Try to close the pool even if we have an error
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();