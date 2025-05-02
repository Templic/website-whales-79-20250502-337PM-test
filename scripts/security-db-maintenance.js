// Script for scheduled security database maintenance
import { neonConfig, Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configure neon to work with WebSocket
neonConfig.fetchConnectionCache = true;

/**
 * Script for ongoing maintenance of security database tables
 * 
 * This script performs the following maintenance tasks:
 * 1. Refreshes materialized views on a schedule
 * 2. Analyzes and vacuums security tables for optimal performance
 * 3. Creates security statistics
 * 4. Checks for and creates future partitions if needed
 * 5. Archives old security data as needed
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
      
      // Get current timestamp for logging
      const timestamp = new Date().toISOString();
      const logMessages = [`Security Database Maintenance - ${timestamp}`];
      
      // 1. Refresh materialized views if they exist
      console.log("Refreshing security materialized views...");
      logMessages.push("\n1. Materialized Views Refresh");
      
      try {
        await client.query(`SELECT refresh_security_materialized_views();`);
        logMessages.push("✓ Successfully refreshed all security materialized views");
      } catch (error) {
        // If the function doesn't exist yet, log the message but continue
        logMessages.push("✗ Error refreshing materialized views: " + error.message);
        console.error("Could not refresh materialized views:", error.message);
      }
      
      // 2. Run ANALYZE on security tables to update statistics
      console.log("Analyzing security tables...");
      logMessages.push("\n2. Table Statistics Update");
      
      const securityTables = [
        'security_threats',
        'security_events',
        'security_scans',
        'security_settings',
        'detection_rules',
        'blocked_ips'
      ];
      
      for (const table of securityTables) {
        try {
          await client.query(`ANALYZE ${table};`);
          logMessages.push(`✓ Updated statistics for ${table}`);
        } catch (error) {
          // If table doesn't exist, continue to next table
          logMessages.push(`✗ Could not analyze ${table}: ${error.message}`);
        }
      }
      
      // 3. Check if partitioned table exists and create future partitions if needed
      console.log("Checking for partitioned tables...");
      logMessages.push("\n3. Partition Maintenance");
      
      try {
        // Check if partitioning function exists
        const functionExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM pg_proc
            WHERE proname = 'create_security_threats_partition'
          );
        `);
        
        if (functionExists.rows[0].exists) {
          // Create future partitions if needed
          await client.query(`SELECT create_security_threats_partition();`);
          logMessages.push("✓ Created future partitions as needed");
        } else {
          logMessages.push("ℹ Partitioning function does not exist. Skipping partition creation.");
        }
      } catch (error) {
        logMessages.push(`✗ Error checking partitions: ${error.message}`);
      }
      
      // 4. Archive old data if retention policy is defined
      console.log("Checking for data to archive...");
      logMessages.push("\n4. Data Archiving");
      
      // Default retention period (90 days for threats, 180 days for events)
      const threatRetentionDays = 90;
      const eventRetentionDays = 180;
      
      try {
        // Get retention settings from security_settings if they exist
        const settingsResult = await client.query(`
          SELECT value 
          FROM security_settings 
          WHERE key = 'data_retention_days' 
          LIMIT 1;
        `);
        
        let retentionSettings = null;
        if (settingsResult.rowCount > 0) {
          try {
            retentionSettings = JSON.parse(settingsResult.rows[0].value);
          } catch (e) {
            console.warn("Could not parse retention settings JSON:", e);
          }
        }
        
        // Archive old threats
        const threatArchiveDate = new Date();
        threatArchiveDate.setDate(
          threatArchiveDate.getDate() - 
          (retentionSettings?.threats || threatRetentionDays)
        );
        
        const threatResult = await client.query(`
          UPDATE security_threats
          SET is_archived = TRUE
          WHERE 
            "timestamp" < $1 AND
            is_archived = FALSE;
        `, [threatArchiveDate.toISOString()]);
        
        logMessages.push(`✓ Archived ${threatResult.rowCount} old security threats`);
        
        // Archive old events by marking them as acknowledged if they're not critical
        const eventArchiveDate = new Date();
        eventArchiveDate.setDate(
          eventArchiveDate.getDate() - 
          (retentionSettings?.events || eventRetentionDays)
        );
        
        const eventResult = await client.query(`
          UPDATE security_events
          SET 
            acknowledged = TRUE,
            acknowledged_at = NOW(),
            acknowledged_by = 'system-archiver'
          WHERE 
            "timestamp" < $1 AND
            acknowledged = FALSE AND
            severity != 'critical';
        `, [eventArchiveDate.toISOString()]);
        
        logMessages.push(`✓ Archived ${eventResult.rowCount} old security events`);
        
      } catch (error) {
        logMessages.push(`✗ Error archiving old data: ${error.message}`);
      }
      
      // 5. Run query analysis to find candidates for indexing
      console.log("Running query analysis...");
      logMessages.push("\n5. Query Performance Analysis");
      
      try {
        // Find slow queries on security tables
        const slowQueriesResult = await client.query(`
          SELECT
            substring(query from 1 for 100) as query_sample,
            calls,
            total_time,
            mean_time,
            rows
          FROM pg_stat_statements
          WHERE query ILIKE '%security%'
            AND total_time > 1000  -- queries taking more than 1s in total
          ORDER BY mean_time DESC
          LIMIT 5;
        `);
        
        if (slowQueriesResult.rowCount > 0) {
          logMessages.push("Top 5 slowest security-related queries:");
          
          slowQueriesResult.rows.forEach((row, i) => {
            logMessages.push(`  ${i+1}. [${row.mean_time.toFixed(2)}ms avg] ${row.query_sample}`);
          });
          
          logMessages.push("\nConsider optimizing these queries or adding specific indexes.");
        } else {
          logMessages.push("✓ No slow security queries detected.");
        }
      } catch (error) {
        // pg_stat_statements may not be enabled
        logMessages.push(`ℹ Could not analyze query performance: ${error.message}`);
        logMessages.push("  To enable query analysis, add pg_stat_statements extension.");
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Log maintenance completion
      console.log("Security database maintenance completed successfully!");
      
      // Write detailed log
      logMessages.push("\nMaintenance completed successfully.");
      fs.writeFileSync(
        path.join(process.cwd(), 'logs', `security-db-maintenance-${new Date().toISOString().slice(0,10)}.log`), 
        logMessages.join('\n')
      );
      
      // Keep only last 10 maintenance logs
      const logsDir = path.join(process.cwd(), 'logs');
      const maintenanceLogs = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('security-db-maintenance-'))
        .sort()
        .reverse();
      
      if (maintenanceLogs.length > 10) {
        maintenanceLogs.slice(10).forEach(logFile => {
          fs.unlinkSync(path.join(logsDir, logFile));
        });
      }
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error("Error during database maintenance:", error);
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