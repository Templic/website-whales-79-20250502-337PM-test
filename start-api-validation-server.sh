#!/bin/bash

# Kill any processes running on port 4000
kill $(lsof -t -i:4000) 2>/dev/null || echo "No process running on port 4000"

# Set environment variables
export NODE_ENV=development
export API_VALIDATION_TEST_MODE=true
export API_VALIDATION_BYPASS_SECURITY=true
export ENABLE_DIRECT_VALIDATION=true
export CSRF_PROTECTION=false

# Start the dedicated API validation server on port 4000
echo "Starting API validation server on port 4000..."
node server/simple-validation-server.cjs &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "API validation server running on port 4000 with PID $SERVER_PID"
  echo "Access the API validation test page at: api-validation-test.html"
  
  # Open the API validation test page
  echo "Opening API validation test page..."
  if command -v xdg-open &> /dev/null; then
    xdg-open api-validation-test.html
  elif command -v open &> /dev/null; then
    open api-validation-test.html
  else
    echo "Could not open the test page automatically. Please open api-validation-test.html manually."
  fi
else
  echo "Failed to start API validation server."
fi

# Display instructions for manual testing
echo ""
echo "=== API Validation Test Instructions ==="
echo "1. You can access the API validation test UI at: api-validation-test.html"
echo "2. API endpoints are available at: http://localhost:4000/api/validate/*"
echo "3. To stop the API validation server: kill $SERVER_PID"
echo "========================================="