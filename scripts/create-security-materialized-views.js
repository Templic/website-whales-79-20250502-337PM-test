// Script to create materialized views for security analytics
import { neonConfig, Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configure neon to work with WebSocket
neonConfig.fetchConnectionCache = true;

/**
 * Script to create materialized views for common security analytics queries
 * 
 * Benefits:
 * 1. Significantly faster dashboard loading
 * 2. Reduced database load for common analytics
 * 3. Pre-aggregated data for historical analysis
 * 4. More responsive security interfaces
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
      
      console.log("Creating materialized views for security analytics...");
      
      // 1. Threat statistics by day materialized view
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_daily_threat_stats;
        
        CREATE MATERIALIZED VIEW mv_daily_threat_stats AS
        SELECT
          DATE_TRUNC('day', "timestamp") AS day,
          severity,
          threat_type,
          COUNT(*) AS count,
          COUNT(CASE WHEN resolved = TRUE THEN 1 END) AS resolved_count,
          COUNT(CASE WHEN resolved = FALSE THEN 1 END) AS unresolved_count
        FROM
          security_threats
        GROUP BY
          DATE_TRUNC('day', "timestamp"),
          severity,
          threat_type
        ORDER BY
          day DESC, 
          severity;
          
        CREATE UNIQUE INDEX idx_mv_daily_threat_stats ON mv_daily_threat_stats (day, severity, threat_type);
      `);
      
      // 2. Security events summary by day materialized view
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_daily_security_events;
        
        CREATE MATERIALIZED VIEW mv_daily_security_events AS
        SELECT
          DATE_TRUNC('day', "timestamp") AS day,
          severity,
          event_type,
          COUNT(*) AS count,
          COUNT(CASE WHEN acknowledged = TRUE THEN 1 END) AS acknowledged_count,
          COUNT(CASE WHEN acknowledged = FALSE THEN 1 END) AS unacknowledged_count
        FROM
          security_events
        GROUP BY
          DATE_TRUNC('day', "timestamp"),
          severity,
          event_type
        ORDER BY
          day DESC, 
          severity;
          
        CREATE UNIQUE INDEX idx_mv_daily_security_events ON mv_daily_security_events (day, severity, event_type);
      `);
      
      // 3. Top threat sources materialized view
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_top_threat_sources;
        
        CREATE MATERIALIZED VIEW mv_top_threat_sources AS
        SELECT
          source_ip,
          threat_type,
          COUNT(*) AS threat_count,
          MAX("timestamp") AS last_seen,
          MIN("timestamp") AS first_seen,
          ARRAY_AGG(DISTINCT severity) AS severity_levels
        FROM
          security_threats
        WHERE
          "timestamp" > NOW() - INTERVAL '30 days'
        GROUP BY
          source_ip,
          threat_type
        ORDER BY
          threat_count DESC,
          last_seen DESC;
          
        CREATE UNIQUE INDEX idx_mv_top_threat_sources ON mv_top_threat_sources (source_ip, threat_type);
      `);
      
      // 4. Security activity by user materialized view
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_security_by_user;
        
        CREATE MATERIALIZED VIEW mv_security_by_user AS
        SELECT
          u.id AS user_id,
          u.username,
          COUNT(DISTINCT t.id) AS threat_count,
          COUNT(DISTINCT e.id) AS event_count,
          ARRAY_AGG(DISTINCT t.severity) FILTER (WHERE t.id IS NOT NULL) AS threat_severities,
          ARRAY_AGG(DISTINCT e.severity) FILTER (WHERE e.id IS NOT NULL) AS event_severities,
          MAX(GREATEST(COALESCE(t.timestamp, '1970-01-01'::timestamp), COALESCE(e.timestamp, '1970-01-01'::timestamp))) AS last_activity
        FROM
          users u
          LEFT JOIN security_threats t ON u.id = t.user_id
          LEFT JOIN security_events e ON u.id = e.user_id
        GROUP BY
          u.id,
          u.username
        ORDER BY
          threat_count DESC,
          event_count DESC,
          last_activity DESC;
          
        CREATE UNIQUE INDEX idx_mv_security_by_user ON mv_security_by_user (user_id);
      `);
      
      // 5. Create refresh function for all materialized views
      await client.query(`
        CREATE OR REPLACE FUNCTION refresh_security_materialized_views()
        RETURNS VOID AS $$
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_threat_stats;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_security_events;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_threat_sources;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_security_by_user;
          
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log("Security materialized views created successfully!");
      
      // Schedule the initial refresh of all views
      console.log("Performing initial refresh of materialized views...");
      await client.query(`SELECT refresh_security_materialized_views();`);
      
      // Log the changes to a file
      const logContent = `
Security Materialized Views - ${new Date().toISOString()}

The following materialized views have been created to optimize security analytics:

1. mv_daily_threat_stats
   - Daily aggregation of threats by severity and type
   - Used for threat trend analysis and dashboards

2. mv_daily_security_events
   - Daily aggregation of security events by severity and type
   - Used for security event monitoring and reporting

3. mv_top_threat_sources
   - Aggregation of top threat sources (IPs) with threat counts
   - Used for threat source analysis and blocking recommendations

4. mv_security_by_user
   - Aggregation of security threats and events by user
   - Used for identifying high-risk users

A refresh function 'refresh_security_materialized_views()' has been created to
refresh all views in a single call.

Benefits:
- Significantly faster security dashboards
- Pre-computed aggregations for common security queries
- Reduced database load for analytics
- More responsive security monitoring interfaces
      `;
      
      fs.writeFileSync(
        path.join(process.cwd(), 'logs', 'security-materialized-views.log'), 
        logContent
      );
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error("Error creating materialized views:", error);
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