#!/bin/bash
# TypeScript Error Analyzer and Fixer Script
# A simple shell script wrapper for ts-intelligent-fixer.ts

# Ensure this script is executable (run chmod +x analyze-ts-errors.sh once)

# Check if ts-node is installed
if ! command -v ts-node &> /dev/null; then
  echo "Error: ts-node is not installed. Please install it with 'npm install -g ts-node'."
  exit 1
fi

# Check if typescript is installed
if ! command -v tsc &> /dev/null; then
  echo "Error: TypeScript is not installed. Please install it with 'npm install -g typescript'."
  exit 1
fi

# Function to show usage
show_usage() {
  echo "TypeScript Error Analyzer and Fixer"
  echo ""
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  analyze     Analyze TypeScript errors without fixing them"
  echo "  fix         Automatically fix TypeScript errors"
  echo "  patterns    Find common error patterns in TypeScript code"
  echo "  verify      Verify that TypeScript errors were fixed correctly"
  echo "  stats       Show statistics about TypeScript errors and fixes"
  echo "  fix-file    Fix TypeScript errors in a specific file"
  echo ""
  echo "For command-specific options, run: $0 [command] --help"
  echo ""
  echo "Examples:"
  echo "  $0 analyze                            # Analyze all TypeScript errors"
  echo "  $0 analyze --deep                     # Perform deep analysis with dependency tracking"
  echo "  $0 fix                                # Fix all TypeScript errors"
  echo "  $0 fix --dry-run                      # Show what would be fixed without making changes"
  echo "  $0 fix-file src/component.tsx         # Fix errors in a specific file"
  echo "  $0 patterns                           # Find common error patterns"
  echo "  $0 verify                             # Verify fixes"
  echo ""
}

# Check if a command was provided
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

# Get the command
COMMAND="$1"
shift

# Validate the command
case "$COMMAND" in
  analyze|fix|patterns|verify|stats|fix-file)
    # Valid command, proceed
    ;;
  --help|-h|help)
    show_usage
    exit 0
    ;;
  *)
    echo "Error: Unknown command '$COMMAND'"
    show_usage
    exit 1
    ;;
esac

# Generate temporary log file name
LOG_FILE="/tmp/ts-error-analyzer-$$.log"

# Run the command
echo "Running TypeScript Error $COMMAND..."
ts-node ts-intelligent-fixer.ts "$COMMAND" "$@" 2> "$LOG_FILE"

# Check for errors
if [ $? -ne 0 ]; then
  echo "Error: Command failed"
  echo "Error log:"
  cat "$LOG_FILE"
  rm "$LOG_FILE"
  exit 1
fi

# Clean up
rm "$LOG_FILE"

exit 0