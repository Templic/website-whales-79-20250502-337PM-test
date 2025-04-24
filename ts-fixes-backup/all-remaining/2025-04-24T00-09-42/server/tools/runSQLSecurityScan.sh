#!/bin/bash

# SQL Injection Security Scan Script
# This script runs the SQL injection vulnerability detection and remediation process

echo "┌──────────────────────────────────────────────────────┐"
echo "│           SQL INJECTION SECURITY SCAN                │"
echo "└──────────────────────────────────────────────────────┘"

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Check if --fix flag is provided
FIX_FLAG=""
for arg in "$@"
do
  if [ "$arg" == "--fix" ] || [ "$arg" == "-f" ]; then
    FIX_FLAG="--fix"
    echo "Fix mode enabled: Will apply automatic fixes"
  fi
done

# Run the SQL injection scan and fix process
echo "Running SQL injection detection and remediation..."
npx tsx server/tools/fixSqlInjectionVulnerabilities.ts $FIX_FLAG

# Check if the scan was successful
if [ $? -eq 0 ]; then
    echo "✅ SQL injection security scan completed successfully"
else
    echo "❌ SQL injection security scan failed. Check the logs for details."
    exit 1
fi

echo ""
echo "SQL Injection Security Scan Results:"
echo "------------------------------------"
echo "Check the reports directory for detailed scan results:"
echo "  - reports/sql_injection_detection.txt: Detected vulnerabilities"
echo "  - reports/sql_injection_fix_dry_run.txt: Proposed fixes"
if [ "$FIX_FLAG" == "--fix" ]; then
    echo "  - reports/sql_injection_fix_applied.txt: Applied fixes"
fi
echo ""
echo "To apply security fixes manually, use the secure database APIs:"
echo "  import { createSecureDatabase } from './security/dbSecurityIntegration';"
echo "  const db = createSecureDatabase(pool);"
echo "  // Use db.query, db.select, db.insert, etc. for secure database operations"