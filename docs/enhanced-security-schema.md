# Enhanced Security Schema

This document outlines the enhanced security schema with additional privacy, compliance, and performance features.

## Key Improvements

### 1. Schema Isolation

Security tables are now isolated in a dedicated PostgreSQL schema (`security`) to:

- Facilitate more granular access control
- Simplify permission management
- Reduce risk of naming conflicts
- Improve organization of database objects

### 2. Privacy and Compliance Features

#### Data Categorization

Each security rule can now be categorized with:

- `data_category`: The type of data being protected
- `privacy_impact`: The privacy impact level (none, low, medium, high, critical)
- `security_classification`: Classification level (public, internal, confidential, restricted)

#### Data Anonymization

Sensitive data can be automatically anonymized using the `PrivacyUtils` module, which provides:

- Field-level privacy controls
- Multiple anonymization methods:
  - Hashing (irreversible)
  - Encryption (reversible with key)
  - Masking (partial obfuscation)
  - Truncation (shortening)
  - Pseudonymization (consistent replacement)
  - Anonymization (randomized replacement)

#### Data Retention

Built-in data retention features include:

- Configurable retention periods per data type
- Automatic expiration and anonymization of old data
- Retention policy rule to centrally manage retention settings
- Audit logging of all retention actions

### 3. Performance Optimizations

#### Table Partitioning

The `security_events` table now supports native PostgreSQL partitioning by date range, providing:

- Improved query performance for time-based queries
- Easier management of large datasets
- More efficient maintenance operations
- Automatic partition management

#### Enhanced Indexing

Additional indexes have been added for:

- Privacy impact levels
- Security classifications
- Data categories
- Evaluation performance metrics
- Audit log entity types

#### Materialized Views

New materialized views provide efficient access to:

- Security event statistics with pre-aggregated data
- Rule performance metrics with execution times and match rates
- Custom analytics data based on common query patterns

### 4. Data Integrity and Validation

#### Schema Validation Tools

A comprehensive schema validation tool ensures:

- Tables have the correct structure
- Required indexes are present
- No circular dependencies exist
- Data integrity constraints are maintained
- Privacy measures are properly implemented

#### Rule Hash Validation

Each security rule now includes a hash to validate integrity:

- Hash is generated from rule attributes
- Detects unauthorized modifications
- Supports optimistic locking
- Enables change detection and auditing

#### Automatic Audit Logging

Database triggers now automatically log all security rule changes:

- Records all create, update, and delete operations
- Stores before and after states
- Captures user and timestamp information
- Supports compliance reporting and forensic analysis

## Database Schema

### Security Rules Table

```sql
CREATE TABLE security.security_rules (
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
```

### Rule Dependencies Table

```sql
CREATE TABLE security.rule_dependencies (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(255) NOT NULL,
  depends_on_rule_id VARCHAR(255) NOT NULL,
  dependency_type rule_dependency_type NOT NULL DEFAULT 'required',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rule_dependencies_rule_id_fk FOREIGN KEY (rule_id)
    REFERENCES security.security_rules(id) ON DELETE CASCADE,
  CONSTRAINT rule_dependencies_depends_on_rule_id_fk FOREIGN KEY (depends_on_rule_id)
    REFERENCES security.security_rules(id) ON DELETE CASCADE,
  CONSTRAINT rule_dependencies_unique UNIQUE (rule_id, depends_on_rule_id)
);
```

### Security Events Table

```sql
CREATE TABLE security.security_events (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  source_id VARCHAR(255),
  severity event_severity NOT NULL DEFAULT 'medium',
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
```

### Rule Evaluations Table

```sql
CREATE TABLE security.rule_evaluations (
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
    REFERENCES security.security_rules(id) ON DELETE CASCADE,
  CONSTRAINT rule_evaluations_event_id_fk FOREIGN KEY (event_id)
    REFERENCES security.security_events(id) ON DELETE SET NULL
);
```

### Security Audit Log Table

```sql
CREATE TABLE security.security_audit_log (
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
```

## Getting Started

To set up the enhanced security schema:

1. Run the setup script:
   ```bash
   ./scripts/run-enhanced-security-setup.sh
   ```

2. Validate the schema:
   ```bash
   node scripts/validate-security-schema.js
   ```

3. Update your TypeScript models to use the enhanced schema:
   ```typescript
   import { securityRules, ruleDependencies } from 'shared/schema-security-enhanced';
   ```

4. Use the privacy utilities in your code:
   ```typescript
   import { privacyUtils, PrivacyLevel } from 'server/security/utils/PrivacyUtils';
   
   // Process an object to anonymize sensitive fields
   const safeData = privacyUtils.processObject(userData, PrivacyLevel.SENSITIVE);
   ```

## Maintenance

Regular maintenance tasks for the enhanced schema:

1. Refresh materialized views:
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY security.security_events_stats;
   REFRESH MATERIALIZED VIEW CONCURRENTLY security.rule_performance_stats;
   ```

2. Check partition usage and create new partitions as needed:
   ```sql
   SELECT tablename, pg_size_pretty(pg_relation_size('"security"."' || tablename || '"'))
   FROM pg_tables
   WHERE tablename LIKE 'security_events_%'
   ORDER BY tablename;
   ```

3. Run the schema validation tool periodically:
   ```bash
   node scripts/validate-security-schema.js
   ```

4. Verify data retention is working correctly:
   ```sql
   SELECT COUNT(*) FROM security.security_events
   WHERE created_at < NOW() - INTERVAL '90 days'
   AND (user_id IS NOT NULL OR ip_address IS NOT NULL);
   ```

## Security and Compliance Features

### Data Privacy Implementation

The enhanced schema includes several features to support privacy regulations:

1. **Data Minimization**: Only collect what's necessary
2. **Purpose Limitation**: Data categorization for clear purposes
3. **Storage Limitation**: Automatic data retention policies
4. **Security Measures**: Encryption and pseudonymization
5. **User Rights**: Support for data deletion and portability

### Audit and Compliance

Built-in audit capabilities support compliance requirements:

1. **Change Tracking**: All changes to security rules are logged
2. **Access Monitoring**: Security events record access patterns
3. **Retention Management**: Time-based data handling
4. **Activity Reporting**: Detailed reporting on rule evaluations
5. **Anomaly Detection**: Performance metrics help identify issues