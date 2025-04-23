#!/bin/bash

# Deep Security Scan Script
# Runs the most comprehensive security scan available in the system

echo "┌──────────────────────────────────────────────────────┐"
echo "│             MAXIMUM SECURITY DEEP SCAN               │"
echo "└──────────────────────────────────────────────────────┘"

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Run the deep scan TypeScript script using tsx
npx tsx server/tools/runDeepScan.ts

# Check if the scan was successful
if [ $? -eq 0 ]; then
    echo "✅ Deep security scan completed successfully"
else
    echo "❌ Deep security scan failed. Check the logs for details."
    exit 1
fi