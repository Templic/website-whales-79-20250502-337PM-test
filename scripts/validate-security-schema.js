/**
 * Security Schema Validation Script
 * 
 * This script validates the security database schema, checking for:
 * - Table structure correctness
 * - Index efficiency
 * - Data integrity constraints
 * - Privacy and security compliance
 * - Performance optimization opportunities
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Expected schema structure
const EXPECTED_TABLES = {
  'security_rules': {
    requiredColumns: [
      'id', 'type', 'name', 'description', 'pattern', 
      'status', 'priority', 'conditions', 'actions', 
      'metadata', 'created_at', 'updated_at', 'version'
    ],
    primaryKey: 'id',
    requiredIndexes: [
      'security_rules_type_idx',
      'security_rules_status_idx',
      'security_rules_updated_at_idx',
      'security_rules_priority_idx'
    ],
    sensitiveColumns: [],
    autoTrimColumns: ['name', 'description'],
    validationRules: {
      'type': 'enum',
      'status': 'enum',
      'priority': 'integer',
      'conditions': 'jsonb',
      'actions': 'jsonb',
      'metadata': 'jsonb'
    }
  },
  'rule_dependencies': {
    requiredColumns: [
      'id', 'rule_id', 'depends_on_rule_id', 'dependency_type', 'created_at'
    ],
    primaryKey: 'id',
    requiredIndexes: [
      'rule_dependencies_rule_id_idx',
      'rule_dependencies_depends_on_rule_id_idx'
    ],
    foreignKeys: [
      { column: 'rule_id', references: 'security_rules(id)' },
      { column: 'depends_on_rule_id', references: 'security_rules(id)' }
    ],
    uniqueConstraints: [
      ['rule_id', 'depends_on_rule_id']
    ]
  },
  'security_events': {
    requiredColumns: [
      'id', 'type', 'source', 'severity', 'description', 
      'data', 'processed', 'processed_at', 'created_at', 
      'updated_at', 'metadata'
    ],
    primaryKey: 'id',
    requiredIndexes: [
      'security_events_type_idx',
      'security_events_source_idx',
      'security_events_severity_idx',
      'security_events_processed_idx',
      'security_events_created_at_idx'
    ],
    partitioningRecommended: true,
    partitioningColumn: 'created_at',
    partitioningType: 'RANGE',
    retentionPolicy: '3 months',
    sensitiveColumns: ['data', 'metadata'],
    encryptionRecommended: ['data'],
    anonymizationRecommended: ['source'],
    autoTrimColumns: ['description'],
    validationRules: {
      'severity': ['low', 'medium', 'high', 'critical'],
      'processed': 'boolean',
      'data': 'jsonb',
      'metadata': 'jsonb'
    }
  }
};

const EXPECTED_VIEWS = {
  'active_security_rules': {
    type: 'view',
    baseTable: 'security_rules',
    whereClause: "status = 'active'"
  },
  'security_events_stats': {
    type: 'materialized_view',
    refreshSchedule: '1 day',
    uniqueIndexes: ['security_events_stats_idx']
  }
};

// Main validation function
async function validateSecuritySchema() {
  const client = await pool.connect();
  console.log(chalk.blue('Connected to database'));
  
  try {
    // Output file for validation results
    const results = {
      timestamp: new Date().toISOString(),
      database: process.env.PGDATABASE || 'unknown',
      tables: {},
      views: {},
      recommendations: [],
      privacyComplianceIssues: [],
      securityIssues: [],
      performanceOptimizations: [],
      dataIntegrityIssues: [],
      overallHealth: 'unknown'
    };
    
    // 1. Check for table existence
    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      results.tables[tableName] = { exists: false, columnIssues: [], indexIssues: [], constraintIssues: [] };
      
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (!rows[0].exists) {
        console.log(chalk.yellow(`Table ${tableName} does not exist`));
        results.tables[tableName].exists = false;
        continue;
      }
      
      results.tables[tableName].exists = true;
      console.log(chalk.green(`Table ${tableName} exists`));
      
      // 2. Check table structure
      await validateTableStructure(client, tableName, EXPECTED_TABLES[tableName], results);
      
      // 3. Check indexes
      await validateTableIndexes(client, tableName, EXPECTED_TABLES[tableName], results);
      
      // 4. Check constraints
      await validateTableConstraints(client, tableName, EXPECTED_TABLES[tableName], results);
      
      // 5. Check for sensitive data handling
      if (EXPECTED_TABLES[tableName].sensitiveColumns?.length > 0) {
        await validatePrivacyMeasures(client, tableName, EXPECTED_TABLES[tableName], results);
      }
      
      // 6. Check for partitioning if recommended
      if (EXPECTED_TABLES[tableName].partitioningRecommended) {
        await validatePartitioning(client, tableName, EXPECTED_TABLES[tableName], results);
      }
    }
    
    // 7. Check for views
    for (const viewName of Object.keys(EXPECTED_VIEWS)) {
      results.views[viewName] = { exists: false, issues: [] };
      
      const view = EXPECTED_VIEWS[viewName];
      const viewType = view.type === 'materialized_view' ? 'materialized view' : 'view';
      
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_catalog.pg_${view.type === 'materialized_view' ? 'matviews' : 'views'}  
          WHERE schemaname = 'public' 
          AND matviewname = $1
        );
      `, [viewName]);
      
      if (!rows[0].exists) {
        console.log(chalk.yellow(`${viewType} ${viewName} does not exist`));
        results.views[viewName].exists = false;
        continue;
      }
      
      results.views[viewName].exists = true;
      console.log(chalk.green(`${viewType} ${viewName} exists`));
      
      // 8. Check view-specific features
      if (view.type === 'materialized_view') {
        await validateMaterializedView(client, viewName, view, results);
      }
    }
    
    // 9. Check for circular dependencies
    await checkCircularDependencies(client, results);
    
    // 10. Generate storage usage statistics
    await generateStorageStats(client, results);
    
    // 11. Check for encryption features
    await checkForEncryption(client, results);
    
    // 12. Check for audit logging
    await checkForAuditLogging(client, results);
    
    // 13. Evaluate overall health
    results.overallHealth = evaluateOverallHealth(results);
    
    // Write results to file
    const outputFile = path.join(__dirname, '../reports', `security-schema-validation-${new Date().toISOString().split('T')[0]}.json`);
    
    // Create reports directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, '../reports'), { recursive: true });
    
    // Write results
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));
    console.log(chalk.green(`Validation results written to ${outputFile}`));
    
    // Display summary
    console.log(chalk.blue('\nValidation Summary:'));
    console.log(chalk.blue('==================='));
    console.log(`Overall Health: ${getHealthColor(results.overallHealth)(results.overallHealth)}`);
    console.log(`Tables Checked: ${Object.keys(results.tables).length}`);
    console.log(`Views Checked: ${Object.keys(results.views).length}`);
    console.log(`Recommendations: ${results.recommendations.length}`);
    console.log(`Privacy Issues: ${results.privacyComplianceIssues.length}`);
    console.log(`Security Issues: ${results.securityIssues.length}`);
    console.log(`Performance Optimizations: ${results.performanceOptimizations.length}`);
    console.log(`Data Integrity Issues: ${results.dataIntegrityIssues.length}`);
    
    // Display top recommendations
    if (results.recommendations.length > 0) {
      console.log(chalk.blue('\nTop Recommendations:'));
      results.recommendations.slice(0, 5).forEach((rec, idx) => {
        console.log(chalk.yellow(`${idx + 1}. ${rec}`));
      });
    }
    
  } catch (error) {
    console.error(chalk.red('Error validating security schema:'), error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    console.log(chalk.blue('Database connection released'));
  }
}

// Helper function to validate table structure
async function validateTableStructure(client, tableName, expectedTable, results) {
  console.log(chalk.blue(`Checking structure of table ${tableName}...`));
  
  // Get column information
  const { rows: columns } = await client.query(`
    SELECT column_name, data_type, character_maximum_length, 
           is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);
  
  // Check for missing required columns
  const columnNames = columns.map(col => col.column_name);
  const missingColumns = expectedTable.requiredColumns.filter(col => !columnNames.includes(col));
  
  if (missingColumns.length > 0) {
    console.log(chalk.yellow(`Missing columns in ${tableName}: ${missingColumns.join(', ')}`));
    results.tables[tableName].columnIssues.push(`Missing required columns: ${missingColumns.join(', ')}`);
    results.recommendations.push(`Add missing columns to ${tableName}: ${missingColumns.join(', ')}`);
  }
  
  // Check data types if validation rules exist
  if (expectedTable.validationRules) {
    for (const [columnName, rule] of Object.entries(expectedTable.validationRules)) {
      const column = columns.find(col => col.column_name === columnName);
      if (!column) continue;
      
      // Check enum types
      if (rule === 'enum') {
        if (!column.data_type.includes('enum')) {
          results.tables[tableName].columnIssues.push(
            `Column ${columnName} should be an enum type but is ${column.data_type}`
          );
        }
      }
      
      // Check JSONB types
      if (rule === 'jsonb' && column.data_type !== 'jsonb') {
        results.tables[tableName].columnIssues.push(
          `Column ${columnName} should be JSONB but is ${column.data_type}`
        );
      }
      
      // Check integer types
      if (rule === 'integer' && !column.data_type.includes('int')) {
        results.tables[tableName].columnIssues.push(
          `Column ${columnName} should be integer but is ${column.data_type}`
        );
      }
      
      // Check boolean types
      if (rule === 'boolean' && column.data_type !== 'boolean') {
        results.tables[tableName].columnIssues.push(
          `Column ${columnName} should be boolean but is ${column.data_type}`
        );
      }
      
      // Check enum values
      if (Array.isArray(rule)) {
        // This would require checking the enum type definition,
        // which is more complex. We'll skip it for simplicity.
      }
    }
  }
  
  // Check for primary key
  if (expectedTable.primaryKey) {
    const { rows: primaryKey } = await client.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass
      AND i.indisprimary;
    `, [`public.${tableName}`]);
    
    if (primaryKey.length === 0 || !primaryKey.some(pk => pk.attname === expectedTable.primaryKey)) {
      console.log(chalk.yellow(`Primary key missing or incorrect in ${tableName}`));
      results.tables[tableName].constraintIssues.push(`Missing or incorrect primary key, should be: ${expectedTable.primaryKey}`);
      results.recommendations.push(`Add proper primary key to ${tableName}: ${expectedTable.primaryKey}`);
    }
  }
}

// Helper function to validate table indexes
async function validateTableIndexes(client, tableName, expectedTable, results) {
  console.log(chalk.blue(`Checking indexes of table ${tableName}...`));
  
  // Get existing indexes
  const { rows: indexes } = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1;
  `, [tableName]);
  
  // Check for missing required indexes
  const indexNames = indexes.map(idx => idx.indexname);
  
  if (expectedTable.requiredIndexes) {
    const missingIndexes = expectedTable.requiredIndexes.filter(idx => !indexNames.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log(chalk.yellow(`Missing indexes in ${tableName}: ${missingIndexes.join(', ')}`));
      results.tables[tableName].indexIssues.push(`Missing required indexes: ${missingIndexes.join(', ')}`);
      results.recommendations.push(`Add missing indexes to ${tableName}: ${missingIndexes.join(', ')}`);
    }
  }
  
  // Check for unused indexes
  const { rows: unusedIndexes } = await client.query(`
    SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public' AND relname = $1
    AND idx_scan = 0;
  `, [tableName]).catch(() => ({ rows: [] }));
  
  if (unusedIndexes.length > 0) {
    const indexNames = unusedIndexes.map(idx => idx.indexrelname).join(', ');
    console.log(chalk.yellow(`Unused indexes in ${tableName}: ${indexNames}`));
    results.performanceOptimizations.push(`Consider removing unused indexes from ${tableName}: ${indexNames}`);
  }
  
  // Check for duplicate indexes
  const indexDefinitions = indexes.map(idx => {
    const def = idx.indexdef.toLowerCase();
    return { name: idx.indexname, columns: extractIndexColumns(def) };
  });
  
  const duplicateSets = findDuplicateIndexes(indexDefinitions);
  
  if (duplicateSets.length > 0) {
    duplicateSets.forEach(set => {
      const idxNames = set.map(idx => idx.name).join(', ');
      const columns = set[0].columns.join(', ');
      console.log(chalk.yellow(`Duplicate indexes in ${tableName} on columns (${columns}): ${idxNames}`));
      results.performanceOptimizations.push(`Consider removing duplicate indexes from ${tableName}: ${idxNames}`);
    });
  }
}

// Helper function to validate table constraints
async function validateTableConstraints(client, tableName, expectedTable, results) {
  if (!expectedTable.foreignKeys && !expectedTable.uniqueConstraints) {
    return;
  }
  
  console.log(chalk.blue(`Checking constraints of table ${tableName}...`));
  
  // Check foreign keys
  if (expectedTable.foreignKeys) {
    for (const fk of expectedTable.foreignKeys) {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.table_constraints tc
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
          AND kcu.column_name = $2;
      `, [tableName, fk.column]);
      
      if (rows[0].count === 0) {
        console.log(chalk.yellow(`Missing foreign key in ${tableName}: ${fk.column} -> ${fk.references}`));
        results.tables[tableName].constraintIssues.push(`Missing foreign key: ${fk.column} -> ${fk.references}`);
        results.recommendations.push(`Add foreign key to ${tableName}: ${fk.column} -> ${fk.references}`);
      }
    }
  }
  
  // Check unique constraints
  if (expectedTable.uniqueConstraints) {
    for (const uniqueColumns of expectedTable.uniqueConstraints) {
      // This query is simplified and may not catch all unique constraints
      const uniqueColumnsStr = uniqueColumns.join(', ');
      const { rows } = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE constraint_type = 'UNIQUE'
          AND table_schema = 'public'
          AND table_name = $1;
      `, [tableName]);
      
      if (rows[0].count === 0) {
        console.log(chalk.yellow(`Missing unique constraint in ${tableName}: (${uniqueColumnsStr})`));
        results.tables[tableName].constraintIssues.push(`Missing unique constraint on columns: ${uniqueColumnsStr}`);
        results.recommendations.push(`Add unique constraint to ${tableName} on columns: ${uniqueColumnsStr}`);
      }
    }
  }
}

// Helper function to validate privacy measures
async function validatePrivacyMeasures(client, tableName, expectedTable, results) {
  console.log(chalk.blue(`Checking privacy measures for table ${tableName}...`));
  
  // Check if sensitive columns have any encryption or anonymization
  if (expectedTable.sensitiveColumns) {
    for (const column of expectedTable.sensitiveColumns) {
      // Check for permissions on the column
      const { rows: permissions } = await client.query(`
        SELECT grantee, privilege_type
        FROM information_schema.column_privileges
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2;
      `, [tableName, column]).catch(() => ({ rows: [] }));
      
      // If too many users have access to sensitive columns
      if (permissions.filter(p => p.grantee === 'PUBLIC').length > 0) {
        console.log(chalk.red(`Privacy issue: Sensitive column ${tableName}.${column} has PUBLIC access`));
        results.privacyComplianceIssues.push(
          `Sensitive column ${tableName}.${column} has PUBLIC access privileges`
        );
        results.recommendations.push(
          `Restrict access to sensitive column ${tableName}.${column}`
        );
      }
    }
  }
  
  // Check for encryption recommendations
  if (expectedTable.encryptionRecommended) {
    for (const column of expectedTable.encryptionRecommended) {
      // We can't directly check if data is encrypted, but we can recommend it
      results.privacyComplianceIssues.push(
        `Column ${tableName}.${column} may contain sensitive data that should be encrypted`
      );
      results.recommendations.push(
        `Consider implementing encryption for ${tableName}.${column}`
      );
    }
  }
  
  // Check for anonymization recommendations
  if (expectedTable.anonymizationRecommended) {
    for (const column of expectedTable.anonymizationRecommended) {
      results.privacyComplianceIssues.push(
        `Column ${tableName}.${column} may benefit from anonymization or pseudonymization`
      );
      results.recommendations.push(
        `Consider implementing data anonymization for ${tableName}.${column}`
      );
    }
  }
}

// Helper function to validate partitioning
async function validatePartitioning(client, tableName, expectedTable, results) {
  console.log(chalk.blue(`Checking partitioning for table ${tableName}...`));
  
  // Check if table is partitioned
  const { rows } = await client.query(`
    SELECT count(*) as count
    FROM pg_partitioned_table pt
    JOIN pg_class c ON c.oid = pt.partrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = $1;
  `, [tableName]).catch(() => ({ rows: [{ count: 0 }] }));
  
  if (parseInt(rows[0].count) === 0) {
    console.log(chalk.yellow(`Table ${tableName} is not partitioned but partitioning is recommended`));
    
    results.performanceOptimizations.push(
      `Consider implementing ${expectedTable.partitioningType} partitioning for ${tableName} on column ${expectedTable.partitioningColumn}`
    );
    
    results.recommendations.push(
      `Implement partitioning for table ${tableName} to improve query performance for time-series data`
    );
  }
  
  // If retention policy is specified, check if it's implemented
  if (expectedTable.retentionPolicy) {
    // We can't easily check if retention policy is implemented, but we can recommend it
    results.recommendations.push(
      `Ensure retention policy of ${expectedTable.retentionPolicy} is implemented for ${tableName}`
    );
  }
}

// Helper function to validate materialized views
async function validateMaterializedView(client, viewName, view, results) {
  console.log(chalk.blue(`Checking materialized view ${viewName}...`));
  
  // Check if it has a unique index for efficient refreshing
  if (view.uniqueIndexes) {
    for (const indexName of view.uniqueIndexes) {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1 AND indexname = $2;
      `, [viewName, indexName]);
      
      if (parseInt(rows[0].count) === 0) {
        console.log(chalk.yellow(`Materialized view ${viewName} is missing unique index ${indexName}`));
        results.views[viewName].issues.push(`Missing unique index: ${indexName}`);
        results.recommendations.push(
          `Add unique index ${indexName} to materialized view ${viewName} for efficient concurrent refreshing`
        );
      }
    }
  }
  
  // Check refresh date
  const { rows: refreshInfo } = await client.query(`
    SELECT pg_size_pretty(pg_relation_size($1)) as size,
           pg_stat_get_last_analyze_time($1::regclass)::timestamp as last_analyzed,
           now() - pg_stat_get_last_analyze_time($1::regclass)::timestamp as age
    FROM pg_class
    WHERE relname = $1;
  `, [viewName]).catch(() => ({ rows: [] }));
  
  if (refreshInfo.length > 0 && refreshInfo[0].last_analyzed) {
    const age = refreshInfo[0].age;
    const size = refreshInfo[0].size;
    
    // Log information about the materialized view
    console.log(chalk.blue(`Materialized view ${viewName} is ${size} in size, last refreshed ${age} ago`));
    
    // Check if it's been a long time since refresh
    if (age && age.includes('day') && parseInt(age.split(' ')[0]) > 1) {
      results.views[viewName].issues.push(`Materialized view has not been refreshed recently: ${age}`);
      results.recommendations.push(
        `Set up regular refresh schedule for materialized view ${viewName} as per recommended interval: ${view.refreshSchedule}`
      );
    }
  } else {
    console.log(chalk.yellow(`Could not determine last refresh time for ${viewName}`));
  }
}

// Helper function to check for circular dependencies
async function checkCircularDependencies(client, results) {
  console.log(chalk.blue('Checking for circular dependencies in rules...'));
  
  try {
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
    `).catch(() => ({ rows: [] }));
    
    if (circularDeps.length > 0) {
      console.log(chalk.yellow(`Found ${circularDeps.length} potential circular dependencies`));
      
      for (const dep of circularDeps) {
        const circularChain = dep.chain.join(' -> ');
        console.log(chalk.yellow(`  Rule ${dep.rule_id} has circular dependency chain: ${circularChain}`));
        
        results.dataIntegrityIssues.push(`Circular dependency detected: ${circularChain}`);
        results.recommendations.push(
          `Resolve circular dependency in rule chain: ${circularChain}`
        );
      }
    } else {
      console.log(chalk.green('No circular dependencies found'));
    }
  } catch (error) {
    console.log(chalk.yellow('Could not check for circular dependencies:', error.message));
  }
}

// Helper function to generate storage statistics
async function generateStorageStats(client, results) {
  console.log(chalk.blue('Generating storage statistics...'));
  
  try {
    // Get table sizes
    const { rows: tableSizes } = await client.query(`
      SELECT 
        relname as table_name,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        pg_size_pretty(pg_relation_size(relid)) as table_size,
        pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
        pg_total_relation_size(relid) as size_bytes
      FROM pg_catalog.pg_statio_user_tables
      WHERE schemaname = 'public'
      AND relname IN (${Object.keys(EXPECTED_TABLES).map(t => `'${t}'`).join(',')})
      ORDER BY pg_total_relation_size(relid) DESC;
    `).catch(() => ({ rows: [] }));
    
    if (tableSizes.length > 0) {
      results.storageStats = {
        tables: tableSizes.map(row => ({
          name: row.table_name,
          totalSize: row.total_size,
          tableSize: row.table_size,
          indexSize: row.index_size,
          sizeBytes: parseInt(row.size_bytes)
        }))
      };
      
      // Calculate total size
      const totalBytes = tableSizes.reduce((sum, row) => sum + parseInt(row.size_bytes), 0);
      results.storageStats.totalSizeBytes = totalBytes;
      results.storageStats.totalSizePretty = prettyBytes(totalBytes);
      
      // Generate recommendations for large tables
      tableSizes.forEach(row => {
        if (parseInt(row.size_bytes) > 10 * 1024 * 1024) { // If larger than 10MB
          const table = EXPECTED_TABLES[row.table_name];
          if (table && !table.partitioningRecommended) {
            results.performanceOptimizations.push(
              `Consider implementing partitioning for large table ${row.table_name} (${row.total_size})`
            );
          }
        }
      });
    }
  } catch (error) {
    console.log(chalk.yellow('Could not generate storage statistics:', error.message));
  }
}

// Helper function to check for encryption features
async function checkForEncryption(client, results) {
  console.log(chalk.blue('Checking for encryption features...'));
  
  try {
    // Check for pgcrypto extension
    const { rows: pgcrypto } = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_extension
      WHERE extname = 'pgcrypto';
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    if (parseInt(pgcrypto[0].count) === 0) {
      console.log(chalk.yellow('pgcrypto extension is not installed'));
      results.securityIssues.push('Missing pgcrypto extension for data encryption');
      results.recommendations.push(
        'Install pgcrypto extension to enable encryption capabilities: CREATE EXTENSION pgcrypto;'
      );
    } else {
      console.log(chalk.green('pgcrypto extension is installed'));
    }
    
    // Additional encryption checks
    // Look for encryption functions in column defaults or views
    const { rows: encryptionFunctions } = await client.query(`
      SELECT count(*) as count
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      AND (p.proname LIKE '%encrypt%' OR p.proname LIKE '%decrypt%' OR p.proname LIKE '%hash%');
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    if (parseInt(encryptionFunctions[0].count) === 0) {
      results.securityIssues.push('No encryption functions found in database');
      results.recommendations.push(
        'Consider implementing custom encryption functions for sensitive data'
      );
    }
    
  } catch (error) {
    console.log(chalk.yellow('Could not check for encryption features:', error.message));
  }
}

// Helper function to check for audit logging
async function checkForAuditLogging(client, results) {
  console.log(chalk.blue('Checking for audit logging capabilities...'));
  
  try {
    // Check for audit or log tables
    const { rows: auditTables } = await client.query(`
      SELECT count(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%audit%' OR table_name LIKE '%log%');
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    if (parseInt(auditTables[0].count) === 0) {
      console.log(chalk.yellow('No audit or log tables found'));
      results.securityIssues.push('No audit logging tables detected');
      results.recommendations.push(
        'Consider implementing audit logging to track changes to security rules and events'
      );
    }
    
    // Check for update triggers on security tables (often used for audit logging)
    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      if (!results.tables[tableName].exists) continue;
      
      const { rows: triggers } = await client.query(`
        SELECT count(*) as count
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND event_object_table = $1
        AND action_timing = 'AFTER'
        AND event_manipulation IN ('UPDATE', 'DELETE');
      `, [tableName]).catch(() => ({ rows: [{ count: 0 }] }));
      
      if (parseInt(triggers[0].count) === 0) {
        results.securityIssues.push(`No audit triggers found on ${tableName}`);
        results.recommendations.push(
          `Consider implementing audit triggers for ${tableName} to track changes`
        );
      }
    }
    
  } catch (error) {
    console.log(chalk.yellow('Could not check for audit logging capabilities:', error.message));
  }
}

// Helper function to evaluate overall health
function evaluateOverallHealth(results) {
  // Count critical issues
  const criticalIssues = results.securityIssues.length + results.dataIntegrityIssues.length;
  
  // Count important but non-critical issues
  const importantIssues = results.privacyComplianceIssues.length;
  
  // Count optimization opportunities
  const optimizationOpportunities = results.performanceOptimizations.length;
  
  // Count missing tables/views
  const missingTables = Object.values(results.tables).filter(t => !t.exists).length;
  const missingViews = Object.values(results.views).filter(v => !v.exists).length;
  
  // Calculate a score from 0-100
  let score = 100;
  
  // Deduct for missing tables/views
  score -= (missingTables + missingViews) * 20;
  
  // Deduct for critical issues
  score -= criticalIssues * 10;
  
  // Deduct for important issues
  score -= importantIssues * 5;
  
  // Deduct for optimization opportunities (less weight)
  score -= optimizationOpportunities * 2;
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  // Return a qualitative assessment
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 50) return 'Needs Improvement';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

// Helper function to prettify bytes
function prettyBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}

// Helper to extract columns from an index definition
function extractIndexColumns(indexDef) {
  // Extract column names from index definition string
  const match = indexDef.match(/\((.*?)\)/);
  if (!match) return [];
  
  return match[1].split(',').map(col => col.trim());
}

// Helper to find duplicate indexes
function findDuplicateIndexes(indexes) {
  const duplicateSets = [];
  const columnSets = new Map();
  
  for (const idx of indexes) {
    // Skip primary key indexes
    if (idx.name.includes('_pkey')) continue;
    
    // Create a key from sorted columns
    const columnsKey = [...idx.columns].sort().join(',');
    
    if (!columnSets.has(columnsKey)) {
      columnSets.set(columnsKey, []);
    }
    
    columnSets.get(columnsKey).push(idx);
  }
  
  // Find sets with more than one index
  for (const [columnsKey, idxSet] of columnSets.entries()) {
    if (idxSet.length > 1) {
      duplicateSets.push(idxSet);
    }
  }
  
  return duplicateSets;
}

// Helper function to get colored text based on health status
function getHealthColor(health) {
  switch (health) {
    case 'Excellent':
    case 'Good':
      return chalk.green;
    case 'Satisfactory':
      return chalk.blue;
    case 'Needs Improvement':
      return chalk.yellow;
    case 'Poor':
    case 'Critical':
      return chalk.red;
    default:
      return chalk.white;
  }
}

// Execute the main function
validateSecuritySchema()
  .then(() => {
    console.log(chalk.green('Script completed successfully'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
  });