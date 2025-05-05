#!/bin/bash

# TypeScript Errors API Test Script - Using Curl
# 
# This script tests the TypeScript Errors API endpoints using curl.

# Base URL - using the special "localhost" in Replit
BASE_URL="http://localhost:3000"

# Test endpoints
TEST_ENDPOINT="${BASE_URL}/api/admin/typescript-errors/test"
SCANS_ENDPOINT="${BASE_URL}/api/admin/typescript-errors/scans"

echo "Testing TypeScript Errors API..."

# Test the test endpoint
echo -e "\n1. Testing the /test endpoint:"
curl -s "${TEST_ENDPOINT}" | jq .

# Test the scans GET endpoint
echo -e "\n2. Testing the GET /scans endpoint:"
curl -s "${SCANS_ENDPOINT}" | jq .

# Test the scans POST endpoint
echo -e "\n3. Testing the POST /scans endpoint:"
curl -s -X POST "${SCANS_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{"aiEnabled":true}' | jq .

echo -e "\nAll tests complete!"