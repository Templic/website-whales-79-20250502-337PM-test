#!/bin/bash
# TypeScript Error Analysis and Fixing Utility

# Ensure the script stops on first error
set -e

# Function to display usage information
function show_usage {
  echo "TypeScript Error Management Utility"
  echo "=================================="
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Commands:"
  echo "  analyze         Analyze the project and find TypeScript errors"
  echo "  fix             Apply automatic fixes to TypeScript errors"
  echo "  patterns        Identify common error patterns"
  echo "  stats           Show error statistics"
  echo "  fix-file        Fix errors in a specific file"
  echo "  verify          Verify that fixes didn't introduce new errors"
  echo ""
  echo "Options:"
  echo "  --deep          Perform deep analysis with dependency tracking"
  echo "  --ai            Use AI to enhance analysis and fixes (requires OPENAI_API_KEY)"
  echo "  --all           Fix all errors (not just auto-fixable ones)"
  echo "  --severity=X    Only analyze/fix errors with severity X (critical, high, medium, low)"
  echo "  --category=X    Only analyze/fix errors in category X"
  echo "  --file=X        Only analyze/fix errors in file X"
  echo "  --limit=X       Limit to X errors (default: no limit)"
  echo "  --dry-run       Don't apply fixes, just show what would be done"
  echo ""
  echo "Examples:"
  echo "  $0 analyze                   # Basic analysis"
  echo "  $0 analyze --deep            # Deep analysis with dependency tracking"
  echo "  $0 fix --all                 # Fix all errors"
  echo "  $0 fix --severity=critical   # Fix only critical errors"
  echo "  $0 fix-file path/to/file.ts  # Fix errors in a specific file"
  echo ""
}

# Check if we have enough arguments
if [ $# -lt 1 ]; then
  show_usage
  exit 1
fi

# Set up environment
NODE_EXEC="npx tsx"
SCRIPT_PATH="ts-intelligent-fixer.ts"

# Check if TypeScript and tsx are available
if ! command -v npx &> /dev/null; then
  echo "Error: npx is not installed. Please install Node.js and npm."
  exit 1
fi

if ! npx tsx --version &> /dev/null; then
  echo "Installing tsx..."
  npm install -D tsx
fi

# Main command
COMMAND=$1
shift

# Process options
OPTIONS=""

for arg in "$@"; do
  case $arg in
    --deep)
      OPTIONS="$OPTIONS --deep"
      shift
      ;;
    --ai)
      OPTIONS="$OPTIONS --ai"
      shift
      ;;
    --all)
      OPTIONS="$OPTIONS --all"
      shift
      ;;
    --dry-run)
      OPTIONS="$OPTIONS --dry-run"
      shift
      ;;
    --severity=*)
      SEVERITY="${arg#*=}"
      OPTIONS="$OPTIONS --severity $SEVERITY"
      shift
      ;;
    --category=*)
      CATEGORY="${arg#*=}"
      OPTIONS="$OPTIONS --category $CATEGORY"
      shift
      ;;
    --file=*)
      FILE="${arg#*=}"
      OPTIONS="$OPTIONS --file $FILE"
      shift
      ;;
    --limit=*)
      LIMIT="${arg#*=}"
      OPTIONS="$OPTIONS --limit $LIMIT"
      shift
      ;;
    *)
      # Unknown option - assume it's a file path
      TARGET_FILE="$arg"
      shift
      ;;
  esac
done

# Execute the appropriate command
case $COMMAND in
  analyze)
    echo "Analyzing TypeScript project..."
    $NODE_EXEC $SCRIPT_PATH analyze $OPTIONS
    ;;
  fix)
    echo "Fixing TypeScript errors..."
    $NODE_EXEC $SCRIPT_PATH fix $OPTIONS
    ;;
  patterns)
    echo "Identifying error patterns..."
    $NODE_EXEC $SCRIPT_PATH analyze $OPTIONS
    # Future enhancement: Add a dedicated patterns command
    ;;
  stats)
    echo "Generating error statistics..."
    $NODE_EXEC $SCRIPT_PATH analyze $OPTIONS
    # Future enhancement: Add a dedicated stats command
    ;;
  fix-file)
    if [ -z "$TARGET_FILE" ]; then
      echo "Error: No file specified for fix-file command."
      show_usage
      exit 1
    fi
    echo "Fixing errors in $TARGET_FILE..."
    $NODE_EXEC $SCRIPT_PATH fix --file "$TARGET_FILE" $OPTIONS
    ;;
  verify)
    echo "Verifying fixes..."
    $NODE_EXEC $SCRIPT_PATH analyze $OPTIONS
    # Future enhancement: Add a dedicated verify command
    ;;
  help)
    show_usage
    ;;
  *)
    echo "Error: Unknown command '$COMMAND'"
    show_usage
    exit 1
    ;;
esac

echo "Done!"