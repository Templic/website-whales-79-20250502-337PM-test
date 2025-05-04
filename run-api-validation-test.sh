#!/bin/bash

# Run API Validation Test Tool
# This script restarts the server and then runs the API validation test tool

# Print section header
print_header() {
  echo ""
  echo "====================================="
  echo "$1"
  echo "====================================="
  echo ""
}

# Restart the server
print_header "Restarting server"
echo "Restarting the server to apply route changes..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
print_header "Waiting for server"
echo "Waiting 5 seconds for server to initialize..."
sleep 5

# Run the API validation test tool
print_header "Running API validation test tool"
node test-api-validation-cli.js

# Done
print_header "Test complete"
echo "API validation test complete. Check the results above."
echo ""

exit 0