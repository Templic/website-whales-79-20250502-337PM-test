#!/bin/bash

# Run Link Checker UI
# This script starts the standalone link checker UI on port 3500
# or a custom port specified as the first argument

# Get port from first argument or use 3500 as default
PORT=${1:-3500}

# Print banner
echo "====================================================="
echo "   Dead Link Checker UI"
echo "====================================================="
echo "Starting server on port $PORT"
echo

# Run the standalone server
node link-checker-server.js $PORT