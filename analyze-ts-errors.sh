#!/bin/bash

# TypeScript Error Management Shell Script
# This script provides a convenient way to use the TypeScript error management system

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Define functions
print_header() {
  echo -e "\n${BOLD}${BLUE}======== $1 ========${NC}\n"
}

print_usage() {
  print_header "TypeScript Error Management System"
  
  echo -e "${BOLD}USAGE:${NC}"
  echo -e "  ./analyze-ts-errors.sh <command> [options]"
  echo ""
  
  echo -e "${BOLD}COMMANDS:${NC}"
  echo -e "  ${GREEN}analyze${NC}             Analyze the project for TypeScript errors"
  echo -e "  ${GREEN}patterns${NC}            Find common error patterns"
  echo -e "  ${GREEN}stats${NC}               Show error statistics"
  echo -e "  ${GREEN}fix${NC}                 Fix errors (if possible)"
  echo -e "  ${GREEN}fix-file <filepath>${NC} Fix errors in a specific file"
  echo -e "  ${GREEN}verify${NC}              Verify that fixes were successful"
  echo -e "  ${GREEN}help${NC}                Show this help message"
  echo ""
  
  echo -e "${BOLD}OPTIONS:${NC}"
  echo -e "  ${YELLOW}-o, --output <file>${NC}    Output results to a file"
  echo -e "  ${YELLOW}-d, --deep${NC}             Perform deep analysis"
  echo -e "  ${YELLOW}--trace${NC}                Enable symbol tracing (deep scan only)"
  echo -e "  ${YELLOW}--ai${NC}                   Use AI to assist in analysis/fixing"
  echo -e "  ${YELLOW}-i, --input <file>${NC}     Use existing analysis results"
  echo -e "  ${YELLOW}--auto${NC}                 Fix without confirmation"
  echo -e "  ${YELLOW}--dryRun${NC}               Show fixes without applying"
  echo ""
  
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo -e "  ${BLUE}./analyze-ts-errors.sh analyze${NC}"
  echo -e "  ${BLUE}./analyze-ts-errors.sh analyze --deep --ai${NC}"
  echo -e "  ${BLUE}./analyze-ts-errors.sh patterns -i analysis-results.json${NC}"
  echo -e "  ${BLUE}./analyze-ts-errors.sh fix --auto${NC}"
  echo -e "  ${BLUE}./analyze-ts-errors.sh fix-file src/components/Button.tsx${NC}"
}

# Check for prerequisites
check_prerequisites() {
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo -e "Please install Node.js to use this script"
    exit 1
  fi
  
  # Check if tsx is installed
  if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}Warning: tsx is not installed${NC}"
    echo -e "Installing tsx globally..."
    npm install -g tsx
  fi
  
  # Check if the CLI script exists
  if [ ! -f "./scripts/ts-analyzer-cli.ts" ]; then
    echo -e "${RED}Error: CLI script not found${NC}"
    echo -e "The script should be located at ./scripts/ts-analyzer-cli.ts"
    exit 1
  }
}

# Process the command
if [ $# -lt 1 ]; then
  print_usage
  exit 1
fi

# Check prerequisites
check_prerequisites

# Get the command
COMMAND=$1
shift # Remove the command from the arguments

# Route to appropriate CLI command
case $COMMAND in
  analyze|patterns|stats|fix|verify)
    echo -e "${CYAN}Running: $COMMAND${NC}"
    tsx ./scripts/ts-analyzer-cli.ts $COMMAND "$@"
    ;;
  fix-file)
    if [ $# -lt 1 ]; then
      echo -e "${RED}Error: Missing file path${NC}"
      echo -e "Usage: ./analyze-ts-errors.sh fix-file <filepath> [options]"
      exit 1
    fi
    echo -e "${CYAN}Running: fix-file $1${NC}"
    tsx ./scripts/ts-analyzer-cli.ts fix-file "$@"
    ;;
  help|--help|-h)
    print_usage
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
    print_usage
    exit 1
    ;;
esac