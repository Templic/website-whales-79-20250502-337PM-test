/**
 * Setup Security Database Script
 * 
 * This script initializes the database schema and tables for the
 * security system, including rule caching, tables, and indexes.
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Main function
async function setupSecurityDatabase() {
  const client = await pool.connect();
  console.log(chalk.blue('Connected to database'));
  
  try {
    // Start transaction
    await client.query('BEGIN');
    console.log(chalk.blue('Starting transaction'));
    
    // Create enums
    console.log(chalk.blue('Creating enums...'));
    
    // Rule type enum
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rule_type') THEN
          CREATE TYPE rule_type AS ENUM (
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
          CREATE TYPE rule_status AS ENUM (
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
          CREATE TYPE rule_dependency_type AS ENUM (
            'required',
            'optional',
            'conflicts'
          );
        END IF;
      END$$;
    `);
    
    // Create security_rules table
    console.log(chalk.blue('Creating security_rules table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_rules (
        id VARCHAR(255) PRIMARY KEY,
        type rule_type NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        pattern TEXT NOT NULL,
        status rule_status NOT NULL DEFAULT 'active',
        priority INTEGER NOT NULL DEFAULT 0,
        conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
        actions JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        version INTEGER NOT NULL DEFAULT 1
      );
    `);
    
    // Create rule_dependencies table
    console.log(chalk.blue('Creating rule_dependencies table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS rule_dependencies (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(255) NOT NULL,
        depends_on_rule_id VARCHAR(255) NOT NULL,
        dependency_type rule_dependency_type NOT NULL DEFAULT 'required',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT rule_dependencies_rule_id_fk FOREIGN KEY (rule_id)
          REFERENCES security_rules(id) ON DELETE CASCADE,
        CONSTRAINT rule_dependencies_depends_on_rule_id_fk FOREIGN KEY (depends_on_rule_id)
          REFERENCES security_rules(id) ON DELETE CASCADE,
        CONSTRAINT rule_dependencies_unique UNIQUE (rule_id, depends_on_rule_id)
      );
    `);
    
    // Create indexes
    console.log(chalk.blue('Creating indexes...'));
    await client.query(`
      CREATE INDEX IF NOT EXISTS security_rules_type_idx ON security_rules (type);
      CREATE INDEX IF NOT EXISTS security_rules_status_idx ON security_rules (status);
      CREATE INDEX IF NOT EXISTS security_rules_updated_at_idx ON security_rules (updated_at);
      CREATE INDEX IF NOT EXISTS security_rules_priority_idx ON security_rules (priority);
      CREATE INDEX IF NOT EXISTS rule_dependencies_rule_id_idx ON rule_dependencies (rule_id);
      CREATE INDEX IF NOT EXISTS rule_dependencies_depends_on_rule_id_idx ON rule_dependencies (depends_on_rule_id);
    `);
    
    // Create a function to update the updated_at timestamp
    console.log(chalk.blue('Creating update_timestamp function...'));
    await client.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        NEW.version = OLD.version + 1;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create a trigger to update the timestamp automatically
    console.log(chalk.blue('Creating update_security_rules_timestamp trigger...'));
    await client.query(`
      DROP TRIGGER IF EXISTS update_security_rules_timestamp ON security_rules;
      CREATE TRIGGER update_security_rules_timestamp
      BEFORE UPDATE ON security_rules
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `);
    
    // Create a view for active rules
    console.log(chalk.blue('Creating active_security_rules view...'));
    await client.query(`
      CREATE OR REPLACE VIEW active_security_rules AS
      SELECT * FROM security_rules WHERE status = 'active';
    `);
    
    // Create security_events table (used for batch processing)
    console.log(chalk.blue('Creating security_events table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        source VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        description TEXT,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );
      
      CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events (type);
      CREATE INDEX IF NOT EXISTS security_events_source_idx ON security_events (source);
      CREATE INDEX IF NOT EXISTS security_events_severity_idx ON security_events (severity);
      CREATE INDEX IF NOT EXISTS security_events_processed_idx ON security_events (processed);
      CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON security_events (created_at);
    `);
    
    // Create materialized view for event statistics
    console.log(chalk.blue('Creating security_events_stats materialized view...'));
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS security_events_stats AS
      SELECT 
        date_trunc('day', created_at) as day,
        type,
        severity,
        source,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE processed = TRUE) as processed_count
      FROM 
        security_events
      GROUP BY 
        date_trunc('day', created_at),
        type,
        severity,
        source;
        
      CREATE UNIQUE INDEX IF NOT EXISTS security_events_stats_idx 
      ON security_events_stats (day, type, severity, source);
    `);
    
    // Insert some sample rules if there are none
    const { rows: existingRules } = await client.query(`
      SELECT COUNT(*) as count FROM security_rules;
    `);
    
    if (parseInt(existingRules[0].count) === 0) {
      console.log(chalk.blue('Inserting sample security rules...'));
      
      // Sample rule 1: Rate limiting
      await client.query(`
        INSERT INTO security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata
        ) VALUES (
          'rate-limit-api', 'rate_limit', 'API Rate Limit', 
          'Limits the number of API requests from a single IP', 
          'regex:/api/.*', 'active', 10,
          '{"maxRequests": 100, "timeWindow": 60, "requiredContextKeys": ["request.ip"]}',
          '{"block": {"message": "Too many requests"}}',
          '{"category": "api-security"}'
        );
      `);
      
      // Sample rule 2: Input validation
      await client.query(`
        INSERT INTO security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata
        ) VALUES (
          'validate-user-input', 'input_validation', 'User Input Validation', 
          'Validates user input to prevent injection attacks', 
          'regex:<script>.*</script>', 'active', 20,
          '{"requiredContextKeys": ["request.body"]}',
          '{"sanitize": {"fields": ["request.body"]}}',
          '{"category": "input-validation"}'
        );
      `);
      
      // Sample rule 3: Access control
      await client.query(`
        INSERT INTO security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata
        ) VALUES (
          'admin-access', 'access_control', 'Admin Access Control', 
          'Restricts access to admin endpoints', 
          'regex:/admin/.*', 'active', 5,
          '{"requiredRoles": ["admin"], "requiredContextKeys": ["user.role"]}',
          '{"deny": {"message": "Unauthorized access", "redirect": "/login"}}',
          '{"category": "access-control"}'
        );
      `);
      
      // Sample rule 4: Threat detection
      await client.query(`
        INSERT INTO security_rules (
          id, type, name, description, pattern, status, priority, 
          conditions, actions, metadata
        ) VALUES (
          'sql-injection', 'threat_detection', 'SQL Injection Detection', 
          'Detects SQL injection attempts', 
          'regex:.*SELECT.*FROM.*', 'active', 15,
          '{"requiredContextKeys": ["request.query"]}',
          '{"block": {"message": "Potential security threat detected"}, "log": {"level": "warn"}}',
          '{"category": "threat-detection"}'
        );
      `);
      
      // Add rule dependencies
      console.log(chalk.blue('Creating sample rule dependencies...'));
      await client.query(`
        INSERT INTO rule_dependencies (rule_id, depends_on_rule_id, dependency_type)
        VALUES ('admin-access', 'validate-user-input', 'required');
      `);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log(chalk.green('Security database setup completed successfully'));
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error(chalk.red('Error setting up security database:'), error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    console.log(chalk.blue('Database connection released'));
  }
}

// Execute the main function
setupSecurityDatabase()
  .then(() => {
    console.log(chalk.green('Script completed successfully'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
  });