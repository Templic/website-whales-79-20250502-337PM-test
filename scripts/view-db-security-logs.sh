#!/bin/bash
# Database Security Log Viewer
# Simple utility to view and analyze database security logs

# Set the log file path
LOG_FILE="logs/security/database-security.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if the log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo -e "${RED}Error: Log file not found at $LOG_FILE${NC}"
  echo "Please make sure the application has been started and generated logs."
  exit 1
fi

# Function to display help
show_help() {
  echo -e "${YELLOW}Database Security Log Viewer${NC}"
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Options:"
  echo "  -n, --lines NUMBER     Show the last NUMBER of log entries (default: 10)"
  echo "  -f, --filter KEYWORD   Filter logs containing KEYWORD"
  echo "  -r, --risk             Show only entries with security risks"
  echo "  -b, --blocked          Show only blocked queries"
  echo "  -a, --all              Show all log entries"
  echo "  -h, --help             Show this help message"
  echo
  echo "Examples:"
  echo "  $0 -n 20               Show the last 20 log entries"
  echo "  $0 -f 'UNION'          Show logs containing 'UNION'"
  echo "  $0 -r                  Show only entries with security risks"
  echo "  $0 -a                  Show all log entries"
}

# Default values
LINES=10
FILTER=""
SHOW_ALL=0
RISK_ONLY=0
BLOCKED_ONLY=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--lines)
      LINES="$2"
      shift
      shift
      ;;
    -f|--filter)
      FILTER="$2"
      shift
      shift
      ;;
    -r|--risk)
      RISK_ONLY=1
      shift
      ;;
    -b|--blocked)
      BLOCKED_ONLY=1
      shift
      ;;
    -a|--all)
      SHOW_ALL=1
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Function to format and display log entries
display_logs() {
  local count=0
  local total_entries=0
  
  # Read log file line by line
  while IFS= read -r line; do
    total_entries=$((total_entries + 1))
    
    # Check if we should filter
    if [ -n "$FILTER" ] && ! echo "$line" | grep -q "$FILTER"; then
      continue
    fi
    
    # Check if we should only show entries with risks
    if [ "$RISK_ONLY" -eq 1 ] && ! echo "$line" | grep -q '"risks":\[.*\]'; then
      continue
    fi
    
    # Check if we should only show blocked queries
    if [ "$BLOCKED_ONLY" -eq 1 ] && ! echo "$line" | grep -q '"action":"Blocked'; then
      continue
    fi
    
    # Extract timestamp, action, and details
    local timestamp=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | sed 's/"timestamp":"//; s/"$//')
    local action=$(echo "$line" | grep -o '"action":"[^"]*"' | sed 's/"action":"//; s/"$//')
    
    # Format the output
    echo -e "${YELLOW}[${timestamp}]${NC} ${BLUE}${action}${NC}"
    
    # Check if this log entry contains query validation
    if echo "$line" | grep -q '"query":'; then
      local query=$(echo "$line" | grep -o '"query":"[^"]*"' | sed 's/"query":"//; s/"$//')
      echo -e "  Query: ${query}"
      
      # Check if there are risks
      if echo "$line" | grep -q '"risks":\[.*\]'; then
        echo -e "  ${RED}Risks:${NC}"
        echo "$line" | grep -o '"description":"[^"]*"' | sed 's/"description":"//; s/"//g' | while read -r risk; do
          echo -e "    - ${RED}$risk${NC}"
        done
      else
        echo -e "  ${GREEN}No risks detected${NC}"
      fi
    fi
    
    echo "----------------------------------------"
    
    count=$((count + 1))
    # Check if we've reached the requested number of lines
    if [ "$SHOW_ALL" -ne 1 ] && [ "$count" -ge "$LINES" ]; then
      break
    fi
  done < <(tac "$LOG_FILE")
  
  echo -e "${YELLOW}Displayed ${count} of ${total_entries} log entries.${NC}"
  echo -e "Use ${GREEN}--all${NC} to see all entries or ${GREEN}--lines${NC} to specify how many to show."
}

# Display header
echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Database Security Log Viewer${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo -e "Log file: ${LOG_FILE}"
echo -e "Showing: ${SHOW_ALL -eq 1 ? "All entries" : "Last $LINES entries"}"
if [ -n "$FILTER" ]; then
  echo -e "Filtering by: ${FILTER}"
fi
if [ "$RISK_ONLY" -eq 1 ]; then
  echo -e "Showing only entries with security risks"
fi
if [ "$BLOCKED_ONLY" -eq 1 ]; then
  echo -e "Showing only blocked queries"
fi
echo -e "${YELLOW}=======================================${NC}"
echo

# Display the logs
display_logs