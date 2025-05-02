#!/bin/bash

# This script runs the enhanced security database setup

# Set current directory to script directory
cd "$(dirname "$0")"

# Display banner
echo "======================================================"
echo "  Setting up Enhanced Security Database Schema"
echo "======================================================"
echo ""

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "🔴 ERROR: DATABASE_URL environment variable is not set"
  echo "Please ensure the DATABASE_URL environment variable is set before running this script."
  exit 1
fi

# Run the setup script
echo "🔵 Running enhanced security schema setup script..."
node setup-enhanced-security-schema.js

# Check if successful
if [ $? -eq 0 ]; then
  echo "✅ Enhanced security schema setup completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Restart your application to initialize the security system"
  echo "2. View the schema validation report with: node validate-security-schema.js"
  echo "3. Run the database maintenance script periodically: node security-db-maintenance.js"
else
  echo "🔴 Enhanced security schema setup failed"
  echo "Please check the error messages above for more information."
  exit 1
fi

# Validate the schema
echo ""
echo "🔵 Validating security schema..."
node validate-security-schema.js

# Check if successful
if [ $? -eq 0 ]; then
  echo "✅ Security schema validation completed!"
else
  echo "⚠️ Security schema validation reported issues"
  echo "Please review the validation report for recommended actions."
fi

echo ""
echo "======================================================"
echo "  Setup Complete"
echo "======================================================"