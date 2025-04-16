#!/bin/bash

# API Security Tests Runner
# This script runs the API security tests to verify that security measures are working correctly.

# Set the API base URL (default to localhost:3000 if not provided)
API_BASE_URL=${1:-"http://localhost:3000"}

# Print banner
echo "==============================================="
echo "API Security Test Runner"
echo "Base URL: $API_BASE_URL"
echo "==============================================="

# Export the API base URL for the test script
export API_BASE_URL

# Run the test script with Node.js
echo "Running API security tests..."
node scripts/test-api-security.js

# Check the exit code
if [ $? -eq 0 ]; then
  echo "All tests passed successfully!"
  exit 0
else
  echo "Some tests failed. Review the test output for details."
  exit 1
fi