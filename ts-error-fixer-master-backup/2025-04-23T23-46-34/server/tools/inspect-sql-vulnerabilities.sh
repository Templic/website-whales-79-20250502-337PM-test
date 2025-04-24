#!/bin/bash

# SQL Injection Vulnerability Inspector Script
# This script runs a comprehensive inspection of the codebase to identify SQL injection vulnerabilities

echo "┌──────────────────────────────────────────────────────┐"
echo "│        SQL INJECTION VULNERABILITY INSPECTOR         │"
echo "└──────────────────────────────────────────────────────┘"

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Process command line arguments
JSON_OUTPUT=""
OUTPUT_FILE=""
DIRECTORIES=()

for arg in "$@"
do
    if [ "$arg" == "--json" ] || [ "$arg" == "-j" ]; then
        JSON_OUTPUT="--json"
        echo "Output format: JSON"
    elif [[ "$arg" == --output=* ]] || [[ "$arg" == -o=* ]]; then
        OUTPUT_FILE="$arg"
        echo "Output file: ${arg#*=}"
    elif [ "${arg:0:1}" != "-" ]; then
        DIRECTORIES+=("$arg")
    fi
done

# If no directories specified, use defaults
if [ ${#DIRECTORIES[@]} -eq 0 ]; then
    DIRECTORIES=("server" "client" "shared")
fi

echo "Directories to scan: ${DIRECTORIES[*]}"

# Run the SQL injection vulnerability inspector
echo "Running SQL injection vulnerability inspection..."
npx tsx server/tools/inspectSqlVulnerabilities.ts ${DIRECTORIES[@]} $JSON_OUTPUT $OUTPUT_FILE

# Check if the inspection was successful
if [ $? -eq 0 ]; then
    echo "✅ SQL injection vulnerability inspection completed successfully"
else
    echo "❌ SQL injection vulnerability inspection failed. Check the logs for details."
    exit 1
fi

echo ""
echo "SQL Injection Vulnerability Inspector Results:"
echo "--------------------------------------------"
echo "Check the reports directory for detailed scan results."
echo ""
echo "To fix SQL injection vulnerabilities:"
echo "  1. Use the secure database API: import { secureDatabase } from './security/preventSqlInjection';"
echo "  2. Replace string concatenation and template literals with parameterized queries"
echo "  3. Run the automatic fixer: ./server/tools/runSQLSecurityScan.sh --fix"
echo ""
echo "For more information, see: server/security/docs/SQLInjectionPreventionGuide.md"