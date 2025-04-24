#!/bin/bash

# XSS Vulnerability Detection Script
# This script runs a comprehensive scan to identify XSS vulnerabilities in the codebase

echo "┌──────────────────────────────────────────────────────┐"
echo "│            XSS VULNERABILITY DETECTION                │"
echo "└──────────────────────────────────────────────────────┘"

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Process command line arguments
JSON_OUTPUT=""
OUTPUT_FILE=""
DIRECTORIES=""

for arg in "$@"
do
  if [ "$arg" == "--json" ]; then
    JSON_OUTPUT="--json"
    echo "Output format: JSON"
  elif [[ "$arg" == --output=* ]]; then
    OUTPUT_FILE="$arg"
    echo "Output file: ${arg#*=}"
  elif [ "${arg:0:1}" != "-" ]; then
    DIRECTORIES="$DIRECTORIES $arg"
  fi
done

# Run the XSS vulnerability detector
echo "Running XSS vulnerability detection..."
npx tsx server/tools/detectXssVulnerabilities.ts $DIRECTORIES $JSON_OUTPUT $OUTPUT_FILE

# Check if the detection was successful
if [ $? -eq 0 ]; then
    echo "✅ XSS vulnerability detection completed successfully"
else
    echo "❌ XSS vulnerability detection failed. Check the logs for details."
    exit 1
fi

echo ""
echo "XSS Vulnerability Detection Results:"
echo "-----------------------------------"
echo "Check the reports directory for detailed scan results."
echo ""
echo "To fix XSS vulnerabilities:"
echo "  1. Use DOMPurify to sanitize HTML before insertion: import DOMPurify from 'dompurify';"
echo "  2. Replace innerHTML with textContent when not rendering HTML"
echo "  3. Use secure frameworks that escape content by default (like React)"
echo "  4. Implement Content-Security-Policy headers"
echo "  5. Validate and sanitize all user inputs"