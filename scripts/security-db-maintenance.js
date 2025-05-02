/**
 * Security Database Maintenance Script
 * 
 * This script performs maintenance and optimization on security-related tables,
 * including vacuuming, reindexing, refreshing materialized views, and analyzing
 * query performance.
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const chalk = require('chalk');

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Security tables and indexes to maintain
const SECURITY_TABLES = [
  'security_rules',
  'rule_dependencies',
  'security_events'
];

const SECURITY_INDEXES = [
  'security_rules_type_idx',
  'security_rules_status_idx',
  'security_rules_updated_at_idx',
  'security_rules_priority_idx',
  'rule_dependencies_rule_id_idx',
  'rule_dependencies_depends_on_rule_id_idx',
  'security_events_type_idx',
  'security_events_source_idx',
  'security_events_severity_idx',
  'security_events_processed_idx',
  'security_events_created_at_idx'
];

const MATERIALIZED_VIEWS = [
  'security_events_stats'
];

// Main function
async function performMaintenance() {
  const client = await pool.connect();
  console.log(chalk.blue('Connected to database'));
  
  try {
    // Check if tables exist before performing maintenance
    const existingTables = [];
    for (const table of SECURITY_TABLES) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (rows[0].exists) {
        existingTables.push(table);
      } else {
        console.log(chalk.yellow(`Table ${table} does not exist, skipping maintenance`));
      }
    }
    
    if (existingTables.length === 0) {
      console.log(chalk.yellow('No security tables found. Run setup-security-database.js first.'));
      return;
    }
    
    console.log(chalk.blue(`Found ${existingTables.length} security tables to maintain`));
    
    // 1. VACUUM tables
    for (const table of existingTables) {
      console.log(chalk.blue(`Vacuuming table ${table}...`));
      await client.query(`VACUUM ANALYZE ${table};`);
    }
    
    // 2. Reindex tables
    for (const table of existingTables) {
      console.log(chalk.blue(`Reindexing table ${table}...`));
      await client.query(`REINDEX TABLE ${table};`);
    }
    
    // 3. Refresh materialized views
    for (const view of MATERIALIZED_VIEWS) {
      try {
        console.log(chalk.blue(`Refreshing materialized view ${view}...`));
        await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view};`);
      } catch (error) {
        // If it doesn't exist or can't be refreshed concurrently, try without CONCURRENTLY
        if (error.message.includes('does not exist')) {
          console.log(chalk.yellow(`Materialized view ${view} does not exist, skipping`));
        } else {
          console.log(chalk.yellow(`Error with CONCURRENTLY, trying without: ${error.message}`));
          try {
            await client.query(`REFRESH MATERIALIZED VIEW ${view};`);
          } catch (refreshError) {
            console.error(chalk.red(`Failed to refresh view ${view}: ${refreshError.message}`));
          }
        }
      }
    }
    
    // 4. Collect statistics about security tables
    console.log(chalk.blue('Collecting table statistics...'));
    for (const table of existingTables) {
      const { rows: rowCount } = await client.query(`SELECT COUNT(*) FROM ${table};`);
      const { rows: tableSize } = await client.query(`
        SELECT pg_size_pretty(pg_total_relation_size($1)) as size;
      `, [table]);
      
      console.log(chalk.green(`Table ${table}: ${rowCount[0].count} rows, size ${tableSize[0].size}`));
    }
    
    // 5. Check for rules with potential circular dependencies
    if (existingTables.includes('rule_dependencies')) {
      console.log(chalk.blue('Checking for circular dependencies in rules...'));
      
      const { rows: circularDeps } = await client.query(`
        WITH RECURSIVE dependency_chain AS (
          -- Start with all dependencies
          SELECT 
            rule_id, 
            depends_on_rule_id, 
            ARRAY[rule_id] AS chain,
            1 AS depth
          FROM rule_dependencies
          
          UNION ALL
          
          -- Join with new dependencies and check if we've seen the rule already
          SELECT 
            dc.rule_id, 
            rd.depends_on_rule_id,
            dc.chain || rd.depends_on_rule_id,
            dc.depth + 1
          FROM dependency_chain dc
          JOIN rule_dependencies rd ON dc.depends_on_rule_id = rd.rule_id
          WHERE 
            dc.depth < 10 AND -- Limit recursion depth
            rd.depends_on_rule_id != ALL(dc.chain) -- Avoid cycles
        )
        -- Find chains where the end depends on the start, creating a cycle
        SELECT 
          dc1.rule_id, 
          dc1.chain
        FROM dependency_chain dc1
        JOIN rule_dependencies rd ON dc1.depends_on_rule_id = rd.rule_id
        WHERE rd.depends_on_rule_id = dc1.rule_id
        LIMIT 10;
      `);
      
      if (circularDeps.length > 0) {
        console.log(chalk.yellow(`Found ${circularDeps.length} potential circular dependencies:`));
        for (const dep of circularDeps) {
          console.log(chalk.yellow(`  Rule ${dep.rule_id} has circular dependency chain: ${dep.chain.join(' -> ')}`));
        }
      } else {
        console.log(chalk.green('No circular dependencies found'));
      }
    }
    
    // 6. Analyze query performance
    console.log(chalk.blue('Analyzing query performance...'));
    const { rows: slowQueries } = await client.query(`
      SELECT
        calls,
        total_time / calls as avg_time,
        rows / calls as avg_rows,
        query
      FROM pg_stat_statements
      WHERE query ILIKE '%security%rules%' OR query ILIKE '%rule_dependencies%'
      ORDER BY total_time / calls DESC
      LIMIT 5;
    `).catch(err => {
      console.log(chalk.yellow(`Unable to analyze query performance: ${err.message}`));
      console.log(chalk.yellow('To enable query analysis, run "CREATE EXTENSION pg_stat_statements;" in your database'));
      return { rows: [] };
    });
    
    if (slowQueries.length > 0) {
      console.log(chalk.blue('Top 5 slowest security-related queries:'));
      for (const q of slowQueries) {
        console.log(chalk.yellow(`  Avg time: ${q.avg_time.toFixed(2)}ms, Calls: ${q.calls}, Avg rows: ${q.avg_rows}`));
        console.log(chalk.gray(`  ${q.query.substring(0, 100)}...`));
      }
    }
    
    console.log(chalk.green('Database maintenance completed successfully'));
    
  } catch (error) {
    console.error(chalk.red('Error performing database maintenance:'), error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    console.log(chalk.blue('Database connection released'));
  }
}

// Execute the main function
performMaintenance()
  .then(() => {
    console.log(chalk.green('Script completed successfully'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
  });