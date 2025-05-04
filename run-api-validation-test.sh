#!/bin/bash

# This script starts the validation test server and opens the validation test page

# Start the validation server in the background
echo "Starting validation server on port 4000..."
node server/simple-index.js &
VALIDATION_SERVER_PID=$!

# Give the server time to start
sleep 2

echo "Opening validation test page..."
echo "Visit http://localhost:5000/validation-test.html to see the test page"
echo "Press Ctrl+C to stop the servers"

# Keep the script running until user presses Ctrl+C
wait $VALIDATION_SERVER_PID