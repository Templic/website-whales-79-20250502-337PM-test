/**
 * Intelligent Database Maintenance Operations
 * 
 * Provides automated maintenance for PostgreSQL with intelligent targeting of
 * tables that need optimization based on actual usage patterns.
 */

import { QueryResult } from 'pg';
import { db, pgPool } from './db';
import { config } from './config';
import { log } from './vite';
import { sql } from 'drizzle-orm';

// Track last maintenance time
let lastMaintenanceRun: number | null = null;

// Statistics for each table
interface TableStats {
  tableName: string;
  schemaName: string;
  rowCount: number;
  deadTuples: number;
  modifiedTuples: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
  lastAutoVacuum: Date | null;
  lastAutoAnalyze: Date | null;
}

/**
 * Schedule intelligent database maintenance based on configuration
 */
export async function scheduleIntelligentMaintenance(): Promise<void> {
  // Skip if optimization is disabled
  if (!config.features.enableDatabaseOptimization || !config.database.enableOptimization) {
    log('Database optimization is disabled, skipping maintenance scheduling', 'db-maintenance');
    return;
  }

  // Run maintenance immediately if it's the first run
  if (lastMaintenanceRun === null) {
    log('Initial database maintenance run scheduled', 'db-maintenance');
    await runIntelligentMaintenance();
  }

  // Schedule regular maintenance
  const interval = config.database.maintenanceInterval;
  log(`Scheduled regular database maintenance every ${interval / (1000 * 60 * 60)} hours`, 'db-maintenance');
  
  setInterval(async () => {
    await runIntelligentMaintenance();
  }, interval);
}

/**
 * Run intelligent database maintenance operations
 * This analyzes table statistics and only runs maintenance on tables that need it
 */
export async function runIntelligentMaintenance(): Promise<void> {
  try {
    const startTime = Date.now();
    log('Starting intelligent database maintenance...', 'db-maintenance');

    // Get table statistics
    const tableStats = await getTableStatistics();
    
    // Get tables needing maintenance
    const vacuumCandidates = identifyVacuumCandidates(tableStats);
    const analyzeCandidates = identifyAnalyzeCandidates(tableStats);

    // Log what we're going to do
    log(`Found ${vacuumCandidates.length} tables needing VACUUM`, 'db-maintenance');
    log(`Found ${analyzeCandidates.length} tables needing ANALYZE`, 'db-maintenance');

    // Run VACUUM on tables needing it
    if (vacuumCandidates.length > 0) {
      await runVacuum(vacuumCandidates);
    }

    // Run ANALYZE on tables needing it
    if (analyzeCandidates.length > 0) {
      await runAnalyze(analyzeCandidates);
    }

    // Update last maintenance time
    lastMaintenanceRun = Date.now();
    const duration = lastMaintenanceRun - startTime;
    
    log(`Database maintenance completed in ${duration}ms`, 'db-maintenance');
    
    // Log statistics of maintenance
    if (vacuumCandidates.length > 0 || analyzeCandidates.length > 0) {
      log('Maintenance summary:', 'db-maintenance');
      log(`- VACUUM performed on ${vacuumCandidates.length} tables`, 'db-maintenance');
      log(`- ANALYZE performed on ${analyzeCandidates.length} tables`, 'db-maintenance');
    } else {
      log('No tables required maintenance at this time', 'db-maintenance');
    }
    
    return;
  } catch (error: Error) {
    log(`Error during database maintenance: ${error}`, 'db-maintenance');
    console.error('Database maintenance error:', error);
  }
}

/**
 * Get database table statistics for maintenance decisions
 */
async function getTableStatistics(): Promise<TableStats[]> {
  try {
    // Using parameterized query for security
    const statsQuery = `
      SELECT
        s.schemaname AS schema_name,
        s.relname AS table_name,
        c.reltuples AS row_count,
        COALESCE(s.n_dead_tup, 0) AS dead_tuples,
        COALESCE(s.n_mod_since_analyze, 0) AS modified_tuples,
        s.last_vacuum,
        s.last_analyze,
        s.last_autovacuum,
        s.last_autoanalyze
      FROM pg_stat_user_tables s
      JOIN pg_class c ON s.relname = c.relname
      WHERE s.schemaname = $1
      ORDER BY s.relname
    `;

    const client = await pgPool.connect();
    const result: QueryResult = await client.query(statsQuery, ['public']);
    client.release();

    return result.rows.map(row => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      rowCount: parseInt(row.row_count) || 0,
      deadTuples: parseInt(row.dead_tuples) || 0,
      modifiedTuples: parseInt(row.modified_tuples) || 0,
      lastVacuum: row.last_vacuum,
      lastAnalyze: row.last_analyze,
      lastAutoVacuum: row.last_autovacuum,
      lastAutoAnalyze: row.last_autoanalyze
    }));
  } catch (error: Error) {
    log(`Error fetching table statistics: ${error}`, 'db-maintenance');
    return [];
  }
}

/**
 * Identify tables that need VACUUM based on dead tuples
 */
function identifyVacuumCandidates(tableStats: TableStats[]): string[] {
  const { excludeTables, targetTables, vacuumThreshold } = config.database;
  const candidates: string[] = [];

  for (const stats of tableStats) {
    // Skip excluded tables
    if (excludeTables.includes(stats.tableName)) {
      continue;
    }

    // Only check specific tables if specified
    if (targetTables.length > 0 && !targetTables.includes(stats.tableName)) {
      continue;
    }

    // Vacuum if dead tuples exceed threshold or if it's never been vacuumed
    if (stats.deadTuples >= vacuumThreshold || 
        (!stats.lastVacuum && !stats.lastAutoVacuum && stats.rowCount > 0)) {
      candidates.push(stats.tableName);
    }
  }

  return candidates;
}

/**
 * Identify tables that need ANALYZE based on modified tuples
 */
function identifyAnalyzeCandidates(tableStats: TableStats[]): string[] {
  const { excludeTables, targetTables, analyzeThreshold } = config.database;
  const candidates: string[] = [];

  for (const stats of tableStats) {
    // Skip excluded tables
    if (excludeTables.includes(stats.tableName)) {
      continue;
    }

    // Only check specific tables if specified
    if (targetTables.length > 0 && !targetTables.includes(stats.tableName)) {
      continue;
    }

    // Analyze if modified tuples exceed threshold or if it's never been analyzed
    if (stats.modifiedTuples >= analyzeThreshold ||
        (!stats.lastAnalyze && !stats.lastAutoAnalyze && stats.rowCount > 0)) {
      candidates.push(stats.tableName);
    }
  }

  return candidates;
}

/**
 * Run VACUUM operation on specific tables
 */
/**
 * Validates that a table name is safe to use in SQL operations
 * This helps prevent SQL injection attacks
 */
function isValidTableName(tableName: string): boolean {
  // Only allow alphanumeric characters, underscores, and hyphens
  // This is a strict validation for table names to prevent SQL injection
  return /^[a-zA-Z0-9_-]+$/.test(tableName);
}

async function runVacuum(tables: string[]): Promise<void> {
  if (tables.length === 0) return;

  try {
    const client = await pgPool.connect();

    for (const table of tables) {
      // Security: Validate table name before running operation
      if (!isValidTableName(table)) {
        log(`Security warning: Invalid table name '${table}' - skipping VACUUM`, 'db-maintenance');
        continue;
      }
      
      const startTime = Date.now();
      log(`Running VACUUM on table '${table}'...`, 'db-maintenance');
      
      // PostgreSQL requires double quotes for identifiers
      // Since parameterized queries don't directly support identifier substitution,
      // we need to validate the table name and then use template literals
      const query = `VACUUM (ANALYZE, VERBOSE) "${table}"`;
      await client.query(query);
      
      const duration = Date.now() - startTime;
      log(`VACUUM on '${table}' completed in ${duration}ms`, 'db-maintenance');
    }

    client.release();
  } catch (error: Error) {
    log(`Error during VACUUM: ${error}`, 'db-maintenance');
  }
}

/**
 * Run ANALYZE operation on specific tables
 */
async function runAnalyze(tables: string[]): Promise<void> {
  if (tables.length === 0) return;

  try {
    const client = await pgPool.connect();

    for (const table of tables) {
      // Security: Validate table name before running operation
      if (!isValidTableName(table)) {
        log(`Security warning: Invalid table name '${table}' - skipping ANALYZE`, 'db-maintenance');
        continue;
      }
      
      const startTime = Date.now();
      log(`Running ANALYZE on table '${table}'...`, 'db-maintenance');
      
      // PostgreSQL requires double quotes for identifiers
      // Since parameterized queries don't directly support identifier substitution,
      // we need to validate the table name and then use template literals
      const query = `ANALYZE VERBOSE "${table}"`;
      await client.query(query);
      
      const duration = Date.now() - startTime;
      log(`ANALYZE on '${table}' completed in ${duration}ms`, 'db-maintenance');
    }

    client.release();
  } catch (error: Error) {
    log(`Error during ANALYZE: ${error}`, 'db-maintenance');
  }
}

/**
 * Force vacuum and analyze on all tables
 * This is a utility function for manual maintenance
 */
export async function forceFullMaintenance(): Promise<void> {
  try {
    const startTime = Date.now();
    log('Starting full database maintenance (VACUUM ANALYZE on all tables)...', 'db-maintenance');

    const client = await pgPool.connect();
    
    // Get all tables except excluded ones - using parameterized query for security
    const tablesQuery = `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = $1
      ORDER BY tablename
    `;
    
    const result = await client.query(tablesQuery, ['public']);
    const allTables = result.rows.map(row => row.tablename);
    
    // Filter out excluded tables
    const { excludeTables } = config.database;
    const tablesToMaintain = allTables.filter(table => !excludeTables.includes(table));
    
    log(`Running full maintenance on ${tablesToMaintain.length} tables`, 'db-maintenance');
    
    // Run vacuum analyze on each table
    for (const table of tablesToMaintain) {
      // Security: Validate table name before running operation
      if (!isValidTableName(table)) {
        log(`Security warning: Invalid table name '${table}' - skipping maintenance`, 'db-maintenance');
        continue;
      }
      
      const tableStartTime = Date.now();
      log(`Running VACUUM ANALYZE on table '${table}'...`, 'db-maintenance');
      
      // PostgreSQL requires double quotes for identifiers
      // Since parameterized queries don't directly support identifier substitution,
      // we need to validate the table name and then use template literals
      const query = `VACUUM (ANALYZE, VERBOSE) "${table}"`;
      await client.query(query);
      
      const tableDuration = Date.now() - tableStartTime;
      log(`Maintenance on '${table}' completed in ${tableDuration}ms`, 'db-maintenance');
    }
    
    client.release();
    
    // Update last maintenance time
    lastMaintenanceRun = Date.now();
    const duration = lastMaintenanceRun - startTime;
    
    log(`Full database maintenance completed in ${duration}ms`, 'db-maintenance');
  } catch (error: Error) {
    log(`Error during full database maintenance: ${error}`, 'db-maintenance');
    console.error('Full database maintenance error:', error);
  }
}