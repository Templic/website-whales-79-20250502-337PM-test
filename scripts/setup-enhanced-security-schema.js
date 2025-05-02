/**
 * Enhanced Security Schema Setup Script
 * 
 * This script sets up an enhanced security schema with privacy features,
 * partitioning support, and data integrity safeguards.
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Security schema name - isolate security tables for better permissions control
const SCHEMA_NAME = 'security';

// Schema version tracking
const CURRENT_SCHEMA_VERSION = '1.0.0';

// Hash function for schema verification
function hashSchema(definition) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(definition));
  return hash.digest('hex');
}

// Main function
async function setupSecuritySchema() {
  const client = await pool.connect();
  console.log(chalk.blue('Connected to database'));
  
  try {
    // Start transaction
    await client.query('BEGIN');
    console.log(chalk.blue('Starting transaction'));
    
    // 1. Create schema if it doesn't exist
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};
    `);
    console.log(chalk.blue(`Created schema ${SCHEMA_NAME}`));
    
    // 2. Create schema_version table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.schema_version (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        schema_hash VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        applied_by VARCHAR(255) NOT NULL,
        script_name VARCHAR(255) NOT NULL,
        description TEXT,
        success BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    console.log(chalk.blue('Created schema_version table'));
    
    // 3. Check current schema version
    const { rows: versionRows } = await client.query(`
      SELECT version, schema_hash 
      FROM ${SCHEMA_NAME}.schema_version 
      ORDER BY id DESC LIMIT 1;
    `);
    
    const currentVersion = versionRows.length > 0 ? versionRows[0].version : null;
    const currentHash = versionRows.length > 0 ? versionRows[0].schema_hash : null;
    
    console.log(chalk.blue(`Current schema version: ${currentVersion || 'none'}`));
    
    // Schema definition for verification
    const schemaDefinition = {
      version: CURRENT_SCHEMA_VERSION,
      tables: [
        'security_rules',
        'rule_dependencies',
        'security_events',
        'rule_evaluations',
        'security_audit_log'
      ],
      enums: [
        'rule_type',
        'rule_status',
        'rule_dependency_type',
        'event_severity'
      ]
    };
    
    const newSchemaHash = hashSchema(schemaDefinition);
    
    // If schema already at current version and hash matches, skip setup
    if (currentVersion === CURRENT_SCHEMA_VERSION && currentHash === newSchemaHash) {
      console.log(chalk.green(`Schema already at version ${CURRENT_SCHEMA_VERSION} with matching hash. No changes needed.`));
      await client.query('COMMIT');
      return;
    }
    
    // 4. Create enums
    console.log(chalk.blue('Creating enums...'));
    
    // Rule type enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_type') THEN
          CREATE TYPE ${SCHEMA_NAME}.rule_type AS ENUM (
            'access_control',
            'rate_limit',
            'input_validation',
            'threat_detection',
            'data_protection',
            'authentication'
          );
        END IF;
      END$$;
    `);
    
    // Rule status enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_status') THEN
          CREATE TYPE ${SCHEMA_NAME}.rule_status AS ENUM (
            'active',
            'disabled',
            'pending',
            'archived'
          );
        END IF;
      END$$;
    `);
    
    // Rule dependency type enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_dependency_type') THEN
          CREATE TYPE ${SCHEMA_NAME}.rule_dependency_type AS ENUM (
            'required',
            'optional',
            'conflicts'
          );
        END IF;
      END$$;
    `);
    
    // Event severity enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_severity') THEN
          CREATE TYPE ${SCHEMA_NAME}.event_severity AS ENUM (
            'low',
            'medium',
            'high',
            'critical'
          );
        END IF;
      END$$;
    `);
    
    // 5. Create security_rules table
    console.log(chalk.blue('Creating security_rules table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.security_rules (
        id VARCHAR(255) PRIMARY KEY,
        type ${SCHEMA_NAME}.rule_type NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        pattern TEXT NOT NULL,
        status ${SCHEMA_NAME}.rule_status NOT NULL DEFAULT 'active',
        priority INTEGER NOT NULL DEFAULT 0,
        conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
        actions JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        data_category VARCHAR(100),
        privacy_impact VARCHAR(50),
        security_classification VARCHAR(50) DEFAULT 'normal',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_evaluated_at TIMESTAMPTZ,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        version INTEGER NOT NULL DEFAULT 1,
        hash VARCHAR(64) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    // 6. Create rule_dependencies table
    console.log(chalk.blue('Creating rule_dependencies table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.rule_dependencies (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        depends_on_rule_id VARCHAR(255) NOT NULL,
        dependency_type ${SCHEMA_NAME}.rule_dependency_type NOT NULL DEFAULT 'required',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT rule_dependencies_rule_id_fk FOREIGN KEY (rule_id)
          REFERENCES ${SCHEMA_NAME}.security_rules(id) ON DELETE CASCADE,
        CONSTRAINT rule_dependencies_depends_on_rule_id_fk FOREIGN KEY (depends_on_rule_id)
          REFERENCES ${SCHEMA_NAME}.security_rules(id) ON DELETE CASCADE,
        CONSTRAINT rule_dependencies_unique UNIQUE (rule_id, depends_on_rule_id)
      );
    `);
    
    // 7. Create security_events table with partitioning support
    console.log(chalk.blue('Creating security_events table...'));
    
    // Check if PostgreSQL version supports native partitioning
    const { rows: pgVersion } = await client.query(`SELECT current_setting('server_version_num') AS version`);
    const supportsPartitioning = parseInt(pgVersion[0].version) >= 100000; // 10.0 or higher
    
    if (supportsPartitioning) {
      console.log(chalk.blue('PostgreSQL version supports native partitioning'));
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.security_events (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          source VARCHAR(100) NOT NULL,
          source_id VARCHAR(255),
          severity ${SCHEMA_NAME}.event_severity NOT NULL DEFAULT 'medium',
          description TEXT,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          user_id VARCHAR(255),
          ip_address VARCHAR(45),
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          processed_at TIMESTAMPTZ,
          result VARCHAR(50),
          response_time INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        ) PARTITION BY RANGE (created_at);
      `);
      
      // Create partitions for the next 3 months
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const startDate = new Date(now);
        startDate.setMonth(now.getMonth() + i);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        
        const partitionName = `security_events_${startDate.getFullYear()}_${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Create partition
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.${partitionName}
          PARTITION OF ${SCHEMA_NAME}.security_events
          FOR VALUES FROM ('${startDate.toISOString()}') TO ('${endDate.toISOString()}');
        `);
        
        console.log(chalk.blue(`Created partition ${partitionName}`));
      }
    } else {
      console.log(chalk.yellow('PostgreSQL version does not support native partitioning. Creating regular table.'));
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.security_events (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          source VARCHAR(100) NOT NULL,
          source_id VARCHAR(255),
          severity ${SCHEMA_NAME}.event_severity NOT NULL DEFAULT 'medium',
          description TEXT,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          user_id VARCHAR(255),
          ip_address VARCHAR(45),
          processed BOOLEAN NOT NULL DEFAULT FALSE,
          processed_at TIMESTAMPTZ,
          result VARCHAR(50),
          response_time INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    }
    
    // 8. Create rule_evaluations table
    console.log(chalk.blue('Creating rule_evaluations table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.rule_evaluations (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        context_type VARCHAR(50) NOT NULL,
        result BOOLEAN NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        evaluation_context JSONB,
        matched_conditions JSONB,
        user_id VARCHAR(255),
        ip_address VARCHAR(45),
        event_id INTEGER,
        CONSTRAINT rule_evaluations_rule_id_fk FOREIGN KEY (rule_id)
          REFERENCES ${SCHEMA_NAME}.security_rules(id) ON DELETE CASCADE,
        CONSTRAINT rule_evaluations_event_id_fk FOREIGN KEY (event_id)
          REFERENCES ${SCHEMA_NAME}.security_events(id) ON DELETE SET NULL
      );
    `);
    
    // 9. Create security_audit_log table
    console.log(chalk.blue('Creating security_audit_log table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SCHEMA_NAME}.security_audit_log (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        previous_state JSONB,
        new_state JSONB,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        ip_address VARCHAR(45)
      );
    `);
    
    // 10. Create indexes
    console.log(chalk.blue('Creating indexes...'));
    
    // Security rules indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS security_rules_type_idx ON ${SCHEMA_NAME}.security_rules (type);
      CREATE INDEX IF NOT EXISTS security_rules_status_idx ON ${SCHEMA_NAME}.security_rules (status);
      CREATE INDEX IF NOT EXISTS security_rules_updated_at_idx ON ${SCHEMA_NAME}.security_rules (updated_at);
      CREATE INDEX IF NOT EXISTS security_rules_priority_idx ON ${SCHEMA_NAME}.security_rules (priority);
      CREATE INDEX IF NOT EXISTS security_rules_enabled_idx ON ${SCHEMA_NAME}.security_rules (enabled);
      CREATE INDEX IF NOT EXISTS security_rules_hash_idx ON ${SCHEMA_NAME}.security_rules (hash);
      CREATE INDEX IF NOT EXISTS security_rules_data_category_idx ON ${SCHEMA_NAME}.security_rules (data_category);
      CREATE INDEX IF NOT EXISTS security_rules_privacy_impact_idx ON ${SCHEMA_NAME}.security_rules (privacy_impact);
      CREATE INDEX IF NOT EXISTS security_rules_classification_idx ON ${SCHEMA_NAME}.security_rules (security_classification);
    `);
    
    // Rule dependencies indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS rule_dependencies_rule_id_idx ON ${SCHEMA_NAME}.rule_dependencies (rule_id);
      CREATE INDEX IF NOT EXISTS rule_dependencies_depends_on_rule_id_idx ON ${SCHEMA_NAME}.rule_dependencies (depends_on_rule_id);
    `);
    
    // Security events indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS security_events_type_idx ON ${SCHEMA_NAME}.security_events (type);
      CREATE INDEX IF NOT EXISTS security_events_source_idx ON ${SCHEMA_NAME}.security_events (source);
      CREATE INDEX IF NOT EXISTS security_events_severity_idx ON ${SCHEMA_NAME}.security_events (severity);
      CREATE INDEX IF NOT EXISTS security_events_processed_idx ON ${SCHEMA_NAME}.security_events (processed);
      CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON ${SCHEMA_NAME}.security_events (created_at);
      CREATE INDEX IF NOT EXISTS security_events_user_id_idx ON ${SCHEMA_NAME}.security_events (user_id);
    `);
    
    // Rule evaluations indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS rule_evaluations_rule_id_idx ON ${SCHEMA_NAME}.rule_evaluations (rule_id);
      CREATE INDEX IF NOT EXISTS rule_evaluations_evaluated_at_idx ON ${SCHEMA_NAME}.rule_evaluations (evaluated_at);
      CREATE INDEX IF NOT EXISTS rule_evaluations_context_type_idx ON ${SCHEMA_NAME}.rule_evaluations (context_type);
      CREATE INDEX IF NOT EXISTS rule_evaluations_result_idx ON ${SCHEMA_NAME}.rule_evaluations (result);
    `);
    
    // Audit log indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS security_audit_log_entity_type_idx ON ${SCHEMA_NAME}.security_audit_log (entity_type);
      CREATE INDEX IF NOT EXISTS security_audit_log_entity_id_idx ON ${SCHEMA_NAME}.security_audit_log (entity_id);
      CREATE INDEX IF NOT EXISTS security_audit_log_timestamp_idx ON ${SCHEMA_NAME}.security_audit_log (timestamp);
      CREATE INDEX IF NOT EXISTS security_audit_log_user_id_idx ON ${SCHEMA_NAME}.security_audit_log (user_id);
    `);
    
    // 11. Create update trigger for security_rules
    console.log(chalk.blue('Creating triggers...'));
    
    // Function to update timestamp and version
    await client.query(`
      CREATE OR REPLACE FUNCTION ${SCHEMA_NAME}.update_timestamp_and_version()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Timestamp trigger for security_rules
    await client.query(`
      DROP TRIGGER IF EXISTS update_security_rules_timestamp ON ${SCHEMA_NAME}.security_rules;
      CREATE TRIGGER update_security_rules_timestamp
      BEFORE UPDATE ON ${SCHEMA_NAME}.security_rules
      FOR EACH ROW
      EXECUTE FUNCTION ${SCHEMA_NAME}.update_timestamp_and_version();
    `);
    
    // Timestamp trigger for security_events
    await client.query(`
      DROP TRIGGER IF EXISTS update_security_events_timestamp ON ${SCHEMA_NAME}.security_events;
      CREATE TRIGGER update_security_events_timestamp
      BEFORE UPDATE ON ${SCHEMA_NAME}.security_events
      FOR EACH ROW
      EXECUTE FUNCTION ${SCHEMA_NAME}.update_timestamp_and_version();
    `);
    
    // 12. Create audit logging function and trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION ${SCHEMA_NAME}.log_security_rule_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO ${SCHEMA_NAME}.security_audit_log(
            entity_type, entity_id, action, 
            previous_state, new_state, metadata
          ) VALUES (
            'security_rule', NEW.id, 'create', 
            NULL, row_to_json(NEW), '{"trigger": "automatic"}'::jsonb
          );
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO ${SCHEMA_NAME}.security_audit_log(
            entity_type, entity_id, action, 
            previous_state, new_state, metadata
          ) VALUES (
            'security_rule', NEW.id, 'update', 
            row_to_json(OLD), row_to_json(NEW), '{"trigger": "automatic"}'::jsonb
          );
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO ${SCHEMA_NAME}.security_audit_log(
            entity_type, entity_id, action, 
            previous_state, new_state, metadata
          ) VALUES (
            'security_rule', OLD.id, 'delete', 
            row_to_json(OLD), NULL, '{"trigger": "automatic"}'::jsonb
          );
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create audit trigger for security_rules
    await client.query(`
      DROP TRIGGER IF EXISTS audit_security_rules ON ${SCHEMA_NAME}.security_rules;
      CREATE TRIGGER audit_security_rules
      AFTER INSERT OR UPDATE OR DELETE ON ${SCHEMA_NAME}.security_rules
      FOR EACH ROW
      EXECUTE FUNCTION ${SCHEMA_NAME}.log_security_rule_changes();
    `);
    
    // 13. Create data retention function and trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION ${SCHEMA_NAME}.expire_old_security_events()
      RETURNS TRIGGER AS $$
      DECLARE
        retention_days INTEGER := 90; -- Default 90 days
        cutoff_date TIMESTAMPTZ;
      BEGIN
        -- Get retention days from settings if available
        BEGIN
          SELECT COALESCE(
            (SELECT (metadata->>'retention_days')::integer 
             FROM ${SCHEMA_NAME}.security_rules 
             WHERE id = 'retention-policy' 
             LIMIT 1),
            90
          ) INTO retention_days;
        EXCEPTION WHEN OTHERS THEN
          retention_days := 90; -- Fallback
        END;
        
        cutoff_date := NOW() - (retention_days || ' days')::interval;
        
        -- Anonymize user info for old events but keep the event itself
        UPDATE ${SCHEMA_NAME}.security_events
        SET 
          user_id = NULL,
          ip_address = NULL,
          data = jsonb_strip_nulls(data - 'user_info' - 'sensitive_data'),
          updated_at = NOW()
        WHERE 
          created_at < cutoff_date AND
          (user_id IS NOT NULL OR ip_address IS NOT NULL OR 
           data ? 'user_info' OR data ? 'sensitive_data');
           
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create a schedule trigger for data retention (daily)
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pg_cron;
      
      SELECT cron.schedule('expire-security-events', '0 0 * * *', 
        $$SELECT ${SCHEMA_NAME}.expire_old_security_events()$$
      );
    `).catch(err => {
      console.log(chalk.yellow(`Could not create scheduled job for data retention: ${err.message}`));
      console.log(chalk.yellow(`You may need to run data retention manually or use a separate scheduler.`));
    });
    
    // 14. Create views
    console.log(chalk.blue('Creating views...'));
    
    // Active rules view
    await client.query(`
      CREATE OR REPLACE VIEW ${SCHEMA_NAME}.active_security_rules AS
      SELECT * FROM ${SCHEMA_NAME}.security_rules 
      WHERE status = 'active' AND enabled = TRUE;
    `);
    
    // Security events summary view
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${SCHEMA_NAME}.security_events_stats AS
      SELECT 
        date_trunc('day', created_at) as day,
        type,
        severity,
        source,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE processed = TRUE) as processed_count,
        AVG(response_time) as avg_response_time
      FROM 
        ${SCHEMA_NAME}.security_events
      GROUP BY 
        date_trunc('day', created_at),
        type,
        severity,
        source;
        
      CREATE UNIQUE INDEX IF NOT EXISTS security_events_stats_idx 
      ON ${SCHEMA_NAME}.security_events_stats (day, type, severity, source);
    `);
    
    // Rule performance view
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${SCHEMA_NAME}.rule_performance_stats AS
      SELECT 
        re.rule_id,
        sr.name as rule_name,
        sr.type as rule_type,
        COUNT(*) as evaluation_count,
        AVG(re.execution_time_ms) as avg_execution_time_ms,
        SUM(CASE WHEN re.result THEN 1 ELSE 0 END) as match_count,
        (SUM(CASE WHEN re.result THEN 1 ELSE 0 END)::float / COUNT(*)) as match_rate
      FROM 
        ${SCHEMA_NAME}.rule_evaluations re
        JOIN ${SCHEMA_NAME}.security_rules sr ON re.rule_id = sr.id
      WHERE 
        re.evaluated_at > NOW() - INTERVAL '30 days'
      GROUP BY 
        re.rule_id, sr.name, sr.type;
        
      CREATE UNIQUE INDEX IF NOT EXISTS rule_performance_stats_idx 
      ON ${SCHEMA_NAME}.rule_performance_stats (rule_id);
    `);
    
    // 15. Insert sample rules if there are none
    const { rows: existingRules } = await client.query(`
      SELECT COUNT(*) as count FROM ${SCHEMA_NAME}.security_rules;
    `);
    
    if (parseInt(existingRules[0].count) === 0) {
      console.log(chalk.blue('Inserting sample security rules...'));
      
      // Generate rule hash
      const generateRuleHash = (rule) => {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({
          id: rule.id,
          type: rule.type,
          pattern: rule.pattern,
          conditions: rule.conditions,
          actions: rule.actions
        }));
        return hash.digest('hex');
      };
      
      // Sample rule 1: Rate limiting
      const rateLimitRule = {
        id: 'rate-limit-api',
        type: 'rate_limit',
        name: 'API Rate Limit',
        description: 'Limits the number of API requests from a single IP',
        pattern: 'regex:/api/.*',
        conditions: {
          maxRequests: 100,
          timeWindow: 60,
          requiredContextKeys: ['request.ip']
        },
        actions: {
          block: {
            message: 'Too many requests'
          }
        },
        metadata: {
          category: 'api-security'
        },
        data_category: 'request-rate',
        privacy_impact: 'low',
        security_classification: 'internal'
      };
      
      rateLimitRule.hash = generateRuleHash(rateLimitRule);
      
      await client.query(`
        INSERT INTO ${SCHEMA_NAME}.security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata, data_category, privacy_impact,
          security_classification, hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        );
      `, [
        rateLimitRule.id,
        rateLimitRule.type,
        rateLimitRule.name,
        rateLimitRule.description,
        rateLimitRule.pattern,
        'active',
        10,
        JSON.stringify(rateLimitRule.conditions),
        JSON.stringify(rateLimitRule.actions),
        JSON.stringify(rateLimitRule.metadata),
        rateLimitRule.data_category,
        rateLimitRule.privacy_impact,
        rateLimitRule.security_classification,
        rateLimitRule.hash
      ]);
      
      // Sample rule 2: Input validation
      const validationRule = {
        id: 'validate-user-input',
        type: 'input_validation',
        name: 'User Input Validation',
        description: 'Validates user input to prevent injection attacks',
        pattern: 'regex:<script>.*</script>',
        conditions: {
          requiredContextKeys: ['request.body']
        },
        actions: {
          sanitize: {
            fields: ['request.body']
          }
        },
        metadata: {
          category: 'input-validation'
        },
        data_category: 'user-input',
        privacy_impact: 'medium',
        security_classification: 'confidential'
      };
      
      validationRule.hash = generateRuleHash(validationRule);
      
      await client.query(`
        INSERT INTO ${SCHEMA_NAME}.security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata, data_category, privacy_impact,
          security_classification, hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        );
      `, [
        validationRule.id,
        validationRule.type,
        validationRule.name,
        validationRule.description,
        validationRule.pattern,
        'active',
        20,
        JSON.stringify(validationRule.conditions),
        JSON.stringify(validationRule.actions),
        JSON.stringify(validationRule.metadata),
        validationRule.data_category,
        validationRule.privacy_impact,
        validationRule.security_classification,
        validationRule.hash
      ]);
      
      // Sample rule 3: Access control
      const accessRule = {
        id: 'admin-access',
        type: 'access_control',
        name: 'Admin Access Control',
        description: 'Restricts access to admin endpoints',
        pattern: 'regex:/admin/.*',
        conditions: {
          requiredRoles: ['admin'],
          requiredContextKeys: ['user.role']
        },
        actions: {
          deny: {
            message: 'Unauthorized access',
            redirect: '/login'
          }
        },
        metadata: {
          category: 'access-control'
        },
        data_category: 'authorization',
        privacy_impact: 'high',
        security_classification: 'restricted'
      };
      
      accessRule.hash = generateRuleHash(accessRule);
      
      await client.query(`
        INSERT INTO ${SCHEMA_NAME}.security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata, data_category, privacy_impact,
          security_classification, hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        );
      `, [
        accessRule.id,
        accessRule.type,
        accessRule.name,
        accessRule.description,
        accessRule.pattern,
        'active',
        5,
        JSON.stringify(accessRule.conditions),
        JSON.stringify(accessRule.actions),
        JSON.stringify(accessRule.metadata),
        accessRule.data_category,
        accessRule.privacy_impact,
        accessRule.security_classification,
        accessRule.hash
      ]);
      
      // Add rule dependency
      await client.query(`
        INSERT INTO ${SCHEMA_NAME}.rule_dependencies (
          rule_id, depends_on_rule_id, dependency_type
        ) VALUES (
          'admin-access', 'validate-user-input', 'required'
        );
      `);
    }
    
    // 16. Create a retention policy rule
    const { rows: retentionRule } = await client.query(`
      SELECT COUNT(*) as count FROM ${SCHEMA_NAME}.security_rules
      WHERE id = 'retention-policy';
    `);
    
    if (parseInt(retentionRule[0].count) === 0) {
      console.log(chalk.blue('Creating retention policy rule...'));
      
      const retentionRule = {
        id: 'retention-policy',
        type: 'data_protection',
        name: 'Data Retention Policy',
        description: 'Controls how long security data is retained',
        pattern: 'script:return true;', // Always matches
        conditions: {},
        actions: {},
        metadata: {
          retention_days: 90, // Default 90 days
          logs_retention_days: 30, // Audit logs retained for 30 days
          events_retention_days: 90, // Security events retained for 90 days
          eval_retention_days: 30 // Rule evaluations retained for 30 days
        },
        data_category: 'retention-policy',
        privacy_impact: 'high',
        security_classification: 'internal'
      };
      
      retentionRule.hash = hashSchema(retentionRule);
      
      await client.query(`
        INSERT INTO ${SCHEMA_NAME}.security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata, data_category, privacy_impact,
          security_classification, hash
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        );
      `, [
        retentionRule.id,
        retentionRule.type,
        retentionRule.name,
        retentionRule.description,
        retentionRule.pattern,
        'active',
        1, // High priority
        JSON.stringify(retentionRule.conditions),
        JSON.stringify(retentionRule.actions),
        JSON.stringify(retentionRule.metadata),
        retentionRule.data_category,
        retentionRule.privacy_impact,
        retentionRule.security_classification,
        retentionRule.hash
      ]);
    }
    
    // 17. Record schema version
    await client.query(`
      INSERT INTO ${SCHEMA_NAME}.schema_version (
        version, schema_hash, applied_by, script_name, description
      ) VALUES (
        $1, $2, $3, $4, $5
      );
    `, [
      CURRENT_SCHEMA_VERSION,
      newSchemaHash,
      'setup-script',
      'setup-enhanced-security-schema.js',
      'Initial setup of enhanced security schema with privacy features'
    ]);
    
    // 18. Commit transaction
    await client.query('COMMIT');
    console.log(chalk.green('Schema setup committed successfully'));
    
    // 19. Create database extension for content encryption if not exists
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      console.log(chalk.green('pgcrypto extension installed for encryption support'));
    } catch (err) {
      console.log(chalk.yellow(`Warning: Could not create pgcrypto extension: ${err.message}`));
      console.log(chalk.yellow('Some encryption features may not be available'));
    }
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error(chalk.red('Error setting up security schema:'), error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    console.log(chalk.blue('Database connection released'));
  }
}

// Execute the main function
setupSecuritySchema()
  .then(() => {
    console.log(chalk.green('Script completed successfully'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
  });