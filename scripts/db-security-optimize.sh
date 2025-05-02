#!/bin/bash

# Script to run security database optimizations
# This wrapper is meant to be used as an npm script

# Print message with timestamp
function log {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL environment variable is not set"
  log "Make sure you have a database configured before running this script"
  exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Log file
LOG_FILE="logs/security-db-optimization-$(date '+%Y-%m-%d-%H-%M-%S').log"
log "Starting security database optimization. Logs will be saved to $LOG_FILE"

# Run the main script
log "Running optimization script..."
node scripts/run-all-security-db-optimizations.js 2>&1 | tee -a "$LOG_FILE"

RESULT=$?
if [ $RESULT -eq 0 ]; then
  log "Security database optimization completed successfully!"
else
  log "Security database optimization failed with exit code $RESULT. Check logs for details."
  exit $RESULT
fi