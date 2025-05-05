#!/bin/bash

# Run Validation Tools
# This script starts both validation tools on different ports

# Print banner
echo "====================================================="
echo "   API Validation & Link Checker Tools"
echo "====================================================="

# Define ports
API_PORT=${1:-3000}
LINK_PORT=${2:-3500}

# Kill any existing instances
echo "Stopping any existing validation tools..."
pkill -f "standalone-api-validator.js" 2>/dev/null
pkill -f "link-checker-server.js" 2>/dev/null
sleep 1

# Start API validator in background
echo "Starting API Validator on port $API_PORT..."
./run-api-validator.sh $API_PORT &
API_PID=$!
sleep 2

# Start Link Checker in background
echo "Starting Link Checker on port $LINK_PORT..."
node link-checker-server.js $LINK_PORT &
LINK_PID=$!
sleep 2

echo
echo "Both tools are now running:"
echo "- API Validator: http://localhost:$API_PORT"
echo "- Link Checker: http://localhost:$LINK_PORT"
echo
echo "Press Ctrl+C to stop both tools"
echo

# Wait for user to press Ctrl+C
trap "echo 'Stopping validation tools...'; kill $API_PID $LINK_PID 2>/dev/null; exit 0" INT TERM
wait