#!/bin/bash

# Test script for the API validation server

# Configuration
API_URL="http://localhost:4000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Helper function to make a GET request
make_get_request() {
  echo -e "${YELLOW}GET $1${NC}"
  curl -s "$API_URL$1" | jq .
  echo
}

# Helper function to make a POST request
make_post_request() {
  echo -e "${YELLOW}POST $1${NC}"
  echo -e "Request Body: $2\n"
  curl -s -X POST "$API_URL$1" \
    -H "Content-Type: application/json" \
    -d "$2" | jq .
  echo
}

# Check if API server is running
if ! curl -s "$API_URL/api/health" > /dev/null; then
  echo -e "${RED}Error: API validation server is not running on $API_URL${NC}"
  echo -e "Please start the server with: ./start-api-validation-server.sh"
  exit 1
fi

# Test health endpoint
print_header "Health Check"
make_get_request "/api/health"

# Test basic validation (valid input)
print_header "Basic Validation (Valid Input)"
make_post_request "/api/validate/basic" '{"name":"John Doe","email":"john@example.com","age":30}'

# Test basic validation (invalid input)
print_header "Basic Validation (Invalid Input)"
make_post_request "/api/validate/basic" '{"name":"J","email":"not-an-email","age":-5}'

# Test security validation (safe input)
print_header "Security Validation (Safe Input)"
make_post_request "/api/validate/security" '{"query":"normal user input"}'

# Test security validation (malicious input)
print_header "Security Validation (SQL Injection Attempt)"
make_post_request "/api/validate/security" '{"query":"'' OR 1=1; DROP TABLE users; --"}'

# Test security validation (XSS attempt)
print_header "Security Validation (XSS Attempt)"
make_post_request "/api/validate/security" '{"query":"<script>alert(\"XSS\")</script>"}'

echo -e "\n${GREEN}All tests completed!${NC}"