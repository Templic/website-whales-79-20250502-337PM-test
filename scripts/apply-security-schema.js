// Script to apply security schema changes directly to database

import { neonConfig, Pool } from '@neondatabase/serverless';

// Configure neon to work with WebSocket
neonConfig.fetchConnectionCache = true;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log("Applying security schema migrations...");
  try {
    // Apply migration directly
    // Note: In a production environment, you would use a more structured migration approach
    await pool.query(`
      -- Create security_threats table if it doesn't exist
      CREATE TABLE IF NOT EXISTS security_threats (
        id SERIAL PRIMARY KEY,
        threat_id TEXT NOT NULL UNIQUE,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        description TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        user_id TEXT REFERENCES users(id),
        request_path TEXT,
        request_method TEXT,
        evidence JSONB,
        rule_id TEXT NOT NULL,
        action_taken JSONB,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_by TEXT REFERENCES users(id),
        resolved_at TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE
      );

      -- Create detection_rules table if it doesn't exist
      CREATE TABLE IF NOT EXISTS detection_rules (
        id SERIAL PRIMARY KEY,
        rule_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        pattern TEXT,
        threshold INTEGER,
        time_window INTEGER,
        auto_block BOOLEAN DEFAULT FALSE,
        auto_notify BOOLEAN DEFAULT FALSE,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create blocked_ips table if it doesn't exist
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip TEXT NOT NULL UNIQUE,
        blocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        blocked_by TEXT REFERENCES users(id),
        reason TEXT,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    console.log("Security schema migration completed successfully!");
  } catch (error) {
    console.error("Error applying security schema migration:", error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

// Add ESM export
export { };