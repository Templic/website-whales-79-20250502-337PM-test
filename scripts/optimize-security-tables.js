// Script to optimize security-related database tables with indexes
import { neonConfig, Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configure neon to work with WebSocket
neonConfig.fetchConnectionCache = true;

/**
 * Script to add performance indexes to security tables
 * 
 * This script adds the following optimizations:
 * 1. Time-based indexes for fast historical queries
 * 2. Composite indexes for common filter combinations
 * 3. Indexes for frequently filtered columns (severity, threat_type, etc.)
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
      
      console.log("Adding indexes to security_threats table...");
      
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
      
      // Composite index for status filtering (resolved status is frequently queried)
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_resolved_timestamp 
        ON security_threats(resolved, "timestamp" DESC);
      `);
      
      // Composite index for time + severity filtering (common query pattern)
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_threats_severity_timestamp 
        ON security_threats(severity, "timestamp" DESC);
      `);
      
      console.log("Adding indexes to security_events table...");
      
      // Time-based index for historical queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_events_timestamp 
        ON security_events("timestamp");
      `);
      
      // Indexes for commonly filtered columns
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_events_event_type 
        ON security_events(event_type);
        
        CREATE INDEX IF NOT EXISTS idx_security_events_severity 
        ON security_events(severity);
        
        CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
        ON security_events(user_id);
      `);
      
      // Composite index for common filtering pattern (severity + timestamp)
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_events_severity_timestamp 
        ON security_events(severity, "timestamp" DESC);
      `);
      
      // Index for acknowledged status filtering
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_events_acknowledged 
        ON security_events(acknowledged);
      `);
      
      console.log("Adding indexes to security_scans table...");
      
      // Time-based indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_scans_start_time 
        ON security_scans(start_time);
        
        CREATE INDEX IF NOT EXISTS idx_security_scans_end_time 
        ON security_scans(end_time);
      `);
      
      // Status index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_security_scans_status 
        ON security_scans(status);
      `);
      
      console.log("Adding indexes to detection_rules table...");
      
      // Indexes for commonly filtered columns
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_detection_rules_threat_type 
        ON detection_rules(threat_type);
        
        CREATE INDEX IF NOT EXISTS idx_detection_rules_severity 
        ON detection_rules(severity);
        
        CREATE INDEX IF NOT EXISTS idx_detection_rules_enabled 
        ON detection_rules(enabled);
      `);
      
      console.log("Adding indexes to blocked_ips table...");
      
      // Indexes for blocked_ips table
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active 
        ON blocked_ips(is_active);
        
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_at 
        ON blocked_ips(blocked_at);
        
        CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at 
        ON blocked_ips(expires_at);
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log("Security table optimization completed successfully!");
      
      // Log the changes to a file
      const logContent = `
Security Table Optimizations - ${new Date().toISOString()}

The following indexes were added to improve query performance:

Security Threats Table:
- idx_security_threats_timestamp
- idx_security_threats_threat_type
- idx_security_threats_severity
- idx_security_threats_source_ip
- idx_security_threats_rule_id
- idx_security_threats_resolved_timestamp
- idx_security_threats_severity_timestamp

Security Events Table:
- idx_security_events_timestamp
- idx_security_events_event_type
- idx_security_events_severity
- idx_security_events_user_id
- idx_security_events_severity_timestamp
- idx_security_events_acknowledged

Security Scans Table:
- idx_security_scans_start_time
- idx_security_scans_end_time
- idx_security_scans_status

Detection Rules Table:
- idx_detection_rules_threat_type
- idx_detection_rules_severity
- idx_detection_rules_enabled

Blocked IPs Table:
- idx_blocked_ips_is_active
- idx_blocked_ips_blocked_at
- idx_blocked_ips_expires_at

Benefits:
- Faster historical queries on security data
- Improved performance for security event filtering
- More efficient threat monitoring
- Better overall query performance for security analytics
      `;
      
      fs.writeFileSync(
        path.join(process.cwd(), 'logs', 'security-table-optimization.log'), 
        logContent
      );
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error("Error optimizing security tables:", error);
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