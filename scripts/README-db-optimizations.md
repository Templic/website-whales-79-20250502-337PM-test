# Security Database Optimizations

This folder contains scripts for optimizing the security-related database tables in the application. These optimizations are designed to significantly improve query performance, especially for security monitoring dashboards and analytics.

## Scripts Overview

### 1. optimize-security-tables.js

This script adds essential indexes to security-related tables to improve query performance:

- Time-based indexes for historical queries
- Indexes for commonly filtered columns (severity, threat_type, etc.)
- Composite indexes for common filter combinations

**Benefits:**
- Faster historical queries on security data
- Improved performance for security event filtering
- More efficient threat monitoring
- Better overall query performance for security analytics

**Usage:**
```
node scripts/optimize-security-tables.js
```

### 2. implement-partitioning.js

This script implements table partitioning for the `security_threats` table to improve query performance for time-based queries:

- Partitions the table by time range (past, current quarters, future)
- Adds partition maintenance functions
- Creates backup of existing data and restores it to partitioned table
- Re-creates indexes on the partitioned table

**Benefits:**
- Significantly faster historical queries
- More efficient table maintenance
- Better pruning of old data
- Reduced index size

**Usage:**
```
node scripts/implement-partitioning.js
```

### 3. create-security-materialized-views.js

This script creates materialized views for common security analytics queries:

- Daily threat statistics view
- Daily security events view
- Top threat sources view
- Security activity by user view
- Refresh function for all views

**Benefits:**
- Significantly faster dashboard loading
- Reduced database load for common analytics
- Pre-aggregated data for historical analysis
- More responsive security interfaces

**Usage:**
```
node scripts/create-security-materialized-views.js
```

### 4. security-db-maintenance.js

This script performs regular maintenance tasks on security database tables:

- Refreshes materialized views
- Analyzes tables to update statistics
- Creates future partitions as needed
- Archives old data based on retention policy
- Analyzes query performance

**Benefits:**
- Keeps the database running optimally
- Provides insights into query performance
- Automates routine maintenance tasks
- Implements data retention policies

**Usage:**
```
node scripts/security-db-maintenance.js
```

## Running All Optimizations

To apply all database optimizations, you can use the npm script `db:security:optimize`:

```
npm run db:security:optimize
```

This will run all optimization scripts in the correct order.

## Scheduled Maintenance

For optimal performance, it's recommended to run the maintenance script on a regular schedule:

```
npm run db:security:maintain
```

This should ideally be run daily during off-peak hours using a scheduler like cron.

## Troubleshooting

Each script creates detailed log files in the `logs/` directory that can be used for troubleshooting.

## Rollback

In case of issues, a backup of the original tables is created before major operations like partitioning. To restore from backup:

1. Connect to the database
2. Run: `DROP TABLE security_threats;`
3. Run: `ALTER TABLE security_threats_backup RENAME TO security_threats;`

## Performance Monitoring

After applying these optimizations, you should monitor database performance using:

1. Database metrics in the admin dashboard
2. The maintenance logs in `logs/` directory
3. Query execution times in the database logs

You should see significant improvement in query performance, especially for:
- Security dashboard loading times
- Historical threat analysis
- User security activity reports
- Trend analysis and reports