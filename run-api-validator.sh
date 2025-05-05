#!/bin/bash

# Run API Validator
# This script starts the standalone API validator on port 3000
# or a custom port specified as the first argument

# Get port from first argument or use 3000 as default
PORT=${1:-3000}

# Print banner
echo "====================================================="
echo "   Standalone API Validation Server"
echo "====================================================="
echo "Starting server on port $PORT"
echo

# Run the standalone server with ES modules
node standalone-api-validator.js $PORT