#!/bin/bash

# API Validation Test Runner
# This script starts the simplified validation server and opens the test HTML page

# Determine the correct command based on environment
if [ -n "$REPLIT_DB_URL" ]; then
  # If running on Replit, use a different approach to open URLs
  OPEN_CMD="echo"
  OPEN_MESSAGE="Access the test page at: "
else
  # Determine the right 'open' command based on OS
  case "$(uname -s)" in
    Darwin*)  OPEN_CMD="open" ;;  # macOS
    Linux*)   
      if command -v xdg-open &> /dev/null; then
        OPEN_CMD="xdg-open"  # Linux with X
      else
        OPEN_CMD="echo"
        OPEN_MESSAGE="Access the test page at: "
      fi
      ;;
    CYGWIN*|MINGW*|MSYS*)  OPEN_CMD="start" ;;  # Windows
    *)        
      OPEN_CMD="echo"
      OPEN_MESSAGE="Access the test page at: "
      ;;
  esac
fi

# Check if simplified-validation-server is running
PORT=8080
lsof -i:$PORT > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Starting simplified validation server on port $PORT..."
  node simplified-validation-server.cjs &
  SERVER_PID=$!
  echo "Server started with PID $SERVER_PID"
  
  # Wait for server to start
  echo "Waiting for server to start..."
  sleep 2
else
  echo "Server already running on port $PORT"
fi

# Copy the HTML file to a publicly accessible location if needed
if [ -n "$REPLIT_DB_URL" ]; then
  cp api-validation-test.html public/api-validation-test.html 2>/dev/null || true
fi

# Open the HTML test page
echo "Opening API Validation Test page..."
if [ "$OPEN_CMD" = "echo" ]; then
  $OPEN_CMD "${OPEN_MESSAGE}file://$(pwd)/api-validation-test.html"
  if [ -n "$REPLIT_DB_URL" ]; then
    echo "On Replit, access the test page at the web URL + /api-validation-test.html"
  fi
else
  $OPEN_CMD "file://$(pwd)/api-validation-test.html"
fi

echo ""
echo "The validation server is running on port $PORT"
echo "The test page is now open in your browser"
echo ""
echo "Use Ctrl+C to stop the server when you're done testing"

# Keep the script running
if [ "$OPEN_CMD" = "echo" ]; then
  # If we couldn't open the browser automatically, wait for user to press Ctrl+C
  trap "echo 'Stopping server...'; kill $SERVER_PID 2>/dev/null" INT
  wait $SERVER_PID
else
  # If we opened the browser, wait a bit and then exit
  sleep 5
  exit 0
fi