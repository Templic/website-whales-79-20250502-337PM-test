#!/bin/bash

# TypeScript Error Management System
# This script is a wrapper for the TypeScript Intelligent Fixer

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
PROJECT_ROOT="."
TSCONFIG_PATH="./tsconfig.json"

# Function to display help message
show_help() {
  echo -e "${BLUE}TypeScript Error Management System${NC}"
  echo ""
  echo "Usage: ./analyze-ts-errors.sh [command] [options]"
  echo ""
  echo "Commands:"
  echo "  analyze         Analyze TypeScript errors without fixing them"
  echo "  fix             Fix TypeScript errors automatically"
  echo "  patterns        Find common error patterns in TypeScript code"
  echo "  verify          Verify that TypeScript errors were fixed correctly"
  echo "  stats           Show statistics about TypeScript errors and fixes"
  echo "  fix-file        Fix TypeScript errors in a specific file"
  echo ""
  echo "Options:"
  echo "  -h, --help      Display this help message"
  echo "  --deep          Perform deep analysis with dependency tracking"
  echo "  --ai            Use OpenAI to enhance analysis/fixes (requires OPENAI_API_KEY)"
  echo "  -v, --verbose   Enable verbose output"
  echo "  -p, --project   Path to tsconfig.json (default: ./tsconfig.json)"
  echo "  -r, --root      Project root directory (default: .)"
  echo ""
  echo "Examples:"
  echo "  ./analyze-ts-errors.sh analyze --deep"
  echo "  ./analyze-ts-errors.sh fix --ai"
  echo "  ./analyze-ts-errors.sh patterns"
  echo "  ./analyze-ts-errors.sh fix-file ./src/components/Button.tsx"
  echo ""
  echo "For more options and details, see the documentation:"
  echo "  ./analyze-ts-errors.sh [command] --help"
}

# Function to check if npx is available
check_npx() {
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed or not in your PATH.${NC}"
    echo "Please make sure Node.js and npm are properly installed."
    exit 1
  fi
}

# Process arguments
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

COMMAND=$1
shift

case $COMMAND in
  analyze|fix|patterns|verify|stats|fix-file)
    # Valid command, continue processing
    ;;
  -h|--help)
    show_help
    exit 0
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
    show_help
    exit 1
    ;;
esac

# Parse remaining options
EXTRA_ARGS=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--project)
      TSCONFIG_PATH="$2"
      shift 2
      ;;
    -r|--root)
      PROJECT_ROOT="$2"
      shift 2
      ;;
    -h|--help)
      # Pass --help directly to the fixer
      EXTRA_ARGS="$EXTRA_ARGS --help"
      shift
      ;;
    --deep)
      if [ "$COMMAND" == "analyze" ]; then
        EXTRA_ARGS="$EXTRA_ARGS --deep"
      elif [ "$COMMAND" == "fix" ]; then
        EXTRA_ARGS="$EXTRA_ARGS --deep-fix"
      else
        echo -e "${YELLOW}Warning: --deep option is only applicable to analyze and fix commands${NC}"
      fi
      shift
      ;;
    --ai)
      EXTRA_ARGS="$EXTRA_ARGS --ai"
      
      # Check if OPENAI_API_KEY is set
      if [ -z "$OPENAI_API_KEY" ]; then
        echo -e "${YELLOW}Warning: OPENAI_API_KEY environment variable is not set.${NC}"
        echo "The --ai option requires an OpenAI API key."
        echo "You can set it with: export OPENAI_API_KEY=your-api-key"
      fi
      shift
      ;;
    -v|--verbose)
      EXTRA_ARGS="$EXTRA_ARGS --verbose"
      shift
      ;;
    *)
      # Pass any other arguments directly to the fixer
      EXTRA_ARGS="$EXTRA_ARGS $1"
      shift
      ;;
  esac
done

# Run the fixer
echo -e "${CYAN}Running TypeScript Intelligent Fixer...${NC}"
echo -e "${CYAN}Command: $COMMAND${NC}"
echo -e "${CYAN}Project: $TSCONFIG_PATH${NC}"
echo -e "${CYAN}Root: $PROJECT_ROOT${NC}"
echo ""

# Check for npx
check_npx

# Run the appropriate command
npx ts-node ts-intelligent-fixer.ts $COMMAND --project "$TSCONFIG_PATH" --root "$PROJECT_ROOT" $EXTRA_ARGS

# Check the exit status
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Command completed successfully.${NC}"
else
  echo -e "${RED}Command failed with exit code $EXIT_CODE.${NC}"
  exit $EXIT_CODE
fi