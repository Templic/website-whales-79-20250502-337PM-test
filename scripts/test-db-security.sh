#!/bin/bash
# Database Security Testing Script
# This script helps test the database security implementation

# Set the API URL
API_URL="http://localhost:5000/api/test/database-security/test-validate"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to test a query
test_query() {
  local query="$1"
  local description="$2"
  
  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo "Query: $query"
  
  # URL encode the query
  local encoded_query=$(echo "$query" | sed 's/ /%20/g; s/\*/%2A/g; s/\//%2F/g; s/;/%3B/g; s/=/%3D/g; s/\?/%3F/g; s/&/%26/g; s/\[/%5B/g; s/\]/%5D/g; s/\#/%23/g; s/\@/%40/g; s/\!/%21/g; s/"/%22/g; s/\,/%2C/g; s/\+/%2B/g; s/\:/%3A/g')
  
  # Make the request
  local response=$(curl -s "$API_URL?q=$encoded_query")
  
  # Check if the query is valid or not
  if echo "$response" | grep -q '"valid":true'; then
    echo -e "${GREEN}Result: PASSED${NC} - No security risks detected"
  else
    echo -e "${RED}Result: BLOCKED${NC} - Security risks detected:"
    # Extract and display the risks
    echo "$response" | grep -o '"description":"[^"]*"' | sed 's/"description":"//g; s/"//g' | while read -r risk; do
      echo -e "  - ${RED}$risk${NC}"
    done
  fi
}

# Display header
echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Database Security Testing Tool${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo "This script tests various SQL injection techniques against the security system."

# Test cases

# Basic query (should pass)
test_query "SELECT * FROM users" "Basic Select Query"

# Multi-statement injection (should fail)
test_query "SELECT * FROM users; DROP TABLE users;" "Multi-statement Injection"

# Union-based injection (should fail)
test_query "SELECT * FROM users UNION ALL SELECT username, password, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM users" "UNION ALL Injection"

# Information schema access (should fail)
test_query "SELECT * FROM information_schema.tables" "Information Schema Access"

# Blind SQL injection (should fail)
test_query "SELECT * FROM users WHERE username = 'admin' AND CASE WHEN (SELECT 1=1) THEN 1 ELSE 0 END = 1" "Blind SQL Injection with CASE"

# Time-based injection (should fail)
test_query "SELECT * FROM users WHERE username = 'admin' AND pg_sleep(1) IS NULL" "Time-based Injection"

# Command to run a custom query
if [ "$1" ]; then
  echo -e "\n${YELLOW}=======================================${NC}"
  echo -e "${YELLOW}  Testing Custom Query${NC}"
  echo -e "${YELLOW}=======================================${NC}"
  test_query "$1" "Custom Query"
fi

echo -e "\n${YELLOW}=======================================${NC}"
echo -e "${YELLOW}  Test Complete${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo -e "Run with a custom query: ./test-db-security.sh \"YOUR SQL QUERY\""