/**
 * Create Security Rule Tables Script
 * 
 * This script creates the necessary tables for the security rule caching system.
 */

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const chalk = require('chalk');

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Main function
async function createSecurityRuleTables() {
  const client = await pool.connect();
  console.log(chalk.blue('Connected to database'));
  
  try {
    // Start transaction
    await client.query('BEGIN');
    console.log(chalk.blue('Starting transaction'));
    
    // Create security_rules table
    console.log(chalk.blue('Creating security_rules table...'));
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_rules (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        pattern TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
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
        dependency_type VARCHAR(50) NOT NULL DEFAULT 'required',
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
    console.log(chalk.green('Security rule tables created successfully'));
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error(chalk.red('Error creating security rule tables:'), error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    console.log(chalk.blue('Database connection released'));
  }
}

// Execute the main function
createSecurityRuleTables()
  .then(() => {
    console.log(chalk.green('Script completed successfully'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
  });