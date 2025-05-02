// Script to implement table partitioning for security_threats table for improved query performance
import { neonConfig, Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configure neon to work with WebSocket
neonConfig.fetchConnectionCache = true;

/**
 * Script to implement partitioning for security_threats table
 * 
 * Benefits of partitioning:
 * 1. Improved query performance for time-based queries
 * 2. More efficient table maintenance
 * 3. Better pruning of old data
 * 4. Reduced index size
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      console.log("Checking if security_threats table exists...");
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'security_threats'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log("security_threats table does not exist. Skipping partitioning.");
        await client.query('COMMIT');
        return;
      }
      
      console.log("Creating backup of security_threats table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS security_threats_backup AS
        SELECT * FROM security_threats;
      `);
      
      console.log("Creating partitioned security_threats table...");
      
      // Drop existing table
      await client.query(`
        DROP TABLE security_threats;
      `);
      
      // Create parent partitioned table
      await client.query(`
        CREATE TABLE security_threats (
          id SERIAL,
          threat_id TEXT NOT NULL,
          "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          threat_type TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          description TEXT NOT NULL,
          source_ip TEXT NOT NULL,
          user_id VARCHAR(255) REFERENCES users(id),
          request_path TEXT,
          request_method TEXT,
          evidence JSONB,
          rule_id TEXT NOT NULL,
          action_taken JSONB,
          resolved BOOLEAN DEFAULT FALSE,
          resolved_by VARCHAR(255) REFERENCES users(id),
          resolved_at TIMESTAMP,
          is_archived BOOLEAN DEFAULT FALSE,
          PRIMARY KEY (id, "timestamp")
        ) PARTITION BY RANGE ("timestamp");
      `);
      
      // Create partitions for different time periods
      // 1. Past data (adjust dates based on your needs)
      await client.query(`
        CREATE TABLE security_threats_past PARTITION OF security_threats
        FOR VALUES FROM ('2000-01-01') TO ('2025-01-01');
      `);
      
      // 2. Current year by quarters
      await client.query(`
        CREATE TABLE security_threats_2025_q1 PARTITION OF security_threats
        FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
        
        CREATE TABLE security_threats_2025_q2 PARTITION OF security_threats
        FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
        
        CREATE TABLE security_threats_2025_q3 PARTITION OF security_threats
        FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
        
        CREATE TABLE security_threats_2025_q4 PARTITION OF security_threats
        FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
      `);
      
      // 3. Future partition
      await client.query(`
        CREATE TABLE security_threats_future PARTITION OF security_threats
        FOR VALUES FROM ('2026-01-01') TO ('2030-01-01');
      `);
      
      console.log("Creating unique constraint for threat_id...");
      await client.query(`
        CREATE UNIQUE INDEX idx_security_threats_threat_id ON security_threats (threat_id);
      `);
      
      console.log("Restoring data from backup...");
      await client.query(`
        INSERT INTO security_threats
        SELECT * FROM security_threats_backup;
      `);
      
      console.log("Re-creating indexes on partitioned table...");
      
      // Time-based index for historical queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_timestamp 
        ON security_threats("timestamp");
      `);
      
      // Indexes for commonly filtered columns
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_threat_type 
        ON security_threats(threat_type);
        
        CREATE INDEX IF NOT EXISTS idx_security_threats_severity 
        ON security_threats(severity);
        
        CREATE INDEX IF NOT EXISTS idx_security_threats_source_ip 
        ON security_threats(source_ip);
        
        CREATE INDEX IF NOT EXISTS idx_security_threats_rule_id 
        ON security_threats(rule_id);
      `);
      
      // Composite index for status filtering
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_resolved_timestamp 
        ON security_threats(resolved, "timestamp" DESC);
      `);
      
      // Composite index for time + severity filtering
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_severity_timestamp 
        ON security_threats(severity, "timestamp" DESC);
      `);
      
      console.log("Creating maintenance function to create future partitions...");
      await client.query(`
        CREATE OR REPLACE FUNCTION create_security_threats_partition()
        RETURNS VOID AS $$
        DECLARE
          partition_date DATE;
          partition_name TEXT;
          start_date TEXT;
          end_date TEXT;
        BEGIN
          -- Get the next quarter start date
          partition_date := date_trunc('quarter', NOW() + INTERVAL '3 months');
          partition_name := 'security_threats_' || 
                           TO_CHAR(partition_date, 'YYYY') || '_q' || 
                           TO_CHAR(partition_date, 'Q');
          
          start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
          end_date := TO_CHAR(partition_date + INTERVAL '3 months', 'YYYY-MM-DD');
          
          -- Check if partition already exists
          IF NOT EXISTS (
            SELECT FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = partition_name AND n.nspname = 'public'
          ) THEN
            EXECUTE format(
              'CREATE TABLE %I PARTITION OF security_threats FOR VALUES FROM (%L) TO (%L)',
              partition_name, start_date, end_date
            );
            RAISE NOTICE 'Created new partition: %', partition_name;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      console.log("Dropping backup table...");
      await client.query(`
        DROP TABLE security_threats_backup;
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log("Security threats table partitioning completed successfully!");
      
      // Log the changes to a file
      const logContent = `
Security Threat Table Partitioning - ${new Date().toISOString()}

The security_threats table has been partitioned by timestamp with the following partitions:

1. security_threats_past: Before 2025
2. security_threats_2025_q1: 2025 Q1 (Jan-Mar)
3. security_threats_2025_q2: 2025 Q2 (Apr-Jun)
4. security_threats_2025_q3: 2025 Q3 (Jul-Sep)
5. security_threats_2025_q4: 2025 Q4 (Oct-Dec)
6. security_threats_future: 2026 and beyond

A maintenance function 'create_security_threats_partition()' has been created to
automatically create new partitions for future quarters.

Benefits:
- Significantly faster historical queries
- More efficient data pruning and maintenance
- Improved index performance
- Better query planning
      `;
      
      fs.writeFileSync(
        path.join(process.cwd(), 'logs', 'security-threat-partitioning.log'), 
        logContent
      );
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error("Error implementing partitioning:", error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Check if logs directory exists, create if not
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

main().catch(err => {
  console.error("Script execution failed:", err);
  process.exit(1);
});

// Add ESM export
export { };