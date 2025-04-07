#!/bin/bash
# Database Connectivity Test Script
# This script checks if the database connection is working properly

# Exit on error
set -e

echo "=== Database Connection Test ==="
echo "Timestamp: $(date)"

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "DATABASE_URL format check: ${DATABASE_URL:0:25}..."

# Check PostgreSQL client installation
if ! which psql > /dev/null; then
    echo "ERROR: PostgreSQL client not found. Please install it with: apt-get install postgresql-client"
    exit 1
fi

echo "PostgreSQL client found: $(which psql)"

# Create temp file for output
TMP_OUTPUT=$(mktemp)

echo "Testing connection..."

# Special handling for Neon serverless PostgreSQL
if [[ "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "Detected Neon serverless PostgreSQL"
    
    # Extract connection details
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT="5432" # Default PostgreSQL port
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo "Connection details:"
    echo "  Host:     $DB_HOST"
    echo "  Database: $DB_NAME"
    echo "  User:     $DB_USER"
    echo "  Port:     $DB_PORT"
    
    # Set environment variable for psql
    export PGPASSWORD="$DB_PASS"
    
    # Test connection with a simple query with timeout
    if timeout 10 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT current_timestamp as connection_time, current_database() as database, version() as pg_version;" > "$TMP_OUTPUT" 2>&1; then
        echo "✅ Connection successful!"
        echo "Database information:"
        cat "$TMP_OUTPUT"
        
        # Get basic database stats
        echo "Database size information:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"
        
        # List tables
        echo "Tables in database:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_schema, table_name;"
    else
        echo "❌ Connection failed!"
        echo "Error details:"
        cat "$TMP_OUTPUT"
        exit 1
    fi
else
    # Standard PostgreSQL connection
    echo "Using standard PostgreSQL connection"
    
    # Test connection with a simple query
    if psql "$DATABASE_URL" -c "SELECT current_timestamp as connection_time, current_database() as database, version() as pg_version;" > "$TMP_OUTPUT" 2>&1; then
        echo "✅ Connection successful!"
        echo "Database information:"
        cat "$TMP_OUTPUT"
        
        # Get basic database stats
        echo "Database size information:"
        psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"
        
        # List tables
        echo "Tables in database:"
        psql "$DATABASE_URL" -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_schema, table_name;"
    else
        echo "❌ Connection failed!"
        echo "Error details:"
        cat "$TMP_OUTPUT"
        exit 1
    fi
fi

# Clean up
rm -f "$TMP_OUTPUT"

echo "=== Connection test completed ==="

exit 0