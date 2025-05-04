#!/bin/bash

# This script runs the simplified validation server 
# which should work in any environment, including Replit

echo "Starting simplified validation server..."

# Kill any process running on port 8080
kill $(lsof -t -i:8080) 2>/dev/null || echo "No process running on port 8080"

# Export environment variables
export PORT=8080
export NODE_ENV=development

# Start the server
node simplified-validation-server.cjs &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "Simplified validation server running on port 8080 with PID $SERVER_PID"
  
  # Show URL to access
  echo "Access the API validation test at: http://localhost:8080"
  echo "If you're using Replit, look for a new browser tab or access through the Web tab"
  
  # Try to open in browser if possible
  if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
  elif command -v open &> /dev/null; then
    open http://localhost:8080
  else
    echo "Could not open browser automatically. Please open http://localhost:8080 in your browser."
  fi
else
  echo "Failed to start simplified validation server."
fi

# Show how to stop the server
echo ""
echo "To stop the server: kill $SERVER_PID"