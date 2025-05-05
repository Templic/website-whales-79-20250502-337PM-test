/**
 * Migration to create TypeScript error management tables
 */
import { db } from '../server/db';

export async function up() {
  // Create typescript_scans table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS typescript_scans (
      id UUID PRIMARY KEY,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
      ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      summary TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  // Create typescript_errors table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS typescript_errors (
      id UUID PRIMARY KEY,
      scan_id UUID NOT NULL REFERENCES typescript_scans(id) ON DELETE CASCADE,
      code VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      file TEXT NOT NULL,
      line INTEGER NOT NULL,
      column INTEGER NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
      category VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK (status IN ('NEW', 'FIXING', 'FIXED', 'IGNORED')),
      fix_details JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  // Create indexes for better query performance
  await db.execute(`
    CREATE INDEX idx_typescript_errors_scan_id ON typescript_errors(scan_id)
  `);

  await db.execute(`
    CREATE INDEX idx_typescript_errors_status ON typescript_errors(status)
  `);

  await db.execute(`
    CREATE INDEX idx_typescript_errors_severity ON typescript_errors(severity)
  `);

  await db.execute(`
    CREATE INDEX idx_typescript_scans_status ON typescript_scans(status)
  `);

  // Create a function to update the updated_at timestamp
  await db.execute(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create triggers to automatically update updated_at columns
  await db.execute(`
    CREATE TRIGGER update_typescript_scans_updated_at
    BEFORE UPDATE ON typescript_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await db.execute(`
    CREATE TRIGGER update_typescript_errors_updated_at
    BEFORE UPDATE ON typescript_errors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log('Migration completed: Created TypeScript error management tables');
}

export async function down() {
  // Drop tables and functions
  await db.execute(`DROP TABLE IF EXISTS typescript_errors`);
  await db.execute(`DROP TABLE IF EXISTS typescript_scans`);
  await db.execute(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
  
  console.log('Migration reverted: Dropped TypeScript error management tables');
}