#!/bin/bash

# This script runs the setup for security database tables and caching system

# Set current directory to script directory
cd "$(dirname "$0")"

# Display banner
echo "======================================================"
echo "  Setting up Security Database Tables and Caching"
echo "======================================================"
echo ""

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "🔴 ERROR: DATABASE_URL environment variable is not set"
  echo "Please ensure the DATABASE_URL environment variable is set before running this script."
  exit 1
fi

# Run the setup script
echo "🔵 Running security database setup script..."
node setup-security-database.js

# Check if successful
if [ $? -eq 0 ]; then
  echo "✅ Security database setup completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Restart your application to initialize the security caching system"
  echo "2. View the security optimization documentation at docs/security-optimizations.md"
  echo "3. Check rule caching documentation at docs/rule-caching-system.md"
else
  echo "🔴 Security database setup failed"
  echo "Please check the error messages above for more information."
  exit 1
fi

echo ""
echo "======================================================"
echo "  Setup Complete"
echo "======================================================"