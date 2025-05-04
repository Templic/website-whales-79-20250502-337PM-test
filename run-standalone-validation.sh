#!/bin/bash

# This script runs the standalone validation server
# and opens it in a browser tab if possible

echo "Starting standalone validation server..."

# Kill any process running on port 3333
kill $(lsof -t -i:3333) 2>/dev/null || echo "No process running on port 3333"

# Export environment variables
export PORT=3333
export NODE_ENV=development

# Start the server
node run-standalone-server.mjs &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "Standalone server running on port 3333 with PID $SERVER_PID"
  
  # Show URL to access
  echo "Access the API validation test at: http://localhost:3333"
  echo "If you're using Replit, look for a new browser tab or access through the Web tab"
  
  # Try to open in browser if possible
  if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3333
  elif command -v open &> /dev/null; then
    open http://localhost:3333
  else
    echo "Could not open browser automatically. Please open http://localhost:3333 in your browser."
  fi
else
  echo "Failed to start standalone server."
fi

# Show how to stop the server
echo ""
echo "To stop the server: kill $SERVER_PID"