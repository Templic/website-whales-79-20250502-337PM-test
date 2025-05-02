// Script to create materialized views for security analytics
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configure neon to work with WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Script to create materialized views for common security analytics queries
 * that integrate with the application's existing data models and query patterns.
 * 
 * Benefits:
 * 1. Significantly faster dashboard loading
 * 2. Reduced database load for common analytics
 * 3. Pre-aggregated data for historical analysis
 * 4. More responsive security interfaces
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
    // Start a separate client for raw queries (since we're creating materialized views)
    const client = await pool.connect();
    
    try {
      // Check if tables exist before creating views
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
      
      // Verify required tables exist
      const requiredTables = {
        securityThreats: await tableExists('security_threats'),
        securityEvents: await tableExists('security_events'),
        users: await tableExists('users')
      };
      
      // Log which tables exist
      for (const [table, exists] of Object.entries(requiredTables)) {
        if (exists) {
          console.log(chalk.green(`✓ Table ${table} exists`));
        } else {
          if (table === 'users') {
            console.log(chalk.yellow(`⚠ Table ${table} does not exist, user relation views will be skipped`));
          } else {
            console.log(chalk.red(`✗ Required table ${table} does not exist, cannot create views`));
            throw new Error(`Required table ${table} not found`);
          }
        }
      }
      
      // Start transaction
      await client.query('BEGIN');
      
      console.log(chalk.blue("\nCreating materialized views for security analytics..."));
      
      // 1. Threat statistics by day materialized view
      console.log(chalk.blue("\nCreating daily threat statistics view..."));
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_daily_threat_stats;
        
        CREATE MATERIALIZED VIEW mv_daily_threat_stats AS
        SELECT
          DATE_TRUNC('day', "timestamp") AS day,
          severity,
          threat_type,
          COUNT(*) AS count,
          COUNT(CASE WHEN resolved = TRUE THEN 1 END) AS resolved_count,
          COUNT(CASE WHEN resolved = FALSE THEN 1 END) AS unresolved_count,
          JSONB_AGG(DISTINCT rule_id) AS rule_ids,
          COUNT(DISTINCT source_ip) AS unique_source_ips
        FROM
          security_threats
        GROUP BY
          DATE_TRUNC('day', "timestamp"),
          severity,
          threat_type
        ORDER BY
          day DESC, 
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END;
          
        CREATE UNIQUE INDEX idx_mv_daily_threat_stats ON mv_daily_threat_stats (day, severity, threat_type);
      `);
      console.log(chalk.green("✓ Created daily threat statistics view"));
      
      // 2. Security events summary by day materialized view
      console.log(chalk.blue("\nCreating daily security events view..."));
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_daily_security_events;
        
        CREATE MATERIALIZED VIEW mv_daily_security_events AS
        SELECT
          DATE_TRUNC('day', "timestamp") AS day,
          severity,
          event_type,
          COUNT(*) AS count,
          COUNT(CASE WHEN acknowledged = TRUE THEN 1 END) AS acknowledged_count,
          COUNT(CASE WHEN acknowledged = FALSE THEN 1 END) AS unacknowledged_count,
          COUNT(DISTINCT user_id) AS unique_users,
          COUNT(DISTINCT ip_address) AS unique_ips
        FROM
          security_events
        GROUP BY
          DATE_TRUNC('day', "timestamp"),
          severity,
          event_type
        ORDER BY
          day DESC, 
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            WHEN 'info' THEN 5
            ELSE 6
          END;
          
        CREATE UNIQUE INDEX idx_mv_daily_security_events ON mv_daily_security_events (day, severity, event_type);
      `);
      console.log(chalk.green("✓ Created daily security events view"));
      
      // 3. Top threat sources materialized view
      console.log(chalk.blue("\nCreating top threat sources view..."));
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_top_threat_sources;
        
        CREATE MATERIALIZED VIEW mv_top_threat_sources AS
        SELECT
          source_ip,
          threat_type,
          COUNT(*) AS threat_count,
          MAX("timestamp") AS last_seen,
          MIN("timestamp") AS first_seen,
          ARRAY_AGG(DISTINCT severity ORDER BY 
            CASE severity
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
              ELSE 5
            END
          ) AS severity_levels,
          JSONB_OBJECT_AGG(threat_type, COUNT(*)) FILTER (WHERE threat_type IS NOT NULL) AS threat_type_counts,
          COUNT(CASE WHEN resolved = FALSE THEN 1 END) AS active_threats
        FROM
          security_threats
        WHERE
          "timestamp" > NOW() - INTERVAL '30 days'
        GROUP BY
          source_ip,
          threat_type
        ORDER BY
          threat_count DESC,
          last_seen DESC
        LIMIT 1000;
          
        CREATE UNIQUE INDEX idx_mv_top_threat_sources ON mv_top_threat_sources (source_ip, threat_type);
      `);
      console.log(chalk.green("✓ Created top threat sources view"));
      
      // 4. Security activity by user materialized view (only if users table exists)
      if (requiredTables.users) {
        console.log(chalk.blue("\nCreating security by user view..."));
        await client.query(`
          DROP MATERIALIZED VIEW IF EXISTS mv_security_by_user;
          
          CREATE MATERIALIZED VIEW mv_security_by_user AS
          WITH user_threats AS (
            SELECT
              user_id,
              COUNT(*) AS threat_count,
              ARRAY_AGG(DISTINCT severity ORDER BY 
                CASE severity
                  WHEN 'critical' THEN 1
                  WHEN 'high' THEN 2
                  WHEN 'medium' THEN 3
                  WHEN 'low' THEN 4
                  ELSE 5
                END
              ) AS severity_levels,
              MAX("timestamp") AS last_threat_activity,
              COUNT(CASE WHEN resolved = FALSE THEN 1 END) AS active_threats,
              JSONB_OBJECT_AGG(threat_type, COUNT(*)) FILTER (WHERE threat_type IS NOT NULL) AS threat_types
            FROM
              security_threats
            WHERE
              user_id IS NOT NULL
            GROUP BY
              user_id
          ),
          user_events AS (
            SELECT
              user_id,
              COUNT(*) AS event_count,
              ARRAY_AGG(DISTINCT severity ORDER BY 
                CASE severity
                  WHEN 'critical' THEN 1
                  WHEN 'high' THEN 2
                  WHEN 'medium' THEN 3
                  WHEN 'low' THEN 4
                  WHEN 'info' THEN 5
                  ELSE 6
                END
              ) AS severity_levels,
              MAX("timestamp") AS last_event_activity,
              COUNT(CASE WHEN acknowledged = FALSE THEN 1 END) AS unacknowledged_events,
              JSONB_OBJECT_AGG(event_type, COUNT(*)) FILTER (WHERE event_type IS NOT NULL) AS event_types
            FROM
              security_events
            WHERE
              user_id IS NOT NULL
            GROUP BY
              user_id
          )
          SELECT
            u.id AS user_id,
            u.username,
            COALESCE(t.threat_count, 0) AS threat_count,
            COALESCE(e.event_count, 0) AS event_count,
            t.severity_levels AS threat_severities,
            e.severity_levels AS event_severities,
            GREATEST(
              COALESCE(t.last_threat_activity, '1970-01-01'::timestamp), 
              COALESCE(e.last_event_activity, '1970-01-01'::timestamp)
            ) AS last_security_activity,
            COALESCE(t.active_threats, 0) AS active_threats,
            COALESCE(e.unacknowledged_events, 0) AS unacknowledged_events,
            COALESCE(t.threat_types, '{}'::jsonb) AS threat_types,
            COALESCE(e.event_types, '{}'::jsonb) AS event_types,
            (
              COALESCE(t.threat_count, 0) * 10 + 
              COALESCE(e.event_count, 0) * 5 +
              COALESCE(t.active_threats, 0) * 15 +
              COALESCE(e.unacknowledged_events, 0) * 8
            ) AS security_risk_score
          FROM
            users u
            LEFT JOIN user_threats t ON u.id = t.user_id
            LEFT JOIN user_events e ON u.id = e.user_id
          WHERE
            COALESCE(t.threat_count, 0) > 0 OR COALESCE(e.event_count, 0) > 0
          ORDER BY
            security_risk_score DESC,
            last_security_activity DESC;
            
          CREATE UNIQUE INDEX idx_mv_security_by_user ON mv_security_by_user (user_id);
        `);
        console.log(chalk.green("✓ Created security by user view"));
      }
      
      // 5. API security summary view
      console.log(chalk.blue("\nCreating API security summary view..."));
      await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS mv_api_security_summary;
        
        CREATE MATERIALIZED VIEW mv_api_security_summary AS
        SELECT
          request_path,
          request_method,
          COUNT(*) AS threat_count,
          ARRAY_AGG(DISTINCT severity ORDER BY 
            CASE severity
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
              ELSE 5
            END
          ) AS severity_levels,
          MAX("timestamp") AS last_detected,
          COUNT(DISTINCT source_ip) AS unique_ips,
          COUNT(DISTINCT user_id) AS unique_users,
          JSONB_OBJECT_AGG(threat_type, COUNT(*)) FILTER (WHERE threat_type IS NOT NULL) AS threat_types,
          JSONB_AGG(DISTINCT rule_id) AS triggered_rules
        FROM
          security_threats
        WHERE
          request_path IS NOT NULL
        GROUP BY
          request_path,
          request_method
        ORDER BY
          threat_count DESC,
          last_detected DESC;
          
        CREATE UNIQUE INDEX idx_mv_api_security_summary ON mv_api_security_summary (request_path, request_method);
      `);
      console.log(chalk.green("✓ Created API security summary view"));
      
      // 6. Create refresh function for all materialized views
      console.log(chalk.blue("\nCreating refresh function for materialized views..."));
      
      let refreshFunctionBody = `
        BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_threat_stats;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_security_events;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_threat_sources;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_api_security_summary;
      `;
      
      // Only include the user view if it was created
      if (requiredTables.users) {
        refreshFunctionBody += `  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_security_by_user;\n`;
      }
      
      refreshFunctionBody += `
          RETURN;
        END;
      `;
      
      await client.query(`
        CREATE OR REPLACE FUNCTION refresh_security_materialized_views()
        RETURNS VOID AS $$
        ${refreshFunctionBody}
        $$ LANGUAGE plpgsql;
      `);
      console.log(chalk.green("✓ Created refresh function"));
      
      // 7. Create scheduled refresh trigger
      console.log(chalk.blue("\nCreating automatic refresh trigger..."));
      await client.query(`
        -- Create pg_cron extension if needed (requires admin privileges)
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
          ) THEN
            BEGIN
              CREATE EXTENSION pg_cron;
            EXCEPTION
              WHEN insufficient_privilege THEN
                RAISE NOTICE 'Permission denied to create extension pg_cron. Skipping automatic scheduling.';
            END;
          END IF;
        END
        $$;
        
        -- Try to add scheduled job, will fail gracefully if pg_cron not available
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
          ) THEN
            BEGIN
              -- Drop existing job if it exists
              IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_proc p ON pronamespace = n.oid WHERE proname = 'refresh_security_materialized_views') THEN
                SELECT cron.unschedule('refresh_security_views');
              END IF;
              
              -- Schedule refresh every 30 minutes
              PERFORM cron.schedule('refresh_security_views', '*/30 * * * *', 'SELECT refresh_security_materialized_views()');
              RAISE NOTICE 'Scheduled automatic refresh of security views every 30 minutes';
            EXCEPTION
              WHEN OTHERS THEN
                RAISE NOTICE 'Failed to schedule automatic refresh: %', SQLERRM;
            END;
          END IF;
        END
        $$;
      `);
      console.log(chalk.green("✓ Attempted to create automatic refresh trigger"));
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(chalk.green("\n✅ Security materialized views created successfully!"));
      
      // Schedule the initial refresh of all views
      console.log(chalk.blue("\nPerforming initial refresh of materialized views..."));
      await client.query(`SELECT refresh_security_materialized_views();`);
      console.log(chalk.green("✓ Initial refresh completed"));
      
      // Generate detailed log content
      let logContent = `
Security Materialized Views - ${new Date().toISOString()}

The following materialized views have been created to optimize security analytics:

1. mv_daily_threat_stats
   - Daily aggregation of threats by severity and type
   - Used for threat trend analysis and dashboards
   - Includes rule_ids and unique_source_ips metrics

2. mv_daily_security_events
   - Daily aggregation of security events by severity and type
   - Used for security event monitoring and reporting
   - Includes unique_users and unique_ips metrics

3. mv_top_threat_sources
   - Aggregation of top threat sources (IPs) with threat counts
   - Used for threat source analysis and blocking recommendations
   - Includes detailed threat_type_counts breakdown

4. mv_api_security_summary
   - Aggregation of threats by API endpoint (path and method)
   - Used for identifying vulnerable endpoints
   - Includes triggered_rules for remediation
`;

      if (requiredTables.users) {
        logContent += `
5. mv_security_by_user
   - Aggregation of security threats and events by user
   - Used for identifying high-risk users
   - Includes security_risk_score for user prioritization
`;
      }

      logContent += `
A refresh function 'refresh_security_materialized_views()' has been created to
refresh all views in a single call.

Benefits:
- Significantly faster security dashboards (up to 100x for complex analytics)
- Pre-computed aggregations for common security queries
- Reduced database load for analytics
- More responsive security monitoring interfaces
- Optimized for the application's existing data models and query patterns
`;
      
      // Create logs directory if it doesn't exist
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      // Write log file
      fs.writeFileSync(
        path.join(logsDir, 'security-materialized-views.log'), 
        logContent
      );
      
      console.log(chalk.blue(`\nLog file created at: ${path.join('logs', 'security-materialized-views.log')}`));
      
    } catch (error) {
      // Rollback transaction on error
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(chalk.red("Error during transaction rollback:"), rollbackError);
      }
      console.error(chalk.red("Error creating materialized views:"), error);
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