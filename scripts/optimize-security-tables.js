// Script to optimize security-related database tables with indexes
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configure neon to work with WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Script to add performance indexes to security tables that integrates with app's database conventions.
 * 
 * This script follows the application's existing database patterns and adds:
 * 1. Time-based indexes for fast historical queries
 * 2. Composite indexes for common filter combinations
 * 3. Indexes for frequently filtered columns (severity, threatType, etc.)
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(chalk.red("DATABASE_URL environment variable not set"));
    console.error(chalk.yellow("Make sure the database is provisioned correctly"));
    process.exit(1);
  }

  console.log(chalk.blue("Connecting to database..."));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  try {
    // Start a separate client for raw queries (since we're creating indexes)
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if tables exist before adding indexes
      console.log(chalk.blue("Verifying security tables..."));
      
      const tableExists = async (tableName) => {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          );
        `, [tableName]);
        return result.rows[0].exists;
      };
      
      // Verify each table exists
      const securityTables = {
        securityThreats: await tableExists('security_threats'),
        securityEvents: await tableExists('security_events'),
        securityScans: await tableExists('security_scans'),
        detectionRules: await tableExists('detection_rules'),
        blockedIps: await tableExists('blocked_ips')
      };
      
      // Log which tables exist
      for (const [table, exists] of Object.entries(securityTables)) {
        if (exists) {
          console.log(chalk.green(`✓ Table ${table} exists`));
        } else {
          console.log(chalk.yellow(`⚠ Table ${table} does not exist, skipping indexes`));
        }
      }
      
      // Add indexes to security_threats table
      if (securityTables.securityThreats) {
        console.log(chalk.blue("\nAdding indexes to security_threats table..."));
        
        // Time-based index for historical queries
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_threats_timestamp 
          ON security_threats("timestamp");
        `);
        console.log(chalk.green("✓ Created index on timestamp"));
        
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
        console.log(chalk.green("✓ Created indexes on threat_type, severity, source_ip, rule_id"));
        
        // Composite index for status filtering (resolved status is frequently queried)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_threats_resolved_timestamp 
          ON security_threats(resolved, "timestamp" DESC);
        `);
        console.log(chalk.green("✓ Created composite index on resolved + timestamp"));
        
        // Composite index for time + severity filtering (common query pattern)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_threats_severity_timestamp 
          ON security_threats(severity, "timestamp" DESC);
        `);
        console.log(chalk.green("✓ Created composite index on severity + timestamp"));
      }
      
      // Add indexes to security_events table
      if (securityTables.securityEvents) {
        console.log(chalk.blue("\nAdding indexes to security_events table..."));
        
        // Time-based index for historical queries
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_events_timestamp 
          ON security_events("timestamp");
        `);
        console.log(chalk.green("✓ Created index on timestamp"));
        
        // Indexes for commonly filtered columns
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_events_event_type 
          ON security_events(event_type);
          
          CREATE INDEX IF NOT EXISTS idx_security_events_severity 
          ON security_events(severity);
          
          CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
          ON security_events(user_id);
        `);
        console.log(chalk.green("✓ Created indexes on event_type, severity, user_id"));
        
        // Composite index for common filtering pattern (severity + timestamp)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_events_severity_timestamp 
          ON security_events(severity, "timestamp" DESC);
        `);
        console.log(chalk.green("✓ Created composite index on severity + timestamp"));
        
        // Index for acknowledged status filtering
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_events_acknowledged 
          ON security_events(acknowledged);
        `);
        console.log(chalk.green("✓ Created index on acknowledged"));
      }
      
      // Add indexes to security_scans table
      if (securityTables.securityScans) {
        console.log(chalk.blue("\nAdding indexes to security_scans table..."));
        
        // Time-based indexes
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_scans_start_time 
          ON security_scans(start_time);
          
          CREATE INDEX IF NOT EXISTS idx_security_scans_end_time 
          ON security_scans(end_time);
        `);
        console.log(chalk.green("✓ Created indexes on start_time and end_time"));
        
        // Status index
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_security_scans_status 
          ON security_scans(status);
        `);
        console.log(chalk.green("✓ Created index on status"));
      }
      
      // Add indexes to detection_rules table
      if (securityTables.detectionRules) {
        console.log(chalk.blue("\nAdding indexes to detection_rules table..."));
        
        // Indexes for commonly filtered columns
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_detection_rules_threat_type 
          ON detection_rules(threat_type);
          
          CREATE INDEX IF NOT EXISTS idx_detection_rules_severity 
          ON detection_rules(severity);
          
          CREATE INDEX IF NOT EXISTS idx_detection_rules_enabled 
          ON detection_rules(enabled);
        `);
        console.log(chalk.green("✓ Created indexes on threat_type, severity, enabled"));
      }
      
      // Add indexes to blocked_ips table
      if (securityTables.blockedIps) {
        console.log(chalk.blue("\nAdding indexes to blocked_ips table..."));
        
        // Indexes for blocked_ips table
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_blocked_ips_is_active 
          ON blocked_ips(is_active);
          
          CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_at 
          ON blocked_ips(blocked_at);
          
          CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at 
          ON blocked_ips(expires_at);
        `);
        console.log(chalk.green("✓ Created indexes on is_active, blocked_at, expires_at"));
      }
      
      // Query for existing indexes to validate our work
      console.log(chalk.blue("\nVerifying created indexes..."));
      const indexesQuery = `
        SELECT
          t.relname AS table_name,
          i.relname AS index_name,
          array_agg(a.attname ORDER BY a.attnum) AS column_names
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND t.relname LIKE 'security%' OR t.relname IN ('detection_rules', 'blocked_ips')
        GROUP BY
          t.relname,
          i.relname
        ORDER BY
          t.relname,
          i.relname;
      `;
      
      const indexesResult = await client.query(indexesQuery);
      const indexesByTable = {};
      
      indexesResult.rows.forEach(row => {
        if (!indexesByTable[row.table_name]) {
          indexesByTable[row.table_name] = [];
        }
        indexesByTable[row.table_name].push({
          name: row.index_name,
          columns: row.column_names
        });
      });
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(chalk.green("\n✅ Security table optimization completed successfully!"));
      
      // Generate detailed log content
      let logContent = `
Security Table Optimizations - ${new Date().toISOString()}

The following indexes were added to improve query performance:
`;

      for (const [table, indexes] of Object.entries(indexesByTable)) {
        logContent += `\n${table}:\n`;
        indexes.forEach(index => {
          logContent += `- ${index.name} (${index.columns.join(', ')})\n`;
        });
      }
      
      logContent += `
Benefits:
- Faster historical queries on security data
- Improved performance for security event filtering
- More efficient threat monitoring
- Better overall query performance for security analytics

Compatible with the application's existing data models and query patterns.
`;
      
      // Create logs directory if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Write log file
      fs.writeFileSync(
        path.join(logsDir, 'security-table-optimization.log'), 
        logContent
      );
      
      console.log(chalk.blue(`Log file created at: ${path.join('logs', 'security-table-optimization.log')}`));
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error(chalk.red("Error optimizing security tables:"), error);
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  } catch (error) {
    console.error(chalk.red("Unhandled error:"), error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(chalk.red("Script execution failed:"), err);
  process.exit(1);
});

// Add ESM export
export { };